import { Suspense } from "react";
import { TradeDetail } from "@/components/trade-detail";

async function TradeDetailLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TradeDetail id={id} />;
}

export default function TradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <Suspense fallback={<p className="py-20 text-muted-foreground">Hämtar bytet…</p>}>
        <TradeDetailLoader params={params} />
      </Suspense>
    </div>
  );
}
