"""Download the Navoiy TTS checkpoint and the CosyVoice2-0.5B base model (pinned revisions).

Run with the Navoiy venv:  .navoiy/venv/bin/python tts/download_models.py
Files go to .navoiy/models/ (git-ignored). Safe to re-run: finished files are skipped.
"""

from __future__ import annotations

import hashlib
import os
import sys
from pathlib import Path

from huggingface_hub import snapshot_download

ROOT = Path(__file__).resolve().parent.parent  # video/
MODELS = Path(os.environ.get("NAVOIY_HOME", ROOT / ".navoiy")) / "models"

NAVOIY_REPO = "aisha-org/navoiy-tts"
NAVOIY_REVISION = "912e6bb6663f11e5dec5de830ca06ea8dd4c985f"
NAVOIY_SHA256 = "ced40fe65cf0a006a1708fd033cfee37b2c583747d3fd06279ba12d3dbe058af"

BASE_REPO = "FunAudioLLM/CosyVoice2-0.5B"
BASE_REVISION = "eec1ae6c79877dbd9379285cf8789c9e0879293d"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def main() -> None:
    print("1/2  Navoiy TTS checkpoint (~1.9 GB)…", flush=True)
    navoiy_dir = Path(
        snapshot_download(
            NAVOIY_REPO,
            revision=NAVOIY_REVISION,
            local_dir=MODELS / "navoiy-tts",
            allow_patterns=["*.pt", "uztts/*.py", "emotions_40h.json", "LICENSE", "NOTICE"],
        )
    )
    ckpt = navoiy_dir / "emotion_600h_joint.pt"
    digest = sha256(ckpt)
    if digest != NAVOIY_SHA256:
        sys.exit(f"Checksum mismatch for {ckpt.name}: {digest}. Delete it and re-run.")
    print("     checksum OK", flush=True)

    print("2/2  CosyVoice2-0.5B base model (~4 GB)…", flush=True)
    snapshot_download(
        BASE_REPO,
        revision=BASE_REVISION,
        local_dir=MODELS / "CosyVoice2-0.5B",
        # Only what CPU inference needs (skip TensorRT/JIT/fp16 GPU variants).
        ignore_patterns=["*.plan", "*.zip", "*.batch.onnx", "flow.decoder.estimator.*", "asset/*"],
    )
    print(f"Done. Models are in {MODELS}", flush=True)


if __name__ == "__main__":
    main()
