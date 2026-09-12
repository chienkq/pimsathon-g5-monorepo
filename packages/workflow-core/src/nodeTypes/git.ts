import { createEmptyFilterValue, getFilterFieldValue } from "../filter.js";
import type { NodeTypeDefinition } from "../types.js";

/**
 * Injected via `executeWorkflow(workflow, { services: { localGitClient } })` — backend's read-only
 * local-folder client (`apps/backend/src/localGitClient.ts`). Deliberately read-only: this node
 * mirrors n8n's Git node's read side (List Branches/Status/Log/List Config) but not its write side
 * (Add/Commit/Push/Pull/Clone/Tag/Add Config/User Setup) — see
 * [[git_control_settings_and_local_source]] on why local-git stays read-only/no-synced-entities.
 * For a real remote GitHub repository (branches/commits/PRs/issues, reads and writes), use the
 * separate GitHub node instead — see `github.ts`.
 */
export interface LocalGitClientService {
  listBranches(query?: string): Promise<string[]>;
  fetch(): Promise<{ success: true }>;
  getStatus(): Promise<{
    currentBranch: string;
    ahead: number;
    behind: number;
    staged: string[];
    modified: string[];
    notAdded: string[];
    deleted: string[];
    conflicted: string[];
    isClean: boolean;
  }>;
  getLog(options?: {
    maxCount?: number;
    branch?: string;
  }): Promise<Array<{ hash: string; message: string; authorName: string; authorEmail: string; date: string }>>;
  getConfigList(): Promise<Array<{ key: string; value: string }>>;
  listProjectFiles(options?: { maxTotalBytes?: number }): Promise<LocalGitProjectFiles>;
}

/** One tracked file's contents, as returned by "Read Project Files". */
export interface LocalGitProjectFile {
  path: string;
  content: string;
  bytes: number;
}

/**
 * Every tracked file (`git ls-files`, so already respects `.gitignore`) under a byte budget —
 * binaries/lockfiles/oversized files are skipped, and `truncated` is set once the budget or file-count
 * safety cap cuts the walk short, so a caller (e.g. an AI Agent node) knows the set is partial.
 */
export interface LocalGitProjectFiles {
  files: LocalGitProjectFile[];
  fileCount: number;
  totalBytes: number;
  truncated: boolean;
}

const ACTIONS = ["List Branches", "Fetch", "Status", "Log", "List Config", "Read Project Files"] as const;

export const gitNodeType: NodeTypeDefinition = {
  type: "git",
  displayName: "Git",
  description:
    "Reads state from a local git checkout (branches, status, log, config, tracked file contents) and fetches remote-tracking refs — no writes to the working tree, no GitHub connection needed.",
  group: "app",
  color: "#f05133",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "action",
      label: "Action",
      type: "select",
      default: "List Branches",
      options: ACTIONS.map((value) => ({ label: value, value })),
    },
    {
      key: "filters",
      label: "Filters",
      type: "filter",
      default: createEmptyFilterValue(),
      filterFields: [{ label: "Name", value: "name", type: "string" }],
      helpText:
        'Filters branch names by substring (case-insensitive), regardless of the operator picked — the underlying "git branch" lookup only supports substring matching, not the full operator set.',
      showWhen: { key: "action", values: ["List Branches"] },
    },
    {
      key: "branch",
      label: "Branch",
      type: "string",
      default: "",
      helpText: "Defaults to the current branch.",
      showWhen: { key: "action", values: ["Log"] },
    },
    {
      key: "maxCount",
      label: "Max Commits",
      type: "number",
      default: 20,
      showWhen: { key: "action", values: ["Log"] },
    },
    {
      key: "maxTotalSizeKb",
      label: "Max Total Size (KB)",
      type: "number",
      default: 500,
      helpText:
        "Combined size budget across all files' contents — binaries, lockfiles, and any single file over 100KB are skipped outright. Feeds into a downstream AI Agent node, so keep this within your model's context window.",
      showWhen: { key: "action", values: ["Read Project Files"] },
    },
  ],
  async execute({ parameters, services }) {
    const action = String(parameters.action ?? "List Branches");
    const localGitClient = services?.localGitClient as LocalGitClientService | undefined;
    if (!localGitClient) throw new Error("Git node requires a `localGitClient` service (only available in backend).");

    switch (action) {
      case "List Branches": {
        const query = getFilterFieldValue(parameters.filters, "name");
        const names = await localGitClient.listBranches(query);
        return { branches: { main: names.map((name) => ({ json: { name } })) } };
      }
      case "Fetch": {
        const result = await localGitClient.fetch();
        return { branches: { main: [{ json: { ...result } }] } };
      }
      case "Status": {
        const status = await localGitClient.getStatus();
        return { branches: { main: [{ json: { ...status } }] } };
      }
      case "Log": {
        const branch = String(parameters.branch ?? "") || undefined;
        const maxCount = Number(parameters.maxCount ?? 20) || undefined;
        const commits = await localGitClient.getLog({ branch, maxCount });
        return { branches: { main: commits.map((c) => ({ json: { ...c } })) } };
      }
      case "List Config": {
        const entries = await localGitClient.getConfigList();
        return { branches: { main: entries.map((e) => ({ json: { ...e } })) } };
      }
      case "Read Project Files": {
        const maxTotalSizeKb = Number(parameters.maxTotalSizeKb ?? 500) || 500;
        const result = await localGitClient.listProjectFiles({ maxTotalBytes: maxTotalSizeKb * 1024 });
        return { branches: { main: [{ json: { ...result } }] } };
      }
      default:
        throw new Error(`Git: unknown action "${action}".`);
    }
  },
};
