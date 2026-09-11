import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/** Mirrors workflow-core's `WorkflowDefinition` so the server can persist/schedule workflows independently of the browser's LocalStorageWorkflowRepository. */
export const workflows = pgTable("workflows", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  definition: jsonb("definition").$type<Record<string, unknown>>().notNull(),
  active: boolean("active").notNull().default(false),
  /** True for built-in workflows registered at server startup (e.g. Jira Sync) — protects them from deletion via the API. Never settable through the editor's save/PUT. */
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per execution of a workflow, triggered by the scheduler, a webhook, or a manual run request. */
export const workflowRuns = pgTable("workflow_runs", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["running", "success", "error"] }).notNull(),
  trigger: text("trigger", { enum: ["schedule", "webhook", "manual"] }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  error: text("error"),
  /** Raw per-node output, keyed by node id — kept for debugging a run without re-executing it. */
  output: jsonb("output").$type<Record<string, unknown>>(),
});

/**
 * Normalized tickets, upserted by the `ticketUpsert` step after a Jira (or other tracker) sync.
 * Natural key is (provider, externalId) — matches how the sync workflow re-runs on overlapping windows.
 */
export const tickets = pgTable(
  "tickets",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    externalId: text("external_id").notNull(),
    externalKey: text("external_key").notNull(),
    projectKey: text("project_key").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull(),
    priority: text("priority"),
    assignee: text("assignee"),
    storyPoints: integer("story_points"),
    sprintId: text("sprint_id"),
    raw: jsonb("raw").$type<Record<string, unknown>>().notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("tickets_provider_external_id").on(table.provider, table.externalId)]
);

/** Health of each external connector, surfaced on the Integrations screen (W6). */
export const connectorStatus = pgTable("connector_status", {
  provider: text("provider").primaryKey(),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastSuccess: boolean("last_success").notNull().default(true),
  lastError: text("last_error"),
});

/** Per-connector credentials. `secretEncrypted` is AES-256-GCM ciphertext, never plaintext. */
export const credentials = pgTable("credentials", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  name: text("name").notNull(),
  secretEncrypted: text("secret_encrypted").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Platform data — the "platform" node group's own store, shaped to match `apps/admin-ui`'s domain
 * model exactly (see `apps/admin-ui/src/domain/types.ts`) rather than an external tracker's shape.
 * A work item here IS the PM tool's own ticket (what a Jira issue would be for a Jira-backed org) —
 * not a copy synced in from somewhere else, so there's no separate normalize/upsert step for it.
 * admin-ui itself still runs on its own local demo state (localStorage) today; this table is the
 * shared home workflows read/write through the `workItem` node, and the natural target if/when
 * admin-ui's `domain/storage.ts` is pointed at this backend instead of localStorage.
 */
/** Mirrors admin-ui's `Member` — read-only from admin-ui's side (it has no "create member" command). */
export const members = pgTable("members", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  initials: text("initials").notNull(),
  color: text("color").notNull(),
  login: text("login").notNull(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description").notNull().default(""),
  memberIds: jsonb("member_ids").$type<string[]>().notNull().default([]),
  color: text("color").notNull().default("#6366f1"),
  nextNumber: integer("next_number").notNull().default(1),
});

/**
 * Mirrors admin-ui's `PlanningGroup` (cycles + modules share this one shape there). `kind`
 * discriminates the two: "cycle" ≈ a sprint (fixed time-box), "module" ≈ W10's milestone (a body
 * of work grouped by theme/deliverable, not necessarily time-boxed the same way).
 */
export const planningGroups = pgTable("planning_groups", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["cycle", "module"] }).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  startDate: text("start_date").notNull().default(""),
  endDate: text("end_date").notNull().default(""),
  leadId: text("lead_id").notNull().default(""),
});

