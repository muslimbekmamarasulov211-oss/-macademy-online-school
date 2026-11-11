# M.ACADEMY ONLINE SCHOOL

A premium international online education platform.

> **Status: Phase 1 — premium homepage.** Uzbek-language, responsive homepage with
> courses, featured Korean course, teachers, results, learning journey and the NIGINA
> assistant preview. Teachers, results and course details are **labelled sample data**
> ("Namuna") kept in `src/content/home.ts`. Authentication, payments, database, AI,
> online enrollment and admin features are **not implemented yet**.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack, Cache Components)
- React 19 · TypeScript (strict)
- Tailwind CSS v4 (design tokens in `src/app/globals.css`)
- ESLint · Prettier (+ Tailwind class sorting) · GitHub Actions CI

## Getting started

Requires Node.js 22 (see `.nvmrc`; pinned via `engines` in `package.json` so Vercel uses the same version).

```bash
npm install
cp .env.example .env.local   # then adjust values if needed
npm run dev                  # http://localhost:3000
```

## Scripts

| Command                | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Start the development server                |
| `npm run build`        | Production build                            |
| `npm run start`        | Serve the production build                  |
| `npm run lint`         | ESLint                                      |
| `npm run typecheck`    | Generate route types and run `tsc --noEmit` |
| `npm run format`       | Format all files with Prettier              |
| `npm run format:check` | Verify formatting                           |
| `npm run check`        | Lint + typecheck + format check + build     |

## Project structure

```
src/
├── app/                 # Routes, layouts, metadata, global styles & tokens
├── components/
│   ├── ui/              # Design-system primitives
│   ├── motion/          # Animation primitives (reveal, tilt, count-up, parallax)
│   ├── layout/          # Header, footer, navigation, NIGINA launcher
│   ├── nigina/          # NIGINA assistant visuals
│   └── sections/home/   # Homepage sections
├── config/              # Site config (nav, contacts, socials) and typed env access
├── content/             # Page content — replace sample data here
├── hooks/               # Client hooks
├── lib/                 # Utilities
└── types/               # Shared types
```

## Contributing

Development rules for humans and AI agents live in [`CLAUDE.md`](./CLAUDE.md).
Read it before making changes.
