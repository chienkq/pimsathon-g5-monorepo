import {
  Background,
  Controls,
  ReactFlow,
  useReactFlow,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { useCallback, type DragEvent } from "react";
import { GenericNode } from "./nodes/GenericNode.js";
import type { WorkflowFlowEdge, WorkflowFlowNode } from "./types.js";

const nodeTypes = { workflowNode: GenericNode };

export interface WorkflowCanvasProps {
  nodes: WorkflowFlowNode[];
  edges: WorkflowFlowEdge[];
  onNodesChange: OnNodesChange<WorkflowFlowNode>;
  onEdgesChange: OnEdgesChange<WorkflowFlowEdge>;
  onConnect: OnConnect;
  onSelectNode: (nodeId: string | undefined) => void;
  onAddNode: (nodeTypeKey: string, position: { x: number; y: number }) => void;
}

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectNode,
  onAddNode,
}: WorkflowCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const nodeTypeKey = event.dataTransfer.getData("application/x-workflow-node-type");
      if (!nodeTypeKey) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      onAddNode(nodeTypeKey, position);
    },
    [onAddNode, screenToFlowPosition]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div className="wf-canvas" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_event, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(undefined)}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
