import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import {
  extractUserCountries,
  getLatestUserQuestion,
  normalizeAskMessages,
} from "@/lib/ai/messages";
import { buildAskSystemPrompt } from "@/lib/ai/prompts";
import { fetchPerplexityRegulatoryContext } from "@/lib/ai/perplexity";
import type { AskPayload, OnboardingAnswers } from "@/lib/ai/types";
import { createClient } from "@/lib/supabase/server";

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
    const deepResearch = payload.deepResearch === true;
    const messages = normalizeAskMessages(incomingMessages);

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
      deepResearch,
    );

    const anthropic = new Anthropic({ apiKey });
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: buildAskSystemPrompt(onboardingAnswers, currentRegulatoryContext),
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

    return new Response(readableStream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
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
