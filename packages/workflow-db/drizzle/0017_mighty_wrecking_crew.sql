CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "code_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"file_path" text NOT NULL,
	"symbol_name" text NOT NULL,
	"kind" text NOT NULL,
	"start_line" integer NOT NULL,
	"end_line" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(768) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "code_chunks_file_path" ON "code_chunks" USING btree ("file_path");
