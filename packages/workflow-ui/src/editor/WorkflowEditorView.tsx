import { getNodeType, validateNode } from "@chienkq/workflow-core";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import { CANVAS_DEFAULT_ZOOM, CANVAS_FIT_VIEW_OPTIONS } from "./canvasConstants.js";
import { NodeDetailModal } from "./ndv/NodeDetailModal.js";
import { AddNodePanel } from "./panels/AddNodePanel.js";
import type { AddNodeRequest, WorkflowFlowEdge, WorkflowFlowNode } from "./types.js";
import { useWorkflowEditorState } from "./useWorkflowEditorState.js";
import { WorkflowCanvas } from "./WorkflowCanvas.js";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

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
  const [openNodeId, setOpenNodeId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [addRequest, setAddRequest] = useState<AddNodeRequest | undefined>(undefined);

  const connectedOutputsByNode = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const edge of editor.edges) {
      const output = edge.sourceHandle ?? "main";
      const set = map.get(edge.source) ?? new Set<string>();
      set.add(output);
      map.set(edge.source, set);
    }
    return map;
  }, [editor.edges]);

  const nodesWithHandlers: WorkflowFlowNode[] = useMemo(
    () =>
      editor.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          connectedOutputs: Array.from(connectedOutputsByNode.get(node.id) ?? []),
          onAddFromOutput: (output: string) =>
            setAddRequest({ mode: "node", sourceNodeId: node.id, sourceOutput: output }),
          onDelete: () => editor.deleteNode(node.id),
          onToggleDisabled: () => editor.toggleNodeDisabled(node.id),
          issues: validateNode(getNodeType(node.data.nodeType), node.data.parameters),
        },
      })),
    [editor.nodes, connectedOutputsByNode, editor.deleteNode, editor.toggleNodeDisabled]
  );

  const edgesWithHandlers: WorkflowFlowEdge[] = useMemo(
    () =>
      editor.edges.map((edge) => ({
        ...edge,
        data: { ...edge.data, onDelete: editor.deleteEdge },
      })),
    [editor.edges, editor.deleteEdge]
  );

  const reactFlow = useReactFlow();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || addRequest || openNodeId) return;
      const meta = event.ctrlKey || event.metaKey;

      if (meta && event.key.toLowerCase() === "a") {
        event.preventDefault();
        editor.selectAllNodes(true);
      } else if (meta && event.key.toLowerCase() === "d") {
        event.preventDefault();
        editor.duplicateSelectedNodes();
      } else if (event.key === "Escape") {
        editor.selectAllNodes(false);
      } else if (event.key === "Tab") {
        event.preventDefault();
        setAddRequest({ mode: editor.nodes.length === 0 ? "trigger" : "node" });
      } else if (event.key === "Enter") {
        const selected = editor.nodes.filter((node) => node.selected);
        if (selected.length === 1) {
          event.preventDefault();
          setOpenNodeId(selected[0].id);
        }
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        void reactFlow.zoomIn();
      } else if (event.key === "-") {
        event.preventDefault();
        void reactFlow.zoomOut();
      } else if (event.key === "0") {
        event.preventDefault();
        void reactFlow.zoomTo(CANVAS_DEFAULT_ZOOM);
      } else if (event.key === "1") {
        event.preventDefault();
        void reactFlow.fitView(CANVAS_FIT_VIEW_OPTIONS);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, addRequest, openNodeId, reactFlow]);

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

  const openNode = editor.nodes.find((node) => node.id === openNodeId);

  const handleSave = async () => {
    setIsSaving(true);
    await editor.save();
    setIsSaving(false);
  };

  const handleSelectNodeType = (nodeTypeKey: string) => {
    if (!addRequest) return;
    const newId = editor.addNode(
      nodeTypeKey,
      undefined,
      addRequest.sourceNodeId
        ? { nodeId: addRequest.sourceNodeId, output: addRequest.sourceOutput ?? "main" }
        : undefined
    );
    setAddRequest(undefined);
    setOpenNodeId(newId);
  };

  return (
    <div className="wf-editor">
      <header className="wf-editor__toolbar">
        <button type="button" className="wf-link wf-editor__back" onClick={onBack}>
          ← Back
        </button>
        <span className="wf-editor__crumb-sep">/</span>
        <input
          className="wf-input wf-editor__name"
          value={editor.name}
          onChange={(event) => editor.setName(event.target.value)}
        />
        <span className="wf-editor__spacer" />
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
          {editor.runStatus === "running" ? "Running…" : "Publish"}
        </button>
        {editor.runStatus !== "idle" && (
          <span className={`wf-run-status wf-run-status--${editor.runStatus}`}>
            {editor.runStatus}
            {editor.lastRunAt ? ` · ${new Date(editor.lastRunAt).toLocaleTimeString()}` : ""}
          </span>
        )}
      </header>

      <div className="wf-editor__body">
        <WorkflowCanvas
          nodes={nodesWithHandlers}
          edges={edgesWithHandlers}
          onNodesChange={editor.onNodesChange}
          onEdgesChange={editor.onEdgesChange}
          onConnect={editor.onConnect}
          onOpenNode={setOpenNodeId}
          onRequestAddNode={setAddRequest}
          onExecute={() => void editor.run()}
          isRunning={editor.runStatus === "running"}
        />
      </div>

      <AddNodePanel request={addRequest} onClose={() => setAddRequest(undefined)} onSelect={handleSelectNodeType} />

      {openNode && (
        <NodeDetailModal
          node={openNode}
          nodes={editor.nodes}
          edges={editor.edges}
          onChangeParameter={editor.updateNodeParameter}
          onClose={() => setOpenNodeId(undefined)}
        />
      )}
    </div>
  );
}
