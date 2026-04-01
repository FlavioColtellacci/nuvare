import type { Metadata } from "next";

import { COUNTRIES } from "@/app/countries/countries-data";
import CountryGuidesLiteClient from "@/app/country-guides/country-guides-lite-client";

export const metadata: Metadata = {
  title: "Country Guide Lite | Nuvare",
  description:
    "Explore public country guide lite pages for global mobility and cross-border planning starters.",
  alternates: {
    canonical: "/country-guides",
  },
};

export default function CountryGuidesLitePage() {
  return <CountryGuidesLiteClient countries={COUNTRIES} />;
}
