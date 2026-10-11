import Link from "next/link";
import { MarketList } from "@/components/market-list";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MarknadPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.18em] text-signal">
            Marknad
          </p>
          <h1 className="mt-3 font-heading text-5xl text-ink sm:text-6xl">
            Önskemål och uppdrag
          </h1>
          <p className="mt-4 text-base leading-relaxed text-steel/80">
            Sponsra ett köp, ta ett uppdrag, eller hitta någon som kan jobba av
            värdet med sin arbetskraft.
          </p>
        </div>
        <Link
          href="/nytt"
          className={cn(
            buttonVariants({ size: "lg" }),
            "rounded-sm bg-signal px-5 hover:bg-signal-deep",
          )}
        >
          Nytt önskemål
        </Link>
      </div>

      <MarketList />
    </div>
  );
}
