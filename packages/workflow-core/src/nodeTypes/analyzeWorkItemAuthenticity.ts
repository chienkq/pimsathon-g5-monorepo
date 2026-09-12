import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";
import type { SendMessageToAgentService } from "./sendMessageToAgent.js";

/**
 * Verifies whether a work item's tracked status matches real evidence in the local source tree — with
 * no git history/diff and no embedding API available, the only two primitives an AI Agent has are
 * `search_code` (git grep) and `read_file` (see `apps/backend/src/seedAuthenticityAgent.ts`, which
 * seeds both as real `agent_tools` plus the `workitem-authenticity-analyst` AI Agent that's allowed to
 * call them). This node just sends one message per work item to that Agent — real tool-calling
 * (OpenAI/Anthropic function calling via `runAgent`, see `apps/backend/src/llmAgentRunner.ts`) does the
 * whole search/read loop; this node only has to parse the Agent's final JSON verdict.
 *
 * The `relevantFiles` a verdict names are written into the work item's `aiNote` (as a small JSON block
 * plus a human-readable summary) so a later run can point the Agent straight at those files instead of
 * starting its search from scratch — see `parseCache`/`composeAiNote`.
 */

export type AuthenticityVerdict = "done" | "partial" | "not_found";

interface FinalDecision {
  verdict: AuthenticityVerdict;
  confidence: number;
  reasoning: string;
  relevantFiles: string[];
}

interface CachedAnalysis extends FinalDecision {
  analyzedAt: string;
}

const CACHE_PREFIX = "<!--wf-authenticity:";
const CACHE_SUFFIX = "-->";

function parseLooseJson(raw: string): Record<string, unknown> | undefined {
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    const parsed = JSON.parse(stripped);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    // The model sometimes wraps its verdict in a sentence or two ("Here is my verdict: {...}") despite
    // being told not to — pull out the outermost {...} span and retry before giving up entirely.
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) return undefined;
    try {
      const parsed = JSON.parse(match[0]);
      return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : undefined;
    } catch {
      return undefined;
    }
  }
}

function normalizeFinal(parsed: Record<string, unknown> | undefined, fallbackReason: string): FinalDecision {
  const verdictRaw = String(parsed?.verdict ?? "");
  const verdict: AuthenticityVerdict = verdictRaw === "done" || verdictRaw === "partial" ? verdictRaw : "not_found";
  const confidence = Number(parsed?.confidence);
  return {
    verdict,
    confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0,
    reasoning: String(parsed?.reasoning ?? "") || fallbackReason,
    relevantFiles: Array.isArray(parsed?.relevantFiles) ? (parsed.relevantFiles as unknown[]).map(String) : [],
  };
}

function parseCache(aiNote: unknown): CachedAnalysis | undefined {
  if (typeof aiNote !== "string") return undefined;
  const start = aiNote.indexOf(CACHE_PREFIX);
  if (start === -1) return undefined;
  const end = aiNote.indexOf(CACHE_SUFFIX, start);
  if (end === -1) return undefined;
  try {
    return JSON.parse(aiNote.slice(start + CACHE_PREFIX.length, end)) as CachedAnalysis;
  } catch {
    return undefined;
  }
}

function composeAiNote(decision: FinalDecision, analyzedAt: string, usedCache: boolean): string {
  const cache: CachedAnalysis = { ...decision, analyzedAt };
  const lines = [
    `[Authenticity Analysis — ${analyzedAt}]`,
    `Verdict: ${decision.verdict} (confidence ${decision.confidence.toFixed(2)}${usedCache ? ", re-verified from cache" : ""})`,
    `Reasoning: ${decision.reasoning}`,
    decision.relevantFiles.length > 0
      ? `Relevant files:\n${decision.relevantFiles.map((f) => `- ${f}`).join("\n")}`
      : "Relevant files: none found",
  ];
  return `${lines.join("\n")}\n${CACHE_PREFIX}${JSON.stringify(cache)}${CACHE_SUFFIX}`;
}

function computeNeedsAlert(
  verdict: AuthenticityVerdict,
  itemStatus: string
): { needsAlert: boolean; alertSeverity: "low" | "medium" | "high" } {
  const activeOrDone = ["In Progress", "In Review", "Done"].includes(itemStatus);
  if (verdict === "not_found" && activeOrDone)
    return { needsAlert: true, alertSeverity: itemStatus === "Done" ? "high" : "medium" };
  if (verdict === "partial" && itemStatus === "Done") return { needsAlert: true, alertSeverity: "medium" };
  return { needsAlert: false, alertSeverity: "low" };
}

function toHealthScore(verdict: AuthenticityVerdict): number {
  return verdict === "done" ? 90 : verdict === "partial" ? 55 : 20;
}

