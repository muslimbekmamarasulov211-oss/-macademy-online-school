import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

/**
 * Text wordmark. Replace with the official SVG logo once brand assets exist.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-baseline gap-2 rounded-sm", className)}
      aria-label={`${siteConfig.fullName} — home`}
    >
      <span className="font-display text-2xl font-semibold tracking-wide text-foreground">
        M<span className="text-accent">.</span>ACADEMY
      </span>
      <span className="hidden text-[0.625rem] font-medium tracking-eyebrow text-subtle uppercase sm:inline">
        Online School
      </span>
    </Link>
  );
}
