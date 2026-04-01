import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import Disclaimer from "@/components/Disclaimer";
import CountryGuideContent from "@/app/countries/[slug]/country-guide-content";
import { getCountryGuide } from "@/lib/getCountryGuide";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Country Guide | Nuvare",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      nosnippet: true,
    },
  },
};

function formatLastUpdated(updatedAt: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(updatedAt));
}

export default async function CountryGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("subscription_tier")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const hasActiveSubscription =
    profile?.subscription_tier === "core" ||
    profile?.subscription_tier === "professional";
  if (!hasActiveSubscription) redirect("/pricing");

  let guideData: Awaited<ReturnType<typeof getCountryGuide>> | undefined;
  let guideError = false;

  try {
    guideData = await getCountryGuide(slug);
    await supabase.from("user_countries").upsert(
      {
        user_id: session.user.id,
        slug,
        country_name: guideData.countryName,
        last_viewed: new Date().toISOString(),
      },
      { onConflict: "user_id,slug" },
    );
  } catch {
    guideError = true;
  }

  if (guideError || !guideData) {
    return (
      <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black px-4 pb-10 pt-24 text-white sm:px-6 md:px-10">
        <div className="onboarding-glow pointer-events-none absolute inset-0" />
        <div className="absolute top-6 left-6 z-50">
          <BackButton />
        </div>
        <div className="relative mx-auto w-full max-w-4xl">
          <div className="mt-6 rounded-2xl border border-white/12 bg-[#0b0b0b]/80 p-6 md:p-8">
            <p className="text-sm text-white/70">
              Unable to load guide. Please try again shortly.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { content, updatedAt, countryName } = guideData;

  return (
    <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black px-4 pb-10 pt-24 text-white sm:px-6 md:px-10">
      <div className="onboarding-glow pointer-events-none absolute inset-0" />
      <div className="absolute top-6 left-6 z-50">
        <BackButton />
      </div>
      <div className="relative mx-auto w-full max-w-4xl">
        <h1 className="font-editorial text-5xl text-white">{countryName}</h1>
        <p className="mt-3 text-sm text-white/55">
          Live regulatory intelligence · Updated every 24 hours
        </p>
        <p className="mt-2 text-xs text-white/45">
          Last updated: {formatLastUpdated(updatedAt)}
        </p>
        <CountryGuideContent content={content} />
      </div>
      <div className="relative mx-auto mt-10 w-full max-w-4xl">
        <Disclaimer />
      </div>
    </main>
  );
}
