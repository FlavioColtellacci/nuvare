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

  return (
    <article className="relative w-full min-w-0 cursor-pointer overflow-hidden rounded-xl bg-white/[0.03] p-4">
      <div className="absolute right-3 top-3 inline-flex items-center gap-2">
        <button
          type="button"
          onClick={onPreview}
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
          onClick={onDelete}
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
          <p className="truncate overflow-hidden text-sm text-white" title={document.file_name}>
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
            onClick={onToggleExpanded}
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
            onClick={onAddDatesToDashboard}
            disabled={isAddingDates}
            className="mt-3 h-9 border border-white/20 bg-transparent text-xs text-white hover:bg-white/10"
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
