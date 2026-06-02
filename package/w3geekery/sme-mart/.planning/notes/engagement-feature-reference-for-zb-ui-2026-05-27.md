# Engagement Feature Reference for zb/ui Projects App

> ## ⚠️ SUPERSEDED 2026-06-01 — prior art relocated; do not use as a live source
> The durable value of this doc — the **current-7-tab Engagement-detail feature set** (Overview / Projects / Documents / Boards / Vetting / Timeline / Notes) as prior-art reference for the Projects App Engagement views — has been **captured into zb/ui's memory**, correctly framed, by ui-meta-director:
> **`zerobias/ui/sme-mart-engagement-detail-prior-art-current-7-tab-reference-for-projects-app-engagement-views`** (memex). It carries the feature set + lift notes.
>
> **The data-model framing throughout THIS file is superseded.** Engagement is NOT a depth-0 `platform.Project` / a tier. Per **DECISIONS D-52**, Engagement is a **node-ROLE** on a standalone `project`-tier node that **governs** a `project`-rooted tree via the **`governs` ResourceLink** (RL-001/task-13) — not via `parentId`. The "canonical 7-tier" vocabulary below is likewise retired (see `[[project_sme_mart_hierarchy_model]]` / D-52).
>
> This file is retained only as a dated historical artifact. Authoritative now: the zb/ui memex note above (feature set) + D-52 (data model). Neither repo carries a stale source.

**Date:** 2026-05-27
**Author:** Director Parks (SME Mart side)
**Audience:** ui-meta-director (zb/ui Claude session, Projects App scope)
**Purpose:** Domain transfer for SME Mart's Engagement chrome since you're inheriting Engagement-detail ownership per the 2026-05-27 SME-Mart-scope-reduction pivot. This doc preserves the prior art so your Projects App Engagement-detail planning isn't restarted from scratch.
**Read with:** the [scope-reduction pivot brief](../director/sme-mart-scope-reduction-pivot-2026-05-27.md) for the architectural context.

---

## TL;DR

SME Mart built a working Engagement-detail surface over Phases 18-32, with 7 tabs (Overview / Projects / Documents / Boards / Vetting / Timeline / Notes), 8+ engagement-specific services, and a provisioner that creates Engagements as depth-0 `platform.Project` rows. Per the 2026-05-27 pivot, **all of this Engagement chrome migrates to Projects App ownership**. SME Mart enters maintenance mode (bug fixes only) until Projects App ships its Engagement-detail equivalent; then SME Mart deprecates `/engagements/:id/*` routes entirely. Use this doc to plan your inheritance — what to lift, what to redesign, what was wrong, what to leave behind.

---

## The Engagement entity in SME Mart

### Data model

**An Engagement is a `platform.Project` at depth-0 (parentId=null).** No separate Engagement entity class survives — the legacy `Engagement` GQL class was deprecated in Phase 29.5 (2026-05-08) when SME Mart migrated to use `platform.Project` directly. Same row, different rendering vocabulary.

**Canonical 7-tier vocabulary stack** (Brian/Kevin/Nic-approved, captured in memex `canonical-projects-vocabulary-stack-engagement-project-middle-tiers-task`):

```
Engagement              [FIXED role, depth 0]      ← what this doc covers
  Project               [FIXED role, depth 1]
    Workspace           [FLEXIBLE label, depth 2]  (default middle tier 1)
      Aperture          [FLEXIBLE label, depth 3]  (default middle tier 2)
        Thread          [FLEXIBLE label, depth 4]  (default middle tier 3)
          Task          [FIXED, atomic]
            Sub-Task    [FIXED]
```

Every tier is the same `platform.Project` class with `parentId` chain. Engagement is depth-0; everything else is descendant.

### Engagement-specific properties

