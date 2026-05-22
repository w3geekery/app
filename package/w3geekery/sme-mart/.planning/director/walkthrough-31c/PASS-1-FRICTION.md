# Phase 31-C Pass 1 — W3Geekery Happy Path Friction Log

**Walkthrough date:** 2026-05-18
**Walker:** Director Parks + Clark
**Environment:** `localhost:4200` via `npm run dev` (UAT platform data, API-key auth)
**Build:** `poc/sme-mart` @ `b4c5271` (one in-walkthrough fix landed: engagementId hydration on Project transform)

Cross-fork PR `w3geekery/app:poc/sme-mart` → `zerobias-org/app:uat` deferred; this walkthrough is the pre-deploy verification.

## Method
Drive the v1.4 dogfood path as Clark@W3Geekery:
1. Land on `/`
2. Switch session org if needed
3. `/projects` engagement-tier card list
4. Drill into a project card
5. Engagement detail (Projects tab)
6. `/org/profile` Corporate Identity surface
7. Hidden surfaces / Coming Soon routes (pending)
8. `/my-profile/settings` (pending)

Findings indexed F-N below.

## Findings

### F-1 — Onboarding holding page renders correctly for unprovisioned org (NOT A BUG; verification)
**Where:** `/` while session is pointed at an org that has not been SME-Mart-provisioned (ZeroBias Foundation in this run).
**Behavior:** `onboarding-guard` correctly rejects, redirects to `/onboarding/platform-engagement`, holding-page renders ("Your organization is being set up").
**Verdict:** ✅ As designed. Confirms the gate post-D-49-MIGRATE + errata 037 fix is still working.
**Action:** None.

### F-2 — `/projects` cross-org leak fix verified
**Where:** `/projects` (My Projects list).
**Behavior:** Only W3Geekery's depth-2 ZeroBias Platform card shown. No Brian's-Org leak (which the unscoped `platform.Project.list` call previously caused).
**Verdict:** ✅ commit `cef2076` (ownerId scoping on Project.list) verified live.
**Action:** None.

### F-3 — Project card description renders D-51 verbiage cleanly
**Where:** `/projects` card body + project-detail page.
**Behavior:** Description reads *"W3Geekery's gateway into ZeroBias — tasks, notes, and communication tied to the platform services engagement with ZeroBias Platform live here."*
**Verdict:** ✅ D-51 (supersedes D-35) applied; em-dash retained per intent; no arrows.
**Action:** None.

### F-4 — Project breadcrumb parent crumb was the "Engagements" list, not the engagement name (FIXED IN WALKTHROUGH)
**Where:** `/project/:id/overview` page-breadcrumb.
**Initial behavior:** Crumb rendered `Engagements > ZeroBias Platform` (parent = list-page fallback).
**Root cause:** `SmeMartProjectService.transformPlatformProjectToSmeMartProject()` line 497 was hard-coding `engagementId: null` ("not available in platform.Project shape"). After D-46/D-50 the depth-2 Project's `parentId` IS the depth-1 Engagement Project's id; transform now hydrates `engagementId` from `proj.parentId`.
**Fix:** commit `b4c5271` (5 insertions).
**Verdict:** ✅ Fixed live; crumb now reads `Engagement with provider ZeroBias Platform > ZeroBias Platform` with the parent linking to `/engagements/:engId/projects`.
**Action:** None (committed).

### F-5 — Page-breadcrumb `max-width: 32ch` truncates the full engagement name
**Where:** Engagement detail breadcrumb (and likely anywhere the engagement title appears in a crumb).
**Behavior:** "Engagement with provider ZeroBias Platform" (~43 chars) renders as `Engagement with provider ZeroBias Pl…` due to `.crumb-label { max-width: 32ch }`.
**Severity:** Cosmetic.
**Action:** Suggest bumping to `48ch` in `page-breadcrumb.component.ts` styles (or making it a signal input for callers who want tighter). Defer to next polish pass.

### F-6 — Phase 31-B form-pre-fill works, but section card stays "0 items" until user Saves → mismatches V14-08
**Where:** `/org/profile` Corporate Identity section.
**Behavior:**
- Phase 31-B commit `4a01820` implements form-field pre-fill: `legalEntityName` is hydrated from `Org.name` when the user clicks "Add Corporate Identity Item". Verified in a11y snapshot (`uid=13_4 textbox "Legal Entity Name" required value="W3Geekery"`).
- 31-B does NOT auto-create a Corporate Identity item on page load. Section card shows "0 items" until the user actively Adds → Saves.
- V14-08 success criterion in `.planning/director/phase-31-brief.md` v2 reads: *"Corporate Identity section auto-populated from ZB Org fields on first load (no empty cards in the customer's primary onboarding tab)."* — implies section-level pre-population, not form-level.

