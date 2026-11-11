import { ButtonLink, Container } from "@/components/ui";
import { enrollHref, mainNav } from "@/config/site";

import { DesktopNav } from "./desktop-nav";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";

const CTA_LABEL = "Roʻyxatdan oʻtish";

export function SiteHeader() {
  return (
    <header className="header-surface fixed inset-x-0 top-0 z-40 border-b backdrop-blur-xl">
      <Container size="wide" className="relative flex h-18 items-center justify-between gap-6">
        <Logo />
        <DesktopNav items={mainNav} />
        <div className="flex items-center gap-3">
          <ButtonLink href={enrollHref} size="sm" className="hidden sm:inline-flex">
            {CTA_LABEL}
          </ButtonLink>
          <MobileNav items={mainNav} ctaHref={enrollHref} ctaLabel={CTA_LABEL} />
        </div>
      </Container>
    </header>
  );
}
