"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay before the element animates in, in ms (for staggering). */
  delay?: number;
  as?: ElementType;
};

/**
 * Cinematic scroll reveal: content rises and un-tilts into place when it
 * enters the viewport. Styles live in globals.css ([data-reveal]); content is
 * never hidden without JavaScript or for reduced-motion users.
 */
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.setAttribute("data-revealed", "");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      className={cn(className)}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
