import { AishaTtsError, synthesizeSpeech } from "@/lib/tts/aisha.server";
import {
  isTtsMood,
  isValidTtsSpeed,
  TTS_MAX_CHARS,
  TTS_SPEED_MAX,
  TTS_SPEED_MIN,
  type TtsErrorBody,
} from "@/lib/tts/options";
import { checkTtsRateLimit, clientIdFromHeaders } from "@/lib/tts/rate-limit.server";

/**
 * POST /api/tts
 * Body (JSON): { text: string, mood: "Neutral"|"Cheerful"|"Happy"|"Sad", speed: number }
 * Success: 200 with the WAV audio bytes.
 * Failure: JSON { error } with an Uzbek message.
 *
 * The Aisha API key stays on the server; the browser only talks to this route.
 */

/** Generous ceiling for 1000 characters of JSON-encoded text. */
const MAX_BODY_BYTES = 16 * 1024;

function errorResponse(status: number, error: string, headers?: HeadersInit): Response {
  return Response.json({ error } satisfies TtsErrorBody, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

const statusForCode: Record<AishaTtsError["code"], number> = {
  not_configured: 503,
  invalid_request: 400,
  unauthorized: 502,
  insufficient_balance: 503,
  unavailable: 503,
  timeout: 504,
  upstream_error: 502,
};

export async function POST(request: Request): Promise<Response> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) {
    return errorResponse(413, "Soʻrov hajmi juda katta.");
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return errorResponse(400, "Soʻrovni oʻqib boʻlmadi.");
  }
  if (raw.length > MAX_BODY_BYTES) {
    return errorResponse(413, "Soʻrov hajmi juda katta.");
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return errorResponse(400, "Soʻrov JSON formatida boʻlishi kerak.");
  }
  if (!body || typeof body !== "object") {
    return errorResponse(400, "Soʻrov JSON formatida boʻlishi kerak.");
  }

  const { text, mood, speed } = body as Record<string, unknown>;

  if (typeof text !== "string" || !text.trim()) {
    return errorResponse(400, "Ovozga aylantirish uchun matn kiriting.");
  }
  const transcript = text.trim();
  if (transcript.length > TTS_MAX_CHARS) {
    return errorResponse(400, `Matn ${TTS_MAX_CHARS} belgidan oshmasligi kerak.`);
  }
  if (!isTtsMood(mood)) {
    return errorResponse(400, "Ovoz kayfiyati notoʻgʻri tanlangan.");
  }
  if (!isValidTtsSpeed(speed)) {
    return errorResponse(
      400,
      `Ovoz tezligi ${TTS_SPEED_MIN} va ${TTS_SPEED_MAX} oraligʻida boʻlishi kerak.`,
    );
  }

  const limit = checkTtsRateLimit(clientIdFromHeaders(request.headers), Date.now());
  if (!limit.allowed) {
    return errorResponse(
      429,
      "Soʻrovlar soni chegaradan oshdi. Birozdan soʻng qayta urinib koʻring.",
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  try {
    const { audio, contentType } = await synthesizeSpeech({ text: transcript, mood, speed });
    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(audio.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AishaTtsError) {
      return errorResponse(statusForCode[error.code], error.message);
    }
    console.error("[api/tts] unexpected error", error);
    return errorResponse(500, "Kutilmagan xatolik yuz berdi. Keyinroq qayta urinib koʻring.");
  }
}
