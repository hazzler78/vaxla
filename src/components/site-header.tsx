"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { AuthStatus } from "@/components/auth-status";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/marknad", label: "Marknad" },
  { href: "/nytt", label: "Nytt önskemål" },
  { href: "/#sa-funkar-det", label: "Så funkar det" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-[color-mix(in_oklab,var(--background)_82%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-heading text-2xl tracking-tight text-ink">
          Växla
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-steel/80 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <AuthStatus />
          <Link
            href="/nytt"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-sm bg-signal px-4 text-primary-foreground hover:bg-signal-deep",
            )}
          >
            Byt arbete
          </Link>
        </nav>

        <Sheet>
          <SheetTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "md:hidden",
            )}
          >
            <Menu className="size-4" />
            <span className="sr-only">Öppna meny</span>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <SheetHeader>
              <SheetTitle className="font-heading text-2xl">Växla</SheetTitle>
            </SheetHeader>
            <div className="mt-8 flex flex-col gap-4 px-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-lg font-medium text-ink"
                >
                  {link.label}
                </Link>
              ))}
              <AuthStatus compact />
              <Link
                href="/nytt"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-2 rounded-sm bg-signal px-4 hover:bg-signal-deep",
                )}
              >
                Byt arbete
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
