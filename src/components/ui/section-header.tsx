import type { ReactNode } from "react";

import { Reveal } from "@/components/motion";
import { cn } from "@/lib/cn";

import { GoldRule } from "./divider";
import { SampleBadge } from "./sample-badge";
import { Eyebrow, Heading, Text } from "./typography";

type SectionHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  id?: string;
  align?: "left" | "center";
  /** Shows the "Namuna" badge for sections that use sample data. */
  sample?: boolean;
  sampleLabel?: string;
  className?: string;
};

/** Eyebrow + heading + intro used at the top of every homepage section. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  id,
  align = "left",
  sample = false,
  sampleLabel,
  className,
}: SectionHeaderProps) {
  const centered = align === "center";
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        centered && "mx-auto flex flex-col items-center text-center",
        className,
      )}
    >
      <div className={cn("flex flex-wrap items-center gap-3", centered && "justify-center")}>
        <Eyebrow>
          <GoldRule />
          {eyebrow}
          {centered && <GoldRule className="rotate-180" />}
        </Eyebrow>
        {sample && <SampleBadge label={sampleLabel} />}
      </div>
      <Heading id={id} size="xl" className="mt-5">
        {title}
      </Heading>
      {description && (
        <Text size="lg" className="mt-5">
          {description}
        </Text>
      )}
    </Reveal>
  );
}
