---
id: "038"
severity: medium
phase: 31
found: 2026-05-13
status: fixed
---

# Errata 038 — Stale `sessionStorage` Org-Id (Non-Member) Black-Holes User on Holding Page

**Date:** 2026-05-13 (surfaced during Phase 31 pre-walkthrough Chrome DevTools triage)
**Severity:** Medium (any user with stale sessionStorage hits this; no recovery affordance)
**Type:** Routing UX bug — when the cached session org-id points at an org the user isn't a member of, the guard short-circuits with empty `orgName` and routes to the holding page; the user has no way to recover except manual sessionStorage edit.
**Phase:** Found 31 (pre-walkthrough); fix lands same day in same commit as errata 037.

## What happened

Phase 31 pre-walkthrough on local dev. Clark's `sessionStorage['zb-current-dana-org-id']` was set to Goshen Health's UUID (from a prior session). Clark is NOT a member of Goshen Health.

Guard flow:
1. `whoAmI` → Clark (`e7fa4f5f-...`)
2. `app.getCurrentOrgId()` → Goshen Health's UUID (from sessionStorage)
3. `listMyOrgs()` → returns Clark's actual orgs (W3Geekery, etc.). Does NOT include Goshen Health.
4. `orgs.find(o => o.id === <Goshen-Health-ID>)` → `currentOrg = undefined`
5. `orgName` stays `''`; `orgSlug` stays `undefined`
6. `getRequestOrgMember(userId)` → **404** twice (Clark isn't a member of the active org)
7. `isAdmin = false` (catch + default)
8. `isOrgProvisioned(orgId, '', undefined)` → short-circuit at `if (!orgId || !orgName) return false`
9. Returns false → guard routes to `/onboarding/platform-engagement`

User sees the holding page with the message "Your organization is being set up." This message is wrong — the real problem is the session org-id is stale. User has no recovery affordance (no org switcher UI on the holding page; logging out + back in doesn't reset sessionStorage; the SDK's `init()` would respect the cached org-id).

## Why caught at Phase 31 walkthrough

This is exactly the kind of user-experience defect that synthetic unit tests miss but a real walkthrough surfaces. Clark's local dev had stale sessionStorage from prior sessions; production users would hit this whenever sessionStorage retained an org-id that became invalid (org membership revoked, user invited to a different org and never explicitly switched back, dev environment leaks).

## Fix

When `currentOrg === undefined` after `listMyOrgs()`, recover gracefully:

1. If user has at least one valid org in their list, call `ZerobiasClientApp.selectOrg(orgs[0])` — uses the SDK's public API to (a) call dana's selectOrg backend, (b) update `sessionStorage` via `orgIdService.setCurrrenOrgId`, (c) reconnect the SDK with the new org. Then redirect to `/` so the guard re-runs against the corrected session.
2. If user has zero orgs (degenerate case), redirect to `/login`.

Log a warn-level message so the recovery is visible in console for debugging.

## Considered alternatives

- **(a) Just clear sessionStorage + reload.** Simpler but causes a full page reload (jarring UX) and depends on ZB SDK init picking the right org from listMyOrgs on its own. Less control.
- **(b) Trust the SDK to handle this itself.** It doesn't today — `getCurrentOrgId` returns the cached value regardless of whether it's still valid. SDK-side fix would be cleaner but is a platform ask, not a 3P-app fix.
- **(c) Show a "wrong org, please switch" page.** More work; (a) is good enough.

Chose the active recovery path — `selectOrg` to first valid org + redirect to `/` — because it surfaces a friendly outcome (user lands on their real org's home) without needing extra UI.

## Disposition

- Fix lands same commit as errata 037 (related routing fix; same touched file).
- Spec updated with two new tests: user-not-member-of-session-org → selectOrg+/, user-with-zero-orgs → /login.
- No BACKLOG entry needed — straight fix.

## Related

- Errata 037 (admin stuck on /onboarding/* — co-fixed)
- Phase 27 (auth gate + routing) — the originating phase
- Phase 31 (W3Geekery walkthrough) — surfaced this
- ZerobiasClientApp.selectOrg (`@zerobias-com/zerobias-client` 1.1.42) — the SDK API used by the fix
