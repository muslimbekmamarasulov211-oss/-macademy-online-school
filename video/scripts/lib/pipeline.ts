import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { VoiceoverData } from "../../src/types";
import { synthesize, VOICES, type VoiceKey } from "./azure-tts";
import {
  alignWords,
  estimateWords,
  groupIntoCaptions,
  wordsFromSentenceSegments,
} from "./captions";
import { loadSpeechEnv } from "./env";
import {
  DEFAULT_REFERENCE,
  EMOTIONS,
  type EmotionKey,
  NavoiyWorker,
  resolveReference,
} from "./navoiy-tts";
import { splitSentences, toDisplayText, toSpeechText } from "./uzbek-text";

export const MAX_TEXT_LENGTH = 5000;
export const NAME_RE = /^[a-z0-9][a-z0-9-]{0,59}$/;

export type Engine = "navoiy" | "azure";
export type AudioFormat = "wav" | "mp3";

/** How to voice the text. Navoiy = free local model (default), Azure = cloud API (key needed). */
export type VoiceSettings =
  | { engine: "navoiy"; emotion: EmotionKey; reference: string; rate: number; format: AudioFormat }
  | { engine: "azure"; voice: VoiceKey; rate: number };

export const validateName = (name: string) => {
  if (!NAME_RE.test(name)) throw new Error("Name: only a-z, 0-9 and -, max 60 characters.");
};

/** Validate untrusted input (CLI flags or the generator page) into VoiceSettings. */
export const toVoiceSettings = (o: {
  engine?: string;
  voice?: string;
  emotion?: string;
  reference?: string;
  rate?: number;
  format?: string;
}): VoiceSettings => {
  const rate = o.rate ?? 0;
  if (!Number.isInteger(rate) || rate < -50 || rate > 50) {
    throw new Error("Rate must be a whole number between -50 and 50.");
  }
  const engine = o.engine ?? "navoiy";
  if (engine === "azure") {
    const voice = (o.voice ?? "madina").toLowerCase();
    if (!(voice in VOICES)) throw new Error(`Unknown voice "${voice}". Use: madina, sardor.`);
    return { engine, voice: voice as VoiceKey, rate };
  }
  if (engine !== "navoiy") throw new Error(`Unknown engine "${engine}". Use: navoiy, azure.`);
  const emotion = (o.emotion ?? "xotirjam").toLowerCase();
  if (!(emotion in EMOTIONS)) {
    throw new Error(`Unknown emotion "${emotion}". Use: ${Object.keys(EMOTIONS).join(", ")}.`);
  }
  const format = o.format ?? "wav";
  if (format !== "wav" && format !== "mp3") throw new Error("Format must be wav or mp3.");
  return {
    engine,
    emotion: emotion as EmotionKey,
    reference: o.reference ?? DEFAULT_REFERENCE,
    rate,
    format,
  };
};

export const USAGE =
  "Usage: npm run make -- <name> [--engine navoiy|azure] [--emotion xotirjam|xursand|…]\n" +
  '       [--ref namuna] [--voice madina|sardor] [--rate -10] [--format wav|mp3] [--title "…"]\n' +
  "<name> = file texts/<name>.txt";

export const parseCliArgs = (argv: string[]) => {
  const flags = ["--engine", "--voice", "--emotion", "--ref", "--rate", "--format", "--title"];
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const flagValues = new Set(flags.map(get));
  const name = argv.find((a) => !a.startsWith("--") && !flagValues.has(a));
  if (!name) throw new Error(USAGE);
  validateName(name);
  const settings = toVoiceSettings({
    engine: get("--engine"),
    voice: get("--voice"),
    emotion: get("--emotion"),
    reference: get("--ref"),
    rate: get("--rate") === undefined ? 0 : Number(get("--rate")),
    format: get("--format"),
  });
  return { name, settings, title: get("--title") ?? null };
};

/** Save the user's text as texts/<name>.txt (kept in the project). */
export const saveText = async (root: string, name: string, text: string) => {
  const display = toDisplayText(text);
  if (!display) throw new Error("Text is empty.");
  if (display.length > MAX_TEXT_LENGTH) {
    throw new Error(
      `Text is longer than ${MAX_TEXT_LENGTH} characters — split it into several videos.`,
    );
  }
  await mkdir(path.join(root, "texts"), { recursive: true });
  await writeFile(path.join(root, "texts", `${name}.txt`), display + "\n");
};

