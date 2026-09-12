import { getNodeType, getNodeTypeSafe } from "../nodeTypes/index.js";
import type { NodeExecuteInputGroup, NodeExecutionData, WorkflowConnection, WorkflowDefinition } from "../types.js";
import { resolveParameters } from "./expressions.js";
import { topologicalSort } from "./topologicalSort.js";

export type NodeRunStatus = "success" | "error" | "skipped";

export interface NodeExecutionResult {
  status: NodeRunStatus;
  branches?: Record<string, NodeExecutionData[]>;
  error?: string;
  /** Present when a thrown error carried a `.trace` array (e.g. the AI Agent's tool-call-round-trip
   *  history when it hits its iteration limit without a final answer) — lets the NDV show what was
   *  attempted even though the node ultimately failed. See `extractErrorTrace` below. */
  trace?: unknown[];
  startedAt: string;
  finishedAt: string;
}

/** Pulls a `.trace` array off a thrown error, if the thrower attached one (duck-typed so
 *  workflow-core doesn't need to depend on any specific error class, e.g. the backend's
 *  `AgentRoundTripLimitError`). */
function extractErrorTrace(error: unknown): unknown[] | undefined {
  if (!(error instanceof Error)) return undefined;
  const trace = (error as { trace?: unknown }).trace;
  return Array.isArray(trace) ? trace : undefined;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  status: "success" | "error" | "cancelled";
  nodeResults: Record<string, NodeExecutionResult>;
  startedAt: string;
  finishedAt: string;
}

export interface ExecuteWorkflowOptions {
  onNodeStart?: (nodeId: string) => void;
  onNodeFinish?: (nodeId: string, result: NodeExecutionResult) => void | Promise<void>;
  /** Host-injected integrations, forwarded unchanged to every node's `execute({ services })`. */
  services?: Record<string, unknown>;
  /**
   * Checked before each node in the topological order starts; when already aborted, the loop stops
   * without starting that node (a node already in flight still runs to completion — this is
   * cooperative cancellation between nodes, not mid-node interruption). Result status becomes
   * `"cancelled"` instead of `"success"`/`"error"`.
   */
  signal?: AbortSignal;
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
  // Node name -> that node's first output item's json, filled in as each node finishes — lets a
  // later node's expressions reach any already-run ancestor via `$node["Name"].json.path`, not just
  // its own immediate-predecessor input.
  const nodeContext: Record<string, Record<string, unknown>> = {};
  const skipped = new Set<string>();
  const startedAt = new Date().toISOString();
  let cancelled = false;

