import { getNodeType } from "../nodeTypes/index.js";
import type { NodeExecutionData, WorkflowConnection, WorkflowDefinition } from "../types.js";
import { topologicalSort } from "./topologicalSort.js";

export type NodeRunStatus = "success" | "error" | "skipped";

export interface NodeExecutionResult {
  status: NodeRunStatus;
  branches?: Record<string, NodeExecutionData[]>;
  error?: string;
  startedAt: string;
  finishedAt: string;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  status: "success" | "error";
  nodeResults: Record<string, NodeExecutionResult>;
  startedAt: string;
  finishedAt: string;
}

export interface ExecuteWorkflowOptions {
  onNodeStart?: (nodeId: string) => void;
  onNodeFinish?: (nodeId: string, result: NodeExecutionResult) => void;
  /** Host-injected integrations, forwarded unchanged to every node's `execute({ services })`. */
  services?: Record<string, unknown>;
}

export async function executeWorkflow(
  workflow: WorkflowDefinition,
  options: ExecuteWorkflowOptions = {}
): Promise<WorkflowExecutionResult> {
  const nodesById = new Map(workflow.nodes.map((node) => [node.id, node]));
  const incomingByTarget = new Map<string, WorkflowConnection[]>();
  const outgoingBySource = new Map<string, WorkflowConnection[]>();
  for (const conn of workflow.connections) {
    incomingByTarget.set(conn.target, [...(incomingByTarget.get(conn.target) ?? []), conn]);
    outgoingBySource.set(conn.source, [...(outgoingBySource.get(conn.source) ?? []), conn]);
  }

  const order = topologicalSort(workflow.nodes, workflow.connections);
  const nodeResults: Record<string, NodeExecutionResult> = {};
  const skipped = new Set<string>();
  const startedAt = new Date().toISOString();

  for (const nodeId of order) {
    const node = nodesById.get(nodeId);
    if (!node) continue;

    if (skipped.has(nodeId) || node.disabled) {
      const now = new Date().toISOString();
      nodeResults[nodeId] = { status: "skipped", startedAt: now, finishedAt: now };
      for (const conn of outgoingBySource.get(nodeId) ?? []) skipped.add(conn.target);
      continue;
    }

    const input: NodeExecutionData[] = (incomingByTarget.get(nodeId) ?? []).flatMap((conn) => {
      const upstream = nodeResults[conn.source];
      if (!upstream || upstream.status !== "success") return [];
      const branchKey = conn.sourceOutput ?? "main";
      return upstream.branches?.[branchKey] ?? [];
    });

    options.onNodeStart?.(nodeId);
    const nodeStartedAt = new Date().toISOString();
    try {
      const nodeType = getNodeType(node.type);
      // Nodes must run in topological order — a later node's input depends on an earlier node's
      // output — so this cannot be parallelized with Promise.all.
      // oxlint-disable-next-line no-await-in-loop
      const result = await nodeType.execute({ parameters: node.parameters, input, services: options.services });
      const nodeResult: NodeExecutionResult = {
        status: "success",
        branches: result.branches,
        startedAt: nodeStartedAt,
        finishedAt: new Date().toISOString(),
      };
      nodeResults[nodeId] = nodeResult;
      options.onNodeFinish?.(nodeId, nodeResult);
    } catch (error) {
      const nodeResult: NodeExecutionResult = {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        startedAt: nodeStartedAt,
        finishedAt: new Date().toISOString(),
      };
      nodeResults[nodeId] = nodeResult;
      options.onNodeFinish?.(nodeId, nodeResult);
      for (const conn of outgoingBySource.get(nodeId) ?? []) skipped.add(conn.target);
    }
  }

  const status = Object.values(nodeResults).some((result) => result.status === "error") ? "error" : "success";
  return { workflowId: workflow.id, status, nodeResults, startedAt, finishedAt: new Date().toISOString() };
}
