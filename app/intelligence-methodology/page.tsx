import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How Nuvare Intelligence Works",
  description:
    "Learn how Nuvare combines live regulatory research and AI synthesis, where automation ends, and when professional review is required.",
  alternates: {
    canonical: "/intelligence-methodology",
  },
  openGraph: {
    title: "How Nuvare Intelligence Works",
    description:
      "Understand Nuvare's data sources, AI boundaries, and professional-use guidance.",
    url: "https://www.nuvare.app/intelligence-methodology",
    siteName: "Nuvare",
    type: "article",
  },
};

export default function IntelligenceMethodologyPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-[color:var(--marketing-text-base)] md:px-10">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-white/50">
          Trust and Methodology
        </p>
        <h1 className="mt-4 text-4xl font-light leading-tight text-[color:var(--marketing-text-strong)] md:text-5xl">
          How Nuvare intelligence works
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-[color:var(--marketing-text-muted)] md:text-base">
          Nuvare is built for internationally mobile professionals who need clear,
          structured guidance on cross-border obligations. This page explains what
          our system does, what it does not do, and where human professional
          judgment is still essential.
        </p>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-xl font-medium text-[color:var(--marketing-text-strong)]">
            Data sourcing and research
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--marketing-text-muted)]">
            Nuvare uses a regulatory research pipeline that can pull current policy
            context from external sources, including jurisdiction-focused research
            calls when needed. Query text sent for external research is minimized
            and sanitized to reduce personal information exposure.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-xl font-medium text-[color:var(--marketing-text-strong)]">
            AI reasoning boundaries
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--marketing-text-muted)]">
            Nuvare combines model-based reasoning with tool-driven context. The
            assistant can synthesize obligations and next steps, but outputs may be
            incomplete for novel or rapidly changing rules. Results should be
            treated as structured intelligence, not a substitute for legal, tax, or
            financial advice.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-xl font-medium text-[color:var(--marketing-text-strong)]">
            Professional-use guidance
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--marketing-text-muted)]">
            Use Nuvare to prepare, prioritize deadlines, and organize questions for
            your professional advisors. Before acting on high-impact decisions,
            confirm jurisdiction-specific interpretations with licensed experts.
          </p>
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/onboarding"
            className="rounded-full border border-white bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90"
          >
            Start onboarding
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/30 px-6 py-3 text-sm text-[color:var(--marketing-text-base)] transition-colors hover:bg-white/10 hover:text-[color:var(--marketing-text-strong)]"
          >
            Back to landing
          </Link>
        </div>
      </article>
    </main>
  );
}
