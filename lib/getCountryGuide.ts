import { createClient } from "@supabase/supabase-js";

type PerplexityChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function slugToDisplayName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildPrompt(countryName: string) {
  return `Provide a structured regulatory intelligence guide for ${countryName}. Cover these sections with clear headers: 1) Tax Residency Rules 2) Visa & Immigration 3) Banking & Finance 4) Real Estate 5) Key Obligations & Deadlines. Be factual, specific and current.`;
}

export async function getCountryGuide(
  slug: string,
): Promise<{ content: string; updatedAt: string; countryName: string }> {
  const countryName = slugToDisplayName(slug);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: freshRow, error: readError } = await supabase
    .from("country_guides")
    .select("*")
    .eq("slug", slug)
    .gt("updated_at", twentyFourHoursAgo)
    .limit(1)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  if (freshRow?.content && freshRow?.updated_at) {
    return {
      content: freshRow.content as string,
      updatedAt: freshRow.updated_at as string,
      countryName: (freshRow.country_name as string | null) ?? countryName,
    };
  }

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "user", content: buildPrompt(countryName) }],
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to fetch country intelligence.");
  }

  const payload = (await response.json()) as PerplexityChatResponse;
  const content = payload.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    throw new Error("Unable to fetch country intelligence.");
  }

  const updatedAt = new Date().toISOString();
  const { error: upsertError } = await supabase.from("country_guides").upsert(
    {
      slug,
      country_name: countryName,
      content,
      updated_at: updatedAt,
    },
    { onConflict: "slug" },
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return { content, updatedAt, countryName };
}
