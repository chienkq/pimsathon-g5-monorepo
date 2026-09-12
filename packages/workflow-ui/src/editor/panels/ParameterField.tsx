import type { ParameterField as ParameterFieldDefinition } from "@chienkq/workflow-core";
import { FilterConditionsField } from "./FilterConditionsField.js";

export interface ParameterFieldProps {
  field: ParameterFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

function isExpression(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("=");
}

export function ParameterField({ field, value, onChange }: ParameterFieldProps) {
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
        <input
          type="text"
          className="wf-input wf-input--expression"
          value={String(resolvedValue ?? "")}
          placeholder="={{ $json.fieldName }}"
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.type === "boolean" ? (
        <input type="checkbox" checked={Boolean(resolvedValue)} onChange={(event) => onChange(event.target.checked)} />
      ) : field.type === "select" ? (
        <select value={String(resolvedValue ?? "")} onChange={(event) => onChange(event.target.value)}>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
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
          Expression — evaluated against this node's input. Use <code>{"{{ $json.fieldName }}"}</code>.
        </span>
      ) : (
        field.helpText && <span className="wf-field__help">{field.helpText}</span>
      )}
    </label>
  );
}
