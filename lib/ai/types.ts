export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AskPayload = {
  messages?: ChatMessage[];
  deepResearch?: boolean;
};

export type OnboardingAnswers = Record<string, unknown>;

export type PerplexityChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};
