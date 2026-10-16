"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MeUser = {
  id: string;
  email: string;
  displayName: string;
};

export function AuthStatus({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null | undefined>(undefined);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data: { user?: MeUser | null }) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, tick]);

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    setUser(null);
    setTick((n) => n + 1);
    router.refresh();
  }

  if (user === undefined) {
    return (
      <span className="text-xs text-muted-foreground">
        {compact ? "…" : "Session…"}
      </span>
    );
  }

  if (!user) {
    const next = encodeURIComponent(pathname || "/marknad");
    return (
      <Link
        href={`/logga-in?next=${next}`}
        className={cn(
          buttonVariants({
            variant: compact ? "outline" : "secondary",
            size: compact ? "sm" : "default",
          }),
          "rounded-sm",
        )}
      >
        Logga in
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        compact && "flex-col items-start gap-1",
      )}
    >
      <span className="max-w-[10rem] truncate text-xs text-steel/80 sm:max-w-[14rem]">
        {user.displayName}
      </span>
      <button
        type="button"
        onClick={() => void logout()}
        className="text-xs font-medium text-steel/70 underline-offset-2 hover:text-ink hover:underline"
      >
        Logga ut
      </button>
    </div>
  );
}
