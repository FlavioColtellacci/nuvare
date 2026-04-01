"use client";

import type { RefObject } from "react";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DEFAULT_THINKING_PHRASES,
  DEEP_RESEARCH_LOADING_MESSAGE,
  EMPTY_STATE_PROMPTS,
} from "@/app/home/_lib/constants";
import { stripTrailingDots } from "@/app/home/_lib/format";
import { extractSourceItems, splitAssistantContent } from "@/app/home/_lib/sources";
import { formatToolStepLabel } from "@/app/home/_lib/tool-labels";
import type { ChatMessage } from "@/app/home/_lib/types";

import { AssistantMarkdown } from "./assistant-markdown";

type ChatFeedProps = {
  feedRef: RefObject<HTMLDivElement | null>;
  onFeedScroll: () => void;
  isLoadingConversationMessages: boolean;
  messages: ChatMessage[];
  onEmptyPromptClick: (prompt: string) => void;
  expandedSourcesByMessageId: Record<string, boolean>;
  editingUserMessageId: string | null;
  editingUserMessageDraft: string;
  onEditingDraftChange: (value: string) => void;
  copiedSourceKey: string | null;
  copiedUserMessageId: string | null;
  onToggleSources: (messageId: string) => void;
  onCopySource: (text: string, key: string) => void;
  onCopyUserMessage: (messageId: string, content: string) => void;
  onStartInlineEdit: (messageId: string, content: string) => void;
  onCancelInlineEdit: () => void;
  onSaveInlineEdit: (messageId: string) => void;
  isLoading: boolean;
  isDeepResearch: boolean;
  isThinkingPhraseVisible: boolean;
  thinkingPhrases: string[];
  thinkingPhraseIndex: number;
};

