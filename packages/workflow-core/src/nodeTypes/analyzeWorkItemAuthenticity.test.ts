import { describe, expect, it, vi } from "vitest";
import type { WorkflowDefinition } from "../types.js";
import { executeWorkflow } from "../engine/executeWorkflow.js";

function workflow(parameters: Record<string, unknown> = {}, aiNote?: string): WorkflowDefinition {
  return {
    id: "wf-authenticity",
    name: "Test",
    active: false,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    nodes: [
      {
        id: "trigger",
        type: "webhook",
        name: "trigger",
        position: { x: 0, y: 0 },
        parameters: {},
      },
      {
        id: "set",
        type: "code",
        name: "set",
        position: { x: 0, y: 0 },
        parameters: {
          code: `return [{
            id: "wi-1",
            key: "PMS-1",
            title: "Add login form",
            description: "Implement the login form.",
            status: "In Progress",
            aiNote: ${JSON.stringify(aiNote)},
          }];`,
        },
      },
      {
        id: "agent",
        type: "analyzeWorkItemAuthenticity",
        name: "agent",
        position: { x: 0, y: 0 },
        parameters: { agentId: "test-agent-id", ...parameters },
      },
    ],
    connections: [
      { id: "c1", source: "trigger", target: "set" },
      { id: "c2", source: "set", target: "agent" },
    ],
  };
}

describe("analyzeWorkItemAuthenticity node", () => {
  it("sends the work item to the AI Agent and parses its final JSON verdict", async () => {
    const complete = vi.fn().mockResolvedValue({
      response: JSON.stringify({
        verdict: "done",
        confidence: 0.9,
        reasoning: "found it",
        relevantFiles: ["src/login.ts"],
      }),
      trace: [],
    });

    const result = await executeWorkflow(workflow(), {
      services: { agentClient: { complete } },
    });

    expect(result.status).toBe("success");
    const item = result.nodeResults.agent.branches?.main?.[0]?.json as Record<string, unknown>;
    expect(item.verdict).toBe("done");
    expect(item.confidence).toBe(0.9);
    expect(item.relevantFiles).toEqual(["src/login.ts"]);
    expect(item.needsAlert).toBe(false);
    expect(item.usedCache).toBe(false);
    expect(String(item.aiNoteText)).toContain("<!--wf-authenticity:");
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith(
      "test-agent-id",
      expect.objectContaining({ context: { workItem: expect.objectContaining({ key: "PMS-1" }) } })
    );
  });

  it("points the Agent at previously-cached files instead of a fresh search", async () => {
    const cache = {
      verdict: "partial",
      confidence: 0.5,
      reasoning: "old",
      relevantFiles: ["src/old.ts"],
      analyzedAt: "2020-01-01T00:00:00.000Z",
    };
    const complete = vi.fn().mockResolvedValue({
      response: JSON.stringify({
        verdict: "done",
        confidence: 0.8,
        reasoning: "still valid",
        relevantFiles: ["src/old.ts"],
      }),
      trace: [],
    });

    const result = await executeWorkflow(workflow({}, `prior note\n<!--wf-authenticity:${JSON.stringify(cache)}-->`), {
      services: { agentClient: { complete } },
    });

    const item = result.nodeResults.agent.branches?.main?.[0]?.json as Record<string, unknown>;
    expect(item.usedCache).toBe(true);
    expect(item.verdict).toBe("done");
    expect(complete).toHaveBeenCalledTimes(1);
    const [, callArgs] = complete.mock.calls[0];
    expect(callArgs.message).toContain("src/old.ts");
  });

  it("falls back to a not_found verdict when the Agent's response isn't parseable JSON", async () => {
    const complete = vi.fn().mockResolvedValue({ response: "I couldn't determine a verdict.", trace: [] });

    const result = await executeWorkflow(workflow(), {
      services: { agentClient: { complete } },
    });

    const item = result.nodeResults.agent.branches?.main?.[0]?.json as Record<string, unknown>;
    expect(item.verdict).toBe("not_found");
    expect(String(item.reasoning)).toMatch(/parsed/i);
  });
});
