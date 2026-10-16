import { revalidatePath } from "next/cache";
import { getTradeById, updateTrade } from "@/lib/trades-repo";
import { isDatabaseConfigured } from "@/lib/db";
import {
  clientKey,
  pruneRateLimitBuckets,
  rateLimit,
} from "@/lib/rate-limit";
import { decideStatusPatch, isTradeStatus } from "@/lib/status-machine";
import { validateSponsorName } from "@/lib/trade-validation";
import type { TradeStatus } from "@/lib/types";
import { jsonWithActorCookie, resolveWriteActor } from "@/lib/write-gate";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const trade = await getTradeById(id);
    if (!trade) {
      return jsonWithActorCookie({ error: "Hittades inte" }, { status: 404 });
    }
    return jsonWithActorCookie(
      {
        trade,
        source: isDatabaseConfigured() ? "database" : "seed",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/trades/[id]", error);
    return jsonWithActorCookie(
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
    return jsonWithActorCookie(
      {
        error:
          "Databasen är inte kopplad. Lägg till Neon Postgres (DATABASE_URL) på Vercel-projektet vaxla.",
      },
      { status: 503 },
    );
  }

  pruneRateLimitBuckets();
  const limited = rateLimit(clientKey(request, "patch-trades"), 20, 60_000);
  if (!limited.ok) {
    return jsonWithActorCookie(
      { error: "För många förfrågningar. Vänta en stund och försök igen." },
      { status: 429 },
    );
  }

  const gate = resolveWriteActor(request);
  if (!gate.actor) {
    return jsonWithActorCookie(
      { error: gate.error ?? "Ej behörig." },
      { status: gate.status ?? 401 },
    );
  }

  const { id } = await params;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonWithActorCookie(
        { error: "Ogiltig JSON-body." },
        { status: 400 },
        gate.cookieToSet,
      );
    }

    const raw = (body ?? {}) as {
      status?: TradeStatus;
      sponsor?: string | null;
    };

    if (raw.status !== undefined && !isTradeStatus(raw.status)) {
      return jsonWithActorCookie(
        { error: "Ogiltig status." },
        { status: 400 },
        gate.cookieToSet,
      );
    }

    const sponsorCheck = validateSponsorName(raw.sponsor);
    if (!sponsorCheck.ok) {
      return jsonWithActorCookie(
        { error: sponsorCheck.error },
        { status: 400 },
        gate.cookieToSet,
      );
    }

    const existing = await getTradeById(id);
    if (!existing) {
      return jsonWithActorCookie(
        { error: "Hittades inte" },
        { status: 404 },
        gate.cookieToSet,
      );
    }

    const decision = decideStatusPatch(existing, gate.actor, {
      status: raw.status,
      sponsor: sponsorCheck.value,
    });

    if (!decision.ok) {
      return jsonWithActorCookie(
        { error: decision.error },
        { status: decision.status },
        gate.cookieToSet,
      );
    }

    const trade = await updateTrade(id, {
      status: decision.nextStatus,
      sponsor: decision.nextSponsor,
      sponsorId: decision.nextSponsorId,
    });

    if (!trade) {
      return jsonWithActorCookie(
        { error: "Hittades inte" },
        { status: 404 },
        gate.cookieToSet,
      );
    }

    revalidatePath("/");
    revalidatePath("/marknad");
    revalidatePath(`/marknad/${id}`);

    return jsonWithActorCookie({ trade }, { status: 200 }, gate.cookieToSet);
  } catch (error) {
    console.error("PATCH /api/trades/[id]", error);
    return jsonWithActorCookie(
      { error: "Kunde inte uppdatera bytet." },
      { status: 500 },
      gate.cookieToSet,
    );
  }
}
