import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

interface HumanReviewConfig {
  type: string;
  displayName: string;
  description: string;
  color: string;
  recipientLabel: string;
  recipientPlaceholder: string;
}

/**
 * Phase 1 (see auto-memory n8n_clone_gap_tracker.md): no credential/auth system exists yet, so
 * every channel node here is a stub that echoes back what would have been sent — real delivery
 * and reply-waiting land once credentials + a callback/webhook path exist.
 *
 * The Integrations screen (W6) added real credential storage + a "Test connection" action for
 * gmail/outlook/teams/slack (see `apps/backend/src/{gmail,outlook,teams,slack}Client.ts`), but
 * deliberately scoped to Workspace Settings only — NOT wired into these node types' `execute`.
 * All six channel nodes here stay stub/simulated on the canvas.
 */
function createHumanReviewNodeType(config: HumanReviewConfig): NodeTypeDefinition {
  return {
    type: config.type,
    displayName: config.displayName,
    description: config.description,
    group: "humanReview",
    color: config.color,
    hasInput: true,
    outputs: ["main"],
    parameters: [
      {
        key: "recipient",
        label: config.recipientLabel,
        type: "string",
        default: "",
        placeholder: config.recipientPlaceholder,
        required: true,
      },
      { key: "message", label: "Message", type: "code", default: "", required: true },
      { key: "waitForReply", label: "Wait for a human reply", type: "boolean", default: true },
    ],
    async execute({ parameters, input }) {
      const recipient = String(parameters.recipient ?? "");
      const message = String(parameters.message ?? "");
      const waitForReply = Boolean(parameters.waitForReply ?? true);
      const items = input.length > 0 ? input : [{ json: {} }];
      const output: NodeExecutionData[] = items.map((item) => ({
        json: { ...item.json, recipient, message, status: waitForReply ? "awaiting-response" : "sent" },
      }));
      return { branches: { main: output } };
    },
  };
}

export const chatNodeType = createHumanReviewNodeType({
  type: "chat",
  displayName: "Chat",
  description: "Sends a message in an in-app chat, optionally waiting for a human reply.",
  color: "#2b9348",
  recipientLabel: "Conversation",
  recipientPlaceholder: "conversation id",
});

export const discordNodeType = createHumanReviewNodeType({
  type: "discord",
  displayName: "Discord",
  description: "Sends a message to a Discord channel, optionally waiting for a human reply.",
  color: "#5865f2",
  recipientLabel: "Channel",
  recipientPlaceholder: "#channel",
});

export const gmailNodeType = createHumanReviewNodeType({
  type: "gmail",
  displayName: "Gmail",
  description: "Sends a Gmail message, optionally waiting for a human reply.",
  color: "#ea4335",
  recipientLabel: "To",
  recipientPlaceholder: "someone@example.com",
});

export const outlookNodeType = createHumanReviewNodeType({
  type: "outlook",
  displayName: "Outlook",
  description: "Sends an Outlook message, optionally waiting for a human reply.",
  color: "#0078d4",
  recipientLabel: "To",
  recipientPlaceholder: "someone@example.com",
});

export const teamsNodeType = createHumanReviewNodeType({
  type: "teams",
  displayName: "Teams",
  description: "Sends a Microsoft Teams message, optionally waiting for a human reply.",
  color: "#6264a7",
  recipientLabel: "Channel",
  recipientPlaceholder: "team/channel",
});

export const emailNodeType = createHumanReviewNodeType({
  type: "email",
  displayName: "Email",
  description: "Sends a plain email, optionally waiting for a human reply.",
  color: "#457b9d",
  recipientLabel: "To",
  recipientPlaceholder: "someone@example.com",
});

export const slackNodeType = createHumanReviewNodeType({
  type: "slack",
  displayName: "Slack",
  description: "Sends a Slack message, optionally waiting for a human reply.",
  color: "#4a154b",
  recipientLabel: "Channel",
  recipientPlaceholder: "#channel",
});

export const telegramNodeType = createHumanReviewNodeType({
  type: "telegram",
  displayName: "Telegram",
  description: "Sends a Telegram message, optionally waiting for a human reply.",
  color: "#26a5e4",
  recipientLabel: "Chat",
  recipientPlaceholder: "@username or chat id",
});
