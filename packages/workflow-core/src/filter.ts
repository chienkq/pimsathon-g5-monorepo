import type { FilterConditionValue, FilterOperatorType, FilterValue, ParameterFieldOption } from "./types.js";

/** Subset of n8n's real `OPERATORS_BY_ID` taxonomy (FilterConditions/constants.ts) — string/number only, no exists/empty/regex, since this app's filterable fields are plain strings/numbers. */
export const FILTER_OPERATORS_BY_TYPE: Record<FilterOperatorType, ParameterFieldOption[]> = {
  string: [
    { label: "Equals", value: "equals" },
    { label: "Not Equals", value: "notEquals" },
    { label: "Contains", value: "contains" },
    { label: "Does Not Contain", value: "notContains" },
  ],
  number: [
    { label: "Equals", value: "equals" },
    { label: "Not Equals", value: "notEquals" },
    { label: "Greater Than", value: "gt" },
    { label: "Less Than", value: "lt" },
    { label: "Greater Than or Equal", value: "gte" },
    { label: "Less Than or Equal", value: "lte" },
  ],
};

export function createEmptyFilterValue(): FilterValue {
  return { combinator: "and", conditions: [] };
}

/**
 * Reads the value the user set for `field` in a Work-Item-style filter parameter, ignoring the
 * operator (this app's backend stores only support exact-match lookups/assignment, not
 * comparisons — the richer operator list exists for n8n-parity and future use). Returns the
 * first matching condition's `rightValue`, stringified, or `undefined` if `field` has no condition.
 */
export function getFilterFieldValue(filterValue: unknown, field: string): string | undefined {
  const conditions = (filterValue as FilterValue | undefined)?.conditions;
  const condition = conditions?.find((entry: FilterConditionValue) => entry.leftField === field);
  if (!condition || condition.rightValue === undefined || condition.rightValue === null) return undefined;
  return String(condition.rightValue);
}
