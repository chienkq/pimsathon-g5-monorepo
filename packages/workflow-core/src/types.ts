/** A single data item flowing between nodes, modeled after n8n's `{ json }` item shape. */
export interface NodeExecutionData {
  json: Record<string, unknown>;
}

export type ParameterFieldType = "string" | "number" | "boolean" | "select" | "json" | "code";

export interface ParameterFieldOption {
  label: string;
  value: string;
}

export interface ParameterField {
  key: string;
  label: string;
  type: ParameterFieldType;
  default: unknown;
  placeholder?: string;
  helpText?: string;
  options?: ParameterFieldOption[];
}

export type NodeGroup = "trigger" | "action" | "logic";

export interface NodeExecuteContext {
  parameters: Record<string, unknown>;
  input: NodeExecutionData[];
}

/** Output items keyed by branch name (most node types only use "main"; `ifCondition` uses "true"/"false"). */
export interface NodeExecuteResult {
  branches: Record<string, NodeExecutionData[]>;
}

export interface NodeTypeDefinition {
  type: string;
  displayName: string;
  description: string;
  group: NodeGroup;
  /** Hex color used for the node's header/border in the canvas. */
  color: string;
  hasInput: boolean;
  /** Branch names, in handle display order. */
  outputs: string[];
  parameters: ParameterField[];
  execute(ctx: NodeExecuteContext): Promise<NodeExecuteResult>;
}

export interface WorkflowNodeDefinition {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  parameters: Record<string, unknown>;
  /** Disabled nodes are skipped during execution, as if they weren't in the graph. */
  disabled?: boolean;
}

export interface WorkflowConnection {
  id: string;
  source: string;
  /** Source branch name; defaults to "main" when omitted. */
  sourceOutput?: string;
  target: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: WorkflowNodeDefinition[];
  connections: WorkflowConnection[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
  nodeCount: number;
}
