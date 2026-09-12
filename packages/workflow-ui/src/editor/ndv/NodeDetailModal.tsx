import { validateNode, type NodeExecutionData, type NodeExecutionResult } from "@chienkq/workflow-core";
import { useEffect, useState } from "react";
import { useNodeType } from "../../context/WorkflowRuntimeContext.js";
import { SvgNodeIcon } from "../nodes/SvgNodeIcon.js";
import { ParameterField } from "../panels/ParameterField.js";
import type { WorkflowFlowEdge, WorkflowFlowNode } from "../types.js";
import { getNodeInputData } from "./getNodeInputData.js";
import { JsonTree } from "./JsonTree.js";

export interface NodeDetailModalProps {
  node: WorkflowFlowNode;
  nodes: WorkflowFlowNode[];
  edges: WorkflowFlowEdge[];
  onChangeParameter: (nodeId: string, key: string, value: unknown) => void;
  /** Runs this node in isolation (the "Execute" button) — omitted when the runtime doesn't support it. */
  onExecute?: (nodeId: string, input: NodeExecutionData[]) => Promise<NodeExecutionResult | undefined>;
  onClose: () => void;
}

function DataColumn({
  title,
  items,
  emptyHint,
  error,
}: {
  title: string;
  items: unknown[];
  emptyHint: string;
  error?: string;
}) {
  return (
    <div className="wf-ndv-column wf-ndv-column--data">
      <div className="wf-ndv-column__header">
        <span>{title}</span>
        {items.length > 0 && (
          <span className="wf-ndv-column__count">
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <div className="wf-ndv-column__body">
        {error ? (
          <p className="wf-run-result__error">{error}</p>
        ) : items.length === 0 ? (
          <p className="wf-muted">{emptyHint}</p>
        ) : (
          <JsonTree data={items} />
        )}
      </div>
    </div>
  );
}

export function NodeDetailModal({ node, nodes, edges, onChangeParameter, onExecute, onClose }: NodeDetailModalProps) {
  const nodeType = useNodeType(node.data.nodeType);
  const issues = validateNode(nodeType, node.data.parameters);
  const resolveParamValue = (key: string): unknown => {
    if (node.data.parameters[key] !== undefined) return node.data.parameters[key];
    return nodeType.parameters.find((field) => field.key === key)?.default;
  };
  const inputData = getNodeInputData(node.id, nodes, edges);
  const inputItems = inputData.map((item) => item.json);
  const outputBranches = node.data.result?.branches ?? {};
  const outputItems = Object.values(outputBranches)
    .flat()
    .map((item) => item.json);
  const isRunning = node.data.status === "running";
  const [executeError, setExecuteError] = useState<string | undefined>(undefined);

  const handleExecute = async () => {
    if (!onExecute) return;
    setExecuteError(undefined);
    try {
      await onExecute(node.id, inputData);
    } catch (error) {
      setExecuteError(error instanceof Error ? error.message : String(error));
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="wf-ndv-backdrop" onClick={onClose}>
      <div className="wf-ndv" role="dialog" aria-label={node.data.label} onClick={(event) => event.stopPropagation()}>
        <header className="wf-ndv__header">
          <span className="wf-ndv__icon" style={{ ["--wf-icon-color" as string]: nodeType.color }}>
            <SvgNodeIcon nodeType={nodeType.type} displayName={nodeType.displayName} className="wf-ndv__icon-glyph" />
          </span>
          <div className="wf-ndv__heading">
            <h2>{node.data.label}</h2>
            <p className="wf-muted">{nodeType.description}</p>
          </div>
          {node.data.status && (
            <span className={`wf-run-result__status wf-run-result__status--${node.data.status}`}>
              {node.data.status}
            </span>
          )}
          {onExecute && (
            <button
              type="button"
              className="wf-button wf-button--primary wf-ndv__execute"
              onClick={() => void handleExecute()}
              disabled={isRunning}
            >
              {isRunning ? "Executing…" : "Execute"}
            </button>
          )}
          <button type="button" className="wf-ndv__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="wf-ndv__main">
          <DataColumn title="INPUT" items={inputItems} emptyHint="No input data. Connect and run an upstream node." />

          <div className="wf-ndv-column wf-ndv-column--settings">
            <div className="wf-ndv-column__header">
              <span>PARAMETERS</span>
            </div>
            <div className="wf-ndv-column__body">
              {issues.length > 0 && (
                <ul className="wf-ndv-issues">
                  {issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
              {nodeType.parameters.length === 0 ? (
                <p className="wf-muted">This node has no parameters.</p>
              ) : (
                <div className="wf-field-list">
                  {nodeType.parameters
                    .filter(
                      (field) =>
                        !field.showWhen ||
                        field.showWhen.values.includes(String(resolveParamValue(field.showWhen.key) ?? ""))
                    )
                    .map((field) => (
                      <ParameterField
                        key={field.key}
                        field={field}
                        value={node.data.parameters[field.key]}
                        onChange={(value) => onChangeParameter(node.id, field.key, value)}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>

          <DataColumn
            title="OUTPUT"
            items={outputItems}
            emptyHint="No output yet. Execute this node or the workflow to see data here."
            error={executeError ?? (node.data.result?.status === "error" ? node.data.result.error : undefined)}
          />
        </div>
      </div>
    </div>
  );
}
