import {
  LocalWorkflowRuntime,
  type NodeTypeMeta,
  type WorkflowRuntime,
  type WorkflowRuntimeAiAgentSummary,
  type WorkflowRuntimeProjectSummary,
} from "@chienkq/workflow-core";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const WorkflowRuntimeContext = createContext<WorkflowRuntime | null>(null);
const NodeTypesContext = createContext<NodeTypeMeta[] | null>(null);
const ProjectsContext = createContext<WorkflowRuntimeProjectSummary[]>([]);
const AiAgentsContext = createContext<WorkflowRuntimeAiAgentSummary[]>([]);

export interface WorkflowRuntimeProviderProps {
  /** Defaults to `LocalWorkflowRuntime` (in-browser, no real integrations). Pass an HTTP-backed one to run against a real backend. */
  runtime?: WorkflowRuntime;
  children: ReactNode;
}

/**
 * Fetches the node type list once (via `runtime.listNodeTypes()`) and holds it alongside the
 * runtime itself, so every consumer (Add Node panel, canvas, NDV) reads from one already-loaded
 * list instead of each re-fetching or falling back to a synchronous local registry.
 */
export function WorkflowRuntimeProvider({ runtime, children }: WorkflowRuntimeProviderProps) {
  const resolvedRuntime = useMemo<WorkflowRuntime>(() => runtime ?? new LocalWorkflowRuntime(), [runtime]);
  const [nodeTypes, setNodeTypes] = useState<NodeTypeMeta[]>([]);
  const [projects, setProjects] = useState<WorkflowRuntimeProjectSummary[]>([]);
  const [aiAgents, setAiAgents] = useState<WorkflowRuntimeAiAgentSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    void resolvedRuntime.listNodeTypes().then((types) => {
      if (!cancelled) setNodeTypes(types);
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedRuntime]);

  useEffect(() => {
    let cancelled = false;
    void resolvedRuntime.listProjects?.().then((loaded) => {
      if (!cancelled) setProjects(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedRuntime]);

  useEffect(() => {
    let cancelled = false;
    void resolvedRuntime.listAiAgents?.().then((loaded) => {
      if (!cancelled) setAiAgents(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedRuntime]);

  return (
    <WorkflowRuntimeContext.Provider value={resolvedRuntime}>
      <NodeTypesContext.Provider value={nodeTypes}>
        <ProjectsContext.Provider value={projects}>
          <AiAgentsContext.Provider value={aiAgents}>{children}</AiAgentsContext.Provider>
        </ProjectsContext.Provider>
      </NodeTypesContext.Provider>
    </WorkflowRuntimeContext.Provider>
  );
}

export function useWorkflowRuntime(): WorkflowRuntime {
  const runtime = useContext(WorkflowRuntimeContext);
  if (!runtime) throw new Error("useWorkflowRuntime must be used within a WorkflowRuntimeProvider");
  return runtime;
}

/** The full node type list, once loaded (empty until the runtime's fetch resolves). */
export function useNodeTypes(): NodeTypeMeta[] {
  const nodeTypes = useContext(NodeTypesContext);
  if (!nodeTypes) throw new Error("useNodeTypes must be used within a WorkflowRuntimeProvider");
  return nodeTypes;
}

/** Placeholder for a node type absent from the loaded list — e.g. a saved node whose type was removed, or looked up before load finishes. */
function unknownNodeTypeMeta(type: string): NodeTypeMeta {
  return {
    type,
    displayName: `Unknown node (${type})`,
    description: "This node type isn't available. Delete this node or replace it with a supported one.",
    group: "core",
    color: "#94a3b8",
    hasInput: true,
    outputs: ["main"],
    parameters: [],
  };
}

/** A stable `(type) => NodeTypeMeta` lookup against the loaded list — for call sites (a `.map` loop, a non-component callback) that can't call the `useNodeType` hook per item. */
export function useNodeTypeLookup(): (type: string) => NodeTypeMeta {
  const nodeTypes = useNodeTypes();
  return useMemo(() => {
    const byType = new Map(nodeTypes.map((nodeType) => [nodeType.type, nodeType]));
    return (type: string) => byType.get(type) ?? unknownNodeTypeMeta(type);
  }, [nodeTypes]);
}

export function useNodeType(type: string): NodeTypeMeta {
  return useNodeTypeLookup()(type);
}

/** The live project list, once loaded — empty under `LocalWorkflowRuntime` or before the fetch resolves. */
export function useProjects(): WorkflowRuntimeProjectSummary[] {
  return useContext(ProjectsContext);
}

/** The live AI Agent catalog, once loaded — empty under `LocalWorkflowRuntime` or before the fetch resolves. */
export function useAiAgents(): WorkflowRuntimeAiAgentSummary[] {
  return useContext(AiAgentsContext);
}
