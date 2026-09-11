export { WorkflowsApp, type WorkflowsAppProps } from "./WorkflowsApp.js";
export { workflowNavItem, type WorkflowNavItem } from "./nav.js";
export {
  WorkflowRepositoryProvider,
  useWorkflowRepository,
  type WorkflowRepositoryProviderProps,
} from "./context/WorkflowRepositoryContext.js";
export { WorkflowListView, type WorkflowListViewProps } from "./list/WorkflowListView.js";
export { WorkflowEditorView, type WorkflowEditorViewProps } from "./editor/WorkflowEditorView.js";
export type { RunLogsView } from "./editor/types.js";

// Re-exported so a host admin UI can implement its own `WorkflowRepository`/`WorkflowRuntime`
// (e.g. HTTP-backed) without needing a direct dependency on `workflow-core`.
export type {
  NodeExecutionResult,
  NodeRunStatus,
  WorkflowDefinition,
  WorkflowRepository,
  WorkflowRunDetail,
  WorkflowRunSummary,
  WorkflowRuntime,
  WorkflowSummary,
} from "@chienkq/workflow-core";
