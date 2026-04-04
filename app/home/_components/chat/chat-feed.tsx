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
      className="mb-4 flex-1 overflow-y-auto bg-[#111319] px-1 py-2"
    >
      {isLoadingConversationMessages ? (
        <div className="flex h-full min-h-[360px] items-center justify-center px-4 text-center">
          <p className="text-xs uppercase tracking-widest text-[#c4c7c8]/60">
            Loading conversation...
          </p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex h-full min-h-[360px] flex-col justify-center px-4">
          <h2 className="text-4xl font-extrabold tracking-tight text-white mb-4">
            Regulatory Synthesis
          </h2>
          <p className="text-sm text-[#c4c7c8] max-w-xl mb-10">
            Instant compliance auditing and jurisdictional intelligence via the Sovereign core.
          </p>
          <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            {EMPTY_STATE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onEmptyPromptClick(prompt)}
                className="bg-[#1e1f26] hover:bg-[#282a30] transition-all p-6 cursor-pointer border-l-4 border-white/10 hover:border-white/30 text-left text-sm text-[#e2e2eb]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {messages.map((message) => {
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
                    ? "group flex w-full items-start justify-end gap-2"
                    : "w-full"
                }
              >
                {message.role === "user" && !isInlineEditingUserMessage ? (
                  <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 pt-6">
                    <button
                      type="button"
                      onClick={() => onStartInlineEdit(message.id, message.content)}
                      className="inline-flex items-center p-0 text-sm text-[#c4c7c8]/60 transition-opacity hover:text-white hover:opacity-100"
                      aria-label="Edit message"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => void onCopyUserMessage(message.id, message.content)}
                      className="inline-flex items-center p-0 text-sm text-[#c4c7c8]/60 transition-opacity hover:text-white hover:opacity-100"
                      aria-label="Copy message"
                      title="Copy"
                    >
                      {copiedUserMessageId === message.id ? "✓" : "⧉"}
                    </button>
                  </div>
                ) : null}

                <div className={message.role === "user" ? "max-w-2xl" : "w-full"}>
                  {message.role === "user" ? (
                    <article className="text-right">
                      <p className="mb-1 text-[9px] uppercase tracking-widest text-[#c4c7c8]/60">
                        You
                      </p>
                      {isInlineEditingUserMessage ? (
                        <Textarea
                          rows={Math.max(3, editingUserMessageDraft.split("\n").length)}
                          value={editingUserMessageDraft}
                          onChange={(event) => onEditingDraftChange(event.target.value)}
                          className="min-h-[72px] resize-none border-0 bg-transparent px-0 py-0 text-sm leading-6 text-white shadow-none focus-visible:ring-0 text-right"
                          aria-label="Edit your message"
                          autoFocus
                        />
                      ) : (
                        <p className="whitespace-pre-wrap font-medium text-white leading-relaxed">
                          {message.content}
                        </p>
                      )}
                      {isInlineEditingUserMessage ? (
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={onCancelInlineEdit}
                            className="inline-flex h-7 items-center border border-white/20 bg-transparent px-2.5 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => void onSaveInlineEdit(message.id)}
                            className="inline-flex h-7 items-center border border-white/30 bg-white/10 px-2.5 text-xs text-white transition-colors hover:bg-white/15"
                          >
                            Save
                          </button>
                        </div>
                      ) : null}
                    </article>
                  ) : (
                    <article className="bg-[#1e1f26] p-8 rounded-sm">
                      <p className="text-[10px] uppercase tracking-widest text-[#c4c7c8] mb-4">
                        Synthesis Result
                      </p>
                      {message.toolSteps && message.toolSteps.length > 0 ? (
                        <div className="mb-4 border-l-4 border-white/10 bg-[#282a30] px-4 py-3">
                          <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-[#c4c7c8]">
                            Agent steps
                          </p>
                          <ul className="flex flex-col gap-1.5">
                            {message.toolSteps.map((step) => (
                              <li
                                key={step.id}
                                className="flex items-center gap-2 text-xs text-[#e2e2eb]"
                              >
                                <span
                                  className={
                                    step.status === "running"
                                      ? "text-white/60"
                                      : step.status === "error"
                                        ? "text-white/40"
                                        : "text-white/80"
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
                      <div className="text-[#e2e2eb] leading-relaxed">
                        <AssistantMarkdown>{mainContent}</AssistantMarkdown>
                      </div>

                      {sourceItems.length > 0 ? (
                        <div className="mt-6 border-t border-white/5 pt-6">
                          <button
                            type="button"
                            onClick={() => onToggleSources(message.id)}
                            className="mb-3 text-[10px] uppercase tracking-widest text-[#c4c7c8] hover:text-white transition-colors"
                          >
                            {isSourcesExpanded ? "Hide Sources" : "View Sources"}
                          </button>
                          {isSourcesExpanded ? (
                            <div className="flex flex-wrap gap-2">
                              {sourceItems.map((source, index) => {
                                const sourceKey = `${message.id}-${index}`;
                                return (
                                  <div
                                    key={sourceKey}
                                    className="flex items-center gap-2 bg-[#282a30] px-3 py-2 text-[10px] uppercase tracking-widest text-[#c4c7c8]"
                                  >
                                    <span className="text-white/40 font-bold">{index + 1}</span>
                                    <span className="leading-snug">{source}</span>
                                    <button
                                      type="button"
                                      onClick={() => void onCopySource(source, sourceKey)}
                                      className="shrink-0 bg-transparent text-white/40 transition-colors hover:text-white"
                                      aria-label={`Copy source ${index + 1}`}
                                      title={copiedSourceKey === sourceKey ? "Copied ✓" : "Copy"}
                                    >
                                      {copiedSourceKey === sourceKey ? "✓" : "⧉"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            void onCopySource(mainContent, `assistant-message-${message.id}`)
                          }
                          className="text-[10px] uppercase tracking-widest text-[#c4c7c8]/60 transition-colors hover:text-white"
                          aria-label="Copy assistant message"
                          title="Copy"
                        >
                          {copiedSourceKey === `assistant-message-${message.id}`
                            ? "Copied ✓"
                            : "Copy response"}
                        </button>
                      </div>
                    </article>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {isLoading ? (
        <p
          className={cn(
            "mt-8 text-xs uppercase tracking-widest text-[#c4c7c8] transition-opacity duration-300",
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
