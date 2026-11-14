# CLAUDE.md — M.ACADEMY ONLINE SCHOOL

Rules for any AI agent (and human) working in this repository. These rules are
**mandatory**. If a request conflicts with them, stop and ask.

@AGENTS.md

---

## 1. Non-negotiable rules

1. **Never delete working features without explicit permission.** Removing,
   disabling or "simplifying away" existing behaviour requires the owner's approval.
2. **Never overwrite important files without inspecting them first.** Read a file
   before editing it. Never blindly regenerate configs (`package.json`,
   `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `globals.css`, `CLAUDE.md`).
3. **Work in small, verified steps.** One focused change at a time. Do not build
   multiple features in a single step. Do not touch code outside the current task.
4. **Run the quality checks** (section 3) after every meaningful change, and always
   before committing.
5. **Fix errors before declaring completion.** A task with failing lint, type
   checks or build is not done.
6. **Never expose secrets, API keys or credentials.** Not in code, commits, logs,
   screenshots, issues or `NEXT_PUBLIC_*` variables. See section 5.
7. **Never claim a feature works unless it actually works.** Verify by running it.
   Report exactly what succeeded, what failed and what was not tested.
8. **No fake functionality.** No buttons that do nothing, no links to pages that
   don't exist, no mocked API responses presented as real.
9. **No placeholder data presented as real data.** No invented statistics,
   testimonials, student counts, prices, teachers or courses. If content is not
   available yet, say so honestly in the UI (e.g. "Enrolment opening soon").

## 2. Current scope

**Phase 1 (premium homepage)** is implemented. The following are **not
implemented and must not be added without an explicit task**: authentication,
payments, database, AI agents (NIGINA is a visual preview only), admin
functionality, course detail pages, user accounts, online enrollment.

### Text-to-speech tool (Aisha AI)

An internal Uzbek TTS tool lives at **`/tools/ovoz`** (not in the navigation, `noindex`).

- The browser calls `POST /api/tts` (`src/app/api/tts/route.ts`); only the server talks
  to Aisha (`src/lib/tts/aisha.server.ts`), using `AISHA_API_KEY` from
  `src/config/env.server.ts`. The key never reaches the client.
- Follow the official reference (https://aisha.group/uz/api-documentation/text-to-speech).
  Do not invent endpoints or parameters. Shared options (moods, speed range, 1000-char
  limit) are in `src/lib/tts/options.ts`.
- The API returns WAV only; MP3 is encoded in the browser (`src/lib/tts/wav-to-mp3.ts`).
- Requests spend Aisha balance and are rate-limited per IP (best-effort, in memory).
- It is not wired into NIGINA. That still needs an explicit task.

### Sample content ("Namuna")

The owner approved clearly labelled sample data for the homepage. All of it lives
in **`src/content/home.ts`** (subjects, Korean programme, teachers, results). Each
block has an `isSample` / `*AreSample` flag that renders a visible **"Namuna"**
badge. Rules:

- Never present sample content as real; never remove a badge while data is still sample.
- When real data arrives, replace it in `src/content/home.ts` and set the flag to `false`.
- Contact channels and social accounts are `null` in `src/config/site.ts` until real
  values exist; the UI then shows "Tez orada" instead of dead links.

## 3. Quality checks

```bash
npm run lint          # ESLint (next/core-web-vitals + TypeScript rules)
npm run typecheck     # next typegen && tsc --noEmit
npm run format:check  # Prettier (with Tailwind class sorting)
npm run build         # Production build — also validates prerendering
npm run check         # All of the above, in order
```

Use `npm run format` / `npm run lint:fix` to auto-fix. CI runs the same checks on
every push and pull request (`.github/workflows/ci.yml`).

## 4. Architecture

- **Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS v4**
- **Cache Components is enabled** (`cacheComponents: true`). Consequences:
  - `new Date()`, `Date.now()`, `Math.random()` in server components break the
    prerender. Use `"use cache"` + `cacheLife()`, `connection()` inside `<Suspense>`,
    or a Client Component (see `src/components/layout/copyright-year.tsx`).
  - Route segment configs like `dynamic`, `revalidate`, `runtime` are not used.
- This Next.js version differs from older training data. **Read the bundled docs in
  `node_modules/next/dist/docs/` before using an unfamiliar API** (see `AGENTS.md`).

```
src/
├── app/                    # Routing ONLY: layouts, pages, metadata, globals.css
├── components/
│   ├── ui/                 # Design-system primitives (Button, Heading, Card, SectionHeader…). No business logic.
│   ├── motion/             # Client animation primitives: Reveal, TiltCard, CountUp, ParallaxScene
│   ├── layout/             # Site chrome (header, navs, footer, logo, NIGINA launcher)
│   ├── nigina/             # NIGINA assistant visuals (orb, preview panel)
│   └── sections/<page>/    # Page-specific sections composed from ui/ primitives
├── config/                 # site.ts (brand, nav, contacts, socials), env.ts (typed public env)
├── content/                # Page copy and data (home.ts) — edit content here, not in components
├── hooks/                  # Client hooks (use-active-section scroll-spy)
├── lib/                    # Framework-agnostic utilities (cn)
└── types/                  # Shared TypeScript types
```

Conventions:

- Import with the `@/` alias (`@/components/ui`), not long relative paths.
- File names are `kebab-case.tsx`; components are `PascalCase` named exports
  (default exports only where Next.js requires them: `page`, `layout`, etc.).
- Server Components by default. Add `"use client"` only to the smallest component
  that needs interactivity (see `mobile-nav.tsx`).
- Only add a navigation link in `src/config/site.ts` when the destination exists.

## 5. Environment variables & secrets

- `.env.example` is the documented template and the **only** env file committed.
- Real values go in `.env.local` (git-ignored). Never commit it.
- `NEXT_PUBLIC_*` variables are inlined into the browser bundle — **never put
  secrets in them**.
- Public variables are read via `src/config/env.ts`. When server-only secrets are
  introduced, put them in a separate module that imports `"server-only"`.
- Every new variable must be added to `.env.example` with a safe example value.

## 6. Design system

Defined in `src/app/globals.css` (`@theme`). Dark navy + gold, premium and restrained.

- Use **semantic tokens** in components: `bg-background`, `bg-surface`,
  `bg-surface-raised`, `text-foreground`, `text-muted`, `text-subtle`,
  `border-border`, `border-border-strong`, `bg-accent`, `text-accent`,
  `text-accent-foreground`. Use raw `navy-*` / `gold-*` scales only for decoration.
- Fonts: `font-display` (Cormorant Garamond) for headings, `font-sans` (Inter) for UI/body.
- Headings: use `<Heading level size>` — semantic level and visual size are independent.
- Gold is an accent, not a fill colour. Keep it to CTAs, highlights and small details.
- Accessibility: keep text contrast ≥ 4.5:1, preserve visible focus styles, label
  icon-only buttons, respect `prefers-reduced-motion`.
- Test every UI change at mobile (~390px), tablet (~820px) and desktop (~1440px)
  with no horizontal overflow.

### Motion & 3D

- Use the primitives in `src/components/motion/`. Animate only `transform`/`opacity`.
- Every animation must respect `prefers-reduced-motion` (a global rule in `globals.css`
  covers CSS animations; JS effects check the media query).
- `Reveal` content must stay visible without JavaScript (handled by the
  `@media (scripting: enabled)` rule) — do not hide content any other way.
- Inside a `preserve-3d` scene, **do not use** `backdrop-filter`, `filter: blur` or outer
  `box-shadow` — Chromium clips them to square layer boxes. Put glows/glass in a flat
  sibling layer (see `hero.tsx`). Overlays must use opaque surfaces, not `glass`.

### Language

- Default UI language is **Uzbek (Latin script)**, `<html lang="uz">`.
- Use the correct characters: `oʻ`/`gʻ` with **ʻ (U+02BB)** and the tutuq belgisi
  **ʼ (U+02BC)** — never a plain `'`. The brand slogan stays in English.

## 7. Git

- Small, descriptive commits. Never commit secrets, `.env.local`, `.next/` or `node_modules/`.
- Run `npm run check` before pushing.
