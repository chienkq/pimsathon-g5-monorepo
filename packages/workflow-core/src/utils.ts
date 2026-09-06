/** Resolves a dot-path (e.g. "user.name") against a plain object. No array-index syntax. */
export function getByPath(source: unknown, path: string): unknown {
  if (!path) return source;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, source);
}

export type ConditionOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "greaterThan"
  | "lessThan"
  | "isEmpty"
  | "isNotEmpty";

export function evaluateCondition(actual: unknown, operator: string, expected: unknown): boolean {
  switch (operator as ConditionOperator) {
    case "equals":
      return String(actual) === String(expected);
    case "notEquals":
      return String(actual) !== String(expected);
    case "contains":
      return String(actual ?? "").includes(String(expected ?? ""));
    case "greaterThan":
      return Number(actual) > Number(expected);
    case "lessThan":
      return Number(actual) < Number(expected);
    case "isEmpty":
      return actual === undefined || actual === null || actual === "";
    case "isNotEmpty":
      return !(actual === undefined || actual === null || actual === "");
    default:
      return false;
  }
}

/** Parses a JSON-string parameter, passing objects through unchanged. Throws on invalid JSON. */
export function parseJsonParameter<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`Invalid JSON parameter: ${value}`);
  }
}