- **`parentId: null`** — Engagement is always top-level.
- **`ownerId = buyerOrgId`** — Engagement is buyer-anchored (D-locked in Phase 29.5).
- **`status: 'active'`** (always), **`visibility: 'internal'`** (always), **`membershipPolicy: 'private'`** (always) — locked enum values per Phase 29.5 brief.
- **`tagId`** — engagement identity tag. Naming convention: `sme-mart.eng.<supply-to-demand>` (D-49 namespace).

### D-51 display verbiage (current — provider/client labels)

Locked 2026-05-15 (DECISIONS.md D-51, supersedes D-32/D-33/D-35). Engagement display strings dropped ASCII arrows and adopted corporate-prose phrasing:

- **name:** `Engagement with provider ZeroBias Platform` (constant — orgName dropped; rendered in owner-org context so orgName is implicit)
- **description:** `Platform services engagement provided by ZeroBias Platform for ${orgName}.` (trailing period, full sentence)
- **Vocabulary lock:** `provider` (supply side, formerly "supplier") + `client` (demand side, formerly "customer"). Symmetric asymmetry — each side uses the other's professional-services-native term.

Two UAT seed engagements use this convention: `Brian Hierholzer Inc.` Engagement (UUID `551f7ca6-d89d-4508-aac0-0e8bd8d4e17e`) and `W3Geekery` Engagement (UUID `4617e9d7-b7b4-4679-be43-10fc4140295c`).

**This is a SME-Mart-side display convention.** When you inherit Engagement chrome, decide whether to keep this verbiage or canonicalize differently. If you keep, the strings live in the provisioner (see Services section below).

---

## Routes

Top-level under `app.routes.ts`:

```
/engagements                              → engagement-list.component
/engagements/new                          → engagement-new.component
/engagements/:id                          → engagement-detail.component (shell)
/engagements/:id/overview                 → OverviewTab
/engagements/:id/projects                 → ProjectList (depth-1 Projects under this engagement)
/engagements/:id/documents                → DocumentsTab
/engagements/:id/boards                   → EngagementBoardsTabComponent
/engagements/:id/vetting                  → VettingTab (DEPRECATED — Phase 32 converted Vetting to a Board)
/engagements/:id/timeline                 → TimelineTab
/engagements/:id/notes                    → NotesTab (sunset alongside Engagement-detail per Notes ownership transfer to your scope)
/engagements/:id/edit                     → engagement-edit.component
/engagements/:id/details                  → redirects to /overview (deprecated 2026-05-15)
```

Engagement-list route file: `src/app/pages/engagements/engagement.routes.ts`.

The same `ENGAGEMENT_TAB_ROUTES` array is reused by `/rfps/:id` and `/engagements/:id` for tab consistency (RFP becomes Engagement on bid acceptance per BACKLOG-099 lifecycle).

---

## Current tab strip

Declared in `src/app/pages/engagements/engagement-detail.component.ts` (TABS constant, lines 22-30):

| Path | Label | Component | Status |
|---|---|---|---|
| `overview` | Overview | `overview-tab.component.ts` | Active |
| `projects` | Projects | `project-list.component` (reuses depth-1 Project list) | Active |
| `documents` | Documents | `documents-tab.component.ts` | Active (limited functionality) |
| `boards` | Boards | `boards-tab.component.ts` | Active (Phase 32 SHIPPED 2026-05-22) |
| `vetting` | Vetting | `vetting-tab.component.ts` | **DEPRECATED** — Phase 32 spec converted Vetting to a Board; this tab persists for the dual-read window |
| `timeline` | Timeline | `timeline-tab.component.ts` | Active |
| `notes` | Notes | `notes-tab.component.ts` | **Sunset alongside Engagement-detail** per Notes-feature ownership transfer to your scope (2026-05-27 Tell-block) |

**Per the 2026-05-27 huddle reframe**, your eventual Projects App Engagement-detail tab strip will likely be (per zb/ui INTENT §2.8 + my earlier analysis):
- `Overview · Readiness · Requirements · Boards · Tasks · Members · Roles · Boundaries · Documents · Activities`

