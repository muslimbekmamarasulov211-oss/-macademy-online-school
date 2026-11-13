import React from "react";
import { Composition } from "remotion";
import { TestVideo, testCaptions, type TestVideoProps } from "./compositions/TestVideo";

// All compositions are vertical 1080x1920 (9:16) at 30 fps.
export const RemotionRoot: React.FC = () => {
  return (
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
  );
};
