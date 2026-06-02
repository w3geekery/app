# Provisioner Refactor — Governance-Node Model + Node-Role Tag Convention

**Date:** 2026-05-29 · **Rewritten:** 2026-06-01 to the locked D-52 model
**Author:** Director Parks
**Status:** ⚠️ GATED ON OWNERSHIP — do NOT execute yet. As of 2026-06-01 a Kevin/standup decision is pending: does default-engagement provisioning move INTO the platform (auto org-create hook + admin action + backend backfill)? **If platform owns it → SME Mart DEPRECATES this provisioner instead of executing this refactor.** Only execute the refactor below if the decision is "stays in SME Mart interim." (Slack to Kevin sent 2026-06-01; likely standup discussion.) Independent of that, also still blocked on the `governs` link-type id (RL-001 / task-13). All design DECISIONS are LOCKED — see DECISIONS.md **D-52**.
**Trigger:** (1) ui-meta-director structural change — Engagement is a governance node, not a containment tier (2026-05-29). (2) Node-role tag convention — Engagement + Program are node-ROLES off the tier ladder (D-52, 2026-06-01). (3) Kevin: ResourceMetadata killed → real fields; Clark: agreements→Requirements.

> **Ship structure-now with the `governs` link STUBBED** (deferred-governs workaround). The structure + tags are buildable today; only the `governs` `linkResources` call waits on the link-type id (RL-001 / task-13). An ungoverned interim Engagement node is a valid state — backfill the link in one additive pass when the id lands.

---

## Current state (what the provisioner does today — v3, pre-refactor)

`src/app/core/services/platform-engagement-provisioner.service.ts`:
- **Step A** — create/reuse hydra tag `sme-mart.engagement.zerobias-to-<slug>` (type `marketplace`, owner W3Geekery operator). Identity + tier-marker + probe key in one tag.
- **Step C** — create Engagement `platform.Project`, `parentId = null` (structural root), `tagId =` the sme-mart engagement tag.
- **Step D** — create child Project, `parentId = engagementProjectId`, `tagId = sme-mart.tier.project` (`420b0753…`).
- **Probe** (`isOrgProvisioned`) — find a `parentId==null` Project whose `tagId` ∈ the sme-mart engagement tags.

Consumers: `org-provisioning-tab.component.ts` (caller + cross-org switch), `onboarding.guard.ts` (calls `isOrgProvisioned`), specs for both.

## Target state (D-52 governance-node model)

Engagement is NOT the parent. The Engagement is a **standalone node** that **governs** a `project`-rooted delivery tree. Both the delivery root and the Engagement node are `project`-tier (`parentId=null`); they are distinguished by **node-role tags** + the `governs` link, NOT by tier.

```
Delivery root (platform.Project, parentId=null, tagId=project a1d2373c)   <- "Program" is a display role when governed
   |  parentId tree: workspace / aperture / thread / tasks (customer-extension; not auto-created)
   |
   ^  hydra ResourceLink "Engagement governs"   <- link-type id: BLOCKED (RL-001 / task-13)
   |
Engagement node (platform.Project, parentId=null, tagId=project a1d2373c, + `engagement` role tag)
   commercial seam: parties, MSA, vetting boards
```

