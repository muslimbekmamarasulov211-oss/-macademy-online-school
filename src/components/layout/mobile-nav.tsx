"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/types/navigation";

type MobileNavProps = {
  items: NavItem[];
  ctaHref: string;
  ctaLabel: string;
};

/** Disclosure-style menu for small screens and tablets. Hidden from lg up. */
export function MobileNav({ items, ctaHref, ctaLabel }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const active = useActiveSection(
    items.flatMap((item) => (item.sectionId ? [item.sectionId] : [])),
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-full border border-border-strong text-foreground transition-colors hover:border-accent"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Menyuni yopish" : "Menyuni ochish"}
        onClick={() => setOpen((value) => !value)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          {open ? (
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path strokeLinecap="round" d="M4 7h16M4 12h10M4 17h16" />
          )}
        </svg>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-border bg-background shadow-2xl shadow-black/60"
      >
        <nav aria-label="Mobil menyu" className="px-5 pt-3 pb-6 sm:px-8">
          <ul className="flex flex-col">
            {items.map((item, index) => {
              const isActive = item.sectionId === active;
              return (
                <li
                  key={item.href}
                  className="animate-fade-up border-b border-border last:border-0"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <Link
                    href={item.href}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "flex items-center justify-between py-3.5 text-base transition-colors",
                      isActive ? "text-accent" : "text-muted hover:text-foreground",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                    <span aria-hidden="true" className="text-subtle">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={ctaHref}
            onClick={() => setOpen(false)}
            className={buttonStyles({ size: "md", className: "mt-5 w-full" })}
          >
            {ctaLabel}
          </Link>
        </nav>
      </div>
    </div>
  );
}
