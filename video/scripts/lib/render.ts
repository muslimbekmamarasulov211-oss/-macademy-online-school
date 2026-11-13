import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

/** Output formats: 9:16 for Reels/Shorts/TikTok, 16:9 for YouTube. */
export const FORMATS = {
  reels: { compositionId: "VoiceVideo", label: "9:16 Reels", size: "1080×1920" },
  youtube: { compositionId: "VoiceVideoWide", label: "16:9 YouTube", size: "1920×1080" },
} as const;
export type VideoFormat = keyof typeof FORMATS;

const MUSIC_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;

/** Music tracks in public/music (*.mp3): generated loops + your own files. */
export const listMusic = (root: string): string[] => {
  const dir = path.join(root, "public", "music");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".mp3"))
    .map((f) => f.slice(0, -4))
    .filter((n) => MUSIC_RE.test(n))
    .sort();
};

export type VideoOptions = {
  formats: VideoFormat[];
  /** Track id in public/music (without .mp3), or null for no music. */
  music: string | null;
  /** 0..0.5 — music level in pauses; it is lowered automatically under the voice. */
  musicVolume: number;
};

/** Validate untrusted input (CLI or generator page). */
export const toVideoOptions = (
  root: string,
  o: { formats?: unknown; music?: unknown; musicVolume?: unknown },
): VideoOptions => {
  const raw = Array.isArray(o.formats) ? o.formats : ["reels", "youtube"];
  const formats = [...new Set(raw.map(String))];
  if (formats.length === 0) throw new Error("Choose at least one format: reels, youtube.");
  for (const f of formats) {
    if (!(f in FORMATS)) throw new Error(`Unknown format "${f}". Use: reels, youtube.`);
  }
  const music =
    o.music === undefined
      ? "ilhom"
      : o.music === null || o.music === "" || o.music === "none"
        ? null
        : String(o.music);
  if (music !== null && !listMusic(root).includes(music)) {
    throw new Error(
      `Music "${music}" not found in public/music. Available: ${listMusic(root).join(", ") || "none"}.`,
    );
  }
  const musicVolume = o.musicVolume === undefined ? 0.18 : Number(o.musicVolume);
  if (!Number.isFinite(musicVolume) || musicVolume < 0 || musicVolume > 0.5) {
    throw new Error("Music volume must be between 0 and 0.5.");
  }
  return { formats: formats as VideoFormat[], music, musicVolume };
};

export const outputName = (name: string, format: VideoFormat) => `${name}-${format}`;

export type RenderOptions = VideoOptions & {
  root: string;
  name: string;
  title: string | null;
  /** Overall progress 0..1 across all formats. */
  onProgress?: (progress: number, format: VideoFormat) => void;
};

/**
 * Render public/voiceover/<name>.* into out/<name>-reels.mp4 and/or out/<name>-youtube.mp4.
 * The project is bundled once and reused for every format.
 */
export const renderVoiceVideo = async ({
  root,
  name,
  title,
  formats,
  music,
  musicVolume,
  onProgress,
}: RenderOptions) => {
  // Bundle per job: the bundle snapshots public/, which now contains the new voiceover.
  const serveUrl = await bundle({ entryPoint: path.join(root, "src", "index.ts") });
  const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
  const inputProps = {
    name,
    title,
    musicSrc: music ? `music/${music}.mp3` : null,
    musicVolume,
    backgroundClipSrc: null,
  };

  const outputs: string[] = [];
  for (const [i, format] of formats.entries()) {
    const composition = await selectComposition({
      serveUrl,
      id: FORMATS[format].compositionId,
      inputProps,
      browserExecutable,
    });
    const outputLocation = path.join(root, "out", `${outputName(name, format)}.mp4`);
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
      onProgress: ({ progress }) => onProgress?.((i + progress) / formats.length, format),
    });
    outputs.push(outputLocation);
  }
  return outputs;
};
