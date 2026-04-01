export type DashboardDeadline = {
  id: string;
  title: string;
  dueDate: string;
  category: string;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type SubscriptionTier = "none" | "core" | "professional";

export type ViewedCountry = {
  slug: string;
  countryName: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};
