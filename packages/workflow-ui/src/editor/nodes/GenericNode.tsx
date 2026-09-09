import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useNodeType } from "../../context/WorkflowRuntimeContext.js";
import type { WorkflowFlowNode } from "../types.js";
import { SvgNodeIcon } from "./SvgNodeIcon.js";

const STATUS_LABEL: Record<string, string> = {
  running: "Running…",
  success: "Success",
  error: "Error",
  skipped: "Skipped",
};

export function GenericNode({ data, selected }: NodeProps<WorkflowFlowNode>) {
  const nodeType = useNodeType(data.nodeType);
  const statusClass = data.status ? `wf-node--${data.status}` : "";
  const isTrigger = nodeType.isTrigger === true;

  return (
    <div className={`wf-node-wrapper ${selected ? "wf-node-wrapper--selected" : ""}`}>
      {(data.onDelete || data.onToggleDisabled) && (
        <div className="wf-node-toolbar">
          {data.onToggleDisabled && (
            <button
              type="button"
              className="wf-node-toolbar__btn"
              title={data.disabled ? "Enable node" : "Disable node"}
              onClick={(event) => {
                event.stopPropagation();
                data.onToggleDisabled?.();
              }}
            >
              {data.disabled ? "▷" : "⏻"}
            </button>
          )}
          {data.onDelete && (
            <button
              type="button"
              className="wf-node-toolbar__btn wf-node-toolbar__btn--danger"
              title="Delete node"
              onClick={(event) => {
                event.stopPropagation();
                data.onDelete?.();
              }}
            >
              🗑
            </button>
          )}
        </div>
      )}

      {nodeType.hasInput && <Handle type="target" position={Position.Left} id="main" className="wf-handle" />}

      <div
        className={`wf-node ${isTrigger ? "wf-node--trigger" : ""} ${statusClass} ${data.disabled ? "wf-node--disabled" : ""}`}
        style={{ ["--wf-node-color" as string]: nodeType.color }}
      >
        <SvgNodeIcon nodeType={nodeType.type} displayName={nodeType.displayName} />
        {data.status === "running" && <span className="wf-node__spinner" />}
        {data.disabled && <span className="wf-node__disabled-strike" />}
        {!data.disabled && data.issues && data.issues.length > 0 && (
          <span className="wf-node__issue" title={data.issues.join("\n")}>
            ▲
          </span>
        )}
      </div>

      <div className="wf-node__label">
        <div className="wf-node__name">
          {data.label}
          {data.disabled && <span className="wf-node__disabled-tag"> (disabled)</span>}
        </div>
        <div className="wf-node__subtitle">{nodeType.description}</div>
        {data.status && (
          <span className={`wf-node__status wf-node__status--${data.status}`}>
            {STATUS_LABEL[data.status] ?? data.status}
          </span>
        )}
      </div>

      {nodeType.outputs.map((output, index) => {
        const top = `${((index + 1) / (nodeType.outputs.length + 1)) * 100}%`;
        const isConnected = data.connectedOutputs?.includes(output) ?? false;
        return (
          <div key={output} className="wf-node__output" style={{ top }}>
            {nodeType.outputs.length > 1 && <span className="wf-node__handle-label">{output}</span>}
            <Handle type="source" position={Position.Right} id={output} className="wf-handle" style={{ top: "50%" }} />
            {!isConnected && data.onAddFromOutput && (
              <button
                type="button"
                className="wf-node__add-output"
                title="Add node"
                onClick={(event) => {
                  event.stopPropagation();
                  data.onAddFromOutput?.(output);
                }}
              >
                +
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
