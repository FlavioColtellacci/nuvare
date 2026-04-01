"use client";

import type { VaultDocument } from "../_lib/types";
import { VaultDocumentCard } from "./vault-document-card";

type VaultDocumentListProps = {
  documents: VaultDocument[];
  isLoadingDocuments: boolean;
  expandedByDocumentId: Record<string, boolean>;
  onToggleExpanded: (documentId: string) => void;
  previewLoadingByDocumentId: Record<string, boolean>;
  addingByDocumentId: Record<string, boolean>;
  onPreview: (documentId: string) => void;
  onRequestDelete: (documentId: string, fileName: string) => void;
  onAddDatesToDashboard: (documentId: string) => void;
};

export function VaultDocumentList({
  documents,
  isLoadingDocuments,
  expandedByDocumentId,
  onToggleExpanded,
  previewLoadingByDocumentId,
  addingByDocumentId,
  onPreview,
  onRequestDelete,
  onAddDatesToDashboard,
}: VaultDocumentListProps) {
  if (isLoadingDocuments) {
    return <p className="text-sm text-white/55">Loading documents...</p>;
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-white/55">
        No documents uploaded yet. Add your first document above.
      </p>
    );
  }

  return (
    <div className="grid w-full min-w-0 gap-4 md:grid-cols-2">
      {documents.map((document) => (
        <VaultDocumentCard
          key={document.id}
          document={document}
          isExpanded={expandedByDocumentId[document.id] ?? false}
          isPreviewLoading={previewLoadingByDocumentId[document.id] === true}
          isAddingDates={addingByDocumentId[document.id] === true}
          onToggleExpanded={() => onToggleExpanded(document.id)}
          onPreview={() => void onPreview(document.id)}
          onDelete={() => onRequestDelete(document.id, document.file_name)}
          onAddDatesToDashboard={() => void onAddDatesToDashboard(document.id)}
        />
      ))}
    </div>
  );
}
