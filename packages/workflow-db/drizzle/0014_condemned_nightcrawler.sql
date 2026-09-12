CREATE TABLE "llm_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"api_key_encrypted" text,
	"base_url" text,
	"extra" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"temperature" double precision DEFAULT 0.7 NOT NULL,
	"max_tokens" integer DEFAULT 1024 NOT NULL,
	"top_p" double precision,
	"timeout_ms" integer DEFAULT 60000 NOT NULL,
	"system_prompt" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
