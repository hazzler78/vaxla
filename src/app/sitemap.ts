import type { MetadataRoute } from "next";
import { trades } from "@/lib/data";

const siteUrl = "https://vaxla-chi.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const tradeEntries: MetadataRoute.Sitemap = trades.map((trade) => ({
    url: `${siteUrl}/marknad/${trade.id}`,
    lastModified: new Date(trade.createdAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/marknad`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/nytt`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...tradeEntries,
  ];
}
