import React from "react";
import { Composition } from "remotion";
import {
  VoiceVideo,
  calculateVoiceVideoMetadata,
  type VoiceVideoProps,
} from "./compositions/VoiceVideo";
import { TestVideo, testCaptions, type TestVideoProps } from "./compositions/TestVideo";

const voiceVideoDefaults: VoiceVideoProps = {
  name: "namuna",
  title: null,
  musicSrc: "music/ilhom.mp3",
  musicVolume: 0.18,
  backgroundClipSrc: null,
};

// All compositions run at 30 fps. VoiceVideoWide is 16:9, the rest 9:16.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TestVideo"
        component={TestVideo}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={
          {
            captions: testCaptions,
            // Put files in public/ and set these, e.g. "voiceover/intro.mp3".
            voiceoverSrc: null,
            musicSrc: null,
            backgroundClipSrc: null,
          } satisfies TestVideoProps
        }
      />
      {/* Uzbek AI voiceover video — 9:16 (Reels / Shorts / TikTok).
        Length follows the voice (see calculateMetadata). Generate the voice first. */}
      <Composition
        id="VoiceVideo"
        component={VoiceVideo}
        calculateMetadata={calculateVoiceVideoMetadata}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={voiceVideoDefaults}
      />
      {/* Same video, 16:9 (YouTube). The layout adapts automatically. */}
      <Composition
        id="VoiceVideoWide"
        component={VoiceVideo}
        calculateMetadata={calculateVoiceVideoMetadata}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={voiceVideoDefaults}
      />
    </>
  );
};
