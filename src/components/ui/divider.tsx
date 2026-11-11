import { cn } from "@/lib/cn";

/** Thin gold rule used as a decorative accent. Hidden from assistive tech. */
export function GoldRule({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("block h-px w-12 bg-linear-to-r from-gold-400 to-gold-400/0", className)}
    />
  );
}
