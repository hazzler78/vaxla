import type { Trade } from "./types";
import { seedTrades } from "./seed-trades";

/** @deprecated Prefer `listTrades()` / `getTradeById()` from trades-repo. */
export const trades = seedTrades;

/** @deprecated Prefer `getTradeById()` from trades-repo. */
export function getTrade(id: string): Trade | undefined {
  return seedTrades.find((trade) => trade.id === id);
}

export function formatSek(value: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}

export function statusLabel(status: Trade["status"]): string {
  switch (status) {
    case "open":
      return "Öppen";
    case "sponsored":
      return "Sponsrad";
    case "in_progress":
      return "Pågår";
    case "done":
      return "Klar";
  }
}
