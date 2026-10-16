/**
 * Shared rate limit backed by Neon/Postgres so limits hold across Vercel instances.
 * Falls back to in-memory only when DATABASE_URL is unset (local seed mode).
 */

import { getSql, isDatabaseConfigured } from "@/lib/db";

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

let rateLimitReadyPromise: Promise<void> | null = null;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

async function ensureRateLimitSchema(): Promise<void> {
  if (!isDatabaseConfigured()) return;
  if (!rateLimitReadyPromise) {
    rateLimitReadyPromise = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS rate_limits (
          key TEXT PRIMARY KEY,
          count INTEGER NOT NULL,
          reset_at BIGINT NOT NULL
        )
      `;
    })().catch((error) => {
      rateLimitReadyPromise = null;
      throw error;
    });
  }
  return rateLimitReadyPromise;
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = memoryBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true };
}

/**
 * Durable shared limiter (Neon). Uses a single upsert so all instances share the bucket.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (!isDatabaseConfigured()) {
    return memoryRateLimit(key, limit, windowMs);
  }

  await ensureRateLimitSchema();
  const sql = getSql();
  const now = Date.now();
  const nextReset = now + windowMs;

  const rows = await sql`
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES (${key}, 1, ${nextReset})
    ON CONFLICT (key) DO UPDATE
    SET
      count = CASE
        WHEN rate_limits.reset_at <= ${now} THEN 1
        ELSE rate_limits.count + 1
      END,
      reset_at = CASE
        WHEN rate_limits.reset_at <= ${now} THEN ${nextReset}
        ELSE rate_limits.reset_at
      END
    RETURNING count, reset_at
  `;

  const row = (rows as { count: number; reset_at: number | string }[])[0];
  const count = Number(row.count);
  const resetAt = Number(row.reset_at);

  if (count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((resetAt - now) / 1000)),
    };
  }

  return { ok: true };
}

/** Client IP from common proxy headers, else a shared fallback key. */
export function clientKey(request: Request, prefix: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return `${prefix}:${ip}`;
}

/** Best-effort prune of expired rows (and memory fallback buckets). */
export async function pruneRateLimitBuckets(): Promise<void> {
  const now = Date.now();
  if (memoryBuckets.size >= 500) {
    for (const [key, bucket] of memoryBuckets) {
      if (bucket.resetAt <= now) memoryBuckets.delete(key);
    }
  }

  if (!isDatabaseConfigured()) return;
  try {
    await ensureRateLimitSchema();
    const sql = getSql();
    await sql`DELETE FROM rate_limits WHERE reset_at <= ${now}`;
  } catch (error) {
    console.error("pruneRateLimitBuckets", error);
  }
}
