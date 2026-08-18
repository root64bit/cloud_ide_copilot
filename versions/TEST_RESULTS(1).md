# Test Results — Hardening V2

## Environment

The uploaded audit ZIP did not include `node_modules`, as expected. A single `npm ci --no-audit --no-fund` installation attempt was made in the audit environment but did not complete successfully within the available execution window. The resulting partial `node_modules` tree is not considered a valid install.

Therefore this report does **not** claim full runtime validation of the new hardening revision.

## Checks performed

- JavaScript verification scripts were checked with Node syntax validation after updates.
- TypeScript/TSX source is subjected to a parser-only scan during packaging to catch syntax-class errors independent of dependency resolution.
- Production/demo string audit is performed before packaging.
- Final staging/archive is scanned for prohibited environment/private-key material.


## Audit-runtime checks actually completed

```text
TYPESCRIPT_TSX_PARSE_SCAN=PASS
TYPESCRIPT_TSX_FILES_SCANNED=129
TYPESCRIPT_TSX_PARSE_ERRORS=0
MJS_SCRIPT_SYNTAX=PASS
TARGETED_SECRET_PATTERN_SCAN=PASS_WITH_SYNTHETIC_TEST_FIXTURES_ONLY
REAL_SECRET_FILES_FOUND=0
```

The secret-pattern scan found only synthetic fixtures in unit tests (a fake RSA private-key block and fake Bearer values used to test redaction/signature behavior). No real `.env`, PEM/key, GitHub PAT, OpenRouter key, or Supabase secret-key material was found in the source tree scan.

## Checks still required on the user's normal development machine / CI

Run after a clean dependency install:

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

Then run provider smoke tests with configured third-party services:

```bash
npm run trigger:health
npm run openhands:health
npm run verify:trigger-openhands
```

## Status

```text
LATEST_SOURCE_RUNTIME_TESTS=NOT_EXECUTED
LATEST_TYPESCRIPT_FULL_CHECK=NOT_EXECUTED
LATEST_LINT=NOT_EXECUTED
LATEST_NEXT_BUILD=NOT_EXECUTED

REASON=Dependency installation did not complete in audit environment
```

Previous test results from an older revision must not be treated as proof for this hardened revision.
