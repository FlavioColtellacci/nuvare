"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import Disclaimer from "@/components/Disclaimer";
import Link from "next/link";

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
    <main
      className="flex min-h-screen flex-col overflow-x-hidden"
      style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}
    >
      {/* Subtle depth glow */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,255,255,0.025) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 px-6 py-4 backdrop-blur-sm md:px-10"
        style={{
          backgroundColor: "rgba(10,10,12,0.92)",
          borderBottom: "1px solid var(--brand-border)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="sigma-glitch font-mono text-base font-medium" style={{ color: "var(--brand-text)" }}>
              Σ
            </span>
            <span
              className="font-mono text-xs font-medium uppercase tracking-widest"
              style={{ color: "var(--brand-text)" }}
            >
              NUVARE
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/features"
              className="font-mono text-xs uppercase tracking-widest transition-colors hover:text-white"
              style={{ color: "var(--brand-muted)" }}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: "var(--brand-text)" }}
            >
              Pricing
            </Link>
          </nav>

          <Link
            href="/onboarding"
            className="font-mono text-xs font-medium uppercase tracking-widest"
            style={{
              backgroundColor: "#FFFFFF",
              color: "#0A0A0C",
              padding: "8px 18px",
              borderRadius: "2px",
            }}
          >
            Get Started →
          </Link>
        </div>
      </header>

      {/* ── Pricing content ───────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 py-20 md:px-10">
        {/* Eyebrow */}
        <p
          className="mb-4 font-mono text-xs uppercase tracking-widest"
          style={{ color: "var(--brand-muted)" }}
        >
          Simple Pricing
        </p>

        {/* Heading */}
        <h1
          className="text-center font-mono text-4xl font-medium uppercase leading-tight md:text-5xl"
          style={{ color: "var(--brand-text)" }}
        >
          Simple, transparent pricing.
        </h1>
        <p
          className="mt-4 text-center text-sm"
          style={{ color: "var(--brand-muted)" }}
        >
          No hidden fees. Cancel anytime.
        </p>

        {/* Billing toggle */}
        <div
          className="mt-10 flex rounded-sm p-1"
          style={{ border: "1px solid var(--brand-border)", backgroundColor: "var(--brand-panel)" }}
        >
          <button
            type="button"
            onClick={() => setBillingInterval("monthly")}
            className={cn(
              "font-mono text-xs uppercase tracking-widest px-6 py-2 transition-colors rounded-sm",
              billingInterval === "monthly"
                ? "bg-white text-black"
                : "text-white/60 hover:text-white",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("yearly")}
            className={cn(
              "inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest px-6 py-2 transition-colors rounded-sm",
              billingInterval === "yearly"
                ? "bg-white text-black"
                : "text-white/60 hover:text-white",
            )}
          >
            <span>Yearly</span>
            <span
              className="shrink-0 rounded-sm px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-widest"
              style={{ backgroundColor: "rgba(0,209,178,0.15)", color: "var(--brand-cyan)" }}
            >
              Save 17%
            </span>
          </button>
        </div>

        {/* Pricing cards */}
        <div className="mt-12 grid w-full max-w-4xl gap-6 md:grid-cols-2">
          {/* Core */}
          <article
            className="flex h-full flex-col"
            style={{
              backgroundColor: "var(--brand-panel)",
              border: "1px solid var(--brand-border)",
              borderRadius: "12px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
              padding: "32px",
            }}
          >
            <p
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: "var(--brand-muted)" }}
            >
              Core
            </p>
            <div className="mt-5">
              <p className="font-mono text-4xl font-medium" style={{ color: "var(--brand-text)" }}>
                {billingInterval === "monthly" ? "$99" : "$990"}
                <span
                  className="ml-1 font-mono text-sm font-normal"
                  style={{ color: "var(--brand-muted)" }}
                >
                  {billingInterval === "monthly" ? "/month" : "/year"}
                </span>
              </p>
              {billingInterval === "yearly" ? (
                <p className="mt-1 font-mono text-xs" style={{ color: "var(--brand-muted)" }}>
                  $82/mo, billed annually
                </p>
              ) : null}
            </div>
            <ul className="mt-8 flex-1 space-y-3">
              {[
                "Unlimited queries",
                "Deadline dashboard",
                "Advanced AI reasoning with live research",
                "1 profile",
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-2 text-sm" style={{ color: "var(--brand-muted)" }}>
                  <span style={{ color: "var(--brand-cyan)", flexShrink: 0 }}>✓</span>
                  {feat}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void startCheckout("core")}
              disabled={loadingPlan !== null}
              className="mt-8 h-11 w-full font-mono text-xs font-medium uppercase tracking-widest transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                border: "1px solid var(--brand-border)",
                color: "var(--brand-text)",
                borderRadius: "2px",
                background: "transparent",
              }}
            >
              {loadingPlan === "core" ? "Redirecting..." : "Get started with Core →"}
            </button>
          </article>

          {/* Professional */}
          <article
            className="flex h-full flex-col"
            style={{
              backgroundColor: "var(--brand-panel-alt)",
              border: "1px solid var(--brand-border)",
              borderRadius: "12px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
              padding: "32px",
            }}
          >
            <div
              className="mb-4 inline-flex w-fit items-center rounded-sm px-2.5 py-1"
              style={{ border: "1px solid var(--brand-border)" }}
            >
              <span
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "var(--brand-cyan)" }}
              >
                Most popular
              </span>
            </div>
            <p
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: "var(--brand-muted)" }}
            >
              Professional
            </p>
            <div className="mt-5">
              <p className="font-mono text-4xl font-medium" style={{ color: "var(--brand-text)" }}>
                {billingInterval === "monthly" ? "$199" : "$1,990"}
                <span
                  className="ml-1 font-mono text-sm font-normal"
                  style={{ color: "var(--brand-muted)" }}
                >
                  {billingInterval === "monthly" ? "/month" : "/year"}
                </span>
              </p>
              {billingInterval === "yearly" ? (
                <p className="mt-1 font-mono text-xs" style={{ color: "var(--brand-muted)" }}>
                  $166/mo, billed annually
                </p>
              ) : null}
            </div>
            <ul className="mt-8 flex-1 space-y-3">
              {[
                "Everything in Core",
                "20 Deep Research queries per month",
                "Document Vault (coming soon)",
                "Priority support",
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-2 text-sm" style={{ color: "var(--brand-muted)" }}>
                  <span style={{ color: "var(--brand-cyan)", flexShrink: 0 }}>✓</span>
                  {feat}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void startCheckout("professional")}
              disabled={loadingPlan !== null}
              className="mt-8 h-11 w-full font-mono text-xs font-medium uppercase tracking-widest transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#0A0A0C",
                borderRadius: "2px",
                border: "none",
              }}
            >
              {loadingPlan === "professional" ? "Redirecting..." : "Get started with Professional →"}
            </button>
          </article>
        </div>

        {errorMessage ? (
          <p className="mt-5 font-mono text-xs" style={{ color: "#F87171" }}>
            {errorMessage}
          </p>
        ) : null}

        <p
          className="mt-8 text-center font-mono text-xs"
          style={{ color: "var(--brand-muted)" }}
        >
          For enquiries, contact us at hello@nuvare.app
        </p>
      </div>

      <div className="relative z-20 mt-auto px-6 pb-6 md:px-10">
        <Disclaimer />
      </div>
    </main>
  );
}
