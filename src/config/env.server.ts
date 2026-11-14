import "server-only";

/**
 * Typed access to SERVER-ONLY secrets.
 *
 * `import "server-only"` makes the build fail if this module is ever imported
 * from a Client Component, so these values can never reach the browser bundle.
 * Never re-export them through a NEXT_PUBLIC_* variable.
 */

/**
 * Aisha AI API key (sent as the `X-Api-Key` header).
 * Returns null when unset so callers can report "not configured" honestly.
 */
export function getAishaApiKey(): string | null {
  const value = process.env.AISHA_API_KEY?.trim();
  return value ? value : null;
}
