"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { NiginaOrb, NiginaPanel } from "@/components/nigina";

/**
 * Floating NIGINA button. Opens a preview of the assistant's interface;
 * the assistant itself is not live yet and the panel says so.
 */
export function NiginaLauncher() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const headingId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <div
        id={panelId}
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={headingId}
        tabIndex={-1}
        hidden={!open}
        className="w-[min(22rem,calc(100vw-2rem))] animate-fade-up focus:outline-none"
      >
        <NiginaPanel headingId={headingId} solid />
        <Link
          href="/#nigina"
          onClick={() => setOpen(false)}
          className="mx-auto mt-2 block w-fit rounded-full border border-border-strong bg-surface px-4 py-1.5 text-center text-xs text-muted transition-colors hover:border-accent hover:text-accent"
        >
          NIGINA haqida batafsil
        </Link>
      </div>

      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "NIGINA oynasini yopish" : "NIGINA AI yordamchisi (tez orada)"}
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-3 rounded-full glass p-1.5 shadow-card transition-transform duration-300 hover:-translate-y-0.5 sm:pr-5"
      >
        <NiginaOrb size="sm" />
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-sm font-semibold tracking-wide text-foreground">NIGINA</span>
          <span className="text-[0.6875rem] text-subtle">
            {open ? "Yopish" : "AI yordamchi · tez orada"}
          </span>
        </span>
      </button>
    </div>
  );
}
