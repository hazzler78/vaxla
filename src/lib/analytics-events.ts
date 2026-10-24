import { track } from "@vercel/analytics";

export type VaxlaAnalyticsEvent =
  | "magic_link_requested"
  | "login_verified"
  | "trade_request_created"
  | "trade_viewed";

type EventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

/** Vercel Web Analytics custom events (no PII in properties). */
export function trackVaxlaEvent(
  name: VaxlaAnalyticsEvent,
  properties?: EventProperties,
) {
  track(name, properties);
}
