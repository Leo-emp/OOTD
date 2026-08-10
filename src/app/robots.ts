// robots.txt — allow search engines to crawl public pages, block app internals

import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ootd-ai.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/quiz", "/discover", "/genres/"],
        disallow: ["/dashboard", "/wardrobe", "/stylist", "/profile", "/outfit/", "/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
