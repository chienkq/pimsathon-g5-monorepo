import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { CanvasEdge } from "./edges/CanvasEdge.js";
import { GenericNode } from "./nodes/GenericNode.js";
import type { AddNodeRequest, WorkflowFlowEdge, WorkflowFlowNode } from "./types.js";

const nodeTypes = { workflowNode: GenericNode };
const edgeTypes = { workflowEdge: CanvasEdge };

export interface WorkflowCanvasProps {
  nodes: WorkflowFlowNode[];
  edges: WorkflowFlowEdge[];
  onNodesChange: OnNodesChange<WorkflowFlowNode>;
  onEdgesChange: OnEdgesChange<WorkflowFlowEdge>;
  onConnect: OnConnect;
  onOpenNode: (nodeId: string) => void;
  onRequestAddNode: (request: AddNodeRequest) => void;
  onExecute: () => void;
  isRunning: boolean;
}

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onOpenNode,
  onRequestAddNode,
  onExecute,
  isRunning,
}: WorkflowCanvasProps) {
  const isEmpty = nodes.length === 0;

  return (
    <div className="wf-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={(_event, node) => onOpenNode(node.id)}
        defaultEdgeOptions={{
          type: "workflowEdge",
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "#9497a1" },
          style: { stroke: "#9497a1", strokeWidth: 2, strokeLinecap: "square" },
        }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
        selectionOnDrag
        panOnDrag={[1, 2]}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#d7d9e0" />
        <Controls showInteractive={false} />
      </ReactFlow>

      <div className="wf-canvas-toolbar">
        <button
          type="button"
          className="wf-canvas-toolbar__btn"
          title="Add node"
          onClick={() => onRequestAddNode({ mode: isEmpty ? "trigger" : "node" })}
        >
          +
        </button>
        <button
          type="button"
          className="wf-canvas-toolbar__btn"
          title="Search nodes"
          onClick={() => onRequestAddNode({ mode: isEmpty ? "trigger" : "node" })}
        >
          ⌕
        </button>
        <button type="button" className="wf-canvas-toolbar__btn" title="Sticky note" disabled>
          ▤
        </button>
      </div>

      {isEmpty && (
        <div className="wf-empty-state">
          <button type="button" className="wf-empty-state__box" onClick={() => onRequestAddNode({ mode: "trigger" })}>
            <span className="wf-empty-state__plus">+</span>
          </button>
          <span className="wf-empty-state__or">or</span>
          <div className="wf-empty-state__box wf-empty-state__box--ai" aria-disabled>
            <span className="wf-empty-state__sparkle">✦</span>
          </div>
          <div className="wf-empty-state__labels">
            <span>Add first step…</span>
            <span className="wf-empty-state__label-spacer" />
            <span>Build with AI</span>
          </div>
        </div>
      )}

      {!isEmpty && (
        <button type="button" className="wf-execute-button" disabled={isRunning} onClick={onExecute}>
          {isRunning ? "Running…" : "▶ Execute workflow"}
        </button>
      )}
    </div>
  );
}
