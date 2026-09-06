import { listNodeTypes, type NodeGroup } from "@chienkq/workflow-core";
import type { DragEvent } from "react";

const GROUP_LABEL: Record<NodeGroup, string> = {
  trigger: "Triggers",
  action: "Actions",
  logic: "Logic",
};

function onDragStart(event: DragEvent, nodeTypeKey: string) {
  event.dataTransfer.setData("application/x-workflow-node-type", nodeTypeKey);
  event.dataTransfer.effectAllowed = "move";
}

export function NodeLibraryPanel() {
  const nodeTypes = listNodeTypes();
  const groups: NodeGroup[] = ["trigger", "action", "logic"];

  return (
    <aside className="wf-panel wf-panel--library">
      <h2 className="wf-panel__title">Nodes</h2>
      {groups.map((group) => {
        const groupNodeTypes = nodeTypes.filter((nodeType) => nodeType.group === group);
        if (groupNodeTypes.length === 0) return null;
        return (
          <div key={group} className="wf-node-group">
            <h3 className="wf-node-group__title">{GROUP_LABEL[group]}</h3>
            {groupNodeTypes.map((nodeType) => (
              <div
                key={nodeType.type}
                className="wf-node-card"
                style={{ borderLeftColor: nodeType.color }}
                draggable
                onDragStart={(event) => onDragStart(event, nodeType.type)}
                title={nodeType.description}
              >
                {nodeType.displayName}
              </div>
            ))}
          </div>
        );
      })}
      <p className="wf-muted wf-panel__hint">Drag a node onto the canvas to add it.</p>
    </aside>
  );
}
