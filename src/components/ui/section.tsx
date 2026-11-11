import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type SectionProps = ComponentProps<"section"> & {
  tone?: "default" | "surface";
};

/** Vertical rhythm wrapper for page sections. */
export function Section({ tone = "default", className, ...props }: SectionProps) {
  return (
    <section
      className={cn(
        "py-20 sm:py-24 lg:py-32",
        tone === "surface" && "border-y border-border bg-surface",
        className,
      )}
      {...props}
    />
  );
}
