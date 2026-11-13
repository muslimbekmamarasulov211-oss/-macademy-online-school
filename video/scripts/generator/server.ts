/**
 * Uzbek TTS video generator — a small local web page.
 *
 *   npm run generator   →  http://localhost:3333
 *
 * Security:
 * - The Azure key stays in this server process (from .env). The browser never sees it.
 * - Listens on 127.0.0.1 only, so other devices on the network cannot use your key.
 * - Cross-site requests are rejected; inputs are validated; only out/<name>.mp4 is served.
 */
import { createReadStream } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import type { VoiceoverData } from "../../src/types";
import { checkEnvFileSafety, describeSpeechEnv, loadSpeechEnv } from "../lib/env";
import {
  EMOTIONS,
  isNavoiyInstalled,
  listReferenceVoices,
  NavoiyWorker,
  resolveReference,
} from "../lib/navoiy-tts";
import {
  generateVoiceover,
  MAX_TEXT_LENGTH,
  NAME_RE,
  saveText,
  toVoiceSettings,
  validateName,
  type VoiceSettings,
} from "../lib/pipeline";
import {
  FORMATS,
  listMusic,
  outputName,
  renderVoiceVideo,
  toVideoOptions,
  type VideoFormat,
  type VideoOptions,
} from "../lib/render";

const ROOT = process.cwd(); // npm scripts run from the video/ folder
const HOST = "127.0.0.1";
const PORT = Number(process.env.GENERATOR_PORT || 3333);
const STATIC_DIR = path.join(ROOT, "scripts", "generator");

type Job = {
  id: string;
  name: string;
  state: "voice" | "render" | "done" | "error";
  voiceProgress: number; // 0..1 of the voice step
  progress: number; // 0..1 of the render step
  videoRequested: boolean;
  timing?: VoiceoverData["timing"];
  audioFile?: string; // e.g. "voiceover/dars-1.wav"
  renderingFormat?: VideoFormat;
  /** Finished videos: file name in out/ (without .mp4) + format. */
  outputs: { file: string; format: VideoFormat; label: string }[];
  error?: string;
};

const jobs = new Map<string, Job>();
let busy = false;
let currentJobId: string | null = null;
// One Navoiy worker for the whole server: the model is loaded once and reused.
const navoiy = new NavoiyWorker(ROOT);

const isAzureConfigured = () => {
  try {
    loadSpeechEnv();
    return true;
  } catch {
    return false;
  }
};

const send = (res: http.ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
};

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'self'; style-src 'self' 'unsafe-inline'; media-src 'self'; img-src 'self' data:",
};

const readJsonBody = (req: http.IncomingMessage, limit = 64 * 1024): Promise<unknown> =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("Request too large."));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
    req.on("error", reject);
  });

/**
 * Block cross-site requests (CSRF). The page sends a custom header and JSON; another website
 * cannot add a custom header without a CORS preflight, which this server never approves.
 * (Unlike an Origin/Host comparison this also works behind a preview proxy.)
 */
const CSRF_HEADER = "x-macademy-generator";
const isTrustedRequest = (req: http.IncomingMessage) =>
  req.headers[CSRF_HEADER] === "1" &&
  (req.headers["content-type"] ?? "").startsWith("application/json");

