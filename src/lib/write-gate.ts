import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { NextResponse } from "next/server";

const ACTOR_COOKIE = "vaxla_actor";
const ACTOR_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

export type WriteActor = {
  id: string;
  isAdmin: boolean;
};

function getWriteSecret(): string | undefined {
  const token = process.env.VAXLA_WRITE_TOKEN?.trim();
  return token || undefined;
}

/** HMAC secret for actor cookies — prefers write token, else DB URL (stable per deploy). */
function getSigningSecret(): string | null {
  const write = getWriteSecret();
  if (write) return write;
  const db =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;
  if (db) return `vaxla-actor:${db.slice(0, 64)}`;
  return null;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
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

function readBearerOrHeader(request: Request): string | undefined {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }
  const header = request.headers.get("x-vaxla-write-token")?.trim();
  return header || undefined;
}

function isAdminRequest(request: Request): boolean {
  const secret = getWriteSecret();
  if (!secret) return false;
  const provided = readBearerOrHeader(request);
  if (!provided) return false;
  return safeEqual(provided, secret);
}

function verifyActorCookie(
  raw: string | undefined,
  secret: string,
): string | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [id, expStr, sig] = parts;
  if (!id || !expStr || !sig) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  const expected = sign(`${id}.${expStr}`, secret);
  if (!safeEqual(sig, expected)) return null;
  return id;
}

function mintActorCookieValue(actorId: string, secret: string): string {
  const exp = Math.floor(Date.now() / 1000) + ACTOR_TTL_SECONDS;
  const payload = `${actorId}.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function appendActorCookie(
  response: NextResponse,
  cookieValue: string,
): void {
  response.cookies.set(ACTOR_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACTOR_TTL_SECONDS,
  });
}

/**
 * Resolve write identity for POST/PATCH.
 * - Admin: `Authorization: Bearer <VAXLA_WRITE_TOKEN>` or `X-Vaxla-Write-Token`
 * - Otherwise: signed httpOnly `vaxla_actor` cookie (minted if missing)
 */
export function resolveWriteActor(request: Request): {
  actor: WriteActor | null;
  cookieToSet?: string;
  error?: string;
  status?: number;
} {
  if (isAdminRequest(request)) {
    return { actor: { id: "admin", isAdmin: true } };
  }

  const signingSecret = getSigningSecret();
  if (!signingSecret) {
    return {
      actor: null,
      error:
        "Skrivskydd är inte konfigurerat. Sätt VAXLA_WRITE_TOKEN (eller DATABASE_URL).",
      status: 503,
    };
  }

  const cookies = parseCookies(request.headers.get("cookie"));
  const existing = verifyActorCookie(cookies[ACTOR_COOKIE], signingSecret);
  if (existing) {
    return { actor: { id: existing, isAdmin: false } };
  }

  // Invite-only lock: when set, anonymous/browser must present the write token.
  if (process.env.VAXLA_REQUIRE_WRITE_TOKEN === "1") {
    if (!getWriteSecret()) {
      return {
        actor: null,
        error: "VAXLA_REQUIRE_WRITE_TOKEN=1 men VAXLA_WRITE_TOKEN saknas.",
        status: 503,
      };
    }
    return {
      actor: null,
      error:
        "Skrivning kräver admin-token (Authorization: Bearer eller X-Vaxla-Write-Token).",
      status: 401,
    };
  }

  const id = randomUUID();
  return {
    actor: { id, isAdmin: false },
    cookieToSet: mintActorCookieValue(id, signingSecret),
  };
}

export function jsonWithActorCookie(
  body: unknown,
  init: { status?: number },
  cookieToSet?: string,
): NextResponse {
  const response = NextResponse.json(body, { status: init.status ?? 200 });
  if (cookieToSet) appendActorCookie(response, cookieToSet);
  return response;
}
