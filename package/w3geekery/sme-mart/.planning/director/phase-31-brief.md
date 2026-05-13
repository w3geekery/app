# Phase 31 — W3Geekery as First Customer + Production Smoke Test (v2)

**Milestone:** v1.4 "3P Onboarding & Default Engagement" (closing phase)
**Est:** 8–12 hrs (was 4–6 hrs in v1; v2 absorbs 31-A nav cleanup + 31-B profile auto-populate)
**Repos:** `app/`
**Origin:** Errata 022 (`3p-plan-missing-w3geekery-as-first-customer-dogfood`). Closes the v1.4 loop with W3Geekery as the first real customer.

**v2 rationale:** Phase 31 pre-walkthrough on local dev 2026-05-13 surfaced two structural problems for the v1.4 milestone goal (customer logs in → populates profile → lands on board):

1. **Cross-contamination** of engagement Projects into `/rfps`, `/my/engagements`, `/my/projects` list pages (errata 039). Customer sees the platform-engagement artifacts as RFP cards — confusing + clicking them mis-routes.
2. **Empty org profile.** `/org/profile` renders 6 empty section cards with "Add item" buttons. Worst possible first impression (BACKLOG-098).

Fixing the architectural root cause of (1) requires the RFP-as-`platform.Project` decision in BACKLOG-099 — out of v1.4 scope. The pragmatic v1.4 answer is to **hide the non-dogfood nav surfaces** (31-A) and **promote profile auto-populate from BACKLOG-098 Stream 1** (31-B) into Phase 31. v1 brief deliverables 1-5 become 31-C.

## Goal

Customer logs in (W3Geekery user) → onboarding-guard routes correctly → profile is review-ready (auto-populated from ZB Org fields) → land on Phase 30 default project board. No new feature work; this phase is verification + the minimum cleanup to make the dogfood path clean.

## Scope — three sub-phases

### 31-A: Nav cleanup (hide stub surfaces; Coming Soon for placeholder routes)

The v1.4 critical path uses: login → org session → onboarding routing → `/org/profile` → `/` (Phase 30 board). Everything else is hidden or marked Coming Soon.

| Surface | Action | File |
|---|---|---|
| Main nav: **Services** | Coming Soon (route component swap) | `app.routes.ts` |
| Main nav: **RFPs** | Coming Soon (route component swap) | `app.routes.ts` |
| Dropdown: **Browse Providers** | Remove menu item | `user-profile-dropdown.component.html` |
| Dropdown: **Browse Catalog** | Remove menu item (route stays as ComingSoon for direct-URL hits) | `user-profile-dropdown.component.html` |
| Dropdown: **My Engagements** | Remove menu item (cross-contamination per errata 039) | `user-profile-dropdown.component.html` |
| Dropdown: **My Projects** | Remove menu item (cross-contamination per errata 039) | `user-profile-dropdown.component.html` |
| My Profile tabs: **Overview, Expertise, Services, Reviews, Moderate** | Coming Soon (child route component swap) | `my-profile.routes.ts` |
| My Profile tab: **Settings** | Stays functional (role + theme) | unchanged |

What stays in nav: Switch Organization, My Organizations, My Profile (Settings only), Request Assistance, Site Feedback, Admin.

**Reuse existing `ComingSoon` component** at `src/app/pages/coming-soon/coming-soon.component.ts` (Phase 30 pattern; same component used for `/catalog`, `/request-assistance`, `/feedback`).

**Reversibility:** comment out the original route components rather than deleting — restore is one-line per surface when the underlying feature is ready (post-BACKLOG-099 for /rfps + my-engagements + my-projects; post-product-decision for Services + My Profile tabs).

### 31-B: Auto-populate Org Profile from ZB platform Org fields (BACKLOG-098 Stream 1)

Goal: customer's first view of `/org/profile` is NOT empty cards. At minimum, the **Corporate Identity** section is pre-filled from data already available on `platform.Org`:

- Name → from `Org.name`
- Slug → from `Org.slug`
- Website → from `Org.website` if available (verify via Phase 25 audit)
- Address → from any Org address fields (verify)
- Year founded, EIN, leadership — if available on Org or hydra metadata (verify)

**Out of scope for 31-B (deferred to v1.5+):**
- LLM-prompt internet-gathering preflight (BACKLOG-098 Stream 2)
- Vetting Board fold (BACKLOG-098 Stream 3)
- Other 5 sections (Attestation, Insurance, Personnel, Financial, Reference) — leave empty for v1.4; they're already labeled "0 items" so customer understands they're additive

**Welcome-flash sub-issue** (`vendor-profile-tab.component.ts:152`) — the auto-dismiss-when-items-load logic causes a flash. Resolve as part of 31-B: either fix the mapping bug (items return with wrong section field) or gate the welcome card on `!isLoading()` to prevent the flash.

**Dependency:** Phase 25 (Platform Data Audit) — must reference its SDK inventory to know what Org fields exist.

### 31-C: Dogfood walkthrough + smoke test (original v1 scope)

