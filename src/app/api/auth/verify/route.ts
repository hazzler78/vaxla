import { NextResponse } from "next/server";
import {
  appendSessionCookie,
  consumeMagicLink,
} from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";

function safeNextPath(raw: string | null): string {
  if (!raw) return "/marknad";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/marknad";
  return raw;
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Databasen är inte kopplad." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  const next = safeNextPath(url.searchParams.get("next"));

  if (!token) {
    return NextResponse.redirect(new URL("/logga-in?error=missing", url.origin));
  }

  try {
    const result = await consumeMagicLink(token);
    if (!result) {
      return NextResponse.redirect(
        new URL("/logga-in?error=invalid", url.origin),
      );
    }

    const response = NextResponse.redirect(new URL(next, url.origin));
    appendSessionCookie(response, result.sessionToken);
    return response;
  } catch (error) {
    console.error("GET /api/auth/verify", error);
    return NextResponse.redirect(
      new URL("/logga-in?error=server", url.origin),
    );
  }
}
