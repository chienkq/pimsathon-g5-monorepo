import type {
  NodeExecutionData,
  NodeExecutionResult,
  WorkflowConnection,
  WorkflowDefinition,
  WorkflowNodeDefinition,
} from "@chienkq/workflow-core";
import { addEdge, useEdgesState, useNodesState, type Connection } from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";
import { useWorkflowRepository } from "../context/WorkflowRepositoryContext.js";
import { useNodeTypeLookup, useWorkflowRuntime } from "../context/WorkflowRuntimeContext.js";
import type { WorkflowFlowEdge, WorkflowFlowNode } from "./types.js";

export type RunStatus = "idle" | "running" | "success" | "error";

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
  }));
}

export function useWorkflowEditorState(workflowId: string) {
  const repository = useWorkflowRepository();
  const runtime = useWorkflowRuntime();
  const getNodeType = useNodeTypeLookup();
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowFlowEdge>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(false);
  const [createdAt, setCreatedAt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [lastRunAt, setLastRunAt] = useState<string | undefined>(undefined);

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
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // Only reload from the repository when switching to a different workflow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId, repository]);

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
      })),
    };
  }, [active, createdAt, description, edges, name, nodes, workflowId]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) => addEdge({ ...connection, id: crypto.randomUUID() }, current));
    },
    [setEdges]
  );

  const addNode = useCallback(
    (nodeTypeKey: string, position?: { x: number; y: number }, connectFrom?: { nodeId: string; output: string }) => {
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
              targetHandle: "main",
            },
            current
          )
        );
      }

      return id;
    },
    [nodes, setNodes, setEdges, getNodeType]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((current) => current.filter((node) => node.id !== nodeId));
      setEdges((current) => current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((current) => current.filter((edge) => edge.id !== edgeId));
    },
    [setEdges]
  );

  const toggleNodeDisabled = useCallback(
    (nodeId: string) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, disabled: !node.data.disabled } } : node
        )
      );
    },
    [setNodes]
  );

  const duplicateSelectedNodes = useCallback(() => {
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
  }, [setNodes]);

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
    setRunStatus(result.status);
    setLastRunAt(result.finishedAt);
  }, [buildWorkflowDefinition, setNodes, runtime]);

  const runNode = useCallback(
    async (nodeId: string, input: NodeExecutionData[]) => {
      if (!runtime.runNode) throw new Error("This runtime does not support executing a single node.");
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      setNodes((current) =>
        current.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, status: "running" } } : n))
      );
      const result = await runtime.runNode(node.data.nodeType, node.data.parameters, input);
      setNodes((current) =>
        current.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, status: result.status, result } } : n))
      );
      return result;
    },
    [nodes, runtime, setNodes]
  );

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
    runNode,
  };
}
