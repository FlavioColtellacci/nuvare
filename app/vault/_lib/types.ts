export type SubscriptionTier = "none" | "core" | "professional";

export type ExtractedDate = {
  label: string;
  date: string;
  notes: string;
};

export type VaultDocument = {
  id: string;
  file_name: string;
  file_type: string | null;
  created_at: string;
  processing_status: "pending" | "complete" | "error";
  extracted_dates: ExtractedDate[];
};

export type PreviewDocumentState = {
  signedUrl: string;
  fileType: string | null;
  fileName: string;
};

export type DeleteConfirmationState = {
  id: string;
  fileName: string;
};
