import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import CountryGuideClient from "@/app/countries/[slug]/country-guide-client";
import { COUNTRIES } from "@/app/countries/countries-data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Country Guide - Nuvare",
};

export default async function CountryGuidePage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("subscription_tier")
    .eq("user_id", user.id)
    .maybeSingle();

  const hasActiveSubscription =
    profile?.subscription_tier === "core" || profile?.subscription_tier === "professional";

  if (!hasActiveSubscription) {
    redirect("/pricing");
  }

  const country = COUNTRIES.find((item) => item.slug === slug);
  if (!country) {
    notFound();
  }

  return (
    <CountryGuideClient
      slug={country.slug}
      countryName={country.name}
      countryFlag={country.flag}
    />
  );
}
