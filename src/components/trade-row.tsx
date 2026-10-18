import Link from "next/link";
import { TradeImage } from "@/components/trade-image";
import { Badge } from "@/components/ui/badge";
import { formatSek, statusLabel } from "@/lib/data";
import type { Trade } from "@/lib/types";

export function TradeRow({ trade }: { trade: Trade }) {
  return (
    <Link
      href={`/marknad/${trade.id}`}
      className="group grid gap-4 border-b border-ink/10 py-6 transition-colors last:border-b-0 hover:bg-ink/[0.03] sm:grid-cols-[140px_1fr_auto] sm:items-center"
    >
      <TradeImage
        image={trade.image}
        alt={trade.title}
        category={trade.category}
        variant="card"
      />

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="rounded-sm bg-steel text-secondary-foreground"
          >
            {trade.kind === "want" ? "Önskemål" : "Uppdrag"}
          </Badge>
          <Badge variant="outline" className="rounded-sm">
            {statusLabel(trade.status)}
          </Badge>
          <span className="text-xs text-muted-foreground">{trade.location}</span>
        </div>
        <h3 className="font-heading text-2xl leading-none text-ink sm:text-3xl">
          {trade.title}
        </h3>
        <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-steel/80">
          {trade.description}
        </p>
        <p className="text-sm font-medium text-work">
          {trade.hours} tim · {trade.workOffer}
        </p>
      </div>

      <div className="sm:text-right">
        <p className="font-heading text-3xl text-signal">{formatSek(trade.valueSek)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{trade.requester}</p>
      </div>
    </Link>
  );
}
