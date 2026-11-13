import React from "react";
import { Html5Audio, staticFile, useVideoConfig } from "remotion";
import { musicVolumeAt } from "../lib/music-volume";

type Props = {
  /** AI voiceover file inside public/, e.g. "voiceover/intro.mp3". */
  voiceoverSrc?: string | null;
  /** Background music file inside public/, e.g. "music/calm.mp3". */
  musicSrc?: string | null;
  /** Music volume when nobody is speaking (0..1). */
  musicVolume?: number;
  /** When the voice is speaking (ms). Music is lowered ("ducked") during these spans. */
  speech?: { startMs: number; endMs: number }[];
};

/** Voiceover at full volume + looping background music with fades and voice ducking. */
export const AudioLayer: React.FC<Props> = ({
  voiceoverSrc,
  musicSrc,
  musicVolume = 0.18,
  speech = [],
}) => {
  const { durationInFrames, fps } = useVideoConfig();
  const durationMs = (durationInFrames / fps) * 1000;
  const volumeAt = (f: number) => musicVolumeAt((f / fps) * 1000, durationMs, musicVolume, speech);

  return (
    <>
      {voiceoverSrc ? <Html5Audio src={staticFile(voiceoverSrc)} /> : null}
      {musicSrc ? <Html5Audio src={staticFile(musicSrc)} loop volume={volumeAt} /> : null}
    </>
  );
};
