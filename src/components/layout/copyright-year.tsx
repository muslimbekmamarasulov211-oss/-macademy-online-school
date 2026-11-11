import { cacheLife } from "next/cache";

/**
 * Current year for the copyright line.
 *
 * Cache Components forbids `new Date()` in the prerendered shell, so the value
 * is cached and revalidated daily — the year rolls over without a redeploy.
 */
export async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