**Verified facts (live UAT 2026-05-29 / schema 2026-06-01):**
- Global `project-tier` tags (owner System `00000000…`, type `project-tier`): `project` = `a1d2373c-c4b2-42d3-880a-05b1951d6361`; `workspace`/`aperture`/`thread` exist; `engagement` = `70d33288-abfb-4712-b489-00f1ce1f7f8e` (shipped as project-tier in PR #5 — now repurposed as the interim `engagement` node-role marker, pending a clean re-type owned by umd/Kevin).
- Ad-hoc `marketplace`-type tag creation works via `hydra.Tag.createTag` (no PR needed).
- **Parties are NOT structurally modeled** — `platform.Project` schema has no provider/client field (only `ownerId` = buyer); the provisioner creates no party links; provider=ZeroBias lives only in the D-51 display string (human-only).
- Legacy tags stay in place, no UUID churn: `sme-mart.engagement.zerobias-to-{sdi,miraxr,brianhierholzer,w3geekery}` + `sme-mart.tier.project` (`420b0753`). Not used by the new recipe.

## Tag convention (D-52)

- **No `sme-mart.` prefix.** **No per-engagement identity tag** (dropped — redundant: buyer = node `ownerId`, provider = constant ZeroBias).
- **Tier** = global `project-tier` tag set to `Project.tagId`. Both the delivery root and the Engagement node carry `tagId = project` (`a1d2373c`).
- **Node-role** = `engagement` applied to the Engagement node via `hydra.Tag.tagResource` (interim marker `70d33288`). `program` is NOT applied in the default flow (optional / derivable).
- **Engagement display name/description** = D-51 (unchanged).
- **No new node-role tagType needs registering now** — reuse `70d33288` as the interim `engagement` marker. (Open: a clean node-role tagType + `program` tag, when/if needed — node-role tagType mechanics are umd/Kevin-adjacent; not on our critical path.)

## Code changes

### `platform-engagement-provisioner.service.ts`
1. **Constants:** drop `ENGAGEMENT_TAG_NAMESPACE_NEW/LEGACY`, `SME_MART_TIER_PROJECT_TAG_ID`. Add `PROJECT_TIER_TAG_ID = a1d2373c…`, `ENGAGEMENT_ROLE_TAG_ID = 70d33288…`, and `GOVERNS_LINK_TYPE_ID` (**BLOCKED — RL-001 value; guard the link call behind its presence**). Keep operator-org + D-51 name/description constants.
2. **Drop Step A** (no identity tag minting).
3. **Replace Step C/D structure:**
   - Create **delivery root**: `NewProject(<org-default name>, active, internal, private, <desc>)`, `parentId = null`, `tagId = PROJECT_TIER_TAG_ID`. Org-domain default name, customer-renameable (no SME-Mart-coined "Program" string). No `program` role tag.
   - Create **Engagement node**: `NewProject(D-51 name, …, D-51 desc)`, `parentId = null` (standalone, NOT under the root), `tagId = PROJECT_TIER_TAG_ID`; then `tagResource(engagementId, ENGAGEMENT_ROLE_TAG_ID)`.
   - Create **`governs` link**: `hydra.Resource.linkResources(engagementId, rootId, GOVERNS_LINK_TYPE_ID)` — **guard behind `GOVERNS_LINK_TYPE_ID` presence; skip (stub) until RL-001 delivers.** One-directional write + possible reverse per [[feedback_task_links_bidirectional]].
4. **Rewrite `isOrgProvisioned`:** interim discriminator = a node in this org's scope wearing the `engagement` role tag (`70d33288`). (Sufficient because SME Mart is the only minter of engagements and all are default-ZB.) Tighten to also require the `governs` link + provider-party once both exist.
5. Return shape: `{ rootId, engagementId, created }`.

### `org-provisioning-tab.component.ts`
- Update result handling to the new shape. Cross-org `switchOrgContext` logic unchanged (still correct). Dry-run resolution unchanged.

### `onboarding.guard.ts`
- No logic change if `isOrgProvisioned(orgId, name, slug)` signature holds. Confirm the probe still answers "does this org have its default ZB engagement?" under the `engagement`-role discriminator.

### Specs
- `platform-engagement-provisioner.service.spec.ts` + tab spec — rewrite around the new structure (delivery root + standalone Engagement node + `engagement` role tag) and the stubbed `governs` link (assert it is NOT called while `GOVERNS_LINK_TYPE_ID` is unset; add a covered path for when it IS set).

## Dependencies (BLOCKERS)
1. **`governs` ResourceLink type id + shape + direction** — RL-001 / task-13 (`736b65ab-414b-4757-9397-10c1008379ed`), **FILED not delivered**. Blocks ONLY the `linkResources` call + the governs-verification half of `isOrgProvisioned`. The workaround ships everything else now.
2. SC-001 seed correction (depth-0 = `project`) is platform-side (umd) — our `projectTierHierarchy` reads should assume `project` at root once corrected.

## Invariant scope (R3 — D-52)

No universal "every Program is governed by ≥1 Engagement" invariant. Ungoverned Programs (personal/private/internal) are valid; no PS-003 backend guard. The provisioner's atomic create is the only enforcement, scoped to SME Mart's commercial flow — *we police only what we provision.* Our memex "Every SME Mart Project has a related Engagement" is therefore SME-Mart-commercial-scoped / true-by-construction, NOT a platform guarantee.

## Reconciled (post-D-52) — done
- **DECISIONS.md D-52** — written (supersedes D-49 + tier portion of D-50; D-51 unchanged). DEC #1 (identity namespace) + #3 (Program-root name) dissolved; #2 trivial (tagId = tier).
- **Hierarchy memex / `[[project_sme_mart_hierarchy_model]]`** — rewritten to the two-axis model.
- **Our `BACKEND_FEATURE_REQUESTS.md`** — RL-001 stake row added.

## Still to reconcile (docs, not blocking code)
- **BACKLOG-108 Vetting** — vetting boards on the Engagement node (not a depth-3 sub-Project).
- **BACKLOG-119 tier chip** — ladder = project/workspace/aperture/thread; node-role badge separate.
- **CE1 / CE-cluster** — under dissolution review (governance-node + scope-reduction pivot may absorb/relocate most of it).

## Sequencing
1. ~~Lock DECISIONS #1–#3~~ — DONE (D-52).
2. Get `governs` link-type from RL-001 / task-13. *(External; not blocking the structure+tags pass.)*
3. Execute the refactor in one pass (drop identity tag + new structure + `engagement` role tag + stubbed `governs`), specs green.
4. Re-run Joe/Luis/Dan provisioning on the new model (local dev + Org-Provisioning tab). Interim nodes are ungoverned-but-valid.
5. When RL-001 delivers: fill `GOVERNS_LINK_TYPE_ID`, backfill `governs` links (~5 pairs), tighten the probe.
