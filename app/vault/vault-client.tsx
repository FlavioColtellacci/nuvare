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
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Eye,
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
const SKIP_DELETE_CONFIRM_STORAGE_KEY = "vault_skip_delete_confirm";

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

function isImage(fileType: string | null) {
  return fileType === "image/jpeg" || fileType === "image/png";
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
  const [previewLoadingByDocumentId, setPreviewLoadingByDocumentId] = useState<
    Record<string, boolean>
  >({});
  const [previewDocument, setPreviewDocument] = useState<{
    signedUrl: string;
    fileType: string | null;
    fileName: string;
  } | null>(null);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  const [deleteConfirmationDocument, setDeleteConfirmationDocument] = useState<{
    id: string;
    fileName: string;
  } | null>(null);
  const [rememberDeleteChoice, setRememberDeleteChoice] = useState(false);
  const [isConfirmDeleting, setIsConfirmDeleting] = useState(false);

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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewDocument(null);
        setDeleteConfirmationDocument(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    try {
      const storedPreference = window.localStorage.getItem(SKIP_DELETE_CONFIRM_STORAGE_KEY);
      setSkipDeleteConfirm(storedPreference === "true");
    } catch {
      setSkipDeleteConfirm(false);
    }
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

  function requestDeleteDocument(documentId: string, fileName: string) {
    if (skipDeleteConfirm) {
      void handleDeleteDocument(documentId);
      return;
    }

    setRememberDeleteChoice(false);
    setDeleteConfirmationDocument({ id: documentId, fileName });
  }

  async function handleConfirmDelete() {
    if (!deleteConfirmationDocument || isConfirmDeleting) return;

    if (rememberDeleteChoice) {
      try {
        window.localStorage.setItem(SKIP_DELETE_CONFIRM_STORAGE_KEY, "true");
      } catch {
        // Ignore storage write failures.
      }
      setSkipDeleteConfirm(true);
    }

    const nextDocumentId = deleteConfirmationDocument.id;
    setDeleteConfirmationDocument(null);
    setRememberDeleteChoice(false);
    setIsConfirmDeleting(true);

    try {
      await handleDeleteDocument(nextDocumentId);
    } finally {
      setIsConfirmDeleting(false);
    }
  }

  function handleCancelDelete() {
    if (isConfirmDeleting) return;

    if (rememberDeleteChoice) {
      try {
        window.localStorage.setItem(SKIP_DELETE_CONFIRM_STORAGE_KEY, "false");
      } catch {
        // Ignore storage write failures.
      }
      setSkipDeleteConfirm(false);
    }

    setDeleteConfirmationDocument(null);
    setRememberDeleteChoice(false);
  }

  async function handlePreviewDocument(documentId: string) {
    setErrorMessage("");
    setPreviewLoadingByDocumentId((prev) => ({ ...prev, [documentId]: true }));

    try {
      const response = await fetch(`/api/vault/preview?documentId=${encodeURIComponent(documentId)}`);
      const payload = (await response.json().catch(() => null)) as
        | {
            signedUrl?: string;
            file_type?: string | null;
            file_name?: string;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.signedUrl) {
        throw new Error(payload?.error ?? "Unable to preview document.");
      }

      setPreviewDocument({
        signedUrl: payload.signedUrl,
        fileType: typeof payload.file_type === "string" ? payload.file_type : null,
        fileName: payload.file_name ?? "Document",
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to preview document.");
    } finally {
      setPreviewLoadingByDocumentId((prev) => ({ ...prev, [documentId]: false }));
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
      setSuccessMessage("Document uploaded securely.");
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
    <main className="onboarding-bg relative min-h-screen overflow-x-hidden bg-black px-4 py-10 text-white sm:px-6 md:px-10">
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
            "mt-8 flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
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

        <section className="mt-8 w-full min-w-0">
          {isLoadingDocuments ? (
            <p className="text-sm text-white/55">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-white/55">
              No documents uploaded yet. Add your first document above.
            </p>
          ) : (
            <div className="grid w-full min-w-0 gap-4 md:grid-cols-2">
              {documents.map((document) => {
                const isExpanded = expandedByDocumentId[document.id] ?? false;
                const hasExtractedDates = document.extracted_dates.length > 0;
                const isPreviewLoading = previewLoadingByDocumentId[document.id] === true;
                const isTemporaryDocument = document.id.startsWith("temp-");

                return (
                  <article
                    key={document.id}
                    className="relative w-full min-w-0 cursor-pointer overflow-hidden rounded-xl bg-white/[0.03] p-4"
                  >
                    <div className="absolute right-3 top-3 inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handlePreviewDocument(document.id)}
                        disabled={isPreviewLoading || isTemporaryDocument}
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-[#121212] text-white/70 transition-colors",
                          isTemporaryDocument
                            ? "cursor-not-allowed opacity-40"
                            : "cursor-pointer hover:border-white/30 hover:text-white",
                          isPreviewLoading && !isTemporaryDocument
                            ? "cursor-not-allowed opacity-70"
                            : "",
                        )}
                        aria-label={`Preview ${document.file_name}`}
                      >
                        {isPreviewLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDeleteDocument(document.id, document.file_name)}
                        disabled={isTemporaryDocument}
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-[#121212] text-white/70 transition-colors",
                          isTemporaryDocument
                            ? "cursor-not-allowed opacity-40"
                            : "cursor-pointer hover:border-white/30 hover:text-white",
                        )}
                        aria-label={`Delete ${document.file_name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-start gap-3 pr-20">
                      <div className="mt-0.5 rounded-md border border-white/15 bg-black/50 p-2 text-white/75">
                        {isPdf(document.file_type) ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <FileImage className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <p
                          className="truncate overflow-hidden text-sm text-white"
                          title={document.file_name}
                        >
                          {document.file_name}
                        </p>
                        <p className="mt-1 text-xs text-white/50">
                          Uploaded {formatUploadDate(document.created_at)}
                        </p>
                        <div className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-200">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                          Uploaded securely
                        </div>
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
                          className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-white/75 transition-colors hover:text-white"
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
      {previewDocument ? (
        <div
          className="fixed inset-0 z-50 bg-black/80"
          onClick={() => setPreviewDocument(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${previewDocument.fileName}`}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setPreviewDocument(null);
            }}
            className="absolute top-4 right-4 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close preview"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: "none" }}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div
            className="absolute inset-x-0 top-4 flex justify-center px-16"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="inline-flex max-w-[90vw] items-center gap-3 rounded-md bg-black/60 px-3 py-1.5 text-xs text-zinc-300">
              <span className="truncate">{previewDocument.fileName}</span>
              {isPdf(previewDocument.fileType) ? (
                <a
                  href={previewDocument.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="whitespace-nowrap text-zinc-300 underline underline-offset-2 hover:text-white"
                >
                  Open in new tab
                </a>
              ) : null}
            </div>
          </div>

          <div
            className="flex min-h-screen items-center justify-center p-6 pt-20"
            onClick={(event) => event.stopPropagation()}
          >
            {isPdf(previewDocument.fileType) ? (
              <iframe
                src={previewDocument.signedUrl}
                title={previewDocument.fileName}
                className="h-[85vh] w-[90vw] rounded-md border border-white/20 bg-white"
              />
            ) : isImage(previewDocument.fileType) ? (
              <Image
                src={previewDocument.signedUrl}
                alt={previewDocument.fileName}
                width={1200}
                height={1600}
                unoptimized
                className="max-h-screen max-w-3xl object-contain"
              />
            ) : (
              <a
                href={previewDocument.signedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-zinc-200 underline underline-offset-2 hover:text-white"
              >
                Open document in new tab
              </a>
            )}
          </div>
        </div>
      ) : null}
      {deleteConfirmationDocument ? (
        <div
          className="fixed inset-0 z-[60] bg-black/80"
          onClick={handleCancelDelete}
          role="dialog"
          aria-modal="true"
          aria-label="Delete document confirmation"
        >
          <div
            className="mx-auto mt-[15vh] w-[min(92vw,28rem)] rounded-2xl border border-white/20 bg-[#0d0d0d] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-medium text-white">Delete document?</h2>
            <p className="mt-2 text-sm text-zinc-300">
              This will permanently remove {deleteConfirmationDocument.fileName} from your vault.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={isConfirmDeleting}
                className="inline-flex h-9 items-center justify-center rounded-md border border-white/25 px-4 text-sm text-white/85 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={isConfirmDeleting}
                className="inline-flex h-9 items-center justify-center rounded-md border border-red-200/30 bg-white/95 px-4 text-sm text-red-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isConfirmDeleting ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Delete
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>

            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={rememberDeleteChoice}
                onChange={(event) => setRememberDeleteChoice(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/30 bg-black/50"
              />
              Remember my choice
            </label>
          </div>
        </div>
      ) : null}
    </main>
  );
}
