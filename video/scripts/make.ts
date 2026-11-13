/**
 * One command: Uzbek text → AI voice → motion graphics + subtitles + music → MP4 (9:16 and 16:9).
 *
 *   npm run make -- <name> [--engine navoiy|azure] [--emotion xursand] [--title "Sarlavha"]
 *                          [--aspect both|reels|youtube] [--music ilhom|none]
 *   (all options: see USAGE in scripts/lib/pipeline.ts)
 *
 * Reads texts/<name>.txt, writes out/<name>-reels.mp4 and/or out/<name>-youtube.mp4.
 */
import { generateVoiceover, parseCliArgs } from "./lib/pipeline";
import { FORMATS, outputName, renderVoiceVideo, toVideoOptions } from "./lib/render";

const main = async () => {
  const root = process.cwd(); // npm scripts run from the video/ folder
  const { name, settings, title, video } = parseCliArgs(process.argv.slice(2));
  const videoOptions = toVideoOptions(root, video); // validate before the slow voice step
  await generateVoiceover({ root, name, settings });

  let last = "";
  await renderVoiceVideo({
    root,
    name,
    title,
    ...videoOptions,
    onProgress: (p, format) => {
      const line = `🎬 ${FORMATS[format].label}: ${Math.floor(p * 10) * 10}%`;
      if (line !== last) console.log((last = line));
    },
  });
  for (const f of videoOptions.formats)
    console.log(`✅ out/${outputName(name, f)}.mp4 (${FORMATS[f].label})`);
};

main().catch((err: Error) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
