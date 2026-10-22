import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { TradeDetail } from "@/components/trade-detail";
import { getTradeById } from "@/lib/trades-repo";
import { seedTrades } from "@/lib/seed-trades";

/** Live trade from DB — blocking SSR keeps title/description in HTML (P1/P2). */
export const instant = false;

export async function generateStaticParams() {
  // Seed ids for known prerender; live DB trades still resolve dynamically.
  return seedTrades.map((trade) => ({ id: trade.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const trade = await getTradeById(id);

  if (!trade) {
    return {
      title: "Hittades inte",
    };
  }

  const image = trade.image.trim();
  const socialImages = image
    ? [{ url: image, width: 1600, height: 900, alt: trade.title }]
    : undefined;

  return {
    title: trade.title,
    description: trade.description,
    openGraph: {
      title: trade.title,
      description: trade.description,
      type: "article",
      locale: "sv_SE",
      siteName: "Växla",
      ...(socialImages ? { images: socialImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: trade.title,
      description: trade.description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function TradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const trade = await getTradeById(id);

  if (!trade) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <TradeDetail key={`${trade.id}-${trade.status}-${trade.sponsor ?? ""}`} trade={trade} />
    </div>
  );
}
