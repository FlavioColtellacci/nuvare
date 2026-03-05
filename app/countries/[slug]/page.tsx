import { type ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import Disclaimer from "@/components/Disclaimer";
import { getCountryGuide } from "@/lib/getCountryGuide";

export const metadata: Metadata = {
  title: "Country Guide - Nuvare",
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

export default async function CountryGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("subscription_tier")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const hasActiveSubscription =
    profile?.subscription_tier === "core" || profile?.subscription_tier === "professional";

  if (!hasActiveSubscription) {
    redirect("/pricing");
  }

  try {
    const { content, updatedAt, countryName } = await getCountryGuide(slug);

    return (
      <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black px-6 py-10 text-white md:px-10">
        <div className="onboarding-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto w-full max-w-4xl">
          <Link
            href="/countries"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/70"
          >
            ← Back
          </Link>
          <h1 className="font-editorial text-5xl text-white">{countryName}</h1>
          <p className="mt-3 text-sm text-white/55">
            Live regulatory intelligence · Updated every 24 hours
          </p>
          <p className="mt-2 text-xs text-white/45">Last updated: {formatLastUpdated(updatedAt)}</p>
          <article className="mt-6 rounded-2xl border border-white/12 bg-[#0b0b0b]/80 p-6 md:p-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }: ComponentPropsWithoutRef<"h1">) => (
                  <h1 className="mb-4 text-xl font-semibold text-white">{children}</h1>
                ),
                h2: ({ children }: ComponentPropsWithoutRef<"h2">) => (
                  <h2 className="mb-3 mt-6 text-lg font-semibold text-white first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }: ComponentPropsWithoutRef<"h3">) => (
                  <h3 className="mb-2 mt-4 text-base font-semibold text-white">{children}</h3>
                ),
                p: ({ children }: ComponentPropsWithoutRef<"p">) => (
                  <p className="mb-3 text-sm leading-6 text-white/70 last:mb-0">{children}</p>
                ),
                ul: ({ children }: ComponentPropsWithoutRef<"ul">) => (
                  <ul className="mb-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-white/70">
                    {children}
                  </ul>
                ),
                ol: ({ children }: ComponentPropsWithoutRef<"ol">) => (
                  <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-white/70">
                    {children}
                  </ol>
                ),
                li: ({ children }: ComponentPropsWithoutRef<"li">) => <li>{children}</li>,
                strong: ({ children }: ComponentPropsWithoutRef<"strong">) => (
                  <strong className="font-semibold text-white">{children}</strong>
                ),
                hr: () => <hr className="my-5 border-white/15" />,
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        </div>
        <div className="relative mx-auto mt-10 w-full max-w-4xl">
          <Disclaimer />
        </div>
      </main>
    );
  } catch {
    return (
      <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black px-6 py-10 text-white md:px-10">
        <div className="onboarding-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto w-full max-w-4xl">
          <Link
            href="/countries"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/70"
          >
            ← Back
          </Link>
          <p className="mt-8 rounded-xl border border-red-200/20 bg-red-500/10 p-4 text-sm text-red-200">
            Unable to load guide. Please try again shortly.
          </p>
        </div>
        <div className="relative mx-auto mt-10 w-full max-w-4xl">
          <Disclaimer />
        </div>
      </main>
    );
  }
}
