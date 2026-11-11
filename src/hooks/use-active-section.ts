"use client";

import { useEffect, useState } from "react";

/**
 * Scroll-spy: returns the id of the section currently in the middle band of
 * the viewport. Used to highlight the active navigation link.
 */
export function useActiveSection(ids: string[], initial: string = ids[0] ?? ""): string {
  const [active, setActive] = useState(initial);
  const key = ids.join("|");

  useEffect(() => {
    const sectionIds = key.split("|");
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      // A thin band around 40% of the viewport height decides the active section.
      { rootMargin: "-40% 0px -55% 0px" },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key]);

  return active;
}
