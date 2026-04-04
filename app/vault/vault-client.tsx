"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppHeader } from "@/components/app-header";
import { VaultDeleteDialog } from "@/app/vault/_components/vault-delete-dialog";
import { VaultDocumentList } from "@/app/vault/_components/vault-document-list";
import { VaultFeedbackMessages } from "@/app/vault/_components/vault-feedback-messages";
import {
  VaultLoadingShell,
  VaultProfessionalUpsell,
} from "@/app/vault/_components/vault-gate";
import { VaultPreviewModal } from "@/app/vault/_components/vault-preview-modal";
import { VaultUploadArea } from "@/app/vault/_components/vault-upload-area";
import {
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  SKIP_DELETE_CONFIRM_STORAGE_KEY,
} from "@/app/vault/_lib/constants";
import type {
  DeleteConfirmationState,
  PreviewDocumentState,
  VaultDocument,
} from "@/app/vault/_lib/types";
import { normalizeDocumentRow } from "@/app/vault/_lib/utils";
import { useVaultDocuments } from "@/app/vault/_lib/use-vault-documents";
import type { DashboardDeadline } from "@/app/home/_lib/types";
import { createClient } from "@/lib/supabase/client";

export default function VaultClient({ userId }: { userId: string }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const {
    subscriptionTier,
    documents,
    setDocuments,
    isLoadingDocuments,
    errorMessage,
    setErrorMessage,
    startPolling,
    stopPolling,
  } = useVaultDocuments(userId);

  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedByDocumentId, setExpandedByDocumentId] = useState<Record<string, boolean>>(
    {},
  );
  const [addingByDocumentId, setAddingByDocumentId] = useState<Record<string, boolean>>({});
  const [previewLoadingByDocumentId, setPreviewLoadingByDocumentId] = useState<
    Record<string, boolean>
  >({});
  const [previewDocument, setPreviewDocument] = useState<PreviewDocumentState | null>(null);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  const [deleteConfirmationDocument, setDeleteConfirmationDocument] =
    useState<DeleteConfirmationState | null>(null);
  const [rememberDeleteChoice, setRememberDeleteChoice] = useState(false);
  const [isConfirmDeleting, setIsConfirmDeleting] = useState(false);
  const [initialDeadlines, setInitialDeadlines] = useState<DashboardDeadline[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadDeadlines() {
      const { data } = await supabase
        .from("deadlines")
        .select("id, title, due_date, category")
        .eq("user_id", userId)
        .order("due_date", { ascending: true });
      if (cancelled) return;
      const deadlines: DashboardDeadline[] = (data ?? []).map((d) => ({
        id: d.id as string,
        title: d.title as string,
        dueDate: d.due_date as string,
        category: (d.category as string | null) ?? "",
      }));
      setInitialDeadlines(deadlines);
    }
    void loadDeadlines();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

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
      const response = await fetch(
        `/api/vault/preview?documentId=${encodeURIComponent(documentId)}`,
      );
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

  const uploadFile = useCallback(
    async (file: File) => {
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
    },
    [setDocuments, setErrorMessage, startPolling],
  );

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

  const toggleExpanded = useCallback((documentId: string) => {
    setExpandedByDocumentId((prev) => ({
      ...prev,
      [documentId]: !prev[documentId],
    }));
  }, []);

  if (subscriptionTier === null) {
    return <VaultLoadingShell />;
  }

  if (subscriptionTier !== "professional") {
    return <VaultProfessionalUpsell />;
  }

  function getUrgencyBadge(dueDate: string) {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysUntil < 7) {
      return (
        <span className="px-2 py-1 bg-[#93000a] text-[#ffb4ab] text-[10px] font-bold uppercase tracking-tighter">
          Critical
        </span>
      );
    }
    if (daysUntil < 30) {
      return (
        <span className="px-2 py-1 bg-[#33343b] text-white text-[10px] font-bold uppercase tracking-tighter">
          Soon
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-[#1e1f26] text-[#c4c7c8] text-[10px] font-bold uppercase tracking-tighter">
        Planned
      </span>
    );
  }

  return (
    <main className="bg-[#111319] min-h-screen text-white">
      <AppHeader />
      <div className="pt-24 pb-20 px-12 max-w-[1600px] mx-auto">
        {/* Hero section */}
        <section className="mb-16">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-5xl font-extrabold tracking-tight uppercase text-white mb-4">
                Document Vault
              </h1>
              <p className="text-xs uppercase tracking-[0.2em] text-[#c4c7c8] max-w-xl">
                Quantum-resistant encryption for your sovereign identity. Precision extraction by Neural-Auditor™ Engine.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                className="px-6 py-3 border border-white/20 hover:bg-[#1e1f26] transition-all flex items-center gap-2 text-xs uppercase tracking-widest text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                </svg>
                Grid
              </button>
              <button
                type="button"
                className="px-6 py-3 bg-white text-[#111319] hover:opacity-90 transition-all flex items-center gap-2 text-xs uppercase tracking-widest font-bold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                Filter
              </button>
            </div>
          </div>
        </section>

        {/* Feedback messages */}
        <VaultFeedbackMessages errorMessage={errorMessage} successMessage={successMessage} />

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-8">

          {/* Upload area */}
          <div className="col-span-12 lg:col-span-8">
            <VaultUploadArea
              fileInputRef={fileInputRef}
              isUploading={isUploading}
              isDragActive={isDragActive}
              onDragActiveChange={setIsDragActive}
              onPickClick={() => fileInputRef.current?.click()}
              onFileChange={handleFilePickerChange}
              onDrop={handleDrop}
            />
          </div>

          {/* Compliance Clock sidebar */}
          <div className="col-span-12 lg:col-span-4 bg-[#191b22] p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-['Inter'] text-xs uppercase tracking-[0.2em] font-bold text-white">
                  Compliance Clock
                </h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="space-y-6">
                {initialDeadlines.slice(0, 3).map((deadline) => (
                  <div key={deadline.id} className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-[#c4c7c8] mb-1">
                        {deadline.title}
                      </div>
                      <div className="text-xl font-bold text-white">
                        {new Date(deadline.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    {getUrgencyBadge(deadline.dueDate)}
                  </div>
                ))}
                {initialDeadlines.length === 0 && (
                  <p className="text-[#c4c7c8] text-sm">No upcoming deadlines.</p>
                )}
              </div>
            </div>
            <button
              type="button"
              className="w-full py-4 mt-8 bg-[#111319] text-white border border-white/10 hover:bg-[#191b22] transition-all text-xs font-bold tracking-widest uppercase"
            >
              View Full Audit Trail
            </button>
          </div>

          {/* Audit Ledger */}
          <div className="col-span-12">
            <VaultDocumentList
              documents={documents}
              isLoadingDocuments={isLoadingDocuments}
              expandedByDocumentId={expandedByDocumentId}
              onToggleExpanded={toggleExpanded}
              previewLoadingByDocumentId={previewLoadingByDocumentId}
              addingByDocumentId={addingByDocumentId}
              onPreview={handlePreviewDocument}
              onRequestDelete={requestDeleteDocument}
              onAddDatesToDashboard={handleAddDatesToDashboard}
            />
          </div>

        </div>

        {/* Privacy badge */}
        <div className="mt-24 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-sm text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#c4c7c8] opacity-30" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="text-xs uppercase tracking-widest text-[#c4c7c8] opacity-60">
              All documents are encrypted client-side. Nuvare AI processes data locally within your sovereign enclave.
            </p>
          </div>
        </div>
      </div>

      {previewDocument ? (
        <VaultPreviewModal preview={previewDocument} onClose={() => setPreviewDocument(null)} />
      ) : null}
      {deleteConfirmationDocument ? (
        <VaultDeleteDialog
          confirmation={deleteConfirmationDocument}
          rememberDeleteChoice={rememberDeleteChoice}
          onRememberChange={setRememberDeleteChoice}
          isConfirmDeleting={isConfirmDeleting}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </main>
  );
}
