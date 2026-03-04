import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AskPayload = {
  messages?: ChatMessage[];
};

type OnboardingAnswers = Record<string, unknown>;
type PerplexityChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function normalizeMessages(messages: ChatMessage[]) {
  return messages
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function extractUserCountries(onboardingAnswers: OnboardingAnswers) {
  const countries = new Set<string>();
  const citizenships = onboardingAnswers.citizenships;
  if (Array.isArray(citizenships)) {
    for (const value of citizenships) {
      if (typeof value === "string" && value.trim()) {
        countries.add(value.trim());
      }
    }
  }

  const permitsByCountry = onboardingAnswers.permitsByCountry;
  if (permitsByCountry && typeof permitsByCountry === "object") {
    for (const key of Object.keys(permitsByCountry as Record<string, unknown>)) {
      if (key.trim()) {
        countries.add(key.trim());
      }
    }
  }

  return [...countries];
}

function getLatestUserQuestion(messages: { role: string; content: string }[]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") {
      return messages[i].content;
    }
  }
  return messages[messages.length - 1]?.content ?? "";
}

async function fetchPerplexityRegulatoryContext(
  question: string,
  countries: string[],
  apiKey: string,
) {
  const year = new Date().getFullYear();
  const countryScope = countries.length > 0 ? countries.join(", ") : "relevant jurisdictions";
  const searchQuery = `Current ${question} rules and regulations for ${countryScope} ${year}`;

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content:
            "You are a regulatory research assistant. Return concise, current regulatory facts with jurisdictions and dates where possible.",
        },
        {
          role: "user",
          content: searchQuery,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } | string }
      | null;
    const errorMessage =
      typeof errorPayload?.error === "string"
        ? errorPayload.error
        : errorPayload?.error?.message;
    throw new Error(errorMessage ?? "Unable to fetch live regulatory context.");
  }

  const payload = (await response.json()) as PerplexityChatResponse;
  const context = payload.choices?.[0]?.message?.content?.trim() ?? "";
  if (!context) {
    throw new Error("Perplexity returned empty regulatory context.");
  }

  return { context, searchQuery };
}

function buildSystemPrompt(
  onboardingAnswers: OnboardingAnswers,
  currentRegulatoryContext: string,
) {
  return [
    "You are Nuvare AI, a careful cross-border compliance assistant.",
    "Personalize every answer to the user using their onboarding profile context below.",
    "Prioritize the CURRENT REGULATORY CONTEXT below for up-to-date rules and cite it explicitly where relevant in your answer.",
    "If required details are missing, ask concise follow-up questions before giving definitive guidance.",
    "Never claim to be a lawyer or financial advisor. Be practical and structured.",
    "CURRENT REGULATORY CONTEXT:",
    currentRegulatoryContext,
    "Onboarding profile context (JSON):",
    JSON.stringify(onboardingAnswers, null, 2),
  ].join("\n\n");
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing ANTHROPIC_API_KEY." },
        { status: 500 },
      );
    }
    if (!perplexityApiKey) {
      return NextResponse.json(
        { error: "Missing PERPLEXITY_API_KEY." },
        { status: 500 },
      );
    }

    const payload = (await request.json()) as AskPayload;
    const incomingMessages = Array.isArray(payload.messages) ? payload.messages : [];
    const messages = normalizeMessages(incomingMessages);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "At least one message is required." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_answers")
      .eq("user_id", user.id)
      .maybeSingle();

    const onboardingAnswers =
      (profile?.onboarding_answers as OnboardingAnswers | null) ?? {};
    const userCountries = extractUserCountries(onboardingAnswers);
    const latestQuestion = getLatestUserQuestion(messages);
    const { context: currentRegulatoryContext } = await fetchPerplexityRegulatoryContext(
      latestQuestion,
      userCountries,
      perplexityApiKey,
    );

    const anthropic = new Anthropic({ apiKey });
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      system: buildSystemPrompt(onboardingAnswers, currentRegulatoryContext),
      messages,
    });
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (streamError) {
          controller.error(streamError);
        }
      },
      cancel() {
        stream.abort();
      },
    });

    const response = new Response(readableStream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected error while asking AI.",
      },
      { status: 500 },
    );
  }
}