**Severity:** Misalignment between V14-08 brief language and shipped 31-B scope.
**Three resolution paths:**
1. **Relax V14-08** to match shipped behavior: "Corporate Identity form pre-fills legalEntityName from Org.name on Add." (lowest cost)
2. **Land an additional auto-create step** so Corporate Identity has 1 item on first load with legalEntityName populated. (adds ~2-3 hrs; risk: writes garbage data to MarketplaceProfileItem for orgs that never visit /org/profile)
3. **Defer V14-08 to v1.5+ alongside BACKLOG-098 streams 2+3** — accept that v1.4's onboarding experience leaves the section empty.

**Recommendation:** path 1 + ensure F-7 (BACKLOG-103) ships so the pre-fill is actually visible.
**Action:** Director decision required.

### F-7 — BACKLOG-103 (theme-blind Add-Item dialog) reconfirmed in walkthrough; blocks F-6 visibility
**Where:** Click `+` on any section card → modal "Add `<section>` Item" dialog.
**Behavior:**
- Dialog renders with a hard-coded white panel background.
- All input fields have white backgrounds.
- Labels + placeholder text + Cancel button text + Save button text are white-on-white → invisible in dark mode.
- Dialog title reads `"Add Corporate_identity Item"` — section key (`corporate_identity`) is interpolated raw, only the first letter title-cased.
**Verdict:** Existing entry **BACKLOG-103** (filed 2026-05-14). Reconfirmed today. This is what blocks F-6's user-visible pre-fill: the legalEntityName field IS pre-filled with "W3Geekery" but the user literally cannot see it.
**Action:** Promote BACKLOG-103 into v1.4 if we want a clean Pass 1 dogfood. Effort 1-2 hrs.

### F-8 — Hierarchy-breadcrumbs row redundant with page title post-D-51 (cosmetic / future cleanup)
**Where:** Engagement detail header.
**Behavior:** Two rows of header chrome — page-breadcrumb (`Engagements > {title}`) AND hierarchy-breadcrumbs (`engagement.zerobias-to-w3geekery [Engagement]`). The latter is the legacy engagement-internal hierarchy nav. For the current v1.4 default-engagement use case it's noise — the page title already says "Engagement with provider ZeroBias Platform" and the tag value adds no user-visible navigation affordance.
**Severity:** Cosmetic / IA-cleanup candidate.
**Action:** Backlog for v1.5+ IA pass (when middle-tier Workspaces/Apertures/Threads land per D-46/D-50, the hierarchy-breadcrumbs row becomes load-bearing again — don't kill it now).

### Withdrawn observations (initially flagged, then verified intentional)
- **W-1:** "My Engagements" + "My Projects" still in user dropdown — initially flagged as 31-A nav-cleanup regression; verified intentional per parkit-11 commit `f0dbec8` ("restore dropdown links" after rename `/my/engagements` → `/engagements`).
- **W-2:** "Settings" as top-level dropdown item — pre-existing since file inception, intentional quick-access shortcut.

## Pass 1 status: PARTIAL

Verified surfaces (10):
- Onboarding gate (unprovisioned org → holding page) ✅
- Org switcher / Switch Organization submenu ✅
- `/` welcome with Buyer/Provider/Both cards ✅
- `/projects` list (cross-org leak fix verified) ✅
- Project drill-down ✅
- Project breadcrumb (fixed in-walkthrough at `b4c5271`) ✅
- Project tabs (Overview, Boards, Notes, Documents, More) ✅
- Project triple-dot menu correctly gated hidden ✅
- Engagement page (breadcrumb + level label + status pill + tabs incl. no Details) ✅
- Engagement Projects tab (heading dropped, cross-org leak fixed) ✅

Remaining surfaces (TBD this session):
- Services + RFPs main-nav (should be Coming Soon)
- Coming Soon placeholder routes (`/org-documents`, `/engagement-dashboard`, `/message-center`)
- `/my-profile` (Settings tab only; others Coming Soon)
- `/admin` tabs (incl. Provisioning for Pass 2 setup)
- Brian's-Org Pass 2 (orphan recovery — exercise the provisioner cross-org orchestration end-to-end)

## Director recommendations

1. **F-7 (BACKLOG-103) — promote to v1.4 hotfix.** Without it, F-6's form pre-fill is invisible, V14-08 is effectively unmet, and any customer Add-Item interaction looks broken.
2. **F-6 — adopt path 1** (relax V14-08 wording to match shipped 31-B). Brief edit, no code change.
3. **F-5 (breadcrumb truncation)** — polish-sweep candidate, not blocking.
4. **F-8 (hierarchy-breadcrumbs)** — leave alone for v1.4; revisit when middle tiers land.

Continue Pass 1 (Services / RFPs / Coming Soon routes / my-profile / admin) before declaring Pass 1 done and starting Pass 2.
