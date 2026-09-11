import type { WorkflowRunDetail, WorkflowRunSummary } from "@chienkq/workflow-core";
import { useEffect, useState } from "react";
import { useNodeTypeLookup, useWorkflowRuntime } from "../../context/WorkflowRuntimeContext.js";
import { SvgNodeIcon } from "../nodes/SvgNodeIcon.js";
import type { RunLogsView, WorkflowFlowNode } from "../types.js";

export interface WorkflowRunLogsPanelProps {
  workflowId: string;
  view: RunLogsView;
  /** Current editor nodes — used to resolve a run's node ids to their display name/type/icon. */
  nodes: WorkflowFlowNode[];
  onSelectRun: (runId: string) => void;
  onBackToList: () => void;
  onClose: () => void;
}

function formatTime(iso?: string): string {
  return iso ? new Date(iso).toLocaleString() : "—";
}

function formatDuration(startedAt: string, finishedAt?: string): string {
  if (!finishedAt) return "";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function RunStatusBadge({ status }: { status: string }) {
  return <span className={`wf-run-result__status wf-run-result__status--${status}`}>{status}</span>;
}

function RunList({
  workflowId,
  onSelectRun,
  onClose,
}: {
  workflowId: string;
  onSelectRun: (runId: string) => void;
  onClose: () => void;
}) {
  const runtime = useWorkflowRuntime();
  const [runs, setRuns] = useState<WorkflowRunSummary[] | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setRuns(undefined);
    setError(undefined);
    void runtime
      .listRuns?.(workflowId)
      .then((result) => {
        if (!cancelled) setRuns(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load run logs.");
      });
    return () => {
      cancelled = true;
    };
  }, [runtime, workflowId]);

  return (
    <>
      <header className="wf-run-panel__header">
        <h2 className="wf-run-panel__title">Run logs</h2>
        <button type="button" className="wf-add-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>
      <div className="wf-run-panel__body">
        {error && <p className="wf-run-result__error">{error}</p>}
        {!error && runs === undefined && <p className="wf-muted">Loading…</p>}
        {!error && runs?.length === 0 && (
          <p className="wf-muted">No runs yet. Publish or trigger this workflow to see logs here.</p>
        )}
        {runs?.map((run) => (
          <button type="button" key={run.id} className="wf-run-row" onClick={() => onSelectRun(run.id)}>
            <div className="wf-run-row__main">
              <RunStatusBadge status={run.status} />
              <span className="wf-run-row__trigger">{run.trigger}</span>
            </div>
            <div className="wf-run-row__meta">
              <span>{formatTime(run.startedAt)}</span>
              <span>{formatDuration(run.startedAt, run.finishedAt)}</span>
            </div>
            {run.error && <p className="wf-run-row__error">{run.error}</p>}
          </button>
        ))}
      </div>
    </>
  );
}

function RunDetail({
  workflowId,
  runId,
  nodes,
  onBackToList,
  onClose,
}: {
  workflowId: string;
  runId: string;
  nodes: WorkflowFlowNode[];
  onBackToList: () => void;
  onClose: () => void;
}) {
  const runtime = useWorkflowRuntime();
  const getNodeType = useNodeTypeLookup();
  const [run, setRun] = useState<WorkflowRunDetail | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setRun(undefined);
    setError(undefined);
    void runtime
      .getRun?.(workflowId, runId)
      .then((result) => {
        if (!cancelled) setRun(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load run detail.");
      });
    return () => {
      cancelled = true;
    };
  }, [runtime, workflowId, runId]);

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  // Last-executed node on top, first-executed node on the bottom — a top-down timeline read as "what
  // happened, most recent first", matching how the user asked to review a failed run.
  const timeline = run
    ? Object.entries(run.nodeResults).sort(
        ([, a], [, b]) =>
          new Date(b.finishedAt ?? b.startedAt).getTime() - new Date(a.finishedAt ?? a.startedAt).getTime()
      )
    : [];

  return (
    <>
      <header className="wf-run-panel__header">
        <button type="button" className="wf-link wf-run-panel__back" onClick={onBackToList}>
          ← Back
        </button>
        <h2 className="wf-run-panel__title">Run detail</h2>
        <button type="button" className="wf-add-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>
      <div className="wf-run-panel__body">
        {error && <p className="wf-run-result__error">{error}</p>}
        {!error && run === undefined && <p className="wf-muted">Loading…</p>}
        {run && (
          <>
            <div className="wf-run-detail__summary">
              <RunStatusBadge status={run.status} />
              <span className="wf-run-row__trigger">{run.trigger}</span>
              <span>{formatTime(run.startedAt)}</span>
              <span>{formatDuration(run.startedAt, run.finishedAt)}</span>
            </div>
            {run.error && <p className="wf-run-result__error">{run.error}</p>}
            <ol className="wf-run-timeline">
              {timeline.map(([nodeId, result]) => {
                const node = nodeById.get(nodeId);
                const nodeType = node ? getNodeType(node.data.nodeType) : undefined;
                return (
                  <li key={nodeId} className="wf-run-timeline__item">
                    <div className="wf-run-timeline__head">
                      {nodeType && (
                        <span
                          className="wf-run-timeline__icon"
                          style={{ ["--wf-icon-color" as string]: nodeType.color }}
                        >
                          <SvgNodeIcon
                            nodeType={nodeType.type}
                            displayName={nodeType.displayName}
                            className="wf-run-timeline__icon-glyph"
                          />
                        </span>
                      )}
                      <span className="wf-run-timeline__name">{node?.data.label ?? nodeId}</span>
                      <RunStatusBadge status={result.status} />
                    </div>
                    <div className="wf-run-timeline__meta">
                      <span>{formatTime(result.startedAt)}</span>
                      <span>{formatDuration(result.startedAt, result.finishedAt)}</span>
                    </div>
                    {result.error && <p className="wf-run-result__error">{result.error}</p>}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>
    </>
  );
}

export function WorkflowRunLogsPanel({
  workflowId,
  view,
  nodes,
  onSelectRun,
  onBackToList,
  onClose,
}: WorkflowRunLogsPanelProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="wf-scrim" onClick={onClose} />
      <aside className="wf-run-panel" role="dialog" aria-label="Run logs">
        {view === "list" ? (
          <RunList workflowId={workflowId} onSelectRun={onSelectRun} onClose={onClose} />
        ) : (
          <RunDetail
            workflowId={workflowId}
            runId={view.runId}
            nodes={nodes}
            onBackToList={onBackToList}
            onClose={onClose}
          />
        )}
      </aside>
    </>
  );
}
