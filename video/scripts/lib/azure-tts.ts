import { request } from "node:https";
import { HttpsProxyAgent } from "https-proxy-agent";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import type { Boundary } from "./captions";
import type { SpeechEnv } from "./env";

/** Azure neural voices for Uzbek (Latin, Uzbekistan). */
export const VOICES = {
  madina: "uz-UZ-MadinaNeural", // female
  sardor: "uz-UZ-SardorNeural", // male
} as const;
export type VoiceKey = keyof typeof VOICES;

export type SynthesisResult = {
  audio: Buffer;
  durationMs: number;
  /** Empty when the REST fallback was used (no word timings). */
  boundaries: Boundary[];
  method: "sdk" | "rest";
};

const TICKS_PER_MS = 10_000;

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const buildSsml = (text: string, voice: string, rate: number) =>
  `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="uz-UZ">` +
  `<voice name="${voice}"><prosody rate="${rate >= 0 ? "+" : ""}${rate}%">${escapeXml(text)}</prosody></voice>` +
  `</speak>`;

const proxyUrl = () => process.env.HTTPS_PROXY || process.env.https_proxy || null;

/** Remove anything that looks like a key from error text before it is shown or logged. */
const redact = (msg: string, env: SpeechEnv) => msg.split(env.key).join("***");

/** Speech SDK (WebSocket): audio + exact word timings. */
const synthesizeWithSdk = async (env: SpeechEnv, ssml: string): Promise<SynthesisResult> => {
  const config = sdk.SpeechConfig.fromSubscription(env.key, env.region);
  config.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3;
  const proxy = proxyUrl();
  if (proxy) {
    const url = new URL(proxy);
    config.setProxy(url.hostname, Number(url.port || 80));
  }

  // audioConfig null = keep the audio in memory instead of playing it.
  const synthesizer = new sdk.SpeechSynthesizer(config, null as unknown as sdk.AudioConfig);
  const boundaries: Boundary[] = [];
  synthesizer.wordBoundary = (_s, e) => {
    if (e.boundaryType !== sdk.SpeechSynthesisBoundaryType.Word) return;
    const startMs = e.audioOffset / TICKS_PER_MS;
    boundaries.push({ text: e.text, startMs, endMs: startMs + e.duration / TICKS_PER_MS });
  };

  try {
    const result = await new Promise<sdk.SpeechSynthesisResult>((resolve, reject) =>
      synthesizer.speakSsmlAsync(ssml, resolve, (err) => reject(new Error(String(err)))),
    );
    if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
      const details = sdk.CancellationDetails.fromResult(result);
      throw new Error(details.errorDetails || sdk.ResultReason[result.reason]);
    }
    return {
      audio: Buffer.from(result.audioData),
      durationMs: result.audioDuration / TICKS_PER_MS,
      boundaries,
      method: "sdk",
    };
  } finally {
    synthesizer.close();
  }
};

/** REST API (plain HTTPS): audio only, no word timings. Used if the WebSocket fails. */
const synthesizeWithRest = (env: SpeechEnv, ssml: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const proxy = proxyUrl();
    const req = request(
      {
        host: `${env.region}.tts.speech.microsoft.com`,
        path: "/cognitiveservices/v1",
        method: "POST",
        agent: proxy ? new HttpsProxyAgent(proxy) : undefined,
        headers: {
          "Ocp-Apim-Subscription-Key": env.key,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-48khz-192kbitrate-mono-mp3",
          "User-Agent": "macademy-video",
        },
        timeout: 60_000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks);
          if (res.statusCode === 200 && body.length > 0) resolve(body);
          else
            reject(
              new Error(
                res.statusCode === 401
                  ? "Azure rejected the key (401). Check AZURE_SPEECH_KEY and AZURE_SPEECH_REGION."
                  : `Azure REST error ${res.statusCode}: ${body.toString("utf8").slice(0, 200)}`,
              ),
            );
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("Azure REST request timed out")));
    req.on("error", reject);
    req.end(ssml);
  });

/**
 * Synthesise Uzbek speech. Tries the Speech SDK first (exact word timings for subtitle
 * sync); falls back to the REST API (subtitle timing then estimated by word length).
 */
export const synthesize = async ({
  env,
  text,
  voice,
  rate,
}: {
  env: SpeechEnv;
  text: string;
  voice: string;
  /** Speaking-rate change in percent, e.g. -10 (slower) or 5 (faster). */
  rate: number;
}): Promise<SynthesisResult> => {
  const ssml = buildSsml(text, voice, rate);
  try {
    return await synthesizeWithSdk(env, ssml);
  } catch (sdkErr) {
    const sdkMsg = redact((sdkErr as Error).message, env);
    console.warn(`⚠️  Speech SDK failed (${sdkMsg.slice(0, 160)}) — trying the REST API.`);
    try {
      const audio = await synthesizeWithRest(env, ssml);
      // Constant 192 kbit/s MP3 → duration from file size (192 bits per ms).
      return { audio, durationMs: (audio.length * 8) / 192, boundaries: [], method: "rest" };
    } catch (restErr) {
      throw new Error(redact((restErr as Error).message, env));
    }
  }
};
