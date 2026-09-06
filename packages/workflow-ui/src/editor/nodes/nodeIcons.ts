const ICONS: Record<string, string> = {
  manualTrigger: "▶",
  setFields: "✎",
  httpRequest: "◎",
  ifCondition: "⑂",
  code: "◇",
  merge: "⑃",
  noOp: "•",
};

export function getNodeIcon(type: string, fallback: string): string {
  return ICONS[type] ?? fallback.charAt(0).toUpperCase();
}
