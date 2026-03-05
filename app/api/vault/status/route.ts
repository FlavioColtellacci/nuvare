import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type ExtractedDate = {
  label: string;
  date: string;
  notes: string;
};

function normalizeExtractedDates(value: unknown): ExtractedDate[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ExtractedDate => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.label === "string" &&
      typeof candidate.date === "string" &&
      typeof candidate.notes === "string"
    );
  });
}

export async function GET(request: Request) {
  try {
    const documentId = new URL(request.url).searchParams.get("documentId")?.trim();
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

    const { data: document, error } = await supabase
      .from("documents")
      .select("processing_status, extracted_dates")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    return NextResponse.json({
      status: document.processing_status,
      extracted_dates: normalizeExtractedDates(document.extracted_dates),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch status." },
      { status: 500 },
    );
  }
}
