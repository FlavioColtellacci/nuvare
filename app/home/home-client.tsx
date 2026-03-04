"use client";

import {
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type ManualDeadline = {
  id: string;
  title: string;
  country: string;
  dueDate: string;
  notes?: string;
};

type Deadline = {
  id: string;
  title: string;
  country: string;
  dueDate: string;
  notes?: string;
  source: "generated" | "manual";
};

type OnboardingAnswers = {
  citizenships?: string[];
  permitsByCountry?: Record<string, string[]>;
  abroadAssets?: string[];
  manualDeadlines?: ManualDeadline[];
  [key: string]: unknown;
};

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

const DEFAULT_THINKING_PHRASES = [
  "Analysing your profile...",
  "Reviewing your residency setup...",
  "Preparing your guidance...",
];
const DEEP_RESEARCH_LOADING_MESSAGE = "Running deep research — this may take 2–4 minutes…";
const EMPTY_STATE_PROMPTS = [
  "What are my main tax obligations?",
  "Am I at risk of becoming tax resident somewhere?",
  "When do my visas or permits expire?",
  "Do I have any foreign asset reporting obligations?",
];
const LOGGED_SOURCE_SPLITS = new Set<string>();

const COUNTRY_NAMES = [
  "united arab emirates",
  "united kingdom",
  "united states",
  "australia",
  "canada",
  "singapore",
  "germany",
  "france",
  "spain",
  "portugal",
  "italy",
  "switzerland",
  "ireland",
  "netherlands",
  "india",
  "china",
  "japan",
  "brazil",
  "mexico",
  "south africa",
  "new zealand",
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function daysRemaining(dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function nextOccurrence(month: number, day: number) {
  const now = new Date();
  const year = now.getFullYear();
  const first = new Date(year, month - 1, day);
  first.setHours(0, 0, 0, 0);
  if (first >= now) return first.toISOString();

  const next = new Date(year + 1, month - 1, day);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
}

function getUrgencyColor(days: number) {
  if (days <= 30) {
    return "bg-red-500/20 text-red-300 border border-red-400/30";
  }
  if (days <= 90) {
    return "bg-amber-500/20 text-amber-300 border border-amber-400/30";
  }
  return "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
}

function countryFlag(country: string) {
  const flags: Record<string, string> = {
    "United Arab Emirates": "🇦🇪",
    UAE: "🇦🇪",
    "United Kingdom": "🇬🇧",
    UK: "🇬🇧",
    "United States": "🇺🇸",
    US: "🇺🇸",
    Australia: "🇦🇺",
    Canada: "🇨🇦",
    Singapore: "🇸🇬",
    Germany: "🇩🇪",
    France: "🇫🇷",
    Spain: "🇪🇸",
    Portugal: "🇵🇹",
    Italy: "🇮🇹",
    Switzerland: "🇨🇭",
    Ireland: "🇮🇪",
    Netherlands: "🇳🇱",
  };

  return flags[country] ?? "🌍";
}

function normalizeCountry(value: string) {
  if (value === "UAE") return "United Arab Emirates";
  if (value === "UK") return "United Kingdom";
  if (value === "US") return "United States";
  return value;
}

function hasKeyword(text: string, keyword: string) {
  return new RegExp(`\\b${keyword}\\b`, "i").test(text);
}

function hasCountryName(text: string) {
  const lower = text.toLowerCase();
  return COUNTRY_NAMES.some((country) =>
    new RegExp(`\\b${country.replaceAll(" ", "\\s+")}\\b`, "i").test(lower),
  );
}

function getThinkingPhrases(message: string) {
  const phrases: string[] = [];
  const lower = message.toLowerCase();

  if (hasKeyword(lower, "tax") || hasKeyword(lower, "filing")) {
    phrases.push(
      "Cross-referencing your tax profile...",
      "Checking filing obligations...",
      "Calculating your tax exposure...",
    );
  }

  if (
    hasKeyword(lower, "visa") ||
    hasKeyword(lower, "permit") ||
    hasKeyword(lower, "residency")
  ) {
    phrases.push(
      "Checking your visa status...",
      "Reviewing residency requirements...",
      "Analysing permit obligations...",
    );
  }

  if (hasKeyword(lower, "deadline")) {
    phrases.push(
      "Scanning your compliance deadlines...",
      "Checking upcoming obligations...",
      "Reviewing your deadline calendar...",
    );
  }

  if (
    hasKeyword(lower, "pension") ||
    hasKeyword(lower, "super") ||
    hasKeyword(lower, "retirement")
  ) {
    phrases.push(
      "Reviewing your pension obligations...",
      "Checking contribution requirements...",
    );
  }

  if (hasCountryName(lower)) {
    phrases.push(
      "Pulling regulatory data...",
      "Checking cross-border rules...",
      "Reviewing country obligations...",
    );
  }

  return phrases.length > 0 ? phrases : DEFAULT_THINKING_PHRASES;
}

function stripTrailingDots(text: string) {
  return text.replace(/\.+$/, "");
}

function splitAssistantContent(content: string) {
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const sourcesHeadingOnlyPattern =
    /^(?:#{1,6}\s*)?(?:\*\*\s*)?sources(?:\s*\*\*)?\s*:?\s*$/i;
  const sourcesHeadingWithInlinePattern =
    /^(?:#{1,6}\s*)?(?:\*\*\s*)?sources(?:\s*\*\*)?\s*:\s*(.+)$/i;
  const sourcesLineIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    return (
      sourcesHeadingOnlyPattern.test(trimmed) || sourcesHeadingWithInlinePattern.test(trimmed)
    );
  });

  if (sourcesLineIndex === -1) {
    return {
      mainContent: normalized.trimEnd(),
      sourcesContent: "",
    };
  }

  const sourcesHeading = lines[sourcesLineIndex]?.trim() ?? "";
  const inlineSourceMatch = sourcesHeadingWithInlinePattern.exec(sourcesHeading);

  const mainContent = lines.slice(0, sourcesLineIndex).join("\n").trimEnd();
  const listAfterHeading = lines.slice(sourcesLineIndex + 1).join("\n").trim();
  const inlineSource = inlineSourceMatch?.[1]?.trim() ?? "";
  const sourcesContent = [inlineSource, listAfterHeading].filter(Boolean).join("\n").trim();
  if (sourcesContent) {
    const debugKey = `${mainContent.length}:${sourcesContent.length}`;
    if (!LOGGED_SOURCE_SPLITS.has(debugKey)) {
      // Temporary debug log to verify split behavior while integrating Sources panel UX.
      console.log("[dashboard] sources split", {
        mainPreview: mainContent.slice(0, 120),
        sourcesPreview: sourcesContent.slice(0, 120),
      });
      LOGGED_SOURCE_SPLITS.add(debugKey);
    }
  }

  return {
    mainContent,
    sourcesContent,
  };
}

function extractSourceItems(sourcesContent: string) {
  if (!sourcesContent.trim()) return [];

  const lines = sourcesContent
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const listItems = lines
    .map((line) => {
      const match = /^([-*+]|\d+\.)\s+(.+)$/.exec(line);
      return match?.[2]?.trim() ?? null;
    })
    .filter((item): item is string => Boolean(item));

  if (listItems.length > 0) return listItems;

  return lines;
}

function generateDeadlinesFromAnswers(answers: OnboardingAnswers): Deadline[] {
  const results: Deadline[] = [];
  const citizenships = answers.citizenships ?? [];
  const permitsByCountry = answers.permitsByCountry ?? {};
  const abroadAssets = answers.abroadAssets ?? [];

  if (citizenships.includes("United Kingdom")) {
    results.push({
      id: "uk-self-assessment",
      title: "UK Self Assessment Tax Return",
      country: "United Kingdom",
      dueDate: nextOccurrence(1, 31),
      source: "generated",
    });
  }

  if (citizenships.includes("United States")) {
    results.push({
      id: "us-fbar",
      title: "FBAR Filing Deadline",
      country: "United States",
      dueDate: nextOccurrence(4, 15),
      source: "generated",
    });
  }

  if (citizenships.includes("Australia")) {
    results.push({
      id: "au-tax-return",
      title: "Australian Tax Return",
      country: "Australia",
      dueDate: nextOccurrence(10, 31),
      source: "generated",
    });
  }

  const hasForeignAccounts =
    abroadAssets.includes("Bank accounts") ||
    abroadAssets.includes("Brokerage accounts");
  if (hasForeignAccounts) {
    results.push({
      id: "fatca-8938",
      title: "FATCA Form 8938",
      country: "United States",
      dueDate: nextOccurrence(4, 15),
      source: "generated",
    });
  }

  Object.keys(permitsByCountry).forEach((countryRaw) => {
    const country = normalizeCountry(countryRaw);
    const idBase = country.toLowerCase().replaceAll(" ", "-");

    if (country === "United Arab Emirates") {
      results.push({
        id: `visa-${idBase}`,
        title: "UAE Residence Visa Renewal",
        country,
        dueDate: nextOccurrence(12, 1),
        source: "generated",
      });
      return;
    }

    results.push({
      id: `permit-${idBase}`,
      title: `${country} Residence Permit Review`,
      country,
      dueDate: nextOccurrence(12, 1),
      source: "generated",
    });
  });

  return results;
}

export default function DashboardClient({
  userId,
  userEmail,
  hasProfile,
  onboardingAnswers,
  initialManualDeadlines,
}: {
  userId: string;
  userEmail: string;
  hasProfile: boolean;
  onboardingAnswers: OnboardingAnswers;
  initialManualDeadlines: ManualDeadline[];
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
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingConversationMessages, setIsLoadingConversationMessages] = useState(false);
  const [isDeepResearch, setIsDeepResearch] = useState(false);
  const [isDeepResearchHovered, setIsDeepResearchHovered] = useState(false);
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
  const [expandedSourcesByMessageId, setExpandedSourcesByMessageId] = useState<
    Record<string, boolean>
  >({});
  const [copiedSourceKey, setCopiedSourceKey] = useState<string | null>(null);
  const [copiedUserMessageId, setCopiedUserMessageId] = useState<string | null>(null);
  const [editingUserMessageId, setEditingUserMessageId] = useState<string | null>(null);
  const [editingUserMessageDraft, setEditingUserMessageDraft] = useState("");
  const [manualDeadlines, setManualDeadlines] =
    useState<ManualDeadline[]>(initialManualDeadlines);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    country: "",
    date: "",
    notes: "",
  });

  const generatedDeadlines = useMemo(
    () => generateDeadlinesFromAnswers(onboardingAnswers),
    [onboardingAnswers],
  );

  const allDeadlines = useMemo(() => {
    const manual = manualDeadlines.map((deadline) => ({
      ...deadline,
      source: "manual" as const,
    }));
    return [...generatedDeadlines, ...manual].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  }, [generatedDeadlines, manualDeadlines]);

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
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 20;
    const paddingY =
      Number.parseFloat(computedStyle.paddingTop) +
      Number.parseFloat(computedStyle.paddingBottom);
    const maxHeight = lineHeight * 5 + paddingY;
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

  async function loadConversations() {
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
  }, [supabase, userId]);

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

  function handleNewChat() {
    setMessages([]);
    activeConversationIdRef.current = null;
    setSelectedConversationId(null);
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

  async function saveManualDeadlines(nextManualDeadlines: ManualDeadline[]) {
    const nextAnswers = {
      ...onboardingAnswers,
      manualDeadlines: nextManualDeadlines,
    };

    const { error } = await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        onboarding_answers: nextAnswers,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  async function handleAddDeadline() {
    setErrorMessage("");
    if (!form.title || !form.country || !form.date) {
      setErrorMessage("Please complete title, country, and date.");
      return;
    }

    setIsSavingManual(true);

    try {
      const newDeadline: ManualDeadline = {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        country: form.country.trim(),
        dueDate: form.date,
        notes: form.notes.trim(),
      };

      const nextManualDeadlines = [...manualDeadlines, newDeadline];
      await saveManualDeadlines(nextManualDeadlines);
      setManualDeadlines(nextManualDeadlines);
      setForm({ title: "", country: "", date: "", notes: "" });
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
        <aside className="fixed inset-y-0 left-0 z-20 w-[260px] border-r border-white/12 bg-[#070707]/95 backdrop-blur-sm">
          <div className="flex h-full flex-col p-4">
            <p className="font-editorial text-xl tracking-[0.25em] text-[#d9d9d9]">NUVARE</p>
            <Button
              onClick={handleNewChat}
              className="mt-6 h-10 w-full border border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              New Chat
            </Button>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
              <p className="mb-3 text-xs uppercase tracking-[0.16em] text-white/45">
                Past chats
              </p>
              <div className="space-y-2">
                {isLoadingConversations ? (
                  <p className="text-xs text-white/50">Loading chats...</p>
                ) : chatSessions.length === 0 ? (
                  <p className="text-xs text-white/50">No past chats yet.</p>
                ) : (
                  chatSessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => void loadConversationMessages(session.id)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                        selectedConversationId === session.id
                          ? "border-white/30 bg-white/12 text-white"
                          : "border-white/12 bg-[#111111] text-white/85 hover:bg-white/10",
                      )}
                    >
                      {session.title}
                    </button>
                  ))
                )}
              </div>
            </div>

            <section className="mt-4 border-t border-white/10 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">Deadlines</p>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => {
                    setErrorMessage("");
                    setIsModalOpen(true);
                  }}
                  className="h-8 border border-white/20 bg-transparent px-2 text-xs text-white hover:bg-white/10"
                >
                  Add deadline
                </Button>
              </div>

              {allDeadlines.length === 0 ? (
                <div className="rounded-lg border border-white/12 bg-[#111111] p-3">
                  <p className="text-xs text-white/55">No deadlines tracked yet.</p>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => router.push("/onboarding")}
                    className="mt-3 h-8 w-full border border-white/20 bg-transparent text-xs text-white hover:bg-white/10"
                  >
                    Complete profile
                  </Button>
                </div>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {allDeadlines.map((deadline) => {
                    const days = daysRemaining(deadline.dueDate);
                    return (
                      <article
                        key={deadline.id}
                        className="rounded-lg border border-white/12 bg-[#111111] p-3"
                      >
                        <p className="text-xs text-white/90">
                          {countryFlag(deadline.country)} {deadline.title}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="text-[11px] text-white/50">{formatDate(deadline.dueDate)}</p>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px]",
                              getUrgencyColor(days),
                            )}
                          >
                            {days <= 0 ? "Due now" : `${days}d`}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-4 border-t border-white/10 pt-4">
              <p className="truncate text-xs text-white/55">{userEmail}</p>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="mt-2 h-9 w-full justify-start px-2 text-white/80 hover:bg-white/10 hover:text-white"
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </Button>
            </section>
          </div>
        </aside>

        <div className="ml-[260px] flex min-h-screen flex-col">
          <section className="flex h-screen flex-col px-6 py-6 md:px-10">
            {!hasProfile ? (
              <p className="mb-4 text-sm text-amber-300">
                Your profile is incomplete. Answers may be less personalized until onboarding is
                finished.
              </p>
            ) : null}

            <div
              ref={feedRef}
              onScroll={handleFeedScroll}
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
                        onClick={() => setInput(prompt)}
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
                            onClick={() => handleStartInlineEdit(message.id, message.content)}
                            className="inline-flex items-center p-0 text-sm text-white/55 transition-opacity hover:text-white hover:opacity-100"
                            aria-label="Edit message"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={() => void copyUserMessageText(message.id, message.content)}
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
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }: ComponentPropsWithoutRef<"h1">) => (
                                <h1 className="mb-3 text-lg font-semibold text-white">{children}</h1>
                              ),
                              h2: ({ children }: ComponentPropsWithoutRef<"h2">) => (
                                <h2 className="mb-2 text-base font-semibold text-white">{children}</h2>
                              ),
                              h3: ({ children }: ComponentPropsWithoutRef<"h3">) => (
                                <h3 className="mb-2 text-sm font-semibold text-white">{children}</h3>
                              ),
                              p: ({ children }: ComponentPropsWithoutRef<"p">) => (
                                <p className="mb-2 text-sm leading-6 text-white/90 last:mb-0">{children}</p>
                              ),
                              strong: ({ children }: ComponentPropsWithoutRef<"strong">) => (
                                <strong className="font-semibold text-white">{children}</strong>
                              ),
                              ul: ({ children }: ComponentPropsWithoutRef<"ul">) => (
                                <ul className="mb-2 list-disc space-y-1 pl-5 text-sm text-white/90">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }: ComponentPropsWithoutRef<"ol">) => (
                                <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm text-white/90">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }: ComponentPropsWithoutRef<"li">) => (
                                <li>{children}</li>
                              ),
                              hr: () => <hr className="my-3 border-white/15" />,
                              table: ({ children }: ComponentPropsWithoutRef<"table">) => (
                                <div className="my-2 overflow-x-auto">
                                  <table className="w-full border-collapse text-left text-sm text-white/90">
                                    {children}
                                  </table>
                                </div>
                              ),
                              thead: ({ children }: ComponentPropsWithoutRef<"thead">) => (
                                <thead className="bg-white/5 text-white">{children}</thead>
                              ),
                              tbody: ({ children }: ComponentPropsWithoutRef<"tbody">) => (
                                <tbody>{children}</tbody>
                              ),
                              tr: ({ children }: ComponentPropsWithoutRef<"tr">) => (
                                <tr className="border-b border-white/10 last:border-b-0">{children}</tr>
                              ),
                              th: ({ children }: ComponentPropsWithoutRef<"th">) => (
                                <th className="border border-white/10 px-2 py-1.5 font-medium">
                                  {children}
                                </th>
                              ),
                              td: ({ children }: ComponentPropsWithoutRef<"td">) => (
                                <td className="border border-white/10 px-2 py-1.5">{children}</td>
                              ),
                            }}
                          >
                            {mainContent}
                          </ReactMarkdown>

                          <div className="mt-3 flex items-center gap-2">
                            {sourceItems.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => toggleSourcesPanel(message.id)}
                                className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white"
                              >
                                📎 Sources
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() =>
                                void copySourceText(
                                  mainContent,
                                  `assistant-message-${message.id}`,
                                )
                              }
                              className="inline-flex items-center p-0 text-sm text-white/55 transition-opacity hover:text-white hover:opacity-100"
                              aria-label="Copy assistant message"
                              title="Copy"
                            >
                              {copiedSourceKey === `assistant-message-${message.id}`
                                ? "✓"
                                : "⧉"}
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
                                            onClick={() => void copySourceText(source, sourceKey)}
                                            className="shrink-0 rounded border border-white/15 bg-transparent px-1.5 py-0.5 text-[11px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                            aria-label={`Copy source ${index + 1}`}
                                            title={
                                              copiedSourceKey === sourceKey ? "Copied ✓" : "Copy"
                                            }
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
                              onChange={(event) => setEditingUserMessageDraft(event.target.value)}
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
                              onClick={handleCancelInlineEdit}
                              className="inline-flex h-7 items-center rounded border border-white/20 bg-transparent px-2.5 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleSaveInlineEdit(message.id)}
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

            <section className="p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 inline-flex shrink-0 items-center justify-center px-1 text-2xl text-white/45 transition-opacity hover:text-white/85 hover:opacity-100"
                  aria-label="Attach file"
                >
                  +
                </button>
                <div className="min-w-0 flex-1 rounded-xl border border-white/12 bg-[#101010] p-4">
                  {selectedUploadFile ? (
                    <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs text-white/80">
                      <span className="truncate">{selectedUploadFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedUploadFile(null)}
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
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask about tax, residency, filing obligations, or compliance deadlines..."
                    className="h-11 min-h-0 resize-none border-0 bg-transparent px-0 py-2 shadow-none focus-visible:ring-0"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void submitQuestion();
                      }
                    }}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={handleFilePickerSelection}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setIsDeepResearch((prev) => !prev)}
                      onMouseEnter={() => setIsDeepResearchHovered(true)}
                      onMouseLeave={() => setIsDeepResearchHovered(false)}
                      disabled={isLoading}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs transition-colors",
                        isDeepResearch
                          ? "border-white/35 bg-white/12 text-white"
                          : "border-white/15 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white/75",
                        isLoading ? "cursor-not-allowed opacity-60" : "",
                      )}
                      aria-pressed={isDeepResearch}
                      aria-label="Toggle deep research mode"
                      title="Deep research"
                    >
                      {isDeepResearch && isDeepResearchHovered ? (
                        <span>× Deep research</span>
                      ) : (
                        <>
                          <span aria-hidden>🔭</span>
                          <span>Deep research</span>
                        </>
                      )}
                    </button>
                    {isLoading ? (
                      <Button
                        onClick={() => void stopGeneration()}
                        className="h-9 w-9 px-0"
                        title="Stop"
                      >
                        ■
                      </Button>
                    ) : (
                      <Button
                        onClick={() => void submitQuestion()}
                        disabled={!input.trim()}
                        className="h-9 w-9 px-0"
                        title="Send"
                      >
                        ↑
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-white/45">Press Enter to send, Shift+Enter for new line.</p>
              <p className="mt-2 text-xs text-white/45">
                This is informational only, not legal or financial advice.
              </p>
              {errorMessage ? <p className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}
            </section>
          </section>
        </div>

        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-xl rounded-xl border border-white/15 bg-[#0d0d0d] p-6">
              <h3 className="font-editorial text-2xl text-white">Add deadline</h3>
              <p className="mt-2 text-sm text-white/50">
                Add a custom date to track alongside generated obligations.
              </p>

              <div className="mt-6 space-y-4">
                <Input
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Title"
                />
                <Input
                  value={form.country}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, country: event.target.value }))
                  }
                  placeholder="Country"
                />
                <Input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                />
                <Textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Notes"
                  className="min-h-24"
                />
              </div>

              {errorMessage ? (
                <p className="mt-4 text-sm text-red-300">{errorMessage}</p>
              ) : null}

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 border border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  onClick={handleAddDeadline}
                  disabled={isSavingManual}
                  className="h-10"
                >
                  {isSavingManual ? "Saving..." : "Save deadline"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <style jsx>{`
        .thinking-dots-loop {
          animation: thinking-dots-loop 1.15s linear infinite;
        }

        @keyframes thinking-dots-loop {
          0%,
          24.9% {
            width: 0ch;
          }
          25%,
          49.9% {
            width: 1ch;
          }
          50%,
          74.9% {
            width: 2ch;
          }
          75%,
          100% {
            width: 0ch;
          }
        }
      `}</style>
    </main>
  );
}
