import type { Trade } from "./types";

export const trades: Trade[] = [
  {
    id: "airpods-mikael",
    kind: "want",
    title: "AirPods Pro",
    description:
      "Jag vill ha nya AirPods Pro för 1 366 kr men har inga pengar just nu. Jag kan dela ut reklamblad i Vasastan eller klippa gräsmattor tills värdet är avbetalat.",
    valueSek: 1366,
    hours: 8,
    workOffer: "Dela ut reklamblad eller klippa gräs",
    location: "Stockholm · Vasastan",
    requester: "Mikael L.",
    status: "open",
    category: "Elektronik",
    image:
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1600&q=80",
    createdAt: "2026-10-10",
  },
  {
    id: "cykel-amina",
    kind: "want",
    title: "Begagnad elcykel",
    description:
      "Behöver en elcykel till jobbet. Kan städa kontor kvällstid, bära flyttlådor eller hjälpa till på event.",
    valueSek: 4500,
    hours: 22,
    workOffer: "Kontorsstädning, flytthjälp, event",
    location: "Göteborg · Majorna",
    requester: "Amina K.",
    sponsor: "NordStad Fastigheter",
    status: "sponsored",
    category: "Transport",
    image:
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=1600&q=80",
    createdAt: "2026-10-08",
  },
  {
    id: "laptop-erik",
    kind: "want",
    title: "Begagnad MacBook",
    description:
      "Behöver en dator för studier. Erbjuder trädgårdsskötsel, snöskottning och enklare IT-hjälp till äldre.",
    valueSek: 6200,
    hours: 30,
    workOffer: "Trädgård, snöskottning, IT-hjälp",
    location: "Uppsala",
    requester: "Erik N.",
    status: "open",
    category: "Elektronik",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=80",
    createdAt: "2026-10-09",
  },
  {
    id: "job-flyers",
    kind: "job",
    title: "Dela ut reklamblad i Vasastan",
    description:
      "Lokalt café söker någon som delar ut 2 000 flyers under två eftermiddagar. Betalas som arbetstimmar mot ett önskemål på Växla.",
    valueSek: 800,
    hours: 5,
    workOffer: "Utdelning av reklamblad",
    location: "Stockholm · Vasastan",
    requester: "Café Söderlind",
    status: "open",
    category: "Uppdrag",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
    createdAt: "2026-10-11",
  },
  {
    id: "job-lawn",
    kind: "job",
    title: "Klippa gräs och rensa rabatter",
    description:
      "Villaägare i Bromma behöver hjälp med gräsmatta och rabatter innan helgen. Timmarna kan användas för att lösa in ett öppet önskemål.",
    valueSek: 1200,
    hours: 6,
    workOffer: "Trädgårdsarbete",
    location: "Stockholm · Bromma",
    requester: "Familjen Holm",
    status: "open",
    category: "Uppdrag",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1600&q=80",
    createdAt: "2026-10-11",
  },
  {
    id: "job-move",
    kind: "job",
    title: "Flytthjälp en lördag",
    description:
      "Två starka armar behövs för att bära möbler från en trea till en lastbil. Perfekt om du vill jobba av ett större önskemål.",
    valueSek: 1600,
    hours: 8,
    workOffer: "Flytthjälp",
    location: "Malmö · Möllevången",
    requester: "Sara & Jonas",
    status: "open",
    category: "Uppdrag",
    image:
      "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=1600&q=80",
    createdAt: "2026-10-07",
  },
];

export function getTrade(id: string): Trade | undefined {
  return trades.find((trade) => trade.id === id);
}

export function formatSek(value: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}

export function statusLabel(status: Trade["status"]): string {
  switch (status) {
    case "open":
      return "Öppen";
    case "sponsored":
      return "Sponsrad";
    case "in_progress":
      return "Pågår";
    case "done":
      return "Klar";
  }
}
