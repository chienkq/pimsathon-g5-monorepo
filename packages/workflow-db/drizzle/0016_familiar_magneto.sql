ALTER TABLE "repositories" DROP CONSTRAINT "repositories_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "repository_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
UPDATE "projects" p SET "repository_id" = r.id FROM "repositories" r WHERE r.project_id = p.id;--> statement-breakpoint
ALTER TABLE "repositories" DROP COLUMN "project_id";