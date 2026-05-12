# Phase 30 — Default Project Board + "Coming Soon" Placeholder Surfaces

**Milestone:** v1.4 "3P Onboarding & Default Engagement"
**Est:** 6–8 hrs (including the 3 "Coming Soon" placeholder surfaces) — pending plan-time discovery validation; see "Estimate-Risk Discovery Flag" below.
**Repos:** `app/` (SME Mart frontend) only. No platform-side or schema-side changes.
**Origin:** 3P plan — users land on the default project surface after onboarding. DECISIONS.md "v1.4 Backlog Adds — 046/066/065 as Coming Soon Placeholders": three unfinished feature areas ship as disabled "Coming Soon" surfaces so the product feels complete without committing implementation effort.

**Brief revision history:**
- v1 (commit `b7f9b80`, pre-29.5) — assumed legacy `SmeMartProject` GQL discovery + pre-D-46 single-tier hierarchy. SUPERSEDED.
- v2 (this rewrite, 2026-05-12 LATE, post-29.5 closure) — aligns with the D-46/D-49/D-50 ratification triad. Engagement-as-Project hierarchy, depth-2 Project tier (NOT Workspace) as the work surface, dual-read consumption via Phase 29.5's `engagements.service`.

---

## Goal

A functional **default project surface** that authenticated, onboarded users land on at the `/projects` route slot reserved by Phase 27 Wave 3. The surface renders the user's default ZeroBias engagement and its depth-2 Project tier Project (D-34 locked name `"ZeroBias Platform"` for the ZB engagement) as the primary content. Three auxiliary surfaces — Org Documents, Engagement Dashboard, Message Center — render as clearly-labeled "Coming Soon" placeholders with honest copy, not half-built functional UI.

Phase 30 does NOT render a literal `platform.Board` UI primitive (Task lists, kanban columns, etc.). That's Phase 32+. Phase 30 = landing dashboard at `/projects` route.

---

## Architecture

### Hierarchy model (LOCKED — see DECISIONS.md D-46 / D-50)

Phase 29.5 ratified the canonical hierarchy:

```
depth 1: Engagement Project (FIXED, parentId=null, identity tag in sme-mart.engagement.* namespace)
depth 2: Project tier Project (FIXED, parentId=engagement.id, tag = sme-mart.tier.project)
depth 3+: Workspace / Aperture / Thread — NOT instantiated by v1.4; customer-extension via Hierarchy Editor
```

