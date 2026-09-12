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
  /** Config-time validation: node shows an "issues" warning while this field is empty. */
  required?: boolean;
}

/** n8n-style node-creator categories (matches n8n's real grouping, not its literal category labels). */
export type NodeGroup = "ai" | "app" | "flow" | "core" | "humanReview" | "data" | "platform";

export interface NodeExecuteContext {
  parameters: Record<string, unknown>;
  input: NodeExecutionData[];
  /** Host-injected integrations (DB clients, API clients) — undefined in the browser engine, provided by backend. */
  services?: Record<string, unknown>;
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
  /** Renders with the pill-shaped trigger silhouette and is offered in "what starts this workflow" mode. */
  isTrigger?: boolean;
  /** Branch names, in handle display order. */
  outputs: string[];
  parameters: ParameterField[];
  execute(ctx: NodeExecuteContext): Promise<NodeExecuteResult>;
}

/**
 * `NodeTypeDefinition` minus `execute` — the shape served by a `WorkflowRuntime.listNodeTypes()`,
 * since a function can't cross an HTTP boundary. UI code that only renders/validates nodes (the Add
 * Node panel, canvas, NDV) should depend on this, not the full definition.
 */
export type NodeTypeMeta = Omit<NodeTypeDefinition, "execute">;

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
  /** Free-text explanation of what the workflow does, shown wherever a workflow is referenced outside its own editor (e.g. the Related Workflows list on a Work Item). */
  description?: string;
  nodes: WorkflowNodeDefinition[];
  connections: WorkflowConnection[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  /** Built-in workflow registered at server startup (e.g. Jira Sync) — can't be deleted. Defaults to false; not settable from the editor. */
  isSystem?: boolean;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  updatedAt: string;
  nodeCount: number;
  isSystem?: boolean;
}
