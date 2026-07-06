# Requirements Architecture — Captured Analysis (Deferred Pending Kevin)

**Date captured:** 2026-05-27
**Status:** DEFERRED — needs Kevin alignment before any schema build or backend work
**Discoverable from:** [BACKLOG-123](../BACKLOG.md), [CLAUDE.md Quick Reference](../../CLAUDE.md)
**Author context:** Director Parks session 2026-05-27 with Clark; analysis happened in the same session that landed the SME-Mart-scope-reduction pivot, the carrier rule memex note, and the schema-fork refresh.

---

## Why this doc exists

The Requirements feature (project-detail tab + org-level catalog + framework-driven Boards/Tasks generation) surfaced in:

- Brian's 2026-05-27 huddle (Requirements as first-class, before-tasks pipeline; OrgProfileItem as catalog carrier)
- ui-meta-director's coordination prompt to Director Parks 2026-05-27 (asking for a single `Requirement` GQL class to land in the existing schema PR)
- Clark's expanded vision 2026-05-27 (org-level catalog/library + per-project framework targeting + backend-generated Boards/Tasks tree)

When Clark's fuller vision landed, scope expanded beyond what a single class can carry. **This deferred capture preserves the analysis so we don't repeat it when the conversation resumes with Kevin.**

The SME Mart schema PR was narrowed back to just the `ResourceMetadata` mechanism. Requirements schema work is parked until Kevin can weigh in on the org-catalog carrier shape, the relationship to the global catalog app, and the legacy `BoundaryRequirement` / `BoundaryControl` migration story.

---

## What we're trying to architect

A Requirements feature that supports:

1. **Org-level requirements catalog/library** — each org maintains a curated set of frameworks:
   - Adopted from the global catalog app (SOC2 2017, NIST 800-53, ISO 27001, PCI-DSS, etc.)
   - Uploaded as custom/private frameworks (proprietary internal requirements, MSA-specific terms, contract-bound rules)
2. **Per-project framework targeting** — on a Project's Requirements tab, the project lead declares "this project targets continuous compliance with frameworks X, Y, Z" (selected from the org library)
3. **Backend-driven Boards/Tasks expansion** — backend job reads selected frameworks, expands their control trees, generates Boards and Tasks (and potentially nested sub-Projects per framework's natural hierarchy), wires up the satisfaction graph
4. **Project member assignment** — individual NICE NIST-roled members assigned to specific requirements (Members tab cross-concern, BACKLOG-117/126)
5. **Continuous-compliance posture tracking** — Tasks satisfy Requirements via hydra `satisfies` / `satisfiedBy` link types, rolling up into engagement-level Readiness measurement

This replaces the OLD Boundary Manager app's standards-attachment-to-Boundary flow (which Brian's 2026-05-27 huddle directive deprecates per the "Boundary = security only" reframe).

---

## Brian's directives this affects

From the 2026-05-27 huddle ([meeting notes](meetings/2026-05-27-slack-huddle-requirements-readiness-reframe.md)):

| Directive | Impact on Requirements architecture |
|---|---|
| **Requirements are first-class, precede Tasks** | Tasks are derived FROM Requirements via backend expansion. Requirements have their own lifecycle (catalog → declare/target → instantiate). |
| **Boundary = security only** | Existing platform `BoundaryRequirement` + `BoundaryControl` model is sitting under the OLD framing. Project-scoped Requirements are the new home. Platform-side migration TBD by Daniel/Kevin/Nic — not our PR. |
| **Readiness = measurement of requirements** | Readiness construct sits ABOVE Requirements; reads ProjectRequirement status to compute rollups. Engagement-readiness aggregates child-project ProjectRequirements. |
| **Org Profile blob carries private requirements catalog** | Use the existing `MarketplaceProfileItem` (formerly thought of as OrgProfileItem) — Brian's view. Director-Parks pushback: the JSON blob loses queryability of individual controls; recommend separate domain class instead. **OPEN — Kevin to arbitrate.** |
| **Members → Roles binds to NICE NIST** | Requirement assignees are NICE-roled members. Separate concern (Members tab work). Schema field: `assigneePartyId`. |
| **"Let it inform the platform"** | SME Mart can build the schema extension that proves the pattern; if platform absorbs it later, the entities migrate. Avoid SmeMart vendor prefix on class names — `ProjectRequirement` over `SmeMartRequirement`. |

