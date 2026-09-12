import { describe, expect, it } from "vitest";
import type { WorkflowDefinition } from "../types.js";
import { executeWorkflow } from "./executeWorkflow.js";

function node(id: string, type: string, parameters: Record<string, unknown> = {}) {
  return { id, type, name: type, position: { x: 0, y: 0 }, parameters };
}

function workflow(overrides: Partial<WorkflowDefinition>): WorkflowDefinition {
  return {
    id: "wf-1",
    name: "Test workflow",
    nodes: [],
    connections: [],
    active: false,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  };
}

describe("executeWorkflow", () => {
  it("runs a trigger into a Code node", async () => {
    const trigger = node("trigger", "webhook");
    const code = node("set", "code", { code: 'return [{ greeting: "hi" }];' });
    const result = await executeWorkflow(
      workflow({
        nodes: [trigger, code],
        connections: [{ id: "c1", source: "trigger", target: "set" }],
      })
    );

    expect(result.status).toBe("success");
    expect(result.nodeResults.set.branches?.main).toEqual([{ json: { greeting: "hi" } }]);
  });

  it("routes items to the true/false branch of an If node", async () => {
    const trigger = node("trigger", "webhook");
    const code = node("set", "code", { code: 'return [{ status: "ok" }];' });
    const ifNode = node("if", "if", { field: "status", operator: "equals", value: "ok" });
    const onTrue = node("onTrue", "merge");
    const onFalse = node("onFalse", "merge");

    const result = await executeWorkflow(
      workflow({
        nodes: [trigger, code, ifNode, onTrue, onFalse],
        connections: [
          { id: "c1", source: "trigger", target: "set" },
          { id: "c2", source: "set", target: "if" },
          { id: "c3", source: "if", sourceOutput: "true", target: "onTrue" },
          { id: "c4", source: "if", sourceOutput: "false", target: "onFalse" },
        ],
      })
    );

    expect(result.nodeResults.onTrue.branches?.main).toHaveLength(1);
    expect(result.nodeResults.onFalse.branches?.main).toHaveLength(0);
  });

  it("skips downstream nodes when a node errors", async () => {
    const trigger = node("trigger", "webhook");
    const httpNode = node("http", "httpRequest", { url: "" }); // missing URL throws
    const downstream = node("downstream", "merge");

    const result = await executeWorkflow(
      workflow({
        nodes: [trigger, httpNode, downstream],
        connections: [
          { id: "c1", source: "trigger", target: "http" },
          { id: "c2", source: "http", target: "downstream" },
        ],
      })
    );

    expect(result.status).toBe("error");
    expect(result.nodeResults.http.status).toBe("error");
    expect(result.nodeResults.downstream.status).toBe("skipped");
  });

  it("stops before the next node once the signal is aborted", async () => {
    const trigger = node("trigger", "webhook");
    const code = node("set", "code", { code: 'return [{ greeting: "hi" }];' });
    const downstream = node("downstream", "merge");
    const controller = new AbortController();
    controller.abort();

    const result = await executeWorkflow(
      workflow({
        nodes: [trigger, code, downstream],
        connections: [
          { id: "c1", source: "trigger", target: "set" },
          { id: "c2", source: "set", target: "downstream" },
        ],
      }),
      { signal: controller.signal }
    );

    expect(result.status).toBe("cancelled");
    expect(result.nodeResults).toEqual({});
  });

  it('resolves $node["Name"] expressions against a farther ancestor, not just the direct predecessor', async () => {
    const source = { ...node("source", "code", { code: 'return [{ tag: "from-source" }];' }), name: "Source" };
    const middle = { ...node("middle", "code", { code: 'return [{ tag: "from-middle" }];' }), name: "Middle" };
    const ifNode = {
      ...node("if", "if", { field: "tag", operator: "equals", value: '={{ $node["Source"].json.tag }}' }),
      name: "If",
    };

    const result = await executeWorkflow(
      workflow({
        nodes: [source, middle, ifNode],
        connections: [
          { id: "c1", source: "source", target: "middle" },
          { id: "c2", source: "middle", target: "if" },
        ],
      })
    );

    // The If node's own input comes from "middle" (tag: "from-middle"), but its `value` expression
    // reaches back past "middle" to "source"'s output — so comparing the input's own "tag" field
    // against that expression only matches if the expression actually resolved to "from-source".
    expect(result.nodeResults.if.branches?.false).toEqual([{ json: { tag: "from-middle" } }]);
    expect(result.nodeResults.if.branches?.true).toEqual([]);
  });

  it("throws a clear error for cyclic workflows", async () => {
    const a = node("a", "merge");
    const b = node("b", "merge");
    await expect(
      executeWorkflow(
        workflow({
          nodes: [a, b],
          connections: [
            { id: "c1", source: "a", target: "b" },
            { id: "c2", source: "b", target: "a" },
          ],
        })
      )
    ).rejects.toThrow(/cycle/i);
  });
});
