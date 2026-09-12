ALTER TABLE "code_chunks" ALTER COLUMN "embedding" SET DATA TYPE vector(1024);--> statement-breakpoint
ALTER TABLE "llm_configs" ADD COLUMN "kind" text DEFAULT 'chat' NOT NULL;--> statement-breakpoint
ALTER TABLE "llm_configs" ADD COLUMN "dimension" integer;