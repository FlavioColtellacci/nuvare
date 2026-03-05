import { NextResponse } from "next/server";

import { COUNTRIES } from "@/app/countries/countries-data";
import { createClient } from "@/lib/supabase/server";

type PerplexityChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function buildPrompt(countryName: string) {
  return `Provide a structured regulatory intelligence guide for ${countryName} covering these sections: 1) Tax Residency Rules (triggers, day counts, tests) 2) Visa & Immigration (main visa types, long-stay permits, golden visa/investor routes) 3) Banking & Finance (ease of opening accounts, restrictions for non-residents) 4) Real Estate (can foreigners buy, key rules, taxes on purchase/sale) 5) Key Obligations & Deadlines (filing deadlines, reporting requirements, penalties). Be factual, specific, and current. Format with clear section headers.`;
}

async function fetchGuideFromPerplexity(countryName: string, apiKey: string) {
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
            "You are a regulatory intelligence assistant. Provide accurate, current and structured compliance guidance.",
        },
        {
          role: "user",
          content: buildPrompt(countryName),
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
    throw new Error(errorMessage ?? "Unable to fetch country intelligence.");
  }

  const payload = (await response.json()) as PerplexityChatResponse;
  const content = payload.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    throw new Error("Perplexity returned empty country guide content.");
  }

  return content;
}

export async function GET(
  _request: Request,
  context: { params: { slug: string } },
) {
  try {
    const { slug } = context.params;
    const country = COUNTRIES.find((item) => item.slug === slug);
    if (!country) {
      return NextResponse.json({ error: "Country not found." }, { status: 404 });
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
      .select("subscription_tier")
      .eq("user_id", user.id)
      .maybeSingle();

    const hasActiveSubscription =
      profile?.subscription_tier === "core" || profile?.subscription_tier === "professional";
    if (!hasActiveSubscription) {
      return NextResponse.json({ error: "Subscription required." }, { status: 403 });
    }

    // TODO: Create `country_guides` in Supabase with columns:
    // id (uuid), slug (text unique), country_name (text), content (text), updated_at (timestamptz).
    const { data: existingGuide, error: readError } = await supabase
      .from("country_guides")
      .select("slug, country_name, content, updated_at")
      .eq("slug", slug)
      .maybeSingle();

    if (readError) {
      throw new Error(readError.message);
    }

    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const existingUpdatedAt = existingGuide?.updated_at
      ? new Date(existingGuide.updated_at).getTime()
      : 0;
    const hasFreshCachedGuide =
      Boolean(existingGuide?.content) &&
      Number.isFinite(existingUpdatedAt) &&
      existingUpdatedAt > twentyFourHoursAgo;

    if (hasFreshCachedGuide && existingGuide?.content && existingGuide?.updated_at) {
      return NextResponse.json({
        content: existingGuide.content,
        updatedAt: existingGuide.updated_at,
      });
    }

    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityApiKey) {
      return NextResponse.json({ error: "Missing PERPLEXITY_API_KEY." }, { status: 500 });
    }

    const content = await fetchGuideFromPerplexity(country.name, perplexityApiKey);
    const updatedAt = new Date().toISOString();

    const { error: upsertError } = await supabase.from("country_guides").upsert(
      {
        slug,
        country_name: country.name,
        content,
        updated_at: updatedAt,
      },
      { onConflict: "slug" },
    );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    return NextResponse.json({ content, updatedAt });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected error while loading country guide.",
      },
      { status: 500 },
    );
  }
}
