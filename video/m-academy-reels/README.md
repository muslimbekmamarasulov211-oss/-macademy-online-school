# M.ACADEMY — “Ilm yoʻli” Instagram Reels (59 s)

A cinematic, fully procedural motion video for M.ACADEMY ONLINE SCHOOL:
why our ancestors were devoted to knowledge, what distracts us today, and how
to take learning to the next level.

| Parameter | Value |
| --- | --- |
| Duration | **59.000 s** (1770 frames) |
| Format | 1080 × 1920, 9:16, 30 fps, H.264 High 4.2, yuv420p, BT.709 |
| Audio | AAC 320 kb/s, 48 kHz stereo, −14 LUFS, true peak ≈ −1 dBTP |
| Language | Uzbek (Latin script on screen; burned-in subtitles + separate SRT) |

## Deliverables (`output/`)

| File | What it is |
| --- | --- |
| `final_video.mp4` | Finished reel with narration, music, SFX and subtitles, ready for upload |
| `voiceover.wav` | Narration only, placed on the 59 s timeline |
| `subtitles.srt` | Uzbek subtitles, timed to the narration |
| `contact_sheet.jpg` | One frame every 3.5 s, for a quick visual check |
| `music.wav`, `soundtrack_mix.wav` | Score alone and final mix (git-ignored; `./build.sh` rebuilds them) |

Key stills: `assets/stills/`.

## Storyboard

| Time | Scene | Visuals |
| --- | --- | --- |
| 00–08 | Ajdodlarimiz | Black → gold dust, candlelit manuscript opening (“العلم نور”), camera flies through an arched library with seated scholars |
| 08–18 | Buyuk allomalar | Three medallion portraits drawn in gold line: **Imom al-Buxoriy** (manuscripts, scroll, Arabic letters), **Ibn Sino** (pulse line, herbs, flask), **al-Xorazmiy** (x² + 10x = 39 → x = 3, completing-the-square diagram) over a Bukhara-style skyline |
| 18–27 | Ularning kuchi | Scholar reading at a glowing book; orbiting equations; QIZIQUVCHANLIK · SABR · INTIZOM · MUHABBAT appear in time with the voice; light floods and turns into a digital grid |
| 27–38 | Bugungi muammo | Cold blue room, phone glow, notifications (each with a sound), fast-scrolling feed, speeding clock, unfinished books, head in hands, arrows pointing everywhere |
| 38–49 | Yechim | Room warms up, lamp on, laptop opens, online lesson UI (board, modules ticking, progress to 100%), steps TOʻGʻRI YOʻL → SIFATLI TAʼLIM → IZCHIL HARAKAT, light sweep |
| 49–59 | M.ACADEMY | Particles form the gold coin emblem, M.ACADEMY / ONLINE SCHOOL, quote, “Bizga obuna boʻling!”, @M.ACADEMY.UZ, **FOLLOW M.ACADEMY** button, final impact and fade-out |

## How it is made

Everything is generated from code; there are no stock clips, images or samples.

1. **Narration**: `scripts/tts.py`. It uses Meta **MMS-TTS Uzbek**
   (`facebook/mms-tts-uzb-script_cyrillic`). Navoiy TTS is not part of this
   repository, so MMS was used instead. The model reads Cyrillic, so `narration.json`
   holds a Cyrillic `tts` line next to each Latin subtitle line. The output is a male
   voice with a fundamental of about 130 Hz. It is lowered to about 110–120 Hz with
   formant-preserving pitch shifting (rubberband), then given warmth EQ, de-essing,
   compression, a light room reverb and loudness normalisation.
2. **Timeline and subtitles**: `scripts/timeline.py`. Each clip is placed at its
   scene's `voStart` and time-compressed if it would run past the scene; only scene 5
   needs this (×1.105, pitch kept). The subtitle chunks (`subs`) are timed by
   character share and then snapped to real pauses in the audio. This writes
   `output/voiceover.wav`, `output/subtitles.srt` and `build/timeline.json`.
3. **Music and SFX**: `scripts/music.py`. An original D-minor score synthesised in
   numpy, with string pads, drones, a bell motif, a string ostinato, impacts and
   risers at the scene cuts, clock ticks, notification pings, a heartbeat, the final
   hit and a fade-out. It is seeded, so the output is identical on every run.
4. **Mix**: `scripts/mix.py`. Sidechain ducking puts the music under the voice, and
   two-pass EBU R128 normalisation brings the mix to −14 LUFS.
5. **Picture**: `render/`. An HTML5 Canvas renderer (`core.js`, `scenes.js`) draws
   each frame as a pure function of time. Headless Chromium (Playwright,
   `render.cjs`) renders all 1770 frames in parallel chunks and pipes them to ffmpeg.
   It includes parallax, light beams, particles, film grain, vignette and the
   burned-in subtitles.
6. **Mux and verify**: `build.sh` and `scripts/verify.py`. These encode the upload
   file and check duration, resolution, fps, frame count, codecs, loudness, a clean
   decode and the subtitle timing.

## Regenerate

Requirements: Python 3.10+, ffmpeg (with `rubberband`), Node 18+ with Playwright and
Chromium.

```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install transformers scipy numpy
./build.sh                 # full pipeline, about 6 min on 4 cores
SKIP_TTS=1 ./build.sh      # keep the current narration and rebuild everything else
node render/render.cjs --preview 3.5,12,30   # stills to build/preview/
```

To edit the content:

- Narration and subtitle text, plus each scene's timing: `narration.json`. Then run `./build.sh`.
- Visuals: `render/scenes.js`. The ping times in `PINGS` must match `scripts/music.py`.
- Brand colours, coin emblem, subtitle style: `render/core.js`.

## Notes and limitations

- **The voice is synthetic.** MMS-TTS is the best Uzbek engine that was available
  offline. It is intelligible, but it is not as natural as a studio narrator. To use
  Navoiy TTS or a human recording, put the clips at `build/vo/s1.wav` … `s6.wav`
  (48 kHz mono) and run `SKIP_TTS=1 ./build.sh`. The timing, subtitles and mix
  adapt automatically.
- The scholars are shown as stylised silhouettes, not likenesses. No authentic
  portraits of them exist.
- The lesson UI in scene 5 (“1-modul … 4-modul”, progress bar) is an illustrative
  motion graphic. It does not show real courses or results.
- `@M.ACADEMY.UZ` is shown exactly as given in the brief. Check that it is the
  correct account before publishing.
- Fonts in `assets/fonts/` are Cormorant Garamond, Cinzel and Amiri, all under the
  SIL Open Font License. Inter comes from the system.
