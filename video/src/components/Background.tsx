import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "../theme";

type Props = {
  /** Optional path inside public/, e.g. "clips/my-video.mp4". */
  clipSrc?: string | null;
};

/** Animated navy background with drifting gold rings, or the user's own clip. */
export const Background: React.FC<Props> = ({ clipSrc }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const t = frame / durationInFrames;
  // Ring centre: same as before for vertical videos, centred for landscape.
  const isWide = width > height;
  const cx = width / 2;
  const cy = isWide ? height * 0.45 : 760;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      {clipSrc ? (
        <>
          <OffthreadVideo
            src={staticFile(clipSrc)}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {/* Darken the clip so text stays readable. */}
          <AbsoluteFill
            style={{
              background: `linear-gradient(180deg, ${colors.ink}99 0%, ${colors.ink}33 40%, ${colors.ink}e6 100%)`,
            }}
          />
        </>
      ) : (
        <>
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at ${30 + t * 40}% ${25 + t * 20}%, ${colors.navy800} 0%, ${colors.navy950} 45%, ${colors.ink} 100%)`,
            }}
          />
          {[0, 1, 2].map((i) => {
            const size = 700 + i * 380;
            const rotate = interpolate(
              frame,
              [0, durationInFrames],
              [i * 40, i * 40 + (i % 2 ? -60 : 60)],
            );
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: cx - size / 2,
                  top: cy - size / 2,
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  border: `2px solid ${colors.gold400}`,
                  borderTopColor: "transparent",
                  borderLeftColor: "transparent",
                  opacity: 0.18 - i * 0.04,
                  transform: `rotate(${rotate}deg)`,
                }}
              />
            );
          })}
        </>
      )}
    </AbsoluteFill>
  );
};
