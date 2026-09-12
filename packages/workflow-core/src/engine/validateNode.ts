import type { NodeTypeDefinition } from "../types.js";
import { isExpressionValue } from "./expressions.js";

/**
 * Config-time validation only — required fields empty, or `json`-type fields containing
 * unparseable text. Distinct from post-run execution errors (see `NodeExecutionResult.error`),
 * mirroring n8n's separate "issues" (before run) vs execution-error (after run) states.
 */
export function validateNode(
  nodeType: Pick<NodeTypeDefinition, "parameters">,
  parameters: Record<string, unknown>
): string[] {
  const issues: string[] = [];

  for (const field of nodeType.parameters) {
    if (field.showWhen && !field.showWhen.values.includes(String(parameters[field.showWhen.key] ?? ""))) continue;

    const value = parameters[field.key] ?? field.default;
    // Expressions are only resolvable at run time against upstream input, so their emptiness/shape
    // can't be checked here — skip both the required and JSON-parseability checks for them.
    if (isExpressionValue(value)) continue;
    const isEmpty = value === undefined || value === null || value === "";

    if (field.required && isEmpty) {
      issues.push(`"${field.label}" is required`);
      continue;
    }

    if (field.type === "json" && !isEmpty) {
      try {
        JSON.parse(String(value));
      } catch {
        issues.push(`"${field.label}" is not valid JSON`);
      }
    }
  }

  return issues;
}
