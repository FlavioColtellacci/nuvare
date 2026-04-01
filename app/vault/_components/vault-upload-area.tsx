"use client";

import type { ChangeEvent, DragEvent, RefObject } from "react";

import { Loader2, Upload } from "lucide-react";

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
        onChange={onFileChange}
      />
    </>
  );
}
