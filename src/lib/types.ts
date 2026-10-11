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
};
