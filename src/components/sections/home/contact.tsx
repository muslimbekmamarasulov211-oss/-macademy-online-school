import { SocialLinks } from "@/components/layout/social-links";
import { Reveal } from "@/components/motion";
import { Container, Section, SectionHeader } from "@/components/ui";
import { contactChannels } from "@/config/site";

/**
 * Contact & enrollment. There is no backend yet, so instead of a form that
 * cannot submit, this section honestly states that enrollment opens soon.
 * Channels appear automatically once real values are set in config/site.ts.
 */
export function Contact() {
  return (
    <Section id="aloqa" tone="surface" aria-labelledby="aloqa-heading">
      <Container size="wide" className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <SectionHeader
          id="aloqa-heading"
          eyebrow="Aloqa"
          title="Biz bilan bogʻlaning"
          description="Kurslar, oʻqish tartibi va qabul haqidagi savollaringiz uchun rasmiy aloqa kanallarimiz shu yerda boʻladi."
        />

        <Reveal delay={120}>
          <div className="rounded-3xl border border-gold-400/30 bg-background/60 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="grid size-12 shrink-0 place-items-center rounded-full border border-gold-400/40 bg-gold-400/10 text-gold-200"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" d="M12 7v5l3 2" />
                </svg>
              </span>
              <div>
                <h3 className="font-display text-2xl font-medium text-foreground">
                  Qabul tez orada ochiladi
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Onlayn roʻyxatdan oʻtish hozircha ishga tushirilmagan. Qabul ochilishi bilan aloqa
                  maʼlumotlari va roʻyxatdan oʻtish shakli shu boʻlimda eʼlon qilinadi.
                </p>
              </div>
            </div>

            <ul className="mt-8 divide-y divide-border border-y border-border">
              {contactChannels.map((channel) => (
                <li key={channel.label} className="flex items-center justify-between gap-4 py-4">
                  <span className="text-sm text-muted">{channel.label}</span>
                  {channel.href && channel.value ? (
                    <a
                      href={channel.href}
                      className="text-sm font-medium text-foreground transition-colors hover:text-accent"
                    >
                      {channel.value}
                    </a>
                  ) : (
                    <span className="rounded-full border border-dashed border-border-strong px-3 py-1 text-xs text-subtle">
                      Tez orada
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <p className="mt-8 text-xs font-medium tracking-eyebrow text-subtle uppercase">
              Ijtimoiy tarmoqlar
            </p>
            <SocialLinks className="mt-4" />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
