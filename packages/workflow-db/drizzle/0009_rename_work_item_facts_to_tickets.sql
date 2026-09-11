ALTER TABLE "work_item_facts" RENAME TO "tickets";--> statement-breakpoint
ALTER INDEX "work_item_facts_provider_external_id" RENAME TO "tickets_provider_external_id";
