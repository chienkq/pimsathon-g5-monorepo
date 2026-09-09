import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

/** A single Jira issue as returned by the REST `/search` endpoint, trimmed to the fields this node reads. */
export interface JiraIssue {
  id: string;
  key: string;
  fields: Record<string, unknown>;
}

/** Injected via `executeWorkflow(workflow, { services: { jiraClient } })` — backend provides the real implementation. */
export interface JiraClientService {
  searchIssues(jql: string, maxResults: number): Promise<JiraIssue[]>;
}

export const jiraNodeType: NodeTypeDefinition = {
  type: "jira",
  displayName: "Jira",
  description: "Searches Jira issues by JQL.",
  group: "app",
  color: "#0052cc",
  hasInput: false,
  isTrigger: false,
  outputs: ["main"],
  parameters: [
    {
      key: "jqlQuery",
      label: "JQL Query",
      type: "string",
      default: "",
      placeholder: "updated >= -20m ORDER BY updated ASC",
      required: true,
    },
    { key: "maxResults", label: "Max Results", type: "number", default: 100 },
  ],
  async execute({ parameters, services }) {
    const jqlQuery = String(parameters.jqlQuery ?? "");
    if (!jqlQuery) throw new Error("Jira node requires a JQL query.");
    const maxResults = Number(parameters.maxResults ?? 100);

    const jiraClient = services?.jiraClient as JiraClientService | undefined;
    if (!jiraClient) throw new Error("Jira node requires a `jiraClient` service (only available in backend).");

    const issues = await jiraClient.searchIssues(jqlQuery, maxResults);
    const output: NodeExecutionData[] = issues.map((issue) => ({ json: { ...issue } }));
    return { branches: { main: output } };
  },
};
