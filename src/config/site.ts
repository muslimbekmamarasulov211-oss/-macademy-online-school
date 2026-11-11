import type { NavItem } from "@/types/navigation";

/**
 * Single source of truth for brand identity and navigation.
 * Navigation only lists destinations that actually exist. Add routes here
 * as real pages are built — never link to pages that do not exist yet.
 */
export const siteConfig = {
  name: "M.ACADEMY",
  fullName: "M.ACADEMY ONLINE SCHOOL",
  tagline: "Premium international online education",
  description:
    "M.ACADEMY ONLINE SCHOOL is a premium international online school, designed for focused, structured and ambitious learning.",
  locale: "en",
} as const;

export const mainNav: NavItem[] = [
  { label: "Our approach", href: "/#approach" },
  { label: "The journey", href: "/#journey" },
];
