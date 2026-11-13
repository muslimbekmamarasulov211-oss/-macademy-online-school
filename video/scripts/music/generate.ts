/**
 * Generates original, royalty-free background music loops with a tiny built-in synthesizer.
 * No samples, no third-party music — the output belongs to this project.
 *
 *   npm run music:generate
 *
 * Writes public/music/<id>.mp3 (seamless loops: chords, bass, arpeggio, optional drums).
 */
import { spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const SR = 44100;

type Track = {
  id: string;
  bpm: number;
  bars: number;
  /** One chord per bar, as MIDI note numbers (repeats to fill `bars`). */
  chords: number[][];
  arp: boolean;
  drums: boolean;
  brightness: number; // 0..1, low-pass amount for the pad
};

export const TRACKS: Track[] = [
  // Cmaj7 – Am7 – Fmaj7 – G6: calm, warm
  {
    id: "tinch",
    bpm: 70,
    bars: 16,
    chords: [
      [48, 52, 55, 59],
      [45, 52, 55, 60],
      [41, 48, 52, 57],
      [43, 50, 52, 59],
    ],
    arp: false,
    drums: false,
    brightness: 0.25,
  },
  // Am – F – C – G: hopeful, inspiring
  {
    id: "ilhom",
    bpm: 88,
    bars: 24,
    chords: [
      [45, 52, 57, 60],
      [41, 48, 53, 57],
      [48, 55, 60, 64],
      [43, 50, 55, 59],
    ],
    arp: true,
    drums: false,
    brightness: 0.4,
  },
  // Em – C – G – D: energetic, with soft drums
  {
    id: "energiya",
    bpm: 108,
    bars: 32,
    chords: [
      [40, 47, 52, 55],
      [36, 43, 48, 52],
      [43, 50, 55, 59],
      [38, 45, 50, 54],
    ],
    arp: true,
    drums: true,
    brightness: 0.55,
  },
];

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** Deterministic pseudo-random numbers (same music every run). */
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};

const renderDry = (t: Track): Float32Array => {
  const beat = 60 / t.bpm;
  const bar = beat * 4;
  const n = Math.round(t.bars * bar * SR);
  const out = new Float32Array(n);
  const rand = rng(t.id.length * 7919);

  for (let b = 0; b < t.bars; b++) {
    const chord = t.chords[b % t.chords.length];
    const start = Math.round(b * bar * SR);
    const len = Math.round(bar * SR);

    // Pad: soft additive saw (6 harmonics), two detuned voices, slow attack/release.
    // The note rings 30% into the next bar (wraps around the loop end) for smooth changes.
    const padLen = Math.round(len * 1.3);
    for (const note of chord) {
      const f = hz(note + 12);
      for (const detune of [-0.12, 0.12]) {
        const fd = f * 2 ** (detune / 12);
        for (let i = 0; i < padLen; i++) {
          const env = Math.min(1, i / (0.6 * SR)) * Math.min(1, (padLen - i) / (0.5 * SR));
          let s = 0;
          for (let h = 1; h <= 6; h++)
            s += Math.sin((2 * Math.PI * fd * h * i) / SR) / (h * (1 + (1 - t.brightness) * h));
          out[(start + i) % n] += s * env * 0.045;
        }
      }
    }

    // Bass: sine root, plucked on beats 1 and 3.
    for (const beatIdx of [0, 2]) {
      const s0 = start + Math.round(beatIdx * beat * SR);
      const f = hz(chord[0] - 12);
      const l = Math.round(beat * 1.8 * SR);
      for (let i = 0; i < l; i++) {
        const env = Math.min(1, i / 400) * Math.exp(-i / (0.7 * SR));
        out[(s0 + i) % n] += Math.sin((2 * Math.PI * f * i) / SR) * env * 0.22;
      }
    }

    // Arpeggio: eighth notes over the chord, an octave up, short pluck.
    if (t.arp) {
      for (let k = 0; k < 8; k++) {
        const note = chord[[0, 1, 2, 3, 2, 1, 2, 3][k]] + 24;
        const s0 = start + Math.round((k * beat * SR) / 2);
        const f = hz(note);
        const l = Math.round(beat * SR);
        for (let i = 0; i < l; i++) {
          const env = Math.min(1, i / 200) * Math.exp(-i / (0.18 * SR));
          const s =
            Math.sin((2 * Math.PI * f * i) / SR) + 0.3 * Math.sin((4 * Math.PI * f * i) / SR);
          out[(s0 + i) % n] += s * env * 0.05;
        }
      }
    }

    // Drums: soft kick on every beat, closed hi-hat on off-beats.
    if (t.drums) {
      for (let k = 0; k < 4; k++) {
        const s0 = start + Math.round(k * beat * SR);
        let phase = 0;
        for (let i = 0; i < 0.35 * SR; i++) {
          const f = 45 + 75 * Math.exp(-i / (0.03 * SR));
          phase += (2 * Math.PI * f) / SR;
          out[(s0 + i) % n] += Math.sin(phase) * Math.exp(-i / (0.09 * SR)) * 0.35;
        }
        const h0 = s0 + Math.round((beat * SR) / 2);
        let prev = 0;
        for (let i = 0; i < 0.05 * SR; i++) {
          const noise = rand() * 2 - 1;
          const hp = noise - prev; // crude high-pass
          prev = noise;
          out[(h0 + i) % n] += hp * Math.exp(-i / (0.012 * SR)) * 0.025;
        }
      }
    }
  }
  return out;
};

/** Simple stereo-less reverb (4 feedback combs). Run over two loop passes and keep the
 *  second one, so the reverb tail wraps around and the loop is seamless. */
const reverb = (dry: Float32Array, mix = 0.28) => {
  const n = dry.length;
  const delays = [1557, 1617, 1491, 1422].map((d) => Math.round((d * SR) / 25000));
  const bufs = delays.map((d) => new Float32Array(d));
  const idx = delays.map(() => 0);
  const out = new Float32Array(n);
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      let wet = 0;
      for (let c = 0; c < bufs.length; c++) {
        const y = bufs[c][idx[c]];
        bufs[c][idx[c]] = dry[i] + y * 0.78;
        idx[c] = (idx[c] + 1) % delays[c];
        wet += y;
      }
      if (pass === 1) out[i] = dry[i] * (1 - mix) + (wet / bufs.length) * mix;
    }
  }
  return out;
};

const toWav = (samples: Float32Array) => {
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const gain = peak > 0 ? 0.8 / peak : 1;
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) =>
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s * gain)) * 32767), 44 + i * 2),
  );
  return buf;
};

const main = async () => {
  const root = process.cwd();
  const dir = path.join(root, "public", "music");
  await mkdir(dir, { recursive: true });
  for (const t of TRACKS) {
    const wav = path.join(dir, `${t.id}.wav`);
    const mp3 = path.join(dir, `${t.id}.mp3`);
    await writeFile(wav, toWav(reverb(renderDry(t))));
    const r = spawnSync(
      "npx",
      [
        "remotion",
        "ffmpeg",
        "-v",
        "error",
        "-y",
        "-i",
        wav,
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "128k",
        mp3,
      ],
      { cwd: root, stdio: "inherit" },
    );
    await rm(wav);
    if (r.status !== 0) throw new Error(`MP3 conversion failed for ${t.id}`);
    console.log(`🎵 public/music/${t.id}.mp3 (${((t.bars * 4 * 60) / t.bpm).toFixed(1)} s loop)`);
  }
};

main().catch((err: Error) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
