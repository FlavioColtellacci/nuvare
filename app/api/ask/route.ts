import { NextResponse } from "next/server";

import {
  extractUserCountries,
  getLatestUserQuestion,
  normalizeAskMessages,
} from "@/lib/ai/messages";
import { getMinimaxConfig } from "@/lib/ai/minimax";
import { runMinimaxAskOrchestration } from "@/lib/ai/orchestrator";
import { fetchPerplexityRegulatoryContext } from "@/lib/ai/perplexity";
import type { ToolHandlerContext } from "@/lib/ai/tools/handlers";
import type { AskPayload, OnboardingAnswers } from "@/lib/ai/types";
import { logApiError, logApiEvent } from "@/lib/log";
import { enforceAskRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const minimaxCfg = getMinimaxConfig();
    if (!minimaxCfg.apiKey) {
      return NextResponse.json(
        { error: "Missing MINIMAX_API_KEY." },
        { status: 500 },
      );
    }

    const perplexityApiKey = process.env.PERPLEXITY_API_KEY?.trim();
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

    const rateLimited = await enforceAskRateLimit(request, user?.id ?? null);
    if (rateLimited) {
      return rateLimited;
    }

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

    let preloadedRegulatoryContext: string | null = null;
    if (deepResearch) {
      logApiEvent("/api/ask", "perplexity_prefetch", { mode: "deep_research" });
      const { context } = await fetchPerplexityRegulatoryContext(
        latestQuestion,
        userCountries,
        perplexityApiKey,
        true,
      );
      preloadedRegulatoryContext = context;
    }

    const toolContext: ToolHandlerContext = {
      supabase,
      userId: user.id,
      onboardingAnswers,
      perplexityApiKey,
    };

    const readableStream = await runMinimaxAskOrchestration({
      model: minimaxCfg.model,
      conversation: messages,
      toolContext,
      preloadedRegulatoryContext,
      deepResearchPrefetch: deepResearch,
    });

    return new Response(readableStream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    logApiError("/api/ask", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected error while asking AI.",
      },
      { status: 500 },
    );
  }
}
