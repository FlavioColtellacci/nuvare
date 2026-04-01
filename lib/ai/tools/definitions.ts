/**
 * OpenAI-format tool definitions for MiniMax-M2.7 (OpenAI-compatible endpoint).
 */

export const ASK_TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "list_deadlines",
      description:
        "List the signed-in user's upcoming compliance deadlines from Nuvare (title, due date, category). Read-only.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Max rows to return (default 30, max 50).",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_deadline",
      description:
        "Create a single deadline for the signed-in user. Only use when the user clearly asked to add or schedule a deadline or obligation.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Short title for the obligation (required).",
          },
          due_date: {
            type: "string",
            description: "Due date as ISO calendar date YYYY-MM-DD (required).",
          },
          category: {
            type: "string",
            description: "Optional category label (e.g. tax, immigration).",
          },
        },
        required: ["title", "due_date"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_documents",
      description:
        "List the user's uploaded vault documents (metadata only: id, file name, processing status, count of extracted dates). No file contents.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Max rows to return (default 20, max 50).",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "research_regulations",
      description:
        "Look up current rules via live research. Use neutral keywords only (topic + jurisdiction + year). Never include names, emails, employers, bank details, government IDs, addresses, or exact financial figures.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Abstract regulatory topic only, e.g. “Italy tax residency 183-day rule 2026”—not the user’s private circumstances.",
          },
          deep_research: {
            type: "boolean",
            description:
              "If true, use a deeper research model (slower/costlier). Prefer false unless the user needs exhaustive sourcing.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_memory_facts",
      description:
        "List stored long-term memory facts for the signed-in user (key, value, source, updated_at). Read-only. Use to recall preferences or facts the user asked to remember.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Max rows to return (default 40, max 80), most recently updated first.",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "upsert_memory_fact",
      description:
        "Save or update one long-term memory fact (key + JSON value). Only when the user clearly wants something remembered. Max 200 distinct keys per user; values must stay small (under ~16KB). Use source: chat for conversational memories, document for vault-derived facts, onboarding for profile-aligned facts.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description:
              "Stable identifier, 1–200 characters (e.g. tax_residency_preference, preferred_filing_currency).",
          },
          value: {
            type: "object",
            description:
              "JSON object for the fact payload (use scalar fields inside). Keep it small; max ~16KB when serialized.",
            additionalProperties: true,
          },
          source: {
            type: "string",
            enum: ["onboarding", "chat", "document"],
            description: "Where this fact came from.",
          },
        },
        required: ["key", "value", "source"],
      },
    },
  },
];
