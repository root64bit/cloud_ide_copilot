# Testing & Verification Strategy

The platform maintains comprehensive test suites covering security, authorization, state transitions, webhook verification, provider implementations, and end-to-end integration flows.

---

## 1. Running the Test Suite

```bash
# Run all tests once
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

---

## 2. Test Architecture

### 2.1 Security & Redaction Unit Tests (`tests/unit/security/`)
- `redaction.test.ts`: Verifies secret masking for Bearer tokens, JWTs, Stripe keys, GitHub tokens, Vercel keys, AWS keys, database connection URLs with passwords, RSA private keys, cookies, and JSON payloads.
- `allowlist.test.ts`: Verifies command resolution, rejection of dangerous binaries, rejection of shell metacharacters (`;`, `&&`, `|`, `` ` ``, `$(...)`, redirects, etc.), output truncation.
- `signature.test.ts`: Verifies Sentry HMAC-SHA256 signature verification, timing-safe equality, rejection of invalid signatures, and GitHub webhook signature validation.
- `branch-guard.test.ts`: Verifies production branch protection (rejection of direct pushes to main/master/production) and repair branch naming conventions.

### 2.2 RBAC & State Machine Tests (`tests/unit/rbac/`, `tests/unit/state-machine/`)
- `permissions.test.ts`: Verifies role level hierarchy (`owner > admin > engineer > viewer`) and permission matrix enforcement.
- `workspace-state.test.ts`: Verifies allowed vs disallowed state transitions, validation gate, and human approval gate.

### 2.3 Provider Tests (`tests/unit/providers/`, `tests/unit/memory/`)
- `sentry.test.ts`: Verifies Sentry webhook normalization and data sanitization.
- `openrouter.test.ts`: Verifies structured Zod schema parsing and model routing.
- `openhands.test.ts`: Verifies OpenHands coding agent patch proposals.
- `memory.test.ts`: Verifies organization/project memory scoping and search.

### 2.4 Integration Tests (`tests/integration/`)
- `tenant-isolation.test.ts`: Verifies that users from Org A cannot read, modify, or create resources in Org B.
- `validation-gate.test.ts`: Verifies the complete automated validation pipeline inside the sandbox, ensuring exit code 0 is strictly required.
- `pr-approval-flow.test.ts`: Verifies the end-to-end flow from AI Patch -> Validation -> PR Creation -> Human Production Approval -> Merge.
