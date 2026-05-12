---
id: "034"
severity: medium
phase: 29.5
found: 2026-05-12
fixed: 2026-05-12
status: fixed
fix-commit: 1b5649f
---

# Errata 034 — v3 Amendment Caller-Spec Drift: `org-provisioning-tab.component.spec.ts` Still Expects Pre-v3 Signature

**Date:** 2026-05-12 LATE (pre-push verification before cross-fork PR)
**Severity:** Medium (1 failing test in full ng test suite; pre-push hook would have blocked push)
**Type:** Phase 29.5 drift defect — caller-spec out of sync with v3 amendment
**Phase:** 29.5

## What happened

The Plan 02 v3 amendment commit (`523e924`, 2026-05-12 EVE) "drop F+G, add tier tag, flip Workspace→Project tier" touched 3 files per the commit body:

> "523e924 touched 3 files (provisioner.service.ts + spec + org-provisioning-tab caller), net −129 lines."

That phrasing implied the **caller component** was updated. It WAS — `org-provisioning-tab.component.ts:241-244` calls `ensurePlatformEngagement` with the new slim 3-field signature `{ currentOrgId, currentOrgName, currentOrgSlug }`.

But the **caller's spec** — `org-provisioning-tab.component.spec.ts:255-262` — was NOT updated. The assertion still expects the pre-v3 6-field signature:

```ts
// Stale assertion (spec line 255-262):
expect(provisioner.ensurePlatformEngagement).toHaveBeenCalledWith({
  currentOrgId: TARGET_ORG,
  currentOrgName: 'Target Org',
  currentOrgSlug: 'targetorg',
  buyerUserId: TARGET_USER_PRINCIPAL,        // ← stale; v3 dropped Step G admin-membership-add
  assignedPartyId: TARGET_ORG_PARTY,         // ← stale
  accountablePartyId: TARGET_USER_PARTY,     // ← stale
});
```

Test result: 1 failed / 1761 passed (1762) at full ng test run pre-push.

## Root cause

The v3 amendment dropped Step G (admin-membership-add). Step G's removal eliminated the need for RACI party resolution at the recipe-call site (auto-Lead + D-48 cascade cover what Step G used to do explicitly). The provisioner.service signature was correctly slimmed to 3 fields; the component caller was correctly updated; the **caller's spec was missed**.

Plan 08's targeted gate ran only `provisioner.service.spec.ts + engagements.service.spec.ts + sme-mart-project.service.spec.ts` (50/50 PASS). It did NOT include `org-provisioning-tab.component.spec.ts` — the caller spec. So Plan 08's "all gates green" was true for the targeted set but masked this drift.

## Impact

- **Pre-push hook would have blocked the cross-fork PR push.** Caught here by running `npm test -- --watch=false` manually before push. Defense-in-depth worked as designed.
- **No runtime defect.** Production code is correct (component → provisioner call shape matches both ends).
- **Spec-only drift.** Fix is purely test-side; one assertion edit, no production code change.

## Fix prescription

**Director hand-fix (precedent: errata 028 `c19f9c9` one-line cast).** Drop the 3 stale fields from `.toHaveBeenCalledWith()` at `org-provisioning-tab.component.spec.ts:255`:

```ts
// After fix:
expect(provisioner.ensurePlatformEngagement).toHaveBeenCalledWith({
  currentOrgId: TARGET_ORG,
  currentOrgName: 'Target Org',
  currentOrgSlug: 'targetorg',
});
```

RACI constants (TARGET_USER_PARTY, TARGET_ORG_PARTY, TARGET_USER_PRINCIPAL) and their use in dry-run-result assertions (lines 168-170) STAY — dry-run still resolves and displays RACI parties; only the recipe call no longer needs them passed.

## Recurrence pattern

This is the same shape as **errata 027** (e178215 dropped public-API params, broke a consumer). When v3 amendment slims a service signature, every CALLER must be re-checked AND every caller's SPEC must be re-checked. Plan 08's targeted gate scope (touched-service specs only) systematically misses caller-spec drift.

**Process implication for Plan 08 (and future closure plans):** the targeted gate should include not just the modified services' specs, but also the specs of every direct CONSUMER of those services. Easier said than reliably enumerated; the durable fix is the pre-push hook running the full suite (which exists and just caught this).

## Disposition

- **Fix landed:** commit `1b5649f` ("fix(29.5): drop stale RACI fields from org-provisioning-tab spec assertion"). 3-line deletion from the assertion; RACI constants + dry-run-result assertions untouched.
- **Full suite verified green post-fix:** 1762/1762 passing (130 files). Same gate the pre-push hook will run.
- **Status: fixed.**
- **No new BACKLOG entry.** Plan-08-class targeted-gate scope is the recurring pattern; the durable fix is the pre-push hook, which already exists and just worked.

## Related

- Errata 027 (`e178215` dropped public-API params, broke a consumer) — same shape: service signature change without caller-spec audit.
- Errata 028 (verification-gate-skipping 5th occurrence) — same institutional pattern: agent claims green without running the comprehensive gate.
- Plan 02 v3 amendment commit `523e924`.
- Plan 08 commit `41c501c` (CLOSURE marked all gates green — true for targeted set, missed caller spec).
- `.husky/pre-push` hook (existing; runs `npm test -- --watch=false` on non-main branches; caught this defect before push).
