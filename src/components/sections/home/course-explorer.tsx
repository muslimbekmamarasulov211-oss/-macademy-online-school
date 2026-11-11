"use client";

import Link from "next/link";
import { useState } from "react";

import { TiltCard } from "@/components/motion";
import type { Subject, SubjectCategory, SubjectCategoryId } from "@/content/home";
import { cn } from "@/lib/cn";

type Filter = "all" | SubjectCategoryId;

/** Number of course tiles shown on phones before "show all". */
const MOBILE_PREVIEW = 6;

type CourseExplorerProps = {
  subjects: Subject[];
  categories: SubjectCategory[];
};

/** Interactive course grid with category filters. */
export function CourseExplorer({ subjects, categories }: CourseExplorerProps) {
  const [filter, setFilter] = useState<Filter>("all");
  /** Phones only: the full list is long, so it starts collapsed. */
  const [expanded, setExpanded] = useState(false);
  const categoryLabel = Object.fromEntries(categories.map((c) => [c.id, c.label]));
  const visible = filter === "all" ? subjects : subjects.filter((s) => s.category === filter);

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "Barchasi", count: subjects.length },
    ...categories.map((c) => ({
      id: c.id,
      label: c.label,
      count: subjects.filter((s) => s.category === c.id).length,
    })),
  ];

  return (
    <div className="mt-12 lg:mt-16">
      <div
        role="group"
        aria-label="Kurs yoʻnalishlari"
        className="-mx-5 scrollbar-none flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {filters.map((f) => {
          const active = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setFilter(f.id);
                setExpanded(false);
              }}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-300",
                active
                  ? "border-gold-400 bg-gold-400 text-navy-950 shadow-glow"
                  : "border-border-strong text-muted hover:border-gold-400/60 hover:text-foreground",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  active ? "bg-navy-950/15" : "bg-surface-raised text-subtle",
                )}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="sr-only">
        {visible.length} ta fan koʻrsatilmoqda
      </p>

      <ul key={filter} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {visible.map((subject, index) => {
          const number = subjects.indexOf(subject) + 1;
          return (
            <li
              key={subject.name}
              className={cn(
                "animate-fade-up",
                !expanded && index >= MOBILE_PREVIEW && "max-sm:hidden",
              )}
              style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
            >
              <TiltCard className="rounded-2xl">
                <article
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-surface-raised/50 p-6 transition-colors duration-300 hover:border-gold-400/40",
                    subject.featured ? "border-gold-400/40" : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="relative grid size-14 [transform:translateZ(30px)] place-items-center rounded-xl border border-gold-400/30 bg-linear-to-br from-gold-400/15 via-transparent to-transparent font-display text-xl font-semibold text-gold-200">
                      {subject.symbol}
                    </span>
                    <span className="font-display text-sm text-subtle tabular-nums">
                      {String(number).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">
                    {subject.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {subject.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                    <span className="text-xs tracking-wide text-subtle">
                      {categoryLabel[subject.category]}
                    </span>
                    {subject.featured ? (
                      <Link
                        href="/#koreys-tili"
                        className="text-xs font-medium text-accent transition-colors hover:text-accent-hover"
                      >
                        Tanlangan kurs →
                      </Link>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="text-gold-400/60 transition-transform duration-300 group-hover:translate-x-1"
                      >
                        →
                      </span>
                    )}
                  </div>
                </article>
              </TiltCard>
            </li>
          );
        })}
      </ul>

      {visible.length > MOBILE_PREVIEW && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="mt-6 w-full rounded-full border border-border-strong py-3 text-sm text-foreground transition-colors hover:border-accent sm:hidden"
        >
          {expanded
            ? "Kamroq koʻrsatish"
            : `Yana ${visible.length - MOBILE_PREVIEW} ta fanni koʻrsatish`}
        </button>
      )}
    </div>
  );
}
