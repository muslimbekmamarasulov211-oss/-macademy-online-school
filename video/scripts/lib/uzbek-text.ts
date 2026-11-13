/**
 * Uzbek Latin apostrophes. People type oʻ/gʻ and the tutuq belgisi in many ways
 * (' ` ‘ ’ ʻ ʼ). For subtitles we use the correct letters:
 *   - after o/g:  ʻ (U+02BB)  → oʻ, gʻ
 *   - elsewhere:  ʼ (U+02BC)  → maʼno, taʼlim
 * For the TTS engine we send a plain ASCII apostrophe, the most common form in Uzbek
 * text online. Both strings have exactly the same length, so positions match.
 */
const APOSTROPHES = /['`‘’ʻʼ´]/g;

export const toDisplayText = (input: string): string =>
  input
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(APOSTROPHES, (_m, offset: number, s: string) =>
      /[oOgG]/.test(s[offset - 1] ?? "") ? "ʻ" : "ʼ",
    )
    .trim();

export const toSpeechText = (display: string): string => display.replace(/[ʻʼ]/g, "'");

/** Letters/digits only, lower-case — used to match TTS words to subtitle words. */
export const normalizeForMatch = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[ʻʼ'`‘’]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");

const MAX_SENTENCE_CHARS = 220;

/**
 * Split display text into sentences for local TTS. Each sentence is synthesised on its own,
 * so we know exactly where it starts and ends in the audio. Very long sentences are split
 * further at commas/semicolons so the model never gets an overly long input.
 */
export const splitSentences = (display: string): string[] => {
  const rough = display
    .split(/\n+/)
    // A sentence ends at . ! ? … only when followed by a space — so "M.ACADEMY" or "3.5" stay whole.
    .flatMap((line) => line.split(/(?<=[.!?…]["»”)]*)\s+/))
    .map((s) => s.trim())
    .filter((s) => normalizeForMatch(s) !== "");

  const result: string[] = [];
  for (const sentence of rough) {
    if (sentence.length <= MAX_SENTENCE_CHARS) {
      result.push(sentence);
      continue;
    }
    let current = "";
    for (const part of sentence.split(/(?<=[,;:])\s+/)) {
      if (current && current.length + 1 + part.length > MAX_SENTENCE_CHARS) {
        result.push(current);
        current = part;
      } else current = current ? `${current} ${part}` : part;
    }
    if (current) result.push(current);
  }
  return result;
};
