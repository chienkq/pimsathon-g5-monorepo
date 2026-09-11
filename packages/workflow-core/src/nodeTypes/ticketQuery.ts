import type { TicketStoreService, TicketFilter } from "./ticketUpsert.js";
import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";
import { parseJsonParameter } from "../utils.js";

export const ticketQueryNodeType: NodeTypeDefinition = {
  type: "ticketQuery",
  displayName: "Ticket Store — Query",
  description: "Reads tickets back out of the ticket store, filtered by equality on a few fields.",
  group: "data",
  color: "#7d726d",
  hasInput: false,
  outputs: ["main"],
  parameters: [
    {
      key: "filter",
      label: "Filter (JSON)",
      type: "json",
      default: "{}",
      helpText:
        'Equality filter, e.g. {"priority":"Urgent"}. Supported keys: provider, projectKey, status, priority, assignee.',
    },
  ],
  async execute({ parameters, services }) {
    const ticketStore = services?.ticketStore as TicketStoreService | undefined;
    if (!ticketStore)
      throw new Error("Ticket Store — Query requires a `ticketStore` service (only available in backend).");

    const filter = parseJsonParameter<TicketFilter>(parameters.filter, {});
    const tickets = await ticketStore.queryTickets(filter);
    const output: NodeExecutionData[] = tickets.map((ticket) => ({ json: { ...ticket } }));
    return { branches: { main: output } };
  },
};
