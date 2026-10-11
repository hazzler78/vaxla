import { CreateRequestForm } from "@/components/create-request-form";

export default function NyttPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-signal">
          Nytt önskemål
        </p>
        <h1 className="mt-3 font-heading text-5xl text-ink sm:text-6xl">
          Vad vill du ha — och vad kan du ge?
        </h1>
        <p className="mt-4 text-base leading-relaxed text-steel/80">
          Publicera ett önskemål. En sponsor kan betala varan. Du betalar
          tillbaka med arbetstimmar i stället för pengar eller lån.
        </p>
      </div>

      <div className="border border-ink/10 bg-[color-mix(in_oklab,var(--card)_88%,white)] p-5 sm:p-8">
        <CreateRequestForm />
      </div>
    </div>
  );
}
