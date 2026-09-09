import { listNodeTypes, type NodeGroup } from "@chienkq/workflow-core";
import { useMemo, useState } from "react";
import { SvgNodeIcon } from "../nodes/SvgNodeIcon.js";
import type { AddNodeRequest } from "../types.js";

const GROUP_LABEL: Record<NodeGroup, string> = {
  ai: "AI Nodes",
  app: "Action in Apps",
  platform: "Platform",
  data: "Data",
  flow: "Flow",
  core: "Core",
  humanReview: "Human Review",
};

const GROUP_ORDER: NodeGroup[] = ["ai", "app", "platform", "data", "flow", "core", "humanReview"];

const TRIGGER_HELP: Record<string, string> = {
  webhook: "Runs the flow when this URL is called externally. Good for getting started quickly",
};

export interface AddNodePanelProps {
  request: AddNodeRequest | undefined;
  onClose: () => void;
  onSelect: (nodeTypeKey: string) => void;
}

export function AddNodePanel({ request, onClose, onSelect }: AddNodePanelProps) {
  const [query, setQuery] = useState("");
  const allNodeTypes = listNodeTypes();

  const groups = GROUP_ORDER;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = request?.mode === "trigger" ? allNodeTypes.filter((nodeType) => nodeType.isTrigger) : allNodeTypes;
    if (!q) return base;
    return base.filter(
      (nodeType) => nodeType.displayName.toLowerCase().includes(q) || nodeType.description.toLowerCase().includes(q)
    );
  }, [allNodeTypes, query, request?.mode]);

  if (!request) return null;

  const title = request.mode === "trigger" ? "What triggers this workflow?" : "Add a node";
  const subtitle =
    request.mode === "trigger"
      ? "A trigger is a step that starts your workflow"
      : "Connect a new step to your workflow";

  return (
    <>
      <div className="wf-scrim" onClick={onClose} />
      <aside className="wf-add-panel" role="dialog" aria-label={title}>
        <button type="button" className="wf-add-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 className="wf-add-panel__title">{title}</h2>
        <p className="wf-add-panel__subtitle">{subtitle}</p>

        <div className="wf-add-panel__search">
          <span className="wf-add-panel__search-icon">⌕</span>
          <input
            autoFocus
            className="wf-input"
            placeholder="Search nodes…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="wf-add-panel__list">
          {groups.map((group) => {
            const groupNodeTypes = filtered.filter((nodeType) => nodeType.group === group);
            if (groupNodeTypes.length === 0) return null;
            return (
              <div key={group} className="wf-node-group">
                {groups.length > 1 && <h3 className="wf-node-group__title">{GROUP_LABEL[group]}</h3>}
                {groupNodeTypes.map((nodeType) => (
                  <button
                    type="button"
                    key={nodeType.type}
                    className="wf-add-node-row"
                    onClick={() => onSelect(nodeType.type)}
                  >
                    <span className="wf-add-node-row__icon" style={{ ["--wf-icon-color" as string]: nodeType.color }}>
                      <SvgNodeIcon
                        nodeType={nodeType.type}
                        displayName={nodeType.displayName}
                        className="wf-add-node-row__icon-glyph"
                      />
                    </span>
                    <span className="wf-add-node-row__text">
                      <span className="wf-add-node-row__name">{nodeType.displayName}</span>
                      <span className="wf-add-node-row__desc">
                        {TRIGGER_HELP[nodeType.type] ?? nodeType.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="wf-muted">No nodes match “{query}”.</p>}
        </div>
      </aside>
    </>
  );
}
