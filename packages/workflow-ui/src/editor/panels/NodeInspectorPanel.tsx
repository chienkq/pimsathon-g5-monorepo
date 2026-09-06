import { getNodeType } from "@chienkq/workflow-core";
import type { WorkflowFlowNode } from "../types.js";
import { ParameterField } from "./ParameterField.js";

export interface NodeInspectorPanelProps {
  node: WorkflowFlowNode | undefined;
  onChangeParameter: (nodeId: string, key: string, value: unknown) => void;
  onClose: () => void;
}

export function NodeInspectorPanel({ node, onChangeParameter, onClose }: NodeInspectorPanelProps) {
  if (!node) {
    return (
      <aside className="wf-panel wf-panel--inspector">
        <p className="wf-muted">Select a node to edit its parameters.</p>
      </aside>
    );
  }

  const nodeType = getNodeType(node.data.nodeType);
  const result = node.data.result;

  return (
    <aside className="wf-panel wf-panel--inspector">
      <div className="wf-panel__header">
        <h2 className="wf-panel__title">{nodeType.displayName}</h2>
        <button type="button" className="wf-button" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="wf-muted">{nodeType.description}</p>

      {nodeType.parameters.length === 0 ? (
        <p className="wf-muted">This node has no parameters.</p>
      ) : (
        <div className="wf-field-list">
          {nodeType.parameters.map((field) => (
            <ParameterField
              key={field.key}
              field={field}
              value={node.data.parameters[field.key]}
              onChange={(value) => onChangeParameter(node.id, field.key, value)}
            />
          ))}
        </div>
      )}

      {result && (
        <div className="wf-run-result">
          <h3 className="wf-panel__title">Last run</h3>
          <p className={`wf-run-result__status wf-run-result__status--${result.status}`}>{result.status}</p>
          {result.error && <p className="wf-run-result__error">{result.error}</p>}
          {result.branches && <pre className="wf-json-preview">{JSON.stringify(result.branches, null, 2)}</pre>}
        </div>
      )}
    </aside>
  );
}
