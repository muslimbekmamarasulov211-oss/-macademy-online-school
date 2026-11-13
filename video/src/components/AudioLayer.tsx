import React from "react";
import { Html5Audio, interpolate, staticFile, useVideoConfig } from "remotion";

type Props = {
  /** AI voiceover file inside public/, e.g. "voiceover/intro.mp3". */
  voiceoverSrc?: string | null;
  /** Background music file inside public/, e.g. "music/calm.mp3". */
  musicSrc?: string | null;
  musicVolume?: number;
};

/** Voiceover at full volume + background music that fades in/out under it. */
export const AudioLayer: React.FC<Props> = ({ voiceoverSrc, musicSrc, musicVolume = 0.18 }) => {
  const { durationInFrames, fps } = useVideoConfig();
  const fade = fps; // 1 second fade

  return (
    <>
      {voiceoverSrc ? <Html5Audio src={staticFile(voiceoverSrc)} /> : null}
      {musicSrc ? (
        <Html5Audio
          src={staticFile(musicSrc)}
          loop
          volume={(f) =>
            interpolate(
              f,
              [0, fade, durationInFrames - fade, durationInFrames],
              [0, musicVolume, musicVolume, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            )
          }
        />
      ) : null}
    </>
  );
};
