import type { NodeTypeDefinition } from "../types.js";

/**
 * The real inbound request, when this workflow was actually invoked by an HTTP call to its webhook
 * route (see `apps/backend/src/index.ts`'s `/api/webhooks/:workflowId` route) rather than run
 * manually/on a schedule. Injected as `services.webhookRequest` — same pattern as `jiraClient`/
 * `gitClient`, just data instead of a callable service.
 */
export interface WebhookRequestPayload {
  path: string;
  method: string;
  headers: Record<string, string>;
  query: Record<string, unknown>;
  body: unknown;
  receivedAt: string;
}

export const webhookNodeType: NodeTypeDefinition = {
  type: "webhook",
  displayName: "Webhook",
  description: "Starts the workflow when this URL is called.",
  group: "core",
  color: "#0077b6",
  hasInput: false,
  isTrigger: true,
  outputs: ["main"],
  parameters: [
    { key: "path", label: "Path", type: "string", default: "/webhook", placeholder: "/my-webhook" },
    {
      key: "method",
      label: "Method",
      type: "select",
      default: "POST",
      options: ["GET", "POST", "PUT", "DELETE"].map((value) => ({ label: value, value })),
    },
  ],
  async execute({ parameters, services }) {
    const path = String(parameters.path ?? "/webhook");
    const method = String(parameters.method ?? "POST");

    // Real inbound call (backend-only): pass the actual request through instead of a fake shape.
    const real = services?.webhookRequest as WebhookRequestPayload | undefined;
    if (real) return { branches: { main: [{ json: { ...real } }] } };

    // Manual run / no backend services (e.g. LocalWorkflowRuntime in the browser): simulated shape,
    // same as before — lets the editor's "Run" button and canvas testing keep working with no wiring.
    return { branches: { main: [{ json: { path, method, receivedAt: new Date().toISOString() } }] } };
  },
};
