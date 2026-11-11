import { subjects } from "@/content/home";

/** Infinite ribbon of subject names between the hero and the courses. */
export function SubjectMarquee() {
  const names = subjects.map((s) => s.name);
  return (
    <div className="relative overflow-hidden border-y border-border bg-surface mask-[linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] py-5">
      <p className="sr-only">Fanlar: {names.join(", ")}</p>
      <div
        aria-hidden="true"
        className="flex w-max animate-marquee hover:[animation-play-state:paused]"
      >
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {names.map((name) => (
              <li
                key={`${copy}-${name}`}
                className="flex items-center gap-8 pr-8 font-display text-2xl whitespace-nowrap text-muted sm:text-3xl"
              >
                {name}
                <span className="size-1.5 rotate-45 bg-gold-400/70" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
