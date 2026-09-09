import type { JiraIssue } from "./jira.js";
import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

/** The normalized shape written to the `work_item_facts` table — provider-agnostic on purpose. */
export interface NormalizedWorkItemFact {
  provider: string;
  externalId: string;
  externalKey: string;
  projectKey: string;
  title: string;
  status: string;
  priority?: string;
  assignee?: string;
  storyPoints?: number;
  sprintId?: string;
  raw: Record<string, unknown>;
}

/** A stored work-item fact as read back from the fact store, including its DB-assigned id and sync time. */
export interface StoredWorkItemFact extends NormalizedWorkItemFact {
  id: string;
  syncedAt: string;
}

/** Equality filter passed to `factStore.queryWorkItems` — kept flat and simple until real query needs (date ranges, IN lists) show up. */
export type WorkItemFactFilter = Partial<
  Pick<NormalizedWorkItemFact, "provider" | "projectKey" | "status" | "priority" | "assignee">
>;

/** Injected via `executeWorkflow(workflow, { services: { factStore } })` — backend provides the real implementation. */
export interface FactStoreService {
  upsertWorkItems(facts: NormalizedWorkItemFact[]): Promise<void>;
  queryWorkItems(filter: WorkItemFactFilter): Promise<StoredWorkItemFact[]>;
}

/**
 * Only knows how to map Jira's issue shape today — the general per-provider `normalizeFact` node from the
 * blueprint is future work once a second tracker connector exists. See n8n_clone_gap_tracker memory.
 */
function normalizeJiraIssue(issue: JiraIssue): NormalizedWorkItemFact {
  const fields = issue.fields;
  const project = fields.project as { key?: string } | undefined;
  const status = fields.status as { name?: string } | undefined;
  const priority = fields.priority as { name?: string } | undefined;
  const assignee = fields.assignee as { displayName?: string } | undefined;
  return {
    provider: "jira",
    externalId: issue.id,
    externalKey: issue.key,
    projectKey: project?.key ?? "",
    title: String(fields.summary ?? ""),
    status: status?.name ?? "Unknown",
    priority: priority?.name,
    assignee: assignee?.displayName,
    raw: fields,
  };
}

export const factUpsertNodeType: NodeTypeDefinition = {
  type: "factUpsert",
  displayName: "Fact Store — Upsert",
  description: "Normalizes upstream items and upserts them into the fact store.",
  group: "data",
  color: "#7d726d",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "provider",
      label: "Provider",
      type: "select",
      default: "jira",
      options: [{ label: "Jira", value: "jira" }],
    },
  ],
  async execute({ parameters, input, services }) {
    const provider = String(parameters.provider ?? "jira");
    if (provider !== "jira") throw new Error(`Fact Store — Upsert: provider "${provider}" is not supported yet.`);

    const factStore = services?.factStore as FactStoreService | undefined;
    if (!factStore) throw new Error("Fact Store — Upsert requires a `factStore` service (only available in backend).");

    const facts = input.map((item) => normalizeJiraIssue(item.json as unknown as JiraIssue));
    await factStore.upsertWorkItems(facts);

    const output: NodeExecutionData[] = input;
    return { branches: { main: output } };
  },
};
