import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type ExtractedDate = {
  label: string;
  date: string;
  notes: string;
};

type ManualDeadline = {
  id: string;
  title: string;
  country: string;
  dueDate: string;
  notes?: string;
};

type OnboardingAnswers = {
  manualDeadlines?: ManualDeadline[];
  [key: string]: unknown;
};

type AddDeadlinesPayload = {
  documentId?: string;
};

function isExtractedDate(value: unknown): value is ExtractedDate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.label === "string" &&
    typeof candidate.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.date) &&
    typeof candidate.notes === "string"
  );
}

function normalizeManualDeadlines(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ManualDeadline => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.title === "string" &&
      typeof candidate.country === "string" &&
      typeof candidate.dueDate === "string"
    );
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AddDeadlinesPayload;
    const documentId = payload.documentId?.trim();
    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("extracted_dates")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (documentError) {
      return NextResponse.json({ error: documentError.message }, { status: 500 });
    }
    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const extractedDatesRaw = Array.isArray(document.extracted_dates) ? document.extracted_dates : [];
    const extractedDates = extractedDatesRaw.filter(isExtractedDate);

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("onboarding_answers")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const existingAnswers = (profile?.onboarding_answers as OnboardingAnswers | null) ?? {};
    const existingManualDeadlines = normalizeManualDeadlines(existingAnswers.manualDeadlines);

    const newManualDeadlines: ManualDeadline[] = extractedDates.map((extracted) => ({
      id: crypto.randomUUID(),
      title: extracted.label,
      country: "",
      dueDate: extracted.date,
      notes: extracted.notes,
    }));

    const updatedManualDeadlines = [...existingManualDeadlines, ...newManualDeadlines];
    const nextOnboardingAnswers: OnboardingAnswers = {
      ...existingAnswers,
      manualDeadlines: updatedManualDeadlines,
    };

    const { error: upsertError } = await supabase.from("user_profiles").upsert(
      {
        user_id: user.id,
        onboarding_answers: nextOnboardingAnswers,
      },
      { onConflict: "user_id" },
    );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, added: newManualDeadlines.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add deadlines." },
      { status: 500 },
    );
  }
}
