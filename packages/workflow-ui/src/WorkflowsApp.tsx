// oxlint-disable-next-line no-unassigned-import
import "@xyflow/react/dist/style.css";
// oxlint-disable-next-line no-unassigned-import
import "./styles/workflow-ui.css";
import type { WorkflowRepository, WorkflowRuntime } from "@chienkq/workflow-core";
import { useState } from "react";
import { WorkflowRepositoryProvider } from "./context/WorkflowRepositoryContext.js";
import { WorkflowRuntimeProvider } from "./context/WorkflowRuntimeContext.js";
import { WorkflowEditorView } from "./editor/WorkflowEditorView.js";
import type { RunLogsView } from "./editor/types.js";
import { WorkflowListView } from "./list/WorkflowListView.js";

export interface WorkflowsAppProps {
  /** Defaults to a `localStorage`-backed repository. Pass an HTTP-backed one once a real backend exists. */
  repository?: WorkflowRepository;
  /** Defaults to `LocalWorkflowRuntime` (in-browser node list + execution, no real integrations). Pass an HTTP-backed one to serve the node type list and run workflows from a real backend. */
  runtime?: WorkflowRuntime;
  /**
   * Controlled mode: pass the workflow id currently open (e.g. parsed from the host app's URL).
   * Omit to let `WorkflowsApp` manage list ↔ editor navigation with its own internal state.
   */
  workflowId?: string;
  /** Called when the user opens a workflow from the list (or creates a new one). Required in controlled mode. */
  onOpenWorkflow?: (workflowId: string) => void;
  /** Called when the user navigates back to the list from the editor. Required in controlled mode. */
  onBack?: () => void;
  /**
   * Controlled mode for the editor's Run Logs panel (list of past runs / one run's detail) — pass
   * the view parsed from the host app's URL so both faces are deep-linkable. Omit to let the
   * editor manage it with its own internal state.
   */
  runLogsView?: RunLogsView;
  /** Called whenever the Run Logs panel's view should change. Required in controlled mode. */
  onRunLogsViewChange?: (view: RunLogsView | undefined) => void;
}

/**
 * Mount this behind the admin UI's left-menu "Workflows" item (see `workflowNavItem`). By default
 * it manages its own list ↔ editor navigation internally, so no router integration is required to
 * get it working. Pass `workflowId`/`onOpenWorkflow`/`onBack` to put the host app's own routing
 * (e.g. a URL hash) in control instead, so a workflow can be deep-linked directly to its editor.
 */
export function WorkflowsApp({
  repository,
  runtime,
  workflowId,
  onOpenWorkflow,
  onBack,
  runLogsView,
  onRunLogsViewChange,
}: WorkflowsAppProps) {
  const [internalOpenWorkflowId, setInternalOpenWorkflowId] = useState<string | undefined>(undefined);
  const isControlled = workflowId !== undefined;
  const openWorkflowId = isControlled ? workflowId : internalOpenWorkflowId;
  const handleOpenWorkflow = onOpenWorkflow ?? setInternalOpenWorkflowId;
  const handleBack = onBack ?? (() => setInternalOpenWorkflowId(undefined));

  return (
    <WorkflowRepositoryProvider repository={repository}>
      <WorkflowRuntimeProvider runtime={runtime}>
        <div className="wf-app">
          {openWorkflowId ? (
            <WorkflowEditorView
              workflowId={openWorkflowId}
              onBack={handleBack}
              runLogsView={runLogsView}
              onRunLogsViewChange={onRunLogsViewChange}
            />
          ) : (
            <WorkflowListView onOpenWorkflow={handleOpenWorkflow} />
          )}
        </div>
      </WorkflowRuntimeProvider>
    </WorkflowRepositoryProvider>
  );
}
