# Phase 30: Default Project Board + Coming Soon Placeholders — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 30-default-project-board-coming-soon-placeholders
**Areas discussed:** Status decision (A), G1 default-surface composition, G2 helper placement, G3 rich Coming Soon component strategy, G4 navigation pattern, G5 defensive UX for missing depth-2 child, G6 stop-the-line policy, G7 verification scope
**Director:** Clark (Director Parks role; locks delivered verbatim in a single block)
**Mode:** plain-text (AskUserQuestion disallowed for this turn)

---

## A — Existing CONTEXT.md handling

| Option | Description | Selected |
|--------|-------------|----------|
| 1 | Rewrite from scratch — discard v1 (pre-29.5) CONTEXT framing entirely | ✓ |
| 2 | Update in place — keep file, mark old sections SUPERSEDED, append v2 | |

**Director's choice:** Rewrite from scratch.
**Notes:** Pre-v2 CONTEXT is wrong on too many axes (SmeMartProject framing, OnboardingBootstrapService probe pattern, pre-D-46 hierarchy). Patching with SUPERSEDED banners produces an unreadable doc. Clean v2 against the new brief.

---

## G1 — Default surface composition

| Option | Description | Selected |
|--------|-------------|----------|
| (a) | Resolve + redirect from `/projects` to `/project/:depth2Id/overview` (reuse ProjectDetail unchanged) | |
| (b) | Wrapper view + embed `ProjectDetail` (or its overview-tab body) inline; D-32..D-35 surface together | |
| (c) | Lightweight `default-project-board` component, NO ProjectDetail reuse | ✓ |

**Director's choice:** (c).
**Notes:**
- (a) loses the D-32/D-33 engagement header entirely (ProjectDetail has no concept of its parent engagement) → violates PB-02.
- (b) drags ProjectDetail into a "must-also-work-without-projId" refactor — the exact ~400-line risk Discovery Flag #3 flags.
- (c) keeps blast radius minimal; `ProjectDetail` at `/project/:projId/*` remains the rich workspace surface for navigation FROM the dashboard.
- Phase 30 is the dashboard/home view per brief User-flow context, not the rich project workspace.
- v1.5 follow-up captured in `<deferred>`: "fold board view into ProjectDetail reuse if dashboard surface evolves toward parity."

---

## G2 — Discovery helper placement

