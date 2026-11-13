"""Verify the deliverable against the brief and print a report.

Checks: exact 59 s duration, 1080x1920, 30 fps, H.264 + AAC, audible audio,
loudness, a full decode without errors, subtitle cues inside the timeline,
and dumps a contact sheet (output/contact_sheet.jpg) for a visual check.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MP4 = ROOT / "output" / "final_video.mp4"


def probe():
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(MP4)],
        capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(out)


def main():
    ok = True

    def check(name, cond, detail):
        nonlocal ok
        ok &= bool(cond)
        print(f"[{'OK' if cond else 'FAIL'}] {name}: {detail}")

    info = probe()
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    dur = float(info["format"]["duration"])
    vdur = float(v["duration"])
    check("duration", abs(dur - 59.0) < 0.05 and abs(vdur - 59.0) < 0.04, f"container {dur:.3f}s, video {vdur:.3f}s")
    check("resolution", (v["width"], v["height"]) == (1080, 1920), f"{v['width']}x{v['height']}")
    check("frame rate", v["r_frame_rate"] == "30/1", v["r_frame_rate"])
    check("frames", int(v.get("nb_frames", 0)) == 1770, v.get("nb_frames"))
    check("video codec", v["codec_name"] == "h264" and v["pix_fmt"] == "yuv420p", f"{v['codec_name']} {v.get('profile')} {v['pix_fmt']}")
    check("audio stream", a is not None and a["codec_name"] == "aac", f"{a and a['codec_name']} {a and a['sample_rate']} Hz {a and a['channels']}ch")

    loud = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(MP4), "-af", "ebur128=peak=true", "-f", "null", "-"],
                          capture_output=True, text=True).stderr
    i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", loud)[-1])
    tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", loud)[-1])
    check("audio audible", -18 < i < -10, f"integrated {i} LUFS, true peak {tp} dBFS")

    dec = subprocess.run(["ffmpeg", "-v", "error", "-i", str(MP4), "-f", "null", "-"], capture_output=True, text=True)
    check("decodes cleanly", dec.returncode == 0 and not dec.stderr.strip(), dec.stderr.strip()[:200] or "no errors")

    srt = (ROOT / "output" / "subtitles.srt").read_text(encoding="utf-8")
    times = re.findall(r"(\d\d):(\d\d):(\d\d),(\d\d\d) --> (\d\d):(\d\d):(\d\d),(\d\d\d)", srt)
    to_s = lambda h, m, s, ms: int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000
    spans = [(to_s(*x[:4]), to_s(*x[4:])) for x in times]
    mono = all(b > a for a, b in spans) and all(spans[k][1] <= spans[k + 1][0] + 1e-6 for k in range(len(spans) - 1))
    check("subtitles", spans and spans[-1][1] <= 59 and mono, f"{len(spans)} cues, last ends {spans[-1][1]:.2f}s")

    sheet = ROOT / "output" / "contact_sheet.jpg"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(MP4), "-vf", "fps=1/3.5,scale=270:-1,tile=6x3",
                    "-frames:v", "1", str(sheet)], check=True)
    print(f"contact sheet: {sheet.relative_to(ROOT)}")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
