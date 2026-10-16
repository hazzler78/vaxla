export type TradeStatus = "open" | "sponsored" | "in_progress" | "done";

export type TradeKind = "want" | "job";

export type Trade = {
  id: string;
  kind: TradeKind;
  title: string;
  description: string;
  valueSek: number;
  hours: number;
  workOffer: string;
  location: string;
  requester: string;
  sponsor?: string;
  status: TradeStatus;
  category: string;
  image: string;
  createdAt: string;
  /** Signed-cookie actor that created the trade (early-access ownership). */
  ownerId?: string;
  /** Signed-cookie actor that claimed sponsor. */
  sponsorId?: string;
};
