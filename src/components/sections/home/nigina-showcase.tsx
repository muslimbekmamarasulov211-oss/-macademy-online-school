import { Reveal, TiltCard } from "@/components/motion";
import { NiginaOrb, NiginaPanel } from "@/components/nigina";
import { Container, Section, SectionHeader } from "@/components/ui";
import { nigina } from "@/content/home";

export function NiginaShowcase() {
  return (
    <Section id="nigina" aria-labelledby="nigina-heading" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_75%_50%,rgb(32_49_86/0.5),transparent_70%)]"
      />
      <Container size="wide" className="relative grid items-center gap-16 lg:grid-cols-2">
        <div>
          <SectionHeader
            id="nigina-heading"
            eyebrow="Sunʼiy intellekt"
            title={
              <>
                <span className="text-gold-foil">{nigina.name}</span> — shaxsiy AI yordamchingiz
              </>
            }
            description="NIGINA — M.ACADEMY uchun ishlab chiqilayotgan AI yordamchi. U ishga tushgach, oʻqishingizning har bosqichida yoningizda boʻladi."
          />
          <Reveal delay={120}>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-2 text-sm text-gold-200">
              <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-gold-300" />
              Holati: {nigina.status.toLowerCase()} ishga tushadi
            </p>
            <h3 className="mt-10 text-xs font-medium tracking-eyebrow text-subtle uppercase">
              Rejalashtirilgan imkoniyatlar
            </h3>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {nigina.plannedFeatures.map((f) => (
                <li key={f.title} className="rounded-2xl border border-border bg-surface/60 p-5">
                  <p className="font-semibold text-foreground">{f.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={150} className="relative mx-auto w-full max-w-md">
          <NiginaOrb size="xl" className="absolute -top-16 -right-10 opacity-70 sm:-right-16" />
          <TiltCard intensity={6} className="rounded-3xl">
            <NiginaPanel headingId="nigina-preview-title" className="relative" />
          </TiltCard>
        </Reveal>
      </Container>
    </Section>
  );
}
