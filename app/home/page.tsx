import { redirect } from "next/navigation";
import type { Metadata } from "next";

import DashboardClient, { type ManualDeadline } from "@/app/home/home-client";
import { createClient } from "@/lib/supabase/server";

type OnboardingAnswers = {
  citizenships?: string[];
  permitsByCountry?: Record<string, string[]>;
  abroadAssets?: string[];
  manualDeadlines?: ManualDeadline[];
  [key: string]: unknown;
};

type ViewedCountry = {
  slug: string;
  countryName: string;
};

export const metadata: Metadata = {
  title: "Nuvare",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/onboarding");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const onboardingAnswers =
    (profile?.onboarding_answers as OnboardingAnswers | null) ?? {};
  const manualDeadlines = Array.isArray(onboardingAnswers.manualDeadlines)
    ? onboardingAnswers.manualDeadlines
    : [];
  const { data: viewedCountriesData } = await supabase
    .from("user_countries")
    .select("slug, country_name")
    .eq("user_id", user.id)
    .order("last_viewed", { ascending: false })
    .limit(5);
  const viewedCountries: ViewedCountry[] = (viewedCountriesData ?? []).map((country) => ({
    slug: country.slug as string,
    countryName: country.country_name as string,
  }));

  return (
    <DashboardClient
      userId={user.id}
      userEmail={user.email ?? "Signed-in user"}
      hasProfile={Boolean(profile)}
      onboardingAnswers={onboardingAnswers}
      initialManualDeadlines={manualDeadlines}
      viewedCountries={viewedCountries}
    />
  );
}
