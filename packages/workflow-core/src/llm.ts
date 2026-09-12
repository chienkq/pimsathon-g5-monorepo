/**
 * Single source of truth for the "LLM Settings" screen (admin-ui, Automation sidebar) — one place
 * to CRUD named LLM setups (provider + model + generation params) that AI-flavored nodes (e.g. Send
 * Message to AI Agent) can be pointed at, instead of each node embedding its own provider credentials.
 * Shared by admin-ui (renders the form) and backend (validates incoming fields, builds the real
 * provider client for "Test connection").
 */
export type LlmProviderId = "openai" | "anthropic" | "azure-openai" | "google" | "ollama" | "openai-compatible";

export interface LlmFieldSpec {
  key: string;
  label: string;
  /** "password" fields are masked in the UI and never echoed back by the backend once saved. */
  type: "text" | "password" | "number" | "textarea";
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  min?: number;
  max?: number;
  step?: number;
}

/** Provider-specific connection fields (auth + endpoint) — rendered before the common tuning fields. */
export interface LlmProviderSpec {
  id: LlmProviderId;
  displayName: string;
  description: string;
  color: string;
  connectionFields: LlmFieldSpec[];
  defaultModel: string;
  modelPlaceholder: string;
}

export const LLM_PROVIDERS: LlmProviderSpec[] = [
  {
    id: "openai",
    displayName: "OpenAI",
    description: "GPT models via the OpenAI API.",
    color: "#10a37f",
    defaultModel: "gpt-4o-mini",
    modelPlaceholder: "gpt-4o, gpt-4o-mini, o3-mini...",
    connectionFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sk-..." },
      {
        key: "baseUrl",
        label: "Base URL",
        type: "text",
        placeholder: "https://api.openai.com/v1",
        helpText: "Only needed to route through a proxy or gateway.",
      },
    ],
  },
  {
    id: "anthropic",
    displayName: "Anthropic",
    description: "Claude models via the Anthropic API.",
    color: "#d97757",
    defaultModel: "claude-sonnet-5",
    modelPlaceholder: "claude-sonnet-5, claude-opus-5...",
    connectionFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sk-ant-..." },
      { key: "baseUrl", label: "Base URL", type: "text", placeholder: "https://api.anthropic.com" },
    ],
  },
  {
    id: "azure-openai",
    displayName: "Azure OpenAI",
    description: "GPT models deployed through an Azure OpenAI resource.",
    color: "#0078d4",
    defaultModel: "gpt-4o",
    modelPlaceholder: "The base model behind your deployment, e.g. gpt-4o",
    connectionFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
      {
        key: "baseUrl",
        label: "Resource endpoint",
        type: "text",
        required: true,
        placeholder: "https://your-resource.openai.azure.com",
      },
      {
        key: "deploymentName",
        label: "Deployment name",
        type: "text",
        required: true,
        helpText: "The deployment name configured in Azure — this is what's actually called, not the base model name.",
      },
      { key: "apiVersion", label: "API version", type: "text", required: true, placeholder: "2024-08-01-preview" },
    ],
  },
  {
    id: "google",
    displayName: "Google Gemini",
    description: "Gemini models via the Google Generative Language API.",
    color: "#4285f4",
    defaultModel: "gemini-1.5-pro",
    modelPlaceholder: "gemini-1.5-pro, gemini-1.5-flash...",
    connectionFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "baseUrl", label: "Base URL", type: "text", placeholder: "https://generativelanguage.googleapis.com" },
    ],
  },
  {
    id: "ollama",
    displayName: "Ollama (local)",
    description: "Locally-hosted open models via an Ollama server — no API key needed.",
    color: "#6e7781",
    defaultModel: "llama3.1",
    modelPlaceholder: "llama3.1, mistral, qwen2.5...",
    connectionFields: [
      { key: "baseUrl", label: "Server URL", type: "text", required: true, placeholder: "http://localhost:11434" },
    ],
  },
  {
    id: "openai-compatible",
    displayName: "OpenAI-compatible",
    description:
      "Any self-hosted or third-party endpoint that speaks the OpenAI Chat Completions API (vLLM, LM Studio, OpenRouter...).",
    color: "#6366f1",
    defaultModel: "",
    modelPlaceholder: "Whatever model id your endpoint exposes",
    connectionFields: [
      { key: "baseUrl", label: "Base URL", type: "text", required: true, placeholder: "https://your-endpoint/v1" },
      { key: "apiKey", label: "API Key", type: "password", placeholder: "Leave blank if not required" },
    ],
  },
];

/**
 * Tuning fields common to every provider — model + generation params, rendered after the provider's
 * `connectionFields`. Kept to the small set that actually changes model behavior/cost/latency day to
 * day; anything more exotic (logit bias, stop sequences, tool choice...) belongs on the node itself,
 * not a reusable connection config.
 */
export const LLM_COMMON_FIELDS: LlmFieldSpec[] = [
  {
    key: "model",
    label: "Model",
    type: "text",
    required: true,
    helpText: "The exact model/deployment id the provider expects.",
  },
  {
    key: "temperature",
    label: "Temperature",
    type: "number",
    min: 0,
    max: 2,
    step: 0.1,
    helpText: "Randomness of output. 0 = deterministic/repeatable, 2 = very random. Most tasks: 0–0.7.",
  },
  {
    key: "maxTokens",
    label: "Max output tokens",
    type: "number",
    min: 1,
    max: 128000,
    step: 1,
    helpText: "Hard cap on response length — protects against runaway cost and latency.",
  },
  {
    key: "topP",
    label: "Top P",
    type: "number",
    min: 0,
    max: 1,
    step: 0.05,
    helpText: "Nucleus sampling cutoff. Optional — most guides recommend tuning this OR temperature, not both.",
  },
  {
    key: "timeoutMs",
    label: "Request timeout (ms)",
    type: "number",
    min: 1000,
    max: 300000,
    step: 1000,
    helpText: "Fails the call instead of hanging a workflow run indefinitely.",
  },
  {
    key: "systemPrompt",
    label: "Default system prompt",
    type: "textarea",
    helpText: "Optional. Sent as the system message on every call using this config, unless a node overrides it.",
  },
];

export const LLM_CONFIG_DEFAULTS = { temperature: 0.7, maxTokens: 1024, timeoutMs: 60000 } as const;

/** The client-safe shape returned by the backend — never carries the raw API key, only whether one is set. */
export interface LlmConfigSummary {
  id: string;
  name: string;
  provider: LlmProviderId;
  model: string;
  baseUrl: string | null;
  extra: Record<string, string>;
  temperature: number;
  maxTokens: number;
  topP: number | null;
  timeoutMs: number;
  systemPrompt: string | null;
  isDefault: boolean;
  hasApiKey: boolean;
  createdAt: string;
  updatedAt: string;
}

export function getLlmProvider(id: string): LlmProviderSpec | undefined {
  return LLM_PROVIDERS.find((p) => p.id === id);
}
