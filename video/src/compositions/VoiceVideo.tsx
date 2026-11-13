import React, { useMemo } from "react";
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
import { SentenceScenes } from "../components/SentenceScenes";
import { VoiceVisualizer } from "../components/VoiceVisualizer";
import { useLayout } from "../lib/layout";
import { sentencesFromCaptions } from "../lib/sentences";
import { colors, fonts } from "../theme";
import type { VoiceoverData } from "../types";

export type VoiceVideoProps = {
  /** Name of the generated voiceover: public/voiceover/<name>.mp3 + .json */
  name: string;
  /** Optional big heading shown in the middle of the video. */
  title: string | null;
  /** Background music inside public/, e.g. "music/ilhom.mp3", or null for none. */
  musicSrc: string | null;
  /** Music volume when nobody speaks (0..1). It is lowered automatically under the voice. */
  musicVolume: number;
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

const Header: React.FC<{ title: string | null; titleUntilMs: number }> = ({
  title,
  titleUntilMs,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const layout = useLayout();
  const enter = spring({ frame, fps, config: { damping: 16 } });
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 100]);
  const titleOut = interpolate(
    frame,
    [(titleUntilMs / 1000) * fps - 8, (titleUntilMs / 1000) * fps],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill style={{ alignItems: layout.isWide ? "flex-start" : "center" }}>
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
          marginTop: layout.logo.top,
          marginLeft: layout.isWide ? 80 : 0,
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: layout.logo.size,
          letterSpacing: 2,
          color: colors.white,
          opacity: enter,
        }}
      >
        M<span style={{ color: colors.gold400 }}>.</span>ACADEMY
      </div>
      {title && titleOut > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: layout.title.centerY - layout.title.size * 0.8,
            display: "flex",
            justifyContent: "center",
            opacity: enter * titleOut,
            transform: `translateY(${(1 - enter) * 60}px) scale(${0.9 + titleOut * 0.1})`,
          }}
        >
          <div
            style={{
              maxWidth: layout.title.maxWidth,
              textAlign: "center",
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: layout.title.size,
              // Cormorant uses old-style figures by default ("10" looks like "IO").
              fontVariantNumeric: "lining-nums",
              lineHeight: 1.05,
              color: colors.white,
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
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** How long the title card stays before the first keyword appears. */
const TITLE_MS = 2200;

export const VoiceVideo: React.FC<VoiceVideoProps> = ({
  title,
  musicSrc,
  musicVolume,
  backgroundClipSrc,
  voiceover,
}) => {
  const layout = useLayout();
  const sentences = useMemo(
    () => (voiceover ? sentencesFromCaptions(voiceover.captions) : []),
    [voiceover],
  );
  if (!voiceover) return null; // calculateMetadata always fills this in
  const titleUntilMs = title ? Math.max(TITLE_MS, sentences[0]?.endMs ?? 0) : 0;

  return (
    <AbsoluteFill>
      <Background clipSrc={backgroundClipSrc} />
      <SentenceScenes sentences={sentences} hideBeforeMs={titleUntilMs} />
      <Header title={title} titleUntilMs={titleUntilMs} />
      <VoiceVisualizer src={voiceover.audioFile} {...layout.visualizer} />
      <AnimatedSubtitles captions={voiceover.captions} {...layout.subtitles} />
      <AudioLayer
        voiceoverSrc={voiceover.audioFile}
        musicSrc={musicSrc}
        musicVolume={musicVolume}
        speech={sentences}
      />
    </AbsoluteFill>
  );
};
