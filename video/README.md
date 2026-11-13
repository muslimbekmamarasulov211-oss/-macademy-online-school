# M.ACADEMY Video Studio (Remotion)

Vertical **1080×1920** Uzbek videos built with code:
motion graphics, animated subtitles, AI voiceover, background music and your own clips.

This folder is a separate project from the website (own `package.json`).

## Setup

```bash
cd video
npm install
npm run studio        # live preview in the browser (http://localhost:3000)
npm run render:test   # renders out/test-video.mp4
npm test              # unit tests for Uzbek text + subtitle timing
```

## Uzbek AI voiceover → synced subtitles → MP4

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

Type or paste Uzbek text, choose **Madina** or **Sardor**, optionally set speed, title and
file name, press **Video yaratish**. The page shows progress, then plays the MP4 and offers
a download link. The text is saved to `texts/<name>.txt`, the voice to
`public/voiceover/<name>.mp3` (+ `.json` with timings), the video to `out/<name>.mp4`.

### Option B — command line

1. Write your text in `texts/<name>.txt`, e.g. `texts/dars-1.txt`.
2. Run:

```bash
npm run make -- dars-1 --voice madina --title "Birinchi dars"
```

Options: `--voice madina|sardor`, `--rate -10` (slower) … `--rate 10` (faster), `--title "…"`.
`npm run voice -- dars-1` only generates the voice + timings (no render).

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
    │   └── AudioLayer.tsx           # voiceover + music (auto fade in/out, ducked volume)
    └── compositions/
        ├── TestVideo.tsx            # the 10-second test video
        └── VoiceVideo.tsx           # voiceover video (length = voice length)
texts/                               # your Uzbek scripts (<name>.txt)
scripts/
├── generator/                       # local web page: text box + voice selection (npm run generator)
├── voice.ts                         # text → Azure voice + word timings + subtitle lines
├── make.ts                          # voice + render in one command
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
