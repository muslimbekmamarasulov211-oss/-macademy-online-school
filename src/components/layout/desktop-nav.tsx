"use client";

import Link from "next/link";

import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/types/navigation";

/** Primary navigation (lg+) with an animated gold indicator on the active section. */
export function DesktopNav({ items }: { items: NavItem[] }) {
  const active = useActiveSection(
    items.flatMap((item) => (item.sectionId ? [item.sectionId] : [])),
  );

  return (
    <nav aria-label="Asosiy menyu" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const isActive = item.sectionId === active;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "relative block rounded-full px-3.5 py-2 text-sm transition-colors duration-300",
                  isActive ? "text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-3.5 -bottom-0.5 h-px origin-center bg-linear-to-r from-transparent via-gold-400 to-transparent transition-transform duration-500 ease-out-expo",
                    isActive ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
