import {
  topologicalSort,
  type NodeExecutionData,
  type NodeExecutionResult,
  type WorkflowConnection,
  type WorkflowDefinition,
  type WorkflowNodeDefinition,
} from "@chienkq/workflow-core";
import {
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkflowRepository } from "../context/WorkflowRepositoryContext.js";
import { useNodeTypeLookup, useWorkflowRuntime } from "../context/WorkflowRuntimeContext.js";
import {
  getAncestorNodeContext,
  getAncestorNodes,
  getNodeInputData,
  getNodeInputGroups,
} from "./ndv/getNodeInputData.js";
import type { WorkflowFlowEdge, WorkflowFlowNode } from "./types.js";

export type RunStatus = "idle" | "running" | "success" | "error" | "cancelled";

const MAX_HISTORY = 100;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

interface HistorySnapshot {
  nodes: WorkflowFlowNode[];
  edges: WorkflowFlowEdge[];
}

function toFlowNodes(nodes: WorkflowNodeDefinition[]): WorkflowFlowNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: "workflowNode",
    position: node.position,
    data: {
      nodeType: node.type,
      label: node.name,
      parameters: node.parameters,
      disabled: node.disabled,
    },
  }));
}

function toFlowEdges(connections: WorkflowConnection[]): WorkflowFlowEdge[] {
  return connections.map((conn) => ({
    id: conn.id,
    source: conn.source,
    target: conn.target,
    sourceHandle: conn.sourceOutput ?? "main",
    targetHandle: conn.targetInput ?? "main",
  }));
}

