const TOOL_LABELS: Record<string, string> = {
  list_deadlines: "Listed your deadlines",
  create_deadline: "Added a deadline",
  list_documents: "Listed vault documents",
  research_regulations: "Researched regulations",
  list_memory_facts: "Recalled saved facts",
  upsert_memory_fact: "Saved a memory fact",
};

export function formatToolStepLabel(toolName: string): string {
  const label = TOOL_LABELS[toolName];
  if (label) return label;
  return toolName.replace(/_/g, " ");
}
