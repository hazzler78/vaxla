"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Trade } from "@/lib/types";
import { trackVaxlaEvent } from "@/lib/analytics-events";

type FormState = {
  title: string;
  valueSek: string;
  hours: string;
  workOffer: string;
  location: string;
  description: string;
  category: string;
};

const initial: FormState = {
  title: "",
  valueSek: "",
  hours: "",
  workOffer: "",
  location: "",
  description: "",
  category: "Elektronik",
};

type MeUser = {
  id: string;
  email: string;
  displayName: string;
};

export function CreateRequestForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<MeUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        const data = (await res.json()) as { user?: MeUser | null };
        if (!cancelled) setMe(data.user ?? null);
      } catch {
        if (!cancelled) setMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!me) {
      setError("Logga in för att publicera ett önskemål.");
      return;
    }

    if (!form.title.trim() || !form.valueSek || !form.workOffer.trim()) {
      setError("Fyll i minst titel, värde och vad du kan erbjuda.");
      return;
    }

    const value = Number(form.valueSek);
    const hours = Number(form.hours || "0");
    if (!Number.isFinite(value) || value <= 0) {
      setError("Ange ett giltigt belopp i kronor.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          valueSek: value,
          hours: hours > 0 ? hours : Math.max(1, Math.round(value / 170)),
          workOffer: form.workOffer.trim(),
          location: form.location.trim() || "Sverige",
          requester: me.displayName || "Du",
          category: form.category,
          kind: "want",
        }),
      });

      const data = (await res.json()) as { trade?: Trade; error?: string };
      if (!res.ok || !data.trade) {
        setError(data.error || "Kunde inte spara önskemålet. Försök igen.");
        setSaving(false);
        return;
      }

      trackVaxlaEvent("trade_request_created", {
        trade_id: data.trade.id,
        category: form.category,
      });
      router.push(`/marknad/${data.trade.id}`);
      router.refresh();
    } catch {
      setError("Kunde inte spara önskemålet. Försök igen.");
      setSaving(false);
    }
  }

  if (me === null) {
    return (
      <div className="space-y-4 border border-ink/10 bg-steel/5 px-5 py-6">
        <p className="text-base text-ink">
          Du behöver ett konto för att publicera önskemål.
        </p>
        <Link
          href="/logga-in?next=%2Fnytt"
          className="inline-flex rounded-sm bg-signal px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-signal-deep"
        >
          Logga in med e-post
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Vad vill du ha?</Label>
          <Input
            id="title"
            placeholder="t.ex. AirPods Pro"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">Värde (kr)</Label>
          <Input
            id="value"
            inputMode="numeric"
            placeholder="1366"
            value={form.valueSek}
            onChange={(e) => update("valueSek", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours">Timmar du kan jobba</Label>
          <Input
            id="hours"
            inputMode="numeric"
            placeholder="8"
            value={form.hours}
            onChange={(e) => update("hours", e.target.value)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="work">Vad kan du erbjuda?</Label>
          <Input
            id="work"
            placeholder="Dela ut reklamblad, klippa gräs, flytthjälp…"
            value={form.workOffer}
            onChange={(e) => update("workOffer", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ort</Label>
          <Input
            id="location"
            placeholder="Stockholm · Vasastan"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Kategori</Label>
          <Select
            value={form.category}
            onValueChange={(value) => update("category", value ?? "Elektronik")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Elektronik">Elektronik</SelectItem>
              <SelectItem value="Transport">Transport</SelectItem>
              <SelectItem value="Hem">Hem</SelectItem>
              <SelectItem value="Utbildning">Utbildning</SelectItem>
              <SelectItem value="Övrigt">Övrigt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Berätta mer</Label>
          <Textarea
            id="description"
            rows={4}
            placeholder="Varför du behöver det och hur du vill betala tillbaka med arbete."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-signal px-5 hover:bg-signal-deep"
          size="lg"
        >
          {saving ? "Publicerar…" : "Publicera önskemål"}
        </Button>
        <p className="text-sm text-muted-foreground">
          En sponsor kan betala varan. Du betalar tillbaka med timmar.
        </p>
      </div>
    </form>
  );
}
