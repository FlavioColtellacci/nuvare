import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { COUNTRIES } from "@/app/countries/countries-data";
import { buildLiteGuideMarkdown } from "@/app/country-guides/lite-guide-copy";
import Disclaimer from "@/components/Disclaimer";

function getCountryFromSlug(slug: string) {
  return COUNTRIES.find((country) => country.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const country = getCountryFromSlug(slug);

  if (!country) {
    return {
      title: "Country Guide Lite | Nuvare",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${country.name} Country Guide Lite | Nuvare`,
    description: `Public planning starter for ${country.name}. For educational use only.`,
    alternates: {
      canonical: `/country-guides/${country.slug}`,
    },
  };
}

export default async function CountryGuideLiteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const country = getCountryFromSlug(slug);

  if (!country) {
    notFound();
  }

  const content = buildLiteGuideMarkdown(country.name);

  return (
    <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black px-4 pb-10 pt-16 text-white sm:px-6 md:px-10">
      <div className="onboarding-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-editorial text-4xl text-white sm:text-5xl">
            {country.flag} {country.name}
          </h1>
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">
            Public Lite
          </span>
        </div>
        <p className="mt-3 text-sm text-white/55">
          Educational starter briefing. Premium intelligence remains available on authenticated
          surfaces.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            href="/onboarding"
            className="rounded-md border border-white/20 px-4 py-2 text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            Create account
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-white/20 px-4 py-2 text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            View premium plans
          </Link>
        </div>

        <article className="relative mt-6 rounded-2xl border border-white/12 bg-[#0b0b0b]/80 p-6 md:p-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => (
                <h2 className="mb-3 mt-6 text-lg font-semibold text-white first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 mt-4 text-base font-semibold text-white">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-3 text-sm leading-6 text-white/70 last:mb-0">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-white/70">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-white/70">
                  {children}
                </ol>
              ),
              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
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
}
