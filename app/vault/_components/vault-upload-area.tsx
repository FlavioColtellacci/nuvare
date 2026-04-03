"use client";

import type { ChangeEvent, DragEvent, RefObject } from "react";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type VaultUploadAreaProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  isDragActive: boolean;
  onDragActiveChange: (active: boolean) => void;
  onPickClick: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: DragEvent<HTMLButtonElement>) => void | Promise<void>;
};

export function VaultUploadArea({
  fileInputRef,
  isUploading,
  isDragActive,
  onDragActiveChange,
  onPickClick,
  onFileChange,
  onDrop,
}: VaultUploadAreaProps) {
  return (
    <>
      <button
        type="button"
        onClick={onPickClick}
        onDragOver={(event) => {
          event.preventDefault();
          onDragActiveChange(true);
        }}
        onDragLeave={() => onDragActiveChange(false)}
        onDrop={(event) => {
          void onDrop(event);
        }}
        disabled={isUploading}
        className={cn(
          "relative bg-[#0c0e14] border border-dashed hover:border-white/40 transition-all cursor-pointer flex flex-col items-center justify-center p-16 overflow-hidden group min-h-[320px] w-full",
          isDragActive
            ? "border-white/50 bg-white/5"
            : "border-white/20",
          isUploading ? "cursor-not-allowed opacity-70" : "",
        )}
      >
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Upload icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#c4c7c8]/40 group-hover:text-white transition-colors mb-6"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        <h3 className="text-2xl font-bold text-white mb-2">Ingest Sovereign Data</h3>
        <p className="text-xs uppercase tracking-widest text-[#c4c7c8]">
          Drag and drop Visas, Tax Returns, or Residency Cards
        </p>

        <div className="mt-8 px-8 py-2 bg-[#33343b]/50 border border-white/10 text-xs tracking-[0.3em] uppercase text-white">
          AES-256 Secured
        </div>

        {isUploading ? (
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-white/65">
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
        onChange={onFileChange}
      />
    </>
  );
}
