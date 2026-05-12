# Phase 30: Default Project Board + Coming Soon Placeholders — Context (v2)

**Gathered:** 2026-05-12 (post-29.5 closure)
**Status:** Ready for planning
**Supersedes:** v1 of this file (2026-05-01) — pre-D-46/D-49/D-50 framing, legacy `SmeMartProject` discovery, and `OnboardingBootstrapService` GQL-probe references are all OBSOLETE. This rewrite is canonical.
**Source of truth:** Director brief v2 (`.planning/director/phase-30-brief.md` @ commit `a529fa7`) + addendum (`bacd2c8` — User-flow context).

> **Planner / researcher: read these two commits before anything else.** Cached pre-v2 brief content (older roadmap snapshots, Phase 27's "ComingSoon at /projects" notes) is not authoritative for Phase 30. Anything you see citing `SmeMartProject` as the discovery target, `OnboardingBootstrapService` probes as the pattern to copy, or a "tier banner" deliverable is from the v1 brief and was retired.

<domain>
## Phase Boundary

A **landing dashboard / home view** at `/projects` for pre-existing ZeroBias users arriving from the ZB portal. The dashboard renders the user's default ZB engagement (depth-1 `platform.Project`) and its Project-tier child (depth-2 `platform.Project`) using locked verbiage (D-32/D-33 for the engagement header, D-34/D-35 for the Project tier body), plus three navigable "Coming Soon" placeholder surfaces — Org Documents (046), Engagement Dashboard (066), Message Center (065) — as honest disabled placeholders, not half-built UI.

**Phase 30 is NOT:**
- A `platform.Board` / kanban / Task-list UI (Phase 32+).
- A signup or first-time-setup flow — SME Mart never authenticates anyone; the ZB session is inherited (see brief addendum `bacd2c8`).
- A rich project workspace — `/project/:projId/*` (`ProjectDetail`) remains the rich workspace surface, reachable by navigation FROM the dashboard.
- A tier display / billing banner (PB-05 dropped; DECISIONS.md "ServiceOfferings Defer With Brian").

**In scope:** new `/projects` route + `default-project-board` component; new `feature-coming-soon` component co-located with the board; three placeholder routes (one component, three route entries with route-data); two new discovery helpers on `engagements.service`; hoisting the Project-tier tag constant into a shared module; unit tests; D-32..D-35 verbiage UAT verification.

**Out of scope:** real implementation of 046/066/065 (v1.5+), tier banner, multi-engagement switching, Tasks/Board rendering, auto-reprovisioning of missing depth-2 children (Phase 31 / `D-49-NAMESPACE-MIGRATE-1` territory), Hierarchy Editor.

</domain>

<decisions>
## Implementation Decisions

### Default Surface Composition — LIGHTWEIGHT, NO ProjectDetail REUSE (G1 lock)

**Decision:** new `default-project-board.component.ts` renders the engagement header + Project-tier body inline. **Do NOT redirect to `/project/:projId/overview`** and **do NOT embed/refactor `ProjectDetail`.**

- **Rationale (load-bearing for planner):** option (a) — resolve + redirect — drops the D-32/D-33 engagement header entirely (`ProjectDetail` has no concept of its parent engagement), violating PB-02. Option (b) — wrapper + embed `ProjectDetail` — drags ProjectDetail into a "must-also-work-without-`projId`" refactor that maps directly onto Discovery Flag #3's ~400-line risk. Option (c) keeps blast radius minimal and stays a true dashboard view.
- **Component scope:** engagement header (D-32 name + D-33 description rendered as-is, no reformatting, no splitting on the `<-` arrow), Project-tier body (D-34 name + D-35 description rendered as-is, no Tasks/Board UI), Material `mat-card` × 3 grid for the 3 placeholder navs, optional small "Open project workspace" link out to `/project/:depth2ProjectId/overview` for users who want the rich tab surface.
- **Hard ceiling:** if implementation of the board exceeds **~150 lines** of new template/component code beyond standard signal-load boilerplate, plan author MUST stop and surface as a Director re-scope blocker (see G6 lock below).
- **v1.5 follow-up note (do NOT do in Phase 30):** "Fold board view into a `ProjectDetail`-shared layout if the dashboard surface evolves toward feature parity with the rich workspace." Captured in `<deferred>` below.

`ProjectDetail` at `src/app/pages/project/project-detail.component.ts` and its routes at `/project/:projId/*` remain untouched by Phase 30. Navigation from the dashboard to the rich workspace is a plain `routerLink`.

### Discovery Helpers — LIVE IN `engagements.service` (G2 lock with conditional resolved)

**Conditional resolution:** `engagement-hierarchy.service.ts` was inspected. Its current purpose is **tag-based hierarchy resolution** (Project→Boundary→Task tag conventions, `sme-mart.eng.*` / `sme-mart.proj.*` / `sme-mart.task.*` prefixes, `parseHierarchyLevel`, `stripPrefix`, `isProtectedTag`). It is conceptually a tag-prefix parser, NOT a `parentId`-depth resolver. Putting depth-1/depth-2 platform.Project helpers there would conflate two unrelated hierarchy abstractions. **Falls back to (a): both helpers go in `engagements.service`.**

Two new helpers to add (plan-time task surface):

1. **`engagements.service.getDefaultEngagement(orgId: UUID): Promise<EngagementSummaryRow | null>`**
   - Reuses the existing `listEngagements` dual-read path (D-15 window) with an additional filter for the engagement-identity tag namespace (`sme-mart.engagement.*` OR legacy `sme-mart.eng.*` per D-49). The dual-read service already returns BOTH namespaces unioned and dedup'd; the helper picks the first item where `ownerId === orgId` and `parentId === null`.
   - **Phase 30 inherits dual-namespace handling transparently** — does NOT probe by tag name itself (errata 030 is Phase 31's job).
   - On miss (empty result), returns `null`. Phase 27's lazy-on-load guard should prevent this; the defensive UX path (G5) handles it.

2. **`engagements.service.getProjectTierProject(engagementId: UUID): Promise<ProjectExtended | null>`**
   - Calls `platform.Project.list({ parentId: engagementId, tagId: SME_MART_TIER_PROJECT_TAG_ID })` via `clientApi.platformClient.getProjectApi().list(...)`.
   - v1.4 guarantees exactly ONE child at depth 2 per engagement (D-50). Returns `items[0] ?? null`.
   - No dual-read needed — this is a new-model-only artifact (depth-2 Project tier did not exist pre-29.5).

Both helpers are small (~20–40 lines each + their unit tests). Adding them is part of Phase 30's plan; surface them as discrete tasks so the plan-checker can see them.

### Tag Constant Hoist — `core/constants/tier-tags.ts`

`SME_MART_TIER_PROJECT_TAG_ID` currently lives in `src/app/core/services/platform-engagement-provisioner.service.ts:19` as a file-local `const`. Phase 30 needs to consume it from `engagements.service` (and the new helper's unit tests). Hoist:

- **New file:** `src/app/core/constants/tier-tags.ts` exporting `SME_MART_TIER_PROJECT_TAG_ID = '420b0753-e72c-4b81-8929-70508a119bf0'` (UAT) plus the inline comment from the provisioner about D-50 canonical mapping and the reserved `sme-mart.tier.workspace` UUID (`2d7e6b6d-62e1-4691-958c-41cd1b8de043`).
- **Re-export from `platform-engagement-provisioner.service.ts`** at the same import surface to keep its existing in-file callers stable (`import { SME_MART_TIER_PROJECT_TAG_ID } from './platform-engagement-provisioner.service'` should continue to work — re-export pattern, no consumer-side change).
- **Co-located with `demo-tags.ts`** (which already lives at `src/app/core/constants/demo-tags.ts`) so the constants directory remains the single home for tag-UUID truth.
- **Non-controversial; in-scope for Phase 30.** Touch-It-Fix-It applies to the provisioner file when re-exporting (modernization lint will fire on touched files; address violations in-band).

### Rich Coming Soon Component — NEW, CO-LOCATED (G3 lock)

**Decision:** new component `feature-coming-soon.component.ts` co-located with `default-project-board/`. The existing thin `src/app/pages/coming-soon/coming-soon.component.ts` STAYS in place untouched for the "whole-page-stub" routes (`catalog`, `request-assistance`, `feedback`) — DO NOT modify it.

- **Location:** `src/app/default-project-board/feature-coming-soon.component.ts` (and `.html`, `.scss`, `.spec.ts` co-located per file-naming convention).
- **Inputs (signal-based `input()`):**
  - `title: InputSignal<string>` — required, e.g. `"Org Documents — Coming Soon"`.
  - `description: InputSignal<string>` — required, 1–2 sentence body copy.
  - `featureKey: InputSignal<string | undefined>` — optional. Reserved for future analytics / notify-me persistence. v1.4 does NOT use it for behavior — toast copy stays generic.
- **Visual:**
  - Wrap content in `<zb-empty-state-container>` from `@zerobias-org/ngx-library` (verified export per CLAUDE.md ngx-library section + provisioner file).
  - Iconography: Material `schedule` or `hourglass_empty` (plan author picks one — keep consistent across all 3 placeholders).
  - Disabled-looking visual treatment per brief (greyed, subdued; CLAUDE.md `MODERNIZATION_GUIDE.md` rules apply to all SCSS).
- **Optional notify-me button:** if implemented, on click emit `MatSnackBar.open("We'll let you know when this is ready", "Dismiss", { duration: 5000 })` — toast-only. **NO Pipeline.receive write. NO MarketplaceProfileItem tag-write. NO server call. NO analytics emission.** Brief is explicit on this.
- **"Back to dashboard" link:** `routerLink="/projects"`.
- **Lock: standalone component, signal-based `input()`, `inject()`, suffixed filename, control-flow `@if` / `@for`, no `CommonModule`, no `<mat-spinner>` (use `<mat-progress-spinner>`), no `*ngIf` / `*ngFor`, no constructor DI, no `@Input()` / `@Output()`.** Pre-commit lint will enforce; do not bypass with `--no-verify`.

### Placeholder Routes — TOP-LEVEL SIBLINGS UNDER AppShell

Three placeholder routes mounted as siblings of `/projects` inside the same `AppShell` guarded children array (so `onboardingGuard` continues to gate). **One component, three route entries** with `data` passing title + description + featureKey:

```ts
{
  path: 'org-documents',
  component: FeatureComingSoonComponent,
  data: {
    title: 'Org Documents — Coming Soon',
    description: 'Centralized document management and sharing for your organization is on the roadmap. Once available, you\'ll be able to upload, organize, and share documents across engagements.',
    featureKey: '046',
  },
},
{
  path: 'engagement-dashboard',
  component: FeatureComingSoonComponent,
  data: {
    title: 'Engagement Dashboard — Coming Soon',
    description: 'Aggregated metrics and progress views across all your engagements are coming soon. You\'ll see status, milestones, and key activity at a glance.',
    featureKey: '066',
  },
},
{
  path: 'message-center',
  component: FeatureComingSoonComponent,
  data: {
    title: 'Message Center — Coming Soon',
    description: 'Cross-party messaging across all your engagements is coming soon. Today, conversations live within individual engagements.',
    featureKey: '065',
  },
},
```

- The component reads route-data once on init via `ActivatedRoute` and binds it to the signal inputs (or accepts inputs directly when embedded in a parent — plan author's call; route-data is the simpler path for v1.4).
- Deep-linking any of the three URLs renders the same placeholder (no 404, no redirect).
- The `/projects` route entry itself swaps from the current `ComingSoon` stub (`src/app/app.routes.ts:52`) to the new `DefaultProjectBoardComponent`.

### Navigation From Dashboard to Placeholders — CARD GRID (G4 lock)

Material `mat-card` × 3 in a responsive grid on `default-project-board`:

- Each card: leading icon, title, 1-line teaser, hover affordance.
- Card click → `routerLink` to the corresponding placeholder route (`/org-documents`, `/engagement-dashboard`, `/message-center`).
- No new tab containers; no sidebar entries; no inline accordions. The card grid IS the navigation surface from the dashboard.
- Deep-link parity required: direct URL to any placeholder route renders the same `FeatureComingSoonComponent`, NOT a 404 or redirect.

### Defensive UX — Missing Depth-2 Project Tier (G5 lock)

If `getDefaultEngagement(orgId)` returns a value but `getProjectTierProject(engagement.id)` returns `null` (org has Engagement but no depth-2 child — should not happen post Phase 26 + 29.5; only via errata-030 / D-49 namespace drift):

- Render inline `<zb-empty-state-container>` with copy: **"Project tier not yet provisioned. Please contact support."**
- Log: `console.warn('[DEFAULT_PROJECT_BOARD:MISSING_PROJECT_TIER]', { orgId, engagementId })` for ops visibility.
- **NO auto-reprovisioning call.** That's Phase 31 / `D-49-NAMESPACE-MIGRATE-1` territory. Phase 30 must not paper over Phase 31's work.
- **NO crash, NO infinite spinner, NO redirect.** Component reaches a stable error state.

If `getDefaultEngagement(orgId)` itself returns `null` (default engagement entirely missing — Phase 27's lazy-on-load guard should prevent this): render the same `<zb-empty-state-container>` with copy: **"Default engagement is missing. Please contact support."** Same `console.warn` pattern with tag `[DEFAULT_PROJECT_BOARD:MISSING_DEFAULT_ENGAGEMENT]`.

### Error Handling on Discovery Reads

Wrap both helpers' calls in try/catch from the component side. On thrown error (network / SDK failure, NOT a `null` miss):

- `MatSnackBar.open('Failed to load default project — please retry', 'Dismiss', { duration: 5000 })`.
- `console.warn('[DEFAULT_PROJECT_BOARD:LOAD_FAILURE]', { stage, error })` where `stage` is `'engagement'` or `'project-tier'`.
- Component reaches a recoverable error state (retry button optional; plan author's call).
- These are READS — Phase 20's fire-and-forget-write pattern does not apply. Snackbar + recoverable state is sufficient.

### Stop-the-Line Rule — DISCOVERY FLAG #3 (G6 lock, load-bearing for planner)

**Verbatim from the brief, restated here for visibility to the planner agent:**

> "If Discovery Flag #3 fails (no reusable project-detail component pattern AND building default-project-board exceeds ~150 lines of new template/component code), plan author MUST surface as a plan-time blocker for Director re-scope. DO NOT silently build a net-new ~400-line component as part of this phase."

**Operational interpretation for the planner:**

1. The G1 lock above (option (c): lightweight, no ProjectDetail reuse) is the chosen path. The planner does NOT need to search for reusable patterns or evaluate (a)/(b) — that decision is closed.
2. **What the planner DOES need to do:** estimate `default-project-board.component` template + class size against the **~150-line ceiling** during plan creation. If the design naturally lands at ~150 lines for engagement header + Project body + 3 cards + error states, proceed. If the design balloons toward 300+ lines (e.g., trying to render Tasks, build a custom layout primitive, or duplicate `ProjectDetail` features), STOP and surface as a Director re-scope blocker before writing the plan.
3. The ~150-line ceiling is a budget signal, not a hard count — it exists so the planner has a circuit-breaker that triggers escalation rather than silent expansion. Sensible deviations (e.g., 165 lines because the empty-state branch adds 15 honest lines) are fine; doubling the budget is not.
4. The plan-checker enforces this on plan review. The director enforces it at wave greenlight. Both gates are downstream — the planner SELF-enforces it during plan authoring.

### Out-of-Scope — Will Be Rejected If Added

- Tier display banner (PB-05 dropped — Brian, DECISIONS.md "ServiceOfferings Defer With Brian").
- Tasks / Board UI on the depth-2 Project tier (Phase 32+).
- Auto-reprovisioning on missing depth-2 child (Phase 31 / `D-49-NAMESPACE-MIGRATE-1`).
- Real notify-me persistence (MPI tag-write, Pipeline.receive). Toast-only for v1.4.
- Multi-engagement switcher.
- Hierarchy Editor (post-v1.4 design track).
- Touching `src/app/pages/coming-soon/coming-soon.component.ts` (the thin existing stub stays as-is for non-feature routes).
- Refactoring `ProjectDetail` to "also work without `projId`" — explicit non-goal per G1 rationale.
- D-49 namespace migration in provisioner (errata 030; Phase 31 prereq).

### Claude's Discretion (Plan Author Picks)

- Exact directory name: `src/app/default-project-board/` (preferred; symmetrical with sibling page directories) — plan author may instead place under `src/app/pages/default-project-board/` if it matches a stronger sibling pattern; verify against `src/app/pages/` inventory at plan time.
- Iconography choice for `FeatureComingSoonComponent` (Material `schedule` vs `hourglass_empty` vs `lock_clock`) — keep consistent across the 3 placeholders.
- Whether route-data flows to `FeatureComingSoonComponent` via `ActivatedRoute.snapshot.data` reads in `ngOnInit` (simpler for route-only consumption) or as signal inputs from a parent (when later embedded). Recommend route-data for v1.4.
- Whether to expose an optional "Open project workspace" link from the dashboard to `/project/:depth2ProjectId/overview` (recommended — gives users a path to the rich tab surface without redirecting).
- Test file co-location (`.spec.ts` next to component — project convention).
- Card-grid responsive breakpoints (recommend mirror existing dashboard card patterns in `src/app/home/` if present).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Director Brief (v2 + addendum) — READ FIRST
- `.planning/director/phase-30-brief.md` — full goal, User-flow context, deliverables, requirements, verification, out-of-scope. **Brief v2 commits: `a529fa7` (initial v2 rewrite, 2026-05-12 14:51 PT) + `bacd2c8` (addendum: no SME Mart signup; pre-existing ZB session). Do NOT use any cached pre-`a529fa7` content.**

### Locked Decisions (post-29.5 triad)
- `.planning/director/DECISIONS.md`:
  - **D-32 / D-33** — Engagement (depth 1) name + description verbiage.
  - **D-34 / D-35** — Project tier (depth 2) name + description verbiage.
  - **D-46** — Hierarchy uses nested `platform.Project` for STRUCTURE + tags for tier NAMING.
  - **D-48** + Mechanism Addendum (errata 033) — Project Lead is eager-materialized per Project at provisioning; Phase 30 needs zero membership logic.
  - **D-49** — Engagement tag namespace `sme-mart.engagement.*` (legacy `sme-mart.eng.*` coexists per D-43 anti-pattern (d)). Phase 30 inherits dual-namespace handling transparently from `engagements.service`.
  - **D-50** — Depth 2 = Project tier (FIXED, NOT Workspace). D-34/D-35 verbiage attaches here.

### Discovery Helpers' Home (target file)
- `src/app/core/services/engagements.service.ts` — add `getDefaultEngagement(orgId)` + `getProjectTierProject(engagementId)`. Reuse the dual-read pattern already in `listEngagements`. Do NOT use `engagement-hierarchy.service.ts` (it's a tag-prefix parser for the pre-D-46 model; conceptually unrelated to parent-id depth resolution).
- `src/app/core/services/engagement-hierarchy.service.ts` — **verified at context time as tag-based; do NOT add depth-resolver helpers here.**

### Tag Constant Source + Hoist Target
- `src/app/core/services/platform-engagement-provisioner.service.ts:19` — current home of `SME_MART_TIER_PROJECT_TAG_ID` (file-local). Hoist source.
- `src/app/core/constants/` — directory containing `demo-tags.ts`. **NEW FILE:** `src/app/core/constants/tier-tags.ts` is the hoist target.

### Routing — App Shell + Existing Stubs
- `src/app/app.routes.ts` — Phase 30 modifies line 52 (swap `ComingSoon` for `DefaultProjectBoardComponent`) and adds 3 new sibling routes inside the same `AppShell` guarded children array.
- `src/app/layout/app-shell.component.ts` — `AppShell` wraps all guarded routes; do NOT modify.
- `src/app/core/guards/onboarding.guard.ts` — already gates everything under `AppShell`; do NOT modify.
- `.planning/phases/27-auth-onboarding-guard/27-04-routing-SUMMARY.md` — locks `/projects` as the post-onboarding target.

### Existing Project Rendering (DO NOT REUSE — for awareness only)
- `src/app/pages/project/project-detail.component.ts` — rich `/project/:projId/*` workspace. Phase 30 navigates TO this from the dashboard via plain `routerLink`; does NOT embed or refactor it.
- `src/app/pages/project/project.routes.ts` — `PROJECT_ROUTES` mounted at `/project`. Untouched by Phase 30.

### Existing Coming Soon (DO NOT MODIFY)
- `src/app/pages/coming-soon/coming-soon.component.ts` — thin generic stub. Stays in place for `catalog`, `request-assistance`, `feedback`. Phase 30 creates a NEW richer component co-located with `default-project-board/`.

### ngx-library (Coming Soon visual primitive)
- `~/Projects/zb/zerobias-org/ngx-library/projects/ngx-library/src/public-api.ts` — verified exports include `ZbEmptyStateContainerComponent` and `ZbSimplePanelComponent`. Per CLAUDE.md ngx-library section, prefer ngx-library before custom.

### Phase 29.5 Outputs (consumed inputs)
- `.planning/phases/29.5-platform-model-migration/29.5-CONTEXT.md` — Engagement-as-Project model, D-46/D-49/D-50 ratification.
- `.planning/phases/29.5-platform-model-migration/29.5-03-SUMMARY.md` — `engagements.service` dual-read implementation (Plan 03).
- `.planning/phases/29.5-platform-model-migration/29.5-06-SUMMARY.md` — UAT-validated W3Geekery artifacts; Phase 30's UAT verification target.

### Phase 27 / 28 Context
- `.planning/phases/27-auth-onboarding-guard/27-04-routing-SUMMARY.md` — `/projects` route slot reservation.
- `.planning/phases/28-company-profile-form/` — `MarketplaceProfileService.getCompletionStatus()` contract (Phase 27 reads this; Phase 30 does NOT).

### Project Conventions
- `CLAUDE.md` (sme-mart) — Angular 21 patterns, ngx-library-first, file-naming `*.component.ts` suffix, **TouchItFixIt** modernization.
- `.planning/docs/MODERNIZATION_GUIDE.md` — non-negotiable signal/inject/control-flow rules. Lint will fire on every touched file.
- `.planning/docs/SDK_VERIFICATION_SOURCES.md` — ZB MCP / actual platform source / actual SDK source ARE authoritative. The deprecated Next.js prototype is NOT.

### Open Errata (informational; not Phase 30 blockers)
- **errata 030** — D-49 namespace drift in provisioner (Phase 31 hard prereq). Phase 30 inherits dual-namespace handling from `engagements.service`; does NOT itself probe by tag name.
- **errata 031** — vetting `platform.Board` not implemented; v1.5+; unrelated to Phase 30.
- **errata 032** — `platform.Project.get` omits `parentId` for top-level Projects; Phase 30 uses `.list` not `.get`, so unaffected.

### Backlog Items For Awareness (NOT Phase 30 scope)
- `BACKLOG.md` entries `046` / `066` / `065` — full context for the deferred features.
- `BACKLOG.md` `D-49-NAMESPACE-MIGRATE-1` — Phase 31 prereq; explicit non-dependency for Phase 30.

</canonical_refs>

<specifics>
## Specific Ideas

- **Route swap in `src/app/app.routes.ts`:** replace `{ path: 'projects', component: ComingSoon, data: { title: 'Projects' } }` (line 52) with `{ path: 'projects', component: DefaultProjectBoardComponent }` (or `loadComponent: () => import(...).then(m => m.DefaultProjectBoardComponent)` if eager import would balloon the AppShell bundle). Plan author's call on lazy vs eager — favor lazy if the board pulls in non-trivial sub-components.
- **Three placeholder route entries:** add as siblings of `/projects` inside the same guarded children array (exact snippet in the Placeholder Routes decision above). Pattern uses route-data for title / description / featureKey.
- **`engagements.service.getDefaultEngagement(orgId)`:** scaffold:
  ```ts
  async getDefaultEngagement(orgId: UUID): Promise<EngagementSummaryRow | null> {
    const results = await this.listEngagements({
      buyerOrgId: String(orgId),
      pageNumber: 1,
      pageSize: 10,
    });
    return results.items.find(e => /* engagement-identity tag matches sme-mart.engagement.* OR sme-mart.eng.* */) ?? results.items[0] ?? null;
  }
  ```
  Plan author finalizes the tag-match predicate from the `EngagementSummaryRow.tag` shape (the dual-read preserves `tag` for polymorphic filtering — see `transformPlatformProjectToEngagementSummary` in `engagements.service.ts:323`).
- **`engagements.service.getProjectTierProject(engagementId)`:** scaffold:
  ```ts
  async getProjectTierProject(engagementId: UUID): Promise<ProjectExtended | null> {
    const result = await this.clientApi.platformClient
      .getProjectApi()
      .list(1, 10, undefined, undefined, /* parentId */ String(engagementId), /* tagId */ SME_MART_TIER_PROJECT_TAG_ID);
    return result.items[0] ?? null;
  }
  ```
  Plan author verifies the `getProjectApi().list(...)` signature against the SDK at plan time — the existing call in `listEngagements` at line 71–74 uses positional args `(pageNumber, pageSize, undefined, buyerOrgId)`; the `parentId` + `tagId` positions need MCP/SDK confirmation.
- **`src/app/core/constants/tier-tags.ts`:**
  ```ts
  // SME Mart Project-tier identity tag.
  // Per D-50 canonical tier mapping: depth 2 = Project tier (FIXED), tag = sme-mart.tier.project.
  // The sme-mart.tier.workspace UUID (UAT 2d7e6b6d-62e1-4691-958c-41cd1b8de043) is reserved
  // for customer-renameable depth-3+ tiers via the future Hierarchy Editor; v1.4 does not use it.
  export const SME_MART_TIER_PROJECT_TAG_ID = '420b0753-e72c-4b81-8929-70508a119bf0'; // UAT
  ```
  Re-export from `platform-engagement-provisioner.service.ts` to preserve its existing import surface (`export { SME_MART_TIER_PROJECT_TAG_ID } from '../constants/tier-tags';`).
- **`DefaultProjectBoardComponent` template skeleton (illustrative; plan author owns final shape):**
  ```html
  @if (loading()) { <mat-progress-spinner /> }
  @else if (error()) { <zb-empty-state-container>{{ errorMessage() }}</zb-empty-state-container> }
  @else {
    <header class="engagement-header">
      <h1>{{ engagement().name }}</h1>
      <p>{{ engagement().description }}</p>
    </header>
    <section class="project-body">
      <h2>{{ projectTier().name }}</h2>
      <p>{{ projectTier().description }}</p>
    </section>
    <nav class="placeholder-grid">
      <mat-card routerLink="/org-documents">…</mat-card>
      <mat-card routerLink="/engagement-dashboard">…</mat-card>
      <mat-card routerLink="/message-center">…</mat-card>
    </nav>
  }
  ```
- **Test stubs:**
  - `default-project-board.component.spec.ts` — renders engagement header (D-32 verbatim) + Project body (D-34 verbatim) + 3 placeholder cards; navigation `routerLink` resolves to correct paths; missing-Project-tier branch renders inline empty state; missing-engagement branch renders inline empty state.
  - `feature-coming-soon.component.spec.ts` — renders `title` + `description` from inputs; optional notify-me triggers `MatSnackBar.open` with exact copy; back-link `routerLink` resolves to `/projects`.
  - `engagements.service.spec.ts` (extend existing) — `getDefaultEngagement` happy path, empty-result null path, tag-namespace dual-recognition (`sme-mart.engagement.*` AND `sme-mart.eng.*`). `getProjectTierProject` happy path, empty-result null path.
  - `app.routes.spec.ts` (if it exists — Phase 27 Wave 3 added route-shape tests) — assert `/projects` resolves to `DefaultProjectBoardComponent`; assert the 3 placeholder routes exist + are children of the guarded AppShell.
- **UAT verbiage verification (G7 lock — exit criterion):**
  - Log in as Clark @ W3Geekery on `uat.zerobias.com/sme-mart/projects`.
  - Engagement header renders **verbatim** as `"W3Geekery <- ZeroBias"` (D-32 ASCII reverse-arrow, no Unicode substitution, no reformatting) AND `"Platform Services Engagement: ZeroBias ➡️ W3Geekery"` (D-33, includes the `➡️` emoji).
  - Project tier body renders **verbatim** as `"ZeroBias Platform"` (D-34 literal constant) AND the D-35 description verbatim (org-name-interpolated).
  - Click each of the 3 placeholder cards; each renders the `FeatureComingSoonComponent` with its locked title + description.
  - Direct URL `/org-documents`, `/engagement-dashboard`, `/message-center` each renders the same placeholder content (deep-link parity).
  - **Broader Plan 06 staged UI cross-check items (dual-read union surface, depth-2 reachability via navigation) are NOT Phase 30 deliverables.** They get exercised organically during W3Geekery dogfooding (Phase 31) and remain owned by Plan 06's SUMMARY.

</specifics>

<deferred>
## Deferred Ideas

- **046 / 066 / 065 real implementations** — v1.5+. Out of scope per brief and DECISIONS.md.
- **Tier display banner / billing / upgrade flow** — deferred until Brian confirms tier structure (DECISIONS.md "ServiceOfferings Defer With Brian").
- **Notify-me persistence** (tag-on-MPI, Pipeline.receive call) — toast-only for v1.4. featureKey input is reserved for future analytics; no behavior in v1.4.
- **Multi-engagement switcher on the dashboard** — v1.5+ (default engagement is the only scope for v1.4).
- **Tasks / Board UI on the depth-2 Project tier** — Phase 32+.
- **Auto-reprovisioning on missing depth-2 child** — Phase 31 / `D-49-NAMESPACE-MIGRATE-1`.
- **Fold dashboard view into a `ProjectDetail`-shared layout** — v1.5 follow-up if the dashboard surface evolves toward feature parity with the rich workspace. Phase 30 keeps `default-project-board` and `ProjectDetail` deliberately separate to minimize blast radius.
- **Hierarchy Editor** — post-v1.4 design track per RESUME parkit-7 open items.

</deferred>

---

*Phase: 30-default-project-board-coming-soon-placeholders*
*Context gathered: 2026-05-12 from director brief v2 (`a529fa7` + addendum `bacd2c8`) + verified codebase state + verified Phase 27/28/29.5 contracts.*
*Director-locked gray areas: A (rewrite), G1 (c), G2 (a fallback), G3 (a), G4 (cards), G5 (a), G6 (verbatim stop-the-line), G7 (verbiage-only).*
