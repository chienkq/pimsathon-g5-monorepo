import type { NodeTypeDefinition } from "../types.js";
import { metisSoftwareNodeType, sonarQubeNodeType } from "./appActionNodes.js";
import { codeNodeType } from "./code.js";
import {
  chatNodeType,
  discordNodeType,
  emailNodeType,
  gmailNodeType,
  outlookNodeType,
  slackNodeType,
  teamsNodeType,
  telegramNodeType,
} from "./humanReviewNodes.js";
import { httpRequestNodeType } from "./httpRequest.js";
import { ifNodeType } from "./if.js";
import { ftpNodeType } from "./ftp.js";
import { loopNodeType } from "./loop.js";
import { mergeNodeType } from "./merge.js";
import { sendMessageToAiAgentNodeType } from "./sendMessageToAiAgent.js";
import { switchNodeType } from "./switch.js";
import { waitNodeType } from "./wait.js";
import { webhookNodeType } from "./webhook.js";

export const nodeTypeRegistry: Record<string, NodeTypeDefinition> = {
  // AI
  [sendMessageToAiAgentNodeType.type]: sendMessageToAiAgentNodeType,
  // Action in Apps
  [metisSoftwareNodeType.type]: metisSoftwareNodeType,
  [sonarQubeNodeType.type]: sonarQubeNodeType,
  // Flow
  [ifNodeType.type]: ifNodeType,
  [loopNodeType.type]: loopNodeType,
  [mergeNodeType.type]: mergeNodeType,
  [switchNodeType.type]: switchNodeType,
  [waitNodeType.type]: waitNodeType,
  // Core
  [codeNodeType.type]: codeNodeType,
  [httpRequestNodeType.type]: httpRequestNodeType,
  [webhookNodeType.type]: webhookNodeType,
  [ftpNodeType.type]: ftpNodeType,
  // Human Review
  [chatNodeType.type]: chatNodeType,
  [discordNodeType.type]: discordNodeType,
  [gmailNodeType.type]: gmailNodeType,
  [outlookNodeType.type]: outlookNodeType,
  [teamsNodeType.type]: teamsNodeType,
  [emailNodeType.type]: emailNodeType,
  [slackNodeType.type]: slackNodeType,
  [telegramNodeType.type]: telegramNodeType,
};

export function getNodeType(type: string): NodeTypeDefinition {
  const nodeType = nodeTypeRegistry[type];
  if (!nodeType) throw new Error(`Unknown node type: ${type}`);
  return nodeType;
}

export function listNodeTypes(): NodeTypeDefinition[] {
  return Object.values(nodeTypeRegistry);
}

export {
  chatNodeType,
  codeNodeType,
  discordNodeType,
  emailNodeType,
  ftpNodeType,
  gmailNodeType,
  httpRequestNodeType,
  ifNodeType,
  loopNodeType,
  mergeNodeType,
  metisSoftwareNodeType,
  outlookNodeType,
  sendMessageToAiAgentNodeType,
  slackNodeType,
  sonarQubeNodeType,
  switchNodeType,
  teamsNodeType,
  telegramNodeType,
  waitNodeType,
  webhookNodeType,
};
