import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useLayout } from "../lib/layout";
import type { Sentence } from "../lib/sentences";
import { colors, fonts } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Motion graphics driven by the voice: every spoken sentence starts a new "scene" —
 * a ring burst, a kinetic keyword and a sentence counter, timed to the audio.
 */
export const SentenceScenes: React.FC<{ sentences: Sentence[]; hideBeforeMs?: number }> = ({
  sentences,
  hideBeforeMs = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const layout = useLayout();
  const ms = (frame / fps) * 1000;

  const index = sentences.findIndex(
    (s, i) => ms >= s.startMs && ms < (sentences[i + 1]?.startMs ?? Infinity),
  );
  if (index < 0) return null;
  const sentence = sentences[index];
  const next = sentences[index + 1];
  const sceneEndMs = next ? next.startMs : sentence.endMs + 1000;
  const local = frame - (sentence.startMs / 1000) * fps;

  const enter = spring({ frame: local, fps, config: { damping: 14, mass: 0.8 } });
  const exit = interpolate(ms, [sceneEndMs - 220, sceneEndMs], [1, 0], clamp);
  const burst = interpolate(local, [0, fps * 0.9], [0, 1], clamp);
  const letters = sentence.keyword.toUpperCase().split("");
  const visible = ms >= hideBeforeMs;
  const fontSize = Math.min(
    layout.keyword.size,
    (layout.keyword.maxWidth / Math.max(4, letters.length)) * 1.6,
  );

  return (
    <AbsoluteFill>
      {/* Ring burst at the start of each sentence. */}
      {[0, 1].map((i) => {
        const size = 260 + burst * (layout.isWide ? 900 : 1100) + i * 140;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: width / 2 - size / 2,
              top: layout.keyword.centerY - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              border: `${3 - i}px solid ${colors.gold400}`,
              opacity: (1 - burst) * (0.5 - i * 0.2),
            }}
          />
        );
      })}

      {/* Sentence counter, e.g. 02 / 05. */}
      <div
        style={{
          position: "absolute",
          top: layout.counter.top,
          right: layout.counter.right,
          fontFamily: fonts.sans,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: 3,
          color: colors.muted,
        }}
      >
        <span style={{ color: colors.gold400 }}>{String(index + 1).padStart(2, "0")}</span> /{" "}
        {String(sentences.length).padStart(2, "0")}
      </div>

      {/* Kinetic keyword. */}
      {visible ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: layout.keyword.centerY - fontSize * 0.7,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: exit,
          }}
        >
          <div style={{ display: "flex", maxWidth: layout.keyword.maxWidth }}>
            {letters.map((l, i) => {
              const s = spring({ frame: local - i * 1.5, fps, config: { damping: 13 } });
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: fonts.display,
                    fontWeight: 700,
                    fontSize,
                    lineHeight: 1,
                    // Cormorant uses old-style figures by default ("10" looks like "IO").
                    fontVariantNumeric: "lining-nums",
                    color: colors.white,
                    display: "inline-block",
                    opacity: s,
                    transform: `translateY(${(1 - s) * 60}px) rotate(${(1 - s) * -8}deg)`,
                  }}
                >
                  {l}
                </span>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 24,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.gold400,
              width:
                enter * Math.min(layout.keyword.maxWidth * 0.5, letters.length * fontSize * 0.35),
            }}
          />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
