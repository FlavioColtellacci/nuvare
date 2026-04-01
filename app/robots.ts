import type { MetadataRoute } from "next";

const SITE_URL = "https://www.nuvare.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/features",
          "/pricing",
          "/intelligence-methodology",
          "/country-guides",
        ],
        disallow: [
          "/api/",
          "/home",
          "/vault",
          "/countries",
          "/onboarding",
          "/login",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
