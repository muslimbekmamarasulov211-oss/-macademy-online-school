import type { CSSProperties } from "react";

import { ParallaxScene } from "@/components/motion";
import { Badge, ButtonLink, Container } from "@/components/ui";
import { enrollHref } from "@/config/site";

/* Deterministic star field (no Math.random → identical on every render). */
function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const rand = seeded(20260);
const stars = Array.from({ length: 56 }, () => ({
  left: (rand() * 100).toFixed(2),
  top: (rand() * 100).toFixed(2),
  size: (rand() * 1.6 + 0.6).toFixed(2),
  delay: (rand() * 4).toFixed(2),
}));

const enter = (delay: number) => ({ animationDelay: `${delay}ms` }) as CSSProperties;

export function Hero() {
  return (
    <section
      id="bosh"
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-svh items-center overflow-hidden pt-28 pb-24 sm:pt-32 lg:pt-24"
    >
      {/* ---------- Atmosphere ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgb(32_49_86/0.55),transparent_70%)]" />
        <div className="absolute top-[10%] left-[60%] h-[36rem] w-[36rem] -translate-x-1/2 animate-pulse-glow rounded-full bg-gold-400/10 blur-[120px]" />
        {stars.map((star, i) => (
          <span
            key={i}
            className="absolute animate-twinkle rounded-full bg-ivory"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
        {/* Receding 3D grid floor */}
        <div className="absolute inset-x-0 bottom-0 h-[42%] overflow-hidden mask-[linear-gradient(to_top,black_10%,transparent)] [perspective:420px]">
          <div className="absolute inset-x-[-60%] bottom-0 h-[220%] origin-bottom [transform:rotateX(68deg)] animate-grid-flow bg-[linear-gradient(to_right,rgb(212_171_79/0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgb(212_171_79/0.16)_1px,transparent_1px)] bg-size-[64px_64px]" />
        </div>
      </div>

      <Container
        size="wide"
        className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8"
      >
        {/* ---------- Copy ---------- */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Badge className="animate-fade-up" style={enter(100)}>
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            Xalqaro premium onlayn maktab
          </Badge>

          <h1 id="hero-heading" className="mt-8">
            <span
              className="block animate-fade-up font-display text-[clamp(3.4rem,11vw,8.5rem)] leading-[0.88] font-semibold tracking-tight"
              style={enter(220)}
            >
              <span className="animate-shimmer text-gold-foil">M.ACADEMY</span>
            </span>
            <span className="sr-only"> — </span>
            <span
              className="mt-6 block animate-fade-up text-[clamp(0.85rem,1.5vw,1.2rem)] font-medium tracking-[0.34em] text-foreground"
              style={enter(380)}
            >
              BEYOND LEARNING. <span className="block sm:inline">BEYOND LIMITS.</span>
            </span>
          </h1>

          <p
            className="mt-7 max-w-xl animate-fade-up text-lg leading-relaxed text-pretty text-muted sm:text-xl"
            style={enter(520)}
          >
            Xalqaro darajadagi premium onlayn taʼlim: 18 ta fan, tizimli dasturlar va natijaga olib
            boruvchi shaxsiy yoʻl — istalgan joydan, istalgan qurilmada.
          </p>

          <div
            className="mt-10 flex w-full animate-fade-up flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4"
            style={enter(660)}
          >
            <ButtonLink href={enrollHref} size="lg">
              Roʻyxatdan oʻtish
              <span aria-hidden="true">→</span>
            </ButtonLink>
            <ButtonLink href="/#kurslar" size="lg" variant="secondary">
              Kurslarni koʻrish
            </ButtonLink>
          </div>

          <ul
            className="mt-10 flex animate-fade-up flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-subtle lg:justify-start"
            style={enter(800)}
          >
            {["18 ta fan", "Koreys tili · TOPIK", "AI yordamchi NIGINA"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-1 rotate-45 bg-gold-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- 3D emblem ---------- */}
        <ParallaxScene className="relative mx-auto aspect-square w-full max-w-[19rem] animate-fade-up perspective-scene sm:max-w-[26rem] lg:max-w-[34rem]">
          <div
            aria-hidden="true"
            className="absolute inset-[18%] animate-pulse-glow rounded-full bg-gold-400/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 transition-transform duration-700 ease-out-expo preserve-3d"
            style={{
              transform: "rotateX(calc(var(--py) * -12deg)) rotateY(calc(var(--px) * 16deg))",
            }}
          >
            {/* Orbits */}
            <div className="absolute inset-0 [transform:rotateX(74deg)] preserve-3d">
              <div className="absolute inset-0 animate-spin-slow rounded-full border border-gold-400/45">
                <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-gold-200 shadow-[0_0_24px_6px_rgb(223_192_114/0.6)]" />
              </div>
            </div>
            <div className="absolute inset-[7%] [transform:rotateX(70deg)_rotateY(-32deg)] preserve-3d">
              <div className="absolute inset-0 animate-spin-reverse rounded-full border border-navy-300/30">
                <span className="absolute top-1/2 -right-1 size-2 rounded-full bg-navy-200 shadow-[0_0_16px_4px_rgb(177_192_221/0.5)]" />
              </div>
            </div>
            <div className="absolute inset-[13%] [transform:rotateY(70deg)_rotateX(14deg)] preserve-3d">
              <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-gold-400/25" />
            </div>

            {/* Core */}
            <div className="absolute inset-[26%] grid [transform:translateZ(50px)] place-items-center rounded-full border border-gold-400/25 bg-[radial-gradient(circle_at_35%_30%,var(--color-navy-700),var(--color-navy-950)_70%)] shadow-[inset_0_0_40px_rgb(212_171_79/0.12)]">
              <span className="animate-shimmer text-gold-foil font-display text-[clamp(5rem,13vw,9.5rem)] leading-none font-semibold">
                M
              </span>
            </div>
          </div>
          <div aria-hidden="true" className="absolute inset-0">
            {/* Floating chips — a flat layer above the 3D plane (avoids plane intersections) */}
            <div
              className="absolute top-[6%] left-[2%] transition-transform duration-700 ease-out-expo"
              style={{
                transform: "translate3d(calc(var(--px) * 22px), calc(var(--py) * 22px), 0)",
              }}
            >
              <div className="animate-float rounded-2xl border border-border-strong bg-navy-900/85 px-4 py-2.5 shadow-card">
                <p className="font-display text-2xl leading-none font-semibold text-gold-300 lining-nums">
                  18
                </p>
                <p className="mt-1 text-[0.6875rem] text-muted">ta fan</p>
              </div>
            </div>
            <div
              className="absolute top-[40%] -right-[4%] transition-transform duration-700 ease-out-expo"
              style={{
                transform: "translate3d(calc(var(--px) * 16px), calc(var(--py) * 16px), 0)",
              }}
            >
              <div className="animate-float-delayed rounded-2xl border border-border-strong bg-navy-900/85 px-4 py-2.5 shadow-card">
                <p className="font-korean text-xl leading-none text-gold-200">한국어</p>
                <p className="mt-1 text-[0.6875rem] text-muted">TOPIK</p>
              </div>
            </div>
            <div
              className="absolute bottom-[6%] left-[10%] transition-transform duration-700 ease-out-expo"
              style={{
                transform: "translate3d(calc(var(--px) * 28px), calc(var(--py) * 28px), 0)",
              }}
            >
              <div className="flex animate-float items-center gap-2 rounded-full border border-border-strong bg-navy-900/85 py-1.5 pr-4 pl-1.5 shadow-card [animation-delay:-2s]">
                <span className="grid size-7 place-items-center rounded-full bg-linear-to-br from-gold-200 to-gold-600 text-[0.625rem] font-bold text-navy-950">
                  AI
                </span>
                <span className="text-xs font-medium text-foreground">NIGINA</span>
              </div>
            </div>
          </div>
        </ParallaxScene>
      </Container>

      {/* Scroll cue */}
      <a
        href="#kurslar"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.625rem] tracking-eyebrow text-subtle uppercase transition-colors hover:text-accent sm:flex"
      >
        <span className="flex h-9 w-5 justify-center rounded-full border border-border-strong pt-1.5">
          <span className="h-2 w-px animate-scroll-cue bg-gold-300" />
        </span>
        Pastga
      </a>
    </section>
  );
}
