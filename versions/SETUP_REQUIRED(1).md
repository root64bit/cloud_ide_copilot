# Setup Required — Hardening V2

## 1. Apply database migrations

Apply every migration in order through:

```text
supabase/migrations/00006_release_observation_hardening.sql
```

Migration 00006 adds the GitHub merge commit SHA used by the production observer and uniqueness constraints used by the release model.

## 2. Vercel application environment

Configure the variables documented in `.env.example`.

Required for the current real path include:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY

GITHUB_APP_ID
GITHUB_APP_CLIENT_ID
GITHUB_APP_PRIVATE_KEY
GITHUB_APP_WEBHOOK_SECRET

OPENROUTER_API_KEY
OPENHANDS_API_KEY
OPENHANDS_API_URL
TRIGGER_SECRET_KEY

SENTRY_WEBHOOK_SECRET
```

For Vercel deployment discovery in the current MVP also configure:

```text
VERCEL_TOKEN
VERCEL_TEAM_ID
VERCEL_PROJECT_ID
```

The Vercel-hosted control plane should use Vercel's deployment identity/OIDC for Vercel Sandbox. Do **not** manually create `VERCEL_OIDC_TOKEN` in Vercel.

## 3. Trigger.dev worker environment

The Trigger.dev deployment must receive the credentials it needs for the real worker path, including:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SECRET_KEY
OPENHANDS_API_KEY
OPENHANDS_API_URL
OPENHANDS_MODEL        # optional
```

The Trigger job persists the OpenHands result to Supabase. It does not directly control the Vercel Sandbox; the Vercel-hosted control plane applies the persisted patch.

Deploy tasks after configuring the Trigger.dev environment:

```bash
npm run trigger:deploy
```

## 4. GitHub App

The current private-MVP flow can use the existing installation setup session.

Before offering this as a public SaaS connector, implement and verify GitHub user authorization/OAuth so an installation can be securely bound to the authenticated platform user/organization instead of trusting the setup `installation_id` alone. Persist organization-level GitHub installation records rather than relying on the short-lived setup cookie.

## 5. Vercel project mapping and customer integration

The current deployment provider uses the configured Vercel platform/team token for deployment discovery. This is appropriate only for projects the configured account can access.

**Current blocker:** the repository connection screen does not yet select or verify the matching Vercel project. Before using the Preview/production release gate for a project, its persisted `projects.vercel_project_id` (and `vercel_team_id` when applicable) must point to the real Vercel project that deploys that repository. Do not guess or copy another project's ID.

For the private MVP, configure this mapping only through a trusted/admin path after verifying the Vercel project and Git repository relationship. Do not expose platform-team project enumeration to arbitrary tenants.

Before onboarding third-party SaaS customers, add a real Vercel Integration/OAuth installation flow and store the customer-specific provider installation reference securely.

## 6. Live verification

After dependencies are installed and all environments are configured, run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run trigger:health
npm run openhands:health
```

For the Trigger -> OpenHands verification, use a real persisted repair workspace and set:

```text
OPENHANDS_VERIFY_WORKSPACE_ID
OPENHANDS_VERIFY_ORGANIZATION_ID
OPENHANDS_VERIFY_PROJECT_ID
OPENHANDS_VERIFY_INCIDENT_ID
OPENHANDS_TEST_REPOSITORY=owner/repository
OPENHANDS_TEST_BRANCH=main
```

Then run:

```bash
npm run verify:trigger-openhands
```

Do not use production customer data for the first end-to-end repair test. Use a safe test/staging project and a controlled defect.
