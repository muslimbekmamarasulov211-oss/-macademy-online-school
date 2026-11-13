---
name: html-3d-video
description: >-
  Creates professional animated videos from HTML: a frame-exact three.js 3D scene (PBR
  materials, lighting, shadows, bloom, particles, camera moves) with DOM typography, rendered
  frame by frame with Playwright and encoded to MP4 with FFmpeg. Use whenever the user asks
  for an animation, animated video, intro, logo reveal, promo, reel, explainer or motion
  graphic — also in Uzbek: "video yasa", "animatsiya", "animatsion video", "3D video",
  "intro video", "reels uchun video", "mp4 qilib ber".
---

# html-3d-video — HTML → 3D animation → MP4

You build the animation as one self-contained HTML file whose every frame is a **pure
function of time**, then `scripts/render.mjs` seeks it frame by frame, screenshots each frame
losslessly and pipes them to FFmpeg (H.264, yuv420p, `+faststart`). Nothing plays in real
time, so the video never stutters and every detail lands exactly where it was designed.

Skill files (paths relative to this file):

- `templates/scene-template.html` — a complete, working 3D scene. **Always start from it.**
- `scripts/render.mjs` — the renderer (stills + MP4).
- `references/design-guide.md` — storyboard, easing, camera, 3D quality, typography,
  formats. **Read it before designing a scene.**

## Requirements

`node` ≥ 18, `ffmpeg` (with libx264), and Playwright with Chromium (`require("playwright")`
must resolve; in Claude Code cloud sessions it is pre-installed — never run
`playwright install` there). Check once: `ffmpeg -version && node -e "require('playwright')"`.
three.js is loaded via the template's import map; the renderer serves it from a local
`npm pack` cache, so it works even where CDNs are blocked.

## Workflow

1. **Brief.** Get from the user (ask only for what is missing; otherwise use the defaults):
   message/text (exact wording), format (default 1920×1080, 30 fps; reels 1080×1920),
   length (default 10–15 s), style/colours (default: project brand — navy + gold), audio file
   (optional). Never invent facts, numbers, prices or testimonials for the text.
2. **Storyboard.** Write the beats (time ranges + what happens) and show them to the user in
   2–5 lines before building anything long (> 20 s).
3. **Build.** Create the work folder `.video-renders/<slug>/` (git-ignored) and copy the
   template to `.video-renders/<slug>/scene.html`. Replace the SCENE CONTENT and TIMELINE,
   keep the RENDER CONTRACT, deterministic helpers and STAGE SCALING blocks.
4. **Check stills.** Render a still at every beat boundary and mid-beat, then **look at every
   PNG** with the Read tool and fix what is wrong (overlaps, clipping, typos, blown-out
   highlights, empty frames):

   ```bash
   node .claude/skills/html-3d-video/scripts/render.mjs .video-renders/<slug>/scene.html \
     --stills 0.5,2,4,6,8,10 --out-dir .video-renders/<slug>/stills
   ```

5. **Draft (optional, for long videos).** `--scale 0.5 --fps 15` renders ~8× faster to check
   motion and timing.
6. **Final render.**

   ```bash
   node .claude/skills/html-3d-video/scripts/render.mjs .video-renders/<slug>/scene.html \
     .video-renders/<slug>/<slug>.mp4 [--audio music.mp3] [--workers 2]
   ```

   Run it in the background for anything over ~10 s of video: without a GPU (cloud
   containers) a 1080p frame takes ~1.5–2 s, so 12 s at 30 fps ≈ 10 min. On a machine with a
   GPU it is several times faster; `--workers 2–4` helps there.

7. **Verify & deliver.** Run `ffprobe` (codec h264, size, fps, duration, frame count), extract
   1–2 frames from the MP4 with `ffmpeg -ss <t> -i out.mp4 -frames:v 1 check.png` and look at
   them. Then send the MP4 to the user (SendUserFile when available) and report: resolution,
   fps, length, file size, and anything you could not do.

## Render contract (the template already implements it)

```js
window.SCENE = { duration: 12, fps: 30, width: 1920, height: 1080 };
window.sceneReady = (async () => {
  await document.fonts.ready; /* load models … */
})();
window.renderFrame = (t) => {
  /* set EVERYTHING from t, then composer.render() */
};
```

- `window.__RENDER_MODE__` is `true` while rendering — the live-preview loop must not run.
- `window.__RENDER_SCALE__` (from `--scale`) — the template sizes the GL canvas and the DOM
  stage with it; keep that code.
- CSS animations / Web Animations are also seeked to `t` automatically, but prefer setting
  styles inside `renderFrame` (full control, exact easing).

## Hard rules

- **Determinism:** no `Math.random()`, `Date.now()`, `performance.now()`, `setTimeout`-driven
  motion or state accumulated across frames. Use `seg()`/`ease`/`mix()` and the seeded
  `mulberry32` RNG. The same `t` must always produce the same image.
- `preserveDrawingBuffer: true` on the WebGL renderer, pixel ratio 1.
- All assets must be loaded before `sceneReady` resolves (fonts, textures, GLB models).
  Put local assets next to `scene.html` and reference them relatively.
- Width and height must be even. Keep text inside the 90 px safe area.
- Uzbek text uses ʻ (U+02BB) and ʼ (U+02BC), never a plain apostrophe.
- Output only in `.video-renders/` — never inside `src/` or `public/` unless the user asks
  to put a finished video on the website.
- Do not claim the video is finished until the MP4 exists, ffprobe confirms it and you have
  looked at frames from it.

## Renderer options

| Option             | Default             | Purpose                                     |
| ------------------ | ------------------- | ------------------------------------------- |
| `--stills a,b,c`   | —                   | PNGs at those seconds instead of a video    |
| `--out-dir dir`    | next to the HTML    | where stills go                             |
| `--fps n`          | `SCENE.fps` / 30    | frame rate                                  |
| `--width/--height` | `SCENE` / 1920×1080 | output size                                 |
| `--scale f`        | 1                   | resolution multiplier (0.5 = fast draft)    |
| `--from s`         | 0                   | start time                                  |
| `--duration s`     | `SCENE.duration`    | length to render                            |
| `--crf n`          | 16                  | quality (lower = better, 14–20 sensible)    |
| `--preset name`    | slow                | x264 preset (`medium` for faster encodes)   |
| `--audio file`     | —                   | mux an audio track, trimmed to video length |
| `--workers n`      | 1                   | parallel pages, segments joined losslessly  |

## Troubleshooting

- `renderFrame was never defined` → a script error; the renderer prints the page errors.
  Usually a typo or a bad import path.
- Black canvas → missing `preserveDrawingBuffer`, or `renderFrame` doesn't call
  `composer.render()` / `renderer.render()`.
- Fonts look like fallbacks → the font must be loaded before `sceneReady` resolves; use
  `display=block` on Google Fonts and `await document.fonts.ready`.
- Extra three.js modules: import from `three/addons/...` (e.g. `loaders/GLTFLoader.js`,
  `geometries/TextGeometry.js`, `loaders/FontLoader.js`) — the import map covers them.
