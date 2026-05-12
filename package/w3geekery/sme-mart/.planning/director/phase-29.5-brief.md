# Phase 29.5 Brief — Platform Model Migration

> **⚠️ 2026-05-12 PM CORRECTION — tier labels in this brief use "workspace Project" for the depth-2 child. That label is WRONG per the canonical Brian-2026-04-30 Hierarchy Editor sketch.** Depth 2 is the FIXED "**Project**" tier (Brian: *"Project is fixed... here there be dragons"*). "Workspace" is depth 3 and is a RENAMEABLE MIDDLE tier that v1.4 does NOT auto-instantiate. The STRUCTURE described in this brief (2 nested platform.Project rows for the v1.4 provisioning recipe) is correct; only the LABEL on the depth-2 child is wrong. D-34's locked `"ZeroBias Platform"` name attaches to the **Project tier at depth 2**, not to a "Workspace." The depth-2 child's tier-identity tag is `sme-mart.tier.project`, NOT `sme-mart.tier.workspace`. See DECISIONS.md D-46 (corrected) + memory file `project_sme_mart_hierarchy_model.md` for the authoritative current understanding. Wave 2 onward consumes the corrected mental model. The merged Wave 3 (schema deprecation PR) is unaffected — it targets GQL class names, not tier labels.

**Director note 2026-05-08 (path locked 2026-05-08 PM):** Drafted in response to Nic's 2026-05-08 SDK release announcing real platform Project / Board / scoped-role primitives. Discuss-phase pre-flight (Director + Clark, 2026-05-08 PM) resolved the major architectural question — **Path (C) Engagement-as-Project hierarchy is locked** — and folded the resolution into this brief before insertion. The remaining open questions are tactical, not directional.

**Trigger source:**
- `.planning/notes/projects-boards-models.md` — Nic's quick-reference for the new models.
- 2026-05-08 SDK bump (`c550743`) bringing in `@zerobias-com/zerobias-angular-client@1.1.39` + `platform-sdk@1.1.16` / `portal-sdk@1.1.16` / `hydra-sdk@1.0.7`, MCP @ `1.0.43`.

**Where it slots:** v1.4 milestone, decimal insertion between deferred Phase 29 and active Phase 30. Same pattern as Phase 27.5.

---

## Goal

Replace SmeMart's GraphQL-class-based modeling of Engagements, Projects, Boards, and engagement-vetting with the new platform / portal / hydra SDK primitives. Retire SmeMart classes that have first-class platform analogs OR that decompose cleanly to platform Tasks + hydra Tags. Refactor app services and components to consume the new models.

**Core directive (Clark, 2026-05-08):** Eliminate GQL surface area as much as feasible. Zero new GQL classes added by 29.5; three GQL classes retired (`Engagement`, `EngagementVettingItem`, `SmeMartProject`).

The reason we're doing this NOW: Phase 30 (Default Project board UI) was paused waiting for these primitives. Building Phase 30 on SmeMart-side analogs and retiring later is double the work.

---

## Locked path: (C) Engagement-as-Project hierarchy

**The Engagement IS a Project.** Engagement-as-Project is a top-level `platform.Project` (parentId=null). Workspaces under the engagement are child Projects (parentId=engagement.id). Vetting requirements are paired Tasks on a vetting Board that is also an immediate child of the engagement Project.

```
platform.Project  (top-level, parentId=null)             [the "engagement"]
├── tagId: sme-mart.eng.{supply}-to-{demand}             [identity, server-attached at create]
├── ownerId: <buyer-org-id>                              [buyer-anchored ownership]
├── name: locked verbiage "<Buyer> <- <Provider>"         [reverse-arrow convention 2026-04-23]
├── description: locked verbiage                          [2026-05-07 EVE]
├── status: 'active' | 'archived' | 'closed'              [Project enum replaces activity-workflow]
│
├── platform.Board  (Vetting Board, immediate child)     [paired req-sat tasks live here]
│   ├── platform.Task  (parent: "Insurance verification")
│   │   ├── Subtask (assigned: vendor party)
│   │   └── Subtask (assigned: buyer party)
│   ├── platform.Task  (parent: "ToS acceptance")
│   │   ├── Subtask (vendor)
│   │   └── Subtask (buyer)
│   └── ... (other vetting requirements)
│
└── platform.Project  (Workspace, parentId=engagement.id) [the old "default project"]
    ├── name: "ZeroBias Platform"
    ├── tagless                                           [identity tag stays on parent only]
    └── platform.Board  (Default kanban, isDefault=true)
        └── platform.Tasks  (day-to-day engagement work)
```

