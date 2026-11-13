import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import type { Boundary } from "./captions";

/** Azure neural voices for Uzbek (Latin, Uzbekistan). */
export const VOICES = {
  madina: "uz-UZ-MadinaNeural", // female
  sardor: "uz-UZ-SardorNeural", // male
} as const;
export type VoiceKey = keyof typeof VOICES;

export type SynthesisResult = {
  audio: Buffer;
  durationMs: number;
  boundaries: Boundary[];
};

const TICKS_PER_MS = 10_000;

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Synthesise Uzbek speech with Azure AI Speech and collect word-boundary events
 * (the exact moment each word is spoken) for subtitle sync.
 * Credentials come from AZURE_SPEECH_KEY + AZURE_SPEECH_REGION (see .env.example).
 */
export const synthesize = async ({
  text,
  voice,
  rate,
}: {
  text: string;
  voice: string;
  /** Speaking-rate change in percent, e.g. -10 (slower) or 5 (faster). */
  rate: number;
}): Promise<SynthesisResult> => {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    throw new Error(
      "AZURE_SPEECH_KEY and AZURE_SPEECH_REGION are not set. Copy .env.example to .env and fill them in.",
    );
  }

  const config = sdk.SpeechConfig.fromSubscription(key, region);
  config.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3;
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
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

  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="uz-UZ">
  <voice name="${voice}"><prosody rate="${rate >= 0 ? "+" : ""}${rate}%">${escapeXml(text)}</prosody></voice>
</speak>`;

  try {
    const result = await new Promise<sdk.SpeechSynthesisResult>((resolve, reject) =>
      synthesizer.speakSsmlAsync(ssml, resolve, (err) => reject(new Error(String(err)))),
    );
    if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
      const details = sdk.CancellationDetails.fromResult(result);
      throw new Error(
        `Azure TTS failed: ${details.errorDetails || sdk.ResultReason[result.reason]}`,
      );
    }
    return {
      audio: Buffer.from(result.audioData),
      durationMs: result.audioDuration / TICKS_PER_MS,
      boundaries,
    };
  } finally {
    synthesizer.close();
  }
};
