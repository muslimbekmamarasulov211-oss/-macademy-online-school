import type { ComponentProps, ElementType, ReactNode } from "react";

import { cn } from "@/lib/cn";

/* --------------------------------------------------------------------------
   Heading — visual size is independent of semantic level (h1–h4), so the
   document outline stays correct whatever the design calls for.
   -------------------------------------------------------------------------- */

type HeadingLevel = 1 | 2 | 3 | 4;
type HeadingSize = "2xl" | "xl" | "lg" | "md" | "sm";

const headingSizes: Record<HeadingSize, string> = {
  "2xl": "font-display text-display-2xl font-medium",
  xl: "font-display text-display-xl font-medium",
  lg: "font-display text-display-lg font-medium",
  md: "font-display text-display-md font-medium",
  sm: "font-sans text-lg font-semibold tracking-tight",
};

type HeadingProps = {
  level?: HeadingLevel;
  size?: HeadingSize;
  className?: string;
  children: ReactNode;
  id?: string;
};

export function Heading({ level = 2, size = "lg", className, children, id }: HeadingProps) {
  const Tag = `h${level}` as ElementType;
  return (
    <Tag id={id} className={cn("text-balance text-foreground", headingSizes[size], className)}>
      {children}
    </Tag>
  );
}

/* --------------------------------------------------------------------------
   Text — body copy
   -------------------------------------------------------------------------- */

type TextSize = "lg" | "md" | "sm";

const textSizes: Record<TextSize, string> = {
  lg: "text-lg leading-relaxed sm:text-xl",
  md: "text-base leading-relaxed",
  sm: "text-sm leading-relaxed",
};

type TextProps = ComponentProps<"p"> & {
  size?: TextSize;
  tone?: "muted" | "subtle" | "default";
};

const textTones = {
  default: "text-foreground",
  muted: "text-muted",
  subtle: "text-subtle",
} as const;

export function Text({ size = "md", tone = "muted", className, ...props }: TextProps) {
  return (
    <p className={cn("text-pretty", textSizes[size], textTones[tone], className)} {...props} />
  );
}

/* --------------------------------------------------------------------------
   Eyebrow — small gold uppercase label above headings
   -------------------------------------------------------------------------- */

export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-xs font-medium tracking-eyebrow text-accent uppercase",
        className,
      )}
      {...props}
    />
  );
}