For the ZeroBias default engagement (every platform org has one — invariant maintained by Phase 27's lazy-on-load guard):
- **Depth 1 (Engagement Project):** name = `${orgName} <- ZeroBias` (D-32); description = `Platform Services Engagement: ZeroBias ➡️ ${orgName}` (D-33).
- **Depth 2 (Project tier):** name = `"ZeroBias Platform"` (D-34, CONSTANT); description per D-35 with org-name interpolation.

Phase 30 reads BOTH depths: engagement-level content for the header, project-tier-level content for the body.

### Discovery contracts (consumed inputs)

**Engagement discovery — consume `engagements.service` (Phase 29.5 dual-read).** `engagements.service.listEngagements()` was rewritten in Plan 29.5-03 to dual-read:
- Primary path: `platform.Project.list({ ownerId, parentId: null })` for top-level (depth 1) Engagement Projects.
- Fallback path: legacy GQL `Engagement` class.
- Union + dedup by tag identity.

For Phase 30, the "default ZB engagement" is the one whose tag matches the org's seeded engagement identity tag. Plan author MUST consume the dual-read service rather than re-issuing GQL or SDK queries directly. **If `engagements.service` lacks a `getDefaultEngagement(orgId)` helper**, plan should add one (small surface; reuses the existing dual-read path with an additional namespace-prefix filter `sme-mart.engagement.*` OR `sme-mart.eng.*`).

> **D-49 namespace note:** Plan 03 dual-read already returns BOTH new-namespace + legacy-namespace artifacts unioned, so Phase 30 inherits the dual-namespace handling transparently. Phase 30 itself does NOT need to probe by tag name — that's the engagements.service's responsibility.

**Project-tier (depth-2) discovery — NO existing helper as of 29.5 close.** Once the engagement is resolved, the Project tier child is queryable by:
```
platform.Project.list({ parentId: <engagement.id>, tagId: <sme-mart.tier.project tagId> })
```
v1.4 instantiates exactly ONE child at depth 2 (D-50). Plan author should:
1. Search for any existing helper that resolves "default project for an engagement" in `engagements.service`, `engagement-hierarchy.service.ts`, or `sme-mart-project.service.ts` (Phase 29.5 touched all three).
2. If a helper exists post-29.5: consume it.
3. If not: add `engagements.service.getProjectTierProject(engagementId)` as a Phase 30 task. Small surface; tag-filter UUID lives in the existing `SME_MART_TIER_PROJECT_TAG_ID` constant (verify via `grep -n SME_MART_TIER_PROJECT_TAG_ID src/app/core/services/`).

**Header content (engagement level):**
- name: render as-is from `engagement.name` (D-32-formatted by the provisioner; do not reformat).
- description: render as-is from `engagement.description` (D-33; includes the ➡️ emoji).

**Body content (Project tier level):**
- name: `project.name` (D-34 — for ZB engagement specifically this is the literal string `"ZeroBias Platform"`).
- description: `project.description` (D-35 — includes the ➡️ emoji + org name).
- Tasks / Board contents: **OUT OF SCOPE for Phase 30.** The depth-2 Project tier has an auto-Board (`"ZeroBias Platform Board"`, kanban, isDefault=true — Plan 06 verified), but rendering Tasks on a Board is Phase 32+ work.

### Estimate-Risk Discovery Flag (replaces pre-29.5 "SmeMartProject rendering" flag)

**The 6–8 hr estimate is conditional on:**
1. `engagements.service.getDefaultEngagement(orgId)` either exists OR is a single-task add (likely the latter; small).
2. `engagements.service.getProjectTierProject(engagementId)` is a single-task add (no existing helper as of 29.5 close).
3. A reusable "project detail dashboard" component pattern exists in SME Mart that can be parameterized for the depth-2 Project tier. **Plan author MUST search for: `project-detail`, `engagement-detail`, `sme-mart-project` component usages.** If reusable: estimate holds. **If NOT (net-new component required): surface as a plan-time blocker for Director re-scope.** Do not silently build a net-new ~400-line component as part of this phase.
4. Coming Soon placeholder pattern from Phase 27 (the existing `ComingSoon` component at `/projects` route slot, commit `3756443`) is reusable / consistent in styling — Phase 30 replaces that placeholder but should harmonize with the established visual language.

### Auto-Lead reminder (D-48 Mechanism Addendum — errata 033)

Per Plan 06 empirical verification, the authenticated user is already a Project Lead on BOTH the Engagement Project (depth 1) AND the Project tier (depth 2) at provisioning time (eager-materialize per Project, not lazy parent-chain resolution). Phase 30 does NOT need to add membership, check membership, or display a Lead badge. Routing in (Phase 27) already gates on org membership; Phase 30 inherits that gate.

### Deliverables

1. **Default project board route + component** (`src/app/projects/*` or `src/app/default-project-board/*` — match the route slot reserved by Phase 27 Wave 3 commit `3756443`).
   - Replaces the existing `ComingSoon` placeholder at that route.
   - MUST sit under `AppShell` so `onboardingGuard` continues to gate access.
   - Renders:
     - Engagement header (D-32 name + D-33 description; render as-is).
     - Project tier body (D-34 name + D-35 description; render as-is). Reuses existing project-detail rendering if available per Discovery Flag #3.
     - Three navigation/tab surfaces: Org Documents, Engagement Dashboard, Message Center.
   - NO tier display banner (deferred to v1.5 per DECISIONS.md "ServiceOfferings Defer With Brian").
   - NO Task / Board content (Phase 32+).

2. **3 "Coming Soon" placeholder surfaces** — each a standalone Angular component + route:
   - **046** — Org Documents (document management, sharing)
   - **066** — Engagement Dashboard (aggregated engagement metrics)
   - **065** — Message Center (cross-party messaging)
   - Each surface:
     - Disabled-looking styling (grey-out, subtle lock/clock iconography). `ZbEmptyStateContainerComponent` is the likely ngx-library fit.
     - Clear headline: `"Org Documents — Coming Soon"` (similar for 066 / 065).
     - 1–2 sentence paragraph explaining what the feature will do when available.
     - Optional "Notify me when ready" button — **toast-only for v1.4** (`MatSnackBar` "We'll let you know when this is ready"). NO Pipeline.receive / NO MarketplaceProfileItem tag-write. The tag-on-MPI variant adds complexity unjustified for placeholder surfaces.
     - Link back to the default project board.

3. **Navigation integration.** The 3 surfaces are reachable from the default project board (tabs / cards / sidebar — match existing SME Mart nav patterns). Deep-link to any surface outside the board renders the same placeholder, NOT a 404.

4. **Unit tests** for: default board renders with the seeded engagement + project tier content, 3 Coming Soon components render their placeholder content, navigation links resolve correctly. Touch-It-Fix-It modernization rules apply to all touched/new files per `.planning/docs/MODERNIZATION_GUIDE.md`.

---

## Requirements

- **PB-01:** Authenticated onboarded users land on `/projects` (the route slot reserved by Phase 27 Wave 3, commit `3756443`). Phase 30 replaces the placeholder `ComingSoon` component at that route with the full default project surface. Route MUST sit under `AppShell` so `onboardingGuard` continues to gate access.
- **PB-02:** Default project surface renders the user's default ZeroBias engagement (depth 1) AND its Project tier child (depth 2). Engagement header uses D-32/D-33 verbiage; Project tier body uses D-34/D-35 verbiage. Both consumed from `engagements.service` (Phase 29.5 dual-read).
- **PB-03:** 3 "Coming Soon" surfaces exist as components + routes (046 / 066 / 065), each with its own disabled-styled placeholder content.
- **PB-04:** Coming Soon surfaces are reachable from the board AND deep-linkable.
- **PB-06:** No half-built functional UI in the 3 Coming Soon surfaces — they are honest placeholders only.
- **PB-07:** Unit tests cover the board + each placeholder component's rendering.

**Removed from scope (see DECISIONS.md):**
- **PB-05:** Tier display banner — deferred until Brian confirms tier structure (DECISIONS.md "ServiceOfferings Defer With Brian"). NOT changed by D-46/D-49/D-50 ratification; tier-tag schema is internal, not user-visible.

---

## Dependencies

- **Phase 26** — seeded ZeroBias-as-provider content. Pre-29.5, this seeded `SmeMartProject` rows. Post-29.5, the canonical seed is the depth-2 Project tier Project (via `platform.Project.create` with `tagId=sme-mart.tier.project`). Phase 26's seed path may need a Touch-It-Fix-It update during Phase 30 IF the legacy SmeMartProject is what surfaces in `engagements.service` dual-read for ZB-default-seeded orgs. **Plan author should verify this empirically against UAT** (the W3Geekery org has both legacy `746010b7-...` AND new `4617e9d7-...` artifacts — Phase 30's discovery should preferentially resolve the new artifact).
- **Phase 27** — routing wire-up. `/projects` slot already reserved; `onboardingGuard` already gates access.
- **Phase 28** — onboarding-complete marker via `MarketplaceProfileService.getCompletionStatus()`. Phase 27 reads this; Phase 30 inherits.
- **Phase 29.5** — platform model migration COMPLETE 2026-05-12. Primitives available: `platform.Project` hierarchy (Engagement + Project tier), `engagements.service` dual-read, locked verbiage (D-32..D-35), tier tag (`sme-mart.tier.project`).
- **`ngx-library`** — `ZbEmptyStateContainerComponent` + `ZbSimplePanelComponent` likely building blocks for Coming Soon surfaces.

