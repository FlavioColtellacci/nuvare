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
  return (
    <div className="bg-[#191b22]">
      {/* Header row */}
      <div className="grid grid-cols-12 px-8 py-4 border-b border-white/5 text-[10px] uppercase tracking-widest text-[#c4c7c8]">
        <div className="col-span-5">Document / Entity</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-3">AI Intelligence Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {isLoadingDocuments ? (
        <div className="px-8 py-12 text-sm text-[#c4c7c8]">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="px-8 py-12 text-sm text-[#c4c7c8]">
          No documents uploaded yet. Add your first document above.
        </div>
      ) : (
        documents.map((document, index) => (
          <VaultDocumentCard
            key={document.id}
            document={document}
            rowIndex={index}
            isExpanded={expandedByDocumentId[document.id] ?? false}
            isPreviewLoading={previewLoadingByDocumentId[document.id] === true}
            isAddingDates={addingByDocumentId[document.id] === true}
            onToggleExpanded={() => onToggleExpanded(document.id)}
            onPreview={() => void onPreview(document.id)}
            onDelete={() => onRequestDelete(document.id, document.file_name)}
            onAddDatesToDashboard={() => void onAddDatesToDashboard(document.id)}
          />
        ))
      )}
    </div>
  );
}
