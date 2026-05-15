---
id: "040"
severity: high
phase: 31-C
found: 2026-05-15
status: fixed
---

# Errata 040 — Provisioner Lands ownerId As Operator-Org In Cross-Org Provisioning

**Date:** 2026-05-15 (surfaced during Phase 31-C live dogfood on Brian's-Org)
**Severity:** High — cross-org provisioning produces Project rows owned by the marketplace operator (W3Geekery), not the target customer org. Target org's `platform.Project.list(ownerId: targetOrgId)` returns empty; engagement is invisible to the target's own discovery query; `isOrgProvisioned` keeps returning false; re-running provision creates duplicates.
**Type:** Behavioral — wrong assumption about NewProject payload precedence over session-derived ownerId.
**Phase:** 31-C (Brian's-Org dogfood pass).

## Background

Errata 036(b) recorded: *"Project.create payload's ownerId silently dropped (NewProject DTO has no ownerId field — server derives owner from session)."* That fix landed in `3a42e90` and corrected the constructor shape so the code stopped pretending to pass `ownerId` in the payload. But the **downstream consequence** — that cross-org provisioning needs to run in target-org session scope, not operator scope — was not corrected at the admin tab call site.

The admin tab's `provisionOrg()` flow (`org-provisioning-tab.component.ts`) deliberately switched dana-org-id BACK to the operator org (W3Geekery) before calling `ensurePlatformEngagement`. The comment at that line claimed:

> *"v3 recipe issues platform.Project.create against the operator-org scope; the recipe stamps the target org's IDs into the payload (ownerId, etc.) — those are data, not request scope."*

The first half (`Pipeline.receive lives in W3Geekery scope`) was stale — v3 recipe doesn't use Pipeline.receive. The second half (`ownerId is data, not request scope`) is the broken assumption: there is no payload ownerId field, so the request scope IS the only signal the server reads.

W3Geekery self-dogfood masked the bug because operator == target, so session-derived ownerId happened to match the desired target ownerId by coincidence. Brian's-Org is the first true cross-org case (operator W3Geekery, target Brian's-Org); the bug surfaced immediately.

## Live evidence (UAT, 2026-05-15)

After running admin-tab provision on Brian's-Org (`d6810036-fbc1-54c2-b01d-1496fc14ed32`):

```
platform.Project.list (no ownerId filter, in W3Geekery context):

  Engagement Project — "Brian Hierholzer Inc. <- ZeroBias"
    id:       a2eb8689-508d-4430-ab96-2a9671fdcac7
    ownerId:  cd7105df-523d-5392-9f9a-3f83d3f30107   ← W3Geekery (WRONG; should be Brian's)
    tagId:    0ac97b7a-96df-4dd7-a4fa-7512e5fd6198   sme-mart.engagement.zerobias-to-brianhierholzer ✓
    parentId: null ✓

  Project tier — "ZeroBias Platform"
    id:       5621d2a0-b3bb-4aab-a542-1b742d0758d6
    ownerId:  cd7105df-523d-5392-9f9a-3f83d3f30107   ← W3Geekery (WRONG)
    tagId:    420b0753-e72c-4b81-8929-70508a119bf0   sme-mart.tier.project ✓
    parentId: a2eb8689-... ✓
```

Symptoms in UI: Brian's-Org engagement appeared under W3Geekery's engagement list (ownerId match) and was absent from Brian's-Org's own engagement list (no ownerId match).

Auto-Boards (created by platform.Project.create as a side effect) inherit the wrong ownerId:
- `026b5d3e-6091-4497-b377-57ff4c4b3df2` "Brian Hierholzer Inc. <- ZeroBias Board" — ownerId W3Geekery
- `e7c59131-7115-46c5-abc6-df855a73700e` "ZeroBias Platform Board" — ownerId W3Geekery

Tag (Step A) was correctly owned by the marketplace operator — that's by design (D-50, marketplace-singleton tag). Tag ownership is payload-driven via `CreateTagBody.ownerId` (`MARKETPLACE_OPERATOR_ORG_ID`), session-independent.

## Why platform.Project.update can't fix in place

`UpdateProject` body has no `ownerId` field either (verified via `zerobias_describe platform.Project.update`). So in-place ownership transfer is **not possible** via current platform API. Only paths: (a) delete + re-provision under correct context, or (b) platform feature request to add an explicit owner-attribution field to NewProject/UpdateProject. (a) was chosen for this fix.

## Fix landed

`src/app/pages/admin/tabs/org-provisioning-tab.component.ts` — removed the `switchOrgContext(originalOrgId)` call between party resolution and `ensurePlatformEngagement`. The recipe now runs in target-org session scope throughout. Finally-block restore to operator scope preserved.

Class-level docstring updated to reflect the corrected sequence (steps 4–5 collapsed into "stay in target context for the recipe; restore in finally only").

Spec `org-provisioning-tab.component.spec.ts` updated: the test previously titled *"switches back to original org BEFORE invoking the recipe (Pipeline.receive lives in W3Geekery)"* — both the title and the assertion — now reads *"stays in target org context for the recipe call (errata 040)"* and asserts the most recent pre-recipe `setCurrrenOrgId` call is the target org.

All 11 admin-tab specs pass; provisioner spec (20/20) unaffected.

## Cleanup of UAT data

The orphaned Project rows (and their auto-Boards) on UAT need deletion before re-running provision, otherwise the idempotency probe may not detect them as "the right org's engagement" (ownerId mismatch) and re-creation would compound the problem. Cleanup performed:

- `platform.Project.delete(5621d2a0-...)` Project tier (delete child before parent)
- `platform.Project.delete(a2eb8689-...)` Engagement Project
- Auto-Boards cascade-delete with their parent Project (verified empirically)
- Engagement tag `0ac97b7a-...` left in place — correctly owned, re-provision will reuse it via the NEW-namespace probe in `ensureTag`

Re-provision after fix produced correct ownerId on both Projects — verified by repeat `platform.Project.list` query.

## How to avoid this class of bug

1. **Audit assumption: payload-side overrides session-side.** Whenever a recipe involves cross-org operations, verify which fields the SDK actually accepts vs. which it ignores. Test cross-org explicitly — same-org dogfood masks session-derivation bugs.
2. **Comments are evidence, not source.** The misleading "Pipeline.receive lives in W3Geekery" comment was a stale carryover from a previous recipe version. Stale comments + new code without updating them is a smell — the comment claimed an architectural reason that wasn't valid for v3.
3. **errata 036(b) was narrowly framed.** It noted "NewProject has no ownerId field" but didn't carry that finding through to the call site that depended on the opposite assumption. Future errata that describe payload/session asymmetries should explicitly enumerate downstream call sites that need adjustment.

## Related

- Errata 036(b) (`as never` casts; constructor-shape fix landed in `3a42e90`; downstream session-scope correction NOT landed at that time — this errata is the follow-on).
- Parkit-10 RESUME finding: *"NEW: NewProject DTO has no ownerId field. For cross-org provisioning... the admin tab requires session-switching to the target org before provisioning works correctly."* — anticipated the fix; this errata documents the live verification + correction.
- D-50 (marketplace-operator tag ownership — unaffected; tag uses payload-driven ownership which works from any session).
- BACKLOG / Director-side findings: open Kevin/Nic question — *should NewProject/UpdateProject have an explicit ownerId field?* For now, session-derived behavior is the contract; this errata adapts to it.

## Status

**Fixed** (`org-provisioning-tab.component.ts` change + spec update, 2026-05-15). Awaiting live re-provision verification on Brian's-Org after UAT cleanup.
