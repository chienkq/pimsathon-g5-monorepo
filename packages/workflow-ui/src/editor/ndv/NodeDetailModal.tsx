import {
  validateNode,
  type NodeExecuteInputGroup,
  type NodeExecutionData,
  type NodeExecutionResult,
} from "@chienkq/workflow-core";
import { useEffect, useState, type ReactNode } from "react";
import { useNodeType } from "../../context/WorkflowRuntimeContext.js";
import { SvgNodeIcon } from "../nodes/SvgNodeIcon.js";
import { ParameterField } from "../panels/ParameterField.js";
import type { WorkflowFlowEdge, WorkflowFlowNode } from "../types.js";
import { generatePath } from "./expressionPath.js";
import { getAncestorNodes, getNodeInputData, getNodeInputGroups } from "./getNodeInputData.js";
import { JsonTree } from "./JsonTree.js";

/** Builds a `JsonTree` `buildExpression` for a tree of `items.map(item => item.json)` — the row's
 *  `path[0]` is the item index (not part of the JSON shape itself, just "which item"), so it's
 *  dropped: `{{ $json.foo }}` refers to the current item's field regardless of which one was clicked. */
function itemsExpressionBuilder(root: string) {
  return (path: Array<string | number>): string | undefined => {
    if (path.length === 0) return undefined;
    const [, ...fieldPath] = path;
    return `{{ ${generatePath(root, fieldPath)} }}`;
  };
}

export interface NodeDetailModalProps {
  node: WorkflowFlowNode;
  nodes: WorkflowFlowNode[];
  edges: WorkflowFlowEdge[];
  onChangeParameter: (nodeId: string, key: string, value: unknown) => void;
  /** Runs this node in isolation (the "Execute" button) — omitted when the runtime doesn't support it. */
  onExecute?: (nodeId: string, input: NodeExecutionData[]) => Promise<NodeExecutionResult | undefined>;
  /**
   * Runs every upstream ancestor of this node and then the node itself (the "Execute workflow
   * before" button) — omitted when the runtime doesn't support single-node execution.
   */
  onExecuteWithUpstream?: (nodeId: string) => Promise<NodeExecutionResult | undefined>;
  /**
   * Runs every upstream ancestor of this node without running the node itself (the INPUT column's
   * "Execute Node Before" button) — populates INPUT without touching this node's own OUTPUT.
   */
  onExecuteUpstreamOnly?: (nodeId: string) => Promise<NodeExecutionResult | undefined>;
  /** Aborts whichever of `onExecute` / `onExecuteWithUpstream` / `onExecuteUpstreamOnly` is
   *  currently in flight for this node — omitted when the runtime doesn't support cancelling a
   *  single-node execution. */
  onStopExecute?: () => void;
  onClose: () => void;
}

function DataColumn({
  title,
  items,
  emptyHint,
  error,
  trace,
  headerAction,
  buildExpression,
}: {
  title: string;
  items: unknown[];
  emptyHint: string;
  error?: string;
  /** Round-trip trace attached to an error (e.g. the AI Agent's tool-call history when it hits its
   *  iteration limit without a final answer) — see `NodeExecutionResult.trace`. */
  trace?: unknown[];
  headerAction?: ReactNode;
  buildExpression?: (path: Array<string | number>) => string | undefined;
}) {
  return (
    <div className="wf-ndv-column wf-ndv-column--data">
      <div className="wf-ndv-column__header">
        <span>{title}</span>
        {items.length > 0 && (
          <span className="wf-ndv-column__count">
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        )}
        {headerAction}
      </div>
      <div className="wf-ndv-column__body">
        {error ? (
          <>
            <p className="wf-run-result__error">{error}</p>
            {trace && trace.length > 0 && (
              <details className="wf-ndv-ancestor-group" open>
                <summary className="wf-ndv-ancestor-group__header">
                  <span>
                    Agent trace ({trace.length} round-trip{trace.length === 1 ? "" : "s"})
                  </span>
                </summary>
                <JsonTree data={trace} />
              </details>
            )}
          </>
        ) : items.length === 0 ? (
          <p className="wf-muted">{emptyHint}</p>
        ) : (
          <JsonTree data={items} buildExpression={buildExpression} />
        )}
      </div>
    </div>
  );
}