### What lives where

| Engagement concept | Lives where |
|---|---|
| **Identity / directional pairing** (which two orgs, supply→demand) | hydra identity tag `sme-mart.eng.{supply}-to-{demand}` (locked 2026-05-07) |
| **Type classifier** (platform / marketplace / partnership) | hydra classifier tag `sme-mart.eng.type.{...}` |
| **Scope / period classifier** (Q4-2026, audit, etc.) | hydra classifier tag `sme-mart.eng.scope.{...}` |
| **Display verbiage** (name, description) | `platform.Project` record (locked verbiage 2026-05-07 EVE preserved verbatim) |
| **Status / lifecycle** | `platform.Project.status` enum (`draft`/`active`/`archived`/`closed`) — replaces today's activity-workflow |
| **Membership** (who is part of this engagement) | `platform.Project.listMembers` / `addMember` |
| **MSA / ToS / EULA content** | Notes, tasks, attachments **inside** the engagement Project (per DECISIONS 2026-04-28) |
| **Vetting requirements** (req-sat) | Paired `platform.Tasks` on the Vetting Board, surfaced via Transparency Center (backlog) |
| **Buyer-anchored ownership** | `platform.Project.ownerId = buyerOrgId` |
| **Workspaces under engagement** | child `platform.Project` records (`parentId=engagement.id`) |
| **Engagement-Task (today's `aha1-N`)** | **DROPPED** — Project.status enum + Project-as-first-class-resource replaces both lifecycle and Governance surfacing roles. Gated on Governance verification (see Open Questions). |
| **Engagement metadata** (billing, MSA refs, deal terms) | **NOT NEEDED FOR v1.4** — vetting events live on Tasks, billing not in v1.4 scope (DECISIONS 2026-04-28 toll-booth model + ServiceOfferings deferred). EngagementMetadata GQL class is a planted seed for v1.5+. |

### Vetting Board: paired-task shape — (γ) parent + one subtask per side

```
Parent Task: "<Requirement>"
  activityId: <vetting-activity>          # ties to vetting workflow definition
  status: aggregate (rolls up from subtasks)
├── Subtask (parentId=parent, board inherited)
│     assigned: <vendor party> (R)
│     accountable: <vendor admin> (A)
└── Subtask (parentId=parent, board inherited)
      assigned: <buyer party> (R)
      accountable: <buyer admin> (A)
```

- Single-side requirements (e.g., "vendor provides W-9"): parent task only, no subtasks.
- Multi-step handoff: parent + subtasks with transition workflow.
- Activity-workflow definitions for vetting requirement types (insurance, ToS, MSA, background-check) are NOT a 29.5 deliverable — they're authored later when concrete requirements land. 29.5 establishes the structural pattern.

### GQL retirement (zero new GQL classes added)

| GQL class | Disposition | Replacement |
|---|---|---|
| `Engagement` | **RETIRE** | top-level `platform.Project` |
| `EngagementVettingItem` | **RETIRE** | Tasks on vetting Board (paired-task shape) |
| `SmeMartProject` | **RETIRE** | child `platform.Project` (workspace) |
| `SmeMartBoard` (if exists) | **RETIRE** | `platform.Board` |
| `SmeMartTask` (if exists) | **RECONCILE** | `platform.Task` (already exists, gained boardId) |
| `EngagementMetadata` (proposed) | **NOT CREATED** | Planted seed for v1.5+ if value-carrying engagement state ever surfaces outside Tasks/tags |
| `MarketplaceProfileItem` | **KEEP** | Vendor profile sections — Org-anchored identity, distinct from engagement-relationship metadata |
| `RFP` / `Bid` / `Note` / `NoteFolder` / `Document` / `Vetting` / `ServiceOffering` / etc. | **TBD** | Audit each in inventory step |

---

## Resolved via MCP describe (2026-05-08)

All four pre-flight describes ran on `zerobias-mcp@1.0.43`:

| Question | Answer |
|---|---|
| `Project.membershipPolicy` enum | `private`, `public`, `moderated` |
| `Project.visibility` enum | `private`, `internal`, `public` |
| `Project.status` enum | `draft`, `active`, `archived`, `closed` |
| `Project` required fields | `name`, `status`, `visibility`, `membershipPolicy` |
| `Project.parentId` semantics | "When set, the project becomes a child of another project (nested workspace / sub-project / engagement-tier). The parent must be a project resource in the same org context." |
| `Project.tagId` | Optional UUID — direct hydra-tag link **at creation time** (no separate attach step) |
| `Task.boardId` | **Optional with server fallback chain** (HIGH-RISK question RESOLVED): "If not provided, defaults to the default board for the project, boundary, or org (or the parent's board for subtasks)." |
| `Board.boardType` enum | `kanban`, `list`, `timeline`, `calendar` |
| `Board.status` enum | `active`, `archived`, `deleted` |
| `Board` required fields | `name`, `status`, `boardType` |
| `Board.isDefault` | "At most one default exists per parent: per-org, per-boundary, per-project, or per-user." Server enforces singleton. |
| `Board` ownership | Mutually exclusive: `boundaryId` / `projectId` / `userId` (response also surfaces `orgId`) |
| `hydra.Role.addRoleMemberScope` shape | path `id` + `principalId`; query `ownerId`; body `RoleScope { id, rolePrincipalId, scopeType: org\|boundary\|project, scopeId, ownerId, boundaryId?, projectId? }`. Caller-supplied `id` UUID. |

---

## Provisioning recipe — locked shape (5 steps, was 7)

Step labels preserved (with skips marked) so DECISIONS / commits can reference history cleanly.

| Step | Action | Notes |
|---|---|---|
| **A** | `hydra.Tag.create` — identity tag `sme-mart.eng.{supply}-to-{demand}` | Owned by `MARKETPLACE_OPERATOR_ORG_ID` (locked 2026-05-07 EVE) |
| ~~B~~ | ~~`platform.Task.create` — Engagement Task (activityId=`aha1-*`)~~ | **DROPPED.** Project.status enum + Governance-Project-rendering replaces both roles. Verification gate: Governance UI must surface Project records (see Open Questions). |
| **C** | `platform.Project.create` — engagement Project | `parentId=null`, `ownerId=buyerOrgId`, `tagId=A.id`, `name="<Buyer> <- <Provider>"`, `description=<locked verbiage>`, `status='active'`, `visibility='internal'`, `membershipPolicy='private'` |
| **D** | `platform.Project.create` — workspace Project | `parentId=C.id`, `ownerId=buyerOrgId`, `tagId=undefined` (tagless), `name="ZeroBias Platform"`, `description=<locked verbiage>`, `status='active'`, `visibility='internal'`, `membershipPolicy='private'` |
| ~~E~~ | ~~Pipeline.receive — link Engagement to Project + tag-attach~~ | **DROPPED.** Project.tagId built-in eliminates the round-trip. Engagement-as-Project means no separate Engagement record to link. |
| **F** | `platform.Board.create` — default kanban Board on workspace Project | `projectId=D.id`, `name="ZeroBias Platform"`, `status='active'`, `boardType='kanban'`, `isDefault=true` |
| **G** | `platform.Project.addMember` — add admin user as member of engagement Project | Buyer-org admin user becomes engagement member. Provider-side membership added separately (out of scope for 29.5 platform engagement; relevant for marketplace engagements later.) |

**Vetting Board:** NOT eagerly created in the platform-engagement provisioning recipe. Created on-demand when first vetting requirement is added (lazy). Marketplace engagement provisioning (post-v1.4) may eager-create. Discuss-phase confirms the lazy default for platform engagements.

---

## Locked decisions (carry into discuss-phase)

1. **Phase number: 29.5.** Decimal insertion between deferred 29 and active 30. Matches 27.5 pattern.
2. **Path (C) Engagement-as-Project hierarchy is locked.** Engagement IS a top-level Project; workspace is a child Project; vetting Board is an immediate-child Board.
3. **Engagement Task (today's `aha1-N`) is DROPPED.** Verification gate: Governance UI surfaces Project records. If verification fails, fall back to a placeholder Task with backlog entry to remove once Governance gets Project rendering. Director leans speculative-drop with verification as 29.5 deliverable.
4. **Vetting paired-task shape: (γ) parent + one subtask per side.** activityId on parent ties to vetting workflow. Subtasks inherit parent's board. Single-side requirements collapse to parent-only.
5. **`EngagementMetadata` GQL class NOT CREATED.** Planted seed for v1.5+. Vetting state is on Tasks (Transparency Center surfaces). Billing not in v1.4 scope.
6. **Buyer-anchored ownership.** Engagement Project's `ownerId = buyerOrgId`. Provider-side discovery via membership + tag classifier.
7. **Workspace child Project is tagless.** Identity tag rides on engagement Project only. Avoids tag duplication; engagement remains the single tag-search entry point.
8. **`platform.Project.tagId` is the identity-tag attachment point.** No separate Pipeline.receive tag-attach. Removes the Object.tag-embed-in-data discipline (DECISIONS.md 2026-05-04) for Projects.
9. **Provisioning recipe constants — locked Project / Board values:**
   - `Project.status: 'active'`
   - `Project.visibility: 'internal'` (org-members only)
   - `Project.membershipPolicy: 'private'` (no auto-join; admin-curated)
   - `Project.parentId`: top-level orphan for engagement; engagement-id for workspace
   - `Board.status: 'active'`
   - `Board.boardType: 'kanban'` (default board) / TBD (vetting Board, see Open Questions)
   - `Board.isDefault: true` (default board) / `false` (vetting Board)
10. **Schema retirement happens IN this phase.** One PR per concept, one verification cycle. Schema repo PR cycles via Daniel Rojas.
11. **Existing demo data: leave in place.** Old `SmeMartProject` records continue to be readable through hydra/auditgraph. Read paths consume both `platform.Project.list` AND existing GQL `SmeMartProject` (dual-read) until data ages out. NOT a one-shot migration.
12. **Touch-It-Fix-It modernization rule applies.** Phase 27.5's lint enforcement is in effect.
13. **Customer-facing noun stays "Engagement".** The Project record is the persistence; users don't see "Project" on the engagement-detail page. Neutralizes "Brian saw Engagement in Friday's demo" verbiage-churn concern.
14. **Locked verbiage from 2026-05-07 EVE preserved verbatim:** Engagement Project.name `${orgName} <- ZeroBias`; Project.description `Platform Services Engagement: ZeroBias ➡️ ${orgName}` (no trailing period); Workspace Project.name `ZeroBias Platform`; Workspace Project.description `${orgName}'s gateway into ZeroBias — tasks, notes, and communication tied to the ZeroBias ➡️ ${orgName} platform engagement live here.`; Tag.name `sme-mart.eng.zerobias-to-${slug}`; Tag.description `Marketplace tag for the platform-services engagement: ZeroBias ➡️ ${orgName}.`.

---

## Open questions (still need discuss-phase)

1. **Governance verification gate (Engagement Task drop).** Confirm on UAT that Governance UI surfaces `platform.Project` records (not just Tasks). If yes → Engagement Task drop is final. If no → keep placeholder Task, file platform-team ask, backlog removal. Director leans speculative-drop with verification as 29.5 deliverable.
2. **`Board.boardType` for vetting Board.** Probably `list` (checkbox-shape) but `kanban` works if vetting has multi-stage transitions. Discuss-phase decides; default to `list`.
3. **Existing SmeMartProject record behavior post-retirement.** If we remove the schema class from the schema repo, do existing records become unreadable, or just unwritable? Confirmation needed from Daniel Rojas / Nic on schema-class lifecycle. Worst case: keep the class in schema, just stop creating new records (deprecate without delete).
4. **Phase 30 + 31 dependency confirmation.** Phase 30 (Default Project board UI) and Phase 31 (W3Geekery first customer + smoke test) both depend on 29.5. Confirm during discuss-phase that there's no overlap that would let 30 start in parallel.
5. **Naming: `SmeMartProjectService` post-migration.** Becomes a thin wrapper over `platform.Project` APIs (consumer imports stable), or get renamed to `ProjectService` with consumers migrated? Default: keep the name, change the implementation. Discuss-phase confirms.
6. **Provider-side My Engagements query shape.** Buyer's My Engagements is `Project.list({ownerId: me, tagId-classifier-filter})`. Provider's view requires membership-or-tag-membership filter. Likely `portal.Project.search`. Verify in inventory.

---

## Inventory bucket — TO BE COMPLETED IN DISCUSS-PHASE

Skeleton (high-confidence dispositions locked above; the long tail audited during discuss-phase):

| SmeMart class / artifact | Disposition | Notes |
|---|---|---|
| `Engagement` | **RETIRE** | → top-level `platform.Project` |
| `EngagementVettingItem` | **RETIRE** | → Tasks on vetting Board |
| `SmeMartProject` | **RETIRE** | → child `platform.Project` (workspace) |
| `SmeMartBoard` (if exists) | **RETIRE** | → `platform.Board` |
| `SmeMartTask` (if exists) | **RECONCILE** | → `platform.Task` |
| `MarketplaceProfileItem` | **KEEP** | Org-anchored identity (capabilities, corporate_identity sections) |
| `RFP` / `Bid` / `Note` / `NoteFolder` / `Document` / `Vetting` / `ServiceOffering` | **TBD** | Audit each — likely all KEEP for v1.4 |
| `engagements.service.ts` | **REWRITE** | `Engagement` GQL paths → `platform.Project.list` + classifier-tag filter |
| `my-engagement-list.component.ts` | **UPDATE** | Consume new shape; verify org-scoping fix from 2026-05-07 still works |
| `provisioner.service.ts` | **REWRITE** | Steps B/E removed; C/D/F/G updated per recipe table; constants block extended for workspace Project |
| `GraphqlReadService.buildQuery` callers | **AUDIT** | Each query referencing retiring classes needs swap to `platform.*` SDK or removal |
| `ResourceTypeEnum` / `'project'` / `'board'` literals | **AUDIT** | Demo-visibility post-filter, resource-link rendering, navigation |
| Transparency Center prototype (if any) | **CHECK BACKLOG** | Designs after 29.5; no rewire concern |

The audit deliverable produces a populated version of this table as `.planning/phases/29.5-.../INVENTORY.md` consumed by the planner.

---

## Scope buckets (work units)

1. **Inventory & classification** — read schema sources, grep `Engagement` / `EngagementVettingItem` / `SmeMartProject` / `SmeMartBoard` / `SmeMartTask` references in `src/`, MCP-describe new platform / portal / hydra endpoints. Produce INVENTORY.md.
2. **Provisioning recipe rewrite** — `provisioner.service.ts` Steps B/E removed; C/D/F/G updated per recipe table. Constants block extended for workspace Project. Spec rewritten.
3. **Service refactors** — `SmeMartProjectService` rewired to call `platform.Project.list / search / get / create / update`. New `PlatformBoardService` (or fold into project service). Read paths in `engagements.service.ts`, `my-engagement-list.component.ts`, `my-projects.component.ts` (if exists).
4. **GQL query refactor** — wherever a service queries retiring classes via `GraphqlReadService.buildQuery`, swap to `platform.*` SDK calls or remove. ProjectExtended shape adds `boardCount`/`memberCount`/`creator`/`tag` — UI may need updates.
5. **Resource type handling** — grep `ResourceTypeEnum`, `resource_type`, `'project'`/`'board'` string literals. Demo-visibility post-filter, resource-link rendering, navigation.
6. **Schema retirement** — `zerobias-org/schema` PR removing retired classes from `package/w3geekery/sme-mart/`. Daniel Rojas approval. Coordinate sequencing — likely deprecate without delete unless lifecycle semantics confirm orphan reads work.
7. **Governance verification (Engagement Task drop)** — UAT smoke test: provision a fresh test org, confirm `platform.Project` record surfaces in Governance UI. If yes, drop is final. If no, fall back to placeholder Task + file platform-team ask.
8. **Verification & UAT smoke** — full provisioning recipe end-to-end on a clean test org. My Engagements scope. Admin Provisioning tab. Existing demo data still readable. Lint + tsc + 1757 tests + targeted board/project specs.
9. **Director docs** — DECISIONS.md entry for the model-migration decisions; DIRECTOR-PARKS-RESUME.md update.

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Governance UI does NOT surface Project records (Engagement Task drop blocked) | MEDIUM | Verification gate as 29.5 deliverable. Fall back to placeholder Task if needed; backlog entry to remove once Governance ships Project rendering. |
| Schema retirement breaks existing demo data reads | MEDIUM | Deprecate without delete; verify schema-class lifecycle allows orphan reads; dual-read until data ages out. |
| `platform.Project.list` shape differs from current `SmeMartProject` GQL projection | MEDIUM | ProjectExtended carries `boardCount`/`memberCount`/`creator`/`tag` — UI updates needed. Audit consuming components in inventory step. |
| Vetting Board lazy-creation never triggers; vetting-flow code paths untested | LOW | 29.5 establishes structural pattern only; vetting requirement types come later. Smoke test creates one vetting Task manually for shape verification. |
| Cross-fork coordination delay on schema repo PR | LOW | Daniel Rojas reviews quickly when pinged; parallelizable. |
| Customer-facing noun confusion ("Engagement" vs "Project") | LOW | UI keeps "Engagement" verbiage; Project is persistence-only. Locked verbiage 2026-05-07 EVE preserved verbatim. |
| Sprawl risk if read paths fan out further than expected | LOW | Escape hatch: split into 29.5a (recipe flip + provisioner) and 29.5b (service refactor + schema retirement). |

---

## Verification criteria (UAT smoke)

1. **Provisioning recipe end-to-end:** Dry Run + Provision on a fresh test org creates: hydra Tag, engagement `platform.Project`, workspace `platform.Project`, default kanban `platform.Board`, admin member added.
2. **Engagement Task NOT created** (locked drop). Governance UI surfaces the engagement Project record (verification gate per Open Questions).
3. **Admin Provisioning tab** still lists orgs, status probes work, Dry Run + Provision buttons function.
4. **My Engagements page** scope-by-org still shows correct subset; consumes new `platform.Project.list` shape.
5. **Existing W3Geekery + Auditmation Dev demo data** still readable on the page (dual-read path).
6. **ZB Platform Governance app** shows the new engagement Project + workspace Project + default Board records.
7. **Resource navigation / linking** handles `project` / `board` resource types without falling through.
8. **Vetting Board pattern smoke** — manually create one vetting Task on a test engagement Project; confirm parent + subtask shape lands cleanly; confirm `boardId` defaults from project on subtasks via parent inheritance.

---

## Estimate

10–18 hours. Heavy on inventory + service refactor + schema PR coordination. Provisioning recipe is one method swap (Steps B/E removed; C/D/F/G updated). Smoke test + Governance verification half a session. Risk of sprawl if existing read paths fan out further than expected — escape hatch is split into 29.5a / 29.5b.

(Estimate bumped from earlier 8–15 by adding the Engagement-Task drop verification + vetting Board pattern smoke.)

---

## How to use this brief

```
/gsd-insert-phase 29.5 .planning/director/phase-29.5-brief.md
```

Adds Phase 29.5 to the v1.4 ROADMAP between deferred 29 and active 30.

```
/gsd-discuss-phase 29.5
```

Resolves Open Questions 1–6. Most directional concerns are already locked; discuss-phase is tactical (boardType, governance verification, dependency, naming).

```
/gsd-plan-phase 29.5
```

Produces PLAN.md after discuss-phase.

**Phase 30 brief at `b7f9b80` is now stale** — built on SmeMart-side analogs that 29.5 retires. Substantial rewrite needed post-29.5 closure. Phase 31 (W3Geekery first customer + smoke test) unchanged — depends on 30.
