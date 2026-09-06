import {
  executeWorkflow,
  getNodeType,
  type NodeExecutionResult,
  type WorkflowConnection,
  type WorkflowDefinition,
  type WorkflowNodeDefinition,
} from "@chienkq/workflow-core";
import { addEdge, useEdgesState, useNodesState, type Connection } from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";
import { useWorkflowRepository } from "../context/WorkflowRepositoryContext.js";
import type { WorkflowFlowEdge, WorkflowFlowNode } from "./types.js";

export type RunStatus = "idle" | "running" | "success" | "error";

function toFlowNodes(nodes: WorkflowNodeDefinition[]): WorkflowFlowNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: "workflowNode",
    position: node.position,
    data: { nodeType: node.type, label: node.name, parameters: node.parameters },
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
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowFlowEdge>([]);
  const [name, setName] = useState("");
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
      active,
      createdAt,
      updatedAt: new Date().toISOString(),
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.nodeType,
        name: node.data.label,
        position: node.position,
        parameters: node.data.parameters,
      })),
      connections: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceOutput: edge.sourceHandle ?? undefined,
      })),
    };
  }, [active, createdAt, edges, name, nodes, workflowId]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) => addEdge({ ...connection, id: crypto.randomUUID() }, current));
    },
    [setEdges]
  );

  const addNode = useCallback(
    (nodeTypeKey: string, position: { x: number; y: number }) => {
      const nodeType = getNodeType(nodeTypeKey);
      const parameters = Object.fromEntries(nodeType.parameters.map((field) => [field.key, field.default]));
      const id = crypto.randomUUID();
      const node: WorkflowFlowNode = {
        id,
        type: "workflowNode",
        position,
        data: { nodeType: nodeTypeKey, label: nodeType.displayName, parameters },
      };
      setNodes((current) => [...current, node]);
      return id;
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
    const result = await executeWorkflow(workflow, {
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
  }, [buildWorkflowDefinition, setNodes]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNodeParameter,
    name,
    setName,
    active,
    toggleActive,
    isLoading,
    notFound,
    runStatus,
    lastRunAt,
    save,
    run,
  };
}
