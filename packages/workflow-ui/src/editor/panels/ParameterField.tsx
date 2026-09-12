import type { ParameterField as ParameterFieldDefinition } from "@chienkq/workflow-core";
import { useRef } from "react";
import { useAiAgents } from "../../context/WorkflowRuntimeContext.js";
import { FilterConditionsField } from "./FilterConditionsField.js";

export interface ParameterFieldProps {
  field: ParameterFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Names of every node transitively upstream of this one (not just its direct predecessor) —
   *  offered as an "insert node output" picker while in expression mode, so a `$node["Name"].json.path`
   *  reference can be typed against any ancestor, however far back. */
  availableNodes?: string[];
}

function isExpression(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("=");
}

export function ParameterField({ field, value, onChange, availableNodes = [] }: ParameterFieldProps) {
  // Called unconditionally (before the early "filter" return below) so hook order stays stable
  // regardless of which field type this instance renders.
  const aiAgents = useAiAgents();
  const expressionInputRef = useRef<HTMLInputElement>(null);

  if (field.type === "filter") {
    return (
      <div className="wf-field">
        <span className="wf-field__label">{field.label}</span>
        <FilterConditionsField field={field} value={value} onChange={onChange} />
        {field.helpText && <span className="wf-field__help">{field.helpText}</span>}
      </div>
    );
  }

  const resolvedValue = value ?? field.default;
  const expressionMode = isExpression(resolvedValue);

  const toggleExpressionMode = () => {
    if (expressionMode) {
      onChange(typeof field.default === "string" ? field.default : "");
    } else {
      onChange(`={{ $json.${field.key} }}`);
    }
  };

  const insertNodeReference = (nodeName: string) => {
    if (!nodeName) return;
    const prefix = `{{ $node["${nodeName}"].json.`;
    const suffix = " }}";
    const current = String(resolvedValue ?? "");
    const el = expressionInputRef.current;
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    onChange(current.slice(0, start) + prefix + suffix + current.slice(end));
    // Land the cursor right after ".json." so the user can continue typing the field path — after
    // `onChange` re-renders, not synchronously, so wait a tick before touching the DOM node.
    const caretPosition = start + prefix.length;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caretPosition, caretPosition);
    });
  };

  return (
    <label className="wf-field">
      <span className="wf-field__label">
        {field.label}
        <button
          type="button"
          className={`wf-field__expr-toggle${expressionMode ? " wf-field__expr-toggle--active" : ""}`}
          onClick={toggleExpressionMode}
          title={expressionMode ? "Switch back to a fixed value" : "Set by expression"}
          aria-pressed={expressionMode}
        >
          fx
        </button>
      </span>
      {expressionMode ? (
        <div className="wf-field__expr-row">
          <input
            ref={expressionInputRef}
            type="text"
            className="wf-input wf-input--expression"
            value={String(resolvedValue ?? "")}
            placeholder="={{ $json.fieldName }}"
            onChange={(event) => onChange(event.target.value)}
          />
          {availableNodes.length > 0 && (
            <select
              className="wf-field__node-picker"
              value=""
              title="Insert a reference to another node's output"
              onChange={(event) => {
                insertNodeReference(event.target.value);
                event.target.value = "";
              }}
            >
              <option value="" disabled>
                Insert node value…
              </option>
              {availableNodes.map((nodeName) => (
                <option key={nodeName} value={nodeName}>
                  {nodeName}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : field.type === "boolean" ? (
        <input type="checkbox" checked={Boolean(resolvedValue)} onChange={(event) => onChange(event.target.checked)} />
      ) : field.type === "select" ? (
        <select value={String(resolvedValue ?? "")} onChange={(event) => onChange(event.target.value)}>
          {field.dynamicOptions === "aiAgents" ? (
            <>
              <option value="">Select an agent…</option>
              {aiAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </>
          ) : (
            (field.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          )}
        </select>
      ) : field.type === "number" ? (
        <input
          type="number"
          className="wf-input"
          value={String(resolvedValue ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.valueAsNumber)}
        />
      ) : field.type === "json" || field.type === "code" ? (
        <textarea
          className="wf-textarea"
          rows={field.type === "code" ? 8 : 4}
          value={String(resolvedValue ?? "")}
          placeholder={field.placeholder}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          type="text"
          className="wf-input"
          value={String(resolvedValue ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {expressionMode ? (
        <span className="wf-field__help">
          Expression — evaluated against this node's input. Use <code>{"{{ $json.fieldName }}"}</code>, or{" "}
          <code>{'{{ $node["Node Name"].json.fieldName }}'}</code> for any upstream node's output.
        </span>
      ) : (
        field.helpText && <span className="wf-field__help">{field.helpText}</span>
      )}
    </label>
  );
}
