import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

/**
 * Monogram + wordmark. Replace with the official SVG logo once brand assets exist.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/#bosh"
      className={cn("group inline-flex items-center gap-3 rounded-sm", className)}
      aria-label={`${siteConfig.fullName} — bosh sahifa`}
    >
      <span
        aria-hidden="true"
        className="relative grid size-9 place-items-center rounded-full border border-gold-400/50 bg-linear-to-br from-gold-400/20 to-transparent font-display text-lg font-semibold text-gold-300 shadow-glow transition-transform duration-500 ease-out-expo group-hover:rotate-[360deg]"
      >
        M
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-semibold tracking-wide text-foreground">
          M<span className="text-accent">.</span>ACADEMY
        </span>
        <span className="mt-1 text-[0.5625rem] font-medium tracking-eyebrow text-subtle uppercase">
          Online School
        </span>
      </span>
    </Link>
  );
}
