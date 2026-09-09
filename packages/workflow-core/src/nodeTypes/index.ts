import type { NodeTypeDefinition, NodeTypeMeta } from "../types.js";
import { aggregateNodeType } from "./aggregate.js";
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
import { factQueryNodeType } from "./factQuery.js";
import { factUpsertNodeType } from "./factUpsert.js";
import { gitNodeType } from "./git.js";
import { gitCacheUpsertNodeType } from "./gitCacheUpsert.js";
import { httpRequestNodeType } from "./httpRequest.js";
import { ifNodeType } from "./if.js";
import { ftpNodeType } from "./ftp.js";
import { jiraNodeType } from "./jira.js";
import { loopNodeType } from "./loop.js";
import { mergeNodeType } from "./merge.js";
import { planningGroupNodeType } from "./planningGroup.js";
import { publishWidgetNodeType } from "./publishWidget.js";
import { raiseAlertNodeType } from "./raiseAlert.js";
import { sendMessageToAiAgentNodeType } from "./sendMessageToAiAgent.js";
import { switchNodeType } from "./switch.js";
import { waitNodeType } from "./wait.js";
import { webhookNodeType } from "./webhook.js";
import { workItemNodeType } from "./workItem.js";

export const nodeTypeRegistry: Record<string, NodeTypeDefinition> = {
  // AI
  [sendMessageToAiAgentNodeType.type]: sendMessageToAiAgentNodeType,
  // Action in Apps
  [metisSoftwareNodeType.type]: metisSoftwareNodeType,
  [sonarQubeNodeType.type]: sonarQubeNodeType,
  [jiraNodeType.type]: jiraNodeType,
  [gitNodeType.type]: gitNodeType,
  // Platform (admin-ui's own features)
  [workItemNodeType.type]: workItemNodeType,
  [planningGroupNodeType.type]: planningGroupNodeType,
  // Data
  [factUpsertNodeType.type]: factUpsertNodeType,
  [factQueryNodeType.type]: factQueryNodeType,
  [raiseAlertNodeType.type]: raiseAlertNodeType,
  [aggregateNodeType.type]: aggregateNodeType,
  [publishWidgetNodeType.type]: publishWidgetNodeType,
  [gitCacheUpsertNodeType.type]: gitCacheUpsertNodeType,
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

/**
 * Like getNodeType, but returns a placeholder instead of throwing for node types
 * that no longer exist in the registry (e.g. a node type removed after a workflow
 * referencing it was saved). UI call sites should use this so a stale saved
 * workflow can still be opened, inspected, and fixed instead of crashing.
 */
export function getNodeTypeSafe(type: string): NodeTypeDefinition {
  return (
    nodeTypeRegistry[type] ?? {
      type,
      displayName: `Unknown node (${type})`,
      description: "This node type no longer exists. Delete this node or replace it with a supported one.",
      group: "core",
      color: "#94a3b8",
      hasInput: true,
      outputs: ["main"],
      parameters: [],
      async execute() {
        throw new Error(`Unknown node type: ${type}`);
      },
    }
  );
}

export function listNodeTypes(): NodeTypeDefinition[] {
  return Object.values(nodeTypeRegistry);
}

/** Strips `execute` — the boundary shape a `WorkflowRuntime.listNodeTypes()` serves over HTTP. */
export function toNodeTypeMeta(nodeType: NodeTypeDefinition): NodeTypeMeta {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructure to omit `execute` from meta
  const { execute: _execute, ...meta } = nodeType;
  return meta;
}

export function listNodeTypeMetas(): NodeTypeMeta[] {
  return listNodeTypes().map(toNodeTypeMeta);
}

export {
  aggregateNodeType,
  chatNodeType,
  codeNodeType,
  discordNodeType,
  emailNodeType,
  factQueryNodeType,
  factUpsertNodeType,
  ftpNodeType,
  gitCacheUpsertNodeType,
  gitNodeType,
  gmailNodeType,
  httpRequestNodeType,
  ifNodeType,
  jiraNodeType,
  loopNodeType,
  mergeNodeType,
  metisSoftwareNodeType,
  outlookNodeType,
  planningGroupNodeType,
  publishWidgetNodeType,
  raiseAlertNodeType,
  sendMessageToAiAgentNodeType,
  slackNodeType,
  sonarQubeNodeType,
  switchNodeType,
  teamsNodeType,
  telegramNodeType,
  waitNodeType,
  webhookNodeType,
  workItemNodeType,
};

export type { FactStoreService, NormalizedWorkItemFact, StoredWorkItemFact, WorkItemFactFilter } from "./factUpsert.js";
export type { JiraClientService, JiraIssue } from "./jira.js";
export type { GitBranch, GitClientService, GitCommit, GitIssue, GitPullRequest, GitRepositoryInfo } from "./git.js";
export type { GitCacheStoreService } from "./gitCacheUpsert.js";
export type { AlertSeverity, AlertStoreService, NormalizedAlert } from "./raiseAlert.js";
export type { NormalizedWidget, WidgetStoreService, WidgetType } from "./publishWidget.js";
export type {
  PlanningGroupInput,
  PlanningGroupKind,
  PlanningGroupListFilter,
  PlanningGroupStoreService,
  PlatformPlanningGroup,
} from "./planningGroup.js";
export {
  WORK_ITEM_PRIORITIES,
  WORK_ITEM_STATUSES,
  type PlatformWorkItem,
  type WorkItemInput,
  type WorkItemListFilter,
  type WorkItemPriority,
  type WorkItemStatus,
  type WorkItemStoreService,
} from "./workItem.js";
