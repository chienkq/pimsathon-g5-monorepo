import type { NodeExecutionData, NodeTypeDefinition, ParameterFieldOption } from "../types.js";

interface AppActionConfig {
  type: string;
  displayName: string;
  description: string;
  color: string;
  actions: string[];
  resourceLabel: string;
  resourcePlaceholder: string;
}

/**
 * Phase 1 (see auto-memory n8n_clone_gap_tracker.md): no credential/auth system exists yet, so
 * every app-action node gets a plain "Credential" placeholder field and a stub execute — real API
 * calls land once the credential store exists.
 */
function createAppActionNodeType(config: AppActionConfig): NodeTypeDefinition {
  const actionOptions: ParameterFieldOption[] = config.actions.map((value) => ({ label: value, value }));
  return {
    type: config.type,
    displayName: config.displayName,
    description: config.description,
    group: "app",
    color: config.color,
    hasInput: true,
    outputs: ["main"],
    parameters: [
      { key: "action", label: "Action", type: "select", default: config.actions[0], options: actionOptions },
      {
        key: "resourceId",
        label: config.resourceLabel,
        type: "string",
        default: "",
        placeholder: config.resourcePlaceholder,
        required: true,
      },
      {
        key: "credentialName",
        label: "Credential",
        type: "string",
        default: "",
        placeholder: "Not connected",
        helpText: "Credential support is coming in a later phase.",
      },
    ],
    async execute({ parameters, input }) {
      const action = String(parameters.action ?? config.actions[0]);
      const resourceId = String(parameters.resourceId ?? "");
      const items = input.length > 0 ? input : [{ json: {} }];
      const output: NodeExecutionData[] = items.map((item) => ({
        json: { ...item.json, action, resourceId, result: "stub" },
      }));
      return { branches: { main: output } };
    },
  };
}

export const metisSoftwareNodeType = createAppActionNodeType({
  type: "metisSoftware",
  displayName: "Metis Software",
  description: "Runs an action against Metis Software.",
  color: "#2a9d8f",
  actions: ["Get Metric", "Create Metric", "Update Metric"],
  resourceLabel: "Metric ID",
  resourcePlaceholder: "metric-id",
});

export const sonarQubeNodeType = createAppActionNodeType({
  type: "sonarQube",
  displayName: "SonarQube",
  description: "Runs an action against a SonarQube project.",
  color: "#4e9bcd",
  actions: ["Get Project Status", "Trigger Analysis", "Get Issues"],
  resourceLabel: "Project Key",
  resourcePlaceholder: "my_project_key",
});
