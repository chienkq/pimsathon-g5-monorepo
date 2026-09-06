import { ReactFlowProvider } from "@xyflow/react";
import { useState } from "react";
import { NodeInspectorPanel } from "./panels/NodeInspectorPanel.js";
import { NodeLibraryPanel } from "./panels/NodeLibraryPanel.js";
import { useWorkflowEditorState } from "./useWorkflowEditorState.js";
import { WorkflowCanvas } from "./WorkflowCanvas.js";

export interface WorkflowEditorViewProps {
  workflowId: string;
  onBack: () => void;
}

export function WorkflowEditorView({ workflowId, onBack }: WorkflowEditorViewProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorViewInner workflowId={workflowId} onBack={onBack} />
    </ReactFlowProvider>
  );
}

function WorkflowEditorViewInner({ workflowId, onBack }: WorkflowEditorViewProps) {
  const editor = useWorkflowEditorState(workflowId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  if (editor.isLoading) {
    return <p className="wf-muted">Loading…</p>;
  }
  if (editor.notFound) {
    return (
      <div className="wf-editor">
        <p className="wf-muted">Workflow not found.</p>
        <button type="button" className="wf-button" onClick={onBack}>
          Back to workflows
        </button>
      </div>
    );
  }

  const selectedNode = editor.nodes.find((node) => node.id === selectedNodeId);

  const handleSave = async () => {
    setIsSaving(true);
    await editor.save();
    setIsSaving(false);
  };

  return (
    <div className="wf-editor">
      <header className="wf-editor__toolbar">
        <button type="button" className="wf-button" onClick={onBack}>
          ← Back
        </button>
        <input
          className="wf-input wf-editor__name"
          value={editor.name}
          onChange={(event) => editor.setName(event.target.value)}
        />
        <label className="wf-switch">
          <input type="checkbox" checked={editor.active} onChange={() => void editor.toggleActive()} />
          <span>{editor.active ? "Active" : "Inactive"}</span>
        </label>
        <button type="button" className="wf-button" disabled={isSaving} onClick={() => void handleSave()}>
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className="wf-button wf-button--primary"
          disabled={editor.runStatus === "running"}
          onClick={() => void editor.run()}
        >
          {editor.runStatus === "running" ? "Running…" : "Run"}
        </button>
        <span className={`wf-run-status wf-run-status--${editor.runStatus}`}>
          {editor.runStatus === "idle" ? "" : editor.runStatus}
          {editor.lastRunAt ? ` · ${new Date(editor.lastRunAt).toLocaleTimeString()}` : ""}
        </span>
      </header>

      <div className="wf-editor__body">
        <NodeLibraryPanel />
        <WorkflowCanvas
          nodes={editor.nodes}
          edges={editor.edges}
          onNodesChange={editor.onNodesChange}
          onEdgesChange={editor.onEdgesChange}
          onConnect={editor.onConnect}
          onSelectNode={setSelectedNodeId}
          onAddNode={editor.addNode}
        />
        <NodeInspectorPanel
          node={selectedNode}
          onChangeParameter={editor.updateNodeParameter}
          onClose={() => setSelectedNodeId(undefined)}
        />
      </div>
    </div>
  );
}
