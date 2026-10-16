import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { NextResponse } from "next/server";
import { getSql, isDatabaseConfigured } from "@/lib/db";

const SESSION_COOKIE = "vaxla_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days
const MAGIC_TTL_SECONDS = 60 * 15; // 15 minutes

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

type UserRow = {
  id: string;
  email: string;
  display_name: string;
};

let authReadyPromise: Promise<void> | null = null;

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  // Lightweight early-access check — not full RFC compliance.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function defaultDisplayName(email: string, provided?: string): string {
  const trimmed = provided?.trim();
  if (trimmed) return trimmed.slice(0, 80);
  const local = email.split("@")[0] || "Användare";
  return local.slice(0, 80);
}

export async function ensureAuthSchema(): Promise<void> {
  if (!isDatabaseConfigured()) return;
  if (!authReadyPromise) {
    authReadyPromise = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS magic_links (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          display_name TEXT,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS magic_links_email_idx ON magic_links(email)`;
    })().catch((error) => {
      authReadyPromise = null;
      throw error;
    });
  }
  return authReadyPromise;
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

function rowToUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
  };
}

export async function findUserByEmail(
  email: string,
): Promise<AuthUser | undefined> {
  await ensureAuthSchema();
  const sql = getSql();
  const normalized = normalizeEmail(email);
  const rows = await sql`
    SELECT id, email, display_name FROM users WHERE email = ${normalized} LIMIT 1
  `;
  const row = (rows as UserRow[])[0];
  return row ? rowToUser(row) : undefined;
}

export async function upsertUser(input: {
  email: string;
  displayName?: string;
}): Promise<AuthUser> {
  await ensureAuthSchema();
  const sql = getSql();
  const email = normalizeEmail(input.email);
  const existing = await findUserByEmail(email);
  if (existing) {
    const nextName = input.displayName?.trim();
    if (nextName && nextName !== existing.displayName) {
      await sql`
        UPDATE users SET display_name = ${nextName.slice(0, 80)} WHERE id = ${existing.id}
      `;
      return { ...existing, displayName: nextName.slice(0, 80) };
    }
    return existing;
  }

  const user: AuthUser = {
    id: randomUUID(),
    email,
    displayName: defaultDisplayName(email, input.displayName),
  };
  await sql`
    INSERT INTO users (id, email, display_name)
    VALUES (${user.id}, ${user.email}, ${user.displayName})
  `;
  return user;
}

export type MagicLinkResult = {
  email: string;
  expiresAt: string;
  /** Present when SMTP is unset / dev mode — paste into browser to finish login. */
  verifyUrl?: string;
};

/**
 * Create a one-time magic link. Without an email provider, returns `verifyUrl`
 * so local/preview can complete login (documented in README).
 */
export async function createMagicLink(input: {
  email: string;
  displayName?: string;
  origin: string;
}): Promise<MagicLinkResult> {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }
  await ensureAuthSchema();
  const sql = getSql();

  const email = normalizeEmail(input.email);
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + MAGIC_TTL_SECONDS * 1000);
  const displayName = input.displayName?.trim().slice(0, 80) || null;

  // Invalidate prior unused links for this email.
  await sql`DELETE FROM magic_links WHERE email = ${email}`;

  await sql`
    INSERT INTO magic_links (id, email, display_name, token_hash, expires_at)
    VALUES (${id}, ${email}, ${displayName}, ${tokenHash}, ${expiresAt.toISOString()})
  `;

  const verifyUrl = `${input.origin}/api/auth/verify?token=${encodeURIComponent(rawToken)}`;
  const hasSmtp = Boolean(process.env.VAXLA_SMTP_URL?.trim());
  const forceDevLinks = process.env.VAXLA_AUTH_DEV_LINKS === "1";

  // Early access: no mailer wired — return the link so login still works.
  // When SMTP is later configured, omit verifyUrl from the API response.
  const result: MagicLinkResult = {
    email,
    expiresAt: expiresAt.toISOString(),
  };
  if (!hasSmtp || forceDevLinks) {
    result.verifyUrl = verifyUrl;
  } else {
    // Placeholder for future mail send via VAXLA_SMTP_URL.
    console.info(`[vaxla-auth] magic link for ${email}: ${verifyUrl}`);
  }
  return result;
}

export async function consumeMagicLink(
  rawToken: string,
): Promise<{ user: AuthUser; sessionToken: string } | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureAuthSchema();
  const sql = getSql();
  const tokenHash = hashToken(rawToken);

  const rows = await sql`
    SELECT id, email, display_name, token_hash, expires_at
    FROM magic_links
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;
  const row = (
    rows as {
      id: string;
      email: string;
      display_name: string | null;
      token_hash: string;
      expires_at: string;
    }[]
  )[0];
  if (!row) return null;
  if (!safeEqualHex(row.token_hash, tokenHash)) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await sql`DELETE FROM magic_links WHERE id = ${row.id}`;
    return null;
  }

  await sql`DELETE FROM magic_links WHERE id = ${row.id}`;

  const user = await upsertUser({
    email: row.email,
    displayName: row.display_name ?? undefined,
  });
  const sessionToken = await createSession(user.id);
  return { user, sessionToken };
}

async function createSession(userId: string): Promise<string> {
  await ensureAuthSchema();
  const sql = getSql();
  const sessionId = randomUUID();
  const secret = randomBytes(32).toString("base64url");
  const sessionToken = `${sessionId}.${secret}`;
  const tokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await sql`
    INSERT INTO sessions (id, user_id, token_hash, expires_at)
    VALUES (${sessionId}, ${userId}, ${tokenHash}, ${expiresAt.toISOString()})
  `;
  return sessionToken;
}

export async function resolveSessionUser(
  request: Request,
): Promise<AuthUser | null> {
  if (!isDatabaseConfigured()) return null;
  const cookies = parseCookies(request.headers.get("cookie"));
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return null;

  await ensureAuthSchema();
  const sql = getSql();
  const tokenHash = hashToken(raw);
  const rows = await sql`
    SELECT
      u.id, u.email, u.display_name,
      s.id AS session_id, s.expires_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash}
    LIMIT 1
  `;
  const row = (
    rows as (UserRow & { session_id: string; expires_at: string })[]
  )[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await sql`DELETE FROM sessions WHERE id = ${row.session_id}`;
    return null;
  }
  return rowToUser(row);
}

export async function destroySession(request: Request): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const cookies = parseCookies(request.headers.get("cookie"));
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return;
  await ensureAuthSchema();
  const sql = getSql();
  await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(raw)}`;
}

export function appendSessionCookie(
  response: NextResponse,
  sessionToken: string,
): void {
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export { SESSION_COOKIE };
