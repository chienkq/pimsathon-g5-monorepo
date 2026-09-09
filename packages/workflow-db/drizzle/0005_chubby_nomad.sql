CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"initials" text NOT NULL,
	"color" text NOT NULL,
	"login" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "member_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;