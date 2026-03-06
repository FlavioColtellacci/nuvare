"use client";

import { type ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function CountryGuideContent({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  async function handleCopyContent() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Keep silent to match lightweight icon-only behavior.
    }
  }

  return (
    <article className="relative mt-6 rounded-2xl border border-white/12 bg-[#0b0b0b]/80 p-6 md:p-8">
      <button
        type="button"
        onClick={() => void handleCopyContent()}
        className="absolute right-4 top-4 inline-flex items-center p-0 text-sm text-white/55 transition-opacity hover:text-white hover:opacity-100"
        aria-label="Copy country intelligence"
        title={copied ? "Copied!" : "Copy"}
      >
        {copied ? "✓" : "⧉"}
      </button>

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }: ComponentPropsWithoutRef<"h1">) => (
            <h1 className="mb-4 text-xl font-semibold text-white">{children}</h1>
          ),
          h2: ({ children }: ComponentPropsWithoutRef<"h2">) => (
            <h2 className="mb-3 mt-6 text-lg font-semibold text-white first:mt-0">{children}</h2>
          ),
          h3: ({ children }: ComponentPropsWithoutRef<"h3">) => (
            <h3 className="mb-2 mt-4 text-base font-semibold text-white">{children}</h3>
          ),
          p: ({ children }: ComponentPropsWithoutRef<"p">) => (
            <p className="mb-3 text-sm leading-6 text-white/70 last:mb-0">{children}</p>
          ),
          ul: ({ children }: ComponentPropsWithoutRef<"ul">) => (
            <ul className="mb-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-white/70">
              {children}
            </ul>
          ),
          ol: ({ children }: ComponentPropsWithoutRef<"ol">) => (
            <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-white/70">
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
        {content}
      </ReactMarkdown>
    </article>
  );
}
