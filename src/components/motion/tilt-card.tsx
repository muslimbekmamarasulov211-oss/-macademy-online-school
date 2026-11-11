"use client";

import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees. */
  intensity?: number;
};

/**
 * 3D tilt with a soft gold glare that follows the pointer. Only reacts to a
 * mouse/pen (not touch) and is disabled when the user prefers reduced motion.
 */
export function TiltCard({ children, className, intensity = 8 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glare", "0");
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--rx", `${(0.5 - y) * intensity}deg`);
      el.style.setProperty("--ry", `${(x - 0.5) * intensity}deg`);
      el.style.setProperty("--gx", `${x * 100}%`);
      el.style.setProperty("--gy", `${y * 100}%`);
      el.style.setProperty("--glare", "1");
    });
  };

  return (
    <div className="h-full perspective-scene">
      <div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
        className={cn(
          "relative h-full transition-transform duration-500 ease-out-expo will-change-transform preserve-3d",
          className,
        )}
        style={
          {
            transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
          } as CSSProperties
        }
      >
        {children}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-500"
          style={{
            opacity: "var(--glare, 0)",
            background:
              "radial-gradient(420px circle at var(--gx, 50%) var(--gy, 50%), rgb(212 171 79 / 0.14), transparent 45%)",
          }}
        />
      </div>
    </div>
  );
}
