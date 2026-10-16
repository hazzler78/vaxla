import { NextResponse } from "next/server";
import { clearSessionCookie, destroySession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await destroySession(request);
  } catch (error) {
    console.error("POST /api/auth/logout", error);
  }
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