export function ChatFeed({
  feedRef,
  onFeedScroll,
  isLoadingConversationMessages,
  messages,
  onEmptyPromptClick,
  expandedSourcesByMessageId,
  editingUserMessageId,
  editingUserMessageDraft,
  onEditingDraftChange,
  copiedSourceKey,
  copiedUserMessageId,
  onToggleSources,
  onCopySource,
  onCopyUserMessage,
  onStartInlineEdit,
  onCancelInlineEdit,
  onSaveInlineEdit,
  isLoading,
  isDeepResearch,
  isThinkingPhraseVisible,
  thinkingPhrases,
  thinkingPhraseIndex,
}: ChatFeedProps) {
  return (
    <div
      ref={feedRef}
      onScroll={onFeedScroll}
      className="mb-4 flex-1 space-y-4 overflow-y-auto rounded-xl border border-white/12 bg-[#0b0b0b]/70 p-4 md:p-5"
    >
      {isLoadingConversationMessages ? (
        <div className="flex h-full min-h-[360px] items-center justify-center px-4 text-center">
          <p className="text-sm text-white/60">Loading conversation...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex h-full min-h-[360px] flex-col items-center justify-center px-4 text-center">
          <h2 className="font-editorial text-5xl leading-tight text-white">Ask anything.</h2>
          <p className="mt-3 max-w-xl text-base text-white/60">
            Personalised guidance for your cross-border compliance.
          </p>
          <div className="mt-7 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2.5">
            {EMPTY_STATE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onEmptyPromptClick(prompt)}
                className="rounded-full border border-white/20 bg-[#141414] px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((message) => {
          const { mainContent, sourcesContent } =
            message.role === "assistant"
              ? splitAssistantContent(message.content)
              : { mainContent: message.content, sourcesContent: "" };
          const sourceItems =
            message.role === "assistant" ? extractSourceItems(sourcesContent) : [];
          const isSourcesExpanded = expandedSourcesByMessageId[message.id] ?? false;
          const isInlineEditingUserMessage =
            message.role === "user" && editingUserMessageId === message.id;

          return (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "group ml-auto flex w-full max-w-3xl items-center justify-end gap-2"
                  : "mr-auto w-full max-w-3xl"
              }
            >
              {message.role === "user" && !isInlineEditingUserMessage ? (
                <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onStartInlineEdit(message.id, message.content)}
                    className="inline-flex items-center p-0 text-sm text-white/55 transition-opacity hover:text-white hover:opacity-100"
                    aria-label="Edit message"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => void onCopyUserMessage(message.id, message.content)}
                    className="inline-flex items-center p-0 text-sm text-white/55 transition-opacity hover:text-white hover:opacity-100"
                    aria-label="Copy message"
                    title="Copy"
                  >
                    {copiedUserMessageId === message.id ? "✓" : "⧉"}
                  </button>
                </div>
              ) : null}

              <div className="w-full">
                <article
                  className={
                    message.role === "user"
                      ? "w-full rounded-xl border border-white/20 bg-[#161616] p-4"
                      : "w-full rounded-xl border border-white/12 bg-[#111111] p-4"
                  }
                >
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/45">
                    {message.role === "user" ? "You" : "Nuvare AI"}
                  </p>
                  {message.role === "assistant" ? (
                    <>
                      {message.toolSteps && message.toolSteps.length > 0 ? (
                        <div className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5">
                          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-200/80">
                            Agent steps
                          </p>
                          <ul className="flex flex-col gap-1.5">
                            {message.toolSteps.map((step) => (
                              <li
                                key={step.id}
                                className="flex items-center gap-2 text-xs text-white/80"
                              >
                                <span
                                  className={
                                    step.status === "running"
                                      ? "text-amber-300/90"
                                      : step.status === "error"
                                        ? "text-red-400/90"
                                        : "text-emerald-400/90"
                                  }
                                  aria-hidden
                                >
                                  {step.status === "running"
                                    ? "◌"
                                    : step.status === "error"
                                      ? "✕"
                                      : "✓"}
                                </span>
                                <span className="leading-snug">
                                  {formatToolStepLabel(step.name)}
                                  {step.status === "running" ? "…" : null}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      <AssistantMarkdown>{mainContent}</AssistantMarkdown>

                      <div className="mt-3 flex items-center gap-2">
                        {sourceItems.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => onToggleSources(message.id)}
                            className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white"
                          >
                            📎 Sources
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() =>
                            void onCopySource(mainContent, `assistant-message-${message.id}`)
                          }
                          className="inline-flex items-center p-0 text-sm text-white/55 transition-opacity hover:text-white hover:opacity-100"
                          aria-label="Copy assistant message"
                          title="Copy"
                        >
                          {copiedSourceKey === `assistant-message-${message.id}` ? "✓" : "⧉"}
                        </button>
                      </div>
                      {sourceItems.length > 0 ? (
                        <div className="mt-2">
                          {isSourcesExpanded ? (
                            <div className="mt-2 rounded-lg border border-white/12 bg-[#0a0a0a] p-3 text-xs text-white/65">
                              <ul className="space-y-2">
                                {sourceItems.map((source, index) => {
                                  const sourceKey = `${message.id}-${index}`;
                                  return (
                                    <li
                                      key={sourceKey}
                                      className="flex items-start justify-between gap-2"
                                    >
                                      <span className="leading-5">{source}</span>
                                      <button
                                        type="button"
                                        onClick={() => void onCopySource(source, sourceKey)}
                                        className="shrink-0 rounded border border-white/15 bg-transparent px-1.5 py-0.5 text-[11px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                        aria-label={`Copy source ${index + 1}`}
                                        title={copiedSourceKey === sourceKey ? "Copied ✓" : "Copy"}
                                      >
                                        {copiedSourceKey === sourceKey ? "✓" : "⧉"}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </>
                  ) : isInlineEditingUserMessage ? (
                    <Textarea
                      rows={Math.max(3, editingUserMessageDraft.split("\n").length)}
                      value={editingUserMessageDraft}
                      onChange={(event) => onEditingDraftChange(event.target.value)}
                      className="min-h-[72px] resize-none border-0 bg-transparent px-0 py-0 text-sm leading-6 text-white/90 shadow-none focus-visible:ring-0"
                      aria-label="Edit your message"
                      autoFocus
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-white/90">
                      {message.content}
                    </p>
                  )}
                </article>
                {isInlineEditingUserMessage ? (
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={onCancelInlineEdit}
                      className="inline-flex h-7 items-center rounded border border-white/20 bg-transparent px-2.5 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void onSaveInlineEdit(message.id)}
                      className="inline-flex h-7 items-center rounded border border-white/30 bg-white/10 px-2.5 text-xs text-white transition-colors hover:bg-white/15"
                    >
                      Save
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })
      )}
      {isLoading ? (
        <p
          className={cn(
            "text-sm text-white/50 transition-opacity duration-300",
            isDeepResearch || isThinkingPhraseVisible ? "opacity-100" : "opacity-0",
          )}
        >
          {isDeepResearch
            ? stripTrailingDots(DEEP_RESEARCH_LOADING_MESSAGE)
            : stripTrailingDots(
                thinkingPhrases[thinkingPhraseIndex] ?? DEFAULT_THINKING_PHRASES[0],
              )}
          <span className="ml-0.5 text-white/35">
            <span>·</span>
            <span className="inline-block w-0 overflow-hidden align-bottom thinking-dots-loop">
              ··
            </span>
          </span>
        </p>
      ) : null}
    </div>
  );
}
