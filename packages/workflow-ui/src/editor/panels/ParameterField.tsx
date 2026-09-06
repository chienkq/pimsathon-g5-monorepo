import type { ParameterField as ParameterFieldDefinition } from "@chienkq/workflow-core";

export interface ParameterFieldProps {
  field: ParameterFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function ParameterField({ field, value, onChange }: ParameterFieldProps) {
  const resolvedValue = value ?? field.default;

  return (
    <label className="wf-field">
      <span className="wf-field__label">{field.label}</span>
      {field.type === "boolean" ? (
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
      {field.helpText && <span className="wf-field__help">{field.helpText}</span>}
    </label>
  );
}
