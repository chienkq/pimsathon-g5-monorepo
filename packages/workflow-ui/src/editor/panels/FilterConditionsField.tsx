import {
  FILTER_OPERATORS_BY_TYPE,
  type FilterCombinator,
  type FilterConditionValue,
  type FilterFieldOption,
  type FilterValue,
  type ParameterField as ParameterFieldDefinition,
  type ParameterFieldOption,
} from "@chienkq/workflow-core";
import { useProjects } from "../../context/WorkflowRuntimeContext.js";

function makeConditionId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function isExpression(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("=");
}

function ConditionRow({
  condition,
  fieldOptions,
  onChange,
  onRemove,
  canRemove,
}: {
  condition: FilterConditionValue;
  fieldOptions: FilterFieldOption[];
  onChange: (next: FilterConditionValue) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const selectedField = fieldOptions.find((option) => option.value === condition.leftField) ?? fieldOptions[0];
  const operatorOptions = FILTER_OPERATORS_BY_TYPE[selectedField?.type ?? "string"];
  const expressionMode = isExpression(condition.rightValue);
  const projects = useProjects();
  const projectValueOptions: ParameterFieldOption[] = projects.map((project) => ({
    label: `${project.code} — ${project.name}`,
    value: project.id,
  }));
  const valueOptions =
    selectedField?.dynamicValueOptions === "projects" ? projectValueOptions : selectedField?.valueOptions;
  const datalistId = valueOptions && valueOptions.length > 0 ? `wf-filter-values-${condition.id}` : undefined;

  const setField = (leftField: string) => {
    const type = fieldOptions.find((option) => option.value === leftField)?.type ?? "string";
    onChange({ ...condition, leftField, operator: { type, operation: FILTER_OPERATORS_BY_TYPE[type][0].value } });
  };
  const setOperation = (operation: string) =>
    onChange({ ...condition, operator: { ...condition.operator, operation } });
  const setValue = (rightValue: unknown) => onChange({ ...condition, rightValue });
  const toggleExpression = () => setValue(expressionMode ? "" : `={{ $json.${condition.leftField} }}`);

  return (
    <div className="wf-filter-row">
      <select
        className="wf-filter-row__field"
        value={condition.leftField}
        onChange={(event) => setField(event.target.value)}
      >
        {fieldOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        className="wf-filter-row__operator"
        value={condition.operator.operation}
        onChange={(event) => setOperation(event.target.value)}
      >
        {operatorOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="wf-filter-row__value">
        <input
          type="text"
          className="wf-input"
          value={String(condition.rightValue ?? "")}
          placeholder={expressionMode ? "={{ $json.fieldName }}" : "Value"}
          list={!expressionMode ? datalistId : undefined}
          onChange={(event) => setValue(event.target.value)}
        />
        {!expressionMode && valueOptions && (
          <datalist id={datalistId}>
            {valueOptions.map((option) => (
              <option key={option.value} value={option.value} label={option.label} />
            ))}
          </datalist>
        )}
        <button
          type="button"
          className={`wf-field__expr-toggle${expressionMode ? " wf-field__expr-toggle--active" : ""}`}
          onClick={toggleExpression}
          title={expressionMode ? "Switch back to a fixed value" : "Set by expression"}
          aria-pressed={expressionMode}
        >
          fx
        </button>
      </div>
      <button
        type="button"
        className="wf-filter-row__remove"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Remove condition"
      >
        ✕
      </button>
    </div>
  );
}

export interface FilterConditionsFieldProps {
  field: ParameterFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function FilterConditionsField({ field, value, onChange }: FilterConditionsFieldProps) {
  const filterValue = (value ?? field.default ?? { combinator: "and", conditions: [] }) as FilterValue;
  const fieldOptions = field.filterFields ?? [];

  const updateCondition = (index: number, next: FilterConditionValue) => {
    onChange({ ...filterValue, conditions: filterValue.conditions.map((c, i) => (i === index ? next : c)) });
  };
  const removeCondition = (index: number) => {
    onChange({ ...filterValue, conditions: filterValue.conditions.filter((_, i) => i !== index) });
  };
  const addCondition = () => {
    const first = fieldOptions[0];
    if (!first) return;
    const next: FilterConditionValue = {
      id: makeConditionId(),
      leftField: first.value,
      operator: { type: first.type, operation: FILTER_OPERATORS_BY_TYPE[first.type][0].value },
      rightValue: "",
    };
    onChange({ ...filterValue, conditions: [...filterValue.conditions, next] });
  };
  const setCombinator = (combinator: FilterCombinator) => onChange({ ...filterValue, combinator });

  return (
    <div className="wf-filter">
      {filterValue.conditions.length === 0 && <p className="wf-muted wf-filter__empty">No conditions set.</p>}
      {filterValue.conditions.map((condition, index) => (
        <div key={condition.id} className="wf-filter__row-wrap">
          {index > 0 && (
            <select
              className="wf-filter__combinator"
              value={filterValue.combinator}
              onChange={(event) => setCombinator(event.target.value as FilterCombinator)}
            >
              <option value="and">AND</option>
              <option value="or">OR</option>
            </select>
          )}
          <ConditionRow
            condition={condition}
            fieldOptions={fieldOptions}
            onChange={(next) => updateCondition(index, next)}
            onRemove={() => removeCondition(index)}
            canRemove
          />
        </div>
      ))}
      <button type="button" className="wf-button wf-button--ghost wf-filter__add" onClick={addCondition}>
        + Add condition
      </button>
    </div>
  );
}
