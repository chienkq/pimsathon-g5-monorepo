// Text fallback shown until/unless a matching SVG is found at /icons/{nodeType}.svg
// (see SvgNodeIcon.tsx, and apps/admin-ui/public/icons/ for the actual files)
type IconMap = Record<string, string>;

const FALLBACK_ICONS: IconMap = {
  sendMessageToAiAgent: "✦",
  metisSoftware: "◆",
  sonarQube: "◈",
  if: "⑂",
  loop: "↻",
  merge: "⑃",
  switch: "⇶",
  wait: "◷",
  code: "◇",
  httpRequest: "◎",
  webhook: "⬡",
  ftp: "⇅",
  chat: "◐",
  discord: "◒",
  gmail: "✉",
  outlook: "▤",
  teams: "▦",
  email: "✆",
  slack: "▩",
  telegram: "➤",
  jira: "◈",
  git: "⌥",
  gitCacheUpsert: "⇥",
  factUpsert: "⇥",
  factQuery: "⇤",
  raiseAlert: "▲",
  workItem: "☐",
  planningGroup: "◫",
  aggregate: "Σ",
  publishWidget: "▥",
};

export function getNodeIcon(type: string, fallback: string): string {
  return FALLBACK_ICONS[type] ?? fallback.charAt(0).toUpperCase();
}