export const workItems = pgTable(
  "work_items",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status", { enum: ["Todo", "In Progress", "In Review", "Done", "Cancelled"] }).notNull(),
    priority: text("priority", { enum: ["Low", "Medium", "High", "Urgent"] }).notNull(),
    assigneeId: text("assignee_id").notNull().default(""),
    labels: jsonb("labels").$type<string[]>().notNull().default([]),
    startDate: text("start_date").notNull().default(""),
    dueDate: text("due_date").notNull().default(""),
    cycleId: text("cycle_id").notNull().default(""),
    moduleIds: jsonb("module_ids").$type<string[]>().notNull().default([]),
    /** Estimate used for burndown/velocity (Analyze Cycle workflow) — null for items with no estimate. */
    storyPoints: integer("story_points"),
    /** Set only for work items auto-created/updated from a `tickets` row (e.g. Jira import/sync) — null for ones authored directly in the app. Lets re-importing the same issue update its work item instead of duplicating it. */
    externalProvider: text("external_provider"),
    externalKey: text("external_key"),
    /**
     * Last-synced-from-Jira snapshot of the three mergeable fields, used as the "base" in a
     * three-way merge on re-conversion (see `jiraTicketToWorkItem.ts`) — lets a re-sync tell
     * "Jira changed this" apart from "the user changed this in the app" instead of blindly
     * overwriting local edits. Null until the first conversion from a ticket.
     */
    externalSyncBase: jsonb("external_sync_base").$type<{ title: string; status: string; priority: string }>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("work_items_project_number").on(table.projectId, table.number),
    uniqueIndex("work_items_external_provider_key").on(table.externalProvider, table.externalKey),
  ]
);

/**
 * A field left unresolved by the three-way merge in `jiraTicketToWorkItem.ts` — both the work item
 * (`appValue`) and the Jira ticket (`jiraValue`) changed the same field since the last sync, so
 * neither is applied automatically. One row per `(workItemId, field)`; resolving it (see
 * `ticketSyncConflictStore.ts`) deletes the row. Scoped to `work_items` directly rather than a
 * separate link table (unlike GitHub's `issueLinks`) since `work_items` already has a 1:1 link to
 * its source ticket via `externalProvider`/`externalKey`.
 */
