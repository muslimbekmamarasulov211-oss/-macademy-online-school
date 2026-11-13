#!/usr/bin/env node
/**
 * html-3d-video renderer — turns an HTML animation into an MP4, frame by frame.
 *
 * The page is never "played" in real time. For every frame the renderer calls
 * `window.renderFrame(t)` (t = seconds), seeks all CSS/Web Animations to the same
 * time, takes a lossless screenshot and pipes it to FFmpeg. Result: every frame is
 * exact and the video never stutters, however heavy the scene is.
 *
 * Usage:
 *   node render.mjs <scene.html> <out.mp4> [options]
 *   node render.mjs <scene.html> --stills 0,2.5,6 [--out-dir dir]   # preview PNGs
 *
 * Options:
 *   --fps <n>          frames per second            (default: SCENE.fps or 30)
 *   --width <px>       output width                 (default: SCENE.width or 1920)
 *   --height <px>      output height                (default: SCENE.height or 1080)
 *   --duration <s>     seconds to render            (default: SCENE.duration)
 *   --from <s>         start time                   (default: 0)
 *   --crf <n>          x264 quality, lower = better (default: 16)
 *   --preset <name>    x264 preset                  (default: slow)
 *   --audio <file>     mux an audio track (trimmed to the video length)
 *   --workers <n>      render in n parallel pages  (default: 1; try 2–4 on a GPU machine)
 *   --scale <f>        resolution multiplier, e.g. 0.5 for a fast draft (default: 1)
 *   --stills <list>    comma-separated times; writes PNGs instead of a video
 *   --out-dir <dir>    where --stills PNGs go       (default: next to the HTML)
 *
 * Page contract (see templates/scene-template.html):
 *   window.SCENE       = { duration, fps?, width?, height? }
 *   window.sceneReady  = Promise that resolves when assets/fonts/models are loaded
 *   window.renderFrame = (t) => void | Promise<void>   // draws the exact state at t
 *   window.__RENDER_MODE__ is set to true before any page script runs.
 *   window.__RENDER_SCALE__ is the --scale value; the scene renders at W*scale × H*scale.
 *
 * Network: requests for three.js from jsDelivr / unpkg are served from a local copy
 * (downloaded once with `npm pack`), so scenes render even where CDNs are blocked.
 * Other external files (e.g. Google Fonts) are fetched with curl and cached on disk.
 */
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// `require` (unlike `import`) honours NODE_PATH, so a globally installed Playwright works too.
const { chromium } = createRequire(import.meta.url)("playwright");

// ---------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
const positional = [];
const opts = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) opts[key] = true;
    else {
      opts[key] = next;
      i++;
    }
  } else positional.push(a);
}

const [inputArg, outputArg] = positional;
if (!inputArg || (!outputArg && !opts.stills) || opts.help) {
  console.log(
    "Usage: node render.mjs <scene.html> <out.mp4> [--fps 30] [--width 1920] [--height 1080]\n" +
      "                      [--duration s] [--from s] [--crf 16] [--preset slow] [--audio file]\n" +
      "       node render.mjs <scene.html> --stills 0,2.5,6 [--out-dir dir]",
  );
  process.exit(opts.help ? 0 : 1);
}

const inputPath = path.resolve(inputArg);
if (!fs.existsSync(inputPath)) fail(`Scene not found: ${inputPath}`);

function fail(msg) {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}

const num = (v, fallback) => (v === undefined || v === true ? fallback : Number(v));

// ---------------------------------------------------------------- local asset cache
const CACHE_DIR = path.join(os.homedir(), ".cache", "html-3d-video");
fs.mkdirSync(CACHE_DIR, { recursive: true });

const MIME = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".hdr": "application/octet-stream",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
  ".woff2": "font/woff2",
};

/** Ensures an npm package is unpacked in the cache and returns its directory. */
function ensureNpmPackage(name, version) {
  const dir = path.join(CACHE_DIR, `${name}@${version}`);
  const pkgDir = path.join(dir, "package");
  if (fs.existsSync(path.join(pkgDir, "package.json"))) return pkgDir;
  fs.mkdirSync(dir, { recursive: true });
  console.log(`↓ Downloading ${name}@${version} (one-time, cached in ${dir})`);
  const out = execFileSync(
    "npm",
    ["pack", `${name}@${version}`, "--pack-destination", dir, "--silent"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], shell: process.platform === "win32" },
  )
    .trim()
    .split("\n")
    .pop();
  execFileSync("tar", ["-xzf", path.join(dir, out), "-C", dir]);
  return pkgDir;
}

