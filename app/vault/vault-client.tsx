"use client";

import {
  useCallback,
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  FileImage,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SubscriptionTier = "none" | "core" | "professional";

type ExtractedDate = {
  label: string;
  date: string;
  notes: string;
};

type VaultDocument = {
  id: string;
  file_name: string;
  file_type: string | null;
  created_at: string;
  processing_status: "pending" | "complete" | "error";
  extracted_dates: ExtractedDate[];
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function isExtractedDate(value: unknown): value is ExtractedDate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.label === "string" &&
    typeof candidate.date === "string" &&
    typeof candidate.notes === "string"
  );
}

function normalizeExtractedDates(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(isExtractedDate);
}

function normalizeDocumentRow(value: Record<string, unknown>): VaultDocument | null {
  const id = typeof value.id === "string" ? value.id : null;
  const fileName = typeof value.file_name === "string" ? value.file_name : null;
  const createdAt = typeof value.created_at === "string" ? value.created_at : null;
  const status =
    value.processing_status === "pending" ||
    value.processing_status === "complete" ||
    value.processing_status === "error"
      ? value.processing_status
      : null;

  if (!id || !fileName || !createdAt || !status) return null;

  return {
    id,
    file_name: fileName,
    file_type: typeof value.file_type === "string" ? value.file_type : null,
    created_at: createdAt,
    processing_status: status,
    extracted_dates: normalizeExtractedDates(value.extracted_dates),
  };
}

function formatUploadDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function isPdf(fileType: string | null) {
  return fileType === "application/pdf";
}

function statusBadge(document: VaultDocument) {
  if (document.processing_status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-2.5 py-1 text-xs text-white/75">
        <Loader2 className="h-3 w-3 animate-spin" />
        Processing...
      </span>
    );
  }

  if (document.processing_status === "error") {
    return (
      <span className="inline-flex rounded-full border border-red-400/25 bg-red-500/15 px-2.5 py-1 text-xs text-red-200">
        Error
      </span>
    );
  }

  if (document.extracted_dates.length > 0) {
    return (
      <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-200">
        Dates extracted
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs text-white/60">
      No dates found
    </span>
  );
}

