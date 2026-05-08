# Phase 29.5 Brief — Platform Model Migration

**Director note 2026-05-08:** drafted in response to Nic's 2026-05-08 SDK release announcing real platform Project / Board / scoped-role primitives. Reconciles SmeMart's GraphQL data model with the new platform models, retires SmeMart classes that are now redundant, refactors consumers. Phase 30 (Default Project board) is paused upstream of this — once 29.5 lands, Phase 30's brief simplifies substantially because the primitives it needed now exist server-side.

**Trigger source:**
- `.planning/notes/projects-boards-models.md` — Nic's quick-reference for the new models (Board, Project, RoleScope, ResourceTypeEnum additions).
- 2026-05-08 SDK bump (`c550743`) bringing in `@zerobias-com/zerobias-angular-client@1.1.39` + transitive `platform-sdk@1.1.16` / `portal-sdk@1.1.16` / `hydra-sdk@1.0.7`.

**Where it slots:** v1.4 milestone, decimal insertion between deferred Phase 29 and active Phase 30. Same pattern as Phase 27.5 (inserted between 27 and 28 for modernization enforcement).

---

## Goal

Replace SmeMart's GraphQL-class-based modeling of Projects, Boards, and (where possible) Tasks with calls to the new platform / portal / hydra SDK endpoints. Retire SmeMart schema classes that now have first-class platform analogs. Refactor app services and components to consume the new models. Confirm existing demo data still reads correctly post-migration.

The reason we're doing this NOW (rather than v1.5 or after Phase 30): Phase 30 was paused waiting for these primitives. Building Phase 30 on top of SmeMart-side analogs and then retiring them later is double the work. Phase 30 brief refreshed at `b7f9b80` is going to be substantially rewritten downstream of 29.5 anyway.

## Non-goals (out of scope)

- **New user-visible features.** Pure migration; demo flow + admin Provisioning tab + My Engagements behavior are unchanged externally.
- **PERMS-AUDIT-1 implementation.** Hydra `addRoleMemberScope` / `RoleMembershipScope` is now available — backlog entry should be updated to note the primitive exists — but actually wiring scoped role grants into SME Mart is a separate phase.
- **Engagement entity refactor.** `Engagement` still has no platform analog. Pipeline.receive Engagement persistence stays.
- **Hub-side data migration.** Existing `SmeMartProject` records on the auditgraph remain readable; we do not backfill them into `platform.Project`. New provisions create platform.Project records going forward; existing records get a read-compat path or are surfaced via a deprecation notice.
- **Form / UI redesigns** that "while we're touching it…" might tempt. Touch-It-Fix-It rule (modernization) applies on touched files only, not a sweep.

## Locked decisions (carry into discuss-phase)

1. **Phase number: 29.5.** Decimal insertion. Matches 27.5 pattern. Does not collide with deferred 29.
2. **Single phase, with 29.5a / 29.5b split as discuss-phase escape hatch.** If gsd-planner's task graph exceeds ~25 tasks or two clearly-separable concerns emerge (audit vs. migration vs. schema retirement), split there. Default = single phase.
3. **Provisioning recipe gets flipped, not preserved.** The Step D `Pipeline.receive` SmeMartProject create becomes `platform.Project.create`. New Step F is `platform.Board.create` for the default kanban board. Step C (Engagement) stays Pipeline.receive (no platform analog).
4. **Engagement -> Project link strategy.** Today: Engagement.objectId references SmeMartProject by UUID via Pipeline-receive payload. Post-migration: Engagement.projectId stores the `platform.Project.id` UUID. The link is platform-resource-id pointing at a real platform.Project — same UUID-typing, different resource class.
5. **Schema retirement happens IN this phase.** Don't defer the schema PR to a later milestone — gives us cohesion (one PR per concept, one verification cycle). Schema repo PR cycles via Daniel Rojas.
6. **Existing demo data: leave in place.** SmeMartProject records continue to be readable through hydra/auditgraph. Read paths consume both `platform.Project.list` AND existing GQL `SmeMartProject` (dual-read) until the data ages out organically. NOT a one-shot migration script.
7. **Touch-It-Fix-It modernization rule applies.** Phase 27.5's lint enforcement is in effect; every file touched gets brought to spec.