**Pass 1: W3Geekery happy path**
- Log in as Clark/W3Geekery via branded login (or default ZB login fallback)
- Onboarding guard: probes both namespaces (post-`3a42e90`) → finds NEW tag → verifies Engagement Project exists → returns `true` → admin gets escape-to-`/` (post-errata 037)
- Lands on Phase 30 default project board
- Navigate to `/org/profile` → Corporate Identity section pre-filled (31-B)
- Verify D-32..D-35 verbiage on the default board
- Verify hidden nav surfaces are gone (31-A)
- Friction log populated

**Pass 2: Brian's-Org orphan recovery (real-data proof that errata 039 cross-contamination is dormant for hidden surfaces; D-49 dual-namespace probe verification)**
- Admin tab → re-provision Brian's-Org
- Onboarding guard: finds orphan legacy tag `fbf92e6e-...` → looks up Engagement Project by that tagId → none found → returns `false` (would have been false-positive `true` before D-49-MIGRATE)
- Provisioner runs: creates fresh NEW-namespace tag + Engagement Project + depth-2 Project tier
- Orphan legacy tag remains untouched per D-43 (d)

**Smoke-test report:** `.planning/director/v1.4-smoke-test-report.md` per v1 brief.

**Production promotion checklist:** `.planning/director/v1.4-production-promotion.md` per v1 brief.

## Requirements (refreshed)

- **V14-01:** UAT W3Geekery walkthrough end-to-end; report exists.
- **V14-02:** Per-phase verdict (24, 25, 26, 27, 28, 29.5, 30) in report.
- **V14-03:** Brian's-Org orphan re-provision verified — provisioner creates fresh NEW-namespace artifacts.
- **V14-04:** Any blockers → errata + hotfix phase queued.
- **V14-05:** Production promotion checklist drafted.
- **V14-06:** Friction log populated honestly.
- **V14-07 (NEW):** All 31-A nav cleanup landed; dogfood surfaces verified gone.
- **V14-08 (NEW):** `/org/profile` Corporate Identity section auto-populated from ZB Org fields on first load (no empty cards in the customer's primary onboarding tab).

## Dependencies

- Phases 24–28, 29.5, 30 shipped + merged. ✓
- PRECOMMIT-TSC-GATE-1 landed (`5e9e1b4`). ✓
- D-49-NAMESPACE-MIGRATE-1 + errata 036 fixes landed (`3a42e90`). ✓
- Errata 037 + 038 fixes landed (`80fff24`). ✓
- Tab reorder + default landing landed (`f830588`). ✓
- BACKLOG-098 Stream 1 (auto-populate ZB Org fields) — to be implemented as part of 31-B.

## Out of scope (deferred to v1.5+)

- BACKLOG-098 Stream 2 (LLM-prompt internet-gathering)
- BACKLOG-098 Stream 3 (Vetting Board fold evaluation)
- BACKLOG-099 (RFP-as-`platform.Project` architecture decision A/B/C — pending Nic's `setMetadata` response)
- Errata 039 fix (cross-contamination resolution depends on 099)
- Restoration of hidden surfaces (Services, RFPs, My Engagements, My Projects, Browse Providers, Browse Catalog, My Profile tabs) — restored phase-by-phase post-099
- Synthetic ACME demo seeder (v1.5 backlog)
- Automated smoke suite (v1.5+ test-infra milestone)
- Prod promotion execution itself — Phase 31 produces the checklist; actual promotion is Clark-driven

## Verification

- This phase IS the verification for v1.4 (verdict = smoke-test report).
- Meta-verification: replay Phase 24 visibility-gate against smoke-test user.
- Meta-verification: Brian's-Org Pass 2 is the live D-49-MIGRATE + errata 036 verification.
- 31-A cleanup verification: Chrome DevTools walk-through confirming all hidden surfaces unreachable from nav; Coming Soon pages render.
- 31-B verification: log in as a user in a fresh org (or Brian's-Org post Pass 2) and confirm Corporate Identity section is pre-filled, NOT empty.

## References

- Errata 022 (`.planning/director/errata/022-3p-plan-missing-w3geekery-as-first-customer-dogfood.md`)
- Errata 039 (`.planning/director/errata/039-platform-project-list-no-filter-cross-contamination.md`) — operational mitigation in 31-A
- BACKLOG-098 (Org Profile revamp — Stream 1 promoted into 31-B)
- BACKLOG-099 (RFP-as-`platform.Project` architecture decision — gating errata 039 fix)
- Phase 30 SUMMARY + VERIFICATION
- D-49 (engagement namespace), D-50 (tier mapping), D-46 (multi-engagement future state)
- `.planning/director/bootstrap-w3geekery-engagement.md` (walkthrough artifacts + UUIDs)
- DECISIONS.md "Default ZB Engagement Bootstrap — W3Geekery"
- DECISIONS.md "v1.4 Test-Infra Deferral and Unit-Test Default"
- Future: `.planning/director/v1.4-production-promotion.md`
- Future: `.planning/director/batch-prime-engagements-for-existing-orgs.md`

---

**Brief version:** v2 (refresh 2026-05-13 — absorbs 31-A nav cleanup + 31-B profile auto-populate)
**Brief v1 archived in git history (predecessor of this file)**
