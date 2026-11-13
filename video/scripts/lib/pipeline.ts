import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { VoiceoverData } from "../../src/types";
import { synthesize, VOICES, type VoiceKey } from "./azure-tts";
import { alignWords, estimateWords, groupIntoCaptions } from "./captions";
import { loadSpeechEnv } from "./env";
import { toDisplayText, toSpeechText } from "./uzbek-text";

export const MAX_TEXT_LENGTH = 5000;
export const NAME_RE = /^[a-z0-9][a-z0-9-]{0,59}$/;

export type VoiceOptions = { root: string; name: string; voice: VoiceKey; rate: number };

export const validateOptions = (o: { name: string; voice: string; rate: number }) => {
  if (!NAME_RE.test(o.name)) throw new Error("Name: only a-z, 0-9 and -, max 60 characters.");
  if (!(o.voice in VOICES)) throw new Error(`Unknown voice "${o.voice}". Use: madina, sardor.`);
  if (!Number.isInteger(o.rate) || o.rate < -50 || o.rate > 50) {
    throw new Error("Rate must be a whole number between -50 and 50.");
  }
};

export const parseCliArgs = (argv: string[]) => {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const flagValues = new Set(["--voice", "--rate", "--title"].map(get));
  const name = argv.find((a) => !a.startsWith("--") && !flagValues.has(a));
  if (!name) {
    throw new Error(
      'Usage: npm run make -- <name> [--voice madina|sardor] [--rate -10] [--title "…"]\n' +
        "<name> = file texts/<name>.txt",
    );
  }
  const opts = {
    name,
    voice: (get("--voice") ?? "madina").toLowerCase() as VoiceKey,
    rate: Number(get("--rate") ?? "0"),
    title: get("--title") ?? null,
  };
  validateOptions(opts);
  return opts;
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

/** texts/<name>.txt → Azure voice → public/voiceover/<name>.mp3 + <name>.json (synced captions). */
export const generateVoiceover = async ({ root, name, voice, rate }: VoiceOptions) => {
  validateOptions({ name, voice, rate });
  const env = loadSpeechEnv();
  const display = toDisplayText(await readFile(path.join(root, "texts", `${name}.txt`), "utf8"));
  if (!display) throw new Error(`texts/${name}.txt is empty`);
  if (display.length > MAX_TEXT_LENGTH) {
    throw new Error(
      `Text is longer than ${MAX_TEXT_LENGTH} characters — split it into several videos.`,
    );
  }

  console.log(`🎙  Generating voice (${VOICES[voice]}) for texts/${name}.txt …`);
  const { audio, durationMs, boundaries, method } = await synthesize({
    env,
    text: toSpeechText(display),
    voice: VOICES[voice],
    rate,
  });

  const displayWords = display.split(/\s+/).filter(Boolean);
  const aligned = boundaries.length > 0 ? alignWords(displayWords, boundaries) : null;
  if (!aligned) {
    console.warn(
      method === "rest"
        ? "⚠️  REST fallback has no word timings — subtitle timing is estimated."
        : "⚠️  Could not match every word to the voice timings — subtitle timing is estimated.",
    );
  }
  const words = aligned ?? estimateWords(displayWords, durationMs);

  const outDir = path.join(root, "public", "voiceover");
  await mkdir(outDir, { recursive: true });
  const data: VoiceoverData = {
    name,
    text: display,
    voice: VOICES[voice],
    audioFile: `voiceover/${name}.mp3`,
    durationMs: Math.round(durationMs),
    timing: aligned ? "word-boundary" : "estimated",
    captions: groupIntoCaptions(words),
  };
  await writeFile(path.join(outDir, `${name}.mp3`), audio);
  await writeFile(path.join(outDir, `${name}.json`), JSON.stringify(data, null, 2) + "\n");
  console.log(
    `✅ public/voiceover/${name}.mp3 (${(durationMs / 1000).toFixed(1)} s) + ${data.captions.length} subtitle lines [${data.timing}]`,
  );
  return data;
};
