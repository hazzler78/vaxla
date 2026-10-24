import type { Metadata } from "next";
import { Syne, Manrope, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://vaxla-chi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Växla — byt arbete mot det du behöver",
    template: "%s — Växla",
  },
  description:
    "Växla är marknaden där du kan få det du behöver och betala tillbaka med dina timmar. Hitta uppdrag, hjälp andra och byt arbete mot varor.",
  keywords: [
    "byteshandel",
    "byta arbete",
    "arbete mot varor",
    "lokal arbetsmarknad",
    "uppdrag",
    "Växla",
  ],
  alternates: {
    canonical: siteUrl,
  },
  category: "marketplace",
  creator: "Växla",
  publisher: "Växla",
  verification: {
    google: "XONg7WDGMswG3gQ3LpxrUUmnaEJNEAJcCMv0sL2p1ZI",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: "Växla",
    title: "Växla — byt arbete mot det du behöver",
    description:
      "En marknad där arbetskraft är betalmedel. Sponsorer betalar varan, du betalar tillbaka med timmar.",
    url: siteUrl,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Växla — byt arbete mot det du behöver",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Växla — byt arbete mot det du behöver",
    description:
      "En marknad där arbetskraft är betalmedel. Sponsorer betalar varan, du betalar tillbaka med timmar.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sv"
      className={`${display.variable} ${body.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-ink/10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="font-heading text-xl text-ink">Växla</p>
            <p>Arbete som valuta. Inget lån krävs för att börja.</p>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
