ALTER TABLE "alerts" ADD COLUMN "work_item_id" text;--> statement-breakpoint
ALTER TABLE "work_items" ADD COLUMN "ai_note" text;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE set null ON UPDATE no action;