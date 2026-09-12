import type { GitBranch, GitIssue, GitPullRequest, GitRepositoryInfo } from "./github.js";
import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

/**
 * Caches real GitHub data (see github.ts's `GitClientService`) into Postgres so admin-ui's GitHub
 * screen and dashboard workflows can read it without hitting the GitHub API on every page view —
 * same "sync into a mirror table" shape as `ticketUpsert`, just for a different upstream connector.
 */
export interface GitCacheStoreService {
  upsertRepository(owner: string, repo: string, info: GitRepositoryInfo): Promise<void>;
  upsertBranches(owner: string, repo: string, branches: GitBranch[]): Promise<void>;
  upsertPullRequests(owner: string, repo: string, pullRequests: GitPullRequest[]): Promise<void>;
  upsertIssues(owner: string, repo: string, issues: GitIssue[]): Promise<void>;
}

const ENTITIES = ["Repository", "Branches", "Pull Requests", "Issues"] as const;

export const gitCacheUpsertNodeType: NodeTypeDefinition = {
  type: "gitCacheUpsert",
  displayName: "Git Cache — Upsert",
  description:
    "Caches the upstream Git node's output (repository info, branches, PRs, or issues) into the cache store.",
  group: "data",
  color: "#7d726d",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "entity",
      label: "Entity",
      type: "select",
      default: "Branches",
      options: ENTITIES.map((value) => ({ label: value, value })),
    },
    { key: "owner", label: "Owner", type: "string", default: "", required: true },
    { key: "repo", label: "Repository", type: "string", default: "", required: true },
  ],
  async execute({ parameters, input, services }) {
    const gitCacheStore = services?.gitCacheStore as GitCacheStoreService | undefined;
    if (!gitCacheStore)
      throw new Error("Git Cache — Upsert requires a `gitCacheStore` service (only available in backend).");

    const owner = String(parameters.owner ?? "");
    const repo = String(parameters.repo ?? "");
    if (!owner || !repo) throw new Error("Git Cache — Upsert requires an Owner and a Repository.");
    const entity = String(parameters.entity ?? "Branches");

    switch (entity) {
      case "Repository": {
        const info = input[0]?.json as unknown as GitRepositoryInfo | undefined;
        if (!info)
          throw new Error(
            "Git Cache — Upsert (Repository) requires one input item from a Git node's Get Repository action."
          );
        await gitCacheStore.upsertRepository(owner, repo, info);
        break;
      }
      case "Branches":
        await gitCacheStore.upsertBranches(
          owner,
          repo,
          input.map((item) => item.json as unknown as GitBranch)
        );
        break;
      case "Pull Requests":
        await gitCacheStore.upsertPullRequests(
          owner,
          repo,
          input.map((item) => item.json as unknown as GitPullRequest)
        );
        break;
      case "Issues":
        await gitCacheStore.upsertIssues(
          owner,
          repo,
          input.map((item) => item.json as unknown as GitIssue)
        );
        break;
      default:
        throw new Error(`Git Cache — Upsert: unknown entity "${entity}".`);
    }

    const output: NodeExecutionData[] = input;
    return { branches: { main: output } };
  },
};