So significant tab-set delta. The SME Mart strip above is the OLD model; your strip is the NEW post-Brian-huddle model. Don't lift the SME Mart tab strip wholesale.

---

## Components per tab (paths to read for patterns)

### Engagement shell

- `src/app/pages/engagements/engagement-detail.component.ts` / `.html` / `.scss` — tab strip, header, breadcrumbs, status chips, action menu. **Useful patterns:** `PageBreadcrumbComponent` integration, `HierarchyBreadcrumbsComponent` for the depth-aware breadcrumb chain, `ZbResourceStatusComponent` for status rendering.
- `src/app/pages/engagements/engagement-list.component.ts` — list page with status filter, search, create button. Uses `zb-remote-table`.
- `src/app/pages/engagements/engagement-new.component.ts` — Create Engagement flow.
- `src/app/pages/engagements/engagement-edit.component.ts` — Edit Engagement.

### Per-tab components

- **Overview** — `tabs/overview-tab.component.ts` / `.html`. Shows engagement summary card, hierarchy breadcrumbs, integration status, key metadata. Recently trimmed (Phase 31-C) — duplicate Tag row removed, status moved to `zb-resource-status` component.
- **Boards** — `tabs/boards-tab.component.ts` / `.html` / `.scss`. Phase 32 deliverable. Card grid with pin-to-expand (inline preview), drill-to-detail. Cards backed by `platform.Board` query. **Highly lift-worthy** for Projects App Boards tab — same conceptual surface.
- **Tasks (legacy)** — `tabs/tasks-tab.component.ts` / `.html`. Replaced by Boards tab. Still exists in tree but route was removed in Phase 32. Don't lift.
- **Vetting (deprecated)** — `tabs/vetting-tab.component.ts` / `.html` / `.scss`. Buyer + provider requirement checklist with MPI-suggestion-panel attachment workflow. Drives the legacy `EngagementVettingItem` flow. **Don't lift** — Phase 32 converted Vetting to a Board; BACKLOG-108 has the LOCKED "Option 5-prime" shape (depth-3 Vetting Project + template-driven Board layout) for what replaces this.
- **Vetting suggestion panel** — `tabs/vetting-suggestion-panel.component.ts`. Sub-component that lists MPI rows for the vendor org and offers attach-to-vetting-item. Pattern worth knowing because it shows the org-side MPI → engagement-side reference flow.
- **Timeline** — `tabs/timeline-tab.component.ts`. Engagement-scoped activity timeline. Useful pattern reference for any timeline view in Projects App.
- **Notes** — `tabs/notes-tab.component.ts`. Trivial wrapper around `<app-notes-panel>` from the shared components family. Sunset per Notes domain transfer.
- **Documents** — `tabs/documents-tab.component.ts`. Limited functionality (placeholder-ish).

---

## Engagement-specific services

All under `src/app/core/services/`:

