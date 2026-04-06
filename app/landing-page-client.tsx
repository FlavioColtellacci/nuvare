"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Disclaimer from "@/components/Disclaimer";

export default function LandingPageClient() {
  const router = useRouter();
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  useEffect(() => {
    if (isFaqOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFaqOpen]);

  useEffect(() => {
    if (!isFaqOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFaqOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isFaqOpen]);

  return (
    <main
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}
    >
      {/* Subtle radial depth glow */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,255,255,0.025) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Sticky header ────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 px-6 py-4 backdrop-blur-sm md:px-10"
        style={{
          backgroundColor: "rgba(10,10,12,0.92)",
          borderBottom: "1px solid var(--brand-border)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="nuvare-glitch font-mono text-base font-medium leading-none" style={{ color: "var(--brand-text)" }}>
              N
            </span>
            <span
              className="font-mono text-xs font-medium uppercase tracking-widest"
              style={{ color: "var(--brand-text)" }}
            >
              NUVARE
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden items-center gap-8 md:flex">
            {[
              { label: "FEATURES", href: "/features" },
              { label: "PRICING", href: "/pricing" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="font-mono text-xs uppercase tracking-widest transition-colors hover:text-white"
                style={{ color: "var(--brand-muted)" }}
              >
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setIsFaqOpen(true)}
              className="font-mono text-xs uppercase tracking-widest transition-colors hover:text-white"
              style={{ color: "var(--brand-muted)" }}
            >
              FAQ
            </button>
          </nav>

          {/* Auth / CTA */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="hidden font-mono text-xs uppercase tracking-widest transition-colors hover:text-white md:block"
              style={{ color: "var(--brand-muted)" }}
            >
              Log In
            </button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/onboarding")}
              className="font-mono text-xs font-medium uppercase tracking-widest"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#0A0A0C",
                padding: "8px 18px",
                border: "none",
                borderRadius: "2px",
              }}
            >
              Get Started →
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Hero section ─────────────────────────────────────────────── */}
      <section className="relative z-20 flex flex-1 flex-col justify-center px-6 py-24 md:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            {/* Left: copy */}
            <div>
              <p
                className="mb-8 font-mono text-xs uppercase tracking-widest"
                style={{ color: "var(--brand-muted)" }}
              >
                Private Intelligence Platform
              </p>

              <div className="space-y-0">
                <h1
                  className="font-mono text-6xl font-medium uppercase leading-none md:text-7xl xl:text-8xl"
                  style={{ color: "var(--brand-text)" }}
                >
                  YOUR
                </h1>
                <h1
                  className="font-mono text-6xl font-medium uppercase leading-none md:text-7xl xl:text-8xl"
                  style={{ color: "var(--brand-text)" }}
                >
                  COMPLIANCE
                </h1>
                <h1
                  className="font-mono text-6xl font-medium uppercase leading-none md:text-7xl xl:text-8xl"
                  style={{ color: "var(--brand-text)" }}
                >
                  TRACKED.
                </h1>

                {/* Standalone glitched N — like synesi's Σ */}
                <div
                  className="nuvare-glitch font-mono font-medium uppercase leading-none mt-6"
                  style={{
                    color: "var(--brand-text)",
                    fontSize: "clamp(4rem, 12vw, 9rem)",
                  }}
                >
                  N
                </div>
              </div>

              <p
                className="mt-8 max-w-md text-sm leading-relaxed"
                style={{ color: "var(--brand-muted)" }}
              >
                Nuvare watches your compliance and financial obligations across
                every country you live, work, and invest in — so nothing falls
                through the cracks.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <motion.button
                  type="button"
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                  onClick={() => router.push("/pricing")}
                  className="font-mono text-xs uppercase tracking-widest transition-colors"
                  style={{
                    border: "1px solid var(--brand-border)",
                    padding: "12px 24px",
                    color: "var(--brand-text)",
                    borderRadius: "2px",
                    background: "transparent",
                  }}
                >
                  View Pricing →
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/onboarding")}
                  className="font-mono text-xs font-medium uppercase tracking-widest"
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "#0A0A0C",
                    padding: "12px 24px",
                    border: "none",
                    borderRadius: "2px",
                  }}
                >
                  Get Started →
                </motion.button>
              </div>
            </div>

            {/* Right: decorative obligation monitor card */}
            <div className="hidden lg:flex lg:justify-end">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                style={{
                  backgroundColor: "var(--brand-panel)",
                  border: "1px solid var(--brand-border)",
                  borderRadius: "12px",
                  boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                  padding: "32px",
                  width: "340px",
                }}
              >
                <p
                  className="mb-6 font-mono text-xs uppercase tracking-widest"
                  style={{ color: "var(--brand-muted)" }}
                >
                  Obligation Monitor
                </p>

                {[
                  { country: "Portugal", label: "Tax Filing", status: "INTACT", color: "var(--brand-cyan)" },
                  { country: "UAE", label: "Residency Visa", status: "INTACT", color: "var(--brand-cyan)" },
                  { country: "UK", label: "30-Day Rule", status: "AT RISK", color: "var(--brand-yellow)" },
                  { country: "Singapore", label: "Director Filing", status: "INTACT", color: "var(--brand-cyan)" },
                ].map((item) => (
                  <div
                    key={item.country}
                    className="mb-4 flex items-center justify-between"
                    style={{ borderBottom: "1px solid var(--brand-border)", paddingBottom: "16px" }}
                  >
                    <div>
                      <p
                        className="font-mono text-xs font-medium uppercase tracking-widest"
                        style={{ color: "var(--brand-text)" }}
                      >
                        {item.country}
                      </p>
                      <p className="mt-0.5 font-mono text-xs" style={{ color: "var(--brand-muted)" }}>
                        {item.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="dot-pulse h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: item.color, display: "inline-block" }}
                      />
                      <span
                        className="font-mono text-xs uppercase tracking-widest"
                        style={{ color: item.color }}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="mt-2">
                  <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--brand-muted)" }}>
                    Next deadline
                  </p>
                  <p className="mt-1 font-mono text-sm" style={{ color: "var(--brand-yellow)" }}>
                    UK — 30-Day Rule · 7 days
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-20 mt-auto px-6 pb-6 md:px-10">
        <Disclaimer />
      </div>

      {/* ── FAQ Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isFaqOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
            style={{ backgroundColor: "rgba(10,10,12,0.88)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFaqOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="faq-title"
              className="relative w-full max-w-lg"
              style={{
                backgroundColor: "var(--brand-panel)",
                border: "1px solid var(--brand-border)",
                borderRadius: "12px",
                boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                padding: "36px",
              }}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsFaqOpen(false)}
                aria-label="Close FAQ"
                className="absolute right-4 top-4 font-mono text-xs uppercase tracking-widest transition-colors hover:text-white"
                style={{
                  color: "var(--brand-muted)",
                  border: "1px solid var(--brand-border)",
                  padding: "4px 10px",
                  borderRadius: "4px",
                }}
              >
                ESC
              </button>

              <p
                className="mb-1 font-mono text-xs uppercase tracking-widest"
                style={{ color: "var(--brand-muted)" }}
              >
                Reference
              </p>
              <h2
                id="faq-title"
                className="font-mono text-xl font-medium uppercase tracking-wide"
                style={{ color: "var(--brand-text)" }}
              >
                FAQ
              </h2>

              <div className="mt-6 space-y-5">
                {[
                  {
                    q: "What is Nuvare?",
                    a: "Nuvare is a proactive compliance and financial intelligence tool for internationally mobile professionals. It tracks your obligations across countries, visas, tax deadlines, permits, and foreign asset declarations.",
                  },
                  {
                    q: "Who is it for?",
                    a: "Executives on international assignments, entrepreneurs with multi-country structures, finance professionals, and wealthy individuals splitting time across borders.",
                  },
                  {
                    q: "Is this legal advice?",
                    a: "No. Nuvare provides structured intelligence to help you understand your situation and know when to engage a professional. All content is informational only.",
                  },
                  {
                    q: "What does it cost?",
                    a: "Core plan is $99/month. Professional plan is $199/month and includes Deep Research queries, Document Vault, and Country Intelligence Guides.",
                  },
                  {
                    q: "How does the AI work?",
                    a: "Nuvare combines Perplexity for live regulatory data with Claude for personalised reasoning over your specific multi-country situation.",
                  },
                ].map((item) => (
                  <div key={item.q}>
                    <p
                      className="font-mono text-xs font-medium uppercase tracking-widest"
                      style={{ color: "var(--brand-text)" }}
                    >
                      {item.q}
                    </p>
                    <p
                      className="mt-1 text-sm leading-relaxed"
                      style={{ color: "var(--brand-muted)" }}
                    >
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
