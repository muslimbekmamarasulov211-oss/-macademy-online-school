/**
 * Generate an Uzbek AI voiceover + synced subtitles from a text file.
 *
 *   npm run voice -- <name> [--engine navoiy|azure] [--emotion xursand] [--format mp3] …
 *
 * Reads   texts/<name>.txt
 * Writes  public/voiceover/<name>.wav|mp3  (the voice)
 *         public/voiceover/<name>.json     (timings + subtitle lines)
 */
import path from "node:path";
import { generateVoiceover, parseCliArgs } from "./lib/pipeline";

if (process.argv[1]?.endsWith(`${path.sep}voice.ts`)) {
  Promise.resolve()
    .then(() => {
      const { name, settings } = parseCliArgs(process.argv.slice(2));
      return generateVoiceover({ root: process.cwd(), name, settings });
    })
    .catch((err: Error) => {
      console.error(`❌ ${err.message}`);
      process.exit(1);
    });
}
