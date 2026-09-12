ALTER TABLE "tickets" ADD COLUMN "issue_type" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "epic_key" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "epic_name" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "components" jsonb;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "fix_versions" jsonb;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "labels" jsonb;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "due_date" text;