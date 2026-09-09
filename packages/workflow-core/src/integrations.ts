/**
 * Single source of truth for the "Integrations" setup screen (admin-ui) and the credential
 * config shape the backend stores/encrypts — see workflow-db's `credentials` table comment
 * ("surfaced on the Integrations screen (W6)"). Shared by admin-ui (renders the form) and
 * backend (validates incoming config keys, builds the real API client per provider).
 */
export type IntegrationProviderId = "jira" | "github" | "slack" | "teams" | "outlook" | "gmail";

export interface IntegrationFieldSpec {
  key: string;
  label: string;
  /** "password" fields are masked in the UI and never echoed back by the backend once saved. */
  type: "text" | "password";
  placeholder?: string;
  helpText?: string;
}

export interface IntegrationProviderSpec {
  id: IntegrationProviderId;
  displayName: string;
  description: string;
  color: string;
  fields: IntegrationFieldSpec[];
}

export const INTEGRATION_PROVIDERS: IntegrationProviderSpec[] = [
  {
    id: "jira",
    displayName: "Jira",
    description: "Syncs Jira issues into work items (W1 Jira Sync).",
    color: "#0052cc",
    fields: [
      { key: "baseUrl", label: "Site URL", type: "text", placeholder: "https://yourteam.atlassian.net" },
      { key: "email", label: "Email", type: "text", placeholder: "you@company.com" },
      { key: "apiToken", label: "API Token", type: "password" },
    ],
  },
  {
    id: "github",
    displayName: "GitHub",
    description: "Syncs repositories, issues and pull requests (W3 GitHub Sync).",
    color: "#24292e",
    fields: [
      { key: "token", label: "Personal Access Token", type: "password" },
      { key: "owner", label: "Organization / Owner", type: "text", placeholder: "octocat" },
      { key: "repo", label: "Repository", type: "text", placeholder: "hello-world" },
    ],
  },
  {
    id: "slack",
    displayName: "Slack",
    description: "Posts messages to a Slack channel from the Slack node.",
    color: "#4a154b",
    fields: [{ key: "botToken", label: "Bot User OAuth Token", type: "password", placeholder: "xoxb-..." }],
  },
  {
    id: "teams",
    displayName: "Microsoft Teams",
    description: "Posts messages to a Teams channel via an incoming webhook.",
    color: "#6264a7",
    fields: [
      {
        key: "webhookUrl",
        label: "Incoming Webhook URL",
        type: "password",
        placeholder: "https://...webhook.office.com/...",
      },
    ],
  },
  {
    id: "outlook",
    displayName: "Outlook",
    description: "Sends email through Microsoft Graph using an app (client-credentials) registration.",
    color: "#0078d4",
    fields: [
      { key: "tenantId", label: "Tenant ID", type: "text" },
      { key: "clientId", label: "Client ID", type: "text" },
      { key: "clientSecret", label: "Client Secret", type: "password" },
      { key: "senderUpn", label: "Sender mailbox (UPN)", type: "text", placeholder: "bot@company.com" },
    ],
  },
  {
    id: "gmail",
    displayName: "Gmail",
    description: "Sends email through the Gmail API using an OAuth2 refresh token.",
    color: "#ea4335",
    fields: [
      { key: "clientId", label: "OAuth Client ID", type: "text" },
      { key: "clientSecret", label: "OAuth Client Secret", type: "password" },
      { key: "refreshToken", label: "Refresh Token", type: "password" },
      { key: "fromEmail", label: "From Email", type: "text", placeholder: "you@gmail.com" },
    ],
  },
];

export function getIntegrationProvider(id: string): IntegrationProviderSpec | undefined {
  return INTEGRATION_PROVIDERS.find((p) => p.id === id);
}
