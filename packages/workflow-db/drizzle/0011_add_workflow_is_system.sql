ALTER TABLE "workflows" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Backfill: mark the built-in workflows registered at server startup (see apps/backend/src/index.ts's
-- registeredWorkflows) as system workflows so pre-existing rows get protected too, not just new ones.
UPDATE "workflows" SET "is_system" = true WHERE "id" IN (
	'w1-jira-sync',
	'w3-github-sync',
	'w8-team-workload',
	'w9-bug-metrics',
	'w10-milestone-tracker',
	'w11-alert-engine',
	'w12-analyze-cycle',
	'w13-analyze-module'
);