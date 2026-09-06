// oxlint-disable-next-line no-unassigned-import
import "@xyflow/react/dist/style.css";
// oxlint-disable-next-line no-unassigned-import
import "./styles/workflow-ui.css";
import type { WorkflowRepository } from "@chienkq/workflow-core";
import { useState } from "react";
import { WorkflowRepositoryProvider } from "./context/WorkflowRepositoryContext.js";
import { WorkflowEditorView } from "./editor/WorkflowEditorView.js";
import { WorkflowListView } from "./list/WorkflowListView.js";

export interface WorkflowsAppProps {
  /** Defaults to a `localStorage`-backed repository. Pass an HTTP-backed one once a real backend exists. */
  repository?: WorkflowRepository;
}

/**
 * Self-contained entry point: mount this behind the admin UI's left-menu "Workflows" item (see
 * `workflowNavItem`). It manages its own list ↔ editor navigation internally, so no router
 * integration is required to get it working.
 */
export function WorkflowsApp({ repository }: WorkflowsAppProps) {
  const [openWorkflowId, setOpenWorkflowId] = useState<string | undefined>(undefined);

  return (
    <WorkflowRepositoryProvider repository={repository}>
      <div className="wf-app">
        {openWorkflowId ? (
          <WorkflowEditorView workflowId={openWorkflowId} onBack={() => setOpenWorkflowId(undefined)} />
        ) : (
          <WorkflowListView onOpenWorkflow={setOpenWorkflowId} />
        )}
      </div>
    </WorkflowRepositoryProvider>
  );
}
