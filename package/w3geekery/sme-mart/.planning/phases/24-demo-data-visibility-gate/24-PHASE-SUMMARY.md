# Phase 24 — Demo Data Visibility Gate — PHASE SUMMARY

**Status:** ✅ PARTIAL CLOSE — Plans 01, 02, 03, 05 shipped; Plan 04 deferred to BACKLOG-104
**Closed:** 2026-05-18
**Owner:** Clark (W3Geekery) + Director Parks (GSD orchestration)

---

## Outcome

Phase 24 delivered a working **client-side demo-visibility gate** (Option X) gating non-admin views in all 21 user-facing list/search services. The admin delete-demo UI (original Plan 04) was scoped out to BACKLOG-104 mid-milestone after the read-side gate proved sufficient for v1.4 and Brian's-Org orphan recovery (Phase 31-C) absorbed the only urgent "admin escape hatch" need.

The gate is fully effective for **new** demo data seeded after Phase 24 ships. Pre-existing demo records (`tag: null`) require a separate retroactive re-push brief (see `24-IMPLEMENTATION-NOTES.md` §2) — queued for v1.5 director planning.

---

## Plans Completed

| Plan | Wave | Scope | Outcome |
|---|---|---|---|
| 24-01 | 0 — Foundation | `DEMO_TAG_UUIDS` constants, `DemoVisibilityService`, mock helpers, 12-test spec | ✅ Shipped |
| 24-02 | 1 — Tag ingest | Seeder + `scripts/demo/helpers.ts` populate `Object.tag` on new fixtures | ✅ Shipped |
| 24-03 | 2 — Filter injection | 21 services inject `DemoVisibilityService` + call `applyVisibility()` on list/search returns; GQL `tag` field added to each touched query | ✅ Shipped |
| 24-04 | 3 — Admin delete-demo UI | `/admin/demo-data` route + `MatDialog` + bulk `Pipeline.deleteEntities()` | ⏸ DEFERRED to BACKLOG-104 (2026-05-18) |
| 24-05 | 4 — Verification + docs | Verified Plans 01-03 specs cover DG-02/DG-03/DG-05; lint/tsc baseline; docs | ✅ Shipped |

---

## Requirements Traceability

| Req | Status | Evidence |
|---|---|---|
| **DG-01** Demo seeder populates `Object.tag` | ✅ MET | Plan 02 — seeder + script updated; Wave 1 SUMMARY |
| **DG-02** Non-admin filters demo from list/search | ✅ MET | Plan 03 — 21 services + specs; regression guard on `.ne.`/`.not in.` verified |
| **DG-03** Admin retains full visibility | ✅ MET | `applyVisibility()` short-circuits on `isAdmin === true`; verified across specs |
| **DG-04** Admin delete-demo action | ⏸ DEFERRED | BACKLOG-104 — re-promote when ops demand surfaces |
| **DG-05** Unit tests cover gate scenarios | ✅ MET (read-side); ⏸ delete-side deferred with DG-04 | 48/48 tests passing across 3 spec files |

---

## Test Results

```
RUN  v4.0.18 — sme-mart
✓ src/app/core/services/demo-visibility.service.spec.ts  (12 tests)  14ms
✓ src/app/core/services/graphql-read.service.spec.ts     (15 tests)  16ms
✓ src/app/core/services/engagements.service.spec.ts      (21 tests) 226ms

Test Files  3 passed (3)
     Tests  48 passed (48)
  Duration  1.75s
```

**Coverage of DG-05 read-side criteria (Plan 05 verification):**
- (a) Admin bypass returns input unchanged ✅
- (b) Non-admin filters demo; `tag:null` / `tag:[]` / non-demo pass through ✅
- (c) Regression guard: no `.ne.` / `.not in.` GQL filters on `tag` ✅
- (d) GQL field set includes `tag` ✅

---

## Lint + Type Baseline (Phase 27.5 floor)

- `npx tsc -p tsconfig.app.json --noEmit` — clean (exit 0)
- `npx tsc -p tsconfig.spec.json --noEmit` — clean (exit 0)
- ESLint gates: pre-commit (`lint-staged`, diff-based, `--max-warnings=0`) + CI (`lint.yml`, diff-based)

Phase 24 files comply with the Phase 27.5 modernization rules at the time of close. Any future edit to these files is subject to Touch-It-Fix-It under the modernization guide.

---

## Files Modified (waves 0-4)

- **Wave 0:** `src/app/core/constants/demo-tags.ts`, `src/app/core/services/demo-visibility.service.{ts,spec.ts}`, `src/app/test-helpers/angular.ts`
- **Wave 1:** `src/app/test-helpers/demo-data-seeder.ts`, `scripts/demo/helpers.ts` + specs
- **Wave 2:** 21 user-facing services + 21 spec updates (see `24-03-WAVE-2-SUMMARY.md`)
- **Wave 4 (Plan 05):**
  - `.planning/phases/24-demo-data-visibility-gate/24-IMPLEMENTATION-NOTES.md` (new)
  - `.planning/phases/24-demo-data-visibility-gate/24-FINAL-CHECKLIST.md` (new)
  - `.planning/phases/24-demo-data-visibility-gate/24-PHASE-SUMMARY.md` (this file)

Wave 3 files (admin component / service / route) are **NOT** created in v1.4 — see BACKLOG-104.

---

## Manual UAT Verification — Required Next Steps

Plan 05 does not block on UAT verification. Recommended verification once deployed:

- [ ] Non-admin user sees production records only — newly seeded post-Phase-24 demo data filtered out
- [ ] Admin user sees all records (including demo)
- [ ] Pre-existing demo records (pre-Phase-24, `tag: null`) **still visible** to non-admin — expected until retroactive push runs

---

## Open Follow-Ups (queued for v1.5)

| Item | Where | Notes |
|---|---|---|
| Retroactive re-push of pre-Phase-24 demo records | TBD: `.planning/director/backlog/retroactive-demo-tag-push.md` | Director-authored brief; runs `Pipeline.receive` to populate `Object.tag` on legacy demo seeds |
| Admin Delete-Demo UI | BACKLOG-104 | Re-promote when demo-data churn on UAT becomes burdensome, or when another phase needs the deletion plumbing |
| Admin-delete service-level test | with BACKLOG-104 | DG-05 Scenario 3 ships when Plan 04 ships |

---

## Decisions / Architectural Notes (load-bearing)

1. **Option X (client-side post-filter) is canonical.** Decision-Probe-1 (FAIL 2026-05-01) ruled out server-side `.ne.` / `.not in.` filters on `tag`. All current and future demo-gate work must use the predicate + `applyVisibility()` pattern.
2. **`tag: null` / `tag: []` PASS the gate by design.** Distinguishing pre-Phase-24 demo records from legitimate non-demo records is not feasible without retroactive tagging.
3. **Admin = `ProjectContextService.isAdmin()` Signal.** Read-only, no caching, signal-flip honored mid-call.
4. **GQL `tag` field expansion** (`tag` -> `tag { value }`) lives in `GraphqlReadService.query`. Services consuming the read service only need to list `tag` in fields; the read service handles selection-set rewriting.

---

## Phase Lifecycle

- **Started:** 2026-04-30 (24-01-PLAN.md)
- **Plans 01-03 shipped:** 2026-05-01 through 2026-05-05
- **Plan 04 deferred:** 2026-05-18 (BACKLOG-104)
- **Plan 05 verification complete:** 2026-05-18

Phase 24 is **closed** for v1.4 purposes. Outstanding items (retroactive push, admin UI) carry forward to v1.5.
