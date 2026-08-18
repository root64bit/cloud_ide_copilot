# AUDIT MANIFEST — Cloud IDE Copilot

Audit/update date: 2026-08-17

This manifest describes the source in this handoff. It replaces older manifests that referred to the pre-Supabase/pre-Vercel-Sandbox scaffold.

## Project metadata

- Project: `cloud-ide-copilot`
- Production URL: `https://cloud-ide-copilot.vercel.app/`
- Framework: Next.js / React / TypeScript
- Package manager: npm (`package-lock.json`)
- Control-plane deployment target: Vercel
- Database/Auth: Supabase
- Workflow provider: Trigger.dev
- Coding agent: OpenHands Cloud
- LLM gateway: OpenRouter
- Sandbox provider: Vercel Sandbox
- Git provider: GitHub App
- Incident provider: Sentry

The audit ZIP excludes `.git`; branch/commit SHA cannot be independently derived from the archive itself.

## Truthful implementation status

| Capability | Status | Current source-backed reality |
|---|---|---|
| Supabase schema/migrations | `IMPLEMENTED` | Migrations through `00006_release_observation_hardening.sql` exist. |
| Runtime Supabase persistence | `IMPLEMENTED` | Runtime repositories use Supabase outside tests/explicit non-production mocks. |
| Supabase authentication | `IMPLEMENTED` | Cookie/Bearer identity is resolved server-side; no production fallback identity. |
| Multi-tenant RBAC | `IMPLEMENTED_FOUNDATION` | Privileged services resolve membership/permissions server-side. |
| Production mock fallbacks | `DISABLED` | Mock-provider opt-in is ignored in production; tests/non-production only. |
| GitHub App API/Git access | `IMPLEMENTED` | Short-lived installation tokens, repository verification, repair branch push, PR creation and human-authorized merge exist. |
| GitHub installation public-SaaS binding | `BLOCKER_FOR_PUBLIC_SAAS` | Private-MVP setup session exists, but secure GitHub user-authorization/OAuth binding to the platform organization is not complete. |
| GitHub webhook signature validation | `IMPLEMENTED` | Production fails closed when webhook secret is missing/invalid. Event persistence is still minimal. |
| OpenRouter | `IMPLEMENTED` | Real provider; fails closed outside tests when missing. |
| OpenHands Cloud | `IMPLEMENTED` | Real Cloud V1 client/conversation polling/git diff retrieval. Sensitive-file/secret-pattern repair artifacts are rejected. |
| Trigger.dev -> OpenHands | `IMPLEMENTED` | Real durable OpenHands repair task persists repair artifacts to Supabase. |
| Trigger.dev health | `IMPLEMENTED` | Direct verification script exists; HTTP health trigger is authenticated/permission-gated. |
| Vercel Sandbox | `IMPLEMENTED_PROVIDER` | Real `@vercel/sandbox` create/get/command/file/patch/stop/branch-push provider. Runtime smoke test still required in configured environment. |
| OpenHands -> Vercel Sandbox synchronization | `IMPLEMENTED` | Persisted OpenHands patch is applied with `git apply --check` before actual application. |
| Deterministic validation | `IMPLEMENTED_CONTROL_PLANE` | Real allowlisted install/test/lint/typecheck/build commands execute in Vercel Sandbox. Full live smoke test still required. |
| Long-running Trigger validation | `DEFERRED` | Validation currently runs from the authenticated Vercel control plane; Trigger task intentionally fails until external Sandbox credentials/machine policy are configured. |
| Repair branch + PR | `IMPLEMENTED` | Sandbox changes are committed/pushed to a protected `ai-repair/*` branch, then PR is created. |
| Vercel Preview observation | `IMPLEMENTED` | Real Preview is discovered by repair branch and persisted. |
| Human production approval | `IMPLEMENTED` | Merge requires an authorized human after validation + real ready Preview. |
| Production completion proof | `IMPLEMENTED` | Workspace completes only after READY Vercel production deployment for the exact GitHub merge SHA is observed. Observation resumes after reload. |
| Sentry persistence/mapping | `IMPLEMENTED_FOUNDATION` | Signed webhook + sanitization + explicit project mapping. Unknown project events fail closed. |
| Browser IDE / code-server | `NOT_IMPLEMENTED` | UI truthfully reports not wired. |
| Triple Audit engine | `NOT_IMPLEMENTED` | Playwright/Stagehand/OmniParser + deterministic evidence system remains next phase. |
| Multi-model audit consensus | `NOT_IMPLEMENTED` | Planned on top of OpenRouter. |
| Project memory / TencentDB Agent Memory | `DEFERRED` | Abstraction/planning only for production use. |
| Billing / M-Pesa | `NOT_IMPLEMENTED` | Planned commercial phase. |
| Public animated landing page | `NOT_IMPLEMENTED` | Planned commercial phase. |
| Vercel project mapping UX | `NOT_IMPLEMENTED` | Release observation requires each connected project to have a verified `vercel_project_id`; the current repository-connect screen does not yet map/select a Vercel project. |
| Customer-owned Vercel integration | `BLOCKER_FOR_PUBLIC_SAAS` | Current deployment discovery uses configured platform/team credentials; customer OAuth/integration install flow is not complete. |

