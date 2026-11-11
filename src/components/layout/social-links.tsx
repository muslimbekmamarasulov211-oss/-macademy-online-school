import { SocialIcon } from "@/components/ui";
import { socialLinks } from "@/config/site";
import { cn } from "@/lib/cn";

/**
 * Social account buttons. Accounts without a URL in config/site.ts render as
 * a disabled "Tez orada" item instead of a dead link.
 */
export function SocialLinks({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-3", className)}>
      {socialLinks.map((social) => {
        const base =
          "grid size-11 place-items-center rounded-full border transition-all duration-300";
        return (
          <li key={social.platform}>
            {social.href ? (
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className={cn(
                  base,
                  "border-border-strong text-muted hover:-translate-y-0.5 hover:border-accent hover:text-accent",
                )}
              >
                <SocialIcon platform={social.platform} className="size-5" />
              </a>
            ) : (
              <span
                role="img"
                aria-label={`${social.label} — tez orada`}
                title={`${social.label} — tez orada`}
                className={cn(
                  base,
                  "cursor-not-allowed border-dashed border-border text-subtle/70",
                )}
              >
                <SocialIcon platform={social.platform} className="size-5" />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
