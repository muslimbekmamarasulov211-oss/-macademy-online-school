import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";

/**
 * Navoiy TTS — free local Uzbek TTS (CosyVoice2 + Navoiy checkpoint, Apache-2.0).
 * The Python worker (tts/navoiy_worker.py) loads the model once and then handles jobs,
 * so only the first video pays the model loading time.
 */

/** Emotion presets of the Navoiy checkpoint (emotions_40h.json). */
export const EMOTIONS = {
  xotirjam: "calm",
  xursand: "happy",
  gamgin: "sad",
  jahldor: "angry",
  qorqqan: "scared",
  hayratda: "surprised",
  pichirlab: "whispers",
  mehribon: "warm",
  charchagan: "tired",
  kinoyali: "sarcastic",
} as const;
export type EmotionKey = keyof typeof EMOTIONS;

export const navoiyPaths = (root: string) => {
  const home = process.env.NAVOIY_HOME || path.join(root, ".navoiy");
  return {
    home,
    python: path.join(home, "venv", "bin", "python"),
    worker: path.join(root, "tts", "navoiy_worker.py"),
    checkpoint: path.join(home, "models", "navoiy-tts", "emotion_600h_joint.pt"),
    baseModel: path.join(home, "models", "CosyVoice2-0.5B", "cosyvoice2.yaml"),
    cosyvoice: path.join(home, "CosyVoice", "cosyvoice"),
    defaultReference: path.join(home, "CosyVoice", "asset", "zero_shot_prompt.wav"),
    voicesDir: path.join(root, "tts", "voices"),
  };
};

export const isNavoiyInstalled = (root: string) => {
  const p = navoiyPaths(root);
  return [p.python, p.checkpoint, p.baseModel, p.cosyvoice, p.defaultReference].every((f) =>
    existsSync(f),
  );
};

const VOICE_NAME_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;
/** Reference voice used when the user has not added their own. */
export const DEFAULT_REFERENCE = "namuna";

/** Reference voices: "namuna" (CosyVoice sample) + your own recordings in tts/voices/<name>.wav. */
export const listReferenceVoices = (root: string): string[] => {
  const own = existsSync(navoiyPaths(root).voicesDir)
    ? readdirSync(navoiyPaths(root).voicesDir)
        .filter((f) => f.endsWith(".wav"))
        .map((f) => f.slice(0, -4))
        .filter((n) => VOICE_NAME_RE.test(n) && n !== DEFAULT_REFERENCE)
    : [];
  return [DEFAULT_REFERENCE, ...own.sort()];
};

export const resolveReference = (root: string, name: string) => {
  const p = navoiyPaths(root);
  if (name === DEFAULT_REFERENCE) return p.defaultReference;
  if (!VOICE_NAME_RE.test(name)) throw new Error(`Invalid voice name "${name}".`);
  const file = path.join(p.voicesDir, `${name}.wav`);
  if (!existsSync(file)) throw new Error(`Reference voice tts/voices/${name}.wav not found.`);
  return file;
};

type Pending = {
  resolve: (r: NavoiyResult) => void;
  reject: (e: Error) => void;
  onProgress?: (p: number) => void;
};
export type NavoiyResult = { durationMs: number; segments: { startMs: number; endMs: number }[] };

export class NavoiyWorker {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private ready: Promise<void> | null = null;
  /** For the UI: is the model loaded? */
  state: "idle" | "loading" | "ready" | "error" = "idle";
  private pending = new Map<string, Pending>();
  private nextId = 1;
  private stderrTail: string[] = [];

  constructor(private root: string) {}

  /** Start the Python worker (once) and wait until the model is loaded. */
  start(): Promise<void> {
    if (this.ready) return this.ready;
    if (!isNavoiyInstalled(this.root)) {
      return Promise.reject(new Error("Navoiy TTS is not installed. Run: npm run navoiy:setup"));
    }
    const p = navoiyPaths(this.root);
    this.state = "loading";
    this.ready = new Promise((resolve, reject) => {
      console.log("🧠 Loading Navoiy TTS model (first time takes ~20–60 s)…");
      const proc = spawn(p.python, [p.worker], {
        cwd: this.root,
        env: { ...process.env, NAVOIY_HOME: p.home, PYTHONUNBUFFERED: "1" },
      });
      this.proc = proc;
      proc.stderr.on("data", (d: Buffer) => {
        const lines = d
          .toString("utf8")
          .split("\n")
          .filter((l) => l.trim());
        this.stderrTail.push(...lines);
        this.stderrTail = this.stderrTail.slice(-20);
        for (const l of lines) if (/^sentence \d+\/\d+|loaded in/.test(l)) console.log(`   ${l}`);
      });
      createInterface({ input: proc.stdout }).on("line", (line) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(line);
        } catch {
          return;
        }
        if (msg.ready) {
          this.state = "ready";
          return resolve();
        }
        const job = this.pending.get(String(msg.id));
        if (!job) return;
        if (typeof msg.progress === "number") return job.onProgress?.(msg.progress);
        this.pending.delete(String(msg.id));
        if (msg.ok) job.resolve(msg as unknown as NavoiyResult);
        else job.reject(new Error(`Navoiy TTS: ${String(msg.error)}`));
      });
      proc.on("exit", (code) => {
        const err = new Error(
          `Navoiy TTS worker stopped (code ${code}).\n${this.stderrTail.slice(-5).join("\n")}`,
        );
        this.state = "error";
        reject(err);
        for (const job of this.pending.values()) job.reject(err);
        this.pending.clear();
        this.proc = null;
        this.ready = null;
      });
    });
    return this.ready;
  }

  async synthesize(job: {
    sentences: string[];
    emotion: EmotionKey;
    reference: string;
    speed: number;
    out: string;
    onProgress?: (p: number) => void;
  }): Promise<NavoiyResult> {
    await this.start();
    const id = String(this.nextId++);
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onProgress: job.onProgress });
      this.proc!.stdin.write(
        JSON.stringify({
          id,
          sentences: job.sentences,
          emotion: EMOTIONS[job.emotion],
          reference: job.reference,
          speed: job.speed,
          out: job.out,
        }) + "\n",
      );
    });
  }

  stop() {
    this.state = "idle";
    this.proc?.stdin.end();
    this.proc = null;
    this.ready = null;
  }
}