---

## Verification

- Log in as Clark (W3Geekery) on UAT → lands on `/projects`. Engagement header: `"W3Geekery <- ZeroBias"` + `"Platform Services Engagement: ZeroBias ➡️ W3Geekery"`. Body: `"ZeroBias Platform"` + D-35 description verbatim.
- Validates simultaneously with Plan 06 staged UI cross-check (3 steps in `29.5-06-SUMMARY.md`) — Phase 30 is the natural moment to run that cross-check.
- Click "Org Documents" → Coming Soon placeholder; navigate back to board works.
- Direct URL `/org-documents` (or whatever route slot lands) → same placeholder renders.
- Defensive: if the default engagement is missing for an org, fall back gracefully with `"Default engagement is missing, please contact support"` inline message. Phase 27's lazy-on-load guard should prevent this; defensive UX only.
- Defensive: if the Project tier child is missing (org has Engagement but no depth-2 child — should not happen post-Phase 26 + 29.5), fall back to "Project tier not yet provisioned" inline message. Surface for the plan author: this is the case errata 030's D-49-NAMESPACE-MIGRATE-1 indirectly prevents — Phase 31 reprovisioning will ensure depth-2 child exists for all orgs.

---

## Out of scope

- Real implementation of 046 (Org Documents) / 066 (Engagement Dashboard) / 065 (Message Center) — all v1.5+.
- Tier display banner / "this is a Free tier" / billing — deferred until Brian confirms tier structure.
- Real tier enforcement / billing / upgrade flow (v1.5+).
- Multi-engagement switching on the board (v1.5+; default engagement is the only scope for v1.4).
- Board / Task rendering (Phase 32+ work; depth-2 Project tier's auto-Board exists but no Tasks are surfaced in v1.4).
- Board customization / widget rearrangement (v1.5+).
- Hierarchy Editor (post-v1.4 design-track per RESUME parkit-7 open items; depth-3+ tier customization).
- D-49 namespace migration (`D-49-NAMESPACE-MIGRATE-1` in BACKLOG; Phase 31 hard prereq, NOT Phase 30 — Phase 30 inherits dual-namespace handling transparently from `engagements.service`).

---

## References

### Locked decisions (post-29.5)

- **D-32 / D-33** — Engagement name + description verbiage (`<orgName> <- ZeroBias` + `Platform Services Engagement: ZeroBias ➡️ <orgName>`).
- **D-34 / D-35** — Project tier name + description verbiage (`"ZeroBias Platform"` constant + D-35 description with org-name interpolation). Per D-50: these attach to the depth-2 PROJECT tier, NOT to Workspace.
- **D-46** — Hierarchy uses nested `platform.Project` for STRUCTURE + tags for tier NAMING. Both mechanisms operate together.
- **D-48 + Mechanism Addendum** (errata 033) — Project Lead is eager-materialized per Project at creation; Phase 30 needs no membership logic.
- **D-49** — Engagement tag namespace `sme-mart.engagement.*` (NEW; legacy `sme-mart.eng.*` coexists per D-43 anti-pattern (d)). Phase 30 inherits dual-namespace handling transparently from `engagements.service`.
- **D-50** — CANONICAL TIER MAPPING: depth 2 is the **Project** tier (FIXED, NOT Workspace). D-34/D-35 verbiage attaches HERE.

### Open errata (informational; not Phase 30 blockers)

- **errata 030** — D-49 namespace drift in `provisioner.service.ts` (Phase 31 hard prereq; doesn't block Phase 30 since Phase 30 doesn't probe by tag name).
- **errata 031** — vetting `platform.Board` not implemented; deferred to `VETTING-PLATFORM-MIGRATE-1` (v1.5+); unrelated to Phase 30.
- **errata 032** — `platform.Project.get` omits `parentId` for top-level Projects (Touch-It-Fix-It on next provisioner.spec edit; Phase 30 reads, doesn't get, so unaffected).

### Other context

- DECISIONS.md "v1.4 Backlog Adds — 046/066/065 as Coming Soon Placeholders" (the 3 surfaces).
- DECISIONS.md "ServiceOfferings Defer With Brian — Data-Model Brian Asks Block, Copy/Branding Don't" (2026-04-24 — why PB-05 tier banner is removed from Phase 30 scope).
- DECISIONS.md "v1.4 Phase 29 Deferred to v1.5" (display-layer concerns deferred broadly).
- BACKLOG.md entries 046 / 066 / 065 (full context for the deferred features).
- BACKLOG.md `D-49-NAMESPACE-MIGRATE-1` (Phase 31 prereq; Phase 30 explicitly does NOT depend on this).
- Plan 06 SUMMARY (`.planning/phases/29.5-platform-model-migration/29.5-06-SUMMARY.md`) — UAT-validated artifacts for W3Geekery; the W3Geekery engagement is Phase 30's primary verification target.
- Phase 27 Wave 3 commit `3756443` — locked `/projects` route slot + existing `ComingSoon` placeholder that Phase 30 replaces.
- `.planning/docs/MODERNIZATION_GUIDE.md` — Touch-It-Fix-It rules for all new/touched files in Phase 30.
- `ngx-library` public API — `ZbEmptyStateContainerComponent`, `ZbSimplePanelComponent` (Coming Soon surface building blocks per CLAUDE.md).

### Memory entries Phase 30 plan author should re-read

- `~/.claude/projects/.../memory/project_sme_mart_hierarchy_model.md` — canonical 7-tier hierarchy + tier tag schema + per-Project auto-behaviors.
- `~/.claude/projects/.../memory/project_sme_mart_admin_detection.md` — `getPrincipal().isAdmin` (in case Coming Soon surfaces need admin-gating; probably not for v1.4).
