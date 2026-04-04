"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  MessageSquare,
  FolderLock,
  Globe,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";

type Feature = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

const features: Feature[] = [
  {
    title: "Deadline Dashboard",
    description:
      "Every visa, tax, permit, and foreign asset obligation in one personalised calendar. Colour-coded by urgency with alerts at 90, 30, and 7 days.",
    Icon: CalendarClock,
  },
  {
    title: "Ask Anything",
    description:
      "Plain-language answers to complex cross-border questions, powered by Anthropic's AI and live Perplexity data. The 80% answer that tells you when you need a professional.",
    Icon: MessageSquare,
  },
  {
    title: "Document Vault",
    description:
      "Secure storage for passports, visas, tax certificates, and permits. AI extracts key dates automatically and adds them to your dashboard.",
    Icon: FolderLock,
  },
  {
    title: "Country Intelligence",
    description:
      "Deep financial and compliance intelligence for every country you live, work, or invest in. Visa rules, tax triggers, banking, and real estate, always current.",
    Icon: Globe,
  },
  {
    title: "My Situation",
    description:
      "One profile that captures your full cross-border picture. Nationalities, residencies, assets, and planned moves, all in one place.",
    Icon: UserCircle,
  },
];

export default function FeaturesPage() {
  return (
    <main
      className="relative flex min-h-screen flex-col overflow-x-hidden"
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
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: "var(--brand-text)" }}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="font-mono text-xs uppercase tracking-widest transition-colors hover:text-white"
              style={{ color: "var(--brand-muted)" }}
            >
              Pricing
            </Link>
          </nav>

          <Link
            href="/onboarding"
            className="font-mono text-xs font-medium uppercase tracking-widest transition-colors hover:bg-gray-100"
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

      {/* ── Content ──────────────────────────────────────────────────── */}
      <section className="relative z-20 flex-1 px-6 pb-20 pt-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          {/* Eyebrow */}
          <p
            className="mb-6 font-mono text-xs uppercase tracking-widest"
            style={{ color: "var(--brand-muted)" }}
          >
            Simply Pricing
          </p>

          {/* Heading */}
          <div className="mb-14">
            <h1
              className="font-mono text-5xl font-medium uppercase leading-none md:text-7xl"
              style={{ color: "var(--brand-text)" }}
            >
              Everything
            </h1>
            <h1
              className="font-mono text-5xl font-medium uppercase leading-none md:text-7xl"
              style={{ color: "var(--brand-text)" }}
            >
              You Need.
            </h1>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.Icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
                  className="transition-colors"
                  style={{
                    backgroundColor: "var(--brand-panel)",
                    border: "1px solid var(--brand-border)",
                    borderRadius: "12px",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
                    padding: "28px",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#3A3A42";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--brand-border)";
                  }}
                >
                  <Icon
                    className="mb-4"
                    size={18}
                    style={{ color: "var(--brand-muted)" }}
                  />
                  <h2
                    className="mb-3 font-mono text-xs font-medium uppercase tracking-widest"
                    style={{ color: "var(--brand-text)" }}
                  >
                    {feature.title}
                  </h2>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--brand-muted)" }}
                  >
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="relative z-20 mt-auto px-6 pb-6 md:px-10">
        <Disclaimer />
      </div>
    </main>
  );
}
