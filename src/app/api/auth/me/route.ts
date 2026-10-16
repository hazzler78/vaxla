import { connection, NextResponse } from "next/server";
import { resolveSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  // Request-time session cookie — Cache Components forbids `dynamic = "force-dynamic"`.
  await connection();

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
