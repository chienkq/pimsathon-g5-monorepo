import { getNodeType } from "@chienkq/workflow-core";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { WorkflowFlowNode } from "../types.js";

const STATUS_LABEL: Record<string, string> = {
  running: "Running…",
  success: "Success",
  error: "Error",
  skipped: "Skipped",
};

export function GenericNode({ data, selected }: NodeProps<WorkflowFlowNode>) {
  const nodeType = getNodeType(data.nodeType);
  const statusClass = data.status ? `wf-node--${data.status}` : "";

  return (
    <div
      className={`wf-node ${selected ? "wf-node--selected" : ""} ${statusClass}`}
      style={{ borderLeftColor: nodeType.color }}
    >
      {nodeType.hasInput && <Handle type="target" position={Position.Left} id="main" />}

      <div className="wf-node__body">
        <span className="wf-node__title">{data.label}</span>
        {data.status && <span className="wf-node__status">{STATUS_LABEL[data.status] ?? data.status}</span>}
      </div>

      {nodeType.outputs.map((output, index) => {
        const top = `${((index + 1) / (nodeType.outputs.length + 1)) * 100}%`;
        return (
          <div key={output} className="wf-node__output" style={{ top }}>
            {nodeType.outputs.length > 1 && <span className="wf-node__handle-label">{output}</span>}
            <Handle type="source" position={Position.Right} id={output} style={{ top: "50%" }} />
          </div>
        );
      })}
    </div>
  );
}
