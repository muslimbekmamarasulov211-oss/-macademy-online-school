import "server-only";

import { getAishaApiKey } from "@/config/env.server";

import type { TtsMood } from "./options";

/**
 * Server-side client for the Aisha AI Text-to-Speech API.
 *
 * Reference: https://aisha.group/uz/api-documentation/text-to-speech
 *   POST https://back.aisha.group/api/v1/tts/post/   (multipart/form-data)
 *   Header: X-Api-Key: <api_key>
 *   Fields: transcript, language=uz, model=Gulnoza, mood, speed
 *   201 → { "audio_path": "/media/tts_audios/<id>.wav" }
 *   400 bad field · 401 auth · 402 low balance · 503 service unavailable
 *
 * Requests are synchronous (no webhook_notification_url is sent), so the
 * response already contains the finished audio path.
 */

const AISHA_BASE_URL = "https://back.aisha.group";
const TTS_ENDPOINT = `${AISHA_BASE_URL}/api/v1/tts/post/`;
/** The only model documented for language=uz. */
const UZ_MODEL = "Gulnoza";
const REQUEST_TIMEOUT_MS = 60_000;

export type AishaTtsErrorCode =
  | "not_configured"
  | "invalid_request"
  | "unauthorized"
  | "insufficient_balance"
  | "unavailable"
  | "timeout"
  | "upstream_error";

/** A failure with an Uzbek message that is safe to show to end users. */
export class AishaTtsError extends Error {
  constructor(
    readonly code: AishaTtsErrorCode,
    message: string,
    /** HTTP status returned by Aisha, when there was a response. */
    readonly upstreamStatus?: number,
  ) {
    super(message);
    this.name = "AishaTtsError";
  }
}

export type SynthesizeInput = {
  text: string;
  mood: TtsMood;
  speed: number;
};

export type SynthesizedAudio = {
  audio: ArrayBuffer;
  contentType: string;
};

type AishaErrorBody = { detail?: unknown; error_key?: unknown };

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function upstreamDetail(body: unknown): string | null {
  if (body && typeof body === "object") {
    const { detail } = body as AishaErrorBody;
    if (typeof detail === "string" && detail.trim()) return detail.trim();
  }
  return null;
}

function errorFromResponse(status: number, body: unknown): AishaTtsError {
  const detail = upstreamDetail(body);

  // Log the raw upstream reason for operators. It never contains the API key.
  console.error("[aisha-tts] request failed", { status, body });

  switch (status) {
    case 400:
      return new AishaTtsError(
        "invalid_request",
        detail ?? "Matn yoki ovoz parametrlari notoʻgʻri.",
        status,
      );
    case 401:
    case 403:
      // Authentication problems are an operator issue: do not echo details to users.
      return new AishaTtsError(
        "unauthorized",
        "Ovoz xizmati notoʻgʻri sozlangan (API kaliti qabul qilinmadi).",
        status,
      );
    case 402:
      return new AishaTtsError(
        "insufficient_balance",
        "Ovoz xizmati hisobida balans yetarli emas.",
        status,
      );
    case 429:
      return new AishaTtsError(
        "unavailable",
        "Ovoz xizmatiga soʻrovlar juda koʻp. Birozdan soʻng qayta urinib koʻring.",
        status,
      );
    case 503:
      return new AishaTtsError(
        "unavailable",
        "Ovoz xizmati vaqtincha ishlamayapti. Birozdan soʻng qayta urinib koʻring.",
        status,
      );
    default:
      return new AishaTtsError(
        "upstream_error",
        "Ovoz xizmatidan kutilmagan javob keldi. Keyinroq qayta urinib koʻring.",
        status,
      );
  }
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new AishaTtsError("timeout", "Ovoz xizmati javob bermadi. Qayta urinib koʻring.");
    }
    console.error("[aisha-tts] network error", error);
    throw new AishaTtsError(
      "unavailable",
      "Ovoz xizmatiga ulanib boʻlmadi. Birozdan soʻng qayta urinib koʻring.",
    );
  }
}

/** Converts Uzbek text to speech and returns the audio bytes (WAV). */
export async function synthesizeSpeech(input: SynthesizeInput): Promise<SynthesizedAudio> {
  const apiKey = getAishaApiKey();
  if (!apiKey) {
    throw new AishaTtsError(
      "not_configured",
      "Ovoz xizmati hali sozlanmagan. Administrator AISHA_API_KEY qiymatini kiritishi kerak.",
    );
  }

  const form = new FormData();
  form.set("transcript", input.text);
  form.set("language", "uz");
  form.set("model", UZ_MODEL);
  form.set("mood", input.mood);
  form.set("speed", String(input.speed));

  const response = await send(TTS_ENDPOINT, {
    method: "POST",
    headers: { "X-Api-Key": apiKey, "Accept-Language": "uz" },
    body: form,
  });

  const body = await readJson(response);
  if (!response.ok) throw errorFromResponse(response.status, body);

  const audioPath =
    body && typeof body === "object" ? (body as { audio_path?: unknown }).audio_path : undefined;
  if (typeof audioPath !== "string" || !audioPath) {
    console.error("[aisha-tts] response without audio_path", { status: response.status, body });
    throw new AishaTtsError(
      "upstream_error",
      "Ovoz xizmati audio faylni qaytarmadi. Qayta urinib koʻring.",
      response.status,
    );
  }

  // `audio_path` is relative to the API host (e.g. "/media/tts_audios/<id>.wav").
  const audioUrl = new URL(audioPath, AISHA_BASE_URL);
  if (audioUrl.protocol !== "https:") {
    throw new AishaTtsError("upstream_error", "Audio manzili notoʻgʻri.", response.status);
  }
  const sameHost = audioUrl.origin === AISHA_BASE_URL;

  const audioResponse = await send(audioUrl.toString(), {
    // Never send the key to a host other than the documented API host.
    headers: sameHost ? { "X-Api-Key": apiKey } : undefined,
  });
  if (!audioResponse.ok) {
    console.error("[aisha-tts] audio download failed", { status: audioResponse.status });
    throw new AishaTtsError(
      "upstream_error",
      "Tayyor audio faylni yuklab boʻlmadi. Qayta urinib koʻring.",
      audioResponse.status,
    );
  }

  const audio = await audioResponse.arrayBuffer();
  if (audio.byteLength === 0) {
    throw new AishaTtsError("upstream_error", "Ovoz xizmati boʻsh audio qaytardi.");
  }

  const contentType = audioResponse.headers.get("content-type") ?? "";
  return {
    audio,
    contentType: contentType.startsWith("audio/") ? contentType : "audio/wav",
  };
}