const CDN_PACKAGE =
  /^https:\/\/(?:cdn\.jsdelivr\.net\/npm|unpkg\.com)\/(@?[^@/]+(?:\/[^@/]+)?)@([^/]+)\/(.+)$/;

function fetchWithCurl(url) {
  const key = createHash("sha1").update(url).digest("hex");
  const file = path.join(CACHE_DIR, "http", key);
  const meta = `${file}.type`;
  if (fs.existsSync(file) && fs.existsSync(meta)) {
    return { body: fs.readFileSync(file), contentType: fs.readFileSync(meta, "utf8") };
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const ua =
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
  const contentType = execFileSync(
    "curl",
    ["-sSLf", "--max-time", "60", "-A", ua, "-o", file, "-w", "%{content_type}", url],
    { encoding: "utf8" },
  ).trim();
  fs.writeFileSync(meta, contentType || "application/octet-stream");
  return { body: fs.readFileSync(file), contentType: contentType || "application/octet-stream" };
}

async function handleRoute(route) {
  const url = route.request().url();
  if (!/^https?:/.test(url)) return route.continue();
  try {
    const m = url.split("?")[0].match(CDN_PACKAGE);
    if (m) {
      const [, name, version, rest] = m;
      const pkgDir = ensureNpmPackage(name, version);
      const file = path.join(pkgDir, rest);
      if (fs.existsSync(file)) {
        return route.fulfill({
          status: 200,
          body: fs.readFileSync(file),
          contentType: MIME[path.extname(file)] ?? "application/octet-stream",
          headers: { "access-control-allow-origin": "*" },
        });
      }
    }
    const { body, contentType } = fetchWithCurl(url);
    return route.fulfill({
      status: 200,
      body,
      contentType,
      headers: { "access-control-allow-origin": "*" },
    });
  } catch (err) {
    console.warn(`⚠ Could not load ${url}: ${err.message.split("\n")[0]}`);
    return route.abort();
  }
}

// ---------------------------------------------------------------- browser
const browser = await chromium.launch({
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-gpu-rasterization",
    "--allow-file-access-from-files",
    "--font-render-hinting=none",
    "--force-color-profile=srgb",
  ],
});

// Read SCENE first with a probe page so the viewport can match the scene exactly.
const SCALE = num(opts.scale, 1);

async function openPage(width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  await context.route("**/*", handleRoute);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.addInitScript((scale) => {
    window.__RENDER_MODE__ = true;
    window.__RENDER_SCALE__ = scale;
  }, SCALE);
  await page.goto(pathToFileURL(inputPath).href, { waitUntil: "load", timeout: 120_000 });
  try {
    await page.waitForFunction(() => typeof window.renderFrame === "function", null, {
      timeout: 60_000,
    });
  } catch {
    fail(
      `window.renderFrame(t) was never defined.\n  Page errors:\n  ${errors.join("\n  ") || "(none)"}`,
    );
  }
  await page.evaluate(async () => {
    await (window.sceneReady ?? Promise.resolve());
    await document.fonts.ready;
  });
  return { context, page, errors };
}

const probe = await openPage(1920, 1080);
const scene = await probe.page.evaluate(() => window.SCENE ?? {});
await probe.context.close();

const width = Math.round(num(opts.width, scene.width ?? 1920) * SCALE);
const height = Math.round(num(opts.height, scene.height ?? 1080) * SCALE);
const fps = num(opts.fps, scene.fps ?? 30);
const from = num(opts.from, 0);
const duration = num(opts.duration, (scene.duration ?? 0) - from);
if (!(duration > 0) && !opts.stills)
  fail("Duration unknown: set window.SCENE.duration or --duration");
if (width % 2 || height % 2) fail("Width and height must be even numbers (yuv420p).");

const errors = [];

