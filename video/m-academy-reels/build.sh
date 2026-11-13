#!/usr/bin/env bash
# Rebuild the whole M.ACADEMY reel from source.
#   ./build.sh            full pipeline (voice -> timeline/subtitles -> music -> mix -> frames -> mux -> verify)
#   SKIP_TTS=1 ./build.sh reuse existing narration clips in build/vo/
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build output

if [[ "${SKIP_TTS:-0}" != "1" ]]; then
  echo "== 1/6 narration (MMS-TTS Uzbek)"
  python3 scripts/tts.py
fi
echo "== 2/6 timeline + subtitles"
python3 scripts/timeline.py
echo "== 3/6 music + sound design"
python3 scripts/music.py
echo "== 4/6 mix + loudness"
python3 scripts/mix.py
echo "== 5/6 render frames"
node render/render.cjs --workers "${WORKERS:-$(nproc)}"
echo "== 6/6 mux"
ffmpeg -v error -y -i build/video_silent.mp4 -i build/mix.wav \
  -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -preset slow -crf 19 -profile:v high -level:v 4.2 -maxrate 14M -bufsize 28M -g 60 \
  -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 320k -ar 48000 -ac 2 -t 59 -movflags +faststart \
  output/final_video.mp4
cp build/mix.wav output/soundtrack_mix.wav
python3 scripts/verify.py
