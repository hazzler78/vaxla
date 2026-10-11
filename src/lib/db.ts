import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/** Preferred env names from Neon Marketplace / legacy Vercel Postgres. */
export function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

let _sql: NeonQueryFunction<false, false> | null = null;

/** Lazy neon client — safe when DATABASE_URL is missing at build time. */
export function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "Database is not configured. Set DATABASE_URL (Neon via Vercel Marketplace).",
    );
  }
  _sql = neon(url);
  return _sql;
}
