import { buildCountryGuidePrompt } from "@/lib/ai/prompts";
import { getPerplexityMessageContent, perplexityChatCompletion } from "@/lib/ai/perplexity";
import { createAdminClient } from "@/lib/supabase/admin";

const COUNTRY_GUIDE_ERROR = "Unable to fetch country intelligence.";

function slugToDisplayName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function getCountryGuide(
  slug: string,
): Promise<{ content: string; updatedAt: string; countryName: string }> {
  const countryName = slugToDisplayName(slug);
  const supabase = createAdminClient();

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

  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  if (!perplexityApiKey) {
    throw new Error(COUNTRY_GUIDE_ERROR);
  }

  const payload = await perplexityChatCompletion(
    perplexityApiKey,
    {
      model: "sonar",
      messages: [{ role: "user", content: buildCountryGuidePrompt(countryName) }],
    },
    { httpErrorMessage: COUNTRY_GUIDE_ERROR },
  );

  const content = getPerplexityMessageContent(payload, COUNTRY_GUIDE_ERROR);

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
