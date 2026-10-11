import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TradeDetail } from "@/components/trade-detail";
import { getTrade, trades } from "@/lib/data";

export function generateStaticParams() {
  return trades.map((trade) => ({ id: trade.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const trade = getTrade(id);

  if (!trade) {
    return {
      title: "Hittades inte",
    };
  }

  return {
    title: trade.title,
    description: trade.description,
    openGraph: {
      title: trade.title,
      description: trade.description,
      type: "article",
      locale: "sv_SE",
      siteName: "Växla",
      images: [{ url: trade.image, width: 1600, height: 900, alt: trade.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: trade.title,
      description: trade.description,
      images: [trade.image],
    },
  };
}

export default async function TradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trade = getTrade(id);

  // Local-only wishes live in the browser; keep client fallback for those.
  if (!trade && !id.startsWith("local-")) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <TradeDetail id={id} trade={trade} />
    </div>
  );
}
