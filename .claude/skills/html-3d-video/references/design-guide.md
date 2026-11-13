# Design guide — professional 3D motion

Read this before writing a scene. The goal is a video that looks like it came out of a
motion-design studio, not a browser demo.

## 1. Storyboard first

Write the timeline as a comment block at the top of `renderFrame` before any code:

```
0.0–2.5  establish   — the world appears, camera moves in
2.5–6.0  reveal      — main message / object
6.0–9.0  develop     — details, supporting objects, a second camera angle
9.0–12   resolve     — outro line, logo, fade out
```

- One idea per beat. A beat is 2–4 s; never shorter than 1.2 s for anything that must be read.
- Text must stay fully visible for at least **(words × 0.3 s) + 1 s**.
- Overlap beats by 0.2–0.5 s so the video never "stops and restarts".
- Typical lengths: social reel 8–15 s, intro/logo 5–8 s, explainer 30–60 s.

## 2. Timing & easing

- Never animate linearly (except constant rotation/drift). Use `ease.outCubic` / `outExpo`
  for things entering, `inOutCubic` for things moving between two states, `inOutSine` for
  slow camera moves, `outBack` only for small playful pops.
- Stagger groups: letters 0.04–0.08 s, list items 0.1–0.15 s, objects 0.2–0.35 s.
- Entrances take 0.6–1.2 s, exits are faster (0.4–0.8 s).
- Everything is a pure function of `t`: `seg(t, start, dur, ease)` gives 0→1 progress.
  Never accumulate state between frames (`x += 0.01` is forbidden) — frames are rendered
  out of order and repeatedly.

## 3. Camera

- The camera is always moving a little (slow dolly or orbit) — a static camera looks cheap.
- One big move per beat at most. Ease every move; no cuts unless intentional.
- FOV 30–40° for product/hero shots (less distortion), 45–55° for environments.
- Keep the subject on the thirds or exactly centred — not "almost centred".

## 4. 3D quality checklist

- **Renderer:** `antialias: true`, `preserveDrawingBuffer: true`, `setPixelRatio(1)`,
  `ACESFilmicToneMapping`, MSAA render target (`samples: 4`) for the composer.
- **Lighting:** environment map (`RoomEnvironment` + `PMREMGenerator`) + key light (with soft
  shadows) + coloured rim light. Never rely on ambient light alone.
- **Materials:** `MeshPhysicalMaterial` for hero objects (metalness/roughness/clearcoat,
  `transmission` for glass). Roughness 0.2–0.4 for metals; below 0.15 blows out highlights.
- **Geometry:** enough segments for smooth silhouettes (spheres ≥ 64, torus tube ≥ 32,
  `RoundedBoxGeometry` instead of sharp boxes). Faceted looks must be deliberate
  (`flatShading: true`).
- **Depth:** fog (`FogExp2`), particles at several depths, foreground/background layers.
- **Post:** subtle bloom (strength 0.3–0.8, threshold ≥ 0.8), vignette, film grain (opacity
  ≤ 0.08). Over-bloom is the #1 amateur tell.
- **Extra 3D tools** (all available via the import map): `GLTFLoader` for models,
  `TextGeometry` + `FontLoader` for extruded 3D text, `RoundedBoxGeometry`,
  `LineSegments2` for thick lines, `ShaderMaterial` for custom gradients/noise.

## 5. Typography

- Headings: a display serif (Cormorant Garamond, Playfair Display) or a strong grotesk
  (Inter Display, Montserrat). Body/UI: Inter. Max two families.
- Sizes on a 1920×1080 stage: headline 120–200 px, subhead 32–48 px, captions ≥ 26 px.
  Vertical video (1080×1920): headline 96–150 px.
- Keep a 90 px safe margin from every edge (title-safe area). Vertical video: keep text out
  of the bottom 320 px and top 220 px (platform UI covers it).
- Animate text with transform + opacity (rise, rotateX flip, mask wipe, letter stagger).
  Text is DOM layered over the canvas — sharp at any size.
- Uzbek text: use `oʻ`/`gʻ` with **ʻ (U+02BB)** and the tutuq belgisi **ʼ (U+02BC)**.

## 6. Colour

- Pick a palette of 1 dark base, 1 light neutral, 1 accent (max 2). Default brand palette
  for this project: navy `#050b18 / #0a1630`, gold `#d4a437 / #e6be5a / #f3d68a`, ivory
  `#f6f1e6`, muted `#a9b3c7`.
- Accent colour on ≤ 10 % of the frame. Contrast for text ≥ 4.5:1 against what is behind it.

## 7. Formats

| Use                        | Size      | fps   |
| -------------------------- | --------- | ----- |
| YouTube / presentation     | 1920×1080 | 30/60 |
| Reels / TikTok / Shorts    | 1080×1920 | 30    |
| Instagram feed             | 1080×1350 | 30    |
| Square                     | 1080×1080 | 30    |
| 4K master (slow to render) | 3840×2160 | 30    |

Change `W`, `H`, `SCENE` and the stage CSS together. Re-check text positions for every
aspect ratio.

## 8. Before you call it done

Render stills at every beat boundary and the middle of every beat, look at each one, and
check: nothing clipped or overlapping, text readable and spelled correctly, no blown-out
highlights, no black/empty frames, first and last frames intentional.
