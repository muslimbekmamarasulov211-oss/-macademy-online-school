import { cn } from "@/lib/cn";

/**
 * Marks illustrative content that is not real data yet (CLAUDE.md rule 9).
 * Remove by setting the matching `*IsSample` flag to false in src/content.
 */
export function SampleBadge({
  className,
  label = "Namuna",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      title="Namunaviy maʼlumot — haqiqiy maʼlumotlar bilan almashtiriladi"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-gold-400/50 bg-gold-400/5 px-2.5 py-0.5 text-[0.6875rem] font-medium tracking-wide text-gold-200 uppercase",
        className,
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3" fill="currentColor">
        <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM7.25 5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0V5ZM8 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
      </svg>
      {label}
    </span>
  );
}
