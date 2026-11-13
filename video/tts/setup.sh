#!/usr/bin/env bash
# Navoiy TTS — one-command local install (CPU). Safe to re-run: finished steps are skipped.
#   npm run navoiy:setup
# Needs: git, Python 3.10/3.11 (python3.11 preferred), ~10 GB free disk.
# Downloads: CosyVoice code (GitHub), PyTorch CPU + packages (~2 GB), models (~5.7 GB, Hugging Face).
set -euo pipefail

cd "$(dirname "$0")/.."               # video/
HOME_DIR="${NAVOIY_HOME:-$PWD/.navoiy}"
COSYVOICE_COMMIT="074ca6dc9e80a2f424f1f74b48bdd7d3fea531cc"
mkdir -p "$HOME_DIR"

echo "1/4  CosyVoice code (pinned commit ${COSYVOICE_COMMIT:0:7})"
if [ ! -d "$HOME_DIR/CosyVoice/.git" ]; then
  git clone --quiet --recursive https://github.com/FunAudioLLM/CosyVoice.git "$HOME_DIR/CosyVoice"
fi
git -C "$HOME_DIR/CosyVoice" fetch --quiet origin "$COSYVOICE_COMMIT" 2>/dev/null || true
git -C "$HOME_DIR/CosyVoice" checkout --quiet "$COSYVOICE_COMMIT"
git -C "$HOME_DIR/CosyVoice" submodule update --quiet --init --recursive

echo "2/4  Python environment"
PY="$(command -v python3.11 || command -v python3.10 || true)"
if [ -z "$PY" ]; then
  echo "Python 3.10 or 3.11 is required (PyTorch 2.3.1 does not support newer versions)." >&2
  exit 1
fi
if [ ! -x "$HOME_DIR/venv/bin/python" ]; then
  "$PY" -m venv "$HOME_DIR/venv"
fi

echo "3/4  Python packages (CPU PyTorch etc., first time ~2 GB)"
VENV_PY="$HOME_DIR/venv/bin/python"
"$VENV_PY" -m pip --version >/dev/null 2>&1 || "$VENV_PY" -m ensurepip --upgrade >/dev/null
"$VENV_PY" -m pip install --quiet --upgrade pip "setuptools<81" wheel
# openai-whisper's old setup.py needs setuptools from the venv (no build isolation).
"$VENV_PY" -m pip install --quiet --no-build-isolation openai-whisper==20231117 \
  --extra-index-url https://download.pytorch.org/whl/cpu
"$VENV_PY" -m pip install --quiet -r tts/requirements-cpu.txt

echo "4/4  Models (Navoiy checkpoint + CosyVoice2-0.5B, ~5.7 GB)"
NAVOIY_HOME="$HOME_DIR" "$VENV_PY" tts/download_models.py

echo "✅ Navoiy TTS is ready. Try:  npm run make -- namuna --engine navoiy"
