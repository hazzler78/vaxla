import { NextResponse } from "next/server";
import {
  createMagicLink,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";

function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    url.host;
  return `${proto}://${host}`;
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Databasen är inte kopplad. Lägg till Neon Postgres (DATABASE_URL) på Vercel-projektet vaxla.",
      },
      { status: 503 },
    );
  }

  const limited = await rateLimit(
    clientKey(request, "auth-magic"),
    5,
    60_000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: "För många inloggningsförsök. Vänta en stund." },
      { status: 429 },
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Ogiltig JSON-body." },
        { status: 400 },
      );
    }

    const raw = (body ?? {}) as { email?: string; displayName?: string };
    const email = normalizeEmail(raw.email ?? "");
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Ange en giltig e-postadress." },
        { status: 400 },
      );
    }

    const result = await createMagicLink({
      email,
      displayName: raw.displayName,
      origin: requestOrigin(request),
    });

    return NextResponse.json({
      ok: true,
      email: result.email,
      expiresAt: result.expiresAt,
      ...(result.verifyUrl
        ? {
            verifyUrl: result.verifyUrl,
            message:
              "Ingen e-postserver är kopplad ännu — öppna länken för att logga in.",
          }
        : {
            message:
              "Om adressen är giltig skickas en inloggningslänk. Kontrollera din inkorg.",
          }),
    });
  } catch (error) {
    console.error("POST /api/auth/magic-link", error);
    return NextResponse.json(
      { error: "Kunde inte skapa inloggningslänk." },
      { status: 500 },
    );
  }
}
