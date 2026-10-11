import Image from "next/image";
import Link from "next/link";
import { trades, formatSek } from "@/lib/data";
import { TradeRow } from "@/components/trade-row";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const featured = trades.find((trade) => trade.id === "airpods-mikael")!;
const preview = trades.filter((trade) => trade.id !== featured.id).slice(0, 3);

export default function Home() {
  return (
    <>
      <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=2400&q=80"
            alt="Människor som arbetar tillsammans"
            fill
            priority
            className="hero-media object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-ink/20" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl flex-col justify-end px-4 pb-16 pt-24 sm:px-6 sm:pb-20">
          <p className="animate-rise font-heading text-6xl leading-none text-white sm:text-8xl md:text-9xl">
            <span className="brand-underline">Växla</span>
          </p>
          <h1 className="animate-rise-delay-1 mt-6 max-w-2xl font-heading text-3xl leading-tight text-white sm:text-5xl">
            Byt arbete mot det du behöver
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Ingen kontant? Ingen kredit? Låt någon betala varan — du betalar
            tillbaka med timmar: reklamblad, gräsklippning, flytt.
          </p>
          <div className="animate-rise-delay-3 mt-8 flex flex-wrap gap-3">
            <Link
              href="/nytt"
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-sm bg-signal px-5 text-primary-foreground hover:bg-signal-deep",
              )}
            >
              Skapa önskemål
            </Link>
            <Link
              href="/marknad"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "rounded-sm border-white/40 bg-white/10 px-5 text-white hover:bg-white/20",
              )}
            >
              Se marknaden
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.18em] text-signal">
            Exempel från marknaden
          </p>
          <h2 className="mt-3 font-heading text-4xl text-ink sm:text-5xl">
            AirPods för {formatSek(featured.valueSek)} — betalas med 8 timmar
          </h2>
          <p className="mt-4 text-base leading-relaxed text-steel/80">
            {featured.requester} vill ha nya AirPods. En sponsor kan betala
            köpet. Mikael delar ut reklamblad eller klipper gräs tills värdet är
            avbetalat.
          </p>
        </div>

        <div className="mt-10">
          <TradeRow trade={featured} />
        </div>
      </section>

      <section
        id="sa-funkar-det"
        className="border-y border-ink/10 bg-ink text-white"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-heading text-4xl sm:text-5xl">Så funkar det</h2>
            <p className="mt-4 max-w-md text-white/75">
              När mänsklig arbetskraft blir mer sällsynt som inkomstkälla behövs
              fler sätt att byta värde — utan att fastna i lån.
            </p>
          </div>
          <ol className="space-y-8">
            {[
              {
                step: "01",
                title: "Publicera ett önskemål",
                text: "Skriv vad du vill ha, vad det kostar och vilka jobb du kan göra.",
              },
              {
                step: "02",
                title: "En sponsor går in",
                text: "En person eller ett företag betalar varan eller publicerar ett uppdrag.",
              },
              {
                step: "03",
                title: "Du jobbar av värdet",
                text: "Timmarna räknas som betalning. När de är klara är bytet klart.",
              },
            ].map((item) => (
              <li key={item.step} className="border-t border-white/15 pt-6">
                <p className="font-heading text-signal">{item.step}</p>
                <h3 className="mt-2 font-heading text-2xl">{item.title}</h3>
                <p className="mt-2 max-w-lg text-white/70">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-4xl text-ink">Öppen marknad</h2>
            <p className="mt-2 text-muted-foreground">
              Önskemål och uppdrag du kan ta just nu.
            </p>
          </div>
          <Link
            href="/marknad"
            className="hidden text-sm font-medium text-signal hover:text-signal-deep sm:inline"
          >
            Visa alla
          </Link>
        </div>
        <div>
          {preview.map((trade) => (
            <TradeRow key={trade.id} trade={trade} />
          ))}
        </div>
      </section>
    </>
  );
}
