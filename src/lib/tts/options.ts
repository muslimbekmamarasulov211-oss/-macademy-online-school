/**
 * Text-to-speech options shared by the server route and the browser UI.
 *
 * Values follow the official Aisha TTS API reference
 * (https://aisha.group/uz/api-documentation/text-to-speech):
 * - `mood` is available only for the built-in `Gulnoza` model (language `uz`).
 * - `speed` is `0` (service default) or a custom value in 0.5–2.0.
 * - With an API key, one request accepts at most 1000 characters.
 *
 * Framework-agnostic and secret-free: safe to import from Client Components.
 */

export const TTS_MOODS = ["Neutral", "Cheerful", "Happy", "Sad"] as const;
export type TtsMood = (typeof TTS_MOODS)[number];

/** Uzbek labels for the API mood values. */
export const TTS_MOOD_LABELS: Record<TtsMood, string> = {
  Neutral: "Neytral",
  Cheerful: "Quvnoq",
  Happy: "Xursand",
  Sad: "Gʻamgin",
};

export const TTS_DEFAULT_MOOD: TtsMood = "Neutral";

export const TTS_SPEED_MIN = 0.5;
export const TTS_SPEED_MAX = 2.0;
export const TTS_SPEED_STEP = 0.1;
export const TTS_DEFAULT_SPEED = 1.0;

/** Per-request character limit for API-key requests. */
export const TTS_MAX_CHARS = 1000;

export function isTtsMood(value: unknown): value is TtsMood {
  return typeof value === "string" && (TTS_MOODS as readonly string[]).includes(value);
}

/** True for the documented speed values: 0 (default) or 0.5–2.0. */
export function isValidTtsSpeed(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    (value === 0 || (value >= TTS_SPEED_MIN && value <= TTS_SPEED_MAX))
  );
}

/** Body of a POST to `/api/tts`. */
export type TtsRequestBody = {
  text: string;
  mood: TtsMood;
  speed: number;
};

/** JSON body returned by `/api/tts` when synthesis fails. */
export type TtsErrorBody = {
  error: string;
};
