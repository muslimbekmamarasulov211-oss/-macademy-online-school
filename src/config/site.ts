import type { NavItem, SocialLink } from "@/types/navigation";

/**
 * Single source of truth for brand identity and navigation.
 * Navigation only lists destinations that actually exist. Add routes here
 * as real pages are built — never link to pages that do not exist yet.
 */
export const siteConfig = {
  name: "M.ACADEMY",
  fullName: "M.ACADEMY ONLINE SCHOOL",
  slogan: "BEYOND LEARNING. BEYOND LIMITS.",
  tagline: "Xalqaro darajadagi premium onlayn taʼlim",
  description:
    "M.ACADEMY ONLINE SCHOOL — xalqaro darajadagi premium onlayn maktab. Tizimli dasturlar, eʼtiborli oʻqitish va natijaga yoʻnaltirilgan taʼlim.",
  /** Default UI language: Uzbek (Latin script) */
  locale: "uz",
  ogLocale: "uz_UZ",
} as const;

/** Homepage sections. Every link targets a section that exists on the page. */
export const mainNav: NavItem[] = [
  { label: "Bosh sahifa", href: "/#bosh", sectionId: "bosh" },
  { label: "Kurslar", href: "/#kurslar", sectionId: "kurslar" },
  { label: "Ustozlar", href: "/#ustozlar", sectionId: "ustozlar" },
  { label: "Natijalar", href: "/#natijalar", sectionId: "natijalar" },
  { label: "Biz haqimizda", href: "/#biz-haqimizda", sectionId: "biz-haqimizda" },
  { label: "Aloqa", href: "/#aloqa", sectionId: "aloqa" },
];

/** Where every enrollment CTA leads until online enrollment exists. */
export const enrollHref = "/#aloqa";

/**
 * Official social accounts. `href: null` means the account is not provided
 * yet — the UI shows it as "Tez orada" (coming soon) instead of a dead link.
 * Fill in real URLs here; no other code changes are needed.
 */
export const socialLinks: SocialLink[] = [
  { platform: "telegram", label: "Telegram", href: null },
  { platform: "instagram", label: "Instagram", href: null },
  { platform: "youtube", label: "YouTube", href: null },
  { platform: "facebook", label: "Facebook", href: null },
];

export type ContactChannel = {
  label: string;
  /** Displayed value, e.g. "+998 …" — null until provided */
  value: string | null;
  /** tel:/mailto:/https: link — null until provided */
  href: string | null;
};

/** Official contact channels. Fill in real values; nothing is shown until then. */
export const contactChannels: ContactChannel[] = [
  { label: "Telefon", value: null, href: null },
  { label: "Telegram", value: null, href: null },
  { label: "Elektron pochta", value: null, href: null },
];
