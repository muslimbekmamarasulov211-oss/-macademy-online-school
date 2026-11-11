/**
 * Typed access to PUBLIC environment variables.
 *
 * Only NEXT_PUBLIC_* values belong here — they are inlined into the browser
 * bundle at build time. Server-only secrets must live in a separate
 * server-only module (e.g. `src/config/env.server.ts` importing "server-only")
 * when they are introduced.
 *
 * The site URL additionally falls back to Vercel's system variables
 * (VERCEL_BRANCH_URL / VERCEL_URL / VERCEL_PROJECT_PRODUCTION_URL). These are
 * public hostnames, not secrets, and this module is only imported by the
 * server-rendered root layout, so they never reach the client bundle.
 */

const DEFAULT_SITE_URL = "http://localhost:3000";

/**
 * Origin of the current Vercel deployment, mirroring how Next.js resolves it:
 * the branch URL on preview deployments, the production domain otherwise.
 * Undefined when not running on Vercel.
 */
function vercelOrigin(): string | undefined {
  const host =
    process.env.VERCEL_ENV === "preview"
      ? process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL
      : process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host}` : undefined;
}

function parseSiteUrl(raw: string | undefined): URL {
  const value = raw?.trim() || vercelOrigin() || DEFAULT_SITE_URL;
  try {
    return new URL(value);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SITE_URL: "${value}". Expected an absolute URL such as https://example.com`,
    );
  }
}

export const publicEnv = {
  /**
   * Canonical site origin, used for metadata.
   * Priority: NEXT_PUBLIC_SITE_URL → Vercel deployment URL → http://localhost:3000.
   */
  siteUrl: parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
} as const;
