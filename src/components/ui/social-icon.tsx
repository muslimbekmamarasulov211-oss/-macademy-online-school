import type { SocialPlatform } from "@/types/navigation";

/** Simple monochrome platform marks drawn with basic shapes. */
export function SocialIcon({
  platform,
  className,
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  const common = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (platform) {
    case "telegram":
      return (
        <svg {...common}>
          <path d="M21 4 3 11.2l6.3 2.3L19 7l-7.6 8.1.2 4.9 3-3.4 4.3 3.2L21 4Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <path d="m10 9 5 3-5 3V9Z" fill="currentColor" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M14.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H9v3h2.5V21" />
        </svg>
      );
  }
}
