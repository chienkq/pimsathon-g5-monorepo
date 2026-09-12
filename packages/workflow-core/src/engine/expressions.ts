/**
 * n8n-style per-field expressions: a parameter value that's a string starting with "=" is an
 * expression, evaluated against the node's first input item at execute time instead of being
 * used literally. Supports `{{ $json.path.to.value }}` (and the bare `{{ path }}` shorthand,
 * matching the older ad hoc template syntax in raiseAlert.ts), plus `{{ $node["Node Name"].json.path }}`
 * to reach any upstream ancestor's output, not just the node's own (immediate-predecessor) input —
 * looked up in the `nodeContext` map (node name -> that node's first output item's json).
 * Deliberately dot-path only, no arbitrary JS eval, since expressions are stored/edited as untrusted
 * workflow config.
 */
const EXPRESSION_TOKEN = /\{\{\s*(.+?)\s*\}\}/g;
const NODE_REFERENCE = /^\$node\[["'](.+?)["']\]\.?(.*)$/;

export function isExpressionValue(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("=");
}

function normalizePath(path: string): string {
  return path
    .replace(/^\$?json\.?/, "")
    .replace(/\[["'](.+?)["']\]/g, ".$1")
    .replace(/^\./, "");
}

function lookup(json: Record<string, unknown>, normalized: string): unknown {
  if (!normalized) return json;
  return normalized.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, json);
}

function readPath(
  json: Record<string, unknown>,
  path: string,
  nodeContext: Record<string, Record<string, unknown>>
): unknown {
  const nodeReference = path.match(NODE_REFERENCE);
  if (nodeReference) {
    const [, nodeName, rest] = nodeReference;
    return lookup(nodeContext[nodeName] ?? {}, normalizePath(rest));
  }
  return lookup(json, normalizePath(path));
}

/** Strips the leading "=" and substitutes every `{{ ... }}` token, stringifying the looked-up value. */
export function evaluateExpression(
  raw: string,
  json: Record<string, unknown>,
  nodeContext: Record<string, Record<string, unknown>> = {}
): string {
  const body = raw.startsWith("=") ? raw.slice(1) : raw;
  return body.replace(EXPRESSION_TOKEN, (_match, path: string) => {
    const value = readPath(json, path.trim(), nodeContext);
    return value === undefined || value === null ? "" : String(value);
  });
}

export function resolveParameterValue(
  value: unknown,
  json: Record<string, unknown>,
  nodeContext: Record<string, Record<string, unknown>> = {}
): unknown {
  return isExpressionValue(value) ? evaluateExpression(value, json, nodeContext) : value;
}

function isFilterValueShape(value: unknown): value is { combinator: string; conditions: unknown[] } {
  return !!value && typeof value === "object" && Array.isArray((value as { conditions?: unknown }).conditions);
}

/** Resolves every expression-valued parameter against `json`; non-expression values pass through unchanged. A `filter`-type parameter's per-condition `rightValue` is resolved too, since it's a value the same way any other field's value is. */
export function resolveParameters(
  parameters: Record<string, unknown>,
  json: Record<string, unknown>,
  nodeContext: Record<string, Record<string, unknown>> = {}
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parameters)) {
    if (isFilterValueShape(value)) {
      resolved[key] = {
        ...value,
        conditions: value.conditions.map((condition) => {
          const entry = condition as { rightValue?: unknown };
          return { ...entry, rightValue: resolveParameterValue(entry.rightValue, json, nodeContext) };
        }),
      };
    } else {
      resolved[key] = resolveParameterValue(value, json, nodeContext);
    }
  }
  return resolved;
}