| Option | Description | Selected |
|--------|-------------|----------|
| (a) | Both helpers in `engagements.service.ts` (symmetric with `listEngagements`, dual-read inherited) | ✓ (via fallback) |
| (b) | `getDefaultEngagement` in engagements.service, `getProjectTierProject` in sme-mart-project.service | |
| (c) | Both in `engagement-hierarchy.service.ts` (conditional — verify the file's conceptual purpose first) | considered |

**Director's choice:** (c) conditional resolved to (a).
**Notes:**
- Conditional resolution executed at context time: `engagement-hierarchy.service.ts` was inspected and verified as a tag-prefix parser (Project→Boundary→Task tag conventions, `sme-mart.eng.*` / `sme-mart.proj.*` / `sme-mart.task.*`, `parseHierarchyLevel`, `stripPrefix`, `isProtectedTag`). It is NOT a parent-id depth resolver. Putting depth-1/depth-2 helpers there would conflate two unrelated hierarchy abstractions.
- Per director's conditional rule, fall back to (a) `engagements.service.ts`.
- Companion decision (non-controversial, in-scope): hoist `SME_MART_TIER_PROJECT_TAG_ID` from `platform-engagement-provisioner.service.ts:19` to new file `src/app/core/constants/tier-tags.ts`. Re-export from the provisioner to keep its existing import surface stable.

---

## G3 — Rich Coming Soon component strategy

| Option | Description | Selected |
|--------|-------------|----------|
| (a) | New `feature-coming-soon.component.ts` co-located with `default-project-board/`. Leave existing thin `ComingSoon` untouched. | ✓ |
| (b) | Enhance existing `ComingSoon` with optional `description` + notify-me via route-data | |

**Director's choice:** (a).
**Notes:**
- Signal-based inputs: `title`, `description`, `featureKey` (optional, reserved for future analytics; no v1.4 behavior).
- Existing thin `coming-soon.component.ts` stays in place untouched for whole-page-stub routes (`catalog`, `request-assistance`, `feedback`).
- Mixing the two invites scope drift.

---

## G4 — Navigation from dashboard to placeholders

| Option | Description | Selected |
|--------|-------------|----------|
| (a) | Material `mat-card` × 3 grid (icon + title + 1-line teaser per card) | ✓ |
| (b) | Sidebar entries | |
| (c) | Tabs alongside ProjectDetail tabs | |

**Director's choice:** Card grid.
**Notes:**
- Card click navigates to the placeholder route which renders the full `FeatureComingSoonComponent`.
- Deep-link parity required (direct URL renders the same placeholder).
- No new tab containers.

---

## G5 — Defensive UX for missing depth-2 child

| Option | Description | Selected |
|--------|-------------|----------|
| (a) | Inline `ZbEmptyStateContainerComponent` with copy + `console.warn`; NO auto-action | ✓ |
| (b) | Auto-trigger reprovisioning from the board on miss | |

**Director's choice:** (a).
**Notes:**
- Copy: "Project tier not yet provisioned. Please contact support."
- Log: `[DEFAULT_PROJECT_BOARD:MISSING_PROJECT_TIER]` for ops visibility.
- NO auto-reprovision — that's Phase 31 / `D-49-NAMESPACE-MIGRATE-1` territory and out of scope.
- Phase 30 must not paper over Phase 31's work.

---

## G6 — Stop-the-line rule (Discovery Flag #3)

| Option | Description | Selected |
|--------|-------------|----------|
| (a) | Reaffirm verbatim in CONTEXT.md; load-bearing for the planner agent | ✓ |
| (b) | Assume plan-checker catches it; do not reaffirm | |

**Director's choice:** (a).
**Notes:**
- Verbatim text in CONTEXT.md: "If Discovery Flag #3 fails (no reusable project-detail component pattern AND building default-project-board exceeds ~150 lines of new template/component code), plan author MUST surface as a plan-time blocker for Director re-scope. DO NOT silently build a net-new ~400-line component as part of this phase."
- Load-bearing for the planner, not just the plan-checker.
- Operational interpretation added to CONTEXT.md so the planner has a clear self-enforced circuit-breaker rather than relying on downstream gates.

---

## G7 — Verification scope

| Option | Description | Selected |
|--------|-------------|----------|
| (a) | D-32..D-35 verbiage checks ONLY as Phase 30 exit criterion | ✓ |
| (b) | Fold all of Plan 06's staged UI cross-checks into Phase 30 verification | |

**Director's choice:** (a) — verbiage subset only.
**Notes:**
- Exit criterion: on UAT (Clark @ W3Geekery), the rendered engagement header reads verbatim `"W3Geekery <- ZeroBias"` + `"Platform Services Engagement: ZeroBias ➡️ W3Geekery"` and the Project tier body reads verbatim `"ZeroBias Platform"` + D-35 description.
- Broader Plan 06 UI cross-check items (dual-read union surface, depth-2 reachability via navigation) get exercised organically during dogfooding (Phase 31). DO NOT double-book those as Phase 30 deliverables.
- Plan 06's staged checks stay owned by their original SUMMARY doc.

---

## Brief commit-pinning requirement (director directive)

CONTEXT.md MUST explicitly reference brief v2 commits `a529fa7` (initial v2 rewrite) and `bacd2c8` (addendum: User-flow context, no SME Mart signup, ZB-piggyback) so plan-phase loads the correct brief content and not any cached pre-v2 state. **Verified at write time** — both SHAs are pinned at the top of CONTEXT.md and in the canonical_refs section.

---

## Claude's Discretion (within director-locked frame)

- Exact directory placement for the new components (`src/app/default-project-board/` vs `src/app/pages/default-project-board/`) — verify against sibling-page inventory at plan time.
- Iconography choice (`schedule` vs `hourglass_empty` vs `lock_clock`) — keep consistent across the 3 placeholders.
- Route-data flow into `FeatureComingSoonComponent` (`ActivatedRoute.snapshot.data` reads in `ngOnInit` vs signal inputs from a parent when later embedded) — recommend route-data for v1.4.
- Whether the dashboard exposes an optional "Open project workspace" link to `/project/:depth2ProjectId/overview` — recommended.
- Lazy vs eager import for the board route in `app.routes.ts` — favor lazy if the board pulls in non-trivial sub-components.

---

## Deferred Ideas

- **046 / 066 / 065 real implementations** — v1.5+.
- **Tier display banner / billing / upgrade flow** — deferred until Brian confirms tier structure.
- **Notify-me persistence** (tag-on-MPI, Pipeline.receive call) — toast-only for v1.4. `featureKey` input reserved for future analytics; no v1.4 behavior.
- **Multi-engagement switcher** on the dashboard — v1.5+.
- **Tasks / Board UI** on the depth-2 Project tier — Phase 32+.
- **Auto-reprovisioning** on missing depth-2 child — Phase 31 / `D-49-NAMESPACE-MIGRATE-1`.
- **Fold dashboard into ProjectDetail-shared layout** — v1.5 follow-up if the dashboard evolves toward feature parity with the rich workspace.
- **Hierarchy Editor** — post-v1.4 design track per RESUME parkit-7 open items.
