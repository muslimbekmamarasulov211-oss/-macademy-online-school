/* Frame renderer: drives render/index.html in headless Chromium (Playwright),
 * renders every frame deterministically and pipes JPEG frames into ffmpeg.
 *
 *   node render/render.cjs                      full render -> build/video_silent.mp4
 *   node render/render.cjs --workers 4          parallel chunks (default: CPU count)
 *   node render/render.cjs --preview 3,12.5,40  stills -> build/preview/t<sec>.jpg
 */
"use strict";
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BUILD = path.join(ROOT, "build");
const timeline = JSON.parse(fs.readFileSync(path.join(BUILD, "timeline.json"), "utf8"));
const FPS = timeline.fps;
const TOTAL = Math.round(timeline.duration * FPS); // 59 s * 30 = 1770 frames

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
}

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.addInitScript((tl) => {
    window.TIMELINE = tl;
  }, timeline);
  await page.goto("file://" + path.join(__dirname, "index.html"));
  await page.evaluate(() => window.ready);
  return page;
}

const decode = (dataUrl) => Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");

async function preview(times) {
  const browser = await chromium.launch();
  const page = await openPage(browser);
  const dir = path.join(BUILD, "preview");
  fs.mkdirSync(dir, { recursive: true });
  for (const t of times) {
    const buf = decode(await page.evaluate((tt) => window.frame(tt, 0.9), t));
    fs.writeFileSync(path.join(dir, `t${t.toFixed(2)}.jpg`), buf);
  }
  await browser.close();
}

async function renderChunk(browser, from, to, out) {
  const page = await openPage(browser);
  const ff = spawn(
    "ffmpeg",
    ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
     "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p", "-r", String(FPS), out],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  for (let f = from; f < to; f++) {
    const buf = decode(await page.evaluate((tt) => window.frame(tt, 0.96), f / FPS));
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if ((f - from) % 60 === 0) console.log(`  chunk ${path.basename(out)}: frame ${f}/${to}`);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg " + c)))));
  await page.close();
}

async function full() {
  const workers = Number(arg("--workers", Math.max(1, os.cpus().length)));
  const browser = await chromium.launch();
  const per = Math.ceil(TOTAL / workers);
  const chunks = [];
  for (let i = 0; i < workers; i++) {
    const from = i * per;
    const to = Math.min(TOTAL, from + per);
    if (from < to) chunks.push({ from, to, out: path.join(BUILD, `chunk_${i}.mp4`) });
  }
  const t0 = Date.now();
  await Promise.all(chunks.map((c) => renderChunk(browser, c.from, c.to, c.out)));
  await browser.close();
  const list = path.join(BUILD, "chunks.txt");
  fs.writeFileSync(list, chunks.map((c) => `file '${c.out}'`).join("\n"));
  await new Promise((res, rej) => {
    const p = spawn("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy",
      path.join(BUILD, "video_silent.mp4")], { stdio: "inherit" });
    p.on("close", (c) => (c === 0 ? res() : rej(new Error("concat " + c))));
  });
  console.log(`rendered ${TOTAL} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

(async () => {
  const pv = arg("--preview");
  if (pv) await preview(pv.split(",").map(Number));
  else await full();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
