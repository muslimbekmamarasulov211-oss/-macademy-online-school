"""Generate the Uzbek narration, one clip per scene.

Engine: Meta MMS-TTS Uzbek (facebook/mms-tts-uzb-script_cyrillic, VITS).
Navoiy TTS is not part of this project, so MMS is used instead. MMS reads the
Cyrillic script, so narration.json keeps a Cyrillic "tts" field next to the
Latin subtitle text.

Post-processing (ffmpeg) turns the raw 16 kHz output into a deeper, warmer
documentary voice: formant-preserving pitch lowering (rubberband), low-shelf warmth, de-essing,
compression and a small room reverb.

Usage:  python3 scripts/tts.py
Output: build/vo/<scene>.wav  (48 kHz mono, processed)
"""

import json
import subprocess
from pathlib import Path

import numpy as np
import scipy.io.wavfile as wavfile
import torch
from transformers import AutoTokenizer, VitsModel

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "build" / "vo"
MODEL = "facebook/mms-tts-uzb-script_cyrillic"

# Pitch factor < 1 lowers the voice (deeper narrator); formants are preserved.
PITCH = 0.88


def synth(model, tok, text, seed):
    torch.manual_seed(seed)
    inputs = tok(text, return_tensors="pt")
    with torch.no_grad():
        wav = model(**inputs).waveform[0].numpy()
    return wav


def process(raw: Path, dst: Path, rate: int):
    # Voice chain: upsample, deepen, warm, tame sibilance, even out, add a little room.
    af = ",".join(
        [
            "aresample=48000",
            f"rubberband=pitch={PITCH}:formant=preserved:pitchq=quality",
            "highpass=f=70",
            "equalizer=f=140:t=q:w=1.0:g=4",
            "equalizer=f=3200:t=q:w=1.2:g=2",
            "deesser=i=0.4",
            "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=3",
            "aecho=0.8:0.5:38|61:0.12|0.07",
            "loudnorm=I=-16:TP=-1.5:LRA=7",
        ]
    )
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", af, "-ar", "48000", "-ac", "1", str(dst)],
        check=True,
    )


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    data = json.loads((ROOT / "narration.json").read_text(encoding="utf-8"))
    tok = AutoTokenizer.from_pretrained(MODEL)
    model = VitsModel.from_pretrained(MODEL)
    model.eval()
    # Slower, steadier delivery than the default.
    model.speaking_rate = 0.9
    model.noise_scale = 0.55
    model.noise_scale_duration = 0.6
    rate = model.config.sampling_rate
    for i, sc in enumerate(data["scenes"]):
        wav = synth(model, tok, sc["tts"], seed=1000 + i)
        raw = OUT / f"{sc['id']}_raw.wav"
        wavfile.write(raw, rate, (np.clip(wav, -1, 1) * 32767).astype(np.int16))
        process(raw, OUT / f"{sc['id']}.wav", rate)
        print(sc["id"], f"{len(wav) / rate:.2f}s raw")


if __name__ == "__main__":
    main()