| Service | Purpose | Lift-worthy? |
|---|---|---|
| `engagements.service.ts` | Read API — `listEngagements`, `getEngagement(id)`, `searchEngagements(filter)`, `createEngagement`, `updateEngagement`, `cancelEngagement`, `completeEngagement`, `getDefaultEngagement(orgId)`, `getProjectTierProject(engagementId)`. **READ THIS FIRST** when planning your Projects App engagement queries. | Read-pattern yes; specifics depend on whether you use the same dual-read (GQL primary + Pipeline fallback) architecture |
| `engagement-context.service.ts` | Per-route engagement state holder — current engagement signal, current user, current provider, refresh trigger. Pattern: signal-based reactive state at route scope. | Pattern yes — useful for any Engagement-detail shell |
| `engagement-hierarchy.service.ts` | Hierarchy tag operations — `parseLevel`, `parseTag`, `isProjectTag`, `isBoundaryTag`, `generateProjectTag`, `tagResource`, `getResourceTags`, `getResourceHierarchyTags`. Bridges hydra Tag API with engagement's tier-as-tag convention. | Reusable, but depends on tier-as-tag-vs-tagId decision (zb/ui standup Q1) |
| `engagement-lifecycle.service.ts` | Lifecycle state transitions, status validation. | Pattern yes |
| `engagement-tasks.service.ts` | Task aggregation across an engagement (cross-project rollup queries). | Pattern useful for any cross-project task view |
| `engagement-timeline.service.ts` | Timeline data fetching for the Timeline tab. | Domain-specific |
| `platform-engagement-provisioner.service.ts` | **Critical** — creates Engagements as depth-0 `platform.Project` rows + auto-default Board + seed tasks + Vetting Project setup + tag resources. This is THE Engagement-creation entry point. **READ THIS** before designing Engagement creation in Projects App. Contains the D-51 verbiage constants at top of file. | Yes — pattern (and possibly the constants); the provisioning IS Engagement formation |

Plus shared infrastructure services:
- `graphql-read.service.ts` — generic GQL read layer (used by every read above)
- `pipeline-write.service.ts` — `Pipeline.receive` write layer with telemetry + error contract
- `project-context.service.ts` — admin signal (`isAdmin()`) + project context
- `sme-mart-tag.service.ts` — SME Mart tag CRUD
- `user-preferences.service.ts` — PKV-primary preferences (Phase 32)

---

## Schema entities

Current state in `~/Projects/w3geekery/zb-forks/org/schema/package/w3geekery/smemart/classes/`:

| Class | Status | Notes |
|---|---|---|
| `Engagement.yml` | **DEPRECATED** (Phase 29.5) | Legacy custom GQL class. Use `platform.Project` (parentId=null, ownerId=buyerOrgId, tagId for identity) instead. Retained during dual-read window (Phases 29.5-31); delete deferred to post-closure (backlog SCHEMA-RETIREMENT-DELETE-1). |
| `SmeMartProject.yml` | **DEPRECATED** (Phase 29.5) | Same — use `platform.Project` directly. |
| `EngagementVettingItem.yml` | **DEPRECATED** (Phase 29.5) | Replacement: paired `platform.Task` on a Vetting Board (boardType='list'). Dual-read window; delete deferred. |
| `Bid.yml` | Active | Vendor bid on an RFP — links to `engagement` via `parentId` chain since RFP is now a Project too |
| `BidResponse.yml` | Active | Bid response items |
| `Review.yml` | Active | Post-engagement provider rating |
| `ServiceOffering.yml` | Active | Provider catalog listing (standalone, not engagement-bound) |
| `Note.yml` / `NoteFolder.yml` | **Sunsetting** | Will sunset alongside Engagement-detail per Notes ownership transfer to your scope |
| `MarketplaceProfileItem.yml` | Active | Vendor profile (insurance/attestation/personnel/etc.) — pure org-scoped, no engagement linkage |
| `SmeMartTask.yml` | Active | SME Mart custom Task class (predates Phase 29.5 platform.Task migration) |
| `SmeMartBoard.yml` | Active | SME Mart custom Board class (predates platform.Board migration) |
| `SmeMartActivity.yml` | Active | SME Mart custom Activity |
| `PlanMilestone.yml` | Active | Plan milestone |
| `ProjectPlan.yml` | Active | Project plan |
| `ProjectPrd.yml` | Active | Project PRD |
| `DocumentTemplate.yml` | Active | Document template |
| `SmeMartWorkflow.yml` | Active | Workflow definitions |
| `FormSubmission.yml` | Active | Form submissions |
| `RfpInvitation.yml` | Active | RFP invitations |
| `SecurityCredential.yml` / `UserCredential.yml` | Active | Credential tracking |

