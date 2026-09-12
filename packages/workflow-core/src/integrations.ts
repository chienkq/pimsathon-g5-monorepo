/**
 * Single source of truth for the "Integrations" setup screen (admin-ui) and the credential
 * config shape the backend stores/encrypts — see workflow-db's `credentials` table comment
 * ("surfaced on the Integrations screen (W6)"). Shared by admin-ui (renders the form) and
 * backend (validates incoming config keys, builds the real API client per provider).
 */
export type IntegrationProviderId = "jira" | "github" | "slack" | "teams" | "outlook" | "gmail" | "local-git";

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
  /** "git" providers (GitHub, Local Git) render under the Git Control settings section, source
   *  options for the work item Development tab's default. Everything else renders under the
   *  general Integrations section. */
  category: "git" | "general";
}

/** Which git backend the work item Development tab shows by default — set from Git Control. */
export type GitControlDefaultSource = "github" | "local-git";

export const GIT_CONTROL_PROVIDER_IDS: IntegrationProviderId[] = ["github", "local-git"];

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
    category: "general",
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
    category: "git",
  },
  {
    id: "slack",
    displayName: "Slack",
    description: "Posts messages to a Slack channel from the Slack node.",
    color: "#4a154b",
    fields: [{ key: "botToken", label: "Bot User OAuth Token", type: "password", placeholder: "xoxb-..." }],
    category: "general",
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
    category: "general",
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
    category: "general",
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
    category: "general",
  },
  {
    id: "local-git",
    displayName: "Local Git Folder",
    description:
      "Reads code from a local folder on the backend's machine, for testing GitHub-style code references (e.g. Work Item AI Notes) without a real GitHub connection.",
    color: "#6e7781",
    fields: [
      {
        key: "repoPath",
        label: "Repository path",
        type: "text",
        placeholder: "/home/you/code/my-repo",
        helpText: "Absolute path to a local folder (a git checkout) the backend process can read.",
      },
    ],
    category: "git",
  },
];

export function getIntegrationProvider(id: string): IntegrationProviderSpec | undefined {
  return INTEGRATION_PROVIDERS.find((p) => p.id === id);
}
