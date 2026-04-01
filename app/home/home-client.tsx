"use client";

import type { ChangeEvent } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import {
  DEFAULT_THINKING_PHRASES,
  DEEP_RESEARCH_LOADING_MESSAGE,
} from "@/app/home/_lib/constants";
import { createId, getThinkingPhrases } from "@/app/home/_lib/format";
import type {
  ChatMessage,
  ChatRole,
  ConversationSummary,
  DashboardDeadline,
  NotificationItem,
  SubscriptionTier,
  ViewedCountry,
} from "@/app/home/_lib/types";
import { AddDeadlineModal } from "@/app/home/_components/deadlines/add-deadline-modal";
import { DashboardMobileHeader } from "@/app/home/_components/dashboard-mobile-header";
import { DashboardSidebar } from "@/app/home/_components/dashboard-sidebar";
import { DashboardThinkingStyles } from "@/app/home/_components/dashboard-animations";
import { ChatComposer } from "@/app/home/_components/chat/chat-composer";
import { ChatFeed } from "@/app/home/_components/chat/chat-feed";

export default function DashboardClient({
  userId,
  userEmail,
  hasProfile,
  initialDeadlines,
  viewedCountries,
}: {
  userId: string;
  userEmail: string;
  hasProfile: boolean;
  initialDeadlines: DashboardDeadline[];
  viewedCountries: ViewedCountry[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const isUserScrolledRef = useRef(false);
  const thinkingFadeTimeoutRef = useRef<number | null>(null);
  const assistantCharacterQueueRef = useRef<string[]>([]);
  const assistantTypewriterIntervalRef = useRef<number | null>(null);
  const isAssistantStreamingCompleteRef = useRef(false);
  const activeAssistantMessageIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeStreamReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const stopGenerationRequestedRef = useRef(false);
  const activeConversationIdRef = useRef<string | null>(null);
  const notificationsPanelRef = useRef<HTMLDivElement | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingConversationMessages, setIsLoadingConversationMessages] = useState(false);
  const [isDeepResearch, setIsDeepResearch] = useState(false);
  const [isDeepResearchHovered, setIsDeepResearchHovered] = useState(false);
  const [showDeepResearchUpgradeMessage, setShowDeepResearchUpgradeMessage] = useState(false);
  const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("none");
  const [input, setInput] = useState("");
  const [thinkingPhrases, setThinkingPhrases] = useState(DEFAULT_THINKING_PHRASES);
  const [thinkingPhraseIndex, setThinkingPhraseIndex] = useState(0);
  const [isThinkingPhraseVisible, setIsThinkingPhraseVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [openConversationMenuId, setOpenConversationMenuId] = useState<string | null>(null);
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renamingConversationDraft, setRenamingConversationDraft] = useState("");
  const [expandedSourcesByMessageId, setExpandedSourcesByMessageId] = useState<
    Record<string, boolean>
  >({});
  const [copiedSourceKey, setCopiedSourceKey] = useState<string | null>(null);
  const [copiedUserMessageId, setCopiedUserMessageId] = useState<string | null>(null);
  const [editingUserMessageId, setEditingUserMessageId] = useState<string | null>(null);
  const [editingUserMessageDraft, setEditingUserMessageDraft] = useState("");
  const [deadlines, setDeadlines] = useState<DashboardDeadline[]>(initialDeadlines);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "",
    date: "",
  });

  const allDeadlines = useMemo(() => {
    return [...deadlines].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  }, [deadlines]);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    setIsLoadingConversations(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const nextSessions: ConversationSummary[] = (data ?? []).map((conversation) => ({
      id: conversation.id as string,
      title: (conversation.title as string | null) ?? "Untitled chat",
      updatedAt: conversation.updated_at as string,
    }));
    setChatSessions(nextSessions);
  }, [supabase, userId]);

  const subscriptionBannerMessage =
    subscriptionTier === "professional"
      ? "You're now on Nuvare Professional. Welcome."
      : subscriptionTier === "core"
        ? "You're now on Nuvare Core. Welcome."
        : "Welcome to Nuvare.";

  function isNearFeedBottom(element: HTMLDivElement, threshold = 100) {
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    return distanceFromBottom <= threshold;
  }

  function scrollFeedToBottom() {
    if (!feedRef.current) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }

  function handleFeedScroll() {
    if (!feedRef.current) return;
    isUserScrolledRef.current = !isNearFeedBottom(feedRef.current);
  }

  function clearAssistantTypewriterInterval() {
    if (assistantTypewriterIntervalRef.current === null) return;
    window.clearInterval(assistantTypewriterIntervalRef.current);
    assistantTypewriterIntervalRef.current = null;
  }

  function resetStreamingState() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    clearAssistantTypewriterInterval();
    assistantCharacterQueueRef.current = [];
    isAssistantStreamingCompleteRef.current = false;
    activeAssistantMessageIdRef.current = null;
    activeStreamReaderRef.current = null;
  }

  function maybeStopAssistantTypewriter() {
    if (
      isAssistantStreamingCompleteRef.current &&
      assistantCharacterQueueRef.current.length === 0
    ) {
      clearAssistantTypewriterInterval();
    }
  }

  function startAssistantTypewriter() {
    if (assistantTypewriterIntervalRef.current !== null) return;
    assistantTypewriterIntervalRef.current = window.setInterval(() => {
      const nextCharacter = assistantCharacterQueueRef.current.shift();
      const activeMessageId = activeAssistantMessageIdRef.current;
      if (!nextCharacter || !activeMessageId) {
        maybeStopAssistantTypewriter();
        return;
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === activeMessageId
            ? { ...message, content: message.content + nextCharacter }
            : message,
        ),
      );
      maybeStopAssistantTypewriter();
    }, 16);
  }

  async function waitForAssistantTypewriterDrain() {
    if (
      !isAssistantStreamingCompleteRef.current ||
      assistantCharacterQueueRef.current.length > 0
    ) {
      await new Promise<void>((resolve) => {
        const poll = window.setInterval(() => {
          if (
            isAssistantStreamingCompleteRef.current &&
            assistantCharacterQueueRef.current.length === 0
          ) {
            window.clearInterval(poll);
            clearAssistantTypewriterInterval();
            resolve();
          }
        }, 20);
      });
    }
  }

  useEffect(() => {
    if (!feedRef.current) return;
    if (!isUserScrolledRef.current) {
      scrollFeedToBottom();
    }
  }, [messages, isLoading]);

  useEffect(() => {
    let isCancelled = false;

    async function loadSubscriptionTier(shouldShowBanner: boolean) {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("subscription_tier")
        .eq("user_id", userId)
        .maybeSingle();

      if (isCancelled) return;

      if (error) {
        setSubscriptionTier("none");
        if (shouldShowBanner) {
          setShowSubscriptionBanner(true);
        }
        return;
      }

      const rawTier = data?.subscription_tier;
      if (rawTier === "core" || rawTier === "professional") {
        setSubscriptionTier(rawTier);
      } else {
        setSubscriptionTier("none");
      }

      if (shouldShowBanner) {
        setShowSubscriptionBanner(true);
      }
    }

    const currentUrl = new URL(window.location.href);
    const shouldShowBanner = currentUrl.searchParams.get("subscribed") === "true";
    if (shouldShowBanner) {
      currentUrl.searchParams.delete("subscribed");
      const query = currentUrl.searchParams.toString();
      const nextUrl = `${currentUrl.pathname}${query ? `?${query}` : ""}${currentUrl.hash}`;
      window.history.replaceState({}, "", nextUrl);
    }

    void loadSubscriptionTier(shouldShowBanner);

    return () => {
      isCancelled = true;
    };
  }, [supabase, userId]);

  useEffect(() => {
    if (!showSubscriptionBanner) return;
    const timeoutId = window.setTimeout(() => {
      setShowSubscriptionBanner(false);
    }, 4000);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showSubscriptionBanner]);

  useEffect(() => {
    if (subscriptionTier === "professional") {
      setShowDeepResearchUpgradeMessage(false);
      return;
    }
    if (isDeepResearch) {
      setIsDeepResearch(false);
    }
  }, [isDeepResearch, subscriptionTier]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const maxHeight = 120;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${Math.max(nextHeight, 44)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [input]);

  useEffect(() => {
    if (!isLoading) {
      if (thinkingFadeTimeoutRef.current !== null) {
        window.clearTimeout(thinkingFadeTimeoutRef.current);
      }
      setThinkingPhraseIndex(0);
      setIsThinkingPhraseVisible(true);
      return;
    }

    if (thinkingPhrases.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setIsThinkingPhraseVisible(false);
      if (thinkingFadeTimeoutRef.current !== null) {
        window.clearTimeout(thinkingFadeTimeoutRef.current);
      }
      thinkingFadeTimeoutRef.current = window.setTimeout(() => {
        setThinkingPhraseIndex((prev) => (prev + 1) % thinkingPhrases.length);
        setIsThinkingPhraseVisible(true);
      }, 220);
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
      if (thinkingFadeTimeoutRef.current !== null) {
        window.clearTimeout(thinkingFadeTimeoutRef.current);
      }
    };
  }, [isLoading, thinkingPhrases]);

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.push("/onboarding");
  }

  function upsertConversationInSidebar(nextConversation: ConversationSummary) {
    setChatSessions((prev) =>
      [nextConversation, ...prev.filter((conversation) => conversation.id !== nextConversation.id)]
        .sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0),
    );
  }

  async function touchConversationUpdatedAt(conversationId: string) {
    const updatedAt = new Date().toISOString();
    const { error } = await supabase
      .from("conversations")
      .update({ updated_at: updatedAt })
      .eq("id", conversationId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    setChatSessions((prev) =>
      prev
        .map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, updatedAt }
            : conversation,
        )
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    );
  }

  async function persistMessage(
    conversationId: string,
    role: ChatRole,
    content: string,
  ) {
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      role,
      content,
    });

    if (error) {
      throw new Error(error.message);
    }

    await touchConversationUpdatedAt(conversationId);
  }

  async function createConversationForFirstMessage(firstMessage: string) {
    const title = firstMessage.slice(0, 60);
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        title,
      })
      .select("id, title, updated_at")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Unable to create conversation.");
    }

    const conversation: ConversationSummary = {
      id: data.id as string,
      title: (data.title as string | null) ?? "Untitled chat",
      updatedAt: data.updated_at as string,
    };

    activeConversationIdRef.current = conversation.id;
    setSelectedConversationId(conversation.id);
    upsertConversationInSidebar(conversation);
    return conversation.id;
  }

  async function ensureConversationForMessage(firstMessage: string) {
    if (activeConversationIdRef.current) {
      return activeConversationIdRef.current;
    }

    return createConversationForFirstMessage(firstMessage);
  }

  async function loadConversationMessages(conversationId: string) {
    if (isLoading) return;

    resetStreamingState();
    setIsLoading(false);
    setIsLoadingConversationMessages(true);
    setErrorMessage("");
    setCopiedSourceKey(null);
    setCopiedUserMessageId(null);
    setEditingUserMessageId(null);
    setEditingUserMessageDraft("");
    setExpandedSourcesByMessageId({});

    const { data, error } = await supabase
      .from("messages")
      .select("id, role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setIsLoadingConversationMessages(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const nextMessages: ChatMessage[] = (data ?? [])
      .filter(
        (message): message is { id: string; role: ChatRole; content: string } =>
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string",
      )
      .map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
      }));

    activeConversationIdRef.current = conversationId;
    setSelectedConversationId(conversationId);
    setMessages(nextMessages);
  }

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    let isCancelled = false;

    async function loadNotifications() {
      try {
        const response = await fetch("/api/notifications", { method: "GET" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as NotificationItem[];
        if (isCancelled || !Array.isArray(payload)) return;
        setNotifications(payload);
        setUnreadCount(payload.filter((item) => !item.read).length);
      } catch {
        // Ignore notification fetch failures to avoid impacting chat UX.
      }
    }

    void loadNotifications();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!openConversationMenuId) return;

    function handleOutsideMenuClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (target.closest(`[data-conversation-menu-root="${openConversationMenuId}"]`)) {
        return;
      }

      setOpenConversationMenuId(null);
    }

    window.addEventListener("mousedown", handleOutsideMenuClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideMenuClick);
    };
  }, [openConversationMenuId]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    async function markNotificationsRead() {
      try {
        await fetch("/api/notifications", { method: "PATCH" });
      } catch {
        // Ignore patch failures; panel remains usable.
      }
    }

    setUnreadCount(0);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    void markNotificationsRead();
  }, [isNotificationsOpen]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    function handleOutsideNotificationsClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (notificationsPanelRef.current?.contains(target)) return;
      setIsNotificationsOpen(false);
    }

    window.addEventListener("mousedown", handleOutsideNotificationsClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideNotificationsClick);
    };
  }, [isNotificationsOpen]);

  async function streamAssistantResponse(
    nextMessages: ChatMessage[],
    question: string,
    conversationId: string,
    options?: { clearInput?: boolean },
  ) {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const requestAbortController = abortControllerRef.current;
    const assistantMessageId = createId();
    setMessages([
      ...nextMessages,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ]);
    activeAssistantMessageIdRef.current = assistantMessageId;
    assistantCharacterQueueRef.current = [];
    isAssistantStreamingCompleteRef.current = false;
    clearAssistantTypewriterInterval();
    startAssistantTypewriter();
    if (options?.clearInput) {
      setInput("");
    }
    setErrorMessage("");
    setThinkingPhrases(
      isDeepResearch ? [DEEP_RESEARCH_LOADING_MESSAGE] : getThinkingPhrases(question),
    );
    setThinkingPhraseIndex(0);
    setIsThinkingPhraseVisible(true);
    setIsLoading(true);
    stopGenerationRequestedRef.current = false;

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: requestAbortController.signal,
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          deepResearch: isDeepResearch,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Unable to generate response.");
      }

      if (!response.body) {
        throw new Error("Streaming response is unavailable.");
      }

      const reader = response.body.getReader();
      activeStreamReaderRef.current = reader;
      const decoder = new TextDecoder();
      let hasReceivedText = false;
      let fullAssistantResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        hasReceivedText = true;
        fullAssistantResponse += chunk;
        assistantCharacterQueueRef.current.push(...Array.from(chunk));
        startAssistantTypewriter();
      }

      const trailingChunk = decoder.decode();
      if (trailingChunk) {
        hasReceivedText = true;
        fullAssistantResponse += trailingChunk;
        assistantCharacterQueueRef.current.push(...Array.from(trailingChunk));
        startAssistantTypewriter();
      }

      isAssistantStreamingCompleteRef.current = true;
      activeStreamReaderRef.current = null;
      await waitForAssistantTypewriterDrain();

      if (!hasReceivedText) {
        throw new Error("AI returned an empty response.");
      }

      await persistMessage(conversationId, "assistant", fullAssistantResponse);
    } catch (error) {
      const isAbortError =
        (error instanceof DOMException && error.name === "AbortError") ||
        (error instanceof Error && error.name === "AbortError");

      if (stopGenerationRequestedRef.current || isAbortError) {
        clearAssistantTypewriterInterval();
        assistantCharacterQueueRef.current = [];
        isAssistantStreamingCompleteRef.current = true;
        setMessages((prev) =>
          prev.filter(
            (message) =>
              message.id !== assistantMessageId || message.content.trim().length > 0,
          ),
        );
      } else {
        clearAssistantTypewriterInterval();
        assistantCharacterQueueRef.current = [];
        isAssistantStreamingCompleteRef.current = false;
        setMessages((prev) =>
          prev.filter((message) => message.id !== assistantMessageId),
        );
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to generate response.",
        );
      }
    } finally {
      if (abortControllerRef.current === requestAbortController) {
        abortControllerRef.current = null;
        stopGenerationRequestedRef.current = false;
        activeStreamReaderRef.current = null;
        clearAssistantTypewriterInterval();
        assistantCharacterQueueRef.current = [];
        isAssistantStreamingCompleteRef.current = false;
        activeAssistantMessageIdRef.current = null;
        setIsLoading(false);
      }
    }
  }

  async function submitQuestion() {
    const question = input.trim();
    if (!question || isLoading) return;

    const nextUserMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: question,
    };
    const nextMessages = [...messages, nextUserMessage];

    setMessages(nextMessages);
    setInput("");
    setErrorMessage("");

    try {
      const conversationId = await ensureConversationForMessage(question);
      await persistMessage(conversationId, "user", question);
      await streamAssistantResponse(nextMessages, question, conversationId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save your message.");
    }
  }

  async function stopGeneration() {
    stopGenerationRequestedRef.current = true;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    activeStreamReaderRef.current = null;
    isAssistantStreamingCompleteRef.current = true;
    assistantCharacterQueueRef.current = [];
    clearAssistantTypewriterInterval();
    setMessages((prev) =>
      prev.filter(
        (message) =>
          message.id !== activeAssistantMessageIdRef.current ||
          message.content.trim().length > 0,
      ),
    );
    activeAssistantMessageIdRef.current = null;
    setIsLoading(false);
  }

  function handleDeepResearchToggle() {
    if (isLoading) return;

    if (subscriptionTier !== "professional") {
      setShowDeepResearchUpgradeMessage(true);
      return;
    }

    setShowDeepResearchUpgradeMessage(false);
    setIsDeepResearch((prev) => !prev);
  }

  function handleNewChat() {
    setMessages([]);
    activeConversationIdRef.current = null;
    setSelectedConversationId(null);
    setOpenConversationMenuId(null);
    setRenamingConversationId(null);
    setRenamingConversationDraft("");
    setExpandedSourcesByMessageId({});
    setCopiedSourceKey(null);
    setCopiedUserMessageId(null);
    setEditingUserMessageId(null);
    setEditingUserMessageDraft("");
    isUserScrolledRef.current = false;
    resetStreamingState();
    setInput("");
    setSelectedUploadFile(null);
    setErrorMessage("");
  }

  function startConversationRename(conversationId: string, currentTitle: string) {
    setOpenConversationMenuId(null);
    setRenamingConversationId(conversationId);
    setRenamingConversationDraft(currentTitle);
    setErrorMessage("");
  }

  function cancelConversationRename() {
    setRenamingConversationId(null);
    setRenamingConversationDraft("");
  }

  async function saveConversationRename(conversationId: string) {
    const nextTitle = renamingConversationDraft.trim();
    if (!nextTitle) {
      setErrorMessage("Conversation title cannot be empty.");
      return;
    }

    const previousSessions = chatSessions;
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === conversationId ? { ...session, title: nextTitle } : session,
      ),
    );
    cancelConversationRename();

    const { error } = await supabase
      .from("conversations")
      .update({ title: nextTitle })
      .eq("id", conversationId)
      .eq("user_id", userId);

    if (error) {
      setChatSessions(previousSessions);
      setErrorMessage(error.message);
    }
  }

  async function deleteConversation(conversationId: string) {
    const previousSessions = chatSessions;
    const isDeletingActiveConversation = activeConversationIdRef.current === conversationId;
    setChatSessions((prev) => prev.filter((session) => session.id !== conversationId));
    setOpenConversationMenuId(null);
    cancelConversationRename();

    if (isDeletingActiveConversation) {
      handleNewChat();
    }

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", userId);

    if (error) {
      setChatSessions(previousSessions);
      setErrorMessage(error.message);
    }
  }

  function toggleSourcesPanel(messageId: string) {
    setExpandedSourcesByMessageId((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  }

  async function copySourceText(sourceText: string, sourceKey: string) {
    try {
      await navigator.clipboard.writeText(sourceText);
      setCopiedSourceKey(sourceKey);
      window.setTimeout(() => {
        setCopiedSourceKey((current) => (current === sourceKey ? null : current));
      }, 2000);
    } catch {
      setErrorMessage("Unable to copy source text.");
    }
  }

  async function copyUserMessageText(messageId: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedUserMessageId(messageId);
      window.setTimeout(() => {
        setCopiedUserMessageId((current) => (current === messageId ? null : current));
      }, 2000);
    } catch {
      setErrorMessage("Unable to copy message text.");
    }
  }

  function handleStartInlineEdit(messageId: string, content: string) {
    setEditingUserMessageId(messageId);
    setEditingUserMessageDraft(content);
    setErrorMessage("");
  }

  function handleCancelInlineEdit() {
    setEditingUserMessageId(null);
    setEditingUserMessageDraft("");
    setErrorMessage("");
  }

  async function handleSaveInlineEdit(messageId: string) {
    const nextContent = editingUserMessageDraft.trim();
    if (!nextContent) {
      setErrorMessage("Message cannot be empty.");
      return;
    }

    const messageIndex = messages.findIndex(
      (message) => message.id === messageId && message.role === "user",
    );
    if (messageIndex === -1) return;

    const nextMessages = messages.slice(0, messageIndex + 1).map((message) =>
      message.id === messageId ? { ...message, content: nextContent } : message,
    );

    resetStreamingState();
    setIsLoading(false);
    setEditingUserMessageId(null);
    setEditingUserMessageDraft("");
    setCopiedUserMessageId(null);
    const conversationId = activeConversationIdRef.current;
    if (!conversationId) {
      setErrorMessage("Start a new chat by sending a message.");
      return;
    }

    await streamAssistantResponse(nextMessages, nextContent, conversationId);
  }

  function handleFilePickerSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setSelectedUploadFile(selectedFile);
  }

  async function handleAddDeadline() {
    setErrorMessage("");
    if (!form.title || !form.category || !form.date) {
      setErrorMessage("Please complete title, category, and date.");
      return;
    }

    setIsSavingManual(true);

    try {
      const { data, error } = await supabase
        .from("deadlines")
        .insert({
          user_id: userId,
          title: form.title.trim(),
          due_date: form.date,
          category: form.category.trim(),
        })
        .select("id, title, due_date, category")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "Unable to save deadline.");
      }

      const newDeadline: DashboardDeadline = {
        id: data.id as string,
        title: data.title as string,
        dueDate: data.due_date as string,
        category: (data.category as string | null) ?? "",
      };

      setDeadlines((prev) =>
        [...prev, newDeadline].sort(
          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        ),
      );
      setForm({ title: "", category: "", date: "" });
      setIsModalOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save deadline.",
      );
    } finally {
      setIsSavingManual(false);
    }
  }

  return (
    <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black text-white">
      <div className="onboarding-glow pointer-events-none absolute inset-0" />
      <div className="relative min-h-screen">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <DashboardSidebar
          isSidebarOpen={isSidebarOpen}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          onNewChat={handleNewChat}
          notificationsPanelRef={notificationsPanelRef}
          notifications={notifications}
          unreadCount={unreadCount}
          isNotificationsOpen={isNotificationsOpen}
          onToggleNotifications={() => setIsNotificationsOpen((current) => !current)}
          subscriptionTier={subscriptionTier}
          viewedCountries={viewedCountries}
          isLoadingConversations={isLoadingConversations}
          chatSessions={chatSessions}
          selectedConversationId={selectedConversationId}
          renamingConversationId={renamingConversationId}
          renamingConversationDraft={renamingConversationDraft}
          onRenamingDraftChange={setRenamingConversationDraft}
          openConversationMenuId={openConversationMenuId}
          onToggleConversationMenu={(sessionId) =>
            setOpenConversationMenuId((current) => (current === sessionId ? null : sessionId))
          }
          onSelectConversation={(id) => {
            void loadConversationMessages(id);
          }}
          onStartRename={startConversationRename}
          onCancelRename={cancelConversationRename}
          onSaveRename={saveConversationRename}
          onDeleteConversation={deleteConversation}
          userEmail={userEmail}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
          allDeadlines={allDeadlines}
          onOpenAddDeadlineModal={() => {
            setErrorMessage("");
            setIsModalOpen(true);
          }}
        />

        <div className="ml-0 flex min-h-screen flex-col md:ml-[260px]">
          {!isSidebarOpen ? (
            <DashboardMobileHeader onOpenSidebar={() => setIsSidebarOpen(true)} />
          ) : null}
          <section className="flex h-screen flex-col px-6 pb-6 pt-16 md:px-10 md:py-6">
            {!hasProfile ? (
              <p className="mb-4 text-sm text-amber-300">
                Your profile is incomplete. Answers may be less personalized until onboarding is
                finished.
              </p>
            ) : null}
            {showSubscriptionBanner ? (
              <button
                type="button"
                onClick={() => setShowSubscriptionBanner(false)}
                className="mb-3 w-full rounded-lg border border-white/15 bg-[#111111] px-4 py-2 text-left text-sm text-white/80 transition-colors hover:bg-[#171717]"
              >
                {subscriptionBannerMessage}
              </button>
            ) : null}

            <ChatFeed
              feedRef={feedRef}
              onFeedScroll={handleFeedScroll}
              isLoadingConversationMessages={isLoadingConversationMessages}
              messages={messages}
              onEmptyPromptClick={setInput}
              expandedSourcesByMessageId={expandedSourcesByMessageId}
              editingUserMessageId={editingUserMessageId}
              editingUserMessageDraft={editingUserMessageDraft}
              onEditingDraftChange={setEditingUserMessageDraft}
              copiedSourceKey={copiedSourceKey}
              copiedUserMessageId={copiedUserMessageId}
              onToggleSources={toggleSourcesPanel}
              onCopySource={copySourceText}
              onCopyUserMessage={copyUserMessageText}
              onStartInlineEdit={handleStartInlineEdit}
              onCancelInlineEdit={handleCancelInlineEdit}
              onSaveInlineEdit={handleSaveInlineEdit}
              isLoading={isLoading}
              isDeepResearch={isDeepResearch}
              isThinkingPhraseVisible={isThinkingPhraseVisible}
              thinkingPhrases={thinkingPhrases}
              thinkingPhraseIndex={thinkingPhraseIndex}
            />

            <ChatComposer
              fileInputRef={fileInputRef}
              textareaRef={textareaRef}
              selectedUploadFile={selectedUploadFile}
              onClearUpload={() => setSelectedUploadFile(null)}
              input={input}
              onInputChange={setInput}
              onFileChange={handleFilePickerSelection}
              onSubmit={submitQuestion}
              onStop={stopGeneration}
              isLoading={isLoading}
              subscriptionTier={subscriptionTier}
              isDeepResearch={isDeepResearch}
              isDeepResearchHovered={isDeepResearchHovered}
              onDeepResearchHoverEnter={() => setIsDeepResearchHovered(true)}
              onDeepResearchHoverLeave={() => setIsDeepResearchHovered(false)}
              onDeepResearchToggle={handleDeepResearchToggle}
              showDeepResearchUpgradeMessage={showDeepResearchUpgradeMessage}
              errorMessage={errorMessage}
            />
          </section>
        </div>

        <AddDeadlineModal
          isOpen={isModalOpen}
          form={form}
          onFormChange={setForm}
          onClose={() => setIsModalOpen(false)}
          onSave={() => void handleAddDeadline()}
          isSaving={isSavingManual}
          errorMessage={errorMessage}
        />
      </div>
      <DashboardThinkingStyles />
    </main>
  );
}
