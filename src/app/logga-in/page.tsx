import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Logga in",
  description: "Logga in på Växla med e-post (magic link).",
};

export default function LoginPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Laddar…</p>}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
