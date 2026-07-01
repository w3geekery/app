# Profile + Credential + Classification Schema Consolidation — Brief

**Date:** 2026-06-02
**Director:** Parks
**Status:** DESIGN BRIEF — seeds a discuss/plan phase in the matchmaking + product-listing milestone. Not execution-ready (schema PRs are Clark+Director hands-on; several forks below need resolving in discuss-phase first).
**Amends:** DECISIONS **D-54** (#1 "MPI is the carrier, no separate class" and #2/#4 are refined — see "Amendment to D-54" below).
**Driving directives:** Kevin "**no untyped JSON-blob fields — type everything possible, reduce blobs to real fields/objects**" (2026-06-02 via Clark); D-54 "own profile content in our schema, not a platform satellite"; D-53 deep-real-time-vetting thesis; the Catalog-segment classification direction (Clark 2026-06-02).

---

## 0. The one principle

**Leverage Catalog links + type everything; no blobs.** One principle applied across BOTH the user/provider profile AND the org profile. Every classification/expertise/credential axis is a **typed link to a Catalog entity** (NICE Role, Product, Framework, Skill, **Segment**, Vendor, SecurityCredential) carried on a **typed junction class** with typed metadata — never a JSON blob, never a free-text field, never KV-on-a-discriminator.

If a design adds a `data` JSON blob, a free-text `industry`-style field, or a one-row-per-attribute KV pattern, it's the wrong shape.

---

## 1. Current state (verified this session, 2026-06-02)

### 1a. `MarketplaceProfileItem` (MPI) — doing two jobs badly
- Schema = `section` (enum) + **`data` JSON blob** + scalar `org_id`. Per-section field shapes live only in the TS model, NOT the schema.
- **Job 1 — typed-ish compliance sections** (6): `CORPORATE_IDENTITY` / `ATTESTATION` / `INSURANCE` / `REFERENCE` / `PERSONNEL` / `FINANCIAL`. Every field in every section is typeable (foundedYear→int, coverageAmount→number, certifications→string[]). None is genuinely freeform → the blob is laziness, not necessity.
- **Job 2 — company-info KV abuse**: `src/app/onboarding/company-info-sections.ts` defines ~16 lowercase keys (`legal_name`, `dba`, `website`, `hq_location.city`, `employee_count`, …). Persisted as **one MPI row per scalar field** (`id: mpi-<orgId>-<key>`, `section: <key>`, `data: <stringified value>`). `onboarding_complete` is also still written this way (drift — it should be PKV per D-54-era decision).

### 1b. Provider profile — 6 Catalog-axis junctions (the right pattern, wrong home)
`src/app/pages/my-profile/my-profile-expertise.component.ts` + `provider.model.ts`: six expertise axes, each a **junction entity** (one row per (provider, catalog-id)) with typed metadata, fed by `ZbSimpleAutocompleteComponent` against `CatalogService`:

| Axis | `add*` shape | Metadata |
|---|---|---|
| skills | `addSkill` | `proficiency_level, years_experience, verified` |
| roles (NICE) | `addRole` | `is_primary, years_in_role` |
| products | `addProduct` | `proficiency_level, years_experience, certified, certification_details` |
| frameworks | `addFramework` | `assessor_certified, implementation_experience, audit_experience` |
| **segments** | `addSegment` | `is_primary` — **NO `verified` field (gap)** |
| **serviceSegments** | `addServiceSegment` | `is_primary` |

- Each row carries the Catalog FK (`zerobias_*_id`) + denormalized name + metadata.
- **`CatalogService` already exposes `segments()` and `serviceSegments()`** and the expertise UI already has segment autocomplete wired (lines 45–48). The picker machinery for segment classification **already exists**.
- **CAVEAT:** none of `ProviderProfile / ProviderSkill / ProviderRole / ProviderProduct / ProviderFramework` (+ the segment junctions) appear in the current `smemart` GQL schema (26-class inventory). They are **legacy Neon/Drizzle-era shapes** (snake_case, `provider_id` scalar, `created_at`). They need re-homing into typed GQL classes.

### 1c. Existing typed credential subsystem (already correct, underused)
- **`SecurityCredential`** — curated catalog of compliance/cyber credentials (CMMC CCA, CISSP, FedRAMP 3PAO…), typed, linked to Vendor/Framework/Role, `scope`, moderation `status`, `submittedByUserId`.
- **`UserCredential`** / **`OrgCredential`** — individual/org *claims* of a SecurityCredential, with `issuedAt/expiresAt/verified/verificationSource/credentialNumber`.
- **`Review`** — provider rating/review (providerId, engagementId, rating, reviewText, status) — the S12 trust-signal home.
- These OVERLAP MPI's blob sections (ATTESTATION/PERSONNEL-certs/CORPORATE_IDENTITY-certs duplicate the credential subsystem; built separately, never reconciled).

### 1d. Platform `AppOrgProfile` — read-only classification only
- `platform.Admin.*OrgProfile`, admin-gated, 1:1 per org: `engagementStage / workspaceType / orgTypes[] / autoUpdate`. NOT a marketplace content store. **Read** `orgTypes` as a signal; never author from SME Mart (D-54).

### 1e. Catalog segment taxonomy (verified prod 2026-06-02)
- **4 Domain · 23 Category · 96 Tool · 2 Service · 3 Feature Group = 128.** Hierarchy `Domain → Category → Tool`; type on `latestVersion.segmentTypeId`; code prefix `d_/c_/t_/s_/fg_`.
- Domains: Cybersecurity (`d_cs`), Software Development (`d_sd`), IT Management (`d_itm`), Business Applications (`d_ba`). Full tree + IDs in `.planning/docs/ZEROBIAS_CATALOG_API_GUIDE.md` §6 (updated this session).
- **There is NO `industry` segment type** and no industry-vertical taxonomy — it's a cyber/IT/software product taxonomy. Cybersecurity + its 7 categories is SME Mart's wheelhouse.

### 1f. No `OrgProfile` class exists; `industry` was never built
- The only profile carrier is MPI. `industry` was only a proposed field on the now-cancelled SC-002 (platform task-8 — closed/cancelled this session). It's redundant: Catalog segment links cover classification.

---

## 2. Target model

### 2a. `OrgProfile` — NEW typed class (1:1 per org), our `smemart` schema
The marketplace company identity / discovery / marketing record. Typed fields, queryable, provider self-authored. Seed field list from SC-002's Parks-reviewed set (closed task-8), minus the relocations:

- `orgId` (FK → Org, unique) · `legalName` · `dba` · `tagline` (≤200) · `shortDescription` (≤500) · `longDescription` (markdown) · `website` (url) · `logoUrl` · `employeeCount` (enum band: `BAND_1_10`…`BAND_500_PLUS`) · `foundedYear` (int; "years in business" derived) · `primaryContactUserId` (FK → member User; name/email resolved on read, no denorm columns).
- HQ location: **typed fields** (street/city/state/country/postalCode) — NOT a JSON blob (Kevin). (A future typed `Address` class — old SC-004 — could supersede for KYB; typed scalar fields are fine for v1.)
- **NO `industry` field** — classification is via segment links (2c).
- **NO `onboarding_complete`** — that's PKV keyed to the Org principal (per D-54-era decision; fix the drift where MPI still stores it).

### 2b. MPI deprecation → typed compliance classes
Drive MPI's `data` blob to **zero**:

| MPI section (blob today) | Typed home |
|---|---|
| company-info (KV) | → **`OrgProfile`** (2a) |
| `CORPORATE_IDENTITY` identity fields | → `OrgProfile` |
| `CORPORATE_IDENTITY` / `ATTESTATION` certs & accreditations | → **existing** `OrgCredential` / `UserCredential` → `SecurityCredential` |
| `PERSONNEL` — person identity (name/title/specialization) | → **NEW** typed `Personnel` (or `OrgProfile.keyPersonnel[]` junction) |
| `PERSONNEL` — credentials/certs | → `UserCredential` → `SecurityCredential` |
| `INSURANCE` | → **NEW** typed `InsuranceCoverage` |
| `REFERENCE` | → **NEW** typed `ClientReference` (distinct from `Review`) |
| `FINANCIAL` | → **NEW** typed `FinancialProfile` (sensitive → disclosure-gated; ties to 033) |
| reputation/trust | → **existing** `Review` |

Result: **MPI-as-section+blob-class deprecates entirely.** What's "left as a blob" ≈ nothing (freeform text like `longDescription`/`reviewText` are typed `string` fields, not blobs).

### 2c. Catalog classification = typed junctions (NOT arrays), org-scoped
- Classification/expertise rides on **typed junction entities** — the pattern already proven on the provider profile (1b), re-homed as typed GQL classes.
- **Segments replace `industry`.** Add an org-scoped segment junction (`OrgSegment { org_id, zerobias_segment_id, segment_type, is_primary, verified, verificationSource, segment_name }`) so buyer AND provider orgs classify. Link at Domain or Category granularity; roll Categories up to Domain via the Catalog.
- **Add `verified` + `verificationSource` to the segment junction** (the provider `addSegment` lacks it today) so a category claim supports asserted-vs-verified — aligns with D-53.
- Reuse `ZbSimpleAutocompleteComponent` + `CatalogService.segments()` (already built) for the picker.

### 2d. Re-home the 6 Catalog-axis junctions as typed GQL classes
`ProviderSkill / ProviderRole / ProviderProduct / ProviderFramework / ProviderSegment / ProviderServiceSegment` are legacy-Neon shapes today (1b caveat). Re-define as typed `smemart` GQL classes (typed FK columns + typed metadata + denorm name). No blobs. Decide provider-scope vs org-scope per axis (2f).

---

## 3. Governance (edit authority + trust)

- **Editing OrgProfile = role-driven.** `Organization Admin` system role (`d94dc1df…`, via the auto `Org Admins` group = `Org.adminGroupId`). Check `hydra.Principal.searchRolesByPrincipal(userId)` for `Organization Admin` ownerId=orgId. The (potentially hundreds of) other members are `Organization Read-Only` — they **consume** the shared 1:1 OrgProfile, they don't edit it.
- **No intra-org submit/approve queue.** The RBAC admin/member split obviates it. (Custom per-org roles exist if a finer "profile manager" is ever needed — defer; don't invent roles.)
- **Trust = the verified/assessed layer**, separate from editing. Self-asserted claims (verified:false) are visible immediately; `verified` is flipped by an assessor / SME Mart moderator — NOT self-serve. This is the D-53 vetting track ([[backlog 033]]), the marketplace "moderation path." Self-assertion is role-driven; verification is assessor-driven.

---

## 4. Forks to resolve in discuss-phase (NOT decided here)

1. **OrgProfile vs Provider-profile scope.** Provider expertise junctions are `provider_id`-scoped today. Does org-level classification get its own org-scoped junctions (`OrgSegment` etc.), or do we converge provider+org onto one org-scoped model? (A provider IS an org in most cases; pure-buyer orgs still want classification.) Lean: org-scoped, with provider-specific metadata where needed.
2. **Class naming.** `OrgProfile` (lean — matches platform vocab) vs `CompanyProfile`. Permanent schema name.
3. **`CORPORATE_IDENTITY` split.** Does deep legal/registration (tax ID, incorporation) fold into `OrgProfile`, or stay a typed KYB/vetting class (ties to 033)?
4. **Personnel.** Typed `Personnel` class vs `OrgProfile.keyPersonnel[]` junction; and where person credentials attach (UserCredential).
5. **Discovery vs vetting disclosure split** (D-54 forward flag). Which typed classes are public-discovery vs disclosure-gated (Insurance/Financial → gated). Seam into 033.
6. **`resource-metadata` branch reconciliation.** The schema fork is on `feat/w3geekery-smemart-resource-metadata` + a near-empty hyphenated `sme-mart` package alongside the real `smemart`. Reconcile before new schema work (connects to dropped SC-005 / agreements→Requirements).
7. **Migration.** Existing MPI rows (KV company-info + blob sections) → typed classes. Clark indicated SME Mart data is largely test-only → likely throwaway; verify per-org before relying on that.

---

## 5. Dependencies & sequencing

- **Schema PRs are Clark+Director hands-on** (no agent-driven push/PR on `zerobias-org/schema` — see memory). New typed classes (`OrgProfile`, `InsuranceCoverage`, `ClientReference`, `FinancialProfile`, `Personnel`?) + re-homed junctions + segment junction = a substantial multi-class schema PR via the zbb gate.
- **Reconcile the `resource-metadata` branch first** (fork 6).
- **AppOrgProfile** stays read-only (D-54) — read `orgTypes`; no platform changes.
- **033 vetting track** consumes the `verified` layer + disclosure-gated classes — keep the seam open, don't build vetting here.
- **No backend FR** for any of this — it's all our `smemart` schema (D-54). The only platform read is AppOrgProfile.orgTypes.

---

## 6. What this is NOT

- NOT a platform `dana.OrgProfile` satellite (SC-002 withdrawn, D-54). All in our schema.
- NOT JSON blobs (Kevin). Typed fields/objects/junctions only.
- NOT a free-text `industry` field. Catalog segment links.
- NOT bare `uuid[]` arrays. Typed junction entities with metadata (matches the proven provider-profile pattern).
- NOT an intra-org change-approval workflow. Role-driven edit + a separate assessor-driven verified layer.

---

## 7. Cross-references

- DECISIONS **D-54** (profile/engagement dispositions — amended here), **D-53** (vetting-central thesis), **D-52** (governance-node model).
- `.planning/director/backlog/033-transparency-vetting-scenario-spike.md` (the verified/assessed layer).
- `.planning/docs/ZEROBIAS_CATALOG_API_GUIDE.md` §6 (live segment taxonomy, updated this session).
- `.planning/docs/BACKEND_FEATURE_REQUESTS.md` (SC-002 withdrawn; MPI-cleanup reframed SME-Mart-side).
- `.planning/notes/zb-permissions-reference.md` (Organization Admin role + auto groups).
- memex *carrier-rule-cardinality-query-shape* (DB-vs-FileService carrier rule).
- Code: `marketplace-profile-item.model.ts`, `company-info-sections.ts`, `provider.model.ts`, `my-profile-expertise.component.ts`, `catalog.service.ts`, schema `classes/{MarketplaceProfileItem,SecurityCredential,UserCredential,OrgCredential,Review}.yml`.

---

## Amendment to D-54

D-54 #1 said "MPI is the marketplace org-profile carrier; keep it; no separate OrgProfile class." Superseded by this brief on the evidence found 2026-06-02 (Kevin's no-blob directive + the company-info KV-abuse + discovery-queryability + the existing typed credential subsystem + the provider-profile junction pattern):

- **MPI-as-section+blob deprecates.** Its content splits into a NEW typed `OrgProfile` class + existing typed credential classes (`SecurityCredential`/`UserCredential`/`OrgCredential`/`Review`) + a few NEW typed classes (`InsuranceCoverage`, `ClientReference`, `FinancialProfile`, `Personnel`?).
- D-54 #2 stands (AppOrgProfile read-only classification; no consolidation onto it; FR orgTypes only if a role is missing).
- D-54 #3/#4 stand (Engagement class deprecated → platform.Project; no PreEngagement).
- The "MPI name kept" point is moot if MPI deprecates; if any MPI-derived class survives, naming is a fork-2 discuss item.
