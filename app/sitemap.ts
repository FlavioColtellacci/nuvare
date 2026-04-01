import type { MetadataRoute } from "next";
import { COUNTRIES } from "@/app/countries/countries-data";

const SITE_URL = "https://www.nuvare.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publicCountryGuides: MetadataRoute.Sitemap = COUNTRIES.map((country) => ({
    url: `${SITE_URL}/country-guides/${country.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.55,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/features`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/intelligence-methodology`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/country-guides`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    ...publicCountryGuides,
  ];
}
