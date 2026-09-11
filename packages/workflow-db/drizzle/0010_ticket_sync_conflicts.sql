CREATE TABLE "ticket_sync_conflicts" (
	"id" text PRIMARY KEY NOT NULL,
	"work_item_id" text NOT NULL,
	"field" text NOT NULL,
	"app_value" jsonb NOT NULL,
	"jira_value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_items" ADD COLUMN "external_sync_base" jsonb;--> statement-breakpoint
ALTER TABLE "ticket_sync_conflicts" ADD CONSTRAINT "ticket_sync_conflicts_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_sync_conflicts_work_item_field" ON "ticket_sync_conflicts" USING btree ("work_item_id","field");