export const ticketSyncConflicts = pgTable(
  "ticket_sync_conflicts",
  {
    id: text("id").primaryKey(),
    workItemId: text("work_item_id")
      .notNull()
      .references(() => workItems.id, { onDelete: "cascade" }),
    field: text("field", { enum: ["title", "status", "priority"] }).notNull(),
    appValue: jsonb("app_value").$type<string>().notNull(),
    jiraValue: jsonb("jira_value").$type<string>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ticket_sync_conflicts_work_item_field").on(table.workItemId, table.field)]
);

/**
 * Alerts raised by rule-based workflows (e.g. W11 Alert Engine), deduped by `dedupeKey` so a
 * re-run doesn't spam a new row for a condition that's still true — it just bumps `updatedAt`.
 */
export const alerts = pgTable(
  "alerts",
  {
    id: text("id").primaryKey(),
    dedupeKey: text("dedupe_key").notNull(),
    severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    source: text("source").notNull(),
    status: text("status", { enum: ["open", "closed"] })
      .notNull()
      .default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("alerts_dedupe_key").on(table.dedupeKey)]
);

/**
 * Chart-ready payloads published by `publishWidget` — the Project Health Dashboard's charts read
 * from here, never from a workflow's live output, so a chart still shows the last-computed data
 * even when its workflow hasn't run yet or is mid-failure.
 */
export const widgets = pgTable("widgets", {
  widgetId: text("widget_id").primaryKey(),
  title: text("title").notNull(),
  type: text("type", { enum: ["bar", "line", "pie", "table"] }).notNull(),
  series: jsonb("series").$type<Record<string, unknown>[]>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One row per Analyze Cycle / Analyze Module run, for the `analysisResultSave`/`analysisResultQuery`
 * nodes — deliberately a separate table from `tickets` (not a generalization of it), since
 * that table's schema/unique-index are tuned to Jira-issue-shaped tickets and Jira Sync/Alert Engine
 * depend on that exact shape. `subjectId` is a `planning_groups.id` (a cycle or a module).
 */
export const analysisResults = pgTable("analysis_results", {
  id: text("id").primaryKey(),
  subjectType: text("subject_type", { enum: ["cycle", "module"] }).notNull(),
  subjectId: text("subject_id").notNull(),
  status: text("status", { enum: ["on_track", "at_risk", "off_track"] }).notNull(),
  healthScore: integer("health_score").notNull(),
  summary: text("summary").notNull().default(""),
  risks: jsonb("risks").$type<Record<string, unknown>[]>().notNull().default([]),
  completionDate: text("completion_date"),
  recommendedActions: jsonb("recommended_actions").$type<string[]>().notNull().default([]),
  needsAlert: boolean("needs_alert").notNull().default(false),
  alertSeverity: text("alert_severity", { enum: ["low", "medium", "high", "critical"] }),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Real GitHub data, cached from the live API (see backend's githubClient.ts) — this is a mirror
 * for fast reads/joins, not a second source of truth; a sync workflow refreshes it, and writes
 * (create issue/branch/PR) always go to the real GitHub API first, then update this cache.
 * `owner`/`name` are GitHub's real identity for a repo; `projectId` is admin-ui's own link.
 */
export const repositories = pgTable(
  "repositories",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    defaultBranch: text("default_branch").notNull().default("main"),
    connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("repositories_owner_name").on(table.owner, table.name)]
);

export const githubIssues = pgTable(
  "github_issues",
  {
    id: text("id").primaryKey(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    labels: jsonb("labels").$type<string[]>().notNull().default([]),
    assignee: text("assignee").notNull().default(""),
    state: text("state", { enum: ["open", "closed"] }).notNull(),
    url: text("url").notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("github_issues_repository_number").on(table.repositoryId, table.number)]
);

export const branches = pgTable(
  "branches",
  {
    id: text("id").primaryKey(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** admin-ui's own "this branch is for that work item" link — not a GitHub concept. */
    workItemId: text("work_item_id").references(() => workItems.id, { onDelete: "set null" }),
    sha: text("sha").notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("branches_repository_name").on(table.repositoryId, table.name)]
);

export const commits = pgTable(
  "commits",
  {
    id: text("id").primaryKey(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    branchId: text("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    sha: text("sha").notNull(),
    message: text("message").notNull(),
    authorLogin: text("author_login").notNull().default(""),
    at: timestamp("at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("commits_repository_sha").on(table.repositoryId, table.sha)]
);

export const pullRequests = pgTable(
  "pull_requests",
  {
    id: text("id").primaryKey(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    headBranch: text("head_branch").notNull(),
    baseBranch: text("base_branch").notNull(),
    /** admin-ui's own "this PR is for that work item" link — not a GitHub concept. */
    workItemId: text("work_item_id").references(() => workItems.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    status: text("status", { enum: ["Open", "Closed", "Merged"] }).notNull(),
    url: text("url").notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("pull_requests_repository_number").on(table.repositoryId, table.number)]
);

/**
 * A work item <-> GitHub issue link, with `base` holding the last-synchronized snapshot of the
 * shared fields (title/description/labels/assignee/state) — the three-way-merge baseline, same
 * idea as admin-ui's original in-browser `domain/github.ts` sync, now run against the real issue.
 */
export const issueLinks = pgTable("issue_links", {
  id: text("id").primaryKey(),
  workItemId: text("work_item_id")
    .notNull()
    .unique()
    .references(() => workItems.id, { onDelete: "cascade" }),
  issueId: text("issue_id")
    .notNull()
    .unique()
    .references(() => githubIssues.id, { onDelete: "cascade" }),
  base: jsonb("base")
    .$type<{ title: string; description: string; labels: string[]; assignee: string; state: "open" | "closed" }>()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const syncConflicts = pgTable("sync_conflicts", {
  id: text("id").primaryKey(),
  linkId: text("link_id")
    .notNull()
    .references(() => issueLinks.id, { onDelete: "cascade" }),
  field: text("field", { enum: ["title", "description", "labels", "assignee", "state"] }).notNull(),
  toolValue: jsonb("tool_value").$type<string | string[]>().notNull(),
  githubValue: jsonb("github_value").$type<string | string[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const syncEvents = pgTable("sync_events", {
  id: text("id").primaryKey(),
  repositoryId: text("repository_id")
    .notNull()
    .references(() => repositories.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  kind: text("kind", { enum: ["success", "error", "info"] }).notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});
