import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";
import { parseJsonParameter } from "../utils.js";

export const httpRequestNodeType: NodeTypeDefinition = {
  type: "httpRequest",
  displayName: "HTTP Request",
  description: "Calls an HTTP endpoint and returns the response.",
  group: "core",
  color: "#005f73",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "url",
      label: "URL",
      type: "string",
      default: "",
      placeholder: "https://api.example.com/resource",
      required: true,
    },
    {
      key: "method",
      label: "Method",
      type: "select",
      default: "GET",
      options: ["GET", "POST", "PUT", "PATCH", "DELETE"].map((value) => ({ label: value, value })),
    },
    { key: "headers", label: "Headers (JSON)", type: "json", default: "{}" },
    { key: "body", label: "Body (JSON)", type: "json", default: "{}" },
  ],
  async execute({ parameters, input }) {
    const url = String(parameters.url ?? "");
    if (!url) throw new Error("HTTP Request node requires a URL.");
    const method = String(parameters.method ?? "GET").toUpperCase();
    const headers = parseJsonParameter<Record<string, string>>(parameters.headers, {});
    const body = parseJsonParameter<unknown>(parameters.body, undefined);
    const hasBody = body !== undefined && method !== "GET" && method !== "HEAD";

    const items = input.length > 0 ? input : [{ json: {} }];
    const output: NodeExecutionData[] = await Promise.all(
      items.map(async (): Promise<NodeExecutionData> => {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json", ...headers },
          body: hasBody ? JSON.stringify(body) : undefined,
        });
        const contentType = response.headers.get("content-type") ?? "";
        const data = contentType.includes("application/json")
          ? await response.json().catch(() => ({}))
          : await response.text();
        return { json: { statusCode: response.status, ok: response.ok, data } };
      })
    );
    return { branches: { main: output } };
  },
};
