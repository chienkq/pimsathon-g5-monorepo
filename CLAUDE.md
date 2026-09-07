# Repo map

Turborepo (pnpm workspaces) with 2 apps + 3 packages. Read this before exploring — it says what's where and why, so you don't have to re-derive it each session.

## Apps

### `apps/admin-ui` — the shell app

React + Vite. Mounts everything else behind a nav. Not itself the focus of active work.

- `src/App.tsx`, `src/main.tsx`, `src/state/navigation.ts` — top-level shell + nav routing
- `src/state/store.tsx` — app state
- `src/domain/*` — commands, github integration, seed data, storage, types (this app's own domain, unrelated to workflow-core)
- `src/features/{github,planning,projects,work-items}/*` — feature panels behind nav items
- Mounts `<WorkflowsApp />` from `packages/workflow-ui` behind the "Workflows" nav item
- Has e2e (Playwright, `e2e/demo.spec.ts`) and unit tests (`tests/domain.test.ts`)

## Packages — the active project: n8n clone

**Context:** the real work in this repo is cloning n8n's workflow editor (canvas + node UI/UX) into `packages/workflow-ui`, verified pixel/interaction-for-interaction against n8n's actual source, not approximated. Full history/rationale/status: see auto-memory `n8n_clone_request.md` and `n8n_clone_gap_tracker.md` (13-item gap checklist, updated as items land). n8n's real source for comparison lives at `/home/chienkq2/github/n8n` (frontend: `packages/frontend/editor-ui`, `packages/frontend/@n8n/design-system`).

An earlier, unrelated workflow-editor attempt (`packages/workflows`) was deleted — doesn't exist, don't look for it or resurrect it.

### `packages/workflow-core` — Vue-free execution engine + node type registry

Pure TS, no UI framework. Reusable as-is by any frontend.

- `src/types.ts` — core types: `WorkflowNodeDefinition` (has `disabled?`), `ParameterField` (has `required?`), `NodeExecutionResult`, etc.
- `src/nodeTypes/*` — one file per node type: `code.ts`, `httpRequest.ts`, `ifCondition.ts`, `manualTrigger.ts`, `merge.ts`, `noOp.ts`, `setFields.ts`; `index.ts` re-exports the registry
- `src/engine/executeWorkflow.ts` — runs a workflow (skips `disabled` nodes)
- `src/engine/topologicalSort.ts` — DAG ordering for execution
- `src/engine/validateNode.ts` — config-time "issues" validation (required-field emptiness, JSON-field parseability) — deliberately separate from post-run execution errors
- `src/repository/*` — `WorkflowRepository` interface + `InMemoryWorkflowRepository` / `LocalStorageWorkflowRepository` implementations
- `src/index.ts` — package public exports
- **Build note:** workflow-ui imports workflow-core's compiled `dist/*.d.ts`, not live source. After ANY change here (types, exports, new fields), run `pnpm build` in this package before workflow-ui will see it — otherwise new fields silently look like type errors downstream.

### `packages/workflow-ui` — the React canvas (all n8n-clone UI work lands here)

React + `@xyflow/react` (React Flow), reimplementing n8n's Vue/vue-flow canvas behavior in React (not reusing n8n's code).

- `src/WorkflowsApp.tsx` — package entry component, mounted by admin-ui
- `src/list/WorkflowListView.tsx` — workflow list screen
- `src/context/WorkflowRepositoryContext.tsx` — provides a `WorkflowRepository` down the tree
- `src/editor/WorkflowEditorView.tsx` — main editor screen; owns `nodesWithHandlers` memo (computes per-node `issues` via `validateNode`), keyboard shortcut handling (Ctrl/Cmd+A select-all, Ctrl/Cmd+D duplicate, Escape deselect, Tab open node-creator, Enter open NDV, +/-/0/1 zoom)
- `src/editor/WorkflowCanvas.tsx` — React Flow canvas wrapper (selectionOnDrag, panOnDrag middle/right-click)
- `src/editor/useWorkflowEditorState.ts` — state hook: node/edge CRUD, `deleteNode`, `deleteEdge`, `toggleNodeDisabled`, `duplicateSelectedNodes`, `selectAllNodes`
- `src/editor/types.ts` — `WorkflowNodeData` (has `issues?`), UI-layer types
- `src/editor/canvasConstants.ts` — layout/sizing constants
- `src/editor/nodes/GenericNode.tsx` — the node box rendering: hover toolbar (enable/disable, delete), disabled strike-through overlay, validation warning triangle w/ tooltip
- `src/editor/nodes/nodeIcons.ts` — icon-per-node-type map
- `src/editor/edges/CanvasEdge.tsx` — custom edge (`workflowEdge` type, replaces default `smoothstep`): hover-reveals a delete button via `EdgeLabelRenderer`
- `src/editor/panels/AddNodePanel.tsx` — right slide-over node picker (n8n's NodeCreator equivalent)
- `src/editor/panels/ParameterField.tsx` — renders one parameter input in NDV, keyed off `ParameterField` type from workflow-core
- `src/editor/ndv/NodeDetailModal.tsx` — full-screen node-detail modal (INPUT/PARAMETERS/OUTPUT 3-column), shows validation issues banner
- `src/editor/ndv/getNodeInputData.ts` — resolves a node's upstream input data for the INPUT column
- `src/styles/workflow-ui.css` — all canvas/node/NDV/panel CSS (n8n design tokens: orange primary, radius scale, Inter font)
- `src/nav.ts` — nav item registration consumed by admin-ui

### `packages/design-system` — generic UI kit

Not n8n-specific. Storybook-documented components (Badge, Button, Card, Checkbox, Dialog, Input, Node, NodeEditor, PropertiesPanel, Radio, Select, Tabs, Toolbar, WorkflowStatus) each with `.tsx` + `.stories.tsx` + `.test.tsx`. Used by admin-ui's own UI, not currently by workflow-ui's n8n-clone work (workflow-ui uses its own CSS instead, to match n8n exactly).

## Where to look for "what's left to do"

Auto-memory `n8n_clone_gap_tracker.md` is the authoritative, actively-maintained checklist (13 items, checkboxes + dated completion notes with files touched). Check it before starting new workflow-ui canvas/node work; update it when an item finishes.
