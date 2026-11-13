/**
 * Generate an Uzbek AI voiceover + synced subtitles from a text file.
 *
 *   npm run voice -- <name> [--voice madina|sardor] [--rate -10]
 *
 * Reads   texts/<name>.txt
 * Writes  public/voiceover/<name>.mp3   (the voice)
 *         public/voiceover/<name>.json  (word timings + subtitle lines)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { VoiceoverData } from "../src/types";
import { synthesize, VOICES, type VoiceKey } from "./lib/azure-tts";
import { alignWords, estimateWords, groupIntoCaptions } from "./lib/captions";
import { toDisplayText, toSpeechText } from "./lib/uzbek-text";

// npm scripts always run from the video/ folder.
const ROOT = process.cwd();

export const parseArgs = (argv: string[]) => {
  const name = argv.find((a) => !a.startsWith("--"));
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const voice = (get("--voice") ?? "madina").toLowerCase();
  const rate = Number(get("--rate") ?? "0");
  if (!name || !/^[a-z0-9-]+$/.test(name)) {
    throw new Error(
      "Usage: npm run voice -- <name> [--voice madina|sardor] [--rate -10]\n<name> = file texts/<name>.txt (a-z, 0-9, -)",
    );
  }
  if (!(voice in VOICES))
    throw new Error(`Unknown voice "${voice}". Use: ${Object.keys(VOICES).join(", ")}`);
  if (!Number.isFinite(rate) || rate < -50 || rate > 50)
    throw new Error("--rate must be between -50 and 50");
  return { name, voice: voice as VoiceKey, rate };
};

export const generateVoiceover = async ({ name, voice, rate }: ReturnType<typeof parseArgs>) => {
  const raw = await readFile(path.join(ROOT, "texts", `${name}.txt`), "utf8");
  const display = toDisplayText(raw);
  if (!display) throw new Error(`texts/${name}.txt is empty`);
  if (display.length > 5000)
    throw new Error("Text is longer than 5000 characters — split it into several videos.");

  console.log(`🎙  Generating voice (${VOICES[voice]}) for texts/${name}.txt …`);
  const { audio, durationMs, boundaries } = await synthesize({
    text: toSpeechText(display),
    voice: VOICES[voice],
    rate,
  });

  const displayWords = display.split(/\s+/).filter(Boolean);
  const aligned = alignWords(displayWords, boundaries);
  if (!aligned)
    console.warn(
      "⚠️  Could not match every word to the voice timings — using estimated subtitle timing.",
    );
  const words = aligned ?? estimateWords(displayWords, durationMs);

  const outDir = path.join(ROOT, "public", "voiceover");
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

if (process.argv[1]?.endsWith(`${path.sep}voice.ts`)) {
  Promise.resolve()
    .then(() => generateVoiceover(parseArgs(process.argv.slice(2))))
    .catch((err: Error) => {
      console.error(`❌ ${err.message}`);
      process.exit(1);
    });
}
