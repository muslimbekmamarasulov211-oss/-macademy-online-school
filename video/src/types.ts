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
  /** "navoiy" = free local model, "azure" = Azure AI Speech. Older files have no engine. */
  engine?: "navoiy" | "azure";
  voice: string;
  /** Path inside public/, e.g. "voiceover/salom.wav" or "voiceover/salom.mp3". */
  audioFile: string;
  durationMs: number;
  /**
   * "word-boundary" = exact per-word timings (Azure),
   * "sentence" = exact per-sentence timings, words spread inside each sentence (Navoiy),
   * "estimated" = whole text spread by word length (fallback).
   */
  timing: "word-boundary" | "sentence" | "estimated";
  captions: Caption[];
};
