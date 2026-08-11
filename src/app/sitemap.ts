// Dynamic sitemap — tells search engines about all public pages
// Genre pages are dynamic (from DB slugs), everything else is static

import type { MetadataRoute } from "next";
import { GENRE_SLUGS } from "@/lib/constants";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ootd-ai.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  // Static public pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/quiz`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/discover`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  // Genre explorer pages — high SEO value
  const genrePages: MetadataRoute.Sitemap = GENRE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/genres/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...genrePages];
}
