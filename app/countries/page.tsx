import type { Metadata } from "next";
import { redirect } from "next/navigation";

import CountriesClient from "@/app/countries/countries-client";
import { COUNTRIES } from "@/app/countries/countries-data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Country Intelligence - Nuvare",
};

export default async function CountriesPage() {
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

  return <CountriesClient countries={COUNTRIES} />;
}
