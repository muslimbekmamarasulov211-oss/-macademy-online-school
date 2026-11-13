import type { Caption, Word } from "../../src/types";
import { normalizeForMatch } from "./uzbek-text";

/** A word reported by the TTS engine (times in ms). */
export type Boundary = { text: string; startMs: number; endMs: number };

/**
 * Give every display word (as written, with punctuation) a start/end time.
 * TTS words are matched in order by their letters; a display word may span several
 * TTS words (e.g. "2026-yil"). Returns null if the texts cannot be matched, so the
 * caller can fall back to estimated timing.
 */
export const alignWords = (displayWords: string[], boundaries: Boundary[]): Word[] | null => {
  const result: Word[] = [];
  let b = 0;

  for (const word of displayWords) {
    const target = normalizeForMatch(word);
    if (target === "") {
      // Pure punctuation like "—": attach to the previous word's timing.
      const prev = result[result.length - 1];
      result.push({ text: word, startMs: prev?.endMs ?? 0, endMs: prev?.endMs ?? 0 });
      continue;
    }
    if (b >= boundaries.length) return null;

    const startMs = boundaries[b].startMs;
    let endMs = boundaries[b].endMs;
    let collected = normalizeForMatch(boundaries[b].text);
    b++;
    // Consume more TTS words until they cover this display word.
    while (collected.length < target.length && b < boundaries.length) {
      collected += normalizeForMatch(boundaries[b].text);
      endMs = boundaries[b].endMs;
      b++;
    }
    if (collected !== target) return null;
    result.push({ text: word, startMs, endMs });
  }
  return result;
};

/** Fallback: spread words over the audio duration in proportion to their length. */
export const estimateWords = (displayWords: string[], durationMs: number): Word[] => {
  const weights = displayWords.map((w) => Math.max(1, normalizeForMatch(w).length) + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = 0;
  return displayWords.map((text, i) => {
    const len = (weights[i] / total) * durationMs;
    const word = { text, startMs: Math.round(t), endMs: Math.round(t + len) };
    t += len;
    return word;
  });
};

const MAX_WORDS = 5;
const MAX_CHARS = 30;
const PAUSE_MS = 600;

/** Split timed words into short subtitle lines that are easy to read on a phone. */
export const groupIntoCaptions = (words: Word[]): Caption[] => {
  const pages: Word[][] = [];
  let page: Word[] = [];

  words.forEach((word, i) => {
    page.push(word);
    const chars = page.map((w) => w.text).join(" ").length;
    const next = words[i + 1];
    const sentenceEnd = /[.!?…]["»”)]*$/.test(word.text);
    const softBreak = /[,;:]$/.test(word.text) && page.length >= 3;
    const longPause = next !== undefined && next.startMs - word.endMs > PAUSE_MS;
    const nextTooLong = next !== undefined && chars + 1 + next.text.length > MAX_CHARS;
    if (!next || sentenceEnd || softBreak || longPause || page.length >= MAX_WORDS || nextTooLong) {
      pages.push(page);
      page = [];
    }
  });

  return pages.map((p, i) => {
    const next = pages[i + 1];
    const lastEnd = p[p.length - 1].endMs;
    // Keep a line on screen until the next one starts (short pauses), max 800 ms extra.
    const endMs = next ? Math.min(next[0].startMs, lastEnd + 800) : lastEnd + 800;
    return {
      text: p.map((w) => w.text).join(" "),
      startMs: p[0].startMs,
      endMs,
      words: p,
    };
  });
};