/** Puts the page into the exact state of time t and waits until it is painted. */
async function seek(page, t) {
  await page.evaluate(async (time) => {
    for (const a of document.getAnimations()) {
      a.pause();
      a.currentTime = time * 1000;
    }
    await window.renderFrame(time);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, t);
}

const shoot = (page) =>
  page.screenshot({ type: "png", clip: { x: 0, y: 0, width, height }, animations: "allow" });

// ---------------------------------------------------------------- stills mode
if (opts.stills) {
  const outDir = path.resolve(opts["out-dir"] ?? path.dirname(inputPath));
  fs.mkdirSync(outDir, { recursive: true });
  const base = path.basename(inputPath, path.extname(inputPath));
  const { page, errors: pageErrors } = await openPage(width, height);
  const times = String(opts.stills)
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  for (const t of times) {
    await seek(page, t);
    const file = path.join(outDir, `${base}_still_${t.toFixed(2)}s.png`);
    fs.writeFileSync(file, await shoot(page));
    console.log(`✔ ${file}`);
  }
  errors.push(...pageErrors);
  reportErrors();
  await browser.close();
  process.exit(0);
}

// ---------------------------------------------------------------- video mode
const outputPath = path.resolve(outputArg);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const totalFrames = Math.round(duration * fps);
const workers = Math.max(1, Math.min(num(opts.workers, 1), totalFrames));
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "html-3d-video-"));

/** Runs FFmpeg and resolves when it exits successfully. */
function runFfmpeg(args, stdin = "ignore") {
  const proc = spawn("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], {
    stdio: [stdin, "inherit", "inherit"],
  });
  const done = new Promise((resolve, reject) => {
    proc.on("error", (e) => reject(new Error(`FFmpeg could not start: ${e.message}`)));
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg exit ${code}`))));
  });
  return { proc, done };
}

const x264 = [
  "-c:v",
  "libx264",
  "-preset",
  String(opts.preset ?? "slow"),
  "-crf",
  String(num(opts.crf, 16)),
  "-pix_fmt",
  "yuv420p",
  "-colorspace",
  "bt709",
  "-color_primaries",
  "bt709",
  "-color_trc",
  "bt709",
];

let framesDone = 0;
const started = Date.now();
function progress() {
  const elapsed = (Date.now() - started) / 1000;
  const eta = (elapsed / framesDone) * (totalFrames - framesDone);
  process.stdout.write(
    `\r  frame ${String(framesDone).padStart(5)}/${totalFrames}  ${((framesDone / totalFrames) * 100).toFixed(0).padStart(3)}%  ETA ${eta.toFixed(0)}s   `,
  );
}

/** Renders frames [first, last) into one H.264 segment. */
async function renderSegment(first, last, file) {
  const { context, page, errors: pageErrors } = await openPage(width, height);
  const { proc, done } = runFfmpeg(
    ["-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-", ...x264, file],
    "pipe",
  );
  for (let i = first; i < last; i++) {
    await seek(page, from + i / fps);
    const png = await shoot(page);
    if (!proc.stdin.write(png)) await new Promise((r) => proc.stdin.once("drain", r));
    framesDone++;
    if (framesDone % Math.max(1, Math.round(fps / 2)) === 0) progress();
  }
  proc.stdin.end();
  await done;
  errors.push(...pageErrors);
  await context.close();
}

console.log(
  `▶ Rendering ${totalFrames} frames · ${width}×${height} · ${fps} fps · ${duration.toFixed(2)} s · ${workers} worker(s)`,
);
const per = Math.ceil(totalFrames / workers);
const segments = [];
const jobs = [];
for (let w = 0; w < workers; w++) {
  const first = w * per;
  const last = Math.min(totalFrames, first + per);
  if (first >= last) break;
  const file = path.join(tmpDir, `seg${String(w).padStart(3, "0")}.mp4`);
  segments.push(file);
  jobs.push(renderSegment(first, last, file));
}
try {
  await Promise.all(jobs);
  progress();
  // Join segments (stream copy — no re-encode) and mux the optional audio track.
  const list = path.join(tmpDir, "segments.txt");
  fs.writeFileSync(list, segments.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n"));
  const args = ["-f", "concat", "-safe", "0", "-i", list];
  if (opts.audio) args.push("-i", path.resolve(opts.audio));
  args.push("-map", "0:v", "-c:v", "copy");
  if (opts.audio) args.push("-map", "1:a", "-c:a", "aac", "-b:a", "192k", "-t", String(duration));
  args.push("-movflags", "+faststart", outputPath);
  await runFfmpeg(args).done;
} finally {
  await browser.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

const size = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
console.log(`\n✔ ${outputPath} (${size} MB, ${((Date.now() - started) / 1000).toFixed(0)} s)`);
reportErrors();

function reportErrors() {
  if (errors.length) {
    console.warn(`⚠ ${errors.length} page error(s) — check the scene:\n  ${errors.join("\n  ")}`);
  }
}