---

## Platform context — what already exists

The platform schema already has compliance-adjacent classes under the OLD Boundary-scoped model. Inventoried from `~/Projects/w3geekery/zb-forks/org/schema/package/w3geekery/smemart/node_modules/@zerobias-com/schema-zerobias-zerobias-platform/`:

| Class / Interface | Description | Status under new model |
|---|---|---|
| `interfaces/Standard.yml` | Framework definition (externalId, code, type, baselines, elements, elementTypes) | Still relevant — global frameworks live as Standards in the catalog app |
| `interfaces/Control.yml` | Individual control (maturity, objective, question, guidance) + self-link `linkedControls` | Still relevant — single control definition |
| `classes/BoundaryRequirement.yml` | `extends Control` — "Requirement Resource within a boundary" + self-link `linkedRequirements` | **Legacy** under Brian's Boundary-security-only directive; migration TBD |
| `classes/BoundaryControl.yml` | `extends Control` — "Control Union within a boundary" | **Legacy** for same reason |
| `classes/ControlUnion.yml` | Control union construct | Possibly still useful; unknown |
| `classes/StandardResource.yml` | Standard scoped to a Resource — probably the org-adoption hook | **Worth investigating** as an alternative carrier for org-level framework adoption |

**Critical open question:** does `StandardResource` already provide the "org adopts framework X" semantics? If so, we may not need a custom `OrgFrameworkAdoption` class at all — just use `StandardResource` with the org as the Resource target. **Kevin/Daniel to confirm.**

---

## Proposed schema shape (3-class model)

Director Parks's recommendation after analyzing Clark's expanded vision. **Not built — preserved for resumption.**

### Class 1: `OrgFrameworkAdoption`

Represents an entry in an org's requirements library — either an adoption of a global framework OR a wrapper around a private uploaded framework.

```yaml
description: "An org's adoption of a requirements framework (global from catalog app, or private/custom uploaded by the org)"
extends:
  - Object
properties:
  - ownerOrgId:
    field: orgFrameworkAdoption.ownerOrgId
  - frameworkSource:
    field: orgFrameworkAdoption.frameworkSource    # enum GLOBAL | PRIVATE
  - frameworkRef:
    field: orgFrameworkAdoption.frameworkRef       # catalog id for GLOBAL (e.g., "soc2-2017"); app-generated slug for PRIVATE
  - frameworkVersion:
    field: orgFrameworkAdoption.frameworkVersion
  - displayName:
    field: orgFrameworkAdoption.displayName
  - description:
    field: orgFrameworkAdoption.description
  - definitionBlob:
    field: orgFrameworkAdoption.definitionBlob     # JSON; PRIVATE-only; full control list / definition. Null for GLOBAL (lookup via catalog app).
  - status:
    field: orgFrameworkAdoption.status              # enum ACTIVE | RETIRED
  - adoptedAt:
    field: orgFrameworkAdoption.adoptedAt
  - archived:
    field: orgFrameworkAdoption.archived
  - projectFrameworkTargets:
    linkTo: ProjectFrameworkTarget.id.orgFrameworkAdoption
    multi: true
```

Open variant: instead of a new class, use platform's existing `StandardResource` (TBD pending Kevin/Daniel input). Or extend `MarketplaceProfileItem` with a new section value (per Brian's directive — has queryability cost on individual controls).

### Class 2: `ProjectFrameworkTarget`

Per-project declaration: "this project targets framework X with cadence Y." Where the continuous-compliance flag lives.

