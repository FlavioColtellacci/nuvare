import { redirect } from "next/navigation";
import type { Metadata } from "next";

import DashboardClient from "@/app/home/home-client";
import type { DashboardDeadline } from "@/app/home/_lib/types";
import { createClient } from "@/lib/supabase/server";

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

  const { data: deadlinesData } = await supabase
    .from("deadlines")
    .select("id, title, due_date, category")
    .eq("user_id", user.id)
    .order("due_date", { ascending: true });
  const initialDeadlines: DashboardDeadline[] = (deadlinesData ?? []).map((deadline) => ({
    id: deadline.id as string,
    title: deadline.title as string,
    dueDate: deadline.due_date as string,
    category: (deadline.category as string | null) ?? "",
  }));
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
      initialDeadlines={initialDeadlines}
      viewedCountries={viewedCountries}
    />
  );
}
