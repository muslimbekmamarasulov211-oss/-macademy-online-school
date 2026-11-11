"use client";

import { useEffect, useRef, useState } from "react";

import { SampleBadge } from "@/components/ui";
import type { Teacher } from "@/content/home";
import { cn } from "@/lib/cn";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .replace(/[^\p{L}]/gu, "")
    .slice(0, 2)
    .toUpperCase();
}

/** Horizontally scrolling teacher cards with snap and prev/next controls. */
export function TeacherCarousel({ teachers, sample }: { teachers: Teacher[]; sample: boolean }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      setCanPrev(track.scrollLeft > 4);
      setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
    };
    const observer = new ResizeObserver(update);
    observer.observe(track);
    track.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", update);
    };
  }, []);

  const scroll = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const navButton =
    "grid size-12 place-items-center rounded-full border border-border-strong text-foreground transition-all duration-300 enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-30";

  return (
    <div className="mt-12 lg:mt-16">
      <div className="mb-6 flex justify-end gap-3">
        <button
          type="button"
          className={navButton}
          onClick={() => scroll(-1)}
          disabled={!canPrev}
          aria-label="Oldingi ustozlar"
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          type="button"
          className={navButton}
          onClick={() => scroll(1)}
          disabled={!canNext}
          aria-label="Keyingi ustozlar"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <ul
        ref={trackRef}
        aria-label="Ustozlar roʻyxati"
        className="-mx-5 scrollbar-none flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto scroll-smooth px-5 pb-4 sm:-mx-8 sm:scroll-px-8 sm:px-8"
      >
        {teachers.map((teacher, i) => (
          <li
            key={teacher.name}
            className="w-[78%] shrink-0 snap-start sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.84rem)] xl:w-[calc(25%-0.94rem)]"
          >
            <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-linear-to-b from-surface-raised to-surface p-6 transition-all duration-500 hover:-translate-y-1 hover:border-gold-400/40 hover:shadow-card">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_30%,var(--color-navy-700),var(--color-navy-950))]">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgb(212_171_79/0.35),transparent_60%)] opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 grid place-items-center text-gold-foil font-display text-7xl font-semibold transition-transform duration-700 ease-out-expo group-hover:scale-110"
                >
                  {initials(teacher.name)}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute top-4 left-4 font-display text-sm text-subtle"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {sample && <SampleBadge className="absolute top-3 right-3" />}
              </div>
              <h3 className="mt-6 text-lg font-semibold text-foreground">{teacher.name}</h3>
              <p className="mt-1 text-sm text-accent">{teacher.subject}</p>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4 text-xs">
                <span className="rounded-full bg-surface-raised px-3 py-1 text-muted">
                  {teacher.experience}
                </span>
                <span
                  className={cn("rounded-full border border-gold-400/30 px-3 py-1 text-gold-200")}
                >
                  {teacher.credential}
                </span>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
