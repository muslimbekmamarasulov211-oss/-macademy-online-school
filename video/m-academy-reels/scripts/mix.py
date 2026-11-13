"""Mix narration + score: duck the music under the voice, master to -14 LUFS.

Usage:  python3 scripts/mix.py
Output: output/music.wav (score only), build/mix.wav (final soundtrack, 59.000 s)
"""

import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD, OUT = ROOT / "build", ROOT / "output"
DUR = "59"


def run(args, **kw):
    return subprocess.run(["ffmpeg", "-hide_banner", "-y", *args], check=True, **kw)


def main():
    pre = BUILD / "mix_pre.wav"
    graph = (
        "[1:a]aformat=channel_layouts=stereo,volume=1.0,asplit=2[vo][sc];"
        "[0:a]volume=0.55[mus];"
        "[mus][sc]sidechaincompress=threshold=0.02:ratio=5:attack=25:release=450:makeup=1[duck];"
        "[duck][vo]amix=inputs=2:normalize=0:duration=first,"
        f"atrim=0:{DUR},apad=whole_dur={DUR}[out]"
    )
    run(["-i", str(BUILD / "music.wav"), "-i", str(OUT / "voiceover.wav"), "-filter_complex", graph,
         "-map", "[out]", "-ar", "48000", "-c:a", "pcm_s24le", str(pre)], capture_output=True)
    # Two-pass loudness normalisation (EBU R128), Instagram-friendly target.
    meas = run(["-i", str(pre), "-af", "loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json", "-f", "null", "-"],
               capture_output=True, text=True).stderr
    m = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", meas, re.S).group(0))
    af = (
        "loudnorm=I=-14:TP=-1.0:LRA=11:linear=true:"
        f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
        f"measured_thresh={m['input_thresh']}:offset={m['target_offset']},"
        f"aresample=48000,atrim=0:{DUR}"
    )
    run(["-i", str(pre), "-af", af, "-ar", "48000", "-c:a", "pcm_s16le", str(BUILD / "mix.wav")], capture_output=True)
    run(["-i", str(BUILD / "music.wav"), "-c:a", "pcm_s16le", str(OUT / "music.wav")], capture_output=True)
    shutil.copy(BUILD / "mix.wav", OUT / "soundtrack_mix.wav")
    print("mix ok, measured input", m["input_i"], "LUFS")


if __name__ == "__main__":
    main()
