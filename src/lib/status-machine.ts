import type { Trade, TradeStatus } from "@/lib/types";
import type { WriteActor } from "@/lib/write-gate";

const STATUSES: TradeStatus[] = ["open", "sponsored", "in_progress", "done"];

/** Forward-only transitions for early-access marketplace. */
const ALLOWED: Record<TradeStatus, TradeStatus[]> = {
  open: ["sponsored", "in_progress"],
  sponsored: ["in_progress"],
  in_progress: ["done"],
  done: [],
};

export function isTradeStatus(value: unknown): value is TradeStatus {
  return typeof value === "string" && STATUSES.includes(value as TradeStatus);
}

export function isAllowedTransition(
  from: TradeStatus,
  to: TradeStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED[from].includes(to);
}

export type StatusPatchInput = {
  status?: TradeStatus;
  sponsor?: string | null;
};

export type StatusDecision =
  | {
      ok: true;
      nextStatus: TradeStatus;
      nextSponsor: string | null | undefined;
      nextSponsorId: string | null | undefined;
    }
  | { ok: false; error: string; status: number };

/**
 * Enforce status machine + account ownership.
 *
 * Rules (non-admin):
 * - open → sponsored: any logged-in user; claims sponsor slot (first writer wins)
 * - open → in_progress: any logged-in user (job claim / start work)
 * - sponsored → in_progress: owner or current sponsor account
 * - in_progress → done: owner or current sponsor account
 * - cannot freely set sponsor without transitioning to sponsored
 * - cannot overwrite another account's sponsor claim
 */
export function decideStatusPatch(
  trade: Trade & { ownerId?: string | null; sponsorId?: string | null },
  actor: WriteActor,
  patch: StatusPatchInput,
): StatusDecision {
  const nextStatus = patch.status ?? trade.status;
  const sponsorProvided = patch.sponsor !== undefined;

  if (patch.status !== undefined && !isTradeStatus(patch.status)) {
    return { ok: false, error: "Ogiltig status.", status: 400 };
  }

  if (!isAllowedTransition(trade.status, nextStatus) && !actor.isAdmin) {
    return {
      ok: false,
      error: `Otillåten statusövergång: ${trade.status} → ${nextStatus}.`,
      status: 409,
    };
  }

  if (actor.isAdmin) {
    return {
      ok: true,
      nextStatus,
      nextSponsor: patch.sponsor,
      nextSponsorId: undefined,
    };
  }

  const ownerId = trade.ownerId ?? null;
  const sponsorId = trade.sponsorId ?? null;

  const isOwner = ownerId != null && ownerId === actor.id;
  const isSponsor = sponsorId != null && sponsorId === actor.id;
  // Legacy rows (no owner/sponsor ids): allow forward progress once, but
  // sponsoring still records this actor as sponsor_id.
  const legacyOpen = ownerId == null && sponsorId == null;

  if (nextStatus === trade.status && !sponsorProvided) {
    return {
      ok: true,
      nextStatus,
      nextSponsor: undefined,
      nextSponsorId: undefined,
    };
  }

  if (trade.status === "open" && nextStatus === "sponsored") {
    if (sponsorId && sponsorId !== actor.id) {
      return {
        ok: false,
        error: "Bytet har redan en sponsor.",
        status: 409,
      };
    }
    const label =
      typeof patch.sponsor === "string" && patch.sponsor.trim()
        ? patch.sponsor.trim()
        : "Sponsor";
    return {
      ok: true,
      nextStatus: "sponsored",
      nextSponsor: label,
      nextSponsorId: actor.id,
    };
  }

  if (trade.status === "open" && nextStatus === "in_progress") {
    return {
      ok: true,
      nextStatus: "in_progress",
      nextSponsor: undefined,
      nextSponsorId: undefined,
    };
  }

  if (trade.status === "sponsored" && nextStatus === "in_progress") {
    if (!isOwner && !isSponsor && !legacyOpen) {
      return {
        ok: false,
        error: "Bara ägaren eller sponsorn kan starta arbetet.",
        status: 403,
      };
    }
    return {
      ok: true,
      nextStatus: "in_progress",
      nextSponsor: undefined,
      nextSponsorId: undefined,
    };
  }

  if (trade.status === "in_progress" && nextStatus === "done") {
    if (!isOwner && !isSponsor && !legacyOpen) {
      return {
        ok: false,
        error: "Bara ägaren eller sponsorn kan markera bytet som klart.",
        status: 403,
      };
    }
    return {
      ok: true,
      nextStatus: "done",
      nextSponsor: undefined,
      nextSponsorId: undefined,
    };
  }

  if (sponsorProvided && nextStatus !== "sponsored") {
    return {
      ok: false,
      error: "Sponsor kan bara sättas vid övergång till sponsored.",
      status: 400,
    };
  }

  return {
    ok: false,
    error: "Otillåten uppdatering.",
    status: 403,
  };
}