## Security hardening in this handoff

- Trigger health route requires authenticated org integration-management permission.
- Trigger public access tokens are no longer returned by health/repair APIs.
- Incident diagnosis ignores client-supplied organization authority and authorizes using the persisted incident organization.
- GitHub project creation uses the verified HTTP-only installation session rather than accepting a client-supplied installation ID as authority.
- OpenHands changes to `.env`, private-key/credential files, or diffs matching known secret patterns are rejected before persistence.
- Git credentials are removed from Sandbox remotes after clone/push operations.
- Production mock mode is impossible through `ALLOW_MOCK_PROVIDERS`.
- Public `/api/health` is liveness only; it does not claim external providers are healthy.
- PR merge SHA is persisted and used as the exact authority for Vercel production observation.

## External setup required

See `SETUP_REQUIRED.md` and `.env.example`.

Database migrations must be applied through migration `00006` before this source is deployed.

## Verification status for this handoff

The uploaded source intentionally excluded dependencies. A single dependency installation attempt in the audit runtime did not complete, leaving an invalid partial `node_modules` tree. Therefore full runtime verification could not be truthfully completed here.

Verified in this audit environment:

```text
TYPESCRIPT_TSX_PARSE_SCAN=PASS (129 source files, 0 parse diagnostics)
VERIFY_SCRIPT_NODE_SYNTAX=PASS
DEMO_STRING_AUDIT=PASS_WITH_TEST_MOCK_EXCEPTIONS
TRIGGER_PUBLIC_ACCESS_TOKEN_EXPOSURE=0
```

Full TypeScript execution was attempted only after the incomplete dependency install and stopped on missing external type packages. That is recorded as `NOT_EXECUTED_WITH_VALID_DEPENDENCIES`, not as an application failure.

Required on the normal development machine/CI:

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run trigger:health
npm run openhands:health
```

Then perform one safe staging end-to-end repair through Sandbox -> validation -> PR -> Vercel Preview -> human merge -> exact production deployment observation.

## Remaining release blockers before commercial SaaS

1. Complete secure GitHub App installation binding using GitHub user authorization/OAuth and persist organization-level installation records.
2. Add a verified Vercel project mapping flow so each project has the correct `vercel_project_id` before release-gate use.
3. Implement customer-specific Vercel Integration/OAuth installation instead of relying on platform-team discovery credentials.
4. Run and record the full live provider path in staging with zero mock flags.
5. Add durable/scheduled Sandbox cleanup with an explicit machine-actor policy.
6. Add browser IDE with authenticated workspace URLs.
7. Implement Triple Audit and release-gate evidence.
8. Add subscription/usage metering and M-Pesa billing only after engineering/release gates are proven.

## Required production repair architecture

```text
Authenticated user
 -> Supabase tenant/RBAC
 -> Sentry incident / operator request
 -> OpenRouter diagnosis
 -> Trigger.dev durable OpenHands job
 -> OpenHands real code diff
 -> persisted repair artifact
 -> Vercel-hosted control plane
 -> Vercel Sandbox exact-commit clone
 -> git apply --check + patch
 -> real install/test/lint/typecheck/build
 -> GitHub App ai-repair branch + PR
 -> real Vercel Preview
 -> human approval
 -> GitHub merge SHA
 -> exact Vercel production deployment observation
 -> workspace completed
```

AI has no direct production deployment authority.
