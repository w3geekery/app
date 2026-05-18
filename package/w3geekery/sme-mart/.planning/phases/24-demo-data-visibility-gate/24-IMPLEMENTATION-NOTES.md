# Phase 24 — Implementation Notes

**Phase:** 24 — Demo Data Visibility Gate
**Status:** PARTIAL CLOSE (Plans 01-03 + 05; Plan 04 deferred to BACKLOG-104)
**Last updated:** 2026-05-18

This document captures architectural decisions, dependencies, and operational state that influence how the demo-visibility gate behaves in practice. Read this before debugging "why is demo data still visible?" or before scoping retroactive cleanup work.

---

## 1. Architecture: Option X (client-side post-filter)

The demo-visibility gate is a **client-side post-filter**, not a server-side query negation.

- **Predicate:** `DemoVisibilityService.isLocalDemoTagged(record)` returns `true` iff `record.tag` is a non-empty array containing at least one demo UUID (`DEMO_TAG_UUIDS.GLOBAL_DEMO` or `DEMO_TAG_UUIDS.LEGACY_W3GEEKERY`).
- **Application:** `DemoVisibilityService.applyVisibility(records)` short-circuits to return the input array unchanged when `isAdmin === true`; otherwise it filters out any record where `isLocalDemoTagged(record) === true`.
- **Integration:** 21 user-facing services were updated (Plan 03) to call `applyVisibility()` on the return path of every list/search method. Each service's GQL `query` field list was also expanded to include `tag` so the predicate can evaluate.

### Why not server-side `.ne.` / `.not in.` filter on tag?

Decision-Probe-1 (FAIL 2026-05-01) demonstrated that GQL boundary filters do not support negation of a multi-valued `Object.tag` field in a way that survives indexing and pagination. Any new code that adds a `.ne.` / `.not in.` filter on `tag` is a regression — regression guards exist in the service specs.

---

## 2. Pre-existing Demo Records (Retroactive Push Dependency)

Demo records seeded on UAT **before Phase 24 executed** do not have `Object.tag` populated — they have `tag: null` or `tag: []`. Under Option X, `tag: null` / `tag: []` records **PASS the post-filter** (visible to all users) because the predicate returns `false` for null/empty tag arrays.

This is by design: legitimate non-demo records also commonly have `tag: null`, and the gate cannot distinguish "pre-Phase-24 demo record" from "non-demo record" without retroactively tagging.

### Example

```
Pre-Phase-24 demo record:
  id:   'eng-001'
  name: 'Crystal Harbor'
  tag:  null              <- Object.tag never written

isLocalDemoTagged(record) -> false
Result:                   Record PASSES the gate (visible to non-admin users)
```

### Resolution: separate director brief

A separate director-authored brief (NOT a Phase 24 plan) will re-push existing demo records via `Pipeline.receive` with the `tag` field populated.

- **Brief location (TBD):** `.planning/director/backlog/retroactive-demo-tag-push.md`
- **Approach:** query all demo records (by `engagementTag = 'demo-seed'` or other existing discriminator), re-push via `Pipeline.receive` with `tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }]`, verify post-push that `tag` is populated.
- **Timing:** can run immediately after Phase 24 closes, or be deferred to a v1.5 cleanup.

### Until retroactive push runs

Non-admin users **still see pre-existing demo records** that lack the `Object.tag` field. This is expected interim state. The gate is fully effective for all **new** demo data seeded after Phase 24 ships.

---

## 3. Plan 04 Deferred to BACKLOG-104 (2026-05-18)

Plan 04 (Admin Delete-Demo UI — `/admin/demo-data` route + `MatDialog` confirmation + bulk `Pipeline.deleteEntities()` for demo-tagged class-Objects) was **deferred from v1.4** to BACKLOG-104.

**Why deferred:**

- The read-side filter (Plans 01-03) already gates non-admin views, which was the primary v1.4 goal.
- Admin demo deletion is currently manageable via MCP / SQL — no UI required for ops today.
- Brian's-Org orphan recovery (Phase 31-C) is the real "admin escape hatch" need this milestone, and that's already wired through the provisioner.

**When to re-promote BACKLOG-104:**

- Demo-data churn on UAT becomes burdensome enough that ops needs a UI.
- Another phase requires the deletion plumbing (e.g., a "delete this seed batch" feature).

**Files originally scoped (NOT created in v1.4):**

- `src/app/features/admin/demo-data.component.{ts,html,scss}`
- `src/app/features/admin/demo-data.service.ts`
- Route registration in `src/app/app.routes.ts` under the existing `/admin` lock

Plan brief preserved at `.planning/phases/24-demo-data-visibility-gate/24-04-PLAN.md`.

---

## 4. Test Coverage (DG-02 / DG-03 / DG-05)

Verified in Plan 05 execution (2026-05-18). All four required coverage points are present in shipped specs:

| Criterion | Spec file | Test |
|---|---|---|
| (a) Admin `applyVisibility()` returns input unchanged (incl. demo) | `demo-visibility.service.spec.ts` | `applyVisibility() > should return all records unchanged for admin` + signal-flip test |
| (b) Non-admin filters demo; `tag:null` / non-demo pass through | `demo-visibility.service.spec.ts` | `applyVisibility() > should filter out demo-tagged records for non-admin` (5-record fixture incl. `tag:null` and `tag:[]`) |
| (c) Regression guard: no `.ne.` / `.not in.` GQL filter on tag | `engagements.service.spec.ts` | `[DG-02] does NOT add server-side tag negation filter` |
| (d) GQL field set includes `tag` | `engagements.service.spec.ts` + `graphql-read.service.spec.ts` | `requests tag field in GQL query (fallback path only)` + `should expand 'tag' field into 'tag { value }'` |

Total: **48 tests passing** across 3 spec files (12 + 15 + 21).

DG-04 (admin delete) and the post-delete service-level test from Plan 05's original Scenario 3 are **deferred with Plan 04** to BACKLOG-104.

---

## 5. Phase 27.5 Lint Baseline

Phase 24 source files (constants, `DemoVisibilityService`, 21 updated services, specs) pass:

- `npx tsc -p tsconfig.app.json --noEmit` clean
- `npx tsc -p tsconfig.spec.json --noEmit` clean
- ESLint via pre-commit `lint-staged` and the diff-based `lint.yml` workflow (Phase 27.5 enforcement).

The Phase 27.5 lint gate is treated as the floor for any Phase 24 file touched after 2026-05-01.

---

## 6. Operational Recommendations

1. **Immediately after Phase 24 ships to UAT:** schedule the retroactive re-push brief (see §2) so the gate becomes fully effective on pre-existing demo seeds.
2. **Until BACKLOG-104 is promoted:** if a UAT admin needs to bulk-delete demo data, do it via MCP / direct SQL or by promoting BACKLOG-104.
3. **When adding new user-facing list/search services:** inject `DemoVisibilityService`, call `applyVisibility()` on the return path, and include `tag` in any GQL `query` field list. ESLint and the test pattern in `engagements.service.spec.ts` make these requirements verifiable.
4. **When debugging "demo data still visible":** check whether the record has `tag` populated. `tag: null` / `tag: []` records pass the gate by design — they need retroactive tagging, not gate fixes.
