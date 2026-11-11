import Link from "next/link";

import { Container } from "@/components/ui";
import { mainNav, siteConfig } from "@/config/site";
import { subjects } from "@/content/home";

import { CopyrightYear } from "./copyright-year";
import { Logo } from "./logo";
import { SocialLinks } from "./social-links";

const footerSubjects = subjects.filter((s) =>
  ["Koreys tili", "Ingliz tili", "Matematika", "IELTS", "Dasturlash"].includes(s.name),
);

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[50rem] -translate-x-1/2 rounded-full bg-gold-400/5 blur-3xl"
      />
      <Container size="wide" className="relative py-16 sm:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="flex flex-col gap-5">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted">{siteConfig.tagline}.</p>
            <p className="text-gold-foil font-display text-lg tracking-[0.18em]">
              {siteConfig.slogan}
            </p>
          </div>

          <nav aria-label="Sayt sahifalari">
            <h2 className="text-xs font-medium tracking-eyebrow text-accent uppercase">
              Sahifalar
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-medium tracking-eyebrow text-accent uppercase">
              Ommabop kurslar
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
              {footerSubjects.map((subject) => (
                <li key={subject.name}>
                  <Link
                    href="/#kurslar"
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {subject.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-medium tracking-eyebrow text-accent uppercase">
              Ijtimoiy tarmoqlar
            </h2>
            <p className="mt-5 text-sm text-subtle">
              Rasmiy sahifalarimiz tez orada ishga tushadi.
            </p>
            <SocialLinks className="mt-4" />
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 text-sm text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CopyrightYear /> {siteConfig.fullName}. Barcha huquqlar himoyalangan.
          </p>
          <Link
            href="/#bosh"
            className="inline-flex items-center gap-2 transition-colors hover:text-accent"
          >
            Yuqoriga qaytish
            <span aria-hidden="true">↑</span>
          </Link>
        </div>
      </Container>
    </footer>
  );
}
