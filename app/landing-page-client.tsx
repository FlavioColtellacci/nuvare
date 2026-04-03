"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Disclaimer from "@/components/Disclaimer";

type Sparkle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
};

export default function LandingPageClient() {
  const router = useRouter();
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const shouldReduceMotion = useReducedMotion();
  const sparkleId = useRef(0);
  const lastSparkleAt = useRef(0);
  const faqCloseButtonRef = useRef<HTMLButtonElement>(null);
  const faqModalRef = useRef<HTMLDivElement>(null);
  const faqTriggerRef = useRef<HTMLButtonElement>(null);

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

    faqCloseButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsFaqOpen(false);
        return;
      }

      if (event.key !== "Tab" || !faqModalRef.current) return;

      const focusableElements = faqModalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      faqTriggerRef.current?.focus();
    };
  }, [isFaqOpen]);

  const createSparkle = (event: MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;

    const now = Date.now();
    if (now - lastSparkleAt.current < 70) return;
    lastSparkleAt.current = now;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = sparkleId.current++;
    const nextSparkle: Sparkle = {
      id,
      x,
      y,
      size: 3 + Math.random() * 4,
      duration: 0.45 + Math.random() * 0.45,
    };

    setSparkles((prev) => [...prev.slice(-24), nextSparkle]);
    window.setTimeout(() => {
      setSparkles((prev) => prev.filter((sparkle) => sparkle.id !== id));
    }, 900);
  };

  return (
    <main className="relative flex flex-col bg-[#111319] text-[#e2e2eb]">
      {/* ── Background gradient (hero only) ── */}
      <div className="pointer-events-none absolute inset-0 h-screen">
        <MeshGradient
          className="absolute inset-0 h-full w-full"
          colors={["#000000", "#0a0a14", "#111827", "#0d0d0d", "#05050f"]}
          speed={shouldReduceMotion ? 0 : 0.2}
        />
        <MeshGradient
          className="absolute inset-0 h-full w-full opacity-15"
          colors={["#000000", "#0d0d1a", "#ffffff", "#0a0a0a"]}
          speed={shouldReduceMotion ? 0 : 0.15}
        />
      </div>

      {/* ═══════════════════════════════════════════
          NAVBAR
      ═══════════════════════════════════════════ */}
      <header className="fixed top-0 z-50 w-full bg-[#111319]/70 backdrop-blur-xl">
        <div className="flex items-center justify-between px-12 py-6">
          {/* Wordmark with sparkle effect */}
          <motion.div
            whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
            className="relative w-fit cursor-default select-none"
            onMouseMove={createSparkle}
          >
            <span className="text-xl font-black tracking-widest uppercase text-white">
              NUVARE
            </span>
            <AnimatePresence>
              {sparkles.map((sparkle) => (
                <motion.span
                  key={sparkle.id}
                  className="pointer-events-none absolute rounded-full bg-white/40"
                  style={{
                    left: sparkle.x,
                    top: sparkle.y,
                    width: sparkle.size,
                    height: sparkle.size,
                  }}
                  initial={{ opacity: 0, scale: 0.3, x: "-50%", y: "-50%" }}
                  animate={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: [0, 1, 0], scale: [0.4, 1, 0.2], y: "-150%" }
                  }
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : sparkle.duration,
                    ease: "easeOut",
                  }}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Nav links */}
          <nav className="hidden items-center gap-12 md:flex">
            <Link
              href="/intelligence-methodology"
              className="text-xs font-light uppercase tracking-[0.2em] text-[#e2e2eb]/60 transition-colors hover:text-white"
            >
              How it Works
            </Link>
            <Link
              href="/features"
              className="text-xs font-light uppercase tracking-[0.2em] text-[#e2e2eb]/60 transition-colors hover:text-white"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-xs font-light uppercase tracking-[0.2em] text-[#e2e2eb]/60 transition-colors hover:text-white"
            >
              Pricing
            </Link>
            <button
              ref={faqTriggerRef}
              type="button"
              onClick={() => setIsFaqOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isFaqOpen}
              aria-controls="marketing-faq-dialog"
              className="text-xs font-light uppercase tracking-[0.2em] text-[#e2e2eb]/60 transition-colors hover:text-white"
            >
              FAQ
            </button>
          </nav>

          {/* Login button — sharp rectangular */}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-black transition-all hover:opacity-90"
          >
            Login
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
      <section
        id="features"
        className="relative flex min-h-screen flex-col items-center justify-center px-12 pb-24 pt-32 text-center"
      >
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-6xl font-extrabold tracking-tight text-white md:text-7xl">
              Cross-Border
            </h1>
            <h1 className="text-6xl font-extrabold tracking-tight text-white/40 md:text-7xl">
              Compliance,
            </h1>
            <h1 className="text-6xl font-extrabold tracking-tight text-white md:text-7xl">
              Simplified.
            </h1>
          </div>

          {/* Subtitle */}
          <p className="mt-10 max-w-lg text-xl leading-relaxed text-[#e2e2eb]/60">
            The intelligence platform for the internationally mobile. Precision
            audit trails and cross-jurisdictional clarity in one sovereign
            environment.
          </p>

          {/* CTA buttons */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            <motion.button
              type="button"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              onClick={() => router.push("/onboarding")}
              className="bg-white px-8 py-4 text-xs font-bold uppercase tracking-widest text-black hover:opacity-90 transition-all"
            >
              Get Started
            </motion.button>
            <motion.button
              type="button"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              onClick={() => router.push("/pricing")}
              className="border border-white/10 px-8 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/5 transition-all"
            >
              View Pricing
            </motion.button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION A — CORE INTELLIGENCE BENTO GRID
      ═══════════════════════════════════════════ */}
      <section id="core-intelligence" className="bg-[#0c0e14] px-12 py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-24">
            <h2 className="mb-4 text-4xl font-black uppercase tracking-tight text-white">
              Core Intelligence
            </h2>
            <div className="h-px w-24 bg-white" />
          </div>

          <div className="grid h-auto grid-cols-1 gap-8 md:grid-cols-12 md:h-[600px]">
            {/* Card 1 — Deadline Dashboard */}
            <Link
              href="/home"
              className="group flex cursor-pointer flex-col justify-between bg-[#1e1f26] p-12 transition-all hover:bg-[#282a30] md:col-span-8"
            >
              <div>
                <span className="mb-8 block text-4xl text-[#e2e2eb]/40">⏱</span>
                <h3 className="mb-4 text-3xl font-bold text-white">
                  Deadline Dashboard
                </h3>
                <p className="max-w-md text-[#e2e2eb]/40">
                  Real-time tracking of tax filings, residency renewals, and
                  regulatory submissions across 180+ jurisdictions.
                </p>
              </div>
              <div className="flex items-center gap-4 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-xs font-bold uppercase tracking-widest text-white">
                  Explore Interface
                </span>
                <span className="text-white">→</span>
              </div>
            </Link>

            {/* Card 2 — Ask Anything */}
            <Link
              href="/home"
              className="flex cursor-pointer flex-col justify-between bg-white p-12 text-[#111319] md:col-span-4"
            >
              <span className="text-4xl">✦</span>
              <div>
                <h3 className="mb-4 text-2xl font-black uppercase leading-tight">
                  Ask Anything
                </h3>
                <p className="text-sm text-[#111319]/60">
                  LLM-powered compliance engine for instant clarity.
                </p>
              </div>
            </Link>

            {/* Card 3 — Document Vault */}
            <Link
              href="/vault"
              className="flex cursor-pointer flex-col justify-between bg-[#282a30] p-12 transition-all hover:bg-[#373940] md:col-span-4"
            >
              <span className="text-4xl text-[#e2e2eb]/40">⬡</span>
              <div>
                <h3 className="mb-2 text-xl font-bold text-white">
                  Document Vault
                </h3>
                <p className="text-sm text-[#e2e2eb]/40">
                  Zero-knowledge encryption for your most sensitive legal and
                  financial records.
                </p>
              </div>
            </Link>

            {/* Card 4 — Security */}
            <div className="relative flex cursor-pointer flex-col justify-end overflow-hidden bg-[#191b22] p-12 md:col-span-8">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#111319] via-transparent to-transparent" />
              <div className="relative">
                <p className="mb-2 text-xs uppercase tracking-[0.4em] text-white/30">
                  The Security Standard
                </p>
                <h3 className="text-3xl font-bold text-white">
                  Military-Grade Infrastructure
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION B — THE 80% ANSWER
      ═══════════════════════════════════════════ */}
      <section id="methodology" className="bg-[#111319] px-12 py-48">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-8 text-xs font-black uppercase tracking-[0.5em] text-white/20">
            Methodology
          </p>
          <h2 className="mb-12 text-5xl font-extrabold tracking-tight text-white">
            The 80% Answer
          </h2>
          <div className="mx-auto max-w-2xl space-y-8 border-l-2 border-white/5 pl-12 text-left text-xl leading-relaxed text-[#e2e2eb]/60">
            <p>
              Compliance isn&apos;t about guessing; it&apos;s about eliminating the noise.
              Nuvare provides the{" "}
              <strong className="font-bold text-white">
                80% foundational truth
              </strong>{" "}
              of any cross-border query instantly.
            </p>
            <p>
              We reduce billable hours of traditional counsel by automating
              discovery and synthesis of global regulations.
            </p>
            <Link
              href="/intelligence-methodology"
              className="inline-block border-b border-white/20 pb-2 text-sm font-bold uppercase tracking-widest text-white transition-all hover:border-white"
            >
              Read Methodology Notes
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION C — PRICING
      ═══════════════════════════════════════════ */}
      <section id="pricing" className="bg-[#191b22] px-12 py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-24 text-center">
            <h2 className="mb-4 text-4xl font-black uppercase text-white">
              Membership Tiers
            </h2>
            <p className="text-xs uppercase tracking-widest text-[#e2e2eb]/40">
              Architected for the Sovereign Individual
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px bg-white/5 md:grid-cols-2">
            {/* Core Tier */}
            <div className="flex flex-col justify-between bg-[#111319] p-16">
              <div>
                <p className="mb-12 text-xs uppercase tracking-[0.3em] text-white/40">
                  Tier 01
                </p>
                <h3 className="mb-4 text-4xl font-bold text-white">Core</h3>
                <p className="mb-12 text-5xl font-black text-white">
                  $99{" "}
                  <span className="text-sm font-normal uppercase tracking-widest text-white/20">
                    / Month
                  </span>
                </p>
                <ul className="mb-16 space-y-6">
                  <li className="flex items-center gap-4 text-sm tracking-wide text-[#e2e2eb]/70">
                    <span className="text-white">✓</span>
                    <span>Standard Compliance Ledger</span>
                  </li>
                  <li className="flex items-center gap-4 text-sm tracking-wide text-[#e2e2eb]/70">
                    <span className="text-white">✓</span>
                    <span>Residency Tracker (2 Nations)</span>
                  </li>
                  <li className="flex items-center gap-4 text-sm tracking-wide text-[#e2e2eb]/70">
                    <span className="text-white">✓</span>
                    <span>Encrypted Document Vault (10GB)</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => router.push("/pricing")}
                className="w-full border border-white/10 py-5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-white hover:text-[#111319]"
              >
                Subscribe
              </button>
            </div>

            {/* Professional Tier */}
            <div className="relative flex flex-col justify-between overflow-hidden bg-[#1e1f26] p-16">
              <div className="absolute right-0 top-0 bg-white px-8 py-2 text-[10px] font-black uppercase tracking-widest text-[#111319]">
                Recommended
              </div>
              <div>
                <p className="mb-12 text-xs uppercase tracking-[0.3em] text-white/40">
                  Tier 02
                </p>
                <h3 className="mb-4 text-4xl font-bold text-white">
                  Professional
                </h3>
                <p className="mb-12 text-5xl font-black text-white">
                  $199{" "}
                  <span className="text-sm font-normal uppercase tracking-widest text-white/20">
                    / Month
                  </span>
                </p>
                <ul className="mb-16 space-y-6">
                  <li className="flex items-center gap-4 text-sm tracking-wide text-white">
                    <span className="text-white">✓</span>
                    <span>Unlimited Intelligence Ledger</span>
                  </li>
                  <li className="flex items-center gap-4 text-sm tracking-wide text-white">
                    <span className="text-white">✓</span>
                    <span>Multi-Jurisdictional Residency Audit</span>
                  </li>
                  <li className="flex items-center gap-4 text-sm tracking-wide text-white">
                    <span className="text-white">✓</span>
                    <span>Priority LLM &apos;Ask Anything&apos; Access</span>
                  </li>
                  <li className="flex items-center gap-4 text-sm tracking-wide text-white">
                    <span className="text-white">✓</span>
                    <span>Concierge Document Retrieval</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => router.push("/pricing")}
                className="w-full bg-white py-5 text-xs font-bold uppercase tracking-widest text-[#111319] transition-all hover:opacity-90"
              >
                Select Professional
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          DISCLAIMER
      ═══════════════════════════════════════════ */}
      <div className="relative z-20 bg-[#111319] px-8 py-6">
        <Disclaimer />
      </div>

      {/* ═══════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════ */}
      <footer className="flex flex-col items-center gap-4 border-t border-white/5 bg-[#0c0e14] px-8 py-12">
        <div className="mb-4 flex flex-wrap justify-center gap-12">
          <Link
            href="/legal"
            className="text-xs uppercase tracking-widest text-[#e2e2eb]/50 transition-colors hover:text-white"
          >
            Legal
          </Link>
          <Link
            href="/compliance"
            className="text-xs uppercase tracking-widest text-[#e2e2eb]/50 transition-colors hover:text-white"
          >
            Compliance
          </Link>
          <Link
            href="/privacy"
            className="text-xs uppercase tracking-widest text-[#e2e2eb]/50 transition-colors hover:text-white"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-xs uppercase tracking-widest text-[#e2e2eb]/50 transition-colors hover:text-white"
          >
            Terms of Service
          </Link>
        </div>
        <p className="max-w-2xl text-center text-xs uppercase leading-loose tracking-widest text-[#e2e2eb]/50">
          © 2024 Nuvare. All rights reserved. Precision is the ultimate luxury.
        </p>
      </footer>

      {/* ═══════════════════════════════════════════
          FAQ MODAL
      ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {isFaqOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            onClick={() => setIsFaqOpen(false)}
          >
            <motion.div
              id="marketing-faq-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="marketing-faq-title"
              ref={faqModalRef}
              className="relative w-full max-w-lg border border-white/10 bg-[#0b0b0b] p-8"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.22,
                ease: "easeOut",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                ref={faqCloseButtonRef}
                type="button"
                onClick={() => setIsFaqOpen(false)}
                className="absolute right-4 top-4 border border-white/15 px-2 py-1 text-xs text-[#e2e2eb]/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close FAQ modal"
              >
                ✕
              </button>
              <h2
                id="marketing-faq-title"
                className="text-3xl font-bold text-white"
              >
                Frequently Asked Questions
              </h2>
              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    What is Nuvare?
                  </p>
                  <p className="mt-1 text-sm font-light text-[#e2e2eb]/60">
                    Nuvare is a proactive compliance and financial intelligence
                    tool for internationally mobile professionals. It tracks your
                    obligations across countries, visas, tax deadlines, permits,
                    foreign asset declarations, and tells you exactly what to do
                    and when.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Who is it for?
                  </p>
                  <p className="mt-1 text-sm font-light text-[#e2e2eb]/60">
                    Executives on international assignments, entrepreneurs with
                    multi-country structures, finance professionals, and wealthy
                    individuals splitting time across borders.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Is this legal advice?
                  </p>
                  <p className="mt-1 text-sm font-light text-[#e2e2eb]/60">
                    No. Nuvare provides structured intelligence to help you
                    understand your situation and know when to engage a
                    professional. All content is informational only.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    What does it cost?
                  </p>
                  <p className="mt-1 text-sm font-light text-[#e2e2eb]/60">
                    Core plan is $99/month. Professional plan is $199/month and
                    includes Deep Research queries, Document Vault, and Country
                    Intelligence Guides. No free tier.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    How does the AI work?
                  </p>
                  <p className="mt-1 text-sm font-light text-[#e2e2eb]/60">
                    Nuvare combines Perplexity for live regulatory data with
                    MiniMax for personalised reasoning over your specific
                    multi-country situation.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
