const ICONS: Record<string, string> = {
  // AI
  sendMessageToAiAgent: "✦",
  // Action in Apps
  metisSoftware: "◆",
  sonarQube: "◈",
  // Flow
  if: "⑂",
  loop: "↻",
  merge: "⑃",
  switch: "⇶",
  wait: "◷",
  // Core
  code: "◇",
  httpRequest: "◎",
  webhook: "⬡",
  ftp: "⇅",
  // Human Review
  chat: "◐",
  discord: "◒",
  gmail: "✉",
  outlook: "▤",
  teams: "▦",
  email: "✆",
  slack: "▩",
  telegram: "➤",
};

export function getNodeIcon(type: string, fallback: string): string {
  return ICONS[type] ?? fallback.charAt(0).toUpperCase();
}