**For Projects App's purposes:** the platform side has `platform.Project` (canonical), `platform.Board`, `platform.Task`. You don't need to consume the deprecated `Engagement` / `SmeMartProject` / `EngagementVettingItem` SME Mart classes. The Active SME Mart classes (Bid, MPI, Note, ServiceOffering, etc.) are SME-Mart-matchmaking-scoped and remain ours.

---

## Phases that shipped Engagement chrome (timeline summary)

Roughly chronological, with Engagement-relevant deliverables:

| Phase | What shipped | Engagement relevance |
|---|---|---|
| **Phase 13** | Pilot Projects | RFP/Pilot/Project lifecycle, lays SmeMartProject groundwork |
| **Phase 14** | Invitation Controls | RFP invitation workflow |
| **Phase 15** | Document Templates | Document templates used in engagement context |
| **Phase 16** | Form Builder | Form-builder for RFP/engagement forms |
| **Phase 17** | Demo Seed Scripts | Engagement demo data |
| **Phase 18** | Org Switcher | Cross-org context switching (affects engagement scoping) |
| **Phase 19** | zbb local dev stacks | Infrastructure (not engagement-specific) |
| **Phase 20** | Fire-and-forget audit | Error-contract patterns (snackbar + telemetry — applies to engagement writes) |
| **Phase 21** | Project Scoped Access Rules | `addMember`/`listMembers`/`removeMember` on `platform.Project` — drives engagement Members tab (currently hidden) |
| **Phase 24** | Demo Data Visibility Gate | Admin gate for engagement demo data |
| **Phase 25** | Platform Data Audit | SDK inventory for engagement form pre-fill |
| **Phase 26** | Seed ZB-as-provider | `company_info` convention + ServiceOffering placeholders — engagement counterparty setup |
| **Phase 27** | Auth Onboarding Guard | Lazy-on-load default-engagement guard (every Org gets its default ZB-as-provider engagement) |
| **Phase 27.5** | Modernization Enforcement | Lint gate (touch-it-fix-it) — applies to engagement-related files |
| **Phase 28** | Company Profile Form | Pre-populated company profile (uses MPI section abuse) — feeds engagement counterparty data |
| **Phase 29.5** | Platform Model Migration | **CRITICAL** — Engagement / SmeMartProject / EngagementVettingItem deprecated; migrated to platform.Project + platform.Task. Read this phase's SUMMARY for the migration shape if you're absorbing engagement data. |
| **Phase 30** | Default Project Board + Coming Soon Placeholders | Default engagement-tier Project board (Org Documents, Engagement Dashboard, Message Center as placeholders) |
| **Phase 31 + 31-A + 31-C** | W3Geekery as first customer + nav cleanup + dogfood walkthroughs | Production validation of engagement-creation flow |
| **Phase 32** | Boards Foundation (Engagement+Project+Cross-Org) | SHIPPED + CLOSED 2026-05-22. Boards tab on engagement-detail; shared `app-board-card` + `app-board-list-tab` components; `/boards/:boardId` detail page; cross-org `/boards` list. **Most directly lift-worthy for Projects App Boards tab.** |
| **Phase 33** | Boards Polish | **CANCELLED** per 2026-05-27 pivot — migrates to Projects App scope. |

Phase summaries lives at `.planning/phases/<phase>/<phase>-PHASE-SUMMARY.md` (where they exist) or `<phase>-<plan>-SUMMARY.md` for per-plan summaries. The 29.5 phase has 8 plan-level summaries — read the migration shape if you're thinking about absorbing legacy engagement data.

---

## Backlog items relevant to Engagement

In `.planning/BACKLOG.md` — most of these now have Projects-App-target post-pivot:

