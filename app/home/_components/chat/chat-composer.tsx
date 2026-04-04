"use client";

import type { ChangeEvent, RefObject } from "react";
import Link from "next/link";

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
    <section className="w-full pt-2 pb-3">
      {/* Main input frame */}
      <div className="w-full bg-[#1e1f26] border border-white/10">
        {/* File chip row */}
        {selectedUploadFile ? (
          <div className="px-3 pt-2">
            <div className="inline-flex max-w-full items-center gap-2 bg-[#282a30] px-3 py-1 text-[10px] uppercase tracking-widest text-[#e2e2eb]">
              <span className="truncate">{selectedUploadFile.name}</span>
              <button
                type="button"
                onClick={onClearUpload}
                className="text-[#c4c7c8]/60 transition-colors hover:text-white"
                aria-label="Remove attached file"
              >
                ×
              </button>
            </div>
          </div>
        ) : null}

        {/* Textarea row */}
        <div className="px-3 pt-3 pb-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Inquire across jurisdictions..."
            className="w-full resize-none bg-transparent border-0 p-0 text-sm font-light text-[#e2e2eb] placeholder:text-[#c4c7c8]/40 placeholder:italic min-h-[44px] max-h-[120px] focus:outline-none focus:ring-0 shadow-none"
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
        </div>

        {/* Controls row: deep research toggle (left) + attach + send (right) */}
        <div className="flex items-center justify-between px-2 pb-2">
          {/* Deep Research toggle */}
          <button
            type="button"
            onClick={onDeepResearchToggle}
            onMouseEnter={onDeepResearchHoverEnter}
            onMouseLeave={onDeepResearchHoverLeave}
            disabled={isLoading}
            className={cn(
              "text-[10px] uppercase tracking-widest transition-colors px-3 py-1",
              subscriptionTier !== "professional"
                ? "cursor-not-allowed text-[#c4c7c8]/30 opacity-40"
                : isDeepResearch
                  ? "bg-white text-[#111319] font-bold"
                  : "text-[#c4c7c8]/60 hover:text-white",
              isLoading && subscriptionTier === "professional"
                ? "cursor-not-allowed opacity-60"
                : "",
            )}
            aria-pressed={isDeepResearch}
            aria-label="Toggle deep research mode"
            title="Deep research"
          >
            {subscriptionTier === "professional" &&
            isDeepResearch &&
            isDeepResearchHovered ? (
              <span>× Deep Research</span>
            ) : (
              <span>Deep Research</span>
            )}
          </button>

          {/* Right-side action buttons */}
          <div className="flex items-center gap-1">
            {/* Attach file button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-[#c4c7c8]/60 transition-colors hover:text-white"
              aria-label="Attach file"
            >
              {/* Paperclip SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            {/* Send / Stop button */}
            {isLoading ? (
              <button
                type="button"
                onClick={() => void onStop()}
                className="bg-[#282a30] text-[#e2e2eb] p-2 hover:bg-[#373940] transition-all"
                title="Stop"
                aria-label="Stop generation"
              >
                {/* Stop (square) icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <rect x="5" y="5" width="14" height="14" rx="1" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void onSubmit()}
                disabled={!input.trim()}
                className="bg-white text-[#111319] p-2 hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Send"
                aria-label="Send message"
              >
                {/* Arrow up icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Deep research upgrade message */}
      {showDeepResearchUpgradeMessage && subscriptionTier !== "professional" ? (
        <p className="mt-2 text-[10px] text-[#c4c7c8] uppercase tracking-widest">
          Deep Research is available on the Professional plan.{" "}
          <Link
            href="/pricing"
            className="text-white underline underline-offset-4 transition-colors hover:text-white/70"
          >
            Upgrade
          </Link>
        </p>
      ) : null}

      {/* Hint line */}
      <p className="mt-2 text-[10px] uppercase tracking-widest text-[#c4c7c8]/30">
        Enter to send &mdash; Shift+Enter for new line
      </p>

      {/* Disclaimer */}
      <p className="mt-1 w-full text-center text-[10px] uppercase tracking-widest text-[#c4c7c8]/20">
        Informational only &mdash; not legal or financial advice
      </p>

      {/* Error message */}
      {errorMessage ? (
        <p className="mt-2 text-[10px] uppercase tracking-widest text-[#ffb4ab]">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
