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
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-black text-[color:var(--marketing-text-strong)]">
      <div className="pointer-events-none absolute inset-0">
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

      <header className="relative z-20 px-6 pb-3 pt-6 md:px-10 md:pt-8">
        <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-3">
          <motion.div
            whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
            className="relative w-fit cursor-default select-none"
            onMouseMove={createSparkle}
          >
            <span className="font-light text-xl tracking-[0.25em] text-[color:var(--marketing-text-strong)]">
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

          <nav className="flex items-center justify-center gap-2">
            <Link
              href="/features"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-light text-[color:var(--marketing-text-base)] backdrop-blur-sm transition-all hover:bg-white/12 hover:text-[color:var(--marketing-text-strong)]"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-light text-[color:var(--marketing-text-base)] backdrop-blur-sm transition-all hover:bg-white/12 hover:text-[color:var(--marketing-text-strong)]"
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
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-light text-[color:var(--marketing-text-base)] backdrop-blur-sm transition-all hover:bg-white/12 hover:text-[color:var(--marketing-text-strong)]"
            >
              FAQ
            </button>
          </nav>

          <div className="flex justify-start md:justify-end">
            <svg width="0" height="0" className="absolute">
              <defs>
                <filter id="gooey">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                  <feColorMatrix
                    in="blur"
                    mode="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
                    result="gooey"
                  />
                  <feBlend in="SourceGraphic" in2="gooey" />
                </filter>
              </defs>
            </svg>
            <div className="relative" style={{ filter: "url(#gooey)" }}>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="relative z-20 rounded-full border border-white/20 bg-white px-5 py-2 text-xs font-medium text-black transition-transform duration-300 hover:scale-[1.03] motion-reduce:transform-none"
              >
                Login
              </button>
              <motion.span
                className="absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white/70"
                animate={
                  shouldReduceMotion
                    ? { x: 0, y: "-50%" }
                    : { x: [0, 8, 0], y: ["-50%", "-70%", "-50%"] }
                }
                transition={{
                  duration: shouldReduceMotion ? 0 : 2.2,
                  repeat: shouldReduceMotion ? 0 : Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.span
                className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white/70"
                animate={
                  shouldReduceMotion
                    ? { x: 0, y: "-50%" }
                    : { x: [0, -8, 0], y: ["-50%", "-30%", "-50%"] }
                }
                transition={{
                  duration: shouldReduceMotion ? 0 : 2,
                  repeat: shouldReduceMotion ? 0 : Infinity,
                  ease: "easeInOut",
                  delay: shouldReduceMotion ? 0 : 0.2,
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <section className="relative z-20 flex-1" id="features">
        <div className="absolute bottom-20 left-6 max-w-2xl md:bottom-24 md:left-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs font-light text-[color:var(--marketing-text-base)] backdrop-blur-sm">
            <span>🌐</span>
            <span>Private intelligence for the internationally mobile</span>
            <span className="h-px w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="mt-6 space-y-1">
            <h1 className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-5xl font-light leading-tight text-transparent md:text-7xl">
              The private
            </h1>
            <h1 className="text-5xl font-black leading-none text-[color:var(--marketing-text-strong)] drop-shadow-[0_0_14px_rgba(255,255,255,0.25)] md:text-7xl">
              intelligence
            </h1>
            <h1 className="text-5xl font-light italic leading-tight text-[color:var(--marketing-text-base)] md:text-7xl">
              layer.
            </h1>
          </div>

          <p className="mt-6 max-w-xl text-sm font-light leading-relaxed text-[color:var(--marketing-text-muted)] md:text-base">
            Nuvare watches your compliance and financial obligations across every
            country you live, work, and invest in, so nothing falls through the
            cracks.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              onClick={() => router.push("/onboarding")}
              className="rounded-full border border-white bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90"
            >
              Get Started
            </motion.button>
            <motion.button
              type="button"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              onClick={() => router.push("/pricing")}
              className="rounded-full border border-white/40 bg-transparent px-6 py-3 text-sm font-light text-[color:var(--marketing-text-base)] transition-colors hover:bg-white/10 hover:text-[color:var(--marketing-text-strong)]"
            >
              View Pricing
            </motion.button>
          </div>
        </div>
      </section>

      <div className="relative z-20 mt-auto px-6 pb-6 md:px-10">
        <Disclaimer />
      </div>

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
              className="relative w-full max-w-lg rounded-2xl border border-white/12 bg-[#0b0b0b] p-8"
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
                className="absolute right-4 top-4 rounded-full border border-white/15 px-2 py-1 text-xs text-[color:var(--marketing-text-base)] transition-colors hover:bg-white/10 hover:text-[color:var(--marketing-text-strong)]"
                aria-label="Close FAQ modal"
              >
                X
              </button>
              <h2
                id="marketing-faq-title"
                className="font-editorial text-3xl text-[color:var(--marketing-text-strong)]"
              >
                Frequently Asked Questions
              </h2>
              <div className="mt-6">
                <p className="text-sm font-medium text-[color:var(--marketing-text-strong)]">
                  What is Nuvare?
                </p>
                <p className="mb-4 mt-1 text-sm font-light text-[color:var(--marketing-text-muted)]">
                  Nuvare is a proactive compliance and financial intelligence tool for
                  internationally mobile professionals. It tracks your obligations
                  across countries, visas, tax deadlines, permits, foreign asset
                  declarations, and tells you exactly what to do and when.
                </p>

                <p className="text-sm font-medium text-[color:var(--marketing-text-strong)]">
                  Who is it for?
                </p>
                <p className="mb-4 mt-1 text-sm font-light text-[color:var(--marketing-text-muted)]">
                  Executives on international assignments, entrepreneurs with
                  multi-country structures, finance professionals, and wealthy
                  individuals splitting time across borders.
                </p>

                <p className="text-sm font-medium text-[color:var(--marketing-text-strong)]">
                  Is this legal advice?
                </p>
                <p className="mb-4 mt-1 text-sm font-light text-[color:var(--marketing-text-muted)]">
                  No. Nuvare provides structured intelligence to help you understand
                  your situation and know when to engage a professional. All content
                  is informational only.
                </p>

                <p className="text-sm font-medium text-[color:var(--marketing-text-strong)]">
                  What does it cost?
                </p>
                <p className="mb-4 mt-1 text-sm font-light text-[color:var(--marketing-text-muted)]">
                  Core plan is $99/month. Professional plan is $199/month and
                  includes Deep Research queries, Document Vault, and Country
                  Intelligence Guides. No free tier.
                </p>

                <p className="text-sm font-medium text-[color:var(--marketing-text-strong)]">
                  How does the AI work?
                </p>
                <p className="mb-4 mt-1 text-sm font-light text-[color:var(--marketing-text-muted)]">
                  Nuvare combines Perplexity for live regulatory data with MiniMax for
                  personalised reasoning over your specific multi-country situation.
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
