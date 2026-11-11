import { cn } from "@/lib/cn";

/** NIGINA's visual identity: a luminous gold orb with an orbiting ring. */
export function NiginaOrb({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "xl";
}) {
  const sizes = { sm: "size-10", md: "size-14", xl: "size-56 sm:size-72" } as const;
  return (
    <span
      aria-hidden="true"
      className={cn("relative inline-grid shrink-0 place-items-center", sizes[size], className)}
    >
      <span className="absolute inset-0 animate-pulse-glow rounded-full bg-gold-400/30 blur-xl" />
      <span className="absolute inset-0 animate-spin-slow rounded-full bg-[conic-gradient(from_0deg,transparent_0%,rgb(212_171_79/0.9)_18%,transparent_36%,transparent_60%,rgb(130_153_196/0.7)_75%,transparent_92%)] p-px [mask:radial-gradient(farthest-side,transparent_calc(100%-2px),black_calc(100%-1px))]" />
      <span className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle_at_32%_28%,var(--color-gold-100),var(--color-gold-400)_35%,var(--color-gold-700)_70%,var(--color-navy-950)_100%)] shadow-[inset_0_-8px_24px_rgb(5_8_15/0.6),0_0_40px_rgb(212_171_79/0.35)]" />
      <span className="absolute inset-[30%] animate-float rounded-full bg-[radial-gradient(circle_at_40%_35%,rgb(255_255_255/0.7),transparent_60%)] opacity-60 blur-[2px]" />
    </span>
  );
}
