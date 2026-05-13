---
id: "039"
severity: medium
phase: 31
found: 2026-05-13
status: deferred
---

# Errata 039 — `platform.Project.list` Called Without Filters Leaks Engagement Projects Into `/rfps`, `/my/engagements`, `/my/projects`

**Date:** 2026-05-13 (surfaced during Phase 31 pre-walkthrough Chrome DevTools triage; same triage cycle as errata 037 + 038)
**Severity:** Medium (visual cross-contamination + wrong-route on card click; doesn't block the v1.4 dogfood path because affected surfaces are being hidden/coming-soon-ified — see Phase 31 brief v2)
**Type:** Sibling to errata 036(a) — `as never` cast pattern hides positional-SDK signature mismatch at a different call site.
**Phase:** Found 31 (pre-walkthrough); fix deferred to v1.5+ after BACKLOG-099 architectural decision settles.

## What happened

Phase 31 pre-walkthrough on local dev as Clark/W3Geekery admin (post-errata 037 escape). Navigated to `/rfps` and saw two cards rendered with **D-32..D-35 verbiage from the W3Geekery platform-engagement Projects** (commit `3a42e90`):

- Card 1: `RFP` label + "ZeroBias Platform" + "W3Geekery's gateway into ZeroBias..." → this is the **depth-2 Project tier** (`e62b2446-...`)
- Card 2: `RFP` label + "W3Geekery <- ZeroBias" + "Platform Services Engagement: ZeroBias ➡️ W3Geekery" → this is the **depth-1 Engagement Project** (`4617e9d7-...`)

Same two cards (with same "RFP" label) also appear on `/my/engagements` and `/my/projects`.

## Root cause

Two coupled bugs, both downstream of the Phase 29.5 `platform.Project` migration:

### Bug 1 — `SmeMartProjectService.listProjects()` calls `Project.list` with no filter

`src/app/core/services/sme-mart-project.service.ts:137-155`:

```ts
const platformProjects = await Promise.race([
  this.clientApi.platformClient
    .getProjectApi()
    .list(pageNumber, pageSize),   // ← no ownerId, no tagId, no parentId
  timeout,
]);
```

The comment at the top of the method (line 33) **promises** "parentId (nil for RFPs) + tagId filter" but the implementation never passes those args. The SDK signature is positional (`pageNumber?, pageSize?, boundaryId?, ownerId?, status?, visibility?, sort?, pageToken?`) — no `tagId` or `parentId` exposed as server-side filters anyway. Result: every platform.Project the session can see comes back, including the org's engagement-tier and project-tier Projects.

`engagements.service.ts` has the equivalent issue on the engagements-list side.

### Bug 2 — `engagement-card.component.ts` discriminator is broken

`src/app/shared/components/engagement-card/engagement-card.component.ts:44`:

```ts
readonly isRfp = computed(() => !this.engagementTag());
```

A row is labeled "RFP" when `engagement_tag` is falsy. The mapping at `engagements.service.ts:434` is:

```ts
engagement_tag: proj.tag?.name ?? '',
```

But `proj.tag` is NOT populated by the bare `Project.list()` call — only `proj.tagId` (the UUID) is. So `engagement_tag` is always empty string for list-fetched Projects → `isRfp()` always returns true → every Project displays as "RFP" regardless of what it actually is.

When the card is clicked, `navigate()` at line 66-72 routes to `/rfps/{id}` for RFPs and `/my/engagements/{id}` for engagements. With the broken discriminator, engagement Projects mis-route to `/rfps/{id}` (where they don't exist as RFP records → not-found → fallback redirect).

## Why caught at Phase 31 and not Phase 29.5

Phase 29.5 (Platform Model Migration) validated the SDK round-trip on creation/read of single Projects. It didn't validate the list-page rendering paths against a populated org. Cross-contamination only shows when an org has BOTH engagement-tier Projects (D-49 namespace) AND any other Projects in the list result. W3Geekery's manual walkthrough on 2026-05-12 created the engagement-tier Projects; Phase 31 is the first time we navigated through the buyer-facing list pages with that data live.

## Disposition for v1.4

**NOT fixed in v1.4.** The architectural answer needed to fix this durably is BACKLOG-099 (RFP-as-`platform.Project` decision A/B/C). Without that decision, any hotfix bakes in a discriminator (tag-namespace? `projectType` GQL field? hydra Resource metadata?) that may need to change later.

**Phase 31-A** (`.planning/director/phase-31-brief.md` v2) hides the affected nav surfaces (`/rfps`, `/my/engagements`, `/my/projects` dropdown entries; main nav Services + RFPs → Coming Soon) so the v1.4 dogfood never lands on the contaminated pages.

## Disposition for v1.5+

BACKLOG-099 → research spike on hydra metadata (architecture C) → decision A/B/C → migration plan for any existing data → fix the discriminator + filter call sites + ship clean.

## Related

- Errata 036 (a) — sibling `as never` cast hiding positional-SDK shape mismatch (probe-side in provisioner.service.ts; fixed `3a42e90`)
- BACKLOG-099 — architectural decision blocking this errata's fix
- Phase 31 brief v2 — operational mitigation (hide nav surfaces)
- Phase 29.5 (Platform Model Migration) — origin of the leak
- D-46 (multi-engagement-per-org future state — makes this latent bug eventually load-bearing)
