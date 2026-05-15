---
id: "041"
severity: high
phase: 31-C
found: 2026-05-15
status: fixed
---

# Errata 041 — `hydra.Tag.searchTags` Session-Scoped Visibility Hides Operator-Owned Tags

**Date:** 2026-05-15 (surfaced immediately after errata 040 fix on Brian's-Org Phase 31-C re-attempt)
**Severity:** High — blocks cross-org provisioning AND breaks `onboardingGuard` for non-operator users
**Type:** Behavioral — `hydra.Tag.searchTags` server applies a session-scoped visibility filter that hides operator-owned tags from non-operator sessions, breaking idempotent probes that depend on operator-owned tag visibility.
**Phase:** 31-C (Brian's-Org dogfood, second attempt after errata 040 fix)

## How it surfaced

After landing errata 040 (the provisioner now stays in target-org session scope through `ensurePlatformEngagement` so `platform.Project.create` lands with correct ownerId), the very next Brian's-Org Provision attempt failed with:

```
Provisioning failed: No such Tag: ed445a5d-9053-4fb7-9168-aa13726e4846
```

Server stack trace (from network response):

```
at TagDAO.getExtended (/opt/hydra-service/.../TagDAO.ts:217:13)
at TagApiController.createTag (/opt/hydra-service/.../TagApiController.ts:73:18)
```

That UUID (`ed445a5d-...`) did NOT exist in the SME Mart source tree (grep verified zero hits across repo + node_modules) nor on UAT (`hydra.Tag.getTag(ed445a5d-...)` returned the same "No such Tag" error). The UUID was server-generated mid-create-flow — hydra's `createTag` handler internally calls `getExtended(generatedId)` after the insert to return the full DTO. The read-back failed, leading to the buggy 404 response.

Root cause traced by MCP probe: when querying `hydra.Tag.searchTags` with `tagSearchBody.name = "sme-mart.engagement.zerobias-to-brianhierholzer"`:
- Scoped by `ownerIds: [d6810036-...]` (Brian's-Org) → **count=0** (empty)
- Scoped by `ownerIds: [cd7105df-...]` (W3Geekery, the marketplace operator) → **count=1** (the actual tag)
- No scoping (operator session calling for itself) → also returns count=1, masking the bug for W3Geekery self-dogfood

The tag IS owned by W3Geekery (correct per D-50 marketplace-singleton ownership pattern). hydra's `searchTags` applies an implicit session-scope visibility filter: queries from session X by default only see tags owned by X. Without an explicit `ownerIds` filter naming the actual owner, the search returns empty even when the tag exists.

## Why errata 040 surfaced this

Pre-040, the provisioner ran in the operator session (W3Geekery). `searchTags(name=...)` from operator session naturally saw operator-owned tags — the implicit visibility filter happened to align with the desired query. Idempotent reuse worked.

Errata 040 fixed the wrong-ownerId-on-Project bug by running the recipe in target-org session scope. That correctly puts the target as the owner of new Projects — but breaks `searchTags`, because the operator-owned tag is no longer visible from the target session.

So 040 + 041 are tightly coupled: 040 was needed to land the right Project ownerId; 041 was the immediate consequence — without it, idempotent reuse of operator-owned tags breaks.

## Also breaks `onboardingGuard`

`isOrgProvisioned()` (called by `onboardingGuard`) has the same `searchTags` call without `ownerIds`. Pre-fix, any Brian's-Org user logging into SME Mart would have their `isOrgProvisioned` probe return `false` (no operator-owned tag visible from their session) → routed to onboarding holding page even when the engagement exists. Same blind spot, different surface.

## Fix landed

`src/app/core/services/platform-engagement-provisioner.service.ts` — added `body.ownerIds = [MARKETPLACE_OPERATOR_ORG_ID as never];` to BOTH `searchTags` body constructions:

1. `isOrgProvisioned()` probe loop (Step 1 of the dual-namespace candidate scan, lines ~115-128)
2. `ensureTag()` probe (the idempotency check before `createTag`, lines ~204-210)

Both now explicitly scope the search to operator-owned tags so the lookup works regardless of caller's session scope. Tags are operator-owned by design (D-50); the search must match.

Provisioner spec (20/20) passes unchanged — existing mocks were tolerant of the additional body field. Future test hardening could add an explicit assertion that the search body includes `ownerIds: [MARKETPLACE_OPERATOR_ORG_ID]`; not done now to keep this fix surgical.

## Empirical verification

After fix landed, MCP probe `hydra.Tag.searchTags name="sme-mart.engagement.zerobias-to-brianhierholzer" ownerIds=[cd7105df-...]` returns the existing tag (count=1, id=0ac97b7a-...). Behavior matches the recipe's expectation. Cleared to re-run Brian's-Org provision; the orphan tag will be reused via the now-working idempotency probe.

## How to avoid this class of bug

1. **Server-side scope filtering is not always explicit in the API docs.** OpenAPI for `hydra.Tag.searchTags` doesn't say "filters by session scope unless ownerIds specified" — that's implicit hydra behavior. When designing a probe against a resource that has cross-org ownership semantics (operator-owned shared with target users), always pass explicit `ownerIds` in the query body. Don't rely on session-scoped defaults.

2. **Cross-org self-dogfood masks visibility bugs.** Errata 040 spec coverage was W3Geekery → W3Geekery (operator = target). Operator session can see operator-owned tags. Brian's-Org → Brian's-Org doesn't happen in our recipe (the recipe is always operator-driven, target-scoped for create). The truly new cross-org case (operator W3Geekery, target Brian's-Org with the recipe running in target's session scope) was introduced by 040 and is the first time this visibility quirk could surface.

3. **404 with a server-generated UUID is a server bug, not a client bug.** Hydra's createTag handler should respond with 409 Conflict on unique-name collision, not a 404 with a hallucinated UUID from its own internal post-insert getExtended call. Worth flagging to Kevin/Nic as a platform bug regardless of our client-side fix.

## Related

- Errata 040 (the change that exposed this — recipe now runs in target session scope; without 041, 040 makes the idempotency probe blind).
- D-50 (marketplace-singleton tag ownership pattern — `MARKETPLACE_OPERATOR_ORG_ID` owns all sme-mart tier + engagement-identity tags). This errata enforces the pattern at the query layer.
- D-43 (engagement tag namespace; co-existence with legacy `sme-mart.eng.*` tags). The dual-namespace probe inherited the fix; both candidate names are now scoped by ownerIds.

## Status

**Fixed** (`platform-engagement-provisioner.service.ts`, both probes, 2026-05-15). Awaiting live re-provision verification on Brian's-Org.
