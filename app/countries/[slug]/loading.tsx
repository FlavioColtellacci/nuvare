"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Disclaimer from "@/components/Disclaimer";

const LOADING_PHRASES = [
  "Searching regulatory databases...",
  "Analysing tax residency rules...",
  "Compiling visa and immigration data...",
  "Reviewing banking regulations...",
  "Finalising country intelligence...",
];

export default function CountryGuideLoading() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isPhraseVisible, setIsPhraseVisible] = useState(true);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setIsPhraseVisible(false);
      window.setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
        setIsPhraseVisible(true);
      }, 250);
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="onboarding-bg relative flex min-h-screen flex-col overflow-hidden bg-black px-6 py-10 text-white md:px-10">
      <div className="onboarding-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <div className="flex-1">
          <Link
            href="/countries"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/70"
          >
            ← Back
          </Link>

          <div className="mt-4 h-11 w-[300px] max-w-full animate-pulse rounded-lg bg-white/10" />

          <div className="mt-8 flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-white/35">
              <span className="dot-sequence inline-block h-1.5 w-1.5 rounded-full bg-current [animation-delay:0ms]" />
              <span className="dot-sequence inline-block h-1.5 w-1.5 rounded-full bg-current [animation-delay:180ms]" />
              <span className="dot-sequence inline-block h-1.5 w-1.5 rounded-full bg-current [animation-delay:360ms]" />
            </div>
            <p
              className={`font-editorial text-2xl text-white/30 transition-opacity duration-300 ${
                isPhraseVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {LOADING_PHRASES[phraseIndex]}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="h-24 w-full animate-pulse rounded-2xl bg-white/10" />
            <div className="h-20 w-10/12 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-16 w-8/12 animate-pulse rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
      <div className="relative mx-auto mt-10 w-full max-w-4xl">
        <Disclaimer />
      </div>
      <style jsx>{`
        .dot-sequence {
          animation: dot-sequence 1s ease-in-out infinite;
        }

        @keyframes dot-sequence {
          0%,
          100% {
            opacity: 0.25;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-1px);
          }
        }
      `}</style>
    </main>
  );
}
