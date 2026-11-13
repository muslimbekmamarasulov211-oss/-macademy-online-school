import type { Caption } from "../types";

export type Sentence = {
  text: string;
  startMs: number;
  endMs: number;
  /** The word shown big on screen while this sentence is spoken. */
  keyword: string;
};

const SENTENCE_END = /[.!?…]["»”)]*$/;
const strip = (w: string) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

/** Pick the most "visual" word: the longest one (≥ 4 letters), first one on ties. */
export const pickKeyword = (words: string[]): string => {
  let best = "";
  for (const w of words.map(strip)) if (w.length > best.length) best = w;
  return best.length >= 4 ? best : strip(words[0] ?? "");
};

/**
 * Rebuild spoken sentences (with timings) from the timed subtitle words. Works for every
 * engine: Navoiy (exact sentence timings) and Azure (exact word timings).
 */
export const sentencesFromCaptions = (captions: Caption[]): Sentence[] => {
  const words = captions.flatMap(
    (c) => c.words ?? [{ text: c.text, startMs: c.startMs, endMs: c.endMs }],
  );
  const sentences: Sentence[] = [];
  let current: typeof words = [];
  const flush = () => {
    if (current.length === 0) return;
    const texts = current.map((w) => w.text);
    sentences.push({
      text: texts.join(" "),
      startMs: current[0].startMs,
      endMs: current[current.length - 1].endMs,
      keyword: pickKeyword(texts),
    });
    current = [];
  };
  for (const w of words) {
    current.push(w);
    if (SENTENCE_END.test(w.text)) flush();
  }
  flush();
  return sentences;
};
