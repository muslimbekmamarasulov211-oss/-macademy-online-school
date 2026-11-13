"""Place the narration clips on the 59 s timeline and build the subtitles.

- Each scene clip starts at its `voStart` and must finish before the scene ends
  (minus a small breath). Clips that are too long are time-compressed with
  ffmpeg's atempo (pitch-preserving); the factor is reported.
- Subtitle chunks (narration.json "subs", else auto-split) are timed by
  character share over the voiced part of the clip, then snapped to the nearest
  real pause found in the audio.

Usage:  python3 scripts/timeline.py
Output: build/vo/<scene>_fit.wav, output/voiceover.wav, output/subtitles.srt,
        build/timeline.json (read by the renderer)
"""

import json
import re
import subprocess
from pathlib import Path

import numpy as np
import scipy.io.wavfile as wavfile

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
OUT = ROOT / "output"
SR = 48000
TAIL = 0.35  # seconds of breathing room before a scene cut
MAX_CHARS = 34


def read(path):
    sr, x = wavfile.read(path)
    assert sr == SR, (path, sr)
    if x.dtype == np.int16:
        return x.astype(np.float32) / 32768.0
    return x.astype(np.float32)


def voiced_bounds(x, thr=0.02):
    win = int(0.01 * SR)
    env = np.sqrt(np.convolve(x**2, np.ones(win) / win, "same"))
    idx = np.where(env > thr)[0]
    return idx[0] / SR, idx[-1] / SR, env


def pauses(env, start, end, min_len=0.09, thr=0.012):
    """Midpoints of silent stretches inside [start, end]."""
    quiet = env < thr
    out, i, n = [], int(start * SR), int(end * SR)
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if (j - i) / SR >= min_len:
                out.append(((i + j) / 2) / SR)
            i = j
        else:
            i += 1
    return out


def chunk(text):
    words, chunks, cur = text.split(), [], ""
    for w in words:
        cand = (cur + " " + w).strip()
        # Prefer to break after punctuation once a chunk has some body.
        if len(cand) > MAX_CHARS and cur:
            chunks.append(cur)
            cur = w
        else:
            cur = cand
        if re.search(r"[.,!?—]$", w) and len(cur) >= 18:
            chunks.append(cur)
            cur = ""
    if cur:
        chunks.append(cur)
    # Merge a dangling dash onto the previous chunk.
    merged = []
    for c in chunks:
        if c in ("—",) and merged:
            merged[-1] += " —"
        else:
            merged.append(c)
    return merged


def fmt(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    data = json.loads((ROOT / "narration.json").read_text(encoding="utf-8"))
    total = data["duration"]
    track = np.zeros(int(total * SR), np.float32)
    cues, report = [], []
    for sc in data["scenes"]:
        src = BUILD / "vo" / f"{sc['id']}.wav"
        x = read(src)
        a, b, _ = voiced_bounds(x)
        x = x[max(0, int((a - 0.05) * SR)) : int((b + 0.25) * SR)]
        avail = sc["end"] - TAIL - sc["voStart"]
        dur = len(x) / SR
        tempo = 1.0
        if dur > avail:
            tempo = dur / avail
            fit = BUILD / "vo" / f"{sc['id']}_fit.wav"
            tmp = BUILD / "vo" / f"{sc['id']}_trim.wav"
            wavfile.write(tmp, SR, x)
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-af", f"atempo={tempo:.4f}", "-ar", str(SR), str(fit)],
                check=True,
            )
            x = read(fit)
        start = sc["voStart"]
        i0 = int(start * SR)
        track[i0 : i0 + len(x)] += x[: len(track) - i0]
        report.append(f"{sc['id']}: {start:.2f}s -> {start + len(x) / SR:.2f}s (tempo x{tempo:.3f})")

        # Subtitles for this clip.
        va, vb, env = voiced_bounds(x)
        gaps = pauses(env, va, vb)
        parts = sc.get("subs") or chunk(sc["text"])
        weights = np.array([len(p) for p in parts], float)
        edges = va + np.concatenate([[0], np.cumsum(weights)]) / weights.sum() * (vb - va)
        for k in range(1, len(edges) - 1):
            near = [g for g in gaps if abs(g - edges[k]) < 0.45]
            if near:
                edges[k] = min(near, key=lambda g: abs(g - edges[k]))
        for k, p in enumerate(parts):
            cues.append(
                {
                    "scene": sc["id"],
                    "text": p,
                    "start": round(start + edges[k] - 0.08, 3),
                    "end": round(start + edges[k + 1] + 0.12, 3),
                }
            )
    # Remove overlaps between consecutive cues.
    for c0, c1 in zip(cues, cues[1:]):
        if c0["end"] > c1["start"]:
            c0["end"] = c1["start"]

    OUT.mkdir(exist_ok=True)
    peak = np.abs(track).max()
    wavfile.write(OUT / "voiceover.wav", SR, (track / max(peak, 1e-6) * 0.89 * 32767).astype(np.int16))
    srt = []
    for n, c in enumerate(cues, 1):
        srt.append(f"{n}\n{fmt(c['start'])} --> {fmt(c['end'])}\n{c['text']}\n")
    (OUT / "subtitles.srt").write_text("\n".join(srt), encoding="utf-8")
    timeline = {
        "fps": data["fps"],
        "duration": total,
        "scenes": [{k: s[k] for k in ("id", "start", "end")} for s in data["scenes"]],
        "subtitles": cues,
    }
    (BUILD / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n".join(report))
    print(f"{len(cues)} subtitle cues")


if __name__ == "__main__":
    main()
