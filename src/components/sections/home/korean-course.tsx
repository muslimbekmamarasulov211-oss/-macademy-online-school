import { Reveal, TiltCard } from "@/components/motion";
import {
  ButtonLink,
  Container,
  Eyebrow,
  GoldRule,
  SampleBadge,
  Section,
  Text,
} from "@/components/ui";
import { enrollHref } from "@/config/site";
import { koreanCourse } from "@/content/home";

const floatingSyllables = [
  { char: "가", className: "top-[4%] left-[6%] text-5xl", depth: 90 },
  { char: "나", className: "top-[12%] right-[4%] text-4xl", depth: 60 },
  { char: "다", className: "bottom-[16%] left-[2%] text-3xl", depth: 120 },
  { char: "라", className: "right-[10%] bottom-[4%] text-5xl", depth: 80 },
];

export function KoreanCourse() {
  return (
    <Section
      id="koreys-tili"
      tone="surface"
      aria-labelledby="koreys-heading"
      className="relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-0 h-[40rem] w-[40rem] translate-x-1/3 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(212_171_79/0.12),transparent_65%)]"
      />
      <Container size="wide" className="relative grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
        <div>
          <Reveal>
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow>
                <GoldRule />
                Tanlangan kurs
              </Eyebrow>
              {koreanCourse.isSample && <SampleBadge label="Namuna dastur" />}
            </div>
            <h2
              id="koreys-heading"
              className="mt-5 font-display text-display-xl font-medium text-balance text-foreground"
            >
              {koreanCourse.title}{" "}
              <span lang="ko" className="text-gold-foil font-korean">
                {koreanCourse.hangul}
              </span>
            </h2>
            <p className="mt-3 text-sm font-medium tracking-[0.18em] text-accent uppercase">
              {koreanCourse.subtitle}
            </p>
            <Text size="lg" className="mt-6">
              {koreanCourse.description}
            </Text>
          </Reveal>

          <Reveal delay={120}>
            <ol className="mt-10 grid gap-3 sm:grid-cols-3">
              {koreanCourse.levels.map((level, i) => (
                <li
                  key={level.name}
                  className="relative overflow-hidden rounded-2xl border border-border bg-background/40 p-4"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-gold-400 to-transparent"
                    style={{ width: `${((i + 1) / 3) * 100}%` }}
                  />
                  <p className="text-xs text-subtle">{i + 1}-bosqich</p>
                  <p className="mt-1 font-semibold text-foreground">{level.name}</p>
                  <p className="mt-2 text-xs text-gold-200">
                    {level.exam} · {level.grade}
                  </p>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={200}>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {koreanCourse.highlights.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <span
                    aria-hidden="true"
                    className="mt-1 grid size-4 shrink-0 place-items-center rounded-full border border-gold-400/50 text-[0.5rem] text-gold-300"
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={enrollHref} size="lg">
                Koreys tiliga yozilish
              </ButtonLink>
              <ButtonLink href="/#kurslar" size="lg" variant="secondary">
                Barcha kurslar
              </ButtonLink>
            </div>
          </Reveal>
        </div>

        {/* 3D card stack */}
        <Reveal delay={150} className="mx-auto w-full max-w-md lg:max-w-lg">
          <div aria-hidden="true" className="relative aspect-[4/5]">
            <div className="absolute inset-[6%] translate-x-6 translate-y-6 rotate-6 rounded-[2rem] border border-border bg-navy-900/60" />
            <div className="absolute inset-[6%] translate-x-3 translate-y-3 rotate-3 rounded-[2rem] border border-border bg-navy-900/80" />
            <TiltCard intensity={14} className="absolute inset-[6%] rounded-[2rem]">
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border border-gold-400/40 bg-linear-to-br from-navy-800 via-navy-950 to-ink p-8 shadow-card preserve-3d">
                <div className="absolute -top-20 -right-20 size-64 rounded-full bg-gold-400/15 blur-3xl" />
                <div className="relative flex items-center justify-between">
                  <span className="text-xs font-medium tracking-eyebrow text-accent uppercase">
                    M.ACADEMY
                  </span>
                  <span className="rounded-full border border-gold-400/40 px-3 py-1 text-xs text-gold-200">
                    TOPIK
                  </span>
                </div>
                <p
                  lang="ko"
                  className="relative [transform:translateZ(60px)] text-gold-foil font-korean text-[clamp(4.5rem,16vw,7.5rem)] leading-none"
                >
                  한국어
                </p>
                <div className="relative">
                  <p className="font-display text-3xl text-foreground">Koreys tili</p>
                  <div className="mt-4 flex gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <span
                        key={n}
                        className="h-1 flex-1 rounded-full bg-linear-to-r from-gold-300 to-gold-600"
                        style={{ opacity: 0.35 + n * 0.1 }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-subtle">TOPIK 1–6 darajalar</p>
                </div>
              </div>
            </TiltCard>
            {floatingSyllables.map((s, i) => (
              <span
                key={s.char}
                lang="ko"
                className={`absolute font-korean text-gold-300/40 ${s.className}`}
                style={{ transform: `translateZ(${s.depth}px)` }}
              >
                <span className={i % 2 ? "block animate-float-delayed" : "block animate-float"}>
                  {s.char}
                </span>
              </span>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
