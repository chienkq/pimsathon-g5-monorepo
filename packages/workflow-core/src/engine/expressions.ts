/**
 * n8n-style per-field expressions: a parameter value that's a string starting with "=" is an
 * expression, evaluated against the node's first input item at execute time instead of being
 * used literally. Supports `{{ $json.path.to.value }}` (and the bare `{{ path }}` shorthand,
 * matching the older ad hoc template syntax in raiseAlert.ts). Deliberately dot-path only, no
 * arbitrary JS eval, since expressions are stored/edited as untrusted workflow config.
 */
const EXPRESSION_TOKEN = /\{\{\s*(.+?)\s*\}\}/g;

export function isExpressionValue(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("=");
}

function readPath(json: Record<string, unknown>, path: string): unknown {
  const normalized = path
    .replace(/^\$json\.?/, "")
    .replace(/\[["'](.+?)["']\]/g, ".$1")
    .replace(/^\./, "");
  if (!normalized) return json;
  return normalized.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, json);
}

/** Strips the leading "=" and substitutes every `{{ ... }}` token, stringifying the looked-up value. */
export function evaluateExpression(raw: string, json: Record<string, unknown>): string {
  const body = raw.startsWith("=") ? raw.slice(1) : raw;
  return body.replace(EXPRESSION_TOKEN, (_match, path: string) => {
    const value = readPath(json, path.trim());
    return value === undefined || value === null ? "" : String(value);
  });
}

export function resolveParameterValue(value: unknown, json: Record<string, unknown>): unknown {
  return isExpressionValue(value) ? evaluateExpression(value, json) : value;
}

function isFilterValueShape(value: unknown): value is { combinator: string; conditions: unknown[] } {
  return !!value && typeof value === "object" && Array.isArray((value as { conditions?: unknown }).conditions);
}

/** Resolves every expression-valued parameter against `json`; non-expression values pass through unchanged. A `filter`-type parameter's per-condition `rightValue` is resolved too, since it's a value the same way any other field's value is. */
export function resolveParameters(
  parameters: Record<string, unknown>,
  json: Record<string, unknown>
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parameters)) {
    if (isFilterValueShape(value)) {
      resolved[key] = {
        ...value,
        conditions: value.conditions.map((condition) => {
          const entry = condition as { rightValue?: unknown };
          return { ...entry, rightValue: resolveParameterValue(entry.rightValue, json) };
        }),
      };
    } else {
      resolved[key] = resolveParameterValue(value, json);
    }
  }
  return resolved;
}
