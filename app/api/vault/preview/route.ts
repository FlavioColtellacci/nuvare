import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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

    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("file_path, file_type, file_name")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (documentError) {
      return NextResponse.json({ error: documentError.message }, { status: 500 });
    }

    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (!document.file_path || typeof document.file_path !== "string") {
      return NextResponse.json({ error: "Document file path is invalid." }, { status: 500 });
    }

    const { data: signed, error: signedUrlError } = await supabase.storage
      .from("vault")
      .createSignedUrl(document.file_path, 300);

    if (signedUrlError || !signed?.signedUrl) {
      return NextResponse.json(
        { error: signedUrlError?.message ?? "Unable to generate preview URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      signedUrl: signed.signedUrl,
      file_type: typeof document.file_type === "string" ? document.file_type : null,
      file_name: typeof document.file_name === "string" ? document.file_name : "Document",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to prepare preview." },
      { status: 500 },
    );
  }
}
