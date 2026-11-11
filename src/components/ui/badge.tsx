import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** Small status pill, e.g. "In development". */
export function Badge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-xs font-medium text-gold-200",
        className,
      )}
      {...props}
    />
  );
}
