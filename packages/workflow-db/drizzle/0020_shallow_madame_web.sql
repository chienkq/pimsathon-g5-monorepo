CREATE TABLE "agent_tools" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"parameters_schema" jsonb DEFAULT '{"type":"object","properties":{}}'::jsonb NOT NULL,
	"code" text DEFAULT '// `params` holds the arguments the model supplied, matching Parameters Schema.
return {};' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_agents" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"markdown" text DEFAULT '' NOT NULL,
	"llm_config_id" text,
	"tool_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_llm_config_id_llm_configs_id_fk" FOREIGN KEY ("llm_config_id") REFERENCES "public"."llm_configs"("id") ON DELETE set null ON UPDATE no action;