import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimatedSubtitles } from "../components/AnimatedSubtitles";
import { AudioLayer } from "../components/AudioLayer";
import { Background } from "../components/Background";
import { colors, fonts } from "../theme";
import type { Caption } from "../types";

export type TestVideoProps = {
  captions: Caption[];
  voiceoverSrc: string | null;
  musicSrc: string | null;
  backgroundClipSrc: string | null;
};

export const testCaptions: Caption[] = [
  { text: "Assalomu alaykum! Bu M.ACADEMY.", startMs: 300, endMs: 3000 },
  { text: "Oʻzbek tilida professional videolar.", startMs: 3000, endMs: 6400 },
  { text: "Ovoz, subtitr va musiqa\u00A0— barchasi bir joyda.", startMs: 6400, endMs: 9800 },
];

const fadeInOut = (frame: number, duration: number) =>
  interpolate(frame, [0, 10, duration - 10, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Scene 1 (0–3s): logo reveal. */
const LogoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const letters = "M.ACADEMY".split("");
  const line = interpolate(frame, [20, 50], [0, 520], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slogan = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeInOut(frame, 90),
        paddingBottom: 300,
      }}
    >
      <div style={{ display: "flex" }}>
        {letters.map((l, i) => {
          const s = spring({ frame: frame - i * 3, fps, config: { damping: 14 } });
          return (
            <span
              key={i}
              style={{
                fontFamily: fonts.display,
                fontWeight: 700,
                fontSize: 170,
                color: l === "." ? colors.gold400 : colors.white,
                display: "inline-block",
                opacity: s,
                transform: `translateY(${(1 - s) * 80}px)`,
              }}
            >
              {l}
            </span>
          );
        })}
      </div>
      <div
        style={{
          width: line,
          height: 4,
          backgroundColor: colors.gold400,
          borderRadius: 2,
          marginTop: 10,
        }}
      />
      <div
        style={{
          fontFamily: fonts.sans,
          fontWeight: 500,
          fontSize: 34,
          letterSpacing: 6,
          color: colors.muted,
          marginTop: 36,
          opacity: slogan,
        }}
      >
        BEYOND LEARNING. BEYOND LIMITS.
      </div>
    </AbsoluteFill>
  );
};

/** Scene 2 (3–6.5s): title + feature chips (motion graphics). */
const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = spring({ frame, fps, config: { damping: 16 } });
  const chips = ["🎙  AI ovoz", "💬  Subtitrlar", "🎵  Musiqa", "🎬  Videolaringiz"];

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeInOut(frame, 105),
        paddingBottom: 320,
      }}
    >
      <div
        style={{
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: 120,
          lineHeight: 1.0,
          textAlign: "center",
          color: colors.white,
          transform: `scale(${0.85 + title * 0.15})`,
          opacity: title,
        }}
      >
        Professional
        <br />
        <span style={{ color: colors.gold400 }}>oʻzbek</span> videolar
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 24,
          marginTop: 70,
          maxWidth: 900,
        }}
      >
        {chips.map((chip, i) => {
          const s = spring({ frame: frame - 15 - i * 8, fps, config: { damping: 12 } });
          return (
            <div
              key={chip}
              style={{
                fontFamily: fonts.sans,
                fontWeight: 700,
                fontSize: 40,
                color: colors.white,
                padding: "22px 36px",
                borderRadius: 999,
                backgroundColor: colors.navy900,
                border: `2px solid ${colors.gold400}`,
                opacity: s,
                transform: `translateX(${(1 - s) * (i % 2 ? 200 : -200)}px)`,
              }}
            >
              {chip}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Scene 3 (6.5–10s): outro with progress bar and check mark. */
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = interpolate(frame, [0, 60], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const check = spring({ frame: frame - 60, fps, config: { damping: 10 } });
  const out = interpolate(frame, [95, 105], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center", opacity: out, paddingBottom: 320 }}
    >
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: "50%",
          backgroundColor: colors.gold400,
          color: colors.navy950,
          fontSize: 140,
          fontWeight: 800,
          fontFamily: fonts.sans,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${check})`,
        }}
      >
        ✓
      </div>
      <div
        style={{
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: 96,
          color: colors.white,
          marginTop: 50,
        }}
      >
        Test video tayyor
      </div>
      <div
        style={{
          width: 760,
          height: 18,
          borderRadius: 9,
          backgroundColor: colors.navy800,
          marginTop: 50,
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${progress}%`, height: "100%", backgroundColor: colors.gold400 }} />
      </div>
      <div
        style={{
          fontFamily: fonts.sans,
          fontWeight: 700,
          fontSize: 44,
          color: colors.gold400,
          marginTop: 24,
        }}
      >
        {Math.round(progress)}%
      </div>
    </AbsoluteFill>
  );
};

export const TestVideo: React.FC<TestVideoProps> = ({
  captions,
  voiceoverSrc,
  musicSrc,
  backgroundClipSrc,
}) => {
  return (
    <AbsoluteFill>
      <Background clipSrc={backgroundClipSrc} />
      <Sequence durationInFrames={90}>
        <LogoScene />
      </Sequence>
      <Sequence from={90} durationInFrames={105}>
        <FeaturesScene />
      </Sequence>
      <Sequence from={195} durationInFrames={105}>
        <OutroScene />
      </Sequence>
      <AnimatedSubtitles captions={captions} />
      <AudioLayer voiceoverSrc={voiceoverSrc} musicSrc={musicSrc} />
    </AbsoluteFill>
  );
};
