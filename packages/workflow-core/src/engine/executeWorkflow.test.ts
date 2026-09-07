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
