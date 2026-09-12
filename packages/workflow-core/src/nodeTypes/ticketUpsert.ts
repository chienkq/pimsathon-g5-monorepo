import type { JiraIssue } from "./jira.js";
import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

/** The normalized shape written to the `tickets` table — provider-agnostic on purpose. */
export interface NormalizedTicket {
  provider: string;
  externalId: string;
  externalKey: string;
  projectKey: string;
  title: string;
  status: string;
  priority?: string;
  assignee?: string;
  storyPoints?: number;
  /** Jira Sprint field — maps 1:1 to this app's "cycle" concept (see `jiraTicketToWorkItem.ts`). */
  sprintId?: string;
  /** Jira Issue Type (Story/Bug/Task/Epic/…), kept as a work item label on conversion. */
  issueType?: string;
  /** Jira Epic Link's issue key, kept as a work item label on conversion. */
  epicKey?: string;
  /** Jira Epic Link's display name (from the export's "Epic Name" column, when present). */
  epicName?: string;
  /** Jira Component/s — kept as work item labels on conversion (no structural equivalent in this app). */
  components?: string[];
  /** Jira Fix Version/s — maps to this app's "module" concept, a milestone-like grouping (see `jiraTicketToWorkItem.ts`). */
  fixVersions?: string[];
  /** Jira Labels — copied onto the work item's own `labels` as-is on conversion. */
  labels?: string[];
  /** Jira Due Date, ISO `yyyy-mm-dd` when parseable. */
  dueDate?: string;
  raw: Record<string, unknown>;
}

/** A stored ticket as read back from the ticket store, including its DB-assigned id and sync time. */
export interface StoredTicket extends NormalizedTicket {
  id: string;
  syncedAt: string;
}

/** Equality filter passed to `ticketStore.queryTickets` — kept flat and simple until real query needs (date ranges, IN lists) show up. */
export type TicketFilter = Partial<
  Pick<NormalizedTicket, "provider" | "projectKey" | "status" | "priority" | "assignee">
>;

/** Injected via `executeWorkflow(workflow, { services: { ticketStore } })` — backend provides the real implementation. */
export interface TicketStoreService {
  upsertTickets(tickets: NormalizedTicket[]): Promise<void>;
  queryTickets(filter: TicketFilter): Promise<StoredTicket[]>;
}

/**
 * Only knows how to map Jira's issue shape today — the general per-provider `normalizeTicket` node from
 * the blueprint is future work once a second tracker connector exists. See n8n_clone_gap_tracker memory.
 */
function normalizeJiraIssue(issue: JiraIssue): NormalizedTicket {
  const fields = issue.fields;
  const project = fields.project as { key?: string } | undefined;
  const status = fields.status as { name?: string } | undefined;
  const priority = fields.priority as { name?: string } | undefined;
  const assignee = fields.assignee as { displayName?: string } | undefined;
  const issueType = fields.issuetype as { name?: string } | undefined;
  const components = fields.components as { name?: string }[] | undefined;
  const fixVersions = fields.fixVersions as { name?: string }[] | undefined;
  const labels = fields.labels as string[] | undefined;
  return {
    // externalId is the issue key, not Jira's internal numeric id — so a live-synced issue and the
    // same issue re-imported later from an Excel export (which only carries the key) land on the same
    // row instead of duplicating it.
    provider: "jira",
    externalId: issue.key,
    externalKey: issue.key,
    projectKey: project?.key ?? "",
    title: String(fields.summary ?? ""),
    status: status?.name ?? "Unknown",
    priority: priority?.name,
    assignee: assignee?.displayName,
    issueType: issueType?.name,
    // Sprint and Epic Link are Jira custom fields (numbered per-instance), not resolvable from the
    // standard REST field names here — left for the Excel import path, which reads them by header text.
    components: components?.map((c) => c.name).filter((n): n is string => !!n),
    fixVersions: fixVersions?.map((v) => v.name).filter((n): n is string => !!n),
    labels: labels && labels.length > 0 ? labels : undefined,
    dueDate: typeof fields.duedate === "string" ? fields.duedate : undefined,
    // The full raw issue (all fields Jira returned, plus rendered/changelog when requested) — not just
    // the handful of fields this normalizer reads — so nothing Jira sent is lost on conversion.
    raw: {
      id: issue.id,
      key: issue.key,
      fields,
      ...(issue.renderedFields ? { renderedFields: issue.renderedFields } : {}),
      ...(issue.changelog ? { changelog: issue.changelog } : {}),
    },
  };
}

export const ticketUpsertNodeType: NodeTypeDefinition = {
  type: "ticketUpsert",
  displayName: "Ticket Store — Upsert",
  description: "Normalizes upstream items and upserts them into the ticket store.",
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
    if (provider !== "jira") throw new Error(`Ticket Store — Upsert: provider "${provider}" is not supported yet.`);

    const ticketStore = services?.ticketStore as TicketStoreService | undefined;
    if (!ticketStore)
      throw new Error("Ticket Store — Upsert requires a `ticketStore` service (only available in backend).");

    const tickets = input.map((item) => normalizeJiraIssue(item.json as unknown as JiraIssue));
    await ticketStore.upsertTickets(tickets);

    const output: NodeExecutionData[] = input;
    return { branches: { main: output } };
  },
};
