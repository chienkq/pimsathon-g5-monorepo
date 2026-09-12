/** A single data item flowing between nodes, modeled after n8n's `{ json }` item shape. */
export interface NodeExecutionData {
  json: Record<string, unknown>;
}

export type ParameterFieldType = "string" | "number" | "boolean" | "select" | "json" | "code" | "filter";

export interface ParameterFieldOption {
  label: string;
  value: string;
}

/**
 * n8n-style filter/condition builder value — matches the real shape of n8n's `FilterValue`
 * (packages/workflow/src/interfaces.ts), pared down to what this app's nodes need: no
 * exists/empty/regex operators, no nested left-value expressions (the left side is always one of
 * the node's own field names, picked from a fixed list via `ParameterField.filterFields`).
 */
export type FilterOperatorType = "string" | "number";
export interface FilterOperatorValue {
  type: FilterOperatorType;
  operation: string;
}
export interface FilterConditionValue {
  id: string;
  leftField: string;
  operator: FilterOperatorValue;
  rightValue: unknown;
}
export type FilterCombinator = "and" | "or";
export interface FilterValue {
  combinator: FilterCombinator;
  conditions: FilterConditionValue[];
}
export interface FilterFieldOption {
  label: string;
  value: string;
  type: FilterOperatorType;
  /** Known values to offer as autosuggest in the condition's value input (e.g. a status/priority's fixed set) — doesn't restrict input, just suggests. */
  valueOptions?: ParameterFieldOption[];
  /**
   * Names a runtime-fetched source of autosuggest values instead of a static `valueOptions` list —
   * e.g. `"projects"` for the live project list. Resolved client-side by whatever consumes this
   * field (see workflow-ui's `useProjects()`); kept as a plain string (not a function) since
   * `ParameterField` is served as JSON over `/api/node-types`.
   */
  dynamicValueOptions?: "projects";
}

export interface ParameterField {
  key: string;
  label: string;
  type: ParameterFieldType;
  default: unknown;
  placeholder?: string;
  helpText?: string;
  options?: ParameterFieldOption[];
  /** Only used when `type === "filter"` — the field names the user can pick as a condition's left side. */
  filterFields?: FilterFieldOption[];
  /**
   * Only meaningful when `type === "select"` — names a runtime-fetched source of options instead of a
   * static `options` list, e.g. `"aiAgents"` for the live AI Agent catalog (Settings → AI Agents).
   * Resolved client-side by whatever consumes this field (see workflow-ui's `useAiAgents()`), kept as
   * a plain string (not a function) since `ParameterField` is served as JSON over `/api/node-types`.
   */
  dynamicOptions?: "aiAgents";
  /** Config-time validation: node shows an "issues" warning while this field is empty. */
  required?: boolean;
  /** Only rendered/validated when another field on the same node currently holds one of these values (e.g. show "Title" only when `action` is "Create" or "Update"). */
  showWhen?: { key: string; values: string[] };
}

/** n8n-style node-creator categories (matches n8n's real grouping, not its literal category labels). */
export type NodeGroup = "ai" | "app" | "flow" | "core" | "humanReview" | "data" | "platform";

/** One incoming connection's items, tagged with the upstream node it came from (see `NodeExecuteContext.inputs`). */
export interface NodeExecuteInputGroup {
  sourceNodeName: string;
  items: NodeExecutionData[];
}

export interface NodeExecuteContext {
  parameters: Record<string, unknown>;
  input: NodeExecutionData[];
  /**
   * Same items as `input`, grouped by incoming connection (in connection order) instead of
   * flattened, each group tagged with its source node's name — lets a node distinguish "items
   * from my 1st input" vs "items from my 2nd input" (e.g. `merge`'s combine mode, keyed by source
   * node name). Only populated by `executeWorkflow` (full workflow runs); undefined for
   * single-node test execution, where nodes should fall back to treating `input` as one group.
   */
  inputs?: NodeExecuteInputGroup[];
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
  /**
   * Named input handles, in handle display order. Defaults to a single `["main"]` handle when
   * omitted — only nodes that need to keep multiple incoming connections distinct (e.g. `merge`'s
   * "Input 1"/"Input 2") declare more than one.
   */
  inputs?: string[];
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
  /** Target input handle name (see `NodeTypeDefinition.inputs`); defaults to "main" when omitted. */
  targetInput?: string;
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
