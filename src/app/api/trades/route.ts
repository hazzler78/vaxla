import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createTrade, listTrades } from "@/lib/trades-repo";
import { isDatabaseConfigured } from "@/lib/db";

export async function GET() {
  try {
    const trades = await listTrades();
    return NextResponse.json({
      trades,
      source: isDatabaseConfigured() ? "database" : "seed",
    });
  } catch (error) {
    console.error("GET /api/trades", error);
    return NextResponse.json(
      { error: "Kunde inte hämta byten." },
      { status: 500 },
    );
  }
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

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      valueSek?: number;
      hours?: number;
      workOffer?: string;
      location?: string;
      requester?: string;
      category?: string;
      image?: string;
      kind?: "want" | "job";
    };

    const title = body.title?.trim() ?? "";
    const workOffer = body.workOffer?.trim() ?? "";
    const valueSek = Number(body.valueSek);
    const hours = Number(body.hours);

    if (!title || !workOffer || !Number.isFinite(valueSek) || valueSek <= 0) {
      return NextResponse.json(
        { error: "Fyll i minst titel, värde och vad du kan erbjuda." },
        { status: 400 },
      );
    }

    const trade = await createTrade({
      kind: body.kind ?? "want",
      title,
      description:
        body.description?.trim() ||
        `Jag vill ha ${title} och betalar med arbetskraft.`,
      valueSek,
      hours:
        Number.isFinite(hours) && hours > 0
          ? hours
          : Math.max(1, Math.round(valueSek / 170)),
      workOffer,
      location: body.location?.trim() || "Sverige",
      requester: body.requester?.trim() || "Du",
      category: body.category?.trim() || "Övrigt",
      image: body.image,
    });

    revalidatePath("/");
    revalidatePath("/marknad");
    revalidatePath(`/marknad/${trade.id}`);
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ trade }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trades", error);
    return NextResponse.json(
      { error: "Kunde inte spara önskemålet." },
      { status: 500 },
    );
  }
}