| Item | Pre-pivot target | Post-pivot target | Status |
|---|---|---|---|
| **BACKLOG-099** | RFP-as-platform.Project architecture decision (A/B/C) | Likely still SME Mart (RFP is matchmaking) — but engagement architecture decision crosses both apps | OPEN — pending Nic setMetadata response or alternative carrier decision |
| **BACKLOG-108** | Mirrored Engagement Vetting (Option 5-prime: depth-3 Vetting Project + template-driven Board layout + satisfies/satisfiedBy Task link) | **Projects App** (Engagement chrome moves there) | LOCKED shape; waiting on Nic for `satisfies`/`satisfiedBy` link types |
| **BACKLOG-111** | Engagement template library + Q&A wizard | **Projects App** (template-driven Engagement provisioning) | STUB filed 2026-05-22 |
| **BACKLOG-112** | Industry-ontology research spike (W3C / FIBO / OSCAL / schema.org) | Cross-cutting | STUB filed 2026-05-22 |
| **BACKLOG-117** | Members tab on Engagement + Project detail | **Projects App** | STUB filed 2026-05-22 |
| **BACKLOG-118** | Hierarchy tab — Tree/Graph toggle + tier chips + Lateral-link side panel | **Projects App** | STUB filed 2026-05-22 |
| **BACKLOG-119** | Reusable tier chip primitive | **Projects App** | STUB filed 2026-05-22 |
| **BACKLOG-120** | Engagement/Project Overview tab enrichment | **Projects App** | STUB filed 2026-05-22 |
| **BACKLOG-121** | Portfolio multi-lens (Wheel/List/Tree/Timeline) | **Projects App** | WAIT-LISTED on zb-dx INTENT.md |
| **BACKLOG-122** | Notes carrier evaluation | **CLOSED** — transferred to your scope | Done |
| **BACKLOG-123** | Requirements feature (3-class schema + org library + project targeting) | **Projects App** | DEFERRED pending Kevin |

Plus other engagement-relevant items not in the 117-123 sweep:
- **046** Org Documents (placeholder)
- **065** Message Center (engagement-scoped messaging)
- **066** Engagement Dashboard widget
- **103** Vendor profile form fixes
- **106** Engagement Boards tab (parent for Phase 32 work — mostly shipped)
- **DEV-CI-PURGE-1** Strip dev/ci env references (cross-cutting)

---

## Pivot implications — what you're inheriting

### Cancelled / migrating to your scope

- **Phase 33 Boards Polish** — cancelled in SME Mart; migrates to Projects App.
- **BACKLOG-117 / 118 / 119 / 120 / 121 / 123** — all target Projects App now (your scope).
- **Engagement detail routes** (`/engagements/:id/*`) — eventually deprecated in SME Mart once your equivalent ships.
- **Vetting Board migration** (BACKLOG-108) — your scope.
- **Engagement template library** (BACKLOG-111) — your scope.

### Maintenance-only in SME Mart (until you ship)

- All `src/app/pages/engagements/**` routes + components
- All `src/app/core/services/engagement-*` and `engagements.service.ts`
- `platform-engagement-provisioner.service.ts` (until you build Engagement provisioning Projects-App-side)
- `engagement-context.service.ts`

Bug fixes only on these — no new features in SME Mart.

### Staying in SME Mart (matchmaking-only narrowing)

- RFP / Bid workflow surfaces
- Vendor catalog browsing
- `MarketplaceProfileItem` authoring (vendor profile form, sections, etc.)
- OrgProfile authoring
- Matchmaking search + filters
- Pre-engagement scope negotiation (informal, pre-MSA)
- "Engage with this party" handoff trigger (transitions to your app)

### Cross-app deep-link contract (TBD — zb/ui INTENT Q13)

Once your app has Engagement detail, the handoff trigger in SME Mart should deep-link to your Engagement page. URL contract is open (standup question for Tom/Kevin).

---

## Patterns worth lifting wholesale

