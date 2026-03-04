"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type BillingInterval = "monthly" | "yearly";

type PricingClientProps = {
  coreMonthlyPriceId: string;
  coreYearlyPriceId: string;
  professionalMonthlyPriceId: string;
  professionalYearlyPriceId: string;
};

export default function PricingClient({
  coreMonthlyPriceId,
  coreYearlyPriceId,
  professionalMonthlyPriceId,
  professionalYearlyPriceId,
}: PricingClientProps) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<"core" | "professional" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const priceMap = useMemo(
    () => ({
      core: {
        monthly: coreMonthlyPriceId,
        yearly: coreYearlyPriceId,
      },
      professional: {
        monthly: professionalMonthlyPriceId,
        yearly: professionalYearlyPriceId,
      },
    }),
    [coreMonthlyPriceId, coreYearlyPriceId, professionalMonthlyPriceId, professionalYearlyPriceId],
  );

  async function startCheckout(plan: "core" | "professional") {
    const priceId = priceMap[plan][billingInterval];
    if (!priceId) {
      setErrorMessage("Pricing is temporarily unavailable. Please try again.");
      return;
    }

    try {
      setErrorMessage("");
      setLoadingPlan(plan);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error ?? "Unable to start checkout.");
      }

      window.location.href = payload.url;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to start checkout.");
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <h1 className="text-center font-editorial text-5xl text-white md:text-6xl">
          Simple, transparent pricing.
        </h1>
        <p className="mt-4 text-center text-sm text-white/55">No hidden fees. Cancel anytime.</p>

        <div className="mt-8 inline-flex rounded-full border border-white/20 bg-[#0d0d0d] p-1">
          <button
            type="button"
            onClick={() => setBillingInterval("monthly")}
            className={cn(
              "rounded-full px-5 py-2 text-sm transition-colors",
              billingInterval === "monthly" ? "bg-white text-black" : "text-white/70 hover:text-white",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("yearly")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm transition-colors",
              billingInterval === "yearly" ? "bg-white text-black" : "text-white/70 hover:text-white",
            )}
          >
            <span>Yearly</span>
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white">
              2 months free
            </span>
          </button>
        </div>

        <div className="mt-12 grid w-full max-w-4xl gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-white/20 bg-[#0c0c0c] p-7">
            <p className="text-xs tracking-[0.2em] text-white/60">CORE</p>
            <div className="mt-5">
              <p className="text-4xl text-white">
                {billingInterval === "monthly" ? "$99" : "$990"}
                <span className="ml-1 text-lg text-white/70">
                  {billingInterval === "monthly" ? "/month" : "/year"}
                </span>
              </p>
              {billingInterval === "yearly" ? (
                <p className="mt-1 text-xs text-white/55">$82/mo, billed annually</p>
              ) : null}
            </div>
            <ul className="mt-6 space-y-2 text-sm text-white/85">
              <li>✓ Unlimited compliance queries</li>
              <li>✓ Deadline dashboard</li>
              <li>✓ Ask Anything (Claude + Perplexity)</li>
              <li>✓ 1 profile</li>
            </ul>
            <button
              type="button"
              onClick={() => void startCheckout("core")}
              disabled={loadingPlan !== null}
              className="mt-7 h-11 w-full rounded-md bg-white px-4 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingPlan === "core" ? "Redirecting..." : "Get started with Core"}
            </button>
          </article>

          <article className="rounded-2xl border border-white/45 bg-[#101010] p-7">
            <p className="inline-flex rounded-full border border-white/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/80">
              Most popular
            </p>
            <p className="mt-4 text-xs tracking-[0.2em] text-white/60">PROFESSIONAL</p>
            <div className="mt-5">
              <p className="text-4xl text-white">
                {billingInterval === "monthly" ? "$199" : "$1,990"}
                <span className="ml-1 text-lg text-white/70">
                  {billingInterval === "monthly" ? "/month" : "/year"}
                </span>
              </p>
              {billingInterval === "yearly" ? (
                <p className="mt-1 text-xs text-white/55">$166/mo, billed annually</p>
              ) : null}
            </div>
            <ul className="mt-6 space-y-2 text-sm text-white/85">
              <li>✓ Everything in Core</li>
              <li>✓ 20 Deep Research queries/month</li>
              <li>✓ Document Vault (coming soon)</li>
              <li>✓ Priority support</li>
            </ul>
            <button
              type="button"
              onClick={() => void startCheckout("professional")}
              disabled={loadingPlan !== null}
              className="mt-7 h-11 w-full rounded-md bg-white px-4 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingPlan === "professional"
                ? "Redirecting..."
                : "Get started with Professional"}
            </button>
          </article>
        </div>

        {errorMessage ? <p className="mt-5 text-sm text-red-300">{errorMessage}</p> : null}
        <p className="mt-8 text-center text-sm text-white/50">Questions? hello@nuvare.app</p>
      </div>
    </main>
  );
}
