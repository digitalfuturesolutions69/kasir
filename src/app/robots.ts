import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything behind login — crawling these just wastes crawl
      // budget on pages that redirect to /login for an anonymous bot.
      disallow: ["/dashboard", "/transactions", "/categories", "/paket", "/admin", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