export function useWorkflowEditorState(workflowId: string) {
  const repository = useWorkflowRepository();
  const runtime = useWorkflowRuntime();
  const getNodeType = useNodeTypeLookup();
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState<WorkflowFlowNode>([]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState<WorkflowFlowEdge>([]);
  const historyRef = useRef<{ past: HistorySnapshot[]; future: HistorySnapshot[] }>({ past: [], future: [] });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(false);
  const [createdAt, setCreatedAt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [lastRunAt, setLastRunAt] = useState<string | undefined>(undefined);
  /** Id of the run currently in flight, if any — set as soon as `runtime.run` reports one, so `stop()`
   *  can cancel it; cleared once the run settles. */
  const currentRunIdRef = useRef<string | undefined>(undefined);
  /** Controller for whichever single-node execution (`runNode` / `runNodeWithUpstream`) is currently
   *  in flight, if any — `stopNode()` aborts it. Cleared once that call settles. */
  const currentNodeRunControllerRef = useRef<AbortController | undefined>(undefined);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const syncHistoryFlags = useCallback(() => {
    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(historyRef.current.future.length > 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const workflow = await repository.get(workflowId);
      if (cancelled) return;
      if (!workflow) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      setName(workflow.name);
      setDescription(workflow.description ?? "");
      setActive(workflow.active);
      setCreatedAt(workflow.createdAt);
      setNodes(toFlowNodes(workflow.nodes));
      setEdges(toFlowEdges(workflow.connections));
      historyRef.current = { past: [], future: [] };
      syncHistoryFlags();
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // Only reload from the repository when switching to a different workflow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId, repository, syncHistoryFlags]);

  const buildWorkflowDefinition = useCallback((): WorkflowDefinition => {
    return {
      id: workflowId,
      name,
      description: description || undefined,
      active,
      createdAt,
      updatedAt: new Date().toISOString(),
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.nodeType,
        name: node.data.label,
        position: node.position,
        parameters: node.data.parameters,
        disabled: node.data.disabled,
      })),
      connections: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceOutput: edge.sourceHandle ?? undefined,
        targetInput: edge.targetHandle ?? undefined,
      })),
    };
  }, [active, createdAt, description, edges, name, nodes, workflowId]);

  const pushHistory = useCallback(() => {
    const { past } = historyRef.current;
    past.push({ nodes, edges });
    if (past.length > MAX_HISTORY) past.shift();
    historyRef.current.future = [];
    syncHistoryFlags();
  }, [nodes, edges, syncHistoryFlags]);

  const onNodesChange = useCallback(
    (changes: NodeChange<WorkflowFlowNode>[]) => {
      const isCommit = changes.some(
        (change) => (change.type === "position" && change.dragging === false) || change.type === "remove"
      );
      if (isCommit) pushHistory();
      onNodesChangeInternal(changes);
    },
    [onNodesChangeInternal, pushHistory]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<WorkflowFlowEdge>[]) => {
      const isCommit = changes.some((change) => change.type === "remove");
      if (isCommit) pushHistory();
      onEdgesChangeInternal(changes);
    },
    [onEdgesChangeInternal, pushHistory]
  );

  const undo = useCallback(() => {
    const { past, future } = historyRef.current;
    const previous = past.pop();
    if (!previous) return;
    future.push({ nodes, edges });
    if (future.length > MAX_HISTORY) future.shift();
    setNodes(previous.nodes);
    setEdges(previous.edges);
    syncHistoryFlags();
  }, [nodes, edges, setNodes, setEdges, syncHistoryFlags]);

  const redo = useCallback(() => {
    const { past, future } = historyRef.current;
    const next = future.pop();
    if (!next) return;
    past.push({ nodes, edges });
    if (past.length > MAX_HISTORY) past.shift();
    setNodes(next.nodes);
    setEdges(next.edges);
    syncHistoryFlags();
  }, [nodes, edges, setNodes, setEdges, syncHistoryFlags]);

  const onConnect = useCallback(
    (connection: Connection) => {
      pushHistory();
      setEdges((current) => addEdge({ ...connection, id: crypto.randomUUID() }, current));
    },
    [pushHistory, setEdges]
  );

  const addNode = useCallback(
    (nodeTypeKey: string, position?: { x: number; y: number }, connectFrom?: { nodeId: string; output: string }) => {
      pushHistory();
      const nodeType = getNodeType(nodeTypeKey);
      const parameters = Object.fromEntries(nodeType.parameters.map((field) => [field.key, field.default]));
      const id = crypto.randomUUID();

      let resolvedPosition = position;
      if (!resolvedPosition) {
        const source = connectFrom ? nodes.find((n) => n.id === connectFrom.nodeId) : undefined;
        resolvedPosition = source
          ? { x: source.position.x + 220, y: source.position.y }
          : { x: 240, y: 160 + nodes.length * 40 };
      }

      const node: WorkflowFlowNode = {
        id,
        type: "workflowNode",
        position: resolvedPosition,
        data: { nodeType: nodeTypeKey, label: nodeType.displayName, parameters },
      };
      setNodes((current) => [...current, node]);

      if (connectFrom) {
        setEdges((current) =>
          addEdge(
            {
              id: crypto.randomUUID(),
              source: connectFrom.nodeId,
              sourceHandle: connectFrom.output,
              target: id,
              targetHandle: (nodeType.inputs ?? ["main"])[0],
            },
            current
          )
        );
      }

      return id;
    },
    [nodes, setNodes, setEdges, getNodeType, pushHistory]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      pushHistory();
      setNodes((current) => current.filter((node) => node.id !== nodeId));
      setEdges((current) => current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setNodes, setEdges, pushHistory]
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      pushHistory();
      setEdges((current) => current.filter((edge) => edge.id !== edgeId));
    },
    [setEdges, pushHistory]
  );

  const toggleNodeDisabled = useCallback(
    (nodeId: string) => {
      pushHistory();
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, disabled: !node.data.disabled } } : node
        )
      );
    },
    [setNodes, pushHistory]
  );

  const duplicateSelectedNodes = useCallback(() => {
    if (!nodes.some((node) => node.selected)) return;
    pushHistory();
    setNodes((current) => {
      const selected = current.filter((node) => node.selected);
      if (selected.length === 0) return current;
      const idMap = new Map(selected.map((node) => [node.id, crypto.randomUUID()]));
      const duplicates: WorkflowFlowNode[] = selected.map((node) => ({
        ...node,
        id: idMap.get(node.id)!,
        selected: true,
        position: { x: node.position.x + 32, y: node.position.y + 32 },
        data: { ...node.data },
      }));
      return [...current.map((node) => ({ ...node, selected: false })), ...duplicates];
    });
  }, [nodes, setNodes, pushHistory]);

  const selectAllNodes = useCallback(
    (selected: boolean) => {
      setNodes((current) => current.map((node) => ({ ...node, selected })));
    },
    [setNodes]
  );

  const updateNodeParameter = useCallback(
    (nodeId: string, key: string, value: unknown) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, parameters: { ...node.data.parameters, [key]: value } } }
            : node
        )
      );
    },
    [setNodes]
  );

  const save = useCallback(async () => {
    const workflow = buildWorkflowDefinition();
    await repository.save(workflow);
  }, [buildWorkflowDefinition, repository]);

  const toggleActive = useCallback(async () => {
    const next = !active;
    setActive(next);
    await repository.setActive(workflowId, next);
  }, [active, repository, workflowId]);

  const run = useCallback(async () => {
    setRunStatus("running");
    setNodes((current) =>
      current.map((node) => ({ ...node, data: { ...node.data, status: undefined, result: undefined } }))
    );
    const workflow = buildWorkflowDefinition();
    const result = await runtime.run(workflow, {
      onRunStart: (runId) => {
        currentRunIdRef.current = runId;
      },
      onNodeStart: (nodeId) => {
        setNodes((current) =>
          current.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, status: "running" } } : node))
        );
      },
      onNodeFinish: (nodeId, nodeResult: NodeExecutionResult) => {
        setNodes((current) =>
          current.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, status: nodeResult.status, result: nodeResult } }
              : node
          )
        );
      },
    });
    currentRunIdRef.current = undefined;
    if (result.status === "cancelled") {
      // Any node that never got a result (still showing the "running" spinner from onNodeStart's
      // best-effort guess) settles as cancelled instead of spinning forever.
      setNodes((current) =>
        current.map((node) =>
          node.data.status === "running" ? { ...node, data: { ...node.data, status: "cancelled" } } : node
        )
      );
    }
    setRunStatus(result.status);
    setLastRunAt(result.finishedAt);
  }, [buildWorkflowDefinition, setNodes, runtime]);

  const stop = useCallback(async () => {
    const runId = currentRunIdRef.current;
    if (!runId || !runtime.cancel) return;
    await runtime.cancel(runId);
  }, [runtime]);

  const runNode = useCallback(
    async (nodeId: string, input: NodeExecutionData[]) => {
      if (!runtime.runNode) throw new Error("This runtime does not support executing a single node.");
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const controller = new AbortController();
      currentNodeRunControllerRef.current = controller;
      setNodes((current) =>
        current.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, status: "running" } } : n))
      );
      try {
        const inputHandles = getNodeType(node.data.nodeType).inputs ?? ["main"];
        const inputGroups = getNodeInputGroups(nodeId, nodes, edges, inputHandles);
        const nodeContext = getAncestorNodeContext(nodeId, nodes, edges);
        const result = await runtime.runNode(
          node.data.nodeType,
          node.data.parameters,
          input,
          controller.signal,
          inputGroups,
          nodeContext
        );
        setNodes((current) =>
          current.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, status: result.status, result } } : n))
        );
        return result;
      } catch (error) {
        if (isAbortError(error)) {
          setNodes((current) =>
            current.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, status: "cancelled" } } : n))
          );
          return undefined;
        }
        throw error;
      } finally {
        currentNodeRunControllerRef.current = undefined;
      }
    },
    [nodes, edges, runtime, setNodes, getNodeType]
  );

  /**
   * The NDV "Execute" action: runs every upstream ancestor of `nodeId` (in topological order,
   * skipping disabled ones) and then, unless `includeTarget` is false, the node itself — so its
   * INPUT column is populated from a fresh run instead of requiring the whole workflow to have
   * been run already. `includeTarget: false` backs the INPUT column's "Execute Node Before" button,
   * which only wants ancestors run so the target node's input is populated, not the node itself.
   */
  const runNodeWithUpstream = useCallback(
    async (nodeId: string, includeTarget = true) => {
      if (!runtime.runNode) throw new Error("This runtime does not support executing a single node.");

      const workflow = buildWorkflowDefinition();
      const order = topologicalSort(workflow.nodes, workflow.connections);

      const ancestors = new Set(getAncestorNodes(nodeId, nodes, edges).map((node) => node.id));
      const runOrder = order.filter((id) => (includeTarget && id === nodeId) || ancestors.has(id));

      const controller = new AbortController();
      currentNodeRunControllerRef.current = controller;
      try {
        let snapshot = nodes;
        let lastResult: NodeExecutionResult | undefined;
        for (const id of runOrder) {
          // Cooperative cancel between nodes — checked before each one starts, same shape as the
          // whole-workflow Stop button; the node currently in flight (if any) still finishes.
          if (controller.signal.aborted) break;

          const node = snapshot.find((n) => n.id === id);
          if (!node || node.data.disabled) continue;

          setNodes((current) =>
            current.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: "running" } } : n))
          );
          const inputHandles = getNodeType(node.data.nodeType).inputs ?? ["main"];
          const input = getNodeInputData(id, snapshot, edges);
          const inputGroups = getNodeInputGroups(id, snapshot, edges, inputHandles);
          const nodeContext = getAncestorNodeContext(id, snapshot, edges);
          let result: NodeExecutionResult;
          try {
            // Ancestors must run in order — a downstream node's input depends on an upstream node's
            // freshly-computed output — so this cannot be parallelized with Promise.all.
            // oxlint-disable-next-line no-await-in-loop
            result = await runtime.runNode(
              node.data.nodeType,
              node.data.parameters,
              input,
              controller.signal,
              inputGroups,
              nodeContext
            );
          } catch (error) {
            if (isAbortError(error)) {
              snapshot = snapshot.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: "cancelled" } } : n));
              setNodes(snapshot);
              break;
            }
            throw error;
          }
          snapshot = snapshot.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, status: result.status, result } } : n
          );
          setNodes(snapshot);
          if (id === nodeId) lastResult = result;
        }
        return lastResult;
      } finally {
        currentNodeRunControllerRef.current = undefined;
      }
    },
    [nodes, edges, runtime, setNodes, buildWorkflowDefinition, getNodeType]
  );

  const stopNode = useCallback(() => {
    currentNodeRunControllerRef.current?.abort();
  }, []);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteNode,
    deleteEdge,
    toggleNodeDisabled,
    duplicateSelectedNodes,
    selectAllNodes,
    updateNodeParameter,
    undo,
    redo,
    canUndo,
    canRedo,
    name,
    setName,
    description,
    setDescription,
    active,
    toggleActive,
    isLoading,
    notFound,
    runStatus,
    lastRunAt,
    save,
    run,
    stop,
    canStop: Boolean(runtime.cancel),
    runNode,
    runNodeWithUpstream,
    stopNode,
  };
}
