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

Uses **Azure AI Speech** neural Uzbek voices: `madina` (uz-UZ-MadinaNeural, female)
and `sardor` (uz-UZ-SardorNeural, male). Azure reports the exact moment each word is
spoken ("word boundary" events); those timings drive the subtitles.

### One-time setup

1. Create a free Azure account → create a **Speech** resource (Free F0 tier is enough to start).
2. Copy `.env.example` to `.env` and fill in `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`
   (Keys and Endpoint page of the resource). `.env` is git-ignored — never commit it.

### Make a video from any Uzbek text

1. Write your text in `texts/<name>.txt`, e.g. `texts/dars-1.txt`.
   Apostrophes can be typed any way (`o'`, `o‘`, `oʻ`) — subtitles always show the
   correct `oʻ` / `gʻ` / `ʼ`.
2. Run one command:

```bash
npm run make -- dars-1 --voice madina --title "Birinchi dars"
```

Result: `out/dars-1.mp4` (1080×1920, H.264 + AAC). The video length follows the voice.

Options: `--voice madina|sardor`, `--rate -10` (slower) … `--rate 10` (faster), `--title "…"`.

Step by step instead:

```bash
npm run voice -- dars-1 --voice sardor        # → public/voiceover/dars-1.mp3 + dars-1.json
npx remotion render VoiceVideo out/dars-1.mp4 --props='{"name":"dars-1","title":null,"musicSrc":null,"backgroundClipSrc":null}'
```

`public/voiceover/<name>.json` holds the word timings and subtitle lines — you can fix a
typo in a subtitle there without regenerating the voice. `"timing": "estimated"` means
Azure's words could not be matched to your text (e.g. numbers written as digits), so
timings were estimated from word length; writing numbers as words fixes that.

Preview in `npm run studio` → **VoiceVideo** (set `name` in the props panel).

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
├── voice.ts                         # text → Azure voice + word timings + subtitle lines
├── make.ts                          # voice + render in one command
└── lib/                             # Azure client, Uzbek text rules, caption alignment (+ tests)
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
