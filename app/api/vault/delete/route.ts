import { NextResponse } from "next/server";

import { logApiError } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type DeletePayload = {
  documentId?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as DeletePayload;
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

    const adminSupabase = createAdminClient();
    const { data: document, error: readError } = await adminSupabase
      .from("documents")
      .select("id, file_path")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) {
      logApiError("/api/vault/delete", readError, { phase: "document_read" });
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }

    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (typeof document.file_path === "string" && document.file_path.length > 0) {
      await adminSupabase.storage.from("vault").remove([document.file_path]);
    }

    const { error: deleteError } = await adminSupabase
      .from("documents")
      .delete()
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (deleteError) {
      logApiError("/api/vault/delete", deleteError, { phase: "document_delete" });
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError("/api/vault/delete", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete document." },
      { status: 500 },
    );
  }
}
