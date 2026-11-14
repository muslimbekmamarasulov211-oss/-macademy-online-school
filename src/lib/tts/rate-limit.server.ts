import "server-only";

/**
 * Small in-memory sliding-window rate limiter for the TTS route.
 *
 * Every synthesis spends Aisha account balance, and the tool page is public,
 * so requests are limited per client IP. This is best-effort: on serverless
 * hosting each instance keeps its own memory, so the real ceiling is
 * `limit × number of warm instances`. Replace with a shared store (e.g. Redis)
 * if stronger guarantees are needed.
 */

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 10;
const MAX_TRACKED_CLIENTS = 5000;

const hits = new Map<string, number[]>();

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function checkTtsRateLimit(clientId: string, now: number): RateLimitResult {
  const windowStart = now - WINDOW_MS;
  const recent = (hits.get(clientId) ?? []).filter((time) => time > windowStart);

  if (recent.length >= LIMIT) {
    hits.set(clientId, recent);
    const retryAfterMs = recent[0] + WINDOW_MS - now;
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  recent.push(now);
  hits.set(clientId, recent);

  // Keep memory bounded: drop clients whose window has fully expired.
  if (hits.size > MAX_TRACKED_CLIENTS) {
    for (const [id, times] of hits) {
      if (times[times.length - 1] <= windowStart) hits.delete(id);
    }
  }

  return { allowed: true };
}

/** Best-effort client identifier from proxy headers (Vercel sets x-forwarded-for). */
export function clientIdFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
