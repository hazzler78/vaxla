import type { TradeKind } from "@/lib/types";

const KINDS: TradeKind[] = ["want", "job"];

const CATEGORIES = new Set([
  "Elektronik",
  "Transport",
  "Hem",
  "Utbildning",
  "Övrigt",
]);

export const LIMITS = {
  title: { min: 1, max: 120 },
  description: { max: 2000 },
  workOffer: { min: 1, max: 200 },
  location: { max: 100 },
  requester: { max: 80 },
  category: { max: 40 },
  sponsor: { max: 80 },
  image: { max: 500 },
  valueSek: { min: 1, max: 1_000_000 },
  hours: { min: 1, max: 2000 },
} as const;

export type CreateTradeBody = {
  title?: string;
  description?: string;
  valueSek?: number;
  hours?: number;
  workOffer?: string;
  location?: string;
  requester?: string;
  category?: string;
  image?: string;
  kind?: string;
};

export type ValidatedCreate = {
  kind: TradeKind;
  title: string;
  description: string;
  valueSek: number;
  hours: number;
  workOffer: string;
  location: string;
  requester: string;
  category: string;
  image?: string;
};

function clip(value: string, max: number): string {
  return value.slice(0, max);
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateCreateBody(
  body: CreateTradeBody,
): { ok: true; data: ValidatedCreate } | { ok: false; error: string } {
  const title = (body.title ?? "").trim();
  const workOffer = (body.workOffer ?? "").trim();
  const description = (body.description ?? "").trim();
  const location = (body.location ?? "").trim();
  const requester = (body.requester ?? "").trim();
  const category = (body.category ?? "").trim();
  const image = body.image?.trim();

  if (!title || !workOffer) {
    return {
      ok: false,
      error: "Fyll i minst titel, värde och vad du kan erbjuda.",
    };
  }

  if (title.length > LIMITS.title.max) {
    return {
      ok: false,
      error: `Titeln får vara högst ${LIMITS.title.max} tecken.`,
    };
  }
  if (workOffer.length > LIMITS.workOffer.max) {
    return {
      ok: false,
      error: `Erbjudandet får vara högst ${LIMITS.workOffer.max} tecken.`,
    };
  }
  if (description.length > LIMITS.description.max) {
    return {
      ok: false,
      error: `Beskrivningen får vara högst ${LIMITS.description.max} tecken.`,
    };
  }
  if (location.length > LIMITS.location.max) {
    return {
      ok: false,
      error: `Platsen får vara högst ${LIMITS.location.max} tecken.`,
    };
  }
  if (requester.length > LIMITS.requester.max) {
    return {
      ok: false,
      error: `Namnet får vara högst ${LIMITS.requester.max} tecken.`,
    };
  }

  const kindRaw = body.kind ?? "want";
  if (!KINDS.includes(kindRaw as TradeKind)) {
    return { ok: false, error: "Ogiltig typ (kind). Använd want eller job." };
  }
  const kind = kindRaw as TradeKind;

  const valueSek = Number(body.valueSek);
  if (
    !Number.isFinite(valueSek) ||
    !Number.isInteger(valueSek) ||
    valueSek < LIMITS.valueSek.min ||
    valueSek > LIMITS.valueSek.max
  ) {
    return {
      ok: false,
      error: `Värde måste vara ett heltal mellan ${LIMITS.valueSek.min} och ${LIMITS.valueSek.max} kr.`,
    };
  }

  let hours = Number(body.hours);
  if (!Number.isFinite(hours) || hours <= 0) {
    hours = Math.max(1, Math.round(valueSek / 170));
  }
  if (
    !Number.isInteger(hours) ||
    hours < LIMITS.hours.min ||
    hours > LIMITS.hours.max
  ) {
    return {
      ok: false,
      error: `Timmar måste vara ett heltal mellan ${LIMITS.hours.min} och ${LIMITS.hours.max}.`,
    };
  }

  let nextCategory = category || "Övrigt";
  if (nextCategory.length > LIMITS.category.max) {
    return {
      ok: false,
      error: `Kategorin får vara högst ${LIMITS.category.max} tecken.`,
    };
  }
  if (!CATEGORIES.has(nextCategory)) {
    nextCategory = "Övrigt";
  }

  if (image) {
    if (image.length > LIMITS.image.max || !isHttpsUrl(image)) {
      return {
        ok: false,
        error: "Bild-URL måste vara en https-adress (max 500 tecken).",
      };
    }
  }

  return {
    ok: true,
    data: {
      kind,
      title: clip(title, LIMITS.title.max),
      description:
        description ||
        `Jag vill ha ${title} och betalar med arbetskraft.`,
      valueSek,
      hours,
      workOffer: clip(workOffer, LIMITS.workOffer.max),
      location: clip(location || "Sverige", LIMITS.location.max),
      requester: clip(requester || "Du", LIMITS.requester.max),
      category: nextCategory,
      image,
    },
  };
}

export function validateSponsorName(
  sponsor: string | null | undefined,
): { ok: true; value?: string | null } | { ok: false; error: string } {
  if (sponsor === undefined) return { ok: true, value: undefined };
  if (sponsor === null) return { ok: true, value: null };
  const trimmed = sponsor.trim();
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > LIMITS.sponsor.max) {
    return {
      ok: false,
      error: `Sponsor-namn får vara högst ${LIMITS.sponsor.max} tecken.`,
    };
  }
  return { ok: true, value: trimmed };
}
