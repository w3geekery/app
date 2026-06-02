# SME Mart — Backend Feature Requests

**Status:** Active · created 2026-05-29, reconciled 2026-05-29
**Owner:** Clark + Director Parks
**Not a mirror.** Cross-cutting **platform schema** work (Org / Project / Address / core types) is owned and tracked authoritatively by **ui-meta-director** in `~/Projects/zb/ui/.claude/docs/BACKEND_FEATURE_REQUESTS.md`. We **point at** those entries rather than duplicate their field lists. This doc tracks: (a) SME Mart's **stake/dependency** in the shared schema work, (b) **SME-Mart-only** backend asks, (c) SME Mart **local decisions** that resolve "where does X live."

> The earlier version of this doc was a full field-list "SC-001 — real fields on Org + Project." That has been **superseded** — see Resolution History. The field lists now live in zb/ui's tracker; do not re-author them here.

---

## Resolution history — how the company-profile / engagement-metadata carrier got decided (2026-05-29)

Three moves in one day, each correcting the last:

1. **ResourceMetadata (generic KV) → killed by Kevin.** A generic `(resource_id, key, value)` annotation class was the original plan. Kevin's directive: don't build it; use real typed fields on the owning classes. Reason: the data is structured, universal, and queryable — it deserves typed columns, not an opaque KV sidecar.
2. **Real fields → split across typed classes (not one big field dump).** Profile data doesn't belong on the `dana.Org` identity principal; engagement/deal data doesn't belong sprinkled on `platform.Project` core. The split landed as separate typed homes (OrgProfile satellite, Address class, Project-core lifecycle fields, money core types).
3. **Agreements → Requirements (Clark's principle).** Anything that is an *agreement* — billing model, renewal cycle, MSA lifecycle/status, contract value, commercial terms — lives as **Requirement rows**, NOT as scalar fields on Project or a metadata satellite. This **dissolved the proposed `dana.ProjectMetadata` satellite (zb/ui SC-005, DROPPED)** because both its v1 fields were agreements, and spun out a money-core-types FR (SC-006) as the foundation Requirements monetary terms depend on.

**Net carrier map for SME Mart data:**

| Data | Carrier | Tracked as |
|---|---|---|
| Org company profile (legalName, dba, blurb, website, contact, firmographics) | `dana.OrgProfile` 1:1 satellite | zb/ui **SC-002** |
| HQ / business address | new typed `Address` class | zb/ui **SC-004** |
| Project/Engagement lifecycle (code, activated date, end date) | `platform.Project` core fields | zb/ui **SC-003** |
| Money primitives (decimal/currency/money) | platform core types | zb/ui **SC-006** |
| **All engagement agreements** (billing, renewal, MSA status, contract terms, $ values) | **Requirement rows** | **[[BACKLOG-123]]** Requirements architecture |
| Private per-principal app state (`onboarding_complete`, prefs) | **PKV** (`dana.Pkv`) | local decision (below) |

---

## Shared platform schema work — SME Mart's stake (authority: zb/ui)

Field lists, shapes, and open questions live in `~/Projects/zb/ui/.claude/docs/BACKEND_FEATURE_REQUESTS.md`. SME Mart's interest in each:

| zb/ui ID | What | SME Mart's stake | Status (2026-05-29) |
|---|---|---|---|
| **SC-001** | `projectTierHierarchy` cascading-override field (`dana.Org` → Engagement → Program) | Our provisioner sets Engagement/Project tiers + `project-tier` tags; tier ordering source-of-truth | DRAFT |
| **SC-002** | `dana.OrgProfile` 1:1 satellite | **HIGH** — this is our Phase 28 onboarding company-profile data. We fed the field list (Parks-reviewed: added `primaryContactUserId`, banded `employeeCount`, `foundedYear`, blurb sizing) | DRAFT — Parks-reviewed |
| **SC-003** | Generic Project lifecycle on `platform.Project` (`code`/`activatedDate`/`endDate`) | **HIGH** — engagement/project lifecycle shown in our engagement views; `endDate IS NULL` = continuous-compliance | DRAFT (narrowed 5→3) |
| **SC-004** | New typed reusable `Address` class | MEDIUM — HQ address for company profile; anchors future KYB/credentialing | DRAFT |
| ~~SC-005~~ | ~~`dana.ProjectMetadata` satellite~~ | **DROPPED** — its fields were agreements → Requirements | dropped 2026-05-29 |
| **SC-006** | Platform core types `decimal`/`currency`/`money` (revives our latent FR-013, 2026-03-06) | MEDIUM — foundation for Requirements monetary terms (engagement commercial $) | DRAFT |
| **RL-001** | New hydra ResourceLink link-type "Engagement governs" (Platform · ResourceLinks, not a schema class) | **CRITICAL — the sole hard blocker for the governance-node provisioner refactor ([[DECISIONS#D-52]]); we wait on the **registered link-type id** to fill `GOVERNS_LINK_TYPE_ID`. The deferred-governs workaround lets the refactor ship structure-now and backfill the link once this lands.** | **FILED** · [task-13](https://app.zerobias.com/resource/736b65ab-414b-4757-9397-10c1008379ed) (`736b65ab-414b-4757-9397-10c1008379ed`) |

Parks fed SME Mart's field requirements into SC-002 (Org profile) and reviewed SC-005 (which triggered the SC-005 drop + SC-006 spin-out). No further SME Mart field input is pending on these; they're "ready to file pending Clark go-ahead" on the zb/ui side.

---

## Agreements → Requirements — the big downstream for SME Mart

Because all engagement commercial/contractual terms are now **Requirement rows** (not Project fields or metadata):

- **[[BACKLOG-123]]** (Requirements architecture, deferred pending Kevin) is now **load-bearing for engagement commercial terms** — billing model, renewal cycle, MSA lifecycle/status, contract value all land there.
- The **Requirements tab** in the engagement-detail design brief (`.planning/director/engagement-detail-design-brief-for-zb-ui-2026-05-27.md`) is where these surface.
- **Dependency chain:** SC-006 (money core types) → Requirements design → agreements-as-Requirement-rows. SC-006 should land before Requirements monetary terms are real.
- MSA lifecycle (draft/sent/signed/countersigned) is a Requirement row, **not** inferred solely from `Project.activatedDate` — the date is the active/not-active binary; the richer pre-activation lifecycle is Requirements-modeled.

---

## SME Mart local decisions (resolved here, not backend FRs)

- **`onboarding_complete` → PKV.** Stored in `dana.Pkv` keyed to the **org principal** (`principalId=<orgId>`, key `sme-mart.onboarding_complete`). It's private routing state, not profile data, and never queried across orgs. **PKV-against-org verified live on UAT 2026-05-29** (write/read/delete against the W3Geekery org principal; self-read returns Not Found, confirming org-scoped storage). PKV reads of a non-self principal are admin-gated and not cross-org-queryable — which is exactly why it's right for private state and wrong for shared/queryable profile data.
- **`MarketplaceProfileItem` cleanup (downstream, when SC-002 ships).** MPI currently does double duty: (1) typed vendor-compliance sections (`CORPORATE_IDENTITY`/`ATTESTATION`/`INSURANCE`/`REFERENCE`/`PERSONNEL`/`FINANCIAL`) and (2) abused-as-KV company-info (legal_name, dba, logo_url, etc., via `company-info-sections.ts`). Once `dana.OrgProfile` (SC-002) lands, **migrate the company-info KV half → OrgProfile**, then retire that half of MPI. The typed-compliance half stays SME-Mart-only matchmaking data. Sequencing TBD; tracked here as the migration trigger.

---

## SME-Mart-specific backend asks

Post-pivot (SME Mart narrows to matchmaking; engagement chrome → Platform Projects App), most backend needs are **shared platform schema work** tracked in zb/ui above. No SME-Mart-exclusive platform FRs are open today.

Seed this section as genuinely SME-Mart-only backend needs surface (i.e. asks that the Projects App / zb/ui tracker would NOT own). Candidates being watched, not yet filed:

- **Generic SQL Hub Module read/write maturity** — DataProducer writes are read-only in practice today; SME Mart's long-term Neon read/write goal depends on it. (Module/infra ask, not schema — keep distinct from the zb/ui schema FRs.)
- Historical SME Mart platform asks live in the archived, gitignored `.claude/plans-archive/local/025-zb-platform-feature-requests.md` (last touched 2026-03-06). Still-relevant items: FR-007 (Task `dueDate`), FR-008 (`hydra.cron` exposure). FR-013 (money core types) is now **SC-006** in zb/ui. Migrate any of the others here if/when they re-activate.

---

## Cross-reference

- **zb/ui tracker (authority for shared schema FRs):** `~/Projects/zb/ui/.claude/docs/BACKEND_FEATURE_REQUESTS.md`
- **Requirements architecture (deferred):** `.planning/notes/requirements-architecture-2026-05-27-pending-kevin.md` ([[BACKLOG-123]])
- **Engagement-detail design brief:** `.planning/director/engagement-detail-design-brief-for-zb-ui-2026-05-27.md`
- **Carrier rule:** memex `zerobias/platform/carrier-rule-cardinality-query-shape-not-feature-category`
- **Company-info field origin:** `src/app/onboarding/company-info-sections.ts`, `company-info.model.ts`, `core/services/marketplace-profile.service.ts`
- **Archived historical FR list:** `.claude/plans-archive/local/025-zb-platform-feature-requests.md`
