import type { NodeTypeDefinition } from "../types.js";

/**
 * Simplified stand-in for n8n's "Split in Batches": real n8n loop is a cycle (the "loop" output
 * wires back into this same node until items run out), but this engine's executor assumes a DAG
 * (see topologicalSort.ts) and doesn't support cycles yet. So this runs once per execution: the
 * first `batchSize` items go out "loop", the remainder go out "done" — no loop-back happens.
 * True cyclic semantics are tracked as a separate follow-up (see auto-memory n8n_clone_gap_tracker.md).
 */
export const loopNodeType: NodeTypeDefinition = {
  type: "loop",
  displayName: "Loop",
  description: "Splits input into batches. Non-cyclic simplification: runs one batch, no loop-back.",
  group: "flow",
  color: "#bb3e03",
  hasInput: true,
  outputs: ["loop", "done"],
  parameters: [{ key: "batchSize", label: "Batch Size", type: "number", default: 1 }],
  async execute({ parameters, input }) {
    const batchSize = Math.max(1, Number(parameters.batchSize) || 1);
    return { branches: { loop: input.slice(0, batchSize), done: input.slice(batchSize) } };
  },
};
