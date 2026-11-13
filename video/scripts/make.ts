/**
 * One command: Uzbek text → AI voice → synced subtitles → MP4.
 *
 *   npm run make -- <name> [--engine navoiy|azure] [--emotion xursand] [--title "Sarlavha"]
 *   (all options: see USAGE in scripts/lib/pipeline.ts)
 *
 * Reads texts/<name>.txt, writes out/<name>.mp4 (1080x1920).
 */
import { generateVoiceover, parseCliArgs } from "./lib/pipeline";
import { renderVoiceVideo } from "./lib/render";

const main = async () => {
  const root = process.cwd(); // npm scripts run from the video/ folder
  const { name, settings, title } = parseCliArgs(process.argv.slice(2));
  await generateVoiceover({ root, name, settings });

  console.log(`🎬 Rendering out/${name}.mp4 …`);
  let last = -1;
  await renderVoiceVideo({
    root,
    name,
    title,
    onProgress: (p) => {
      const pct = Math.floor(p * 10) * 10;
      if (pct !== last) {
        last = pct;
        console.log(`   ${pct}%`);
      }
    },
  });
  console.log(`✅ Done: out/${name}.mp4`);
};

main().catch((err: Error) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
