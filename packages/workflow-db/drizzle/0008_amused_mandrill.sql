CREATE TABLE "analysis_results" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"status" text NOT NULL,
	"health_score" integer NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"risks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completion_date" text,
	"recommended_actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"needs_alert" boolean DEFAULT false NOT NULL,
	"alert_severity" text,
	"analyzed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_items" ADD COLUMN "story_points" integer;