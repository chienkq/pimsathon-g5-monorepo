import type { NodeTypeDefinition } from "../types.js";

/**
 * Config-time validation only — required fields empty, or `json`-type fields containing
 * unparseable text. Distinct from post-run execution errors (see `NodeExecutionResult.error`),
 * mirroring n8n's separate "issues" (before run) vs execution-error (after run) states.
 */
export function validateNode(nodeType: NodeTypeDefinition, parameters: Record<string, unknown>): string[] {
  const issues: string[] = [];

  for (const field of nodeType.parameters) {
    const value = parameters[field.key] ?? field.default;
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
