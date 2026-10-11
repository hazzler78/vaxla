"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTrade, formatSek, statusLabel } from "@/lib/data";
import type { Trade } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
};

export function TradeDetail({ id }: Props) {
  const [trade, setTrade] = useState<Trade | null | undefined>(undefined);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const seeded = getTrade(id);
    if (seeded) {
      try {
        const raw = sessionStorage.getItem(`vaxla-status-${id}`);
        setTrade(raw ? (JSON.parse(raw) as Trade) : seeded);
      } catch {
        setTrade(seeded);
      }
      return;
    }

    try {
      const raw = localStorage.getItem("vaxla-local-trades");
      const local = raw ? (JSON.parse(raw) as Trade[]) : [];
      setTrade(local.find((item) => item.id === id) ?? null);
    } catch {
      setTrade(null);
    }
  }, [id]);

  function persist(next: Trade) {
    if (!next.id.startsWith("local-")) {
      sessionStorage.setItem(`vaxla-status-${next.id}`, JSON.stringify(next));
      return;
    }

    try {
      const raw = localStorage.getItem("vaxla-local-trades");
      const local = raw ? (JSON.parse(raw) as Trade[]) : [];
      const updated = local.map((item) => (item.id === next.id ? next : item));
      localStorage.setItem("vaxla-local-trades", JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  }

  function sponsor() {
    if (!trade) return;
    const next = {
      ...trade,
      status: "sponsored" as const,
      sponsor: "Du (sponsor)",
    };
    persist(next);
    setTrade(next);
    setMessage(
      "Du har gått in som sponsor. Mottagaren får varan när arbetstimmarna är klara.",
    );
  }

  function claimWork() {
    if (!trade) return;
    const next = { ...trade, status: "in_progress" as const };
    persist(next);
    setTrade(next);
    setMessage(
      trade.kind === "job"
        ? "Du har tagit uppdraget. Timmarna räknas mot ditt öppna önskemål."
        : "Arbetet är igång. När timmarna är klara frigörs varan.",
    );
  }

  if (trade === undefined) {
    return <p className="py-20 text-muted-foreground">Hämtar bytet…</p>;
  }

  if (trade === null) {
    return (
      <div className="py-20">
        <h1 className="font-heading text-4xl text-ink">Hittades inte</h1>
        <p className="mt-3 text-muted-foreground">
          Det här önskemålet eller uppdraget finns inte längre.
        </p>
        <Link
          href="/marknad"
          className={cn(buttonVariants(), "mt-6 inline-flex rounded-sm bg-signal hover:bg-signal-deep")}
        >
          Tillbaka till marknaden
        </Link>
      </div>
    );
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
