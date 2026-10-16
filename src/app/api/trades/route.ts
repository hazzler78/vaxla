import { revalidatePath } from "next/cache";
import { createTrade, listTrades } from "@/lib/trades-repo";
import { isDatabaseConfigured } from "@/lib/db";
import {
  clientKey,
  pruneRateLimitBuckets,
  rateLimit,
} from "@/lib/rate-limit";
import { validateCreateBody } from "@/lib/trade-validation";
import { jsonWithActorCookie, resolveWriteActor } from "@/lib/write-gate";

export async function GET() {
  try {
    const trades = await listTrades();
    return jsonWithActorCookie(
      {
        trades,
        source: isDatabaseConfigured() ? "database" : "seed",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/trades", error);
    return jsonWithActorCookie(
      { error: "Kunde inte hämta byten." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return jsonWithActorCookie(
      {
        error:
          "Databasen är inte kopplad. Lägg till Neon Postgres (DATABASE_URL) på Vercel-projektet vaxla.",
      },
      { status: 503 },
    );
  }

  await pruneRateLimitBuckets();
  const limited = await rateLimit(clientKey(request, "post-trades"), 8, 60_000);
  if (!limited.ok) {
    return jsonWithActorCookie(
      { error: "För många förfrågningar. Vänta en stund och försök igen." },
      { status: 429 },
    );
  }

  const gate = await resolveWriteActor(request);
  if (!gate.actor) {
    return jsonWithActorCookie(
      { error: gate.error ?? "Ej behörig." },
      { status: gate.status ?? 401 },
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonWithActorCookie(
        { error: "Ogiltig JSON-body." },
        { status: 400 },
      );
    }

    const validated = validateCreateBody(
      (body ?? {}) as Parameters<typeof validateCreateBody>[0],
    );
    if (!validated.ok) {
      return jsonWithActorCookie(
        { error: validated.error },
        { status: 400 },
      );
    }

    const requester =
      gate.actor.user?.displayName ||
      validated.data.requester ||
      "Du";

    const trade = await createTrade({
      ...validated.data,
      requester,
      ownerId: gate.actor.isAdmin ? undefined : gate.actor.id,
    });

    revalidatePath("/");
    revalidatePath("/marknad");
    revalidatePath(`/marknad/${trade.id}`);
    revalidatePath("/sitemap.xml");

    return jsonWithActorCookie({ trade }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trades", error);
    return jsonWithActorCookie(
      { error: "Kunde inte spara önskemålet." },
      { status: 500 },
    );
  }
}
