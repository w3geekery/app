---
id: "044"
severity: high
phase: 33
found: 2026-07-01
status: open
---

# Errata 044 — the enforced gate (`tsc`-only) is blind to Angular templates; "green" ≠ build-green

**Filed by:** Director Parks (checkpoint mode, gsd-execute Wave-2 report)

## What happened
`.husky/pre-commit` (PRECOMMIT-TSC-GATE-1, errata 042) runs `tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.spec.json --noEmit`. **Neither type-checks Angular templates.** `strictTemplates` errors — bad bindings, property access on `.html` against a typed model — are only surfaced by the Angular compiler (AOT), i.e. `ng build`, not by `tsc`. So every "green" this phase passed while templates were broken, including Wave-1's commit `59afa7de`.

**Verified by Director:** `ng build` on `59afa7de` exits 1 with **10 errors** (all tagged `[plugin angular-compiler]` for the template ones):
- 7× TS2339 on `ProviderDetailView` (`avatar_url`, `display_name`, `total_jobs_completed`, `review_count`, `rating_average`) — `my-profile-overview.component.html`.
- 1× TS2554 (0-arg handler) — `service-catalog.component.html`.
- 2× `Could not resolve "node:events"` — dependency `@zerobias-org/util-connector` browser bundling (NOT Phase 33, NOT a template issue).

## Root cause
The verification standard — both the automated gate AND the Director's "trust the compiler" discipline — equated `tsc` clean with "builds." `tsc -p tsconfig.app.json` does not run the Angular AOT template compiler, so any template regression ships invisibly. This is the mechanism behind the latent template errors (the 8 in-app ones are the same incomplete-consumer-inventory class as errata 043 — a type was tightened without migrating every template consumer, and the gate couldn't catch it).

## Impact
- Wave-1 `59afa7de` is NOT build-green; the app does not `ng build`.
- Any template regression in this repo ships silently under the current gate.

## Fix
1. **Verification standard upgrade (Director):** at every wave/phase exit, assert **`ng build`** (AOT), not just `tsc`+`eslint`. "Green" means build-green. Applied immediately.
2. **Gate upgrade (recommended, route to Clark/Kevin):** add `ng build` (or an AOT template typecheck) to the **phase-exit gate + CI** — NOT to every pre-commit (`ng build` is too slow to run per-commit; pre-commit stays `tsc`+`eslint` for speed). CI (`.github/workflows/lint.yml` or a sibling build job) should run `ng build` so template regressions are caught before merge.
3. **In-scope remediation (this phase):** fix the 8 in-app template errors so Phase 33 closes build-green (see the channel ruling — mechanical remaps + hide the denormalized aggregate stats, which are backlog work).
4. **Separate item:** the 2 `node:events` errors are a pre-existing `util-connector` browser-bundling problem, independent of Phase 33. Tracked separately (see errata/backlog). Must be checked against the ACTUAL deploy build config (`build:uat`/`build:prod`), since bare `ng build` may differ from the deploy path — if the deploy build also fails on `node:events`, that's a deploy blocker (route to Kevin/platform).

## Relation
Sibling to errata 042 (the pre-commit tsc gate) and 043 (incomplete consumer inventory). Together: the gate is both too-strict-for-foundation-waves (042) AND too-blind-for-templates (044), and the inventory keeps scoping by concept not by the real edit/delete/type unit (043).