const timestampName = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `video-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

const runJob = async (
  job: Job,
  settings: VoiceSettings,
  title: string | null,
  video: VideoOptions,
) => {
  try {
    const data = await generateVoiceover({
      root: ROOT,
      name: job.name,
      settings,
      navoiy,
      onProgress: (p) => (job.voiceProgress = p),
    });
    job.voiceProgress = 1;
    job.timing = data.timing;
    job.audioFile = data.audioFile;
    if (!job.videoRequested) {
      job.state = "done";
      return;
    }
    job.state = "render";
    await renderVoiceVideo({
      root: ROOT,
      name: job.name,
      title,
      ...video,
      onProgress: (p, format) => {
        job.progress = p;
        job.renderingFormat = format;
      },
    });
    job.outputs = video.formats.map((format) => ({
      file: outputName(job.name, format),
      format,
      label: FORMATS[format].label,
    }));
    job.progress = 1;
    job.state = "done";
  } catch (err) {
    job.state = "error";
    job.error = (err as Error).message;
    console.error(`❌ ${job.name}: ${job.error}`);
  } finally {
    busy = false;
  }
};

const createJob = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  if (!isTrustedRequest(req)) return send(res, 403, { error: "Cross-site request blocked." });
  if (busy) return send(res, 409, { error: "Another video is being generated. Please wait." });

  const body = (await readJsonBody(req)) as Record<string, unknown>;
  const text = typeof body.text === "string" ? body.text : "";
  const videoRequested = body.video !== false;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const title =
    typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 80) : null;
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim().toLowerCase()
      : timestampName();

  if (text.trim().length === 0)
    return send(res, 400, { error: "Matn kiriting (enter some text)." });
  if (text.length > MAX_TEXT_LENGTH)
    return send(res, 400, { error: `Max ${MAX_TEXT_LENGTH} characters.` });
  let settings: VoiceSettings;
  let video: VideoOptions;
  try {
    validateName(name);
    video = toVideoOptions(ROOT, {
      formats: body.formats,
      music: body.music,
      musicVolume: body.musicVolume,
    });
    settings = toVoiceSettings({
      engine: str(body.engine),
      voice: str(body.voice),
      emotion: str(body.emotion),
      reference: str(body.reference),
      rate: Number(body.rate ?? 0),
      format: str(body.format),
    });
    // Fail fast with a clear message if the chosen engine is not ready.
    if (settings.engine === "azure") loadSpeechEnv();
    else {
      if (!isNavoiyInstalled(ROOT))
        throw new Error("Navoiy TTS oʻrnatilmagan. Run: npm run navoiy:setup");
      resolveReference(ROOT, settings.reference);
    }
  } catch (err) {
    return send(res, 400, { error: (err as Error).message });
  }

  await saveText(ROOT, name, text);
  const job: Job = {
    id: crypto.randomUUID(),
    name,
    state: "voice",
    voiceProgress: 0,
    progress: 0,
    videoRequested,
    outputs: [],
  };
  jobs.set(job.id, job);
  busy = true;
  currentJobId = job.id;
  void runJob(job, settings, title, video);
  send(res, 202, job);
};

const MEDIA = {
  mp4: { dir: "out", ext: "mp4", type: "video/mp4" },
  wav: { dir: path.join("public", "voiceover"), ext: "wav", type: "audio/wav" },
  mp3: { dir: path.join("public", "voiceover"), ext: "mp3", type: "audio/mpeg" },
  music: { dir: path.join("public", "music"), ext: "mp3", type: "audio/mpeg" },
} as const;

/** URL → media file: /videos/<n>.mp4, /audio/<n>.wav|mp3 (voiceover), /music/<n>.mp3. */
const matchMedia = (pathname: string): { name: string; kind: keyof typeof MEDIA } | null => {
  let m = /^\/videos\/([^/]+)\.mp4$/.exec(pathname);
  if (m) return { name: m[1], kind: "mp4" };
  m = /^\/audio\/([^/]+)\.(wav|mp3)$/.exec(pathname);
  if (m) return { name: m[1], kind: m[2] as "wav" | "mp3" };
  m = /^\/music\/([^/]+)\.mp3$/.exec(pathname);
  if (m) return { name: m[1], kind: "music" };
  return null;
};

/** Serve out/<name>.mp4 or public/voiceover/<name>.wav|mp3 with HTTP Range support (Safari / iPad). */
const serveMedia = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  name: string,
  ext: keyof typeof MEDIA,
) => {
  if (!NAME_RE.test(name)) return send(res, 404, { error: "Not found" });
  const file = path.join(ROOT, MEDIA[ext].dir, `${name}.${MEDIA[ext].ext}`);
  let size: number;
  try {
    size = (await stat(file)).size;
  } catch {
    return send(res, 404, { error: "Not found" });
  }
  const headers: http.OutgoingHttpHeaders = {
    "Content-Type": MEDIA[ext].type,
    "Accept-Ranges": "bytes",
    ...securityHeaders,
  };
  if (new URL(req.url ?? "/", "http://x").searchParams.has("download")) {
    headers["Content-Disposition"] = `attachment; filename="${name}.${MEDIA[ext].ext}"`;
  }
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) {
      res.writeHead(416, { "Content-Range": `bytes */${size}` });
      return res.end();
    }
    res.writeHead(206, {
      ...headers,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": end - start + 1,
    });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...headers, "Content-Length": size });
  createReadStream(file).pipe(res);
};

const listVideos = async () => {
  try {
    const files = (await readdir(path.join(ROOT, "out"))).filter((f) => f.endsWith(".mp4"));
    const items = await Promise.all(
      files.map(async (f) => ({
        name: f.slice(0, -4),
        mtime: (await stat(path.join(ROOT, "out", f))).mtimeMs,
      })),
    );
    return items
      .filter((i) => NAME_RE.test(i.name))
      .sort((a, b) => b.mtime - a.mtime)
      .map((i) => i.name);
  } catch {
    return [];
  }
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/app.js")) {
      const file = url.pathname === "/" ? "index.html" : "app.js";
      const type = file.endsWith(".html")
        ? "text/html; charset=utf-8"
        : "text/javascript; charset=utf-8";
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store", ...securityHeaders });
      return res.end(await readFile(path.join(STATIC_DIR, file)));
    }
    if (req.method === "GET" && url.pathname === "/api/status") {
      const navoiyInstalled = isNavoiyInstalled(ROOT);
      return send(res, 200, {
        navoiyInstalled,
        azureConfigured: isAzureConfigured(),
        busy,
        currentJobId: busy ? currentJobId : null,
        emotions: Object.keys(EMOTIONS),
        referenceVoices: navoiyInstalled ? listReferenceVoices(ROOT) : [],
        music: listMusic(ROOT),
        formats: Object.entries(FORMATS).map(([id, f]) => ({ id, label: f.label, size: f.size })),
        videos: await listVideos(),
      });
    }
    if (req.method === "POST" && url.pathname === "/api/jobs") return await createJob(req, res);
    const jobMatch = /^\/api\/jobs\/([0-9a-f-]{36})$/.exec(url.pathname);
    if (req.method === "GET" && jobMatch) {
      const job = jobs.get(jobMatch[1]);
      return job ? send(res, 200, job) : send(res, 404, { error: "Not found" });
    }
    const media = matchMedia(url.pathname);
    if ((req.method === "GET" || req.method === "HEAD") && media)
      return await serveMedia(req, res, media.name, media.kind);
    send(res, 404, { error: "Not found" });
  } catch (err) {
    send(res, 500, { error: (err as Error).message });
  }
});

server.listen(PORT, HOST, () => {
  if (isNavoiyInstalled(ROOT)) {
    console.log("Navoiy TTS: installed — loading the model in the background…");
    navoiy.start().catch((err: Error) => console.error(`❌ ${err.message}`));
  } else {
    console.log("Navoiy TTS: not installed (run: npm run navoiy:setup)");
  }
  console.log("Azure Speech settings (optional):");
  for (const line of describeSpeechEnv()) console.log(`  ${line}`);
  for (const w of checkEnvFileSafety(ROOT)) console.warn(`⚠️  ${w}`);
  console.log(`\n🎙  Uzbek video generator: http://localhost:${PORT}\n`);
});