```yaml
description: "A project's commitment to target a specific requirements framework, with cadence and compliance-type metadata"
extends:
  - Object
properties:
  - scopeProjectId:
    field: projectFrameworkTarget.scopeProjectId   # the platform.Project being constrained
  - orgFrameworkAdoption:
    linkTo: OrgFrameworkAdoption.id.projectFrameworkTargets
  - targetType:
    field: projectFrameworkTarget.targetType        # enum CONTINUOUS_COMPLIANCE | POINT_IN_TIME
  - targetDate:
    field: projectFrameworkTarget.targetDate        # for POINT_IN_TIME
  - cadenceDays:
    field: projectFrameworkTarget.cadenceDays       # re-assessment interval for CONTINUOUS_COMPLIANCE
  - status:
    field: projectFrameworkTarget.status             # enum ACTIVE | PAUSED | RETIRED
  - archived:
    field: projectFrameworkTarget.archived
  - projectRequirements:
    linkTo: ProjectRequirement.id.projectFrameworkTarget
    multi: true
```

### Class 3: `ProjectRequirement`

The instantiated control — per-control-per-project status record. What ui-meta-director proposed, with adjustments.

```yaml
description: "An individual control/requirement scoped to a project, with satisfaction status. Instantiated from a ProjectFrameworkTarget OR ad-hoc."
extends:
  - Object
properties:
  - ownerOrgId:
    field: projectRequirement.ownerOrgId
  - scopeProjectId:
    field: projectRequirement.scopeProjectId        # the platform.Project this requirement is scoped to
  - projectFrameworkTarget:
    linkTo: ProjectFrameworkTarget.id.projectRequirements   # null for ad-hoc requirements
  - controlCode:
    field: projectRequirement.controlCode            # e.g., "CC6.1"
  - severity:
    field: projectRequirement.severity                # enum LOW | MEDIUM | HIGH | CRITICAL
  - status:
    field: projectRequirement.status                  # enum NOT_ASSESSED | SATISFIED | PARTIAL | UNSATISFIED | NOT_APPLICABLE
  - cadenceDays:
    field: projectRequirement.cadenceDays             # overrides target-level cadence if set
  - assigneePartyId:
    field: projectRequirement.assigneePartyId         # NICE/NIST-roled member responsible
  - lastAssessedAt:
    field: projectRequirement.lastAssessedAt
  - archived:
    field: projectRequirement.archived
  - linkedRequirements:
    multi: true
    linkTo: ProjectRequirement.id.linkedRequirements   # self-link for cross-references; mirrors BoundaryRequirement pattern
```

Tasks satisfy ProjectRequirement via existing/upcoming hydra `satisfies` / `satisfiedBy` link types (registration outstanding with Nic, see Open Questions §3).

---

## Field-shape rules applied to ui-meta-director's original proposal

ui-meta-director's coordination prompt proposed a single flat `Requirement` class. The version above incorporates these adjustments:

