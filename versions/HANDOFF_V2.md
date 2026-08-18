# Hardening V2 Handoff

This archive is intended to be applied to the local `cloud-ide-copilot` repository and then verified in the normal development/CI environment.

## Apply and verify

1. Back up the current local repository or create a Git branch.
2. Apply the ZIP contents (or inspect/apply the supplied patch).
3. Install dependencies from the lockfile:

```bash
npm ci
```

4. Apply Supabase migrations in order through:

```text
supabase/migrations/00006_release_observation_hardening.sql
```

5. Configure Vercel environment variables from `.env.example` and `SETUP_REQUIRED.md`. Never commit real secrets.
6. Configure the Trigger.dev worker environment and deploy tasks:

```bash
npm run trigger:deploy
```

7. Run the full quality pipeline:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

8. Run live provider smoke tests:

```bash
npm run trigger:health
npm run openhands:health
npm run verify:trigger-openhands
```

9. Before testing the release gate, verify that the connected project has the correct real Vercel project mapping (`vercel_project_id` / `vercel_team_id`). The current UI does not yet provide a safe public-SaaS Vercel selector.
10. Use a test/staging repository for the first complete run:

```text
incident/operator request
 -> Trigger.dev
 -> OpenHands Cloud
 -> persisted repair artifact
 -> Vercel Sandbox exact-commit clone
 -> deterministic validation
 -> GitHub ai-repair branch + PR
 -> real Vercel Preview
 -> human approval
 -> merge
 -> exact production deployment observation
```

## Do not enable commercially yet

The following remain release blockers for a public SaaS:

- GitHub installation ownership binding through GitHub user OAuth/state and durable organization installation records.
- Customer-owned Vercel Integration/OAuth plus verified Vercel project mapping.
- Browser IDE/code-server.
- Triple Audit (Playwright + Stagehand + OmniParser + deterministic evidence).
- Scheduled/machine-actor Sandbox cleanup policy.
- Usage metering/subscriptions/M-Pesa billing.

See `AUDIT_MANIFEST.md`, `SETUP_REQUIRED.md`, and `TEST_RESULTS.md` for the authoritative current status.
