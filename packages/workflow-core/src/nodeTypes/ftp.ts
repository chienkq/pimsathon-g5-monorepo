import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

export const ftpNodeType: NodeTypeDefinition = {
  type: "ftp",
  displayName: "FTP",
  description: "Lists, downloads, or uploads a file over FTP.",
  group: "core",
  color: "#023e8a",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "operation",
      label: "Operation",
      type: "select",
      default: "List",
      options: ["List", "Download", "Upload"].map((value) => ({ label: value, value })),
    },
    { key: "path", label: "Path", type: "string", default: "/", required: true },
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
    const operation = String(parameters.operation ?? "List");
    const path = String(parameters.path ?? "/");
    const items = input.length > 0 ? input : [{ json: {} }];
    const output: NodeExecutionData[] = items.map((item) => ({
      json: { ...item.json, operation, path, result: "stub" },
    }));
    return { branches: { main: output } };
  },
};
