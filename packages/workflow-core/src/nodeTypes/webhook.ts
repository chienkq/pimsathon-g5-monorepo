import type { NodeTypeDefinition } from "../types.js";

export const webhookNodeType: NodeTypeDefinition = {
  type: "webhook",
  displayName: "Webhook",
  description: "Starts the workflow when this URL is called (simulated in this environment).",
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
  async execute({ parameters }) {
    const path = String(parameters.path ?? "/webhook");
    const method = String(parameters.method ?? "POST");
    return { branches: { main: [{ json: { path, method, receivedAt: new Date().toISOString() } }] } };
  },
};
