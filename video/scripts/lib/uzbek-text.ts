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
