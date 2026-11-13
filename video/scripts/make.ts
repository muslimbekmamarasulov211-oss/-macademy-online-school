/**
 * One command: Uzbek text → AI voice → synced subtitles → MP4.
 *
 *   npm run make -- <name> [--voice madina|sardor] [--rate -10] [--title "Sarlavha"]
 *
 * Output: out/<name>.mp4 (1080x1920)
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { generateVoiceover, parseArgs } from "./voice";

// npm scripts always run from the video/ folder.
const ROOT = process.cwd();

const main = async () => {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const titleIdx = argv.indexOf("--title");
  const title = titleIdx >= 0 ? argv[titleIdx + 1] : null;

  await generateVoiceover(args);

  const props = JSON.stringify({ name: args.name, title, musicSrc: null, backgroundClipSrc: null });
  const extra = process.env.REMOTION_BROWSER_EXECUTABLE
    ? [`--browser-executable=${process.env.REMOTION_BROWSER_EXECUTABLE}`]
    : [];
  console.log(`🎬 Rendering out/${args.name}.mp4 …`);
  const r = spawnSync(
    "npx",
    ["remotion", "render", "VoiceVideo", `out/${args.name}.mp4`, `--props=${props}`, ...extra],
    { cwd: ROOT, stdio: "inherit" },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log(`✅ Done: out/${args.name}.mp4`);
};

main().catch((err: Error) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
