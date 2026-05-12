---
id: "032"
severity: low
phase: 29.5
found: 2026-05-12
status: placeholder
---

# Errata 032 — `platform.Project.get` Omits `parentId` for Top-Level Projects (Not `null`)

**Date:** 2026-05-12 (Wave 4 checkpoint, Plan 06 SDK round-trip)
**Severity:** Low (cosmetic SDK shape note; affects strict-equality checks only)
**Type:** SDK serialization convention observation
**Phase:** 29.5 (found)

## What happened

Plan 06 Assertion 1 (`platform.Project.get(4617e9d7-...)`, depth 1 Engagement Project) found that the response payload **omits the `parentId` field entirely** rather than returning `{"parentId": null}` for top-level Projects.

Functionally equivalent for:
- `!parentId` checks (both undefined and null are falsy)
- `parentId == null` checks (loose equality matches both)

NOT equivalent for:
- `parentId === null` strict-equality checks (fails on the omitted variant).
- Test assertions like `expect(parentId).toBeNull()` (fails on undefined).

## Root cause

SDK serialization strips null fields from response payloads. The `create` request still accepts (and Plan 02 v3 still passes) `parentId: null` explicitly — that part of the round-trip works. The asymmetry is in the response shape, not the request shape.

## Impact

- **Spec assertion drift:** `provisioner.service.spec.ts` v3 (commit `523e924`) uses `.toBeNull()` on the post-create read-back for top-level Project assertion. This would fail if the spec exercised a true round-trip (create → get → assert) instead of asserting on the request body. Specs still pass at HEAD because they assert on the `create` call's request body, not the get response. Latent drift, not active failure.
- **Dual-read code (Plan 03's `engagements.service`):** If any consumer uses `=== null` to detect top-level Projects, it will misclassify. Empirically the v3 code uses `!parentId` patterns, so this is fine in current code. Verify on Phase 31 work.

## Fix prescription

**No standalone fix. Touch-It-Fix-It scope when the next edit touches these files.**

1. **`provisioner.service.spec.ts`** — when next edited (likely Phase 31 namespace-migrate work), change top-level read-back assertions to `.toBeFalsy()` or `.toBeUndefined()`. Add a one-liner comment citing this errata.
2. **`engagements.service.ts` dual-read** — when next edited, audit any `parentId === null` patterns and replace with `!parentId` or `parentId == null`. Already correct at HEAD per quick scan.
3. **`platform.Project.create` request shape** — unaffected. Continue passing `parentId: null` explicitly per current code.

## Disposition

- **NO backlog entry.** Touch-It-Fix-It rule covers the cleanup. The Phase 31 namespace-migrate work will touch both files; this errata gets resolved as part of that.
- **NO 29.5 hotfix.** Latent, not active. Specs pass at HEAD.
- **Status: placeholder.** Future-phase context, not a bug.

## Related

- Plan 06 SUMMARY § Observation 1.
- Errata 030 (D-49 namespace drift — same file scope, will be the natural Touch-It-Fix-It trigger).
- Memory: `feedback_tsc_spec_config_gate.md` (verification discipline that surfaces shape drift).
