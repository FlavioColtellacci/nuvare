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

function buildSystemPrompt(onboardingAnswers: OnboardingAnswers) {
  return [
    "You are Nuvare AI, a careful cross-border compliance assistant.",
    "Personalize every answer to the user using their onboarding profile context below.",
    "If required details are missing, ask concise follow-up questions before giving definitive guidance.",
    "Never claim to be a lawyer or financial advisor. Be practical and structured.",
    "Onboarding profile context (JSON):",
    JSON.stringify(onboardingAnswers, null, 2),
  ].join("\n\n");
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing ANTHROPIC_API_KEY." },
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
    const anthropic = new Anthropic({ apiKey });
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      system: buildSystemPrompt(onboardingAnswers),
      messages,
    });
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const text of stream.textStream) {
            if (!text) continue;
            controller.enqueue(encoder.encode(text));
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
