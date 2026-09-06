import type { WorkflowSummary } from "@chienkq/workflow-core";
import { useCallback, useEffect, useState } from "react";
import { useWorkflowRepository } from "../context/WorkflowRepositoryContext.js";

export interface WorkflowListViewProps {
  onOpenWorkflow: (workflowId: string) => void;
}

export function WorkflowListView({ onOpenWorkflow }: WorkflowListViewProps) {
  const repository = useWorkflowRepository();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newWorkflowName, setNewWorkflowName] = useState("");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const list = await repository.list();
    setWorkflows(list);
    setIsLoading(false);
  }, [repository]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreate = useCallback(async () => {
    const name = newWorkflowName.trim() || "Untitled workflow";
    const workflow = await repository.create(name);
    setNewWorkflowName("");
    await refresh();
    onOpenWorkflow(workflow.id);
  }, [newWorkflowName, onOpenWorkflow, refresh, repository]);

  const handleDuplicate = useCallback(
    async (id: string) => {
      await repository.duplicate(id);
      await refresh();
    },
    [refresh, repository]
  );

  const handleRemove = useCallback(
    async (id: string, name: string) => {
      if (!window.confirm(`Delete workflow "${name}"? This cannot be undone.`)) return;
      await repository.remove(id);
      await refresh();
    },
    [refresh, repository]
  );

  const handleToggleActive = useCallback(
    async (id: string, active: boolean) => {
      await repository.setActive(id, active);
      await refresh();
    },
    [refresh, repository]
  );

  return (
    <div className="wf-list">
      <header className="wf-list__header">
        <h1 className="wf-list__title">Workflows</h1>
        <div className="wf-list__create">
          <input
            className="wf-input"
            placeholder="New workflow name"
            value={newWorkflowName}
            onChange={(event) => setNewWorkflowName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleCreate();
            }}
          />
          <button type="button" className="wf-button wf-button--primary" onClick={() => void handleCreate()}>
            New workflow
          </button>
        </div>
      </header>

      {isLoading ? (
        <p className="wf-muted">Loading…</p>
      ) : workflows.length === 0 ? (
        <p className="wf-muted">No workflows yet. Create one to get started.</p>
      ) : (
        <table className="wf-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Nodes</th>
              <th>Updated</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {workflows.map((workflow) => (
              <tr key={workflow.id}>
                <td>
                  <button type="button" className="wf-link" onClick={() => onOpenWorkflow(workflow.id)}>
                    {workflow.name}
                  </button>
                </td>
                <td>
                  <label className="wf-switch">
                    <input
                      type="checkbox"
                      checked={workflow.active}
                      onChange={(event) => void handleToggleActive(workflow.id, event.target.checked)}
                    />
                    <span>{workflow.active ? "Active" : "Inactive"}</span>
                  </label>
                </td>
                <td>{workflow.nodeCount}</td>
                <td>{new Date(workflow.updatedAt).toLocaleString()}</td>
                <td className="wf-table__actions">
                  <button type="button" className="wf-button" onClick={() => void handleDuplicate(workflow.id)}>
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="wf-button wf-button--danger"
                    onClick={() => void handleRemove(workflow.id, workflow.name)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
