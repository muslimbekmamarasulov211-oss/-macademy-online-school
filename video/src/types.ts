/** One spoken word with its exact timing in the voiceover (milliseconds). */
export type Word = {
  text: string;
  startMs: number;
  endMs: number;
};

/** One subtitle line. Times are in milliseconds from the start of the video. */
export type Caption = {
  text: string;
  startMs: number;
  endMs: number;
  /** Exact per-word timings from the TTS engine. Optional: without them words are spread evenly. */
  words?: Word[];
};

/** Written by `npm run voice` next to the generated MP3 (public/voiceover/<name>.json). */
export type VoiceoverData = {
  name: string;
  text: string;
  voice: string;
  /** Path inside public/, e.g. "voiceover/salom.mp3". */
  audioFile: string;
  durationMs: number;
  /** "word-boundary" = exact timings from Azure, "estimated" = fallback by word length. */
  timing: "word-boundary" | "estimated";
  captions: Caption[];
};
