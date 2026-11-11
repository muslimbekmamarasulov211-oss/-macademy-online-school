import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type ContainerProps = ComponentProps<"div"> & {
  size?: "narrow" | "default" | "wide";
};

const sizes = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
} as const;

/** Horizontally centred content with responsive gutters. */
export function Container({ size = "default", className, ...props }: ContainerProps) {
  return <div className={cn("mx-auto w-full px-5 sm:px-8", sizes[size], className)} {...props} />;
}
