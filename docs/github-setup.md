# GitHub App Setup & Security Model

The platform uses a **GitHub App** rather than long-lived Personal Access Tokens.

## Current production URL

```text
https://cloud-ide-copilot.vercel.app
```

## App permissions

Use the minimum permissions required by the current workflow:

| Permission | Access | Purpose |
|---|---|---|
| Repository Contents | Read & Write | Clone, create repair branch commits, push repair branch |
| Pull Requests | Read & Write | Create repair PR and merge only after human approval |
| Checks | Read & Write | Future release/audit check reporting |
| Commit Statuses | Read | Observe existing status checks |
| Actions | Read | Observe workflow runs where needed |
| Metadata | Read | Repository discovery |

Do not grant organization, account, enterprise, secrets, Actions secrets, Codespaces, administration, or workflow-file write permissions unless a later feature proves they are necessary.

## URLs

Homepage:

```text
https://cloud-ide-copilot.vercel.app/
```

Current Setup URL:

```text
https://cloud-ide-copilot.vercel.app/api/integrations/github/setup
```

Webhook URL:

```text
https://cloud-ide-copilot.vercel.app/api/webhooks/github
```

The webhook route verifies `X-Hub-Signature-256` using `GITHUB_APP_WEBHOOK_SECRET` before processing payloads in production.

## Credentials

Store the following only in server-side Vercel environment variables:

```text
GITHUB_APP_ID
GITHUB_APP_CLIENT_ID
GITHUB_APP_PRIVATE_KEY
GITHUB_APP_WEBHOOK_SECRET
```

`GITHUB_APP_CLIENT_SECRET` is intentionally optional today and becomes required when the public-SaaS user authorization/OAuth installation-binding flow is implemented.

Never commit the downloaded `.pem` private key.

## Installation tokens

Repository API/Git operations use short-lived GitHub App installation tokens. The Vercel Sandbox clone flow temporarily uses the installation token as the HTTPS Git credential and then rewrites `origin` to a credential-free URL.

## Current private-MVP installation flow

1. Authenticated platform user installs/updates the GitHub App.
2. GitHub redirects to the Setup URL with `installation_id`.
3. The control plane verifies the GitHub App can list repositories for that installation.
4. The installation ID is stored briefly in an HTTP-only setup cookie.
5. The Connect Project screen lists only repositories accessible through that installation.
6. Creating a project re-verifies repository access and persists the installation reference with that project.

## Public SaaS blocker — must be completed before customer onboarding

The Setup URL `installation_id` alone is not sufficient proof that the currently signed-in platform user is the GitHub user/account that installed the app.

Before public SaaS onboarding:

1. Enable the appropriate GitHub user-authorization/OAuth flow for the GitHub App.
2. Correlate installation initiation using a cryptographically strong state value.
3. Validate the installation against the authorized GitHub user/account.
4. Persist an organization-level GitHub installation record.
5. Stop relying on a short-lived cookie as the durable installation relationship.
6. Add explicit disconnect/revoke/repository-added/repository-removed handling.

Do not market the current setup-cookie flow as a complete public-SaaS GitHub connector until this gate is closed.
