export type NavItem = {
  label: string;
  href: string;
  /** id of the on-page section this link targets (enables active-state tracking) */
  sectionId?: string;
};

export type SocialPlatform = "telegram" | "instagram" | "youtube" | "facebook";

export type SocialLink = {
  platform: SocialPlatform;
  label: string;
  /** null until the official account URL is provided — rendered as "coming soon" */
  href: string | null;
};