/** WAV → MP3 with the ffmpeg that ships with Remotion (no extra install). */
const wavToMp3 = (root: string, wav: string, mp3: string) =>
  new Promise<void>((resolve, reject) => {
    const p = spawn(
      "npx",
      [
        "remotion",
        "ffmpeg",
        "-v",
        "error",
        "-y",
        "-i",
        wav,
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "192k",
        mp3,
      ],
      { cwd: root, stdio: ["ignore", "ignore", "pipe"] },
    );
    let err = "";
    p.stderr.on("data", (d: Buffer) => (err += d.toString()));
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`MP3 conversion failed: ${err.slice(-300)}`)),
    );
  });

export type GenerateOptions = {
  root: string;
  name: string;
  settings: VoiceSettings;
  /** Reuse a running Navoiy worker (generator server). If omitted, one is started and stopped. */
  navoiy?: NavoiyWorker;
  onProgress?: (p: number) => void;
};

/**
 * texts/<name>.txt → voice → public/voiceover/<name>.(wav|mp3) + <name>.json (synced captions).
 */
export const generateVoiceover = async ({
  root,
  name,
  settings,
  navoiy,
  onProgress,
}: GenerateOptions) => {
  validateName(name);
  const display = toDisplayText(await readFile(path.join(root, "texts", `${name}.txt`), "utf8"));
  if (!display) throw new Error(`texts/${name}.txt is empty`);
  if (display.length > MAX_TEXT_LENGTH) {
    throw new Error(
      `Text is longer than ${MAX_TEXT_LENGTH} characters — split it into several videos.`,
    );
  }
  const outDir = path.join(root, "public", "voiceover");
  await mkdir(outDir, { recursive: true });
  const displayWords = display.split(/\s+/).filter(Boolean);

  let audioExt: AudioFormat;
  let durationMs: number;
  let words;
  let timing: VoiceoverData["timing"];
  let voiceLabel: string;

  if (settings.engine === "navoiy") {
    const reference = resolveReference(root, settings.reference);
    const sentences = splitSentences(display);
    voiceLabel = `navoiy:${settings.reference}:${settings.emotion}`;
    console.log(
      `🎙  Navoiy TTS (${settings.emotion}, voice "${settings.reference}") — ${sentences.length} sentence(s)…`,
    );
    const worker = navoiy ?? new NavoiyWorker(root);
    const wav = path.join(outDir, `${name}.wav`);
    try {
      const result = await worker.synthesize({
        sentences: sentences.map(toSpeechText),
        emotion: settings.emotion,
        reference,
        speed: 1 + settings.rate / 100,
        out: wav,
        onProgress,
      });
      durationMs = result.durationMs;
      words = wordsFromSentenceSegments(sentences, result.segments);
      timing = "sentence";
    } finally {
      if (!navoiy) worker.stop();
    }
    audioExt = settings.format;
    if (audioExt === "mp3") {
      await wavToMp3(root, wav, path.join(outDir, `${name}.mp3`));
      await rm(wav);
    }
  } else {
    const env = loadSpeechEnv();
    voiceLabel = VOICES[settings.voice];
    console.log(`🎙  Azure TTS (${voiceLabel})…`);
    const result = await synthesize({
      env,
      text: toSpeechText(display),
      voice: voiceLabel,
      rate: settings.rate,
    });
    durationMs = result.durationMs;
    const aligned =
      result.boundaries.length > 0 ? alignWords(displayWords, result.boundaries) : null;
    if (!aligned) console.warn("⚠️  No word timings from Azure — subtitle timing is estimated.");
    words = aligned ?? estimateWords(displayWords, durationMs);
    timing = aligned ? "word-boundary" : "estimated";
    audioExt = "mp3";
    await writeFile(path.join(outDir, `${name}.mp3`), result.audio);
  }

  // Remove a stale file of the other format from an earlier run with the same name.
  await rm(path.join(outDir, `${name}.${audioExt === "mp3" ? "wav" : "mp3"}`), { force: true });

  const data: VoiceoverData = {
    name,
    text: display,
    engine: settings.engine,
    voice: voiceLabel,
    audioFile: `voiceover/${name}.${audioExt}`,
    durationMs: Math.round(durationMs),
    timing,
    captions: groupIntoCaptions(words),
  };
  await writeFile(path.join(outDir, `${name}.json`), JSON.stringify(data, null, 2) + "\n");
  console.log(
    `✅ public/${data.audioFile} (${(durationMs / 1000).toFixed(1)} s) + ${data.captions.length} subtitle lines [${timing}]`,
  );
  return data;
};