| Original | Adjustment | Reason |
|---|---|---|
| `id, name, description` | Mostly inherited from `Object` base class; only `name`/`description` declared as scalar fields | Base class provides identity |
| `owner_org_id, scope_project_id, etc.` (snake_case) | Renamed to `ownerOrgId`, `scopeProjectId` (camelCase) | Repo convention — every existing SME Mart field is camelCase (`bid.engagementId`, `engagement.buyerZerobiasUserId`) |
| `created_at, updated_at` | **Dropped entirely** | Base class `Object` already provides `dateCreated` + `dateLastModified` automatically. Declaring these would conflict/shadow. |
| `source` enum `global_catalog \| private_org_catalog \| ad_hoc` | **Replaced** by `projectFrameworkTarget` link (null = ad-hoc; non-null = derived from a target) | The 3-class model makes source explicit via the link; enum is redundant |
| `source_catalog_item_id` | Dropped (replaced by the link above) | Same reason |
| Enum values `low|medium|high|critical`, `not_assessed|satisfied|...` (lowercase) | All ALL_CAPS: `LOW|MEDIUM|HIGH|CRITICAL`, `NOT_ASSESSED|SATISFIED|...` | Dataloader rejects lowercase per `[A-Z][A-Z0-9_]*` regex |
| `owner_org_id, scope_project_id, assignee_party_id` as link references | Scalar string (UUID) fields, NOT `linkTo` | Org/Project/Party are platform-native hydra entities — cannot be `linkTo` targets ([memex](https://link)). Same pattern as existing `engagement.buyerZerobiasOrgId`. |

---

## Carrier rule application

Per `memex/zerobias/platform/carrier-rule-cardinality-query-shape-not-feature-category`:

| Entity | Cardinality per scope | Query-shape | Joinable | Verdict |
|---|---|---|---|---|
| `OrgFrameworkAdoption` | Tens per org (one row per framework adopted) | Queryable by frameworkRef, frameworkSource, status | Yes (joins to ProjectFrameworkTarget) | **DB-backed** |
| `ProjectFrameworkTarget` | Few per project (1-10 frameworks targeted) | Queryable by scopeProjectId, status, targetType | Yes (joins to OrgFrameworkAdoption and ProjectRequirement) | **DB-backed** |
| `ProjectRequirement` | Hundreds-to-thousands per project (one per control × N frameworks) | Highly queryable: by scopeProjectId, controlCode, status, severity, assigneePartyId | Yes (joins to Tasks via hydra `satisfies` ResourceLink) | **DB-backed** |

All three pass the DB-backed-GQL carrier test cleanly. None is a FileService candidate (none is freeform-document-shaped).

For Brian's "use OrgProfileItem (MarketplaceProfileItem)" directive — using MPI's JSON `data` blob to hold individual controls would lose the queryability we need. Either Director-Parks pushback prevails (new class) or MPI extension is accepted with the queryability cost (forces controls to be opaque). **Open — Kevin to arbitrate.**

---

## Naming — why `ProjectRequirement` not `Requirement`

ui-meta-director's coordination prompt asked for `Requirement`. Director Parks recommends **`ProjectRequirement`** because:

1. **Platform already has `BoundaryRequirement`** (extends Control). `Requirement` next to `BoundaryRequirement` is visually confusing — same word, no scope cue, easy to conflate.
2. **`ProjectRequirement` follows the platform's `<Scope><Concept>` pattern** (`BoundaryRequirement`, `BoundaryControl`). Reads naturally.
3. **Scope-explicit name survives platform absorption** — if Kevin/Nic eventually canonicalize the Project-scoped requirements concept at the platform level, `ProjectRequirement` either survives as-is or migrates without re-conflation.
4. **No SmeMart vendor prefix** — aligns with Brian's "let it inform the platform" direction (same call we made for `ResourceMetadata` over `SmeMartResourceMetadata`).

Same scope-explicit reasoning extends to the other two proposed classes: `OrgFrameworkAdoption` (org-scoped), `ProjectFrameworkTarget` (project-scoped).

---

## What's deferred and why

| Item | Defer reason |
|---|---|
| Building ANY of the 3 Requirements classes | Needs Kevin alignment on org-library carrier shape, relationship to existing `StandardResource`, and `BoundaryRequirement` migration plan |
| Org-library authoring UI | Downstream of schema decision |
| Backend Boards/Tasks expansion from frameworks | Backend job; not schema concern; gated on schema decision |
| `satisfies` / `satisfiedBy` hydra link type registration | Nic ask outstanding (already in BACKLOG-108 / zb/ui INTENT.md §5 Q6) — independent of this work but required before Task↔Requirement linkage works at runtime |
| Members → NICE NIST role binding | Separate concern; BACKLOG-117 / 126 tracks it |

---

## Open questions for Kevin (and/or Daniel/Nic)

1. **Does `platform.StandardResource` already provide org-adopts-framework semantics?** If yes, `OrgFrameworkAdoption` may not be needed — just use StandardResource with the org as Resource target. If no, confirm a new class is the right path.
2. **Where should custom/private framework definitions live?** Options: (a) JSON blob in a new `OrgFrameworkAdoption.definitionBlob`, (b) extend `MarketplaceProfileItem` with `REQUIREMENT_FRAMEWORK` section per Brian's directive, (c) new dedicated `OrgPrivateFramework` + `OrgPrivateControl` classes for full queryability. Director Parks lean: (a) for v1, promote to (c) if cross-org private-framework queries ever matter.
3. **How does `ProjectRequirement` relate to legacy `BoundaryRequirement`?** Migration path? Coexistence? Hard cutover? Affects whether we can ship Project-scoped Requirements while BoundaryRequirement still exists in the schema.
4. **Global catalog app integration shape** — when an org says "we adopt SOC2 2017," what's the catalog API call? Does the catalog app return the full control tree on demand or do we need to mirror it locally? Affects the backend Boards/Tasks expansion job.
5. **Should `cadenceDays` be a Standard/Control-level field or only a ProjectFrameworkTarget-level field?** Some controls have intrinsic cadence (e.g., quarterly access review); others inherit from the org's compliance policy. Lean: both, with per-control override beating per-target default.
6. **Backend orchestration ownership** — who owns the "expand framework → create Boards/Tasks" job? Platform-side (catalog app extension), SME-Mart-side (Pipeline.receive driven), or Projects-app-side (Angular triggers via service)?
7. **For the `definitionBlob` JSON shape on PRIVATE OrgFrameworkAdoption** — what's the canonical schema? Probably `{ controls: [{ code, name, description, severity, guidance? }] }`. Worth aligning with Daniel's global-catalog content schema so private and global can use the same shape.

---

## Continuation hooks — when this picks back up

When Kevin's input lands and we're ready to resume:

1. **Read this doc first** — preserves the analysis chain.
2. **Check `BACKLOG-123`** for any status updates added after this doc was written.
3. **Verify the platform schema state** — `StandardResource` may have changed; `BoundaryRequirement` may have been moved/renamed; new platform classes may have been added that change the proposed shape. Run `find ~/Projects/w3geekery/zb-forks/org/schema/package/w3geekery/smemart/node_modules/@zerobias-com/schema-zerobias-zerobias-platform -name "*.yml" | xargs grep -l "Requirement\|Standard\|Control"` to refresh inventory.
4. **Re-read the zb/ui Projects App INTENT.md §2.8** — the Requirements tab design may have evolved; their schema-extension consumption pattern may have firmed up.
5. **Re-check Brian's directives** — meeting notes after 2026-05-27 may have reframed Requirements/Readiness further. Search `.planning/notes/meetings/` for newer Brian summaries.
6. **Build branch state** — the schema fork branch `feat/w3geekery-smemart-resource-metadata` may have been merged/closed by then. Fresh branch from upstream/main per `SCHEMA_CHANGE_PROCESS.md` if so.
7. **Check the carrier rule memex note** — `memex/zerobias/platform/carrier-rule-cardinality-query-shape-not-feature-category` — should still apply unchanged; if it's been refined, update the carrier-rule application section above accordingly.

---

## References

- **2026-05-27 huddle notes** — [`meetings/2026-05-27-slack-huddle-requirements-readiness-reframe.md`](meetings/2026-05-27-slack-huddle-requirements-readiness-reframe.md) — Brian's reframe of Requirements/Readiness/Boundary
- **Carrier rule memex note** — `memex/zerobias/platform/carrier-rule-cardinality-query-shape-not-feature-category`
- **zb/ui Projects App INTENT.md** — `~/Projects/zb/com/ui/.claude/plans/public/projects-app-mocks/INTENT.md` (§2.8 Requirements/Readiness, §5 Q6 satisfies/satisfiedBy)
- **SME Mart scope-reduction pivot brief** — [`../director/sme-mart-scope-reduction-pivot-2026-05-27.md`](../director/sme-mart-scope-reduction-pivot-2026-05-27.md)
- **Schema change process (refreshed 2026-05-27)** — [`../docs/SCHEMA_CHANGE_PROCESS.md`](../docs/SCHEMA_CHANGE_PROCESS.md)
- **Source paths** — [`../docs/SOURCE_PATHS.md`](../docs/SOURCE_PATHS.md)
- **ui-meta-director coordination prompt (verbatim)** — relayed by Clark in Director Parks session 2026-05-27; full text preserved in SpecStory `.specstory/history/2026-05-27_*.md` (search for "Requirement GQL schema shape")
- **Platform compliance classes** — `~/Projects/w3geekery/zb-forks/org/schema/package/w3geekery/smemart/node_modules/@zerobias-com/schema-zerobias-zerobias-platform/{classes,interfaces}/{Standard,Control,BoundaryRequirement,BoundaryControl,ControlUnion,StandardResource}.yml`
