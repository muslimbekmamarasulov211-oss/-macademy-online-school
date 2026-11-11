import { Container } from "@/components/ui";
import { siteConfig } from "@/config/site";

import { CopyrightYear } from "./copyright-year";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <Container
        size="wide"
        className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="text-sm text-subtle">{siteConfig.tagline}</p>
        </div>
        <p className="text-sm text-subtle">
          © <CopyrightYear /> {siteConfig.fullName}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
