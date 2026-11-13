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
```

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
    ├── types.ts                     # Caption type
    ├── components/
    │   ├── Background.tsx           # animated navy/gold background OR your own clip
    │   ├── AnimatedSubtitles.tsx    # word-by-word animated subtitles
    │   └── AudioLayer.tsx           # voiceover + music (auto fade in/out, ducked volume)
    └── compositions/
        └── TestVideo.tsx            # the 10-second test video
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
