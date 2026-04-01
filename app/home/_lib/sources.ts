const LOGGED_SOURCE_SPLITS = new Set<string>();

export function splitAssistantContent(content: string) {
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const sourcesHeadingOnlyPattern =
    /^(?:#{1,6}\s*)?(?:\*\*\s*)?sources(?:\s*\*\*)?\s*:?\s*$/i;
  const sourcesHeadingWithInlinePattern =
    /^(?:#{1,6}\s*)?(?:\*\*\s*)?sources(?:\s*\*\*)?\s*:\s*(.+)$/i;
  const sourcesLineIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    return (
      sourcesHeadingOnlyPattern.test(trimmed) || sourcesHeadingWithInlinePattern.test(trimmed)
    );
  });

  if (sourcesLineIndex === -1) {
    return {
      mainContent: normalized.trimEnd(),
      sourcesContent: "",
    };
  }

  const sourcesHeading = lines[sourcesLineIndex]?.trim() ?? "";
  const inlineSourceMatch = sourcesHeadingWithInlinePattern.exec(sourcesHeading);

  const mainContent = lines.slice(0, sourcesLineIndex).join("\n").trimEnd();
  const listAfterHeading = lines.slice(sourcesLineIndex + 1).join("\n").trim();
  const inlineSource = inlineSourceMatch?.[1]?.trim() ?? "";
  const sourcesContent = [inlineSource, listAfterHeading].filter(Boolean).join("\n").trim();
  if (sourcesContent) {
    const debugKey = `${mainContent.length}:${sourcesContent.length}`;
    if (!LOGGED_SOURCE_SPLITS.has(debugKey)) {
      console.log("[dashboard] sources split", {
        mainPreview: mainContent.slice(0, 120),
        sourcesPreview: sourcesContent.slice(0, 120),
      });
      LOGGED_SOURCE_SPLITS.add(debugKey);
    }
  }

  return {
    mainContent,
    sourcesContent,
  };
}

export function extractSourceItems(sourcesContent: string) {
  if (!sourcesContent.trim()) return [];

  const lines = sourcesContent
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const listItems = lines
    .map((line) => {
      const match = /^([-*+]|\d+\.)\s+(.+)$/.exec(line);
      return match?.[2]?.trim() ?? null;
    })
    .filter((item): item is string => Boolean(item));

  if (listItems.length > 0) return listItems;

  return lines;
}
