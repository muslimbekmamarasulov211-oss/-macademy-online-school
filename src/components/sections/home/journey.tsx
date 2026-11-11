import { Reveal } from "@/components/motion";
import { Container, Section, SectionHeader } from "@/components/ui";
import { journeySteps } from "@/content/home";

export function Journey() {
  return (
    <Section id="yol" aria-labelledby="yol-heading" className="relative overflow-hidden">
      <Container size="wide">
        <SectionHeader
          id="yol-heading"
          eyebrow="Oʻqish yoʻli"
          title="Birinchi qadamdan — yorqin natijagacha"
          description="M.ACADEMY da oʻqish aniq bosqichlardan iborat. Har bir qadamda nima qilishingizni va qayerga borayotganingizni bilasiz."
        />

        <ol className="relative mt-14 grid gap-10 lg:mt-20 lg:grid-cols-5 lg:gap-6">
          {/* Connector: vertical on mobile, horizontal on desktop, with a travelling light */}
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-[1.375rem] w-px overflow-hidden bg-border-strong lg:top-[1.375rem] lg:right-[10%] lg:bottom-auto lg:left-[10%] lg:h-px lg:w-auto"
          >
            <span className="absolute inset-0 hidden animate-sweep bg-linear-to-r from-transparent via-gold-300 to-transparent lg:block lg:w-1/4" />
          </span>

          {journeySteps.map((step, i) => (
            <Reveal
              as="li"
              key={step.title}
              delay={i * 110}
              className="relative flex gap-5 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
            >
              <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full border border-gold-400/50 bg-background font-display text-lg font-semibold text-gold-200 shadow-glow">
                {i + 1}
              </span>
              <div className="lg:mt-6">
                <h3 className="font-display text-2xl font-medium text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
