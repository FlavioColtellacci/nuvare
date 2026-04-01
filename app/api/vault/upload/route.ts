import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json({ error: "A file is required." }, { status: 400 });
    }

    if (!ACCEPTED_MIME_TYPES.has(uploadedFile.type)) {
      return NextResponse.json(
        { error: "Only PDF, JPG, JPEG, and PNG files are supported." },
        { status: 400 },
      );
    }

    if (uploadedFile.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Maximum file size is 10MB." }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const sanitizedFilename = sanitizeFilename(uploadedFile.name);
    const storagePath = `${user.id}/${Date.now()}_${sanitizedFilename}`;
    const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());

    const { error: uploadError } = await adminSupabase.storage
      .from("vault")
      .upload(storagePath, fileBuffer, {
        contentType: uploadedFile.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: document, error: insertError } = await adminSupabase
      .from("documents")
      .insert({
        user_id: user.id,
        file_name: uploadedFile.name,
        file_path: storagePath,
        file_type: uploadedFile.type,
        file_size: uploadedFile.size,
        processing_status: "pending",
      })
      .select("*")
      .single();

    if (insertError || !document) {
      await adminSupabase.storage.from("vault").remove([storagePath]);
      return NextResponse.json(
        { error: insertError?.message ?? "Unable to save document." },
        { status: 500 },
      );
    }

    const extractUrl = new URL("/api/vault/extract", request.url);
    void fetch(extractUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ documentId: document.id }),
    }).catch(() => null);

    return NextResponse.json({ success: true, document });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected upload error." },
      { status: 500 },
    );
  }
}
