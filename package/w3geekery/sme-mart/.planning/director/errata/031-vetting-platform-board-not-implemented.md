---
id: "031"
severity: medium
phase: 29.5
found: 2026-05-12
status: deferred
---

# Errata 031 — Vetting `platform.Board` Lazy-Create Not Implemented (Plan 07 Premise Obsolete)

**Date:** 2026-05-12 (Wave 4 checkpoint, Plan 07 PREMISE-MISMATCH return)
**Severity:** Medium (architectural deferral; not a v1.4 blocker)
**Type:** Plan-vs-code mismatch (NOT a SME Mart defect, NOT a platform defect)
**Phase:** 29.5 (found); target v1.5+ (fix)

## What happened

Plan 07 (UAT Vetting Board Smoke) was authored before the Plan 02 v3 amendment landed. The plan was sized to verify a D-12-compliant vetting `platform.Board` (`boardType="list"`, `isDefault=false`, lazy-created on first vetting requirement) attached to the engagement Project, with a paired-task (γ) shape consuming `platform.Task` for the parent vetting task + buyer/provider subtasks.

Plan 07 executor empirically found:
- Zero `platform.Board` / `platform.Task` references in `src/app/core/services/vetting.service.ts`, `src/app/pages/engagements/tabs/vetting-tab.component.ts`, or `src/app/shared/components/vetting-item-dialog/`.
- Current vetting flow rides the LEGACY GQL `EngagementVettingItem` class:
  - **Read:** `vetting.service.listVettingItems(engagementId)` issues a GQL query against `EngagementVettingItem`.
  - **Write:** `vetting.service.{initializeVetting,createVettingItem}` issues `PipelineWriteService.pushEntities('EngagementVettingItem', ...)` (fire-and-forget Pipeline.receive).
- UAT artifact check: `platform.Board.list({projectId: 4617e9d7-...})` returns ONLY the auto-Board (`boardType="kanban"`, `isDefault=true`). No vetting `boardType="list"` Board exists.

## Root cause

D-12 (vetting Board lazy-create pattern) is a **forward-looking architectural decision** that was never implemented. The v3 amendment (commit `523e924`) was surgical — it dropped Step F (`ensureDefaultBoard`) entirely because the auto-Board from `platform.Project.create` covers the default-board case. It did NOT pull in D-12's vetting-Board work as part of the surgical scope (correctly).

Plan 07 was sized for an architecture that doesn't exist in code. Not a bug — a plan-vs-code premise mismatch.

## Impact

- **No Plan 07 SDK assertion can run** — the targets (vetting `platform.Board`, paired vetting Tasks) don't exist.
- **No v1.4 blocker.** Current vetting flow is functional at SDK (Pipeline.receive against `EngagementVettingItem` AuditgraphDB class) and UI (Vetting view renders legacy items).
- **v1.4 ships without platform-Board-backed vetting.** Phase 29.5's primary v1.4 deliverable (engagement + project-tier on `platform.Project`, with auto-Board + auto-Lead) IS fully validated by Plan 06. Vetting migration is independent of that.

## Fix prescription

**Director call: Option A — defer + backlog.**

1. **Plan 07 status:** PREMISE-OBSOLETE / DEFERRED. Plan 08 closure records this in CLOSURE.md.
2. **No code change in 29.5.** Legacy GQL vetting path continues to work.
3. **BACKLOG entry filed:** `VETTING-PLATFORM-MIGRATE-1` covering both:
   - (a) Migrate vetting items off GQL `EngagementVettingItem` → `platform.Task` (with `parentTaskId` for buyer/provider subtasks).
   - (b) Introduce the vetting `platform.Board` lazy-create per D-12.
4. **Supersedes:** Plan 08's pre-authored conditional `[VETTING-BOARD-RENDERING]` entry (Phase 32 conditional only-if-FAILED — broader scope than rendering, so replace with this entry).
5. **Target milestone:** v1.5 (or whenever vetting modernization gets prioritized; not v1.4).

**Options B and C explicitly rejected:**
- Option B (reframe Plan 07 to verify legacy GQL path) — normalizes legacy GQL as a long-term deliverable; contradicts D-08 / D-46 trajectory toward platform primitives.
- Option C (insert Plan 09 to IMPLEMENT vetting Board so Plan 07 can verify it) — pushes 29.5 timeline; medium-to-large scope; v1.4 demo doesn't need it.

## Disposition

- **Plan 07 = no code change.** Plan 08 closure marks it PREMISE-OBSOLETE in CLOSURE.md.
- **BACKLOG entry `VETTING-PLATFORM-MIGRATE-1`** is the carry-forward; supersedes the Plan-08-conditional `[VETTING-BOARD-RENDERING]`.
- **No 29.5 hotfix needed.** Current code is correct for the current architecture (legacy GQL).

## Related

- D-12 (vetting Board lazy-create pattern; forward-looking).
- D-08 / D-46 (everything moves to platform primitives over time).
- Plan 02 v3 amendment commit `523e924` (drops Step F; obsoleted Plan 07's premise).
- Plan 07 SUMMARY (`.planning/phases/29.5-platform-model-migration/29.5-07-SUMMARY.md`).
- BACKLOG entry: `VETTING-PLATFORM-MIGRATE-1` (v1.5+, supersedes conditional `[VETTING-BOARD-RENDERING]`).
