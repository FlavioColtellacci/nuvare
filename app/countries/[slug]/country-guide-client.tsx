"use client";

import { useEffect, useState, type ComponentPropsWithoutRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import Disclaimer from "@/components/Disclaimer";

type CountryGuideClientProps = {
  slug: string;
  countryName: string;
  countryFlag: string;
};

type GuidePayload = {
  content: string;
  updatedAt: string;
};

export default function CountryGuideClient({
  slug,
  countryName,
  countryFlag,
}: CountryGuideClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [guide, setGuide] = useState<GuidePayload | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadGuide() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(`/api/countries/${encodeURIComponent(slug)}/guide`);
        const payload = (await response.json().catch(() => null)) as
          | { content?: string; updatedAt?: string; error?: string }
          | null;

        if (!response.ok || !payload?.content || !payload.updatedAt) {
          throw new Error(payload?.error ?? "Unable to load country guide.");
        }

        if (!isCancelled) {
          setGuide({
            content: payload.content,
            updatedAt: payload.updatedAt,
          });
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load country guide.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadGuide();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  return (
    <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black px-6 py-10 text-white md:px-10">
      <div className="onboarding-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto w-full max-w-4xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/70"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <h1 className="mt-2 font-editorial text-3xl text-white">
          {countryFlag} {countryName}
        </h1>
        <p className="mt-3 text-sm text-white/55">Live intelligence updated every 24 hours</p>
        {guide ? (
          <p className="mt-2 text-xs text-white/45">
            Last updated:{" "}
            {new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(guide.updatedAt))}
          </p>
        ) : null}

        {isLoading ? (
          <div className="mt-8 animate-pulse space-y-4 rounded-2xl border border-white/12 bg-[#0b0b0b]/80 p-6">
            <div className="h-5 w-1/3 rounded bg-white/10" />
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-11/12 rounded bg-white/10" />
            <div className="h-3 w-10/12 rounded bg-white/10" />
            <div className="my-2 h-px w-full bg-white/10" />
            <div className="h-5 w-2/5 rounded bg-white/10" />
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-9/12 rounded bg-white/10" />
          </div>
        ) : null}

        {!isLoading && errorMessage ? (
          <p className="mt-8 rounded-xl border border-red-200/20 bg-red-500/10 p-4 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}

        {!isLoading && guide ? (
          <article className="mt-8 rounded-2xl border border-white/12 bg-[#0b0b0b]/80 p-6 md:p-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }: ComponentPropsWithoutRef<"h1">) => (
                  <h1 className="mb-4 border-b border-white/12 pb-2 text-xl font-semibold text-white">
                    {children}
                  </h1>
                ),
                h2: ({ children }: ComponentPropsWithoutRef<"h2">) => (
                  <h2 className="mb-3 mt-6 border-b border-white/12 pb-2 text-lg font-semibold text-white first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }: ComponentPropsWithoutRef<"h3">) => (
                  <h3 className="mb-2 mt-4 text-base font-semibold text-white">{children}</h3>
                ),
                p: ({ children }: ComponentPropsWithoutRef<"p">) => (
                  <p className="mb-3 text-sm leading-6 text-white/80 last:mb-0">{children}</p>
                ),
                ul: ({ children }: ComponentPropsWithoutRef<"ul">) => (
                  <ul className="mb-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-white/80">
                    {children}
                  </ul>
                ),
                ol: ({ children }: ComponentPropsWithoutRef<"ol">) => (
                  <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-white/80">
                    {children}
                  </ol>
                ),
                li: ({ children }: ComponentPropsWithoutRef<"li">) => <li>{children}</li>,
                strong: ({ children }: ComponentPropsWithoutRef<"strong">) => (
                  <strong className="font-semibold text-white">{children}</strong>
                ),
                hr: () => <hr className="my-5 border-white/15" />,
              }}
            >
              {guide.content}
            </ReactMarkdown>
          </article>
        ) : null}
      </div>
      <div className="relative mx-auto mt-10 w-full max-w-4xl">
        <Disclaimer />
      </div>
    </main>
  );
}
