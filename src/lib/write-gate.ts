import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  appendSessionCookie,
  clearSessionCookie,
  resolveSessionUser,
  type AuthUser,
} from "@/lib/auth";

export type WriteActor = {
  id: string;
  isAdmin: boolean;
  user?: AuthUser;
};

function getWriteSecret(): string | undefined {
  const token = process.env.VAXLA_WRITE_TOKEN?.trim();
  return token || undefined;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
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

/**
 * Resolve write identity for POST/PATCH.
 * - Admin: `Authorization: Bearer <VAXLA_WRITE_TOKEN>` or `X-Vaxla-Write-Token`
 * - Otherwise: logged-in account via httpOnly `vaxla_session` cookie
 */
export async function resolveWriteActor(request: Request): Promise<{
  actor: WriteActor | null;
  error?: string;
  status?: number;
}> {
  if (isAdminRequest(request)) {
    return { actor: { id: "admin", isAdmin: true } };
  }

  // Invite-only lock: when set, browser sessions are disabled for writes.
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

  const user = await resolveSessionUser(request);
  if (!user) {
    return {
      actor: null,
      error: "Logga in för att skapa eller uppdatera byten.",
      status: 401,
    };
  }

  return {
    actor: { id: user.id, isAdmin: false, user },
  };
}

export function jsonWithActorCookie(
  body: unknown,
  init: { status?: number },
  sessionToken?: string,
  clearSession?: boolean,
): NextResponse {
  const response = NextResponse.json(body, { status: init.status ?? 200 });
  if (clearSession) clearSessionCookie(response);
  if (sessionToken) appendSessionCookie(response, sessionToken);
  return response;
}