1. **`platform-engagement-provisioner.service.ts`** — the atomic Engagement-creation pattern. Creates depth-0 platform.Project + default platform.Board + seed Tasks + identity Tag, all wrapped in error-contract + telemetry. Engagement formation done right; pattern transfers directly.
2. **`engagement-context.service.ts`** — signal-based per-route engagement state. Clean reactive pattern.
3. **`PageBreadcrumbComponent` + `HierarchyBreadcrumbsComponent`** at `src/app/shared/components/page-breadcrumb/` and `src/app/shared/components/hierarchy-breadcrumbs/` — breadcrumb chrome for engagement/project drilldown.
4. **Phase 32 Boards components** — `src/app/shared/components/boards-grid/`, `board-card/`, `pinned-preview/`, `board-detail/`, `board-switcher/`. Pin-to-expand (PKV-backed) + drill-to-detail pattern. Most directly applicable to your Boards tab.
5. **Dual-read pattern with timeout** in `engagements.service.ts` — primary GQL read + Pipeline fallback with PRIMARY_READ_TIMEOUT_MS. Useful when you need cache-warming or migration-safety on Engagement reads.
6. **`zb-resource-status` chip rendering** — Material chip with proper status semantics, used in engagement-detail header. Lifted from ngx-library.

## Patterns to question / probably NOT lift

1. **The current 7-tab strip** — pre-Brian-huddle. Your new strip should be `Overview · Readiness · Requirements · Boards · Tasks · Members · Roles · Boundaries · Documents · Activities` per huddle §2.8. Tabs to add: Readiness, Requirements, Members, Roles, Boundaries, Activities. Tabs that drop or change: Vetting (becomes Vetting Board, surfaces in Boards tab), Tasks (rolled into Boards), Notes (moves to your tab strip but FileService-backed not GQL-backed). Timeline may or may not survive — probably folds into Activities.
2. **Legacy Engagement GQL class** — deprecated Phase 29.5. Use `platform.Project` directly.
3. **`EngagementVettingItem` GQL class** — deprecated Phase 29.5. Use paired `platform.Task` on a Vetting Board per BACKLOG-108 Option 5-prime.
4. **D-51 display verbiage** (provider/client labels) — SME-Mart-specific. Decide whether to keep or canonicalize differently in your app.
5. **`sme-mart.eng.*` tag namespace** — SME-Mart-specific identity tag. Engagement identity in Projects App might use a different convention (tag-vs-tagId is open per zb/ui standup Q1).
6. **The current Vetting tab** — drives the deprecated `EngagementVettingItem` flow. Don't lift; design from BACKLOG-108 Option 5-prime shape.
7. **`SmeMartTask` / `SmeMartBoard` / `SmeMartActivity` GQL classes** — predate platform migration. Use `platform.Task` / `platform.Board` / `platform.Activity` in your app.

---

## Open questions / coordination items

1. **Engagement creation flow in Projects App** — how does Engagement-formation work in your app? SME Mart handles it via the matchmaking → handoff flow (parties agree → Projects App creates Engagement + MSA + project setup). Worth designing this handoff explicitly.
2. **D-51 display verbiage adoption** — keep or replace? Affects all Engagement display strings.
3. **MSA authoring location** — pending Brian confirmation (per the scope-reduction pivot brief Open Question 3). Director Parks lean: Projects App, post-handoff. Brian implied this in 2026-05-27 Slack but worth pinning.
4. **Existing UAT/prod Engagement data migration** — Brian's-Org and W3Geekery Engagements exist today in SME Mart. Architecturally they're already `platform.Project` rows, so no data migration needed — only UI route ownership transfers. Worth verifying nothing on Engagement-detail-render-path depends on SME-Mart-specific classes.
5. **Cross-app deep-link URL contract** — when SME Mart triggers "engage with this party" handoff, what URL does it send the user to in Projects App? Open per zb/ui INTENT Q13 (Tom/Kevin).
6. **Tab strip handoff window** — does SME Mart sunset its `/engagements/:id/*` routes immediately when Projects App ships, or run them in parallel for a window? Director lean: parallel until Projects App is verified, then redirect SME Mart routes to your equivalent.
7. **Engagement provisioner ownership** — `platform-engagement-provisioner.service.ts` knows the Engagement-creation recipe. Does it move to Projects App (recommended — recipe lives with the consumer) or stay in SME Mart with an API call to Projects App for the actual creation? Either works; lean: move to Projects App.