## Open questions (resolve in discuss-phase or before via MCP describe)

1. **`membershipPolicy` accepted values.** Nic's quick-ref says `NewProject.membershipPolicy` is required, but doesn't enumerate. Need MCP `zerobias_describe('platform.Project.create')` to get the enum.
2. **Does `platform.Task.create` server-default `boardId` from session?** Critical risk: provisioning recipe Step B creates an Engagement Task. If Task.boardId is now required AND server doesn't default it, recipe fails on next run. Three resolution paths: (a) server defaults — no recipe change; (b) caller provides — recipe creates Board first then Task with that boardId; (c) opt-out — Task.boardId nullable. MCP describe will tell us which.
3. **Default `Project.parentId` for our use case.** Do we want each org's "ZeroBias Platform" project nested under a parent ZB-org-level project for governance, or top-level orphan? Default to top-level orphan; revisit if Brian/Kevin signals otherwise.
4. **Existing SmeMartProject record behavior post-retirement.** If we remove the schema class from the schema repo, do existing records become unreadable, or just unwritable? Need confirmation from Daniel Rojas / Nic on schema-class lifecycle semantics. Worst case: keep the class, just stop creating new records.
5. **Phase 30 + 31 dependency confirmation.** Phase 30 (Default Project board UI) and Phase 31 (W3Geekery as first customer + smoke test) both presumably depend on 29.5 landing first. Confirm during discuss-phase that there's no overlap that would let 30 start in parallel.
6. **Naming conflict surface.** `SmeMartProjectService` is the existing service. Post-migration, does it become a thin wrapper over `platform.Project` APIs (keeping the consuming-component imports stable), or get renamed to `ProjectService` and consumers migrated? Default: keep the name, change the implementation.

## Inventory bucket — KEEP / RETIRE / RECONCILE

To be filled in during discuss-phase via grep + MCP-describe + code reading. Skeleton:

| SmeMart class | Platform analog | Disposition | Notes |
|---|---|---|---|
| `SmeMartProject` | `platform.Project` | RETIRE | Direct 1:1 swap. tagId field carries our identity tag. Visibility/membershipPolicy map TBD. |
| `SmeMartBoard` (if exists) | `platform.Board` | RETIRE | Default board per project. boardType=kanban most common. |
| `SmeMartTask` (if exists) | `platform.Task` (already exists, gained boardId) | RECONCILE | If we have a SmeMartTask class, move to platform.Task. |
| `Engagement` | (none) | KEEP | No platform analog yet. Pipeline.receive persistence stays. |
| `MarketplaceProfileItem` | (none) | KEEP | Vendor profile sections, SmeMart-domain specific. |
| `EngagementVettingItem` | (none) | KEEP | Engagement-specific vetting items. |
| RFP / Bid / Note / NoteFolder / Document / Vetting / ServiceOffering / etc. | (varies) | TBD | Audit each in inventory phase. |

The audit deliverable should produce a populated version of this table as `.planning/phases/29.5-.../INVENTORY.md` consumed by the planner.

## Scope buckets (work units)