  for (const nodeId of order) {
    if (options.signal?.aborted) {
      cancelled = true;
      break;
    }

    const node = nodesById.get(nodeId);
    if (!node) continue;

    if (skipped.has(nodeId) || node.disabled) {
      const now = new Date().toISOString();
      nodeResults[nodeId] = { status: "skipped", startedAt: now, finishedAt: now };
      for (const conn of outgoingBySource.get(nodeId) ?? []) skipped.add(conn.target);
      continue;
    }

    // Group incoming connections by the declared input handle they were wired to (not by arrival
    // order), so a node with multiple named inputs (e.g. `merge`'s "Input 1"/"Input 2") gets each
    // handle's items kept separate instead of auto-collapsed into one array before it runs.
    const inputHandles = getNodeTypeSafe(node.type).inputs ?? ["main"];
    const connsByHandle = new Map<string, WorkflowConnection[]>();
    const unassignedConns: WorkflowConnection[] = [];
    for (const conn of incomingByTarget.get(nodeId) ?? []) {
      const handle = conn.targetInput;
      if (handle && inputHandles.includes(handle)) {
        connsByHandle.set(handle, [...(connsByHandle.get(handle) ?? []), conn]);
      } else {
        // No handle recorded, or it names a handle this node no longer declares (e.g. a connection
        // saved before this node type had multiple inputs) — fill the remaining declared handles,
        // in order, rather than dropping the connection's items.
        unassignedConns.push(conn);
      }
    }
    for (const handle of inputHandles) {
      if (connsByHandle.has(handle)) continue;
      const conn = unassignedConns.shift();
      if (!conn) break;
      connsByHandle.set(handle, [conn]);
    }
    if (unassignedConns.length > 0) {
      const lastHandle = inputHandles[inputHandles.length - 1];
      connsByHandle.set(lastHandle, [...(connsByHandle.get(lastHandle) ?? []), ...unassignedConns]);
    }
    // One group per incoming connection (not per handle) — a node with a single "main" handle fed by
    // two edges still gets each upstream node's items kept separate and tagged by its own name,
    // instead of silently merged into one "NodeA, NodeB" group indistinguishable from a single source.
    const inputGroups: NodeExecuteInputGroup[] = inputHandles.flatMap((handle) =>
      (connsByHandle.get(handle) ?? []).map((conn) => {
        const upstream = nodeResults[conn.source];
        const branchKey = conn.sourceOutput ?? "main";
        const items = upstream && upstream.status === "success" ? (upstream.branches?.[branchKey] ?? []) : [];
        const sourceNodeName = nodesById.get(conn.source)?.name ?? conn.source;
        return { sourceNodeName, items };
      })
    );
    const input: NodeExecutionData[] = inputGroups.flatMap((group) => group.items);

    options.onNodeStart?.(nodeId);
    const nodeStartedAt = new Date().toISOString();
    try {
      const nodeType = getNodeType(node.type);
      const parameters = resolveParameters(node.parameters, input[0]?.json ?? {}, nodeContext);
      // Nodes must run in topological order — a later node's input depends on an earlier node's
      // output — so this cannot be parallelized with Promise.all.
      // oxlint-disable-next-line no-await-in-loop
      const result = await nodeType.execute({ parameters, input, inputs: inputGroups, services: options.services });
      const nodeResult: NodeExecutionResult = {
        status: "success",
        branches: result.branches,
        startedAt: nodeStartedAt,
        finishedAt: new Date().toISOString(),
      };
      nodeResults[nodeId] = nodeResult;
      nodeContext[node.name] = Object.values(result.branches ?? {}).flat()[0]?.json ?? {};
      await options.onNodeFinish?.(nodeId, nodeResult);
    } catch (error) {
      const nodeResult: NodeExecutionResult = {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        trace: extractErrorTrace(error),
        startedAt: nodeStartedAt,
        finishedAt: new Date().toISOString(),
      };
      nodeResults[nodeId] = nodeResult;
      await options.onNodeFinish?.(nodeId, nodeResult);
      for (const conn of outgoingBySource.get(nodeId) ?? []) skipped.add(conn.target);
    }
  }

  const status = cancelled
    ? "cancelled"
    : Object.values(nodeResults).some((result) => result.status === "error")
      ? "error"
      : "success";
  return { workflowId: workflow.id, status, nodeResults, startedAt, finishedAt: new Date().toISOString() };
}

/**
 * Runs a single node type in isolation (the NDV "Execute" / n8n "test step" action) — bypasses the
 * graph entirely, so `input` must already be resolved by the caller (e.g. `getNodeInputData`).
 */
export async function executeSingleNode(
  nodeTypeName: string,
  parameters: Record<string, unknown>,
  input: NodeExecutionData[],
  services?: Record<string, unknown>,
  inputs?: NodeExecuteInputGroup[],
  /** Node name -> that node's first output item's json, for every already-run ancestor — lets
   *  `$node["Name"].json.path` expressions reach past the immediate predecessor. */
  nodeContext?: Record<string, Record<string, unknown>>
): Promise<NodeExecutionResult> {
  const startedAt = new Date().toISOString();
  try {
    const nodeType = getNodeType(nodeTypeName);
    const resolvedParameters = resolveParameters(parameters, input[0]?.json ?? {}, nodeContext);
    const result = await nodeType.execute({ parameters: resolvedParameters, input, inputs, services });
    return { status: "success", branches: result.branches, startedAt, finishedAt: new Date().toISOString() };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : String(error),
      trace: extractErrorTrace(error),
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }
}
