import { seedTrades } from "@/lib/seed-trades";
import { getSql, isDatabaseConfigured } from "@/lib/db";
import type { Trade, TradeKind, TradeStatus } from "@/lib/types";

type TradeRow = {
  id: string;
  kind: TradeKind;
  title: string;
  description: string;
  value_sek: number;
  hours: number;
  work_offer: string;
  location: string;
  requester: string;
  sponsor: string | null;
  status: TradeStatus;
  category: string;
  image: string;
  created_at: string;
};

function rowToTrade(row: TradeRow): Trade {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    valueSek: Number(row.value_sek),
    hours: Number(row.hours),
    workOffer: row.work_offer,
    location: row.location,
    requester: row.requester,
    sponsor: row.sponsor ?? undefined,
    status: row.status,
    category: row.category,
    image: row.image,
    createdAt: row.created_at,
  };
}

let readyPromise: Promise<void> | null = null;

async function ensureSchemaAndSeed(): Promise<void> {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL CHECK (kind IN ('want', 'job')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      value_sek INTEGER NOT NULL,
      hours INTEGER NOT NULL,
      work_offer TEXT NOT NULL,
      location TEXT NOT NULL,
      requester TEXT NOT NULL,
      sponsor TEXT,
      status TEXT NOT NULL CHECK (status IN ('open', 'sponsored', 'in_progress', 'done')),
      category TEXT NOT NULL,
      image TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `;

  const countRows = await sql`SELECT COUNT(*)::int AS count FROM trades`;
  const count = Number((countRows[0] as { count: number }).count);
  if (count > 0) return;

  for (const trade of seedTrades) {
    await sql`
      INSERT INTO trades (
        id, kind, title, description, value_sek, hours, work_offer,
        location, requester, sponsor, status, category, image, created_at
      ) VALUES (
        ${trade.id},
        ${trade.kind},
        ${trade.title},
        ${trade.description},
        ${trade.valueSek},
        ${trade.hours},
        ${trade.workOffer},
        ${trade.location},
        ${trade.requester},
        ${trade.sponsor ?? null},
        ${trade.status},
        ${trade.category},
        ${trade.image},
        ${trade.createdAt}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

function ensureReady(): Promise<void> {
  if (!isDatabaseConfigured()) {
    return Promise.resolve();
  }
  if (!readyPromise) {
    readyPromise = ensureSchemaAndSeed().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }
  return readyPromise;
}

/** List trades from Postgres when configured; otherwise seed data. */
export async function listTrades(): Promise<Trade[]> {
  if (!isDatabaseConfigured()) {
    return seedTrades;
  }

  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT
      id, kind, title, description, value_sek, hours, work_offer,
      location, requester, sponsor, status, category, image, created_at
    FROM trades
    ORDER BY created_at DESC, id ASC
  `;
  return (rows as TradeRow[]).map(rowToTrade);
}

export async function getTradeById(id: string): Promise<Trade | undefined> {
  if (!isDatabaseConfigured()) {
    return seedTrades.find((trade) => trade.id === id);
  }

  await ensureReady();
  const sql = getSql();
  const rows = await sql`
    SELECT
      id, kind, title, description, value_sek, hours, work_offer,
      location, requester, sponsor, status, category, image, created_at
    FROM trades
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = (rows as TradeRow[])[0];
  return row ? rowToTrade(row) : undefined;
}

export type CreateTradeInput = {
  kind?: TradeKind;
  title: string;
  description: string;
  valueSek: number;
  hours: number;
  workOffer: string;
  location: string;
  requester: string;
  category: string;
  image?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function createTrade(input: CreateTradeInput): Promise<Trade> {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }

  await ensureReady();
  const sql = getSql();

  const kind: TradeKind = input.kind ?? "want";
  const base = slugify(input.title) || "onskemal";
  const id = `${kind}-${base}-${Date.now().toString(36)}`;
  const createdAt = new Date().toISOString().slice(0, 10);
  const image =
    input.image ||
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80";

  const trade: Trade = {
    id,
    kind,
    title: input.title,
    description: input.description,
    valueSek: input.valueSek,
    hours: input.hours,
    workOffer: input.workOffer,
    location: input.location,
    requester: input.requester,
    status: "open",
    category: input.category,
    image,
    createdAt,
  };

  await sql`
    INSERT INTO trades (
      id, kind, title, description, value_sek, hours, work_offer,
      location, requester, sponsor, status, category, image, created_at
    ) VALUES (
      ${trade.id},
      ${trade.kind},
      ${trade.title},
      ${trade.description},
      ${trade.valueSek},
      ${trade.hours},
      ${trade.workOffer},
      ${trade.location},
      ${trade.requester},
      ${null},
      ${trade.status},
      ${trade.category},
      ${trade.image},
      ${trade.createdAt}
    )
  `;

  return trade;
}

export type UpdateTradePatch = {
  status?: TradeStatus;
  sponsor?: string | null;
};

export async function updateTrade(
  id: string,
  patch: UpdateTradePatch,
): Promise<Trade | undefined> {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }

  await ensureReady();
  const existing = await getTradeById(id);
  if (!existing) return undefined;

  const next: Trade = {
    ...existing,
    status: patch.status ?? existing.status,
    sponsor:
      patch.sponsor === undefined
        ? existing.sponsor
        : patch.sponsor ?? undefined,
  };

  const sql = getSql();
  await sql`
    UPDATE trades
    SET
      status = ${next.status},
      sponsor = ${next.sponsor ?? null}
    WHERE id = ${id}
  `;

  return next;
}