1. **Inventory & classification** — read `package/w3geekery/sme-mart/schema-classes/` (or wherever schema lives), grep for SmeMartProject / SmeMartBoard / SmeMartTask references in `src/`, MCP-describe new platform / portal / hydra endpoints. Produce INVENTORY.md.
2. **Provisioning recipe rewrite** — `platform-engagement-provisioner.service.ts` Step D flipped; new Step F (`platform.Board.create`). Constants block updated. Spec rewritten.
3. **Service refactors** — `SmeMartProjectService` rewired to call `platform.Project.list / search / get / create / update`. New `PlatformBoardService` (or fold into project service). Read paths in `engagements.service.ts`, `my-engagement-list.component.ts`, `my-projects.component.ts` (if exists), etc.
4. **GQL query refactor** — wherever a service queries the SmeMartProject GQL class (via `GraphqlReadService.buildQuery`), swap to `platform.Project.list` / `portal.Project.search`. Note: `platform.*` calls aren't GQL — they're direct SDK methods. Read shapes will change. ProjectExtended has `boardCount`, `memberCount` etc. — UI may need to update.
5. **Resource type handling** — grep `ResourceTypeEnum`, `resource_type`, `'project'`/`'board'` string literals. Most likely sites: demo-visibility post-filter, resource-link rendering, navigation.
6. **Schema retirement** — `zerobias-org/schema` PR removing retired classes from `package/w3geekery/sme-mart/`. Daniel Rojas approval.
7. **Verification & UAT smoke** — full provisioning recipe end-to-end on a clean test org. My Engagements scope. Admin Provisioning tab. Existing demo data still readable. Lint + tsc + 1757 tests + targeted board/project specs.
8. **Director docs** — DECISIONS.md entry for the model-migration decisions; DIRECTOR-PARKS-RESUME.md update.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `platform.Task.create` requires `boardId`; recipe currently doesn't supply one. | HIGH if true (provisioning breaks on next live run). | Verify via MCP describe FIRST (before any code change). If required, recipe creates Board first, then Task. |
| Schema retirement breaks existing demo data reads. | MEDIUM | Keep classes in schema (deprecate but don't delete) until existing data ages out OR verify schema-class lifecycle allows orphan reads. |
| `platform.Project.list` returns shape differs from current `SmeMartProject` GQL projection. | MEDIUM | Audit consuming component read shapes; ProjectExtended fields may need different rendering. |
| Cross-fork coordination delay on schema repo PR. | LOW | Daniel Rojas reviews quickly when pinged; accept delay as parallelizable work. |
| `membershipPolicy` value unknown. | LOW | MCP describe in discuss-phase; unblock before plan write. |
| The provisioning recipe was JUST locked yesterday (2026-05-07). Flipping Step D is more churn. | LOW | Justified — flipping NOW is cheaper than maintaining two recipes. Recipe still locked at the verbiage layer (constants block); only the persistence backend changes. |

## Verification criteria (UAT smoke)

1. Provisioning recipe (Dry Run + Provision) on a fresh test org creates: hydra Tag, Engagement (Pipeline.receive), Engagement Task (`platform.Task.create`), Project (`platform.Project.create`), Default Board (`platform.Board.create`).
2. Admin Provisioning tab still lists orgs, status probes work, Dry Run + Provision buttons function.
3. My Engagements page scope-by-org still shows correct subset.
4. Existing W3Geekery + Auditmation Dev demo data still readable on the page.
5. ZB Platform Governance app shows the new Project + Board records.
6. Resource navigation / linking handles `project` / `board` resource types without falling through.

## Estimate

8-15 hours. Heavy on inventory + service refactor + schema PR coordination. Lighter on provisioning recipe (the persistence step is one method swap; the rest of the recipe is unchanged). Smoke test is half a session. Risk of sprawl if existing read paths fan out further than expected — escape hatch is split into 29.5a / 29.5b.

## How to use this brief

Clark runs:

```
/gsd-insert-phase 29.5 .planning/director/phase-29.5-brief.md
```

This adds Phase 29.5 to the v1.4 ROADMAP between deferred 29 and active 30. Phase 30 brief should be re-evaluated downstream of 29.5 closure (likely substantially simpler).

Then:

```
/gsd-discuss-phase 29.5
```

Resolve the open questions (especially the boardId-required risk). Plan after.
