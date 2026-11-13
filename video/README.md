# M.ACADEMY Video Studio (Remotion)

> **Tezkor boshlash (oʻzbekcha):** `npm install` → `npm run navoiy:setup` (bir marta) →
> `npm run generator` → brauzerda http://localhost:3333 → matn yozing, format (9:16 / 16:9) va
> musiqani tanlang → **▶ Yaratish**. Ovoz, animatsiya, subtitr, musiqa va MP4 — avtomatik.

Vertical **1080×1920** Uzbek videos built with code:
motion graphics, animated subtitles, AI voiceover, background music and your own clips.

This folder is a separate project from the website (own `package.json`).

## One button: text → finished videos

```bash
cd video
npm install
npm run navoiy:setup     # once: free local Uzbek TTS model (~10 GB disk)
npm run generator        # → http://localhost:3333
```

On the page: type Uzbek text → choose emotion, formats (**9:16 Reels** and/or **16:9 YouTube**)
and background music → press **▶ Yaratish**. Everything else is automatic:

1. **Voice** — Navoiy TTS reads the text (or Azure, optional).
2. **Subtitles** — synced to the voice, word by word highlight.
3. **Motion graphics** — every spoken sentence starts a new scene: ring burst, kinetic keyword
   (the sentence's longest word), sentence counter; gold bars react to the real voice volume.
4. **Music** — original loops (`tinch`, `ilhom`, `energiya`) or your own MP3 in `public/music/`;
   fades in/out and is lowered automatically while the voice speaks ("ducking").
5. **Export** — `out/<name>-reels.mp4` (1080×1920) and `out/<name>-youtube.mp4` (1920×1080),
   with preview and download links on the page.

The page is organised in three steps — **1 Matn**, **2 Ovoz sozlamalari**, **3 Video va
musiqa** — and one **VIDEO YARATISH** button. Finished videos play on the page and have
download links; the list at the bottom keeps every video made so far. Reloading the page
while a video is being made keeps showing its progress. Only one video is made at a time.

**End-to-end test** (real browser, real TTS and rendering, ~5 minutes on a CPU): start
`npm run generator`, then in another terminal run `npm run e2e` (needs Playwright with
Chromium). It checks 14 scenarios: all controls, phone/iPad widths, music preview,
input errors, cross-site protection, busy/reload handling, both formats with music,
YouTube-only without music, voice-only, downloads (headers, size, byte ranges) and the
browser console.

Same from the command line (reads `texts/<name>.txt`):

```bash
npm run make -- dars-1 --emotion xursand --title "Birinchi dars" --music ilhom --aspect both
```

`--aspect both|reels|youtube`, `--music ilhom|tinch|energiya|<your-file>|none`, `--music-volume 0.18`.
Measured on a 4-core CPU without GPU: a 15-second text → both MP4s in about 2 minutes.

## Setup

```bash
cd video
npm install
npm run studio        # live preview in the browser (http://localhost:3000)
npm run render:test   # renders out/test-video.mp4
npm test              # unit tests for Uzbek text + subtitle timing
```

## Navoiy TTS — free local Uzbek voice (default engine)

[Navoiy TTS](https://huggingface.co/aisha-org/navoiy-tts) by Aisha is an open Uzbek
text-to-speech model (Apache-2.0) built on CosyVoice2. It runs **on your own machine**:
no API key, no per-use cost. It supports 10 emotions and copies the timbre of a short
reference recording. See `tts/NOTICE.md` for sources and licences.

### Install (once)

```bash
cd video
npm run navoiy:setup
```

Needs `git`, Python 3.10/3.11 and ~10 GB disk. Downloads the CosyVoice code (pinned
commit), CPU PyTorch + packages (~2 GB) and the models (~5.7 GB, checksum-verified) into
`video/.navoiy/` (git-ignored). Re-running skips what is already installed.

### Use

- **Generator page:** `npm run generator` → http://localhost:3333 → choose **Navoiy TTS**,
  an emotion (*Kayfiyat*), a reference voice (*Namuna ovoz*), WAV or MP3, then **Yaratish**.
  Untick *Video ham yaratish* to make only the audio file.
- **Command line:**

```bash
npm run make -- dars-1 --engine navoiy --emotion xursand --format mp3 --title "Birinchi dars"
```

Emotions: `xotirjam` (default), `xursand`, `gamgin`, `jahldor`, `qorqqan`, `hayratda`,
`pichirlab`, `mehribon`, `charchagan`, `kinoyali`. `--ref <name>` picks a reference voice
from `tts/voices/` (see `tts/voices/README.md`; only with the speaker's permission).

Output: `public/voiceover/<name>.wav|mp3` + `<name>.json`, and `out/<name>.mp4`.

### How it works

1. The text is split into sentences (`M.ACADEMY` or `3.5` are not split).
2. `tts/navoiy_worker.py` (Python) loads the model **once** and synthesises each sentence
   separately, with Navoiy's Uzbek normaliser (numbers, dates → words).
3. Because each sentence is generated on its own, its exact start/end in the audio is
   known; words are spread inside their sentence → subtitles cannot drift by more than
   one sentence (`"timing": "sentence"`).
4. The audio is saved as WAV (24 kHz) or converted to MP3 with Remotion's built-in ffmpeg,
   then `VoiceVideo` renders the MP4 with the voice and subtitles.

### Speed (CPU)

Measured on a 4-core cloud CPU without a GPU: model load ~15 s (once per server start),
then about **3.5–5 s of computing per 1 s of speech** (a 14 s text ≈ 1 minute), plus
rendering. An NVIDIA GPU is much faster (the worker uses it automatically if PyTorch with
CUDA is installed). Quality depends on the reference voice; the model may mispronounce
some names, loanwords and abbreviations.

## Azure AI Speech (optional cloud engine)

Uses **Azure AI Speech** neural Uzbek voices: **Madina** (`uz-UZ-MadinaNeural`, female)
and **Sardor** (`uz-UZ-SardorNeural`, male). Azure reports the exact moment each word is
spoken ("word boundary" events); those timings drive the subtitles.

### Azure key setup

**1. Create the Speech resource (once)**

1. Sign in at https://portal.azure.com → **Create a resource** → search **Speech** → Create.
2. Pricing tier **Free F0** (enough to start; it cannot run up a bill).
3. Open the resource → **Keys and Endpoint**. You need **KEY 1** and **Location/Region**.

**2a. On your own computer (Mac / Windows / Linux)**

```bash
cd video
cp .env.example .env
chmod 600 .env          # only your user can read it (Mac/Linux)
```

Open `.env` in a text editor and fill in `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`.
Then check — this prints whether the values are set, never the key itself:

```bash
npm run check-env
```

**2b. In a Claude Code cloud session (e.g. from an iPad)**

The key is stored as a **network secret** on the cloud environment, not in a file:
the session's network proxy adds it to requests for one host only. Code in the
session never sees the real key.

- Host: `<region>.tts.speech.microsoft.com` (e.g. `westeurope.tts.speech.microsoft.com`)
- Header: `Ocp-Apim-Subscription-Key` (no prefix)
- Value: KEY 1 — typed only into the secure form, never into the chat.

Then create `video/.env` with just the region and the placeholder key from `.env.example`.

**Security rules**

- Never commit `.env` (it is git-ignored; `npm run check-env` warns if it is tracked).
- Never paste the key into chat, issues, screenshots or browser code.
- The generator page only listens on `127.0.0.1`, so other devices on your network
  cannot use your key. The browser never receives the key.
- If a key leaks: Azure portal → Keys and Endpoint → **Regenerate Key 1**, update `.env`.

### Option A — generator page (text box + voice selection)

```bash
npm run generator       # → http://localhost:3333
```

Type or paste Uzbek text, choose the **Azure** engine and **Madina** or **Sardor**, optionally
set speed, title and file name, press **Yaratish**. The page shows progress, then plays the MP4 and offers
a download link. The text is saved to `texts/<name>.txt`, the voice to
`public/voiceover/<name>.mp3` (+ `.json` with timings), the video to `out/<name>.mp4`.

### Option B — command line

1. Write your text in `texts/<name>.txt`, e.g. `texts/dars-1.txt`.
2. Run:

```bash
npm run make -- dars-1 --engine azure --voice madina --title "Birinchi dars"
```

Options: `--engine azure` (required — the default engine is Navoiy), `--voice madina|sardor`,
`--rate -10` (slower) … `--rate 10` (faster), `--title "…"`.
`npm run voice -- dars-1 --engine azure` only generates the voice + timings (no render).

### How the subtitle sync works

- Apostrophes can be typed any way (`o'`, `o‘`, `oʻ`); subtitles always show `oʻ`/`gʻ`/`ʼ`.
- Each word Azure speaks is matched to your text, then grouped into short lines
  (max 5 words, broken at sentence ends and pauses). Each word lights up as it is spoken.
- If the Speech SDK connection fails, the generator falls back to Azure's REST API (audio
  without word timings) and estimates timing from word length. The page / log says so,
  and the JSON shows `"timing": "estimated"`. The same happens if words cannot be
  matched (e.g. numbers as digits) — writing numbers as words fixes that.
- `public/voiceover/<name>.json` holds the timings and lines; you can fix a typo in a
  subtitle there and re-render without regenerating the voice.

## Project layout

```
video/
├── public/
│   ├── fonts/        # Montserrat + Cormorant Garamond (OFL), bundled for offline rendering
│   ├── voiceover/    # put AI voiceover files here (mp3/wav)
│   ├── music/        # put background music here (mp3)
│   └── clips/        # put your own videos here (mp4/mov)
└── src/
    ├── index.ts                     # entry point
    ├── Root.tsx                     # registers compositions (size, fps, duration, default props)
    ├── theme.ts                     # brand colours + fonts
    ├── types.ts                     # Caption / Word / VoiceoverData types
    ├── components/
    │   ├── Background.tsx           # animated navy/gold background OR your own clip
    │   ├── AnimatedSubtitles.tsx    # word-by-word animated subtitles
    │   ├── SentenceScenes.tsx       # per-sentence motion graphics (keyword, ring burst, counter)
    │   ├── VoiceVisualizer.tsx      # bars driven by the real voice audio
    │   └── AudioLayer.tsx           # voiceover + music (fade in/out, ducking under the voice)
    ├── lib/                         # layout (9:16 / 16:9), sentence timings, music volume
    └── compositions/
        ├── TestVideo.tsx            # the 10-second test video
        └── VoiceVideo.tsx           # voiceover video, compositions VoiceVideo (9:16) + VoiceVideoWide (16:9)
texts/                               # your Uzbek scripts (<name>.txt)
tts/                                 # Navoiy TTS: setup.sh, Python worker, model download, voices/
scripts/
├── generator/                       # local web page: text box + voice selection (npm run generator)
├── voice.ts                         # text → voice (Navoiy or Azure) + timings + subtitle lines
├── make.ts                          # voice + render (both formats) in one command
├── music/generate.ts                # original background-music synthesizer (npm run music:generate)
├── check-env.ts                     # shows whether Azure settings are set (never the values)
└── lib/                             # Azure client, env handling, pipeline, render, captions (+ tests)
```

## Adding voiceover, music and your own video

1. Copy files into `public/` (e.g. `public/voiceover/intro.mp3`, `public/music/calm.mp3`,
   `public/clips/lesson.mp4`).
2. In `src/Root.tsx` set `voiceoverSrc`, `musicSrc`, `backgroundClipSrc` to those paths
   (relative to `public/`, e.g. `"voiceover/intro.mp3"`).
3. Edit the `captions` (text + start/end in milliseconds) so they match the voiceover.

Only use music you have the rights to.

## Uzbek text

Use **ʻ (U+02BB)** in `oʻ`/`gʻ` and **ʼ (U+02BC)** for the tutuq belgisi — never a plain `'`.
The bundled fonts include these characters.

## Rendering inside a sandbox without internet access to remotion.media

Remotion normally downloads its own headless Chrome. If that is blocked, point it at an
existing one:

```bash
npx remotion render TestVideo out/test-video.mp4 --browser-executable=/path/to/chrome-headless-shell
```

For `npm run make`, set `REMOTION_BROWSER_EXECUTABLE` in `.env` instead.
