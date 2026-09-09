import type { NodeTypeDefinition } from "../types.js";

export interface GitBranch {
  name: string;
  sha: string;
}
export interface GitCommit {
  sha: string;
  message: string;
  authorLogin: string;
  at: string;
}
export interface GitPullRequest {
  number: number;
  title: string;
  headBranch: string;
  baseBranch: string;
  status: "Open" | "Closed" | "Merged";
  url: string;
}
export interface GitIssue {
  number: number;
  title: string;
  description: string;
  labels: string[];
  assignee: string;
  state: "open" | "closed";
  url: string;
}
export interface GitRepositoryInfo {
  defaultBranch: string;
}

/** Injected via `executeWorkflow(workflow, { services: { gitClient } })` — backend provides the real GitHub API implementation. */
export interface GitClientService {
  getRepository(owner: string, repo: string): Promise<GitRepositoryInfo>;
  listBranches(owner: string, repo: string): Promise<GitBranch[]>;
  listCommits(owner: string, repo: string, branch: string): Promise<GitCommit[]>;
  listPullRequests(owner: string, repo: string, state: "open" | "closed" | "all"): Promise<GitPullRequest[]>;
  listIssues(owner: string, repo: string, state: "open" | "closed" | "all"): Promise<GitIssue[]>;
  createIssue(
    owner: string,
    repo: string,
    input: { title: string; body: string; labels: string[]; assignee?: string }
  ): Promise<GitIssue>;
  createBranch(owner: string, repo: string, input: { name: string; fromBranch: string }): Promise<GitBranch>;
  createPullRequest(
    owner: string,
    repo: string,
    input: { title: string; head: string; base: string }
  ): Promise<GitPullRequest>;
}

const ACTIONS = [
  "Get Repository",
  "List Branches",
  "List Commits",
  "List Pull Requests",
  "List Issues",
  "Create Issue",
  "Create Branch",
  "Create Pull Request",
] as const;

function parseCommaList(value: unknown): string[] {
  return String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const gitNodeType: NodeTypeDefinition = {
  type: "git",
  displayName: "Git",
  description: "Reads or writes against a real GitHub repository (branches, commits, PRs, issues).",
  group: "app",
  color: "#24292e",
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
    { key: "owner", label: "Owner", type: "string", default: "", placeholder: "e.g. octocat", required: true },
    { key: "repo", label: "Repository", type: "string", default: "", placeholder: "e.g. hello-world", required: true },
    {
      key: "branch",
      label: "Branch",
      type: "string",
      default: "",
      helpText: "Used by List Commits (defaults to the repo's default branch).",
    },
    {
      key: "state",
      label: "State",
      type: "select",
      default: "open",
      options: ["open", "closed", "all"].map((value) => ({ label: value, value })),
      helpText: "Used by List Pull Requests, List Issues.",
    },
    {
      key: "title",
      label: "Title",
      type: "string",
      default: "",
      helpText: "Used by Create Issue, Create Pull Request.",
    },
    { key: "description", label: "Description / Body", type: "string", default: "", helpText: "Used by Create Issue." },
    {
      key: "labels",
      label: "Labels (comma-separated)",
      type: "string",
      default: "",
      helpText: "Used by Create Issue.",
    },
    { key: "assignee", label: "Assignee (login)", type: "string", default: "", helpText: "Used by Create Issue." },
    { key: "branchName", label: "New Branch Name", type: "string", default: "", helpText: "Used by Create Branch." },
    {
      key: "fromBranch",
      label: "From Branch",
      type: "string",
      default: "",
      helpText: "Used by Create Branch (defaults to the repo's default branch).",
    },
    { key: "headBranch", label: "Head Branch", type: "string", default: "", helpText: "Used by Create Pull Request." },
    {
      key: "baseBranch",
      label: "Base Branch",
      type: "string",
      default: "",
      helpText: "Used by Create Pull Request (defaults to the repo's default branch).",
    },
  ],
  async execute({ parameters, services }) {
    const gitClient = services?.gitClient as GitClientService | undefined;
    if (!gitClient) throw new Error("Git node requires a `gitClient` service (only available in backend).");

    const owner = String(parameters.owner ?? "");
    const repo = String(parameters.repo ?? "");
    if (!owner || !repo) throw new Error("Git node requires an Owner and a Repository.");
    const action = String(parameters.action ?? "List Branches");
    const state = (parameters.state || "open") as "open" | "closed" | "all";

    const defaultBranchFallback = async () => (await gitClient.getRepository(owner, repo)).defaultBranch;

    switch (action) {
      case "Get Repository": {
        const info = await gitClient.getRepository(owner, repo);
        return { branches: { main: [{ json: { ...info } }] } };
      }
      case "List Branches": {
        const branches = await gitClient.listBranches(owner, repo);
        return { branches: { main: branches.map((b) => ({ json: { ...b } })) } };
      }
      case "List Commits": {
        const branch = String(parameters.branch ?? "") || (await defaultBranchFallback());
        const commits = await gitClient.listCommits(owner, repo, branch);
        return { branches: { main: commits.map((c) => ({ json: { ...c } })) } };
      }
      case "List Pull Requests": {
        const prs = await gitClient.listPullRequests(owner, repo, state);
        return { branches: { main: prs.map((p) => ({ json: { ...p } })) } };
      }
      case "List Issues": {
        const issues = await gitClient.listIssues(owner, repo, state);
        return { branches: { main: issues.map((i) => ({ json: { ...i } })) } };
      }
      case "Create Issue": {
        const title = String(parameters.title ?? "");
        if (!title) throw new Error("Git Create Issue requires a Title.");
        const issue = await gitClient.createIssue(owner, repo, {
          title,
          body: String(parameters.description ?? ""),
          labels: parseCommaList(parameters.labels),
          assignee: String(parameters.assignee ?? "") || undefined,
        });
        return { branches: { main: [{ json: { ...issue } }] } };
      }
      case "Create Branch": {
        const name = String(parameters.branchName ?? "");
        if (!name) throw new Error("Git Create Branch requires a New Branch Name.");
        const fromBranch = String(parameters.fromBranch ?? "") || (await defaultBranchFallback());
        const branch = await gitClient.createBranch(owner, repo, { name, fromBranch });
        return { branches: { main: [{ json: { ...branch } }] } };
      }
      case "Create Pull Request": {
        const title = String(parameters.title ?? "");
        const head = String(parameters.headBranch ?? "");
        if (!title || !head) throw new Error("Git Create Pull Request requires a Title and a Head Branch.");
        const base = String(parameters.baseBranch ?? "") || (await defaultBranchFallback());
        const pr = await gitClient.createPullRequest(owner, repo, { title, head, base });
        return { branches: { main: [{ json: { ...pr } }] } };
      }
      default:
        throw new Error(`Git: unknown action "${action}".`);
    }
  },
};
