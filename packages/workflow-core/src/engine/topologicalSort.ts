import type { WorkflowConnection, WorkflowNodeDefinition } from "../types.js";

/** Kahn's algorithm. Throws if the graph contains a cycle. */
export function topologicalSort(nodes: WorkflowNodeDefinition[], connections: WorkflowConnection[]): string[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }
  for (const conn of connections) {
    if (!adjacency.has(conn.source) || !inDegree.has(conn.target)) continue;
    adjacency.get(conn.source)?.push(conn.target);
    inDegree.set(conn.target, (inDegree.get(conn.target) ?? 0) + 1);
  }

  const queue = nodes.filter((node) => (inDegree.get(node.id) ?? 0) === 0).map((node) => node.id);
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift();
    if (id === undefined) break;
    order.push(id);
    for (const next of adjacency.get(id) ?? []) {
      const remaining = (inDegree.get(next) ?? 0) - 1;
      inDegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }

  if (order.length !== nodes.length) {
    throw new Error("Workflow contains a cycle and cannot be executed.");
  }
  return order;
}
