---
id: "037"
severity: medium
phase: 31
found: 2026-05-13
status: fixed
---

# Errata 037 — Admin Stuck on `/onboarding/*` Holding Page After Guard Returns True

**Date:** 2026-05-13 (surfaced during Phase 31 pre-walkthrough Chrome DevTools triage)
**Severity:** Medium (Phase 31 walkthrough blocker; users land here and can't navigate away)
**Type:** Routing UX bug — guard returns `true` for admins on any URL, including `/onboarding/*`, without redirecting them off the holding page.
**Phase:** Found 31 (pre-walkthrough); fix lands same day in same commit as errata 038.

## What happened

During Phase 31 dogfood pre-walkthrough on local dev (`http://localhost:4200/`), after Clark switched the session org from Goshen Health (errata 038 case) to W3Geekery (`cd7105df-...`), the page reloaded but stayed at `/onboarding/platform-engagement` (the holding page). Network log showed zero hydra `tagSearch` POSTs — the dual-namespace probe (3a42e90) never fired.

Chrome DevTools inspection of `getRequestOrgMember(userId)` response body confirmed `"admin": true` for Clark on W3Geekery. The guard at `onboarding.guard.ts:101-103`:

```ts
if (isAdmin) {
  return true;
}
```

returns `true` for admins on any URL — including `/onboarding/platform-engagement`. The router interprets `true` as "user can stay here." So an admin who lands on the holding page (e.g., from a prior guard fire when their session was on a non-member org) gets stuck there with no redirect off.

## Symptoms

- Admin lands on `/onboarding/platform-engagement` → stays on it indefinitely.
- "Check again" button reloads → same outcome.
- Only recovery: manually edit the URL bar.

## Same bug also affects non-admin happy path

The same structural issue exists at the end of the guard:

```ts
if (!completionStatus) {
  return alreadyAt('/onboarding/company-profile') ? true : router.createUrlTree([...]);
}
return true;  // ← provisioned + profile complete on /onboarding/* gets stuck
```

A non-admin user who completes their profile and somehow lands back on `/onboarding/company-profile` (via back button, bookmark, etc.) would also get stuck.

## Fix

Introduce a `escapeOnboardingIfHappy()` helper: if URL starts with `/onboarding/`, redirect to `/`. Apply at every "user is past the onboarding gate" return:

1. After `isAdmin` check → admin should not be on `/onboarding/*`.
2. After `completionStatus === true` → fully provisioned user with complete profile should not be on `/onboarding/*`.

The "send incomplete profile to /onboarding/company-profile" branch unchanged — that's a legitimate routing TO an onboarding URL, not stuck-ON-it.

## Why caught at Phase 31 walkthrough and not Phase 27 verification

Phase 27's tests verified the SDK probe surface and the guard's UrlTree return for the "not provisioned" path. None of the tests exercised the "admin already on /onboarding/* navigates to it again" path; admins were tested with `mockState.url = '/'` only.

## Disposition

- Fix lands same commit as errata 038 (related routing fix; same touched file).
- Spec updated with three new tests covering admin on `/onboarding/platform-engagement`, admin on `/onboarding/company-profile`, and non-admin-but-fully-provisioned on `/onboarding/*`.
- No BACKLOG entry needed — straight fix.

## Related

- Errata 038 (non-member-of-session-org black hole; co-fixed)
- Phase 27 (auth gate + routing) — the originating phase
- Phase 31 (W3Geekery walkthrough) — surfaced this
