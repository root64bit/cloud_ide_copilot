# Product Roadmap & Phasing

Strategic implementation roadmap for the AI Engineering Platform.

---

## Phase 1: MVP Core Foundation (Completed)
- [x] Multi-tenant Next.js 15 App Router architecture with strict TypeScript & Tailwind CSS.
- [x] Supabase multi-tenant PostgreSQL schema with RLS and immutable audit triggers.
- [x] Server-side RBAC engine (`owner`, `admin`, `engineer`, `viewer`).
- [x] GitHub App integration provider with short-lived tokens and protected branch guards.
- [x] Vercel Sandbox (`@vercel/sandbox`) isolated execution environment with command allowlisting.
- [x] Sentry signed webhook receiver with HMAC-SHA256 verification and sensitive data sanitization.
- [x] OpenRouter LLM gateway with structured Zod outputs (`IncidentDiagnosisSchema`, `RepairPlanSchema`, `RiskReviewSchema`).
- [x] OpenHands coding agent service boundary and automated patch applicator.
- [x] Automated validation gate (`install`, `test`, `lint`, `typecheck`, `build`).
- [x] Pull Request automation with Vercel preview environments.
- [x] Explicit human production approval gate.
- [x] Trigger.dev long-running task orchestration definitions.
- [x] Mobile-optimized responsive operational interface.
- [x] Comprehensive test suites (13 unit and integration test modules).

---

## Phase 2: Agent Memory & Deep Ecosystem Expansion
- [ ] Connect TencentDB Agent Memory behind `ProjectMemoryProvider` interface.
- [ ] Auto-index repository architecture, conventions, and previous bug fixes.
- [ ] Full bi-directional streaming terminal WebSocket bridge for advanced engineers.
- [ ] Multi-file side-by-side interactive Monaco diff editor.

---

## Phase 3: Commercial SaaS Features
- [ ] Stripe billing integration for usage-based sandbox compute minutes and AI tokens.
- [ ] SAML / SSO / Okta enterprise authentication.
- [ ] High-density self-hosted CubeSandbox provider option.
