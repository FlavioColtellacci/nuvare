import { redirect } from "next/navigation";
import type { Metadata } from "next";

import DashboardClient, { type ManualDeadline } from "@/app/dashboard/dashboard-client";
import { createClient } from "@/lib/supabase/server";

type OnboardingAnswers = {
  citizenships?: string[];
  permitsByCountry?: Record<string, string[]>;
  abroadAssets?: string[];
  manualDeadlines?: ManualDeadline[];
  [key: string]: unknown;
};

export const metadata: Metadata = {
  title: "Nuvare",
};

export default async function DashboardPage() {
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

  return (
    <DashboardClient
      userId={user.id}
      userEmail={user.email ?? "Signed-in user"}
      hasProfile={Boolean(profile)}
      onboardingAnswers={onboardingAnswers}
      initialManualDeadlines={manualDeadlines}
    />
  );
}
