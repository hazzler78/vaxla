import { NextResponse } from "next/server";
import { resolveSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await resolveSessionUser(request);
    if (!user) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/auth/me", error);
    return NextResponse.json(
      { error: "Kunde inte hämta session." },
      { status: 500 },
    );
  }
}
