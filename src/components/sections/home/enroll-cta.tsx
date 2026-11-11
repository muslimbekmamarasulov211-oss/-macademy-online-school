import { Reveal } from "@/components/motion";
import { ButtonLink, Container, Section } from "@/components/ui";
import { enrollHref, siteConfig } from "@/config/site";

export function EnrollCta() {
  return (
    <Section aria-labelledby="cta-heading" className="pt-0 sm:pt-0 lg:pt-0">
      <Container size="wide">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[2rem] border border-gold-400/30 bg-linear-to-br from-navy-800 via-navy-950 to-ink px-6 py-16 text-center sm:px-12 sm:py-24">
            <div
              aria-hidden="true"
              className="absolute -top-32 left-1/2 -z-10 h-72 w-[40rem] -translate-x-1/2 animate-pulse-glow rounded-full bg-gold-400/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(212_171_79/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(212_171_79/0.07)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_70%)] bg-size-[48px_48px]"
            />
            <p className="text-xs font-medium tracking-[0.34em] text-accent">{siteConfig.slogan}</p>
            <h2
              id="cta-heading"
              className="mx-auto mt-6 max-w-3xl font-display text-display-xl font-medium text-balance text-foreground"
            >
              Kelajagingizni <span className="text-gold-foil">bugun</span> boshlang
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted">
              Maqsadingizni ayting — biz unga olib boruvchi yoʻlni birgalikda tuzamiz.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <ButtonLink href={enrollHref} size="lg">
                Roʻyxatdan oʻtish
                <span aria-hidden="true">→</span>
              </ButtonLink>
              <ButtonLink href="/#kurslar" size="lg" variant="secondary">
                Kurslarni koʻrish
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
