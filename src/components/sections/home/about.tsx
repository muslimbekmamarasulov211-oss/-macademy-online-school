import { Reveal, TiltCard } from "@/components/motion";
import { Container, Section, SectionHeader } from "@/components/ui";
import { siteConfig } from "@/config/site";
import { principles } from "@/content/home";

export function About() {
  return (
    <Section
      id="biz-haqimizda"
      tone="surface"
      aria-labelledby="biz-haqimizda-heading"
      className="relative overflow-hidden"
    >
      <Container size="wide" className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <SectionHeader
            id="biz-haqimizda-heading"
            eyebrow="Biz haqimizda"
            title="Taʼlimdan ham ortiq — chegarasiz imkoniyat"
            description="M.ACADEMY ONLINE SCHOOL — dunyoning istalgan nuqtasidagi oʻquvchilar uchun yaratilayotgan premium onlayn maktab. Maqsadimiz: har bir oʻquvchiga xalqaro darajadagi bilim va oʻz salohiyatini toʻliq ochish imkonini berish."
          />
          <Reveal delay={150}>
            <figure className="mt-10 border-l border-gold-400/60 pl-6">
              <blockquote className="font-display text-2xl leading-snug text-foreground italic sm:text-3xl">
                “{siteConfig.slogan}”
              </blockquote>
              <figcaption className="mt-3 text-sm text-subtle">— M.ACADEMY shiori</figcaption>
            </figure>
          </Reveal>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:gap-5">
          {principles.map((principle, index) => (
            <Reveal as="li" key={principle.title} delay={index * 100}>
              <TiltCard className="rounded-2xl">
                <article className="h-full rounded-2xl border border-border bg-background/50 p-6 sm:p-8">
                  <span aria-hidden="true" className="text-gold-foil font-display text-4xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                    {principle.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{principle.body}</p>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
