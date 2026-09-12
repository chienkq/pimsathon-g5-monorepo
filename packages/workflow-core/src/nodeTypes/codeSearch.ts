import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

/**
 * Code embeddings + vector search: a repo's TS/JS source is chunked at function/class boundaries
 * (tree-sitter, not fixed line counts — see backend's `codeChunker.ts`), embedded with a
 * code-aware model, and stored in Postgres/pgvector. `codeSearch` embeds a text query the same way
 * (typically a work item's description + acceptance criteria) and returns the nearest chunks —
 * "which code likely implements/relates to this ticket."
 */
export interface CodeChunkRecord {
  filePath: string;
  symbolName: string;
  kind: "function" | "method" | "class" | "arrow";
  startLine: number;
  endLine: number;
  content: string;
}

export interface CodeSearchResult extends CodeChunkRecord {
  /** Cosine similarity, 0..1 — higher is a closer match. */
  score: number;
}

/** Injected via `executeWorkflow(workflow, { services: { codeIndex } })` — backend provides the real
 *  chunk/embed/store/search implementation (tree-sitter + Ollama + pgvector); only available server-side. */
export interface CodeIndexService {
  reindex(): Promise<{ filesScanned: number; chunksIndexed: number }>;
  search(query: string, topK: number): Promise<CodeSearchResult[]>;
}

export const codeIndexNodeType: NodeTypeDefinition = {
  type: "codeIndex",
  displayName: "Code Index — Reindex",
  description:
    "Chunks the configured Local Git repo's TS/JS files by function/class (tree-sitter) and re-embeds them into the Code Search vector index.",
  group: "data",
  color: "#7d726d",
  hasInput: true,
  outputs: ["main"],
  parameters: [],
  async execute({ input, services }) {
    const codeIndex = services?.codeIndex as CodeIndexService | undefined;
    if (!codeIndex) throw new Error("Code Index — Reindex requires a `codeIndex` service (only available in backend).");

    const items = input.length > 0 ? input : [{ json: {} }];
    const output: NodeExecutionData[] = [];
    for (let i = 0; i < items.length; i++) {
      output.push({ json: { ...(await codeIndex.reindex()) } });
    }
    return { branches: { main: output } };
  },
};

export const codeSearchNodeType: NodeTypeDefinition = {
  type: "codeSearch",
  displayName: "Code Search — Vector Query",
  description:
    "Embeds a text query (e.g. a work item's description + acceptance criteria) and returns the closest-matching code chunks from the Code Search vector index.",
  group: "data",
  color: "#7d726d",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "query",
      label: "Query",
      type: "string",
      default: "={{ $json.description }}",
      required: true,
      helpText:
        "Supports expressions — combine multiple fields, e.g. the ticket description and its acceptance criteria.",
    },
    { key: "topK", label: "Top K", type: "number", default: 5 },
  ],
  async execute({ parameters, input, services }) {
    const codeIndex = services?.codeIndex as CodeIndexService | undefined;
    if (!codeIndex)
      throw new Error("Code Search — Vector Query requires a `codeIndex` service (only available in backend).");

    const query = String(parameters.query ?? "").trim();
    if (!query) throw new Error("Code Search — Vector Query requires a non-empty Query.");
    const topK = Math.min(Math.max(Number(parameters.topK ?? 5), 1), 50);

    const items = input.length > 0 ? input : [{ json: {} }];
    const output: NodeExecutionData[] = [];
    for (let i = 0; i < items.length; i++) {
      const results = await codeIndex.search(query, topK);
      for (const result of results) output.push({ json: { ...result } });
    }
    return { branches: { main: output } };
  },
};
