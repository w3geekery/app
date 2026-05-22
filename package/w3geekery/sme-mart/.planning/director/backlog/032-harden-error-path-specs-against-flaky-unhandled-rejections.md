---
id: "032"
priority: medium
scope: sme-mart (app)
effort: small
found: 2026-05-22
status: open
promoted_to: null
---

# Harden error-path specs against flaky unhandled rejections (pre-push gate flake)

The pre-push hook (`.husky/pre-push` runs the full Vitest suite) intermittently fails with **"3 errors"** even though all 1828 tests pass. The errors are non-deterministic **unhandled promise rejections** leaking from negative-path specs — tests named like "should handle errors gracefully" / "should handle errors without crashing" that drive a service to reject (e.g. `engagement-list`, `rfp-list`, `project-list`, `document-share-dialog`, `document-upload` `.component.spec.ts`). The component logs the error via `console.error` (expected), but the rejected promise occasionally settles **after** the test's assertion window, so Vitest tallies it as an unhandled error and the run exits non-zero. An immediate re-run is clean — pure timing flake.

**Impact:** intermittently blocks `git push` on `poc/sme-mart` for no real reason; tempts a `--no-verify` bypass (which is banned without authorization). Cost one false push failure on 2026-05-22.

**Fix direction:** in the affected error-path tests, `await` the operation's settling (or flush microtasks / `await fixture.whenStable()`) and assert on the caught state, so the rejection is consumed within the test rather than escaping to the runner. Audit the negative-path specs for fire-and-forget calls that reject. Optionally add a Vitest config guard if a deterministic global handler is warranted.

**Why now:** surfaced 2026-05-22 while pushing the Vercel-removal commit — the gate flaked on these 3 rejections, then passed clean on re-run.
**Blocked by:** none
