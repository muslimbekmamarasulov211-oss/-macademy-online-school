import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** Bordered surface for grouped content. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface-raised/40 p-6 transition-colors duration-200 hover:border-border-strong sm:p-8",
        className,
      )}
      {...props}
    />
  );
}
