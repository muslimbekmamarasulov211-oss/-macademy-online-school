import { nigina } from "@/content/home";
import { cn } from "@/lib/cn";

import { NiginaOrb } from "./nigina-orb";

/**
 * Visual interface of the NIGINA assistant. The assistant is NOT live yet:
 * the input is disabled and nothing pretends to answer (CLAUDE.md rule 8).
 */
type NiginaPanelProps = {
  className?: string;
  headingId?: string;
  /** Opaque surface for overlays (frosted glass needs a static backdrop to stay legible). */
  solid?: boolean;
};

export function NiginaPanel({ className, headingId, solid = false }: NiginaPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl shadow-card",
        solid ? "border border-border-strong bg-surface" : "glass",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <NiginaOrb size="sm" />
        <div className="min-w-0 flex-1">
          <p
            id={headingId}
            className="font-display text-xl font-semibold tracking-wide text-foreground"
          >
            {nigina.name}
          </p>
          <p className="truncate text-xs text-subtle">{nigina.role}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-400/10 px-2.5 py-1 text-[0.6875rem] font-medium text-gold-200">
          <span className="size-1.5 animate-pulse rounded-full bg-gold-300" />
          {nigina.status}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <div className="flex items-end gap-2.5">
          <NiginaOrb size="sm" className="size-7" />
          <p className="max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-surface-raised/80 px-4 py-3 text-sm leading-relaxed text-foreground">
            {nigina.intro}
          </p>
        </div>

        <div>
          <p className="text-xs text-subtle">Tez orada soʻrashingiz mumkin boʻlgan savollar:</p>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {nigina.suggestions.map((s) => (
              <li
                key={s}
                className="rounded-full border border-dashed border-border-strong px-3 py-1.5 text-xs text-muted"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background/60 py-1.5 pr-1.5 pl-4">
          <label className="sr-only" htmlFor={`${headingId ?? "nigina"}-input`}>
            NIGINA ga xabar
          </label>
          <input
            id={`${headingId ?? "nigina"}-input`}
            disabled
            placeholder="NIGINA tez orada ishga tushadi…"
            className="min-w-0 flex-1 cursor-not-allowed bg-transparent text-sm text-foreground placeholder:text-subtle focus:outline-none"
          />
          <button
            type="button"
            disabled
            aria-label="Yuborish (tez orada)"
            className="grid size-9 cursor-not-allowed place-items-center rounded-full bg-gold-400/30 text-navy-950"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <p className="mt-3 text-center text-[0.6875rem] text-subtle">
          Bu NIGINA interfeysining koʻrinishi. AI yordamchi hali ishga tushirilmagan.
        </p>
      </div>
    </div>
  );
}
