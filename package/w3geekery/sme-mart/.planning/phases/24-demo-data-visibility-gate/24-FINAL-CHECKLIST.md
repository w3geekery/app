# Phase 24 Final Verification Checklist

**Phase:** 24 — Demo Data Visibility Gate
**Status:** PARTIAL CLOSE — Plans 01, 02, 03, 05 shipped; Plan 04 deferred to BACKLOG-104
**Verified:** 2026-05-18 (Plan 05 execution)

---

## Requirements Met

### DG-01 — Demo seeder populates `Object.tag` with demo UUID

- [x] `src/app/test-helpers/demo-data-seeder.ts` includes `tag` field on fixtures
- [x] `scripts/demo/helpers.ts` includes `tag` field on fixtures
- [x] Unit tests verify tag-field presence on seeded records (Plan 01 / Wave 1 — Seeder specs)

### DG-02 — Listing/search services filter OUT demo-tagged records for non-admin

- [x] 21 user-facing services inject `DemoVisibilityService` (Plan 03 / Wave 2)
- [x] Each service wraps list/search return paths with `applyVisibility()` — Option X client-side post-filter
- [x] Each touched GQL query includes `tag` in its field set (`graphql-read.service.ts` expands `tag` -> `tag { value }`)
- [x] **Regression guard:** NO new `.ne.` / `.not in.` GQL filters on `tag` (Decision-Probe-1 dead path)
  - Verified in `engagements.service.spec.ts` -> `[DG-02] does NOT add server-side tag negation filter`
- [x] Service specs verify post-filter is applied iff non-admin

### DG-03 — Admin retains full visibility

- [x] `ProjectContextService.isAdmin()` is a read-only Signal
- [x] `applyVisibility()` short-circuits when `admin === true` (returns input unchanged, including demo records)
- [x] Admin-scenario tests verify all records pass through
  - `demo-visibility.service.spec.ts` -> `should return all records unchanged for admin` + signal-flip test
  - `engagements.service.spec.ts` -> `[DG-03] admin sees all records including demo`

### DG-04 — Admin delete-demo action — **DEFERRED v1.5 (BACKLOG-104)**

- [ ] /admin/demo-data route registered — **DEFERRED v1.5 (BACKLOG-104)**
- [ ] AdminDemoDataComponent with MatDialog confirmation — **DEFERRED v1.5 (BACKLOG-104)**
- [ ] AdminDemoDataService with Phase 20 error handling — **DEFERRED v1.5 (BACKLOG-104)**
- [ ] Deletion invokes Pipeline.receive markDeleted on class-Objects — **DEFERRED v1.5 (BACKLOG-104)**
- [ ] NO hydra Resource API calls (HIGH-1 lock) — **DEFERRED v1.5 (BACKLOG-104)**

Brief at `.planning/phases/24-demo-data-visibility-gate/24-04-PLAN.md`. Re-promote when admin UI demand surfaces. Until then, ops uses MCP / SQL for any required cleanup.

### DG-05 — Unit tests cover gate scenarios

- [x] Admin-sees-demo test case exists (DemoVisibilityService + EngagementsService)
- [x] Non-admin-filtered test case exists (DemoVisibilityService + EngagementsService)
- [ ] Admin-delete test case exists — **DEFERRED with DG-04 (BACKLOG-104)**
- [x] All shipped tests pass (48/48 across the three spec files)

---

## Code Quality

- [x] `npx tsc -p tsconfig.app.json --noEmit` exits 0
- [x] `npx tsc -p tsconfig.spec.json --noEmit` exits 0
- [x] Targeted test run passes:
  `npx ng test --include='**/demo-visibility.service.spec.ts' --include='**/graphql-read.service.spec.ts' --include='**/engagements.service.spec.ts' --watch=false`
  -> **48/48 tests passing**
- [x] No `any` types, no unused imports, no `console.log` in Phase 24 production files
- [x] Angular 21 patterns enforced on touched files (`inject()`, `@if/@for`, `OnPush`, no `CommonModule`) — pre-commit + CI gates via Phase 27.5

---

## Files Modified (Wave Count)

- [x] Wave 0 (foundation): `demo-tags.ts`, `demo-visibility.service.ts`, test helpers, specs
- [x] Wave 1 (tag ingest): `demo-data-seeder.ts`, `scripts/demo/helpers.ts`, seeder specs
- [x] Wave 2 (filter injection): 21 services + 21 specs updated
- [ ] Wave 3 (admin delete): admin component, service, route registration — **DEFERRED v1.5 (BACKLOG-104)**
- [x] Wave 4 (verification): cross-scenario tests verified, lint compliance, documentation
  - `24-IMPLEMENTATION-NOTES.md`
  - `24-FINAL-CHECKLIST.md` (this file)
  - `24-PHASE-SUMMARY.md`

---

## Dependencies Documented

- [x] `24-IMPLEMENTATION-NOTES.md` documents the retroactive re-push dependency
- [x] Pre-existing demo records (`tag: null`) are NOT filtered until retroactive push runs
- [x] New demo records (`tag` populated) are filtered correctly at ingest
- [x] Retroactive push is a **separate director brief**, not a Phase 24 plan (TBD: `.planning/director/backlog/retroactive-demo-tag-push.md`)
- [x] Plan 04 deferral documented in BACKLOG-104

---

## Manual UAT Verification (Post-Deploy)

- [ ] Non-admin logs in: demo records NOT visible in any listing (only newly seeded post-Phase-24 records — pre-existing visible until retroactive push)
- [ ] Admin logs in: all records visible, including demo
- [ ] Admin tries /admin/demo-data — **expected 404 until BACKLOG-104 promoted**

---

## Ready for Next Phase

- [x] All shipped Phase 24 code committed
- [x] ROADMAP.md Phase 24 marked PARTIAL CLOSE
- [x] BACKLOG.md updated with BACKLOG-104 deferral entry
- [x] Next phase (Phase 25 or v1.5 planning) is unblocked
- [ ] Retroactive re-push brief authored — **out of scope for Plan 05, queued for v1.5 director planning**
