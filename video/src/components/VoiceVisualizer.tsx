import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import React from "react";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../theme";

type Props = { src: string; centerY: number; width: number; height: number };

const BARS = 32;

/** Gold bars that move with the voice (real audio analysis of the voiceover file). */
export const VoiceVisualizer: React.FC<Props> = ({ src, centerY, width, height }) => {
  const frame = useCurrentFrame();
  const { fps, width: videoWidth } = useVideoConfig();
  const audioData = useAudioData(staticFile(src));
  if (!audioData) return null;

  // Loudness of the voice in this frame (RMS of the samples) → overall bar height.
  const samples = audioData.channelWaveforms[0];
  const perFrame = Math.round(audioData.sampleRate / fps);
  const start = Math.min(samples.length, frame * perFrame);
  let sum = 0;
  for (let i = start; i < Math.min(samples.length, start + perFrame); i++) sum += samples[i] ** 2;
  const level = Math.min(1, Math.sqrt(sum / perFrame) * 7);

  // Frequency spectrum → shape of the bars (normalised). Mirrored for a symmetric look.
  const spectrum = visualizeAudio({ fps, frame, audioData, numberOfSamples: 64 }).slice(
    0,
    BARS / 2,
  );
  const peak = Math.max(...spectrum, 1e-6);
  const half = spectrum.map((v) => level * (0.35 + 0.65 * Math.sqrt(v / peak)));
  const bars = [...half.slice().reverse(), ...half];
  const gap = 8;
  const barWidth = (width - gap * (BARS - 1)) / BARS;

  return (
    <div
      style={{
        position: "absolute",
        left: (videoWidth - width) / 2,
        top: centerY - height / 2,
        width,
        height,
        display: "flex",
        alignItems: "center",
        gap,
      }}
    >
      {bars.map((v, i) => (
        <div
          key={i}
          style={{
            width: barWidth,
            height: Math.max(6, v * height),
            borderRadius: barWidth / 2,
            backgroundColor: colors.gold400,
            opacity: 0.35 + v * 0.65,
          }}
        />
      ))}
    </div>
  );
};
