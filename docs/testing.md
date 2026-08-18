# Testing & Verification

## Local/CI quality pipeline

After a clean install:

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

Do not use older revision results as proof for a changed release.

## Provider smoke tests

With third-party environments configured:

```bash
npm run openhands:health
npm run trigger:health
npm run verify:trigger-openhands
```

The Trigger/OpenHands integration test must use a real persisted staging workspace and the environment identifiers documented in `docs/openhands-trigger-setup.md`.

## Deterministic release evidence

For a controlled staging defect, prove:

```text
workspace created at exact Git commit
repair artifact applied with git apply --check
install exit code = 0
test exit code = 0
lint exit code = 0
typecheck exit code = 0
build exit code = 0
repair branch pushed
PR created
Vercel Preview observed READY
human approval recorded
GitHub merge SHA recorded
matching Vercel Production deployment observed READY
workspace completed
```

## Current audit-environment limitation

The handoff ZIP excludes dependencies. During the latest external audit, dependency installation did not complete in time, so full test/typecheck/lint/build results for this exact revision are not claimed. A parser-only TypeScript/TSX scan is used only to catch syntax-class errors and is not a substitute for the real pipeline.

## Next test layer

Triple Audit will add:

```text
Playwright deterministic interaction
 -> Stagehand semantic fallback
 -> OmniParser visual fallback
 -> Playwright controlled action
 -> DOM/API/DB deterministic assertion
```

plus independent multi-model code/security/architecture review and a machine-readable release gate.