function buildMessage(workItemContext: unknown, cached: CachedAnalysis | undefined): string {
  if (!cached) {
    return (
      `This work item has no AI Note yet. Call recall_workitem first to pull its full record and raw Jira ` +
      `payload, decide from that alone whether a source-code check is even necessary, and only search/read ` +
      `source if it is. Then answer with the final JSON verdict.\n\n` +
      `Work item:\n${JSON.stringify(workItemContext)}`
    );
  }
  return (
    `You previously analyzed this work item and found these relevant files: ${JSON.stringify(cached.relevantFiles)} ` +
    `(prior verdict: ${cached.verdict}, confidence ${cached.confidence}). Since an AI Note already exists, go ` +
    `straight to source: re-read those files with your read_file tool and confirm whether they still support ` +
    `that verdict — search for anything new only if they no longer do. Then answer with the final JSON verdict.\n\n` +
    `Work item:\n${JSON.stringify(workItemContext)}`
  );
}

export const analyzeWorkItemAuthenticityNodeType: NodeTypeDefinition = {
  type: "analyzeWorkItemAuthenticity",
  displayName: "Analyze Work Item Authenticity",
  description:
    "Per work item, an AI Agent searches (git grep) and reads local source files — via real tool-calling — to judge whether the tracked status is actually backed by code, then caches the files it found in the item's AI Note for next time.",
  group: "ai",
  color: "#7b2cbf",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "agentId",
      label: "Agent",
      type: "select",
      default: "",
      dynamicOptions: "aiAgents",
      helpText:
        'Pick an AI Agent (Settings → AI Agents) with the search_code/read_file Tools assigned — seeded automatically as "workitem-authenticity-analyst".',
      required: true,
    },
    {
      key: "reuseCachedFiles",
      label: "Reuse Cached Files From AI Note",
      type: "boolean",
      default: true,
      helpText:
        "When the item's AI Note already has a prior analysis, point the Agent at those same files to re-verify instead of starting a fresh search — cheaper, but can miss code that moved to a different file.",
    },
  ],
  async execute({ parameters, input, services }) {
    const agentId = String(parameters.agentId ?? "");
    if (!agentId) throw new Error("Analyze Work Item Authenticity requires an Agent to be selected.");
    const reuseCachedFiles = parameters.reuseCachedFiles !== false;

    const agentClient = services?.agentClient as SendMessageToAgentService | undefined;
    if (!agentClient)
      throw new Error("Analyze Work Item Authenticity requires an `agentClient` service (only available in backend).");

    const output: NodeExecutionData[] = [];

    for (const item of input) {
      const json = item.json;
      const workItemContext = {
        id: json.id,
        key: json.key,
        title: json.title,
        description: json.description,
        status: json.status,
      };
      const cached = reuseCachedFiles ? parseCache(json.aiNote) : undefined;
      const analyzedAt = new Date().toISOString();

      const result = await agentClient.complete(agentId, {
        message: buildMessage(workItemContext, cached),
        context: { workItem: workItemContext },
      });
      const rawResponse = result.response;
      const fallbackReason = rawResponse.trim()
        ? `The Agent's response could not be parsed as the expected JSON verdict. Raw response: ${rawResponse.slice(0, 500)}`
        : "The Agent returned an empty response instead of a JSON verdict.";
      const decision = normalizeFinal(parseLooseJson(rawResponse), fallbackReason);
      const usedCache = Boolean(cached);

      const itemStatus = String(json.status ?? "");
      const { needsAlert, alertSeverity } = computeNeedsAlert(decision.verdict, itemStatus);
      output.push({
        json: {
          ...json,
          subjectId: json.id,
          itemStatus,
          verdict: decision.verdict,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
          relevantFiles: decision.relevantFiles,
          agentTrace: result.trace,
          agentRawResponse: rawResponse,
          usedCache,
          analyzedAt,
          // Overwrites the original tracked `status` (Todo/In Progress/...) with the analysis enum —
          // `analysisResultSave` requires exactly this enum in `status`; the original is kept above as `itemStatus`.
          status: decision.verdict === "done" ? "on_track" : decision.verdict === "partial" ? "at_risk" : "off_track",
          healthScore: toHealthScore(decision.verdict),
          summary: `${decision.verdict} — ${String(json.key ?? "")} (${itemStatus}). ${decision.reasoning}`,
          risks: needsAlert
            ? [
                {
                  title: `Authenticity check: ${decision.verdict} for a "${json.status}" item`,
                  relatedWorkItemIds: [json.id],
                },
              ]
            : [],
          recommendedActions: needsAlert
            ? ["Confirm real progress against this item, or correct its tracked status."]
            : [],
          needsAlert,
          alertSeverity,
          aiNoteText: composeAiNote(decision, analyzedAt, usedCache),
        },
      });
    }

    return { branches: { main: output } };
  },
};
