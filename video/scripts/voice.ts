/**
 * Generate an Uzbek AI voiceover + synced subtitles from a text file.
 *
 *   npm run voice -- <name> [--voice madina|sardor] [--rate -10]
 *
 * Reads   texts/<name>.txt
 * Writes  public/voiceover/<name>.mp3   (the voice)
 *         public/voiceover/<name>.json  (word timings + subtitle lines)
 */
import path from "node:path";
import { generateVoiceover, parseCliArgs } from "./lib/pipeline";

if (process.argv[1]?.endsWith(`${path.sep}voice.ts`)) {
  Promise.resolve()
    .then(() => {
      const { name, voice, rate } = parseCliArgs(process.argv.slice(2));
      return generateVoiceover({ root: process.cwd(), name, voice, rate });
    })
    .catch((err: Error) => {
      console.error(`❌ ${err.message}`);
      process.exit(1);
    });
}
