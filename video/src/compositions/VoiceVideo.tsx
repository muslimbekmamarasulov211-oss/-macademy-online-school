import React from "react";
import {
  AbsoluteFill,
  type CalculateMetadataFunction,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimatedSubtitles } from "../components/AnimatedSubtitles";
import { AudioLayer } from "../components/AudioLayer";
import { Background } from "../components/Background";
import { colors, fonts } from "../theme";
import type { VoiceoverData } from "../types";

export type VoiceVideoProps = {
  /** Name of the generated voiceover: public/voiceover/<name>.mp3 + .json */
  name: string;
  /** Optional big heading shown in the middle of the video. */
  title: string | null;
  musicSrc: string | null;
  backgroundClipSrc: string | null;
  /** Filled in automatically by calculateMetadata — do not set by hand. */
  voiceover?: VoiceoverData;
};

const FPS = 30;
const TAIL_MS = 1200; // short pause after the last word

/** Loads the voiceover JSON and sets the video length to match the voice. */
export const calculateVoiceVideoMetadata: CalculateMetadataFunction<VoiceVideoProps> = async ({
  props,
}) => {
  const res = await fetch(staticFile(`voiceover/${props.name}.json`));
  if (!res.ok) {
    throw new Error(
      `public/voiceover/${props.name}.json not found. Run: npm run voice -- ${props.name}`,
    );
  }
  const voiceover = (await res.json()) as VoiceoverData;
  return {
    durationInFrames: Math.ceil(((voiceover.durationMs + TAIL_MS) / 1000) * FPS),
    props: { ...props, voiceover },
  };
};

const Header: React.FC<{ title: string | null }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16 } });
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 100]);

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      {/* Thin progress bar at the very top. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 10,
          backgroundColor: colors.navy800,
        }}
      >
        <div style={{ width: `${progress}%`, height: "100%", backgroundColor: colors.gold400 }} />
      </div>
      <div
        style={{
          marginTop: 150,
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: 76,
          letterSpacing: 2,
          color: colors.white,
          opacity: enter,
        }}
      >
        M<span style={{ color: colors.gold400 }}>.</span>ACADEMY
      </div>
      {title ? (
        <div
          style={{
            position: "absolute",
            top: 620,
            maxWidth: 940,
            textAlign: "center",
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 110,
            lineHeight: 1.05,
            color: colors.white,
            opacity: enter,
            transform: `translateY(${(1 - enter) * 60}px)`,
          }}
        >
          {title}
          <div
            style={{
              width: 260,
              height: 5,
              borderRadius: 3,
              backgroundColor: colors.gold400,
              margin: "40px auto 0",
            }}
          />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const VoiceVideo: React.FC<VoiceVideoProps> = ({
  title,
  musicSrc,
  backgroundClipSrc,
  voiceover,
}) => {
  if (!voiceover) return null; // calculateMetadata always fills this in
  return (
    <AbsoluteFill>
      <Background clipSrc={backgroundClipSrc} />
      <Header title={title} />
      <AnimatedSubtitles captions={voiceover.captions} />
      <AudioLayer voiceoverSrc={voiceover.audioFile} musicSrc={musicSrc} />
    </AbsoluteFill>
  );
};
