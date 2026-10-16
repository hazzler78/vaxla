"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatSek, statusLabel } from "@/lib/data";
import type { Trade } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  trade: Trade;
};

export function TradeDetail({ trade: initial }: Props) {
  const router = useRouter();
  const [trade, setTrade] = useState<Trade>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function persist(patch: {
    status: Trade["status"];
    sponsor?: string | null;
  }) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as { trade?: Trade; error?: string };
      if (!res.ok || !data.trade) {
        setMessage(data.error || "Kunde inte spara statusen.");
        return null;
      }
      setTrade(data.trade);
      router.refresh();
      return data.trade;
    } catch {
      setMessage("Nätverksfel — försök igen.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function sponsor() {
    const next = await persist({
      status: "sponsored",
      sponsor: "Du (sponsor)",
    });
    if (next) {
      setMessage(
        "Du har gått in som sponsor. Mottagaren får varan när arbetstimmarna är klara.",
      );
    }
  }

  async function claimWork() {
    const next = await persist({ status: "in_progress" });
    if (next) {
      setMessage(
        trade.kind === "job"
          ? "Du har tagit uppdraget. Timmarna räknas mot ditt öppna önskemål."
          : "Arbetet är igång. När timmarna är klara frigörs varan.",
      );
    }
  }

  return (
    <article className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div className="relative min-h-[320px] overflow-hidden bg-steel/10 lg:min-h-[520px]">
        <Image
          src={trade.image}
          alt={trade.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 55vw"
        />
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge className="rounded-sm bg-steel text-secondary-foreground">
            {trade.kind === "want" ? "Önskemål" : "Uppdrag"}
          </Badge>
          <Badge variant="outline" className="rounded-sm">
            {statusLabel(trade.status)}
          </Badge>
          <Badge variant="outline" className="rounded-sm">
            {trade.category}
          </Badge>
        </div>

        <div>
          <h1 className="font-heading text-5xl leading-[0.95] text-ink sm:text-6xl">
            {trade.title}
          </h1>
          <p className="mt-4 text-lg text-steel/85">{trade.description}</p>
        </div>

        <dl className="grid gap-4 border-y border-ink/10 py-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Värde
            </dt>
            <dd className="font-heading text-3xl text-signal">
              {formatSek(trade.valueSek)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Arbete
            </dt>
            <dd className="font-heading text-3xl text-work">
              {trade.hours} tim
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Erbjudande
            </dt>
            <dd className="text-base text-ink">{trade.workOffer}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Plats
            </dt>
            <dd className="text-base text-ink">{trade.location}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {trade.kind === "want" ? "Önskar" : "Söker"}
            </dt>
            <dd className="text-base text-ink">{trade.requester}</dd>
          </div>
          {trade.sponsor ? (
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Sponsor
              </dt>
              <dd className="text-base text-ink">{trade.sponsor}</dd>
            </div>
          ) : null}
        </dl>

        <div className="flex flex-wrap gap-3">
          {trade.kind === "want" && trade.status === "open" ? (
            <Button
              type="button"
              size="lg"
              disabled={busy}
              className="rounded-sm bg-signal px-5 hover:bg-signal-deep"
              onClick={sponsor}
            >
              Sponsra köpet
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            variant="secondary"
            disabled={busy || trade.status === "in_progress" || trade.status === "done"}
            className="rounded-sm px-5"
            onClick={claimWork}
          >
            {trade.kind === "job" ? "Ta uppdraget" : "Börja jobba av"}
          </Button>
          <Link
            href="/marknad"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-sm px-5")}
          >
            Till marknaden
          </Link>
        </div>

        {message ? (
          <p className="border border-work/30 bg-work/10 px-4 py-3 text-sm text-ink">
            {message}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Så här funkar det: någon betalar varan eller publicerar ett uppdrag.
            Du gör arbetet. Timmarna räknas som betalning — utan lån och utan
            att pengar behöver vara din enda valuta.
          </p>
        )}
      </div>
    </article>
  );
}
