---
id: "031"
priority: medium
scope: sme-mart (app)
effort: small
found: 2026-05-22
status: resolved
resolved: 2026-05-22
promoted_to: null
---

> **RESOLVED 2026-05-22.** Added `e2e/tsconfig.json` (extends root, includes `e2e/**`, relaxes `noPropertyAccessFromIndexSignature` + `noImplicitOverride` — Angular-app strictness knobs that are noise for a Playwright suite) and an `e2e/**/*.ts` eslint override pointed at it, placed AFTER the `**/*.spec.ts` block so its `project` wins. Enabling lint surfaced + fixed 4 findings in 2 grandfathered files (unused `Locator` import + 2 dead `no-new-func` disable directives in `zb-autocomplete.ts`; unused `requestHeadersAfterSwitch` var + `any`-typed request handler in `org-switcher.spec.ts`). Verified: `eslint e2e/**/*.ts --max-warnings=0` exit 0; `tsc -p e2e/tsconfig.json --noEmit` exit 0; src spec gate (`tsconfig.spec.json`) unaffected. The deferred `e2e/specs/boards-pin-persistence.spec.ts` is now clean + committable.

# Wire e2e/** into the eslint config so Playwright specs are lintable and committable

`eslint.config.js` lints all `**/*.spec.ts` against `tsconfig.spec.json` (config lines 123-127), but `tsconfig.spec.json` only includes `src/**/*.spec.ts` (lines 11-13). So any `e2e/**` spec is type-linted against a project that doesn't include it and fails with a parse error. The 8 existing e2e specs (`e2e/specs/*.spec.ts`) are only grandfathered because the pre-commit hook is diff-based and hasn't re-linted them — any e2e spec touched in a diff trips the gate.

**Fix:** add a dedicated eslint override block for `e2e/**/*.spec.ts` pointed at an e2e-specific tsconfig (`e2e/tsconfig.json` including `e2e/**`). Do NOT use a blanket `e2e/**` ignore — that silences all e2e linting permanently. The proper override fixes all 8 existing specs and unblocks committing the preserved `e2e/specs/boards-pin-persistence.spec.ts` (authored in Phase 32 Wave 2, left uncommitted per Director ruling).

**Why now:** Surfaced during Phase 32 Boards Foundation close-out — the Wave 2 E2E spec could not be committed because of this gate. Recorded in `32-CLOSE-OUT.md`. Tech-debt / test-infra: blocks committing any new Playwright spec.
**Blocked by:** none
