"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

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

export default function VaultClient({ userId }: { userId: string }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  return (
    <main className="onboarding-bg relative min-h-screen overflow-x-hidden bg-black px-4 py-10 text-white sm:px-6 md:px-10">
      <div className="onboarding-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto w-full max-w-5xl">
        <h1 className="font-editorial text-5xl text-white">Document Vault</h1>
        <p className="mt-3 text-sm text-white/55">Your documents are encrypted and never shared.</p>

        <VaultUploadArea
          fileInputRef={fileInputRef}
          isUploading={isUploading}
          isDragActive={isDragActive}
          onDragActiveChange={setIsDragActive}
          onPickClick={() => fileInputRef.current?.click()}
          onFileChange={handleFilePickerChange}
          onDrop={handleDrop}
        />

        <VaultFeedbackMessages errorMessage={errorMessage} successMessage={successMessage} />

        <section className="mt-8 w-full min-w-0">
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
        </section>
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