/** One further-upstream ancestor's data (or, before it's ever been run, an empty-shaped placeholder) — folded into a collapsed `<details>` so it doesn't crowd out the node's own direct input by default. */
function AncestorDataGroup({ name, items }: { name: string; items: NodeExecutionData[] }) {
  return (
    <details className="wf-ndv-ancestor-group">
      <summary className="wf-ndv-ancestor-group__header">
        <span>{name}</span>
        {items.length > 0 && (
          <span className="wf-ndv-column__count">
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        )}
      </summary>
      {/* Not yet executed: shown as one empty item rather than hidden, so the section still reads as
       *  "this node's data will land here" instead of looking broken/omitted. */}
      <JsonTree
        data={items.length > 0 ? items.map((item) => item.json) : [{}]}
        buildExpression={itemsExpressionBuilder(`$node["${name}"].json`)}
      />
    </details>
  );
}

function InputDataColumn({
  inputGroups,
  fartherAncestors,
  emptyHint,
  headerAction,
}: {
  inputGroups: NodeExecuteInputGroup[];
  fartherAncestors: WorkflowFlowNode[];
  emptyHint: string;
  headerAction?: ReactNode;
}) {
  // More than one group means more than one incoming connection actually fed this node — show each
  // upstream source's items separately even when they all land on the same declared handle (e.g. two
  // edges both wired to a single "main" input), rather than only splitting by handle count.
  const isMultiInput = inputGroups.length > 1;
  const totalCount = inputGroups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="wf-ndv-column wf-ndv-column--data">
      <div className="wf-ndv-column__header">
        <span>INPUT</span>
        {!isMultiInput && totalCount > 0 && (
          <span className="wf-ndv-column__count">
            {totalCount} item{totalCount === 1 ? "" : "s"}
          </span>
        )}
        {headerAction}
      </div>
      <div className="wf-ndv-column__body">
        {isMultiInput ? (
          inputGroups.map((group, index) => (
            <div key={`${group.sourceNodeName}-${index}`} className="wf-ndv-input-group">
              <div className="wf-ndv-input-group__header">
                <span>{group.sourceNodeName}</span>
                {group.items.length > 0 && (
                  <span className="wf-ndv-column__count">
                    {group.items.length} item{group.items.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {group.items.length === 0 ? (
                <p className="wf-muted">{emptyHint}</p>
              ) : (
                <JsonTree
                  data={group.items.map((item) => item.json)}
                  buildExpression={itemsExpressionBuilder(`$node["${group.sourceNodeName}"].json`)}
                />
              )}
            </div>
          ))
        ) : totalCount === 0 ? (
          <p className="wf-muted">{emptyHint}</p>
        ) : (
          <JsonTree
            data={(inputGroups[0]?.items ?? []).map((item) => item.json)}
            buildExpression={itemsExpressionBuilder("$json")}
          />
        )}
        {fartherAncestors.length > 0 && (
          <details className="wf-ndv-ancestors">
            <summary className="wf-ndv-ancestors__header">Other upstream nodes ({fartherAncestors.length})</summary>
            <div className="wf-ndv-ancestors__body">
              {fartherAncestors.map((ancestor) => {
                const result = ancestor.data.result;
                const items = result?.status === "success" ? Object.values(result.branches ?? {}).flat() : [];
                return <AncestorDataGroup key={ancestor.id} name={ancestor.data.label} items={items} />;
              })}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

export function NodeDetailModal({
  node,
  nodes,
  edges,
  onChangeParameter,
  onExecute,
  onExecuteWithUpstream,
  onExecuteUpstreamOnly,
  onStopExecute,
  onClose,
}: NodeDetailModalProps) {
  const nodeType = useNodeType(node.data.nodeType);
  const issues = validateNode(nodeType, node.data.parameters);
  const resolveParamValue = (key: string): unknown => {
    if (node.data.parameters[key] !== undefined) return node.data.parameters[key];
    return nodeType.parameters.find((field) => field.key === key)?.default;
  };
  const inputHandles = nodeType.inputs ?? ["main"];
  const inputData = getNodeInputData(node.id, nodes, edges);
  const inputGroups = getNodeInputGroups(node.id, nodes, edges, inputHandles);
  const allAncestors = getAncestorNodes(node.id, nodes, edges);
  const ancestorNodeNames = allAncestors.map((ancestor) => ancestor.data.label);
  const directAncestorIds = new Set(edges.filter((edge) => edge.target === node.id).map((edge) => edge.source));
  const fartherAncestors = allAncestors.filter((ancestor) => !directAncestorIds.has(ancestor.id));
  const outputBranches = node.data.result?.branches ?? {};
  const outputItems = Object.values(outputBranches)
    .flat()
    .map((item) => item.json);
  // node.data.status only reflects "running" for the node actually being run — "Execute Node
  // Before" runs ancestors and never flips the target node's own status, so it alone can't drive
  // the buttons. isExecuting tracks the in-flight request for whichever action was clicked and
  // disables all three buttons until the response (success or error) comes back.
  const isRunning = node.data.status === "running";
  const [executeError, setExecuteError] = useState<string | undefined>(undefined);
  const [isExecuting, setIsExecuting] = useState(false);
  const isBusy = isRunning || isExecuting;

  const handleExecute = async () => {
    if (!onExecute) return;
    setExecuteError(undefined);
    setIsExecuting(true);
    try {
      await onExecute(node.id, inputData);
    } catch (error) {
      setExecuteError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecuteWithUpstream = async () => {
    if (!onExecuteWithUpstream) return;
    setExecuteError(undefined);
    setIsExecuting(true);
    try {
      await onExecuteWithUpstream(node.id);
    } catch (error) {
      setExecuteError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecuteUpstreamOnly = async () => {
    if (!onExecuteUpstreamOnly) return;
    setExecuteError(undefined);
    setIsExecuting(true);
    try {
      await onExecuteUpstreamOnly(node.id);
    } catch (error) {
      setExecuteError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="wf-ndv-backdrop" onClick={onClose}>
      <div className="wf-ndv" role="dialog" aria-label={node.data.label} onClick={(event) => event.stopPropagation()}>
        <header className="wf-ndv__header">
          <span className="wf-ndv__icon" style={{ ["--wf-icon-color" as string]: nodeType.color }}>
            <SvgNodeIcon nodeType={nodeType.type} displayName={nodeType.displayName} className="wf-ndv__icon-glyph" />
          </span>
          <div className="wf-ndv__heading">
            <h2>{node.data.label}</h2>
            <p className="wf-muted">{nodeType.description}</p>
          </div>
          {node.data.status && (
            <span className={`wf-run-result__status wf-run-result__status--${node.data.status}`}>
              {node.data.status}
            </span>
          )}
          {onExecuteWithUpstream && (
            <button
              type="button"
              className="wf-button wf-button--primary wf-ndv__execute"
              onClick={() => void handleExecuteWithUpstream()}
              disabled={isBusy}
              title="Run every upstream node, then this one"
            >
              {isBusy ? "Executing…" : "Execute"}
            </button>
          )}
          {onStopExecute && isRunning && (
            <button type="button" className="wf-button wf-button--danger wf-ndv__stop" onClick={onStopExecute}>
              Stop
            </button>
          )}
          <button type="button" className="wf-ndv__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="wf-ndv__main">
          <InputDataColumn
            inputGroups={inputGroups}
            fartherAncestors={fartherAncestors}
            emptyHint="No input data. Connect and run an upstream node."
            headerAction={
              onExecuteUpstreamOnly && (
                <button
                  type="button"
                  className="wf-button wf-ndv__execute-node-only"
                  onClick={() => void handleExecuteUpstreamOnly()}
                  disabled={isBusy}
                  title="Run every upstream node, without running this node"
                >
                  {isBusy ? "Executing…" : "Execute Node Before"}
                </button>
              )
            }
          />

          <div className="wf-ndv-column wf-ndv-column--settings">
            <div className="wf-ndv-column__header">
              <span>PARAMETERS</span>
            </div>
            <div className="wf-ndv-column__body">
              {issues.length > 0 && (
                <ul className="wf-ndv-issues">
                  {issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
              {nodeType.parameters.length === 0 ? (
                <p className="wf-muted">This node has no parameters.</p>
              ) : (
                <div className="wf-field-list">
                  {nodeType.parameters
                    .filter(
                      (field) =>
                        !field.showWhen ||
                        field.showWhen.values.includes(String(resolveParamValue(field.showWhen.key) ?? ""))
                    )
                    .map((field) => (
                      <ParameterField
                        key={field.key}
                        field={field}
                        value={node.data.parameters[field.key]}
                        onChange={(value) => onChangeParameter(node.id, field.key, value)}
                        availableNodes={ancestorNodeNames}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>

          <DataColumn
            title="OUTPUT"
            items={outputItems}
            emptyHint="No output yet. Execute this node or the workflow to see data here."
            error={executeError ?? (node.data.result?.status === "error" ? node.data.result.error : undefined)}
            trace={node.data.result?.status === "error" ? node.data.result.trace : undefined}
            buildExpression={itemsExpressionBuilder(`$node["${node.data.label}"].json`)}
            headerAction={
              onExecute && (
                <button
                  type="button"
                  className="wf-button wf-ndv__execute-node-only"
                  onClick={() => void handleExecute()}
                  disabled={isBusy}
                  title="Run only this node, using its current input data"
                >
                  {isBusy ? "Executing…" : "Execute Node Only"}
                </button>
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
