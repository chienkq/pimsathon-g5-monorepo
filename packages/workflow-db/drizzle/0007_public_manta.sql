ALTER TABLE "work_items" ADD COLUMN "external_provider" text;--> statement-breakpoint
ALTER TABLE "work_items" ADD COLUMN "external_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "work_items_external_provider_key" ON "work_items" USING btree ("external_provider","external_key");