import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

export type RenderOptions = {
  root: string;
  name: string;
  title: string | null;
  onProgress?: (progress: number) => void;
};

/** Render the VoiceVideo composition for public/voiceover/<name>.* to out/<name>.mp4. */
export const renderVoiceVideo = async ({ root, name, title, onProgress }: RenderOptions) => {
  // Bundle per render: the bundle snapshots public/, which now contains the new voiceover.
  const serveUrl = await bundle({ entryPoint: path.join(root, "src", "index.ts") });
  const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
  const inputProps = { name, title, musicSrc: null, backgroundClipSrc: null };

  const composition = await selectComposition({
    serveUrl,
    id: "VoiceVideo",
    inputProps,
    browserExecutable,
  });
  const outputLocation = path.join(root, "out", `${name}.mp4`);
  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    codec: "h264",
    imageFormat: "jpeg",
    pixelFormat: "yuv420p",
    browserExecutable,
    outputLocation,
    overwrite: true,
    onProgress: ({ progress }) => onProgress?.(progress),
  });
  return outputLocation;
};
