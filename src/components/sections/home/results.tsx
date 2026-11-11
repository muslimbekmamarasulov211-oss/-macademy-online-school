import { CountUp, Reveal, TiltCard } from "@/components/motion";
import { Container, SampleBadge, Section, SectionHeader } from "@/components/ui";
import { achievements, resultStats, resultsAreSample } from "@/content/home";

export function Results() {
  return (
    <Section
      id="natijalar"
      tone="surface"
      aria-labelledby="natijalar-heading"
      className="relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-gold-400/8 blur-[100px]"
      />
      <Container size="wide" className="relative">
        <SectionHeader
          id="natijalar-heading"
          eyebrow="Natijalar"
          align="center"
          title="Raqamlar va yutuqlar"
          description="Oʻquvchilarimiz natijalari — bizning eng muhim koʻrsatkichimiz."
          sample={resultsAreSample}
          sampleLabel="Namuna natijalar"
        />

        <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border lg:mt-16 lg:grid-cols-4">
          {resultStats.map((stat, i) => (
            <Reveal
              key={stat.label}
              delay={i * 90}
              className="flex flex-col-reverse bg-surface p-6 text-center sm:p-10"
            >
              <dt className="mt-3 text-sm text-muted">{stat.label}</dt>
              <dd className="text-gold-foil font-display text-[clamp(2.5rem,6vw,4rem)] leading-none font-semibold lining-nums">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </dd>
            </Reveal>
          ))}
        </dl>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {achievements.map((a, i) => (
            <Reveal as="li" key={a.student} delay={(i % 3) * 100}>
              <TiltCard className="rounded-2xl">
                <article className="relative flex h-full items-center gap-5 overflow-hidden rounded-2xl border border-border bg-background/50 p-5 sm:p-6">
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-0.5 bg-linear-to-b from-gold-300 via-gold-500 to-transparent"
                  />
                  <div className="grid min-w-[5.5rem] place-items-center rounded-xl border border-gold-400/25 bg-gold-400/5 px-3 py-3 text-center">
                    <p className="text-[0.625rem] tracking-eyebrow text-accent uppercase">
                      {a.exam}
                    </p>
                    <p className="mt-1 font-display text-2xl leading-tight font-semibold text-foreground lining-nums">
                      {a.score}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{a.student}</p>
                    <p className="mt-1 text-sm text-muted">{a.note}</p>
                    {resultsAreSample && <SampleBadge className="mt-2" />}
                  </div>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
