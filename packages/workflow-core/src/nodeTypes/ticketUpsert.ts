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
  sprintId?: string;
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
    raw: fields,
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
