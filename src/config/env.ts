/**
 * Typed access to PUBLIC environment variables.
 *
 * Only NEXT_PUBLIC_* values belong here — they are inlined into the browser
 * bundle at build time. Server-only secrets must live in a separate
 * server-only module (e.g. `src/config/env.server.ts` importing "server-only")
 * when they are introduced.
 */

const DEFAULT_SITE_URL = "http://localhost:3000";

function parseSiteUrl(raw: string | undefined): URL {
  const value = raw?.trim() || DEFAULT_SITE_URL;
  try {
    return new URL(value);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SITE_URL: "${value}". Expected an absolute URL such as https://example.com`,
    );
  }
}

export const publicEnv = {
  /** Canonical site origin, used for metadata. */
  siteUrl: parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
} as const;