export default function VaultClient({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pollersRef = useRef<Record<string, number>>({});
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier | null>(null);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedByDocumentId, setExpandedByDocumentId] = useState<Record<string, boolean>>({});
  const [addingByDocumentId, setAddingByDocumentId] = useState<Record<string, boolean>>({});

  const stopPolling = useCallback((documentId: string) => {
    const intervalId = pollersRef.current[documentId];
    if (!intervalId) return;
    window.clearInterval(intervalId);
    delete pollersRef.current[documentId];
  }, []);

  const updateDocumentById = useCallback(
    (documentId: string, updater: (doc: VaultDocument) => VaultDocument) => {
    setDocuments((prev) => prev.map((doc) => (doc.id === documentId ? updater(doc) : doc)));
    },
    [],
  );

  const startPolling = useCallback(
    (documentId: string) => {
      if (pollersRef.current[documentId]) return;

      pollersRef.current[documentId] = window.setInterval(async () => {
        try {
          const response = await fetch(
            `/api/vault/status?documentId=${encodeURIComponent(documentId)}`,
          );
          if (!response.ok) {
            return;
          }

          const payload = (await response.json()) as {
            status?: "pending" | "complete" | "error";
            extracted_dates?: unknown;
          };

          const nextStatus = payload.status;
          if (nextStatus !== "pending" && nextStatus !== "complete" && nextStatus !== "error") {
            return;
          }

          const nextExtractedDates = normalizeExtractedDates(payload.extracted_dates);
          updateDocumentById(documentId, (current) => ({
            ...current,
            processing_status: nextStatus,
            extracted_dates: nextExtractedDates,
          }));

          if (nextStatus === "complete" || nextStatus === "error") {
            stopPolling(documentId);
          }
        } catch {
          // Keep polling on transient failures.
        }
      }, 3000);
    },
    [stopPolling, updateDocumentById],
  );

  useEffect(() => {
    return () => {
      Object.values(pollersRef.current).forEach((intervalId) => {
        window.clearInterval(intervalId);
      });
      pollersRef.current = {};
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadVaultState() {
      setIsLoadingDocuments(true);
      setErrorMessage("");

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("subscription_tier")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (profileError) {
        setSubscriptionTier("none");
        setErrorMessage(profileError.message);
        setIsLoadingDocuments(false);
        return;
      }

      const tier = profile?.subscription_tier;
      const normalizedTier: SubscriptionTier =
        tier === "core" || tier === "professional" ? tier : "none";
      setSubscriptionTier(normalizedTier);

      if (normalizedTier !== "professional") {
        setIsLoadingDocuments(false);
        return;
      }

      const { data: docs, error: docsError } = await supabase
        .from("documents")
        .select("id, file_name, file_type, created_at, processing_status, extracted_dates")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (docsError) {
        setErrorMessage(docsError.message);
        setIsLoadingDocuments(false);
        return;
      }

      const normalizedDocs = (docs ?? [])
        .map((row) => normalizeDocumentRow(row as Record<string, unknown>))
        .filter((row): row is VaultDocument => Boolean(row));

      setDocuments(normalizedDocs);
      normalizedDocs
        .filter((doc) => doc.processing_status === "pending")
        .forEach((doc) => startPolling(doc.id));

      setIsLoadingDocuments(false);
    }

    void loadVaultState();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId, startPolling]);

  async function handleAddDatesToDashboard(documentId: string) {
    setSuccessMessage("");
    setErrorMessage("");
    setAddingByDocumentId((prev) => ({ ...prev, [documentId]: true }));
    try {
      const response = await fetch("/api/vault/add-deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; added?: number; error?: string }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Unable to add deadlines.");
      }

      setSuccessMessage(`Added ${payload.added ?? 0} date(s) to your dashboard.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to add deadlines.");
    } finally {
      setAddingByDocumentId((prev) => ({ ...prev, [documentId]: false }));
    }
  }

  async function handleDeleteDocument(documentId: string) {
    setSuccessMessage("");
    setErrorMessage("");
    const previous = documents;
    stopPolling(documentId);
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));

    try {
      const response = await fetch("/api/vault/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Unable to delete document.");
      }

      setSuccessMessage("Document deleted.");
    } catch (error) {
      setDocuments(previous);
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete document.");
    }
  }

  async function uploadFile(file: File) {
    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      setErrorMessage("Only PDF, JPG, JPEG, and PNG files are supported.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("Maximum file size is 10MB.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsUploading(true);

    const temporaryId = `temp-${Date.now()}`;
    const optimisticDocument: VaultDocument = {
      id: temporaryId,
      file_name: file.name,
      file_type: file.type,
      created_at: new Date().toISOString(),
      processing_status: "pending",
      extracted_dates: [],
    };

    setDocuments((prev) => [optimisticDocument, ...prev]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/vault/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string; document?: Record<string, unknown> }
        | null;

      if (!response.ok || !payload?.success || !payload.document) {
        throw new Error(payload?.error ?? "Upload failed.");
      }

      const normalizedDocument = normalizeDocumentRow(payload.document);
      if (!normalizedDocument) {
        throw new Error("Uploaded document payload is invalid.");
      }

      setDocuments((prev) =>
        prev.map((doc) => (doc.id === temporaryId ? normalizedDocument : doc)),
      );
      startPolling(normalizedDocument.id);
      setSuccessMessage("Document uploaded. Processing started.");
    } catch (error) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== temporaryId));
      setErrorMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleFilePickerChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    event.target.value = "";
    if (!nextFile) return;
    void uploadFile(nextFile);
  }

  async function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) return;
    await uploadFile(droppedFile);
  }

  if (subscriptionTier === null) {
    return (
      <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black text-white">
        <div className="onboarding-glow pointer-events-none absolute inset-0" />
        <div className="relative flex min-h-screen items-center justify-center">
          <p className="text-sm text-white/60">Loading vault...</p>
        </div>
      </main>
    );
  }

  if (subscriptionTier !== "professional") {
    return (
      <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black px-6 text-white">
        <div className="onboarding-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex min-h-screen max-w-4xl items-center justify-center">
          <section className="w-full rounded-2xl border border-white/20 bg-[#0a0a0a]/90 p-8 text-center">
            <h1 className="font-editorial text-5xl text-white">Document Vault</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/60">
              Securely store your passports, visas, and compliance documents. Available on the
              Professional plan.
            </p>
            <Link
              href="/pricing"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-medium text-black transition-opacity hover:opacity-90"
            >
              Upgrade to Professional →
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black px-6 py-10 text-white md:px-10">
      <div className="onboarding-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto w-full max-w-5xl">
        <h1 className="font-editorial text-5xl text-white">Document Vault</h1>
        <p className="mt-3 text-sm text-white/55">Your documents are encrypted and never shared.</p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(event) => {
            void handleDrop(event);
          }}
          disabled={isUploading}
          className={cn(
            "mt-8 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
            isDragActive
              ? "border-white/55 bg-white/10"
              : "border-white/20 bg-[#0d0d0d]/70 hover:border-white/35 hover:bg-[#121212]",
            isUploading ? "cursor-not-allowed opacity-70" : "",
          )}
        >
          <Upload className="h-8 w-8 text-white/80" />
          <p className="mt-4 text-sm text-white/90">Drop a document here, or click to upload</p>
          <p className="mt-2 text-xs text-white/50">
            PDF, JPG, PNG — passports, visas, tax certificates, permits, insurance
          </p>
          <p className="mt-2 text-xs text-white/45">Maximum file size: 10MB</p>
          {isUploading ? (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/65">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading...
            </p>
          ) : null}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={handleFilePickerChange}
        />

        {errorMessage ? <p className="mt-4 text-sm text-red-300">{errorMessage}</p> : null}
        {successMessage ? <p className="mt-4 text-sm text-emerald-300">{successMessage}</p> : null}

        <section className="mt-8">
          {isLoadingDocuments ? (
            <p className="text-sm text-white/55">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-white/55">
              No documents uploaded yet. Add your first document above.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {documents.map((document) => {
                const isExpanded = expandedByDocumentId[document.id] ?? false;
                const hasExtractedDates =
                  document.processing_status === "complete" && document.extracted_dates.length > 0;

                return (
                  <article
                    key={document.id}
                    className="relative rounded-xl border border-white/15 bg-[#0d0d0d] p-4"
                  >
                    <button
                      type="button"
                      onClick={() => void handleDeleteDocument(document.id)}
                      className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-[#121212] text-white/70 transition-colors hover:border-white/30 hover:text-white"
                      aria-label={`Delete ${document.file_name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-start gap-3 pr-9">
                      <div className="mt-0.5 rounded-md border border-white/15 bg-black/50 p-2 text-white/75">
                        {isPdf(document.file_type) ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <FileImage className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white">{document.file_name}</p>
                        <p className="mt-1 text-xs text-white/50">
                          Uploaded {formatUploadDate(document.created_at)}
                        </p>
                        <div className="mt-3">{statusBadge(document)}</div>
                      </div>
                    </div>

                    {hasExtractedDates ? (
                      <div className="mt-4 border-t border-white/12 pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedByDocumentId((prev) => ({
                              ...prev,
                              [document.id]: !prev[document.id],
                            }))
                          }
                          className="inline-flex items-center gap-1.5 text-xs text-white/75 transition-colors hover:text-white"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5" />
                              Hide dates
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5" />
                              View dates
                            </>
                          )}
                        </button>

                        {isExpanded ? (
                          <div className="mt-3 space-y-2 rounded-lg border border-white/12 bg-black/35 p-3">
                            {document.extracted_dates.map((dateItem, index) => (
                              <div key={`${document.id}-${index}`} className="text-xs text-white/80">
                                <span className="text-white">{dateItem.label}</span>
                                <span className="mx-2 text-white/40">•</span>
                                <span>{dateItem.date}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <Button
                          size="lg"
                          onClick={() => void handleAddDatesToDashboard(document.id)}
                          disabled={addingByDocumentId[document.id] === true}
                          className="mt-3 h-9 border border-white/20 bg-transparent text-xs text-white hover:bg-white/10"
                        >
                          {addingByDocumentId[document.id] ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Adding...
                            </span>
                          ) : (
                            "Add dates to Dashboard"
                          )}
                        </Button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
