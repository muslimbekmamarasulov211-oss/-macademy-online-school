"""Navoiy TTS worker — local, free Uzbek speech synthesis (CosyVoice2 + Navoiy checkpoint).

Started by the Node scripts (scripts/lib/navoiy-tts.ts). Protocol: one JSON object per line.

  stdin  ← {"id": "1", "sentences": ["Salom!", "..."], "emotion": "calm",
            "reference": "/abs/voice.wav", "speed": 1.0, "seed": 1986, "out": "/abs/out.wav"}
  stdout → {"id": "1", "ok": true, "durationMs": 5230, "segments": [{"startMs": 0, "endMs": 1800}, ...]}
           {"id": "1", "ok": false, "error": "..."}
  stdout → {"ready": true}   once, after the model has loaded
Logs go to stderr. Each sentence is synthesised separately, so its exact start/end time in
the final WAV is known (used for subtitle sync).
"""

from __future__ import annotations

import json
import logging
import os
import random
import sys
import time
from pathlib import Path

VIDEO_DIR = Path(__file__).resolve().parent.parent
NAVOIY_HOME = Path(os.environ.get("NAVOIY_HOME", VIDEO_DIR / ".navoiy"))
COSYVOICE_DIR = NAVOIY_HOME / "CosyVoice"
BASE_MODEL_DIR = NAVOIY_HOME / "models" / "CosyVoice2-0.5B"
NAVOIY_DIR = NAVOIY_HOME / "models" / "navoiy-tts"
CHECKPOINT = NAVOIY_DIR / "emotion_600h_joint.pt"
PAUSE_MS = 250  # silence between sentences

# Keep stdout clean for the JSON protocol: everything else goes to stderr.
_protocol_out = sys.stdout
sys.stdout = sys.stderr
logging.basicConfig(level=logging.WARNING, stream=sys.stderr)


def reply(obj: dict) -> None:
    _protocol_out.write(json.dumps(obj, ensure_ascii=False) + "\n")
    _protocol_out.flush()


def load():
    for path, label in ((COSYVOICE_DIR, "CosyVoice code"), (BASE_MODEL_DIR, "base model"), (CHECKPOINT, "Navoiy checkpoint")):
        if not path.exists():
            raise SystemExit(f"{label} not found: {path}. Run: npm run navoiy:setup")
    sys.path.insert(0, str(COSYVOICE_DIR))
    sys.path.insert(0, str(COSYVOICE_DIR / "third_party" / "Matcha-TTS"))
    sys.path.insert(0, str(NAVOIY_DIR))
    # CosyVoice's optional wetext frontend downloads a Chinese/English normaliser from
    # ModelScope at start-up. Uzbek text is normalised by Navoiy's own uztts.normalize,
    # so disable it: same behaviour everywhere, no network access at runtime.
    sys.modules["wetext"] = None  # type: ignore[assignment]

    import torch
    from cosyvoice.cli.cosyvoice import CosyVoice2
    from uztts.normalize import normalize

    torch.set_num_threads(max(1, os.cpu_count() or 1))
    model = CosyVoice2(str(BASE_MODEL_DIR), load_jit=False, load_trt=False, fp16=torch.cuda.is_available())
    state = torch.load(CHECKPOINT, map_location="cpu", weights_only=True)
    for key in ("state_dict", "model", "llm"):
        if isinstance(state, dict) and isinstance(state.get(key), dict):
            state = state[key]
    result = model.model.llm.load_state_dict(state, strict=False)
    if result.missing_keys or result.unexpected_keys:
        print(f"checkpoint: {len(result.missing_keys)} missing, {len(result.unexpected_keys)} unexpected keys", file=sys.stderr)
    model.model.llm.eval()

    emotions: dict[str, dict] = {}
    for entry in json.loads((NAVOIY_DIR / "emotions_40h.json").read_text(encoding="utf-8")):
        emotions[entry["uz"].lower()] = entry
        for tag in entry["tag"].replace("[", " ").replace("]", " ").split():
            emotions[tag.lower()] = entry
    return torch, model, normalize, emotions


def synthesize(torch, model, normalize, emotions, job: dict) -> dict:
    import torchaudio

    emotion = emotions.get(str(job.get("emotion", "calm")).lower().strip("[]"))
    if emotion is None:
        raise ValueError(f"Unknown emotion {job.get('emotion')!r}")
    reference = Path(job["reference"])
    if not reference.is_file():
        raise ValueError(f"Reference voice not found: {reference}")
    speed = float(job.get("speed", 1.0))
    if not 0.5 <= speed <= 2.0:
        raise ValueError("speed must be between 0.5 and 2.0")
    sentences = [s for s in job["sentences"] if s.strip()]
    if not sentences:
        raise ValueError("No text")

    seed = int(job.get("seed", 1986))
    random.seed(seed)
    torch.manual_seed(seed)
    instruction = emotion["instruct"].strip() + "<|endofprompt|>"
    sr = model.sample_rate
    pause = torch.zeros(1, int(sr * PAUSE_MS / 1000))

    pieces, segments, cursor = [], [], 0
    for i, sentence in enumerate(sentences):
        started = time.time()
        text = normalize(sentence, mode="infer")
        chunks = []
        with torch.inference_mode():
            for out in model.inference_instruct2(text, instruction, str(reference), stream=False, speed=speed):
                chunks.append(out["tts_speech"].detach().cpu())
        if not chunks:
            raise RuntimeError(f"The model returned no audio for sentence {i + 1}")
        audio = torch.cat(chunks, dim=1)
        if i > 0:
            pieces.append(pause)
            cursor += pause.shape[1]
        segments.append({"startMs": round(cursor * 1000 / sr), "endMs": round((cursor + audio.shape[1]) * 1000 / sr)})
        pieces.append(audio)
        cursor += audio.shape[1]
        print(f"sentence {i + 1}/{len(sentences)}: {audio.shape[1] / sr:.1f}s audio in {time.time() - started:.1f}s", file=sys.stderr, flush=True)
        reply({"id": job["id"], "progress": (i + 1) / len(sentences)})

    out_path = Path(job["out"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    full = torch.cat(pieces, dim=1).clamp(-1, 1)
    torchaudio.save(str(out_path), full, sr, encoding="PCM_S", bits_per_sample=16)
    return {"durationMs": round(full.shape[1] * 1000 / sr), "segments": segments, "sampleRate": sr}


def main() -> None:
    started = time.time()
    torch, model, normalize, emotions = load()
    print(f"Navoiy TTS loaded in {time.time() - started:.0f}s", file=sys.stderr, flush=True)
    reply({"ready": True})
    for line in sys.stdin:
        if not line.strip():
            continue
        job_id = None
        try:
            job = json.loads(line)
            job_id = job.get("id")
            reply({"id": job_id, "ok": True, **synthesize(torch, model, normalize, emotions, job)})
        except Exception as err:  # report and keep serving
            reply({"id": job_id, "ok": False, "error": f"{type(err).__name__}: {err}"})


if __name__ == "__main__":
    main()
