"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackVaxlaEvent } from "@/lib/analytics-events";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/marknad";
  const errorCode = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  const errorHint = useMemo(() => {
    switch (errorCode) {
      case "missing":
        return "Saknad inloggningslänk.";
      case "invalid":
        return "Länken är ogiltig eller har gått ut. Begär en ny.";
      case "server":
        return "Något gick fel vid inloggning. Försök igen.";
      default:
        return null;
    }
  }, [errorCode]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setVerifyUrl(null);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          displayName: displayName.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        verifyUrl?: string;
      };
      if (!res.ok) {
        setMessage(data.error || "Kunde inte skicka inloggningslänk.");
        return;
      }
      trackVaxlaEvent("magic_link_requested", {
        has_display_name: Boolean(displayName.trim()),
      });
      setMessage(data.message || "Kolla din e-post för inloggningslänken.");
      if (data.verifyUrl) {
        const url = new URL(data.verifyUrl);
        url.searchParams.set("next", next.startsWith("/") ? next : "/marknad");
        setVerifyUrl(url.toString());
      }
    } catch {
      setMessage("Nätverksfel — försök igen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div>
        <h1 className="font-heading text-4xl text-ink">Logga in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Magic link via e-post. Kontot används för att äga önskemål, sponsra
          och markera byten som klara.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="du@exempel.se"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayName">Visningsnamn (valfritt)</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="t.ex. Mikael"
          />
        </div>
        <Button
          type="submit"
          disabled={busy}
          size="lg"
          className="rounded-sm bg-signal px-5 hover:bg-signal-deep"
        >
          {busy ? "Skickar…" : "Skicka inloggningslänk"}
        </Button>
      </form>

      {errorHint ? (
        <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorHint}
        </p>
      ) : null}

      {message ? (
        <p className="border border-work/30 bg-work/10 px-4 py-3 text-sm text-ink">
          {message}
        </p>
      ) : null}

      {verifyUrl ? (
        <p className="text-sm text-ink">
          <Link
            href={verifyUrl}
            className="font-medium text-signal underline-offset-2 hover:underline"
          >
            Öppna inloggningslänken
          </Link>{" "}
          (dev/early-access utan SMTP).
        </p>
      ) : null}
    </div>
  );
}
