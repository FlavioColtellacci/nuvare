"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  MessageSquare,
  FolderLock,
  Globe,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import BackButton from "@/components/BackButton";
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
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <MeshGradient
          className="absolute inset-0 h-full w-full"
          colors={["#000000", "#0a0a14", "#111827", "#0d0d0d", "#05050f"]}
          speed={0.2}
        />
        <MeshGradient
          className="absolute inset-0 h-full w-full opacity-15"
          colors={["#000000", "#0d0d1a", "#ffffff", "#0a0a0a"]}
          speed={0.15}
        />
      </div>

      <div className="absolute left-6 top-6 z-30">
        <BackButton />
      </div>

      <header className="relative z-20 px-6 pb-3 pt-6 md:px-10 md:pt-8">
        <div className="flex items-center justify-center">
          <span className="font-light tracking-[0.3em] text-lg text-white">NUVARE</span>
        </div>
      </header>

      <section className="relative z-20 flex-1 px-6 pb-20 pt-10 md:px-10">
        <div className="max-w-6xl">
          <div className="space-y-1">
            <h1 className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-5xl font-light leading-tight text-transparent md:text-7xl">
              Everything
            </h1>
            <h1 className="text-5xl font-black leading-none text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.25)] md:text-7xl">
              you
            </h1>
            <h1 className="text-5xl font-light italic leading-tight text-white/80 md:text-7xl">
              need.
            </h1>
          </div>

          <div className="mt-8 grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.Icon;
              return (
                <motion.div
                  key={feature.title}
                  className="rounded-2xl border border-white/12 bg-[#0b0b0b]/80 p-6"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.1, ease: "easeOut" }}
                >
                  <Icon className="mb-3 text-white/60" size={18} />
                  <h2 className="mb-2 text-sm font-medium text-white">{feature.title}</h2>
                  <p className="text-xs font-light leading-relaxed text-white/55">
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
