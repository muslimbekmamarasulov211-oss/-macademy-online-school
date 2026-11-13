import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../theme";
import type { Caption } from "../types";

type Props = {
  captions: Caption[];
  /** Distance from the bottom edge — keeps text above TikTok/Reels UI. */
  bottom?: number;
};

/**
 * Word-by-word animated subtitles. Each word pops in as it is "spoken",
 * and the current word is highlighted in gold.
 */
export const AnimatedSubtitles: React.FC<Props> = ({ captions, bottom = 380 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  const caption = captions.find((c) => ms >= c.startMs && ms < c.endMs);
  if (!caption) return null;

  const words = caption.text.split(" ");
  const span = caption.endMs - caption.startMs;
  // Words appear across the first 75% of the caption, leaving time to read.
  const perWord = (span * 0.75) / words.length;
  const startFrame = (caption.startMs / 1000) * fps;
  const exit = interpolate(ms, [caption.endMs - 200, caption.endMs], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: bottom }}
    >
      <div
        style={{
          maxWidth: 940,
          padding: "28px 40px",
          borderRadius: 32,
          backgroundColor: `${colors.ink}cc`,
          border: `1px solid ${colors.gold400}40`,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 20,
          rowGap: 8,
          opacity: exit,
        }}
      >
        {words.map((word, i) => {
          const wordStartMs = caption.startMs + i * perWord;
          const wordFrame = (wordStartMs / 1000) * fps;
          const pop = spring({
            frame: frame - wordFrame,
            fps,
            config: { damping: 12, stiffness: 180, mass: 0.6 },
          });
          const isActive = ms >= wordStartMs && ms < wordStartMs + perWord;
          return (
            <span
              key={`${startFrame}-${i}`}
              style={{
                fontFamily: fonts.sans,
                fontWeight: 800,
                fontSize: 64,
                lineHeight: 1.2,
                color: isActive ? colors.gold400 : colors.white,
                opacity: pop,
                transform: `translateY(${(1 - pop) * 30}px) scale(${0.8 + pop * 0.2})`,
                display: "inline-block",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
