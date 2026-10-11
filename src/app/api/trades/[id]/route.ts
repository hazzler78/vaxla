import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getTradeById, updateTrade } from "@/lib/trades-repo";
import { isDatabaseConfigured } from "@/lib/db";
import type { TradeStatus } from "@/lib/types";

const STATUSES: TradeStatus[] = ["open", "sponsored", "in_progress", "done"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const trade = await getTradeById(id);
    if (!trade) {
      return NextResponse.json({ error: "Hittades inte" }, { status: 404 });
    }
    return NextResponse.json({
      trade,
      source: isDatabaseConfigured() ? "database" : "seed",
    });
  } catch (error) {
    console.error("GET /api/trades/[id]", error);
    return NextResponse.json(
      { error: "Kunde inte hämta bytet." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Databasen är inte kopplad. Lägg till Neon Postgres (DATABASE_URL) på Vercel-projektet vaxla.",
      },
      { status: 503 },
    );
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as {
      status?: TradeStatus;
      sponsor?: string | null;
    };

    if (body.status && !STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Ogiltig status." }, { status: 400 });
    }

    const trade = await updateTrade(id, {
      status: body.status,
      sponsor: body.sponsor,
    });

    if (!trade) {
      return NextResponse.json({ error: "Hittades inte" }, { status: 404 });
    }

    revalidatePath("/");
    revalidatePath("/marknad");
    revalidatePath(`/marknad/${id}`);

    return NextResponse.json({ trade });
  } catch (error) {
    console.error("PATCH /api/trades/[id]", error);
    return NextResponse.json(
      { error: "Kunde inte uppdatera bytet." },
      { status: 500 },
    );
  }
}
