# SME Mart — Backend Feature Requests

**Status:** Active · created 2026-05-29 · reconciled 2026-06-05 (profile carrier updated to the 2026-06-02 Consolidation Brief — MPI deprecates **entirely**; see the superseded-banner below) · reconciled 2026-06-23 (RL-001 resynced to zb/ui: task-13 expanded to the adopt-now-4 link-types; **`governs`/`engages`/`depends_on` LIVE on CI 2026-06-19**)
**Owner:** Clark + Director Parks
**Not a mirror.** Cross-cutting **platform schema** work (Org / Project / Address / core types) is owned and tracked authoritatively by **ui-meta-director** in `~/Projects/zb/ui/.claude/docs/BACKEND_FEATURE_REQUESTS.md`. We **point at** those entries rather than duplicate their field lists. This doc tracks: (a) SME Mart's **stake/dependency** in the shared schema work, (b) **SME-Mart-only** backend asks, (c) SME Mart **local decisions** that resolve "where does X live."

> The earlier version of this doc was a full field-list "SC-001 — real fields on Org + Project." That has been **superseded** — see Resolution History. The field lists now live in zb/ui's tracker; do not re-author them here.

> **⚠️ PROFILE CARRIER SUPERSEDED 2026-06-02 (Consolidation Brief).** The 2026-05-29 decision below ("keep profile in `MarketplaceProfileItem`; light typed-section cleanup") is **superseded** by `.planning/director/profile-classification-consolidation-brief-2026-06-02.md` (amends DECISIONS **D-54 #1**, driven by Kevin's no-blob directive). **MPI-as-section+blob DEPRECATES ENTIRELY.** Company-profile content → a NEW typed **`OrgProfile`** class in our `smemart` schema + the existing typed credential classes (`SecurityCredential`/`UserCredential`/`OrgCredential`/`Review`) + NEW typed classes (`InsuranceCoverage`, `ClientReference`, `FinancialProfile`, `Personnel?`) + the 6 provider Catalog-axis junctions re-homed as typed GQL classes + an org-scoped `OrgSegment` junction. Still **no platform satellite** (SC-002 stays withdrawn) and still **no JSON blobs**. Substantial multi-class `smemart` schema PR — Clark+Director hands-on. Read the brief before any profile-schema work; the operative entries below are updated to match, while the dated Resolution History is left intact as historical record.

---

## Resolution history — how the company-profile / engagement-metadata carrier got decided (2026-05-29)

Three moves in one day, each correcting the last:

1. **ResourceMetadata (generic KV) → killed by Kevin.** A generic `(resource_id, key, value)` annotation class was the original plan. Kevin's directive: don't build it; use real typed fields on the owning classes. Reason: the data is structured, universal, and queryable — it deserves typed columns, not an opaque KV sidecar.
2. **Real fields → split across typed classes (not one big field dump).** Profile data doesn't belong on the `dana.Org` identity principal; engagement/deal data doesn't belong sprinkled on `platform.Project` core. The split landed as separate typed homes (OrgProfile satellite, Address class, Project-core lifecycle fields, money core types).
3. **Agreements → Requirements (Clark's principle).** Anything that is an *agreement* — billing model, renewal cycle, MSA lifecycle/status, contract value, commercial terms — lives as **Requirement rows**, NOT as scalar fields on Project or a metadata satellite. This **dissolved the proposed `dana.ProjectMetadata` satellite (zb/ui SC-005, DROPPED)** because both its v1 fields were agreements, and spun out a money-core-types FR (SC-006) as the foundation Requirements monetary terms depend on.

**Net carrier map for SME Mart data:**

| Data | Carrier | Tracked as |
|---|---|---|
| Org company profile (legalName, dba, blurb, website, contact, firmographics) | ~~`dana.OrgProfile` satellite~~ → NEW typed `OrgProfile` class, **our `smemart` schema** | ~~zb/ui SC-002~~ → Consolidation Brief 2026-06-02 |
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
| ~~**SC-002**~~ | ~~`dana.OrgProfile` 1:1 satellite~~ | **WITHDRAWN by SME Mart — superseded by [[DECISIONS#D-54]] (2026-06-02).** No platform profile-content satellite. Profile content → a NEW typed **`OrgProfile`** class in our `smemart` schema (Consolidation Brief 2026-06-02 — MPI-as-blob **deprecates entirely**; profile does NOT stay in MPI). Platform `AppOrgProfile` (classification: engagementStage/workspaceType/orgTypes) is read-only signal, not a content home. All profile/classification work is SME-Mart-side schema (no platform migration). | **WITHDRAWN** — relay to umd; close platform [task-8](https://app.zerobias.com/resource/0893970f-293e-4270-8f1e-9a0b1f22b81f) |
| **SC-003** | Generic Project lifecycle on `platform.Project` (`code`/`activatedDate`/`endDate`) | **HIGH** — engagement/project lifecycle shown in our engagement views; `endDate IS NULL` = continuous-compliance | DRAFT (narrowed 5→3) |
| **SC-004** | New typed reusable `Address` class | MEDIUM — HQ address for company profile; anchors future KYB/credentialing | DRAFT |
| ~~SC-005~~ | ~~`dana.ProjectMetadata` satellite~~ | **DROPPED** — its fields were agreements → Requirements | dropped 2026-05-29 |
| **SC-006** | Platform core types `decimal`/`currency`/`money` (revives our latent FR-013, 2026-03-06) | MEDIUM — foundation for Requirements monetary terms (engagement commercial $) | DRAFT |
| **RL-001** | Adopt-now Project ResourceLink types — `governs`/`governed_by`, `depends_on`/`dependency_of`, `engages`/`engaged_by`, `satisfies`/`satisfied_by` (Platform · ResourceLinks, not a schema class). **Expanded 2026-06-04** from the original single "Engagement governs" to the adopt-now-4. | **CRITICAL → now buildable.** `governs` was the sole hard blocker for the governance-node provisioner refactor ([[DECISIONS#D-52]]). **`governs`/`engages`/`depends_on` are now LIVE on CI (2026-06-19, all `project -> project`, verified via `linkTypeSearch`)** — `GOVERNS_LINK_TYPE_ID` can be filled from CI now and the deferred-governs workaround retired as the refactor backfills. **`engages`/`engaged_by`** = the cross-org counterparty seam (mirrored two-org model; direction encodes provider/customer — resolves the old `Q-ENGAGES-ROLE`/`Q-ENGAGES-DIR`). **It is NOT the engagement-classification mechanism** — that's becoming a first-class `platform.Project.type = engagement` discriminator (PS-004/task-34, Nic — confirm). `satisfies`/`satisfied_by` is **task->task only**. Field-list authority stays zb/ui RL-001. | **FILED** · **`governs`/`engages`/`depends_on` LIVE on CI 2026-06-19** · [task-13](https://app.zerobias.com/resource/736b65ab-414b-4757-9397-10c1008379ed) (`736b65ab-414b-4757-9397-10c1008379ed`) |

Parks fed SME Mart's field requirements into SC-002 (Org profile) and reviewed SC-005 (which triggered the SC-005 drop + SC-006 spin-out). **SC-002 is now WITHDRAWN by SME Mart (D-54, 2026-06-02)** — we keep profile content in `MarketplaceProfileItem` rather than a platform satellite, so the satellite FR is moot for our purposes. SC-002 was filed partly on SME Mart's behalf; umd to confirm whether the Projects App has an *independent* need before closing it on the zb/ui tracker (likely not — Projects App can read MPI via GQL per the author/consumer split). No further SME Mart field input pending on SC-001/003/004/006.

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
- **`MarketplaceProfileItem` DEPRECATION (SME-Mart-side schema work — NOT a backend FR; Consolidation Brief 2026-06-02, amends D-54 #1).** MPI today does double duty: (1) typed vendor-compliance sections (`CORPORATE_IDENTITY`/`ATTESTATION`/`INSURANCE`/`REFERENCE`/`PERSONNEL`/`FINANCIAL`) and (2) abused-as-KV company-info (legal_name, dba, logo_url, etc., via `company-info-sections.ts`). **Per Kevin's no-blob directive the MPI section+blob class deprecates ENTIRELY** (this supersedes the earlier "keep MPI, promote KV to a typed section" plan). Its content splits into typed `smemart` GQL classes: company-info + corporate-identity → NEW `OrgProfile`; certs/attestations → existing `OrgCredential`/`UserCredential`→`SecurityCredential`; `INSURANCE` → NEW `InsuranceCoverage`; `REFERENCE` → NEW `ClientReference`; `FINANCIAL` → NEW `FinancialProfile` (disclosure-gated); `PERSONNEL` → NEW `Personnel` (or `OrgProfile.keyPersonnel[]`); reputation → existing `Review`. Plus: re-home the 6 provider Catalog-axis junctions (`ProviderSkill/Role/Product/Framework/Segment/ServiceSegment`) as typed GQL classes, and add an org-scoped `OrgSegment` junction (with `verified`/`verificationSource`). `onboarding_complete` → PKV (above), not MPI. **Prereq:** reconcile the `feat/w3geekery-smemart-resource-metadata` schema branch first (brief fork 6). Substantial multi-class schema PR via the zbb gate — Clark+Director hands-on. Forks 1–7 in the brief (`OrgProfile` vs `CompanyProfile` naming, org-vs-provider junction scope, `CORPORATE_IDENTITY` split, Personnel shape, discovery-vs-vetting disclosure gating, branch reconciliation, migration) resolve in discuss-phase. No `dana.OrgProfile` dependency — SC-002 withdrawn.

---

## SME-Mart-specific backend asks

### FR-014 — Project tags returned inline on Project reads (FILED 2026-07-01 · [task-71](https://app.zerobias.com/resource/2f4f5ab9-1d8b-4193-8297-40a202d42b4f))

**Ask (humble, non-prescriptive):** a project's tags should come back **inline** on `platform.Project` reads (list / get / portal `projectSearch`), the way `projectType` already resolves. Filed to **Backend Feature Requests**, assigned **Raghu**, **Nic** notified. Cross-cutting platform Project read-shape → **ui-meta-director is tracking it** (relayed via `DIRECTOR-PARKS-CHANNEL.md` 2026-07-01).

**Why SME Mart needs it:** the SDK **2.x** line exposes `projectTypeId`/`projectType` (the *type*) but no longer surfaces a project's other hydra resource-tags inline. SME Mart reads engagements as `platform.Project` rows (`type=engagement`) and post-filters them by tag for **demo-visibility** (D-24 / DG-02/03), which needs a project's tags in the list response. Without inline tags that's an N+1 (`getTagsForResource` per row).

**Interim workaround (shipped with the SDK-2.x migration — MUST RECONCILE when this FR lands):** the app does a batched `getTagsForResource` lookup to feed demo-visibility on the engagement list. Grep the codebase for **`RECONCILE-FR-014`** to find every site to revert to the inline field once tags are returned on Project reads. Related: the "tombstone demo-data entirely" backlog item may moot the demo-visibility half of this before the FR lands.

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
