"use client";

import {
  ChevronDown,
  ChevronUp,
  Eye,
  FileImage,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { VaultDocument } from "../_lib/types";
import { formatUploadDate, isPdf } from "../_lib/utils";

type VaultDocumentCardProps = {
  document: VaultDocument;
  rowIndex?: number;
  isExpanded: boolean;
  isPreviewLoading: boolean;
  isAddingDates: boolean;
  onToggleExpanded: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onAddDatesToDashboard: () => void;
};

export function VaultDocumentCard({
  document,
  rowIndex = 0,
  isExpanded,
  isPreviewLoading,
  isAddingDates,
  onToggleExpanded,
  onPreview,
  onDelete,
  onAddDatesToDashboard,
}: VaultDocumentCardProps) {
  const hasExtractedDates = document.extracted_dates.length > 0;
  const isTemporaryDocument = document.id.startsWith("temp-");
  const isEvenRow = rowIndex % 2 === 0;

  function getAiStatusContent() {
    if (isTemporaryDocument || document.processing_status === "pending") {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#c4c7c8]" aria-hidden="true" />
          <span className="text-xs uppercase tracking-widest text-[#c4c7c8] italic">
            Auditing Data...
          </span>
        </div>
      );
    }
    if (document.processing_status === "error") {
      return (
        <span className="text-xs uppercase tracking-widest text-[#ffb4ab]">
          Extraction Failed
        </span>
      );
    }
    // complete
    return (
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="text-white font-bold text-xs uppercase tracking-widest">
          AI Extracted
        </span>
      </div>
    );
  }

  function getDocumentTypeLabel() {
    if (!document.file_type) return "Document";
    if (document.file_type === "application/pdf") return "PDF";
    if (document.file_type.startsWith("image/")) {
      return document.file_type.replace("image/", "").toUpperCase();
    }
    return "Document";
  }

  return (
    <article>
      <div
        className={cn(
          "grid grid-cols-12 px-8 py-8 items-center hover:bg-[#282a30] transition-colors",
          isEvenRow ? "bg-[#111319]" : "bg-[#191b22]",
        )}
      >
        {/* Col 1: Document / Entity */}
        <div className="col-span-5 flex items-center gap-6">
          <div className="w-12 h-16 bg-[#33343b] flex items-center justify-center flex-shrink-0">
            {isPdf(document.file_type) ? (
              <FileText className="h-5 w-5 text-white" aria-hidden="true" />
            ) : (
              <FileImage className="h-5 w-5 text-white" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 overflow-hidden">
            <div
              className="font-bold text-lg text-white mb-1 truncate"
              title={document.file_name}
            >
              {document.file_name}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[#c4c7c8]">
              Uploaded {formatUploadDate(document.created_at)}
            </div>
          </div>
        </div>

        {/* Col 2: Type */}
        <div className="col-span-2">
          <span className="text-sm uppercase tracking-widest text-white">
            {getDocumentTypeLabel()}
          </span>
        </div>

        {/* Col 3: AI Intelligence Status */}
        <div className="col-span-3">
          {getAiStatusContent()}
        </div>

        {/* Col 4: Actions */}
        <div className="col-span-2 flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onPreview}
            disabled={isPreviewLoading || isTemporaryDocument}
            className={cn(
              "hover:text-white transition-colors px-2 text-[#c4c7c8]",
              isTemporaryDocument
                ? "cursor-not-allowed opacity-40"
                : "cursor-pointer",
              isPreviewLoading && !isTemporaryDocument ? "cursor-not-allowed opacity-70" : "",
            )}
            aria-label={`Preview ${document.file_name}`}
          >
            {isPreviewLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isTemporaryDocument}
            className={cn(
              "hover:text-white transition-colors px-2 text-[#c4c7c8]",
              isTemporaryDocument ? "cursor-not-allowed opacity-40" : "cursor-pointer",
            )}
            aria-label={`Delete ${document.file_name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded dates panel */}
      {hasExtractedDates ? (
        <div
          className={cn(
            "px-8 pb-6",
            isEvenRow ? "bg-[#111319]" : "bg-[#191b22]",
          )}
        >
          <button
            type="button"
            onClick={onToggleExpanded}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[#c4c7c8] transition-colors hover:text-white uppercase tracking-widest mb-3"
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
            <div className="space-y-2 bg-[#0c0e14] border border-white/10 p-4 mb-3">
              {document.extracted_dates.map((dateItem, index) => (
                <div key={`${document.id}-${index}`} className="text-xs text-[#c4c7c8]">
                  <span className="text-white">{dateItem.label}</span>
                  <span className="mx-2 text-white/30">•</span>
                  <span>{dateItem.date}</span>
                </div>
              ))}
            </div>
          ) : null}

          <Button
            size="lg"
            onClick={onAddDatesToDashboard}
            disabled={isAddingDates}
            className="h-9 border border-white/20 bg-transparent text-xs text-white hover:bg-white/10 uppercase tracking-widest"
          >
            {isAddingDates ? (
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
}