---

## How to use this doc

When you're scoping your Projects App Engagement-detail work:

1. **Tab strip planning** — use the huddle §2.8 tab strip, NOT the current SME Mart tab strip.
2. **Components to read for patterns** — start with the "lift wholesale" list above; reference paths to actual files; skim ours then adapt to your conventions.
3. **Services** — `engagements.service.ts` for read patterns; `platform-engagement-provisioner.service.ts` for the creation recipe; `engagement-context.service.ts` for shell state.
4. **Schema** — don't consume deprecated SME Mart classes (Engagement, SmeMartProject, EngagementVettingItem). Use `platform.Project` / `platform.Task` / `platform.Board` directly. Optionally consume Active SME Mart classes (Bid, MPI, etc.) via the schema-extension pattern when matchmaking context bleeds in.
5. **Backlog** — the 117-123 sweep is mostly your scope now. BACKLOG-108 (Vetting), 111 (templates), 112 (ontology), 117-121, 123 are all on your inbox.
6. **Pivot implications** — your shipping unblocks SME Mart's `/engagements/:id/*` sunset. Worth knowing the dependency goes both ways.

When in doubt about a SME Mart pattern: **ask via Tell-block to Director Parks** (Clark will relay). Don't reverse-engineer from code — half of this codebase is in active deprecation transition and the code-as-truth is misleading without the phase context.

---

## References

- **Scope-reduction pivot brief** — [`.planning/director/sme-mart-scope-reduction-pivot-2026-05-27.md`](../director/sme-mart-scope-reduction-pivot-2026-05-27.md)
- **Carrier rule memex note** — `memex/zerobias/platform/carrier-rule-cardinality-query-shape-not-feature-category`
- **Canonical Projects vocabulary memex** — `memex/zerobias/platform/canonical-projects-vocabulary-stack-engagement-project-middle-tiers-task`
- **D-51 decision** — DECISIONS.md (search "D-51 Engagement Display Verbiage")
- **Phase 29.5 platform migration** — `.planning/phases/29.5-platform-model-migration/` (8 plan summaries)
- **Phase 32 Boards Foundation** — `.planning/phases/32-boards-engagement-project-cross-org/` (5 plans, 2 waves, CLOSED 2026-05-22)
- **Notes domain transfer Tell-block** — sent 2026-05-27 in earlier exchange; see also [`requirements-architecture-2026-05-27-pending-kevin.md`](requirements-architecture-2026-05-27-pending-kevin.md) for parallel deferred-pending-Kevin work
- **2026-05-27 huddle notes** — [`meetings/2026-05-27-slack-huddle-requirements-readiness-reframe.md`](meetings/2026-05-27-slack-huddle-requirements-readiness-reframe.md)
- **BACKLOG** — [`.planning/BACKLOG.md`](../BACKLOG.md) — see entries 099, 108, 111, 112, 117-123 for engagement-relevant work
- **Engagement source paths** — all under `src/app/pages/engagements/` and `src/app/core/services/engagement-*` + `engagements.service.ts` + `platform-engagement-provisioner.service.ts` + `engagement-context.service.ts` + `engagement-hierarchy.service.ts` + `engagement-lifecycle.service.ts` + `engagement-tasks.service.ts` + `engagement-timeline.service.ts`
- **Existing UAT Engagement IDs** — Brian Hierholzer Inc. `551f7ca6-d89d-4508-aac0-0e8bd8d4e17e`; W3Geekery `4617e9d7-b7b4-4679-be43-10fc4140295c`
