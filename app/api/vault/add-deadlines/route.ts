import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type ExtractedDate = {
  label: string;
  date: string;
  notes: string;
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

    const deadlineRows = extractedDates.map((extracted) => ({
      user_id: user.id,
      title: extracted.label,
      due_date: extracted.date,
      category: "Document",
    }));

    if (deadlineRows.length === 0) {
      return NextResponse.json({ success: true, added: 0 });
    }

    const { error: insertError } = await supabase.from("deadlines").insert(deadlineRows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, added: deadlineRows.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add deadlines." },
      { status: 500 },
    );
  }
}
