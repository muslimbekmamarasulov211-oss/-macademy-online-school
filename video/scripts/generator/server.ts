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
import type { VoiceKey } from "../lib/azure-tts";
import { checkEnvFileSafety, describeSpeechEnv, loadSpeechEnv } from "../lib/env";
import {
  generateVoiceover,
  MAX_TEXT_LENGTH,
  NAME_RE,
  saveText,
  validateOptions,
} from "../lib/pipeline";
import { renderVoiceVideo } from "../lib/render";

const ROOT = process.cwd(); // npm scripts run from the video/ folder
const HOST = "127.0.0.1";
const PORT = Number(process.env.GENERATOR_PORT || 3333);
const STATIC_DIR = path.join(ROOT, "scripts", "generator");

type Job = {
  id: string;
  name: string;
  state: "voice" | "render" | "done" | "error";
  progress: number; // 0..1 of the render step
  timing?: "word-boundary" | "estimated";
  error?: string;
};

const jobs = new Map<string, Job>();
let busy = false;

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

/** Block cross-site form posts (CSRF): Origin, when present, must match Host. */
const sameOrigin = (req: http.IncomingMessage) => {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
};

const timestampName = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `video-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

const runJob = async (job: Job, voice: VoiceKey, rate: number, title: string | null) => {
  try {
    const data = await generateVoiceover({ root: ROOT, name: job.name, voice, rate });
    job.timing = data.timing;
    job.state = "render";
    await renderVoiceVideo({
      root: ROOT,
      name: job.name,
      title,
      onProgress: (p) => (job.progress = p),
    });
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
  if (!sameOrigin(req)) return send(res, 403, { error: "Cross-site request blocked." });
  if (busy) return send(res, 409, { error: "Another video is being generated. Please wait." });

  const body = (await readJsonBody(req)) as Record<string, unknown>;
  const text = typeof body.text === "string" ? body.text : "";
  const voice = String(body.voice ?? "madina") as VoiceKey;
  const rate = Number(body.rate ?? 0);
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
  try {
    validateOptions({ name, voice, rate });
    loadSpeechEnv(); // fail fast with a clear message if the key is not configured
  } catch (err) {
    return send(res, 400, { error: (err as Error).message });
  }

  await saveText(ROOT, name, text);
  const job: Job = { id: crypto.randomUUID(), name, state: "voice", progress: 0 };
  jobs.set(job.id, job);
  busy = true;
  void runJob(job, voice, rate, title);
  send(res, 202, job);
};

/** Serve out/<name>.mp4 with HTTP Range support (required by Safari / iPad video). */
const serveVideo = async (req: http.IncomingMessage, res: http.ServerResponse, name: string) => {
  if (!NAME_RE.test(name)) return send(res, 404, { error: "Not found" });
  const file = path.join(ROOT, "out", `${name}.mp4`);
  let size: number;
  try {
    size = (await stat(file)).size;
  } catch {
    return send(res, 404, { error: "Not found" });
  }
  const headers: http.OutgoingHttpHeaders = {
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
    ...securityHeaders,
  };
  if (new URL(req.url ?? "/", "http://x").searchParams.has("download")) {
    headers["Content-Disposition"] = `attachment; filename="${name}.mp4"`;
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
      let configured = true;
      try {
        loadSpeechEnv();
      } catch {
        configured = false;
      }
      return send(res, 200, { configured, busy, videos: await listVideos() });
    }
    if (req.method === "POST" && url.pathname === "/api/jobs") return await createJob(req, res);
    const jobMatch = /^\/api\/jobs\/([0-9a-f-]{36})$/.exec(url.pathname);
    if (req.method === "GET" && jobMatch) {
      const job = jobs.get(jobMatch[1]);
      return job ? send(res, 200, job) : send(res, 404, { error: "Not found" });
    }
    const videoMatch = /^\/videos\/([^/]+)\.mp4$/.exec(url.pathname);
    if ((req.method === "GET" || req.method === "HEAD") && videoMatch)
      return await serveVideo(req, res, videoMatch[1]);
    send(res, 404, { error: "Not found" });
  } catch (err) {
    send(res, 500, { error: (err as Error).message });
  }
});

server.listen(PORT, HOST, () => {
  console.log("Azure Speech settings:");
  for (const line of describeSpeechEnv()) console.log(`  ${line}`);
  for (const w of checkEnvFileSafety(ROOT)) console.warn(`⚠️  ${w}`);
  console.log(`\n🎙  Uzbek video generator: http://localhost:${PORT}\n`);
});
