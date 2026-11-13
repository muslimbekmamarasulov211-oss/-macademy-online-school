import { interpolate } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** Music level while the voice speaks, relative to the normal music volume. */
export const DUCK = 0.35;

/**
 * Background-music volume at a moment in the video:
 * 1 s fade in/out, and lowered to 35 % while the voice speaks (300 ms down, 400 ms up).
 */
export const musicVolumeAt = (
  ms: number,
  durationMs: number,
  musicVolume: number,
  speech: { startMs: number; endMs: number }[],
): number => {
  const fadeInOut = interpolate(ms, [0, 1000, durationMs - 1000, durationMs], [0, 1, 1, 0], clamp);
  let duck = 0;
  for (const s of speech) {
    duck = Math.max(
      duck,
      interpolate(ms, [s.startMs - 300, s.startMs, s.endMs, s.endMs + 400], [0, 1, 1, 0], clamp),
    );
  }
  return musicVolume * fadeInOut * (1 - duck * (1 - DUCK));
};
