"use client";

import { useEffect, useMemo, useState } from "react";
import type { Trade, TradeKind } from "@/lib/types";
import { TradeRow } from "@/components/trade-row";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Filter = "all" | TradeKind;

type Props = {
  seedTrades: Trade[];
};

export function MarketList({ seedTrades }: Props) {
  const [localTrades, setLocalTrades] = useState<Trade[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("vaxla-local-trades");
      if (raw) {
        setLocalTrades(JSON.parse(raw) as Trade[]);
      }
    } catch {
      setLocalTrades([]);
    }
  }, []);

  const items = useMemo(() => {
    const merged = [...localTrades, ...seedTrades];
    if (filter === "all") return merged;
    return merged.filter((trade) => trade.kind === filter);
  }, [filter, localTrades, seedTrades]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {(
          [
            ["all", "Alla"],
            ["want", "Önskemål"],
            ["job", "Uppdrag"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={filter === value ? "default" : "outline"}
            className={cn(
              "rounded-sm",
              filter === value && "bg-signal hover:bg-signal-deep",
            )}
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-ink/20 px-6 py-16 text-center">
          <h2 className="font-heading text-3xl text-ink">Inga träffar</h2>
          <p className="mt-2 text-muted-foreground">
            Byt filter eller publicera det första önskemålet.
          </p>
        </div>
      ) : (
        <div className="divide-y-0">
          {items.map((trade) => (
            <TradeRow key={trade.id} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
}
