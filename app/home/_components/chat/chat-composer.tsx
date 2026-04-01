"use client";

import type { ChangeEvent, RefObject } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/app/home/_lib/types";

type ChatComposerProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  selectedUploadFile: File | null;
  onClearUpload: () => void;
  input: string;
  onInputChange: (value: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onStop: () => void;
  isLoading: boolean;
  subscriptionTier: SubscriptionTier;
  isDeepResearch: boolean;
  isDeepResearchHovered: boolean;
  onDeepResearchHoverEnter: () => void;
  onDeepResearchHoverLeave: () => void;
  onDeepResearchToggle: () => void;
  showDeepResearchUpgradeMessage: boolean;
  errorMessage: string;
};

export function ChatComposer({
  fileInputRef,
  textareaRef,
  selectedUploadFile,
  onClearUpload,
  input,
  onInputChange,
  onFileChange,
  onSubmit,
  onStop,
  isLoading,
  subscriptionTier,
  isDeepResearch,
  isDeepResearchHovered,
  onDeepResearchHoverEnter,
  onDeepResearchHoverLeave,
  onDeepResearchToggle,
  showDeepResearchUpgradeMessage,
  errorMessage,
}: ChatComposerProps) {
  return (
    <section className="px-2 py-3">
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center p-1 text-white/45 transition-opacity hover:text-white/85 hover:opacity-100"
          aria-label="Attach file"
        >
          <span className="inline-flex h-4 w-4 items-center justify-center text-sm leading-none">
            +
          </span>
        </button>
        <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#101010] px-3 py-2">
          {selectedUploadFile ? (
            <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs text-white/80">
              <span className="truncate">{selectedUploadFile.name}</span>
              <button
                type="button"
                onClick={onClearUpload}
                className="rounded px-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Remove attached file"
              >
                ×
              </button>
            </div>
          ) : null}
          <Textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Ask about tax, residency, filing obligations, or compliance deadlines..."
            className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent px-0 py-2 text-sm shadow-none focus-visible:ring-0"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void onSubmit();
              }
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={onFileChange}
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onDeepResearchToggle}
              onMouseEnter={onDeepResearchHoverEnter}
              onMouseLeave={onDeepResearchHoverLeave}
              disabled={isLoading}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                subscriptionTier !== "professional"
                  ? "cursor-not-allowed border-white/15 bg-white/[0.03] text-white/55 opacity-40"
                  : isDeepResearch
                    ? "border-white/35 bg-white/12 text-white"
                    : "border-white/15 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white/75",
                isLoading ? "cursor-not-allowed opacity-60" : "",
              )}
              aria-pressed={isDeepResearch}
              aria-label="Toggle deep research mode"
              title="Deep research"
            >
              {subscriptionTier === "professional" && isDeepResearch && isDeepResearchHovered ? (
                <span>× Deep Research</span>
              ) : (
                <>
                  <span aria-hidden>🔭</span>
                  <span>Deep Research</span>
                </>
              )}
            </button>
            {isLoading ? (
              <Button
                onClick={() => void onStop()}
                className="h-7 w-7 rounded-full p-1 text-sm"
                title="Stop"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center leading-none">
                  ■
                </span>
              </Button>
            ) : (
              <Button
                onClick={() => void onSubmit()}
                disabled={!input.trim()}
                className="h-7 w-7 rounded-full p-1 text-sm"
                title="Send"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center leading-none">
                  ↑
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
      {showDeepResearchUpgradeMessage && subscriptionTier !== "professional" ? (
        <p className="mt-3 text-xs text-white/60">
          Deep Research is available on the Professional plan.{" "}
          <Link
            href="/pricing"
            className="text-white underline underline-offset-4 transition-colors hover:text-white/80"
          >
            Upgrade →
          </Link>
        </p>
      ) : null}
      <p className="mt-2 text-xs text-white/40">Press Enter to send, Shift+Enter for new line.</p>
      <p className="mt-1 w-full text-center text-xs text-white/30">
        This is informational only, not legal or financial advice.
      </p>
      {errorMessage ? <p className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}
    </section>
  );
}
