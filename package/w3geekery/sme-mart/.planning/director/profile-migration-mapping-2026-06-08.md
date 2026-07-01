# Profile/Expertise UI Re-Home — Migration Mapping (legacy Neon/MPI -> typed GQL classes)

**Author:** Director Parks · **Date:** 2026-06-08 · **Status:** DESIGN — ready-to-execute prep
**Blocks on:** schema publish (PR #58 merged; npm 2.0.3 + GQL reload pending base-3.0.1 fix). The mapping below is executable the moment the 13 typed classes are live in CI GQL.
**Feeds:** the matchmaking + product-listing milestone (this doc is input to its `discuss-phase` / `plan-phase`).

**Upstream decisions (don't re-litigate):** D-54 (amended) + `profile-classification-consolidation-brief-2026-06-02.md` + `schema-consolidation-kickoff-2026-06-05.md`. MPI-blob DEPRECATES -> typed classes; org-scoped everything; `industry` dropped -> Catalog segment links; owner-generic `Address`.

---

## 1. The structural shift (read this first — it's the whole migration)

Four shape changes drive every table below:

1. **provider-scoped -> org-scoped.** Legacy junctions key on `provider_id` (FK to a `ProviderProfile` row). New junctions key on `orgId`. **There is no `ProviderProfile` entity anymore** — it dissolves (§3). Expertise hangs directly off the platform Org.
2. **Denormalized names dropped.** Legacy junctions carry `skill_name`/`role_name`/etc. New junctions carry **only the Catalog UUID FK** (`skillId`, `roleId`, ...) and resolve the display name **on read** via `CatalogService`. The expertise component already injects `CatalogService` — the resolution path exists, it just isn't wired into `buildSections()` yet.
3. **`zerobias_<x>_id` -> `<x>Id`.** Every Catalog FK renames (`zerobias_skill_id` -> `skillId`, etc.).
4. **Per-claim verification provenance (D-53).** Every junction + typed class gains `verified` + `verificationSource`. Some legacy rows had `verified`; none had `verificationSource`. Default on write: `verified=false`, `verificationSource=null` (asserted, not yet vetted).

Plus the read-path change: **Neon VIEWs (`v_provider_directory`, `v_provider_detail`) with JSON-string sub-arrays -> native GQL nested queries.** `ProviderDirectoryRow` / `ProviderDetailRow` dissolve into GQL selections over `OrgProfile` + its junction collections + `Review` aggregates.

---

## 2. Expertise junctions — `provider.model.ts` -> 6 `Provider*` classes

Legacy interface (provider-scoped) -> new class (org-scoped). `created_at`/`id` are Object-inherited on both sides (omitted).

### ProviderSkill
| legacy (`provider.model.ts`) | new (`ProviderSkill.yml`) | note |
|---|---|---|
| `provider_id` | `orgId` | **scope change** |
| `zerobias_skill_id` | `skillId` | Catalog FK rename |
| `skill_name` | — (resolve on read) | drop denorm; `CatalogService.findSkill(skillId).name` |
| `proficiency_level` | `proficiencyLevel` | |
| `years_experience` | `yearsExperience` | |
| `verified` | `verified` | preserved |
| — | `verificationSource` | NEW (D-53) |

### ProviderRole
| legacy | new (`ProviderRole.yml`) | note |
|---|---|---|
| `provider_id` -> `orgId` · `zerobias_role_id` -> `roleId` · `role_name` -> drop · `is_primary` -> `isPrimary` · `years_in_role` -> `yearsInRole` | + `verified`, `verificationSource` NEW | |

### ProviderProduct
| legacy | new (`ProviderProduct.yml`) | note |
|---|---|---|
| `provider_id` -> `orgId` · `zerobias_product_id` -> `productId` · `product_name` -> drop · `proficiency_level` -> `proficiencyLevel` · `years_experience` -> `yearsExperience` · `certified` -> `certified` · `certification_details` -> `certificationDetails` | + `verified`, `verificationSource` NEW | |

### ProviderFramework
| legacy | new (`ProviderFramework.yml`) | note |
|---|---|---|
| `provider_id` -> `orgId` · `zerobias_framework_id` -> `frameworkId` · `framework_name` -> drop · `proficiency_level` -> `proficiencyLevel` · `years_experience` -> `yearsExperience` · `assessor_certified` -> `assessorCertified` · `implementation_experience` -> `implementationExperience` · `audit_experience` -> `auditExperience` | + `verified`, `verificationSource` NEW | richest junction; all 3 booleans preserved |

### ProviderSegment
| legacy | new (`ProviderSegment.yml`) | note |
|---|---|---|
| `provider_id` -> `orgId` · `zerobias_segment_id` -> `segmentId` · `segment_name` -> drop · `is_primary` -> `isPrimary` | + `verified`, `verificationSource` NEW | provider-CAPABILITY segment (distinct from OrgSegment classification — §5) |

### ProviderServiceSegment
| legacy | new (`ProviderServiceSegment.yml`) | note |
|---|---|---|
| `provider_id` -> `orgId` · `zerobias_service_segment_id` -> `serviceSegmentId` · `service_segment_name` -> drop · `is_primary` -> `isPrimary` | + `verified`, `verificationSource` NEW | **ID-SPACE GAP — see §7.1** |

---

## 3. `ProviderProfile` dissolution (legacy `provider.model.ts` lines 3-21)

No 1:1 successor — its fields scatter. This is the least mechanical part of the migration.

| legacy `ProviderProfile` field | new home | note |
|---|---|---|
| `display_name` | **platform `dana.Org`** (read, don't store) | per OrgProfile description |
| `avatar_url` | **platform `dana.Org`** (read) | " |
| `slug` | **platform `dana.Org`** (read) | **GAP §7.2** — confirm dana.Org exposes slug |
| `headline` | `OrgProfile.tagline` | |
| `about` | `OrgProfile.shortDescription` / `longDescription` | split long/short on migrate |
| `zerobias_org_id` | `OrgProfile.orgId` | becomes the scope key |
| `user_id` / `zerobias_user_id` | `OrgProfile.primaryContactUserId` (if it was the contact) | else drop — expertise is org-scoped now |
| `hourly_rate` | **GAP §7.3** — not on OrgProfile | -> `ServiceOffering` (pricing) most likely |
| `availability_status` | **GAP §7.3** | provider operational state — no typed home yet |
| `response_time` | **GAP §7.3** | " |
| `total_jobs_completed` | derived (read-model, not stored) | compute from engagements/projects |
| `total_earnings` | **Ledger** (D-53) | not SME Mart storage |
| `rating_average` | derived from `Review` aggregate | not stored |

---

## 4. MPI sections -> typed classes (`marketplace-profile-item.model.ts`)

The 6 `SectionType` blobs each retarget. `org_id` -> `orgId` throughout. Verification fields NEW throughout.

### `insurance` (InsuranceData) -> `InsuranceCoverage` — CLEAN
`policyNumber`·`carrier`·`coverageType`·`coverageAmount` map 1:1; `effectiveDate` ->`effectiveDate`; `expirationDate` -> `expiresAt`; + NEW `currency`, `certificateUrl`. **GAP §7.4:** legacy `limits`, `deductible` have no field — confirm drop.

### `reference` (ReferenceData) -> `ClientReference`
`clientName` 1:1; `contactPerson` -> `contactName`; `email` -> `contactEmail`; `phone` -> `contactPhone`; + new `projectName`, `relationship`, `summary`, `startDate`, `endDate`. **Loose:** legacy `projectType` -> `relationship`?; `projectDuration` -> derive from start/end; `outcome` -> `summary`. Map at migrate, low-fidelity.

### `personnel` (PersonnelData) -> `Personnel`
`name` -> `fullName`; `title` 1:1; `specialization` 1:1; + new `userId`, `bio`, `email`, `linkedinUrl`, `isKeyPersonnel`, `backgroundCheckStatus`. **GAP §7.5:** legacy `yearsExperience` has no Personnel field. `credentials`/`certifications` -> **NOT here** — person certs hang off `UserCredential.userId` (Personnel description is explicit).

### `financial` (FinancialData) -> `FinancialProfile` (1:1 per org)
`annualRevenue` 1:1; + new `revenueCurrency`, `creditScore`, `creditRatingAgency`, `bankName`, `dunsNumber`, `yearEndMonth`. **GAP §7.6:** legacy `profitMargin`, `yearsOperating`, `revenueGrowth` have no field; `employeeCount` -> `OrgProfile.employeeCount` (not financial). Disclosure-gating is read-layer (033), NOT a field here.

### `corporate_identity` (CorporateIdentityData) -> `OrgProfile` + others
`legalEntityName` -> `OrgProfile.legalName`; `foundedYear` -> `OrgProfile.foundedYear`; `numberOfEmployees` -> `OrgProfile.employeeCount`; `yearsInBusiness` -> derive from `foundedYear` (drop stored); `certifications` -> `OrgCredential`/`SecurityCredential`; **GAP §7.7:** `businessType` -> no OrgProfile field (-> `OrgSegment` classification?).

### `attestation` (AttestationData) -> SCATTER (fuzziest)
`serviceType` -> `ProviderServiceSegment`/`ServiceOffering`; `specializations` -> `ProviderSegment`/`ProviderSkill`; `certifications` -> credentials; `yearsExperience`/`clientCount`/`avgProjectDuration` -> **GAP §7.8** no clean home (marketing-stat territory). **Decision needed:** is `attestation` worth migrating, or retire it (data is test-only)?

---

## 5. Onboarding KV sections -> OrgProfile + Address + PKV (`company-info-sections.ts`)

Today these write to MPI under the `company_info` convention. Post-migration:

| legacy section const | new home |
|---|---|
| `legal_name` | `OrgProfile.legalName` |
| `dba` | `OrgProfile.dba` |
| `logo_url` | `OrgProfile.logoUrl` |
| `short_blurb` | `OrgProfile.tagline` (or `shortDescription`) |
| `long_description` | `OrgProfile.longDescription` |
| `website` | `OrgProfile.website` |
| `primary_contact.user_id` | `OrgProfile.primaryContactUserId` |
| `primary_contact.name` / `.email` | resolve from platform user (don't store) |
| `years_in_business` | derive from `OrgProfile.foundedYear` (drop stored) |
| `employee_count` | `OrgProfile.employeeCount` |
| `hq_location.{street,city,state,country,postal_code}` | **`Address`** row: `ownerType=org`, `ownerId=orgId`, `addressType=registered` (or HQ), `isPrimary=true`; `street`->`street1`, `state`->`region`, `postal_code`->`postalCode` |
| `onboarding_complete` (SYSTEM) | **PKV** — not OrgProfile, not Address (OrgProfile desc: "private onboarding state lives in PKV"). Confirm already PKV-primary. |

**OrgSegment** replaces the dead `industry` idea — universal classification (buyer + provider), one row per (org, segment), `segmentId` -> Catalog Domain/Category. Not in the legacy KV set; net-new onboarding step.

---

## 6. CatalogService disposition — UNCHANGED data source, EXPANDED role

`catalog.service.ts` reads the Catalog (roles/skills/frameworks/segments/serviceSegments/products) from platform/portal/hydra APIs. **Those APIs do not move** — zero change to the loaders. But its role grows: it becomes the **name-resolution layer** for the de-denormalized junctions. `buildSections()` in the expertise component must switch from reading `s.skill_name` to `CatalogService.findSkill(row.skillId)?.name`. The `find*` helpers already exist. (One caveat: `findX` matches `id` OR `code`; junction FKs store the Catalog `id`, so resolution is by `id` — fine.)

---

## 7. GAPS + open decisions (for the milestone discuss-phase — do NOT guess these)

1. **ServiceSegment ID-space mismatch — ✅ RESOLVED 2026-06-23 (D-56): Option B locked.** Use the real Catalog Service segments (**133 `segmentType: service`** leaf nodes under 37 categories beneath the `d_svc` Services domain — all published); retire the 9 placeholder hydra tags. **No schema PR** — the leaf nodes ARE `segmentType: service`, so the field is already correct (the "discrepancy" was a misread). `loadServiceSegments()` → `platform.Segment.list` filtered to `segmentType=service`; `CatalogService` resolves names on read. Open plan-phase UX detail only: category-browse vs flat picker for 133 options. Original analysis retained below for context — do NOT re-litigate.

   Two distinct vocabularies in two UUID spaces:
   - Legacy `loadServiceSegments()` -> **9 hydra tags** (`tagType service-segment`): bdr/comms/compliance/it/noc/pentesting/risk/soc/training, UUIDs `b88177ac-ab29-11ee-…` (a small hand-curated SME Mart list).
   - Schema `ProviderServiceSegment.serviceSegmentId` ("Catalog Service-type Segment") -> platform Catalog Segments of type **Service** (`platform.Segment.listSegmentTypes` confirms `Service` / `code: service` / `isService: true`, id `402da727-ad36-4620-bfd7-b5841ba6263c`), part of the 128-segment Catalog taxonomy, UUIDs `002c28d7-…` etc.
   - Wiring the UI as-is stores hydra-tag UUIDs in a field meant for Catalog UUIDs -> name resolution + matchmaking joins break. **This is a DECISION, resolve in discuss-phase:**
     - **Option A — keep the 9-tag coarse vocabulary.** Amend the schema: `ProviderServiceSegment.serviceSegmentId` references a hydra **tag**, not a Catalog segment; fix the class description; name resolution stays hydra-tag lookup. Smallest UI change. Requires a (small) schema follow-up PR.
     - **Option B — adopt Catalog Service-type segments.** Change `loadServiceSegments()` to `platform.Segment.list` filtered to segmentType=Service; UI feeds Catalog UUIDs; schema is correct as written. Vocabulary grows from 9 coarse categories to the finer Catalog service taxonomy — a product/UX change. **Sub-question:** how many Service-type segments exist in the Catalog (unknown — the 128-list spans all types; check before choosing).
   - **Lean:** Option B aligns with the matchmaking goal (Catalog-joined discovery) and the "no denorm, resolve from Catalog" design — but it's Clark's product call, and it changes the onboarding/profile UX. Don't pick unilaterally.
2. **`slug` on dana.Org.** OrgProfile defers `slug` to the platform Org. Confirm `dana.Org` actually exposes a slug (legacy stored it on `ProviderProfile`). If not, slug needs a home.
3. **Provider operational fields** (`hourly_rate`, `availability_status`, `response_time`) have no typed home. `hourly_rate` likely -> `ServiceOffering`; the other two are net-new. Decide: ServiceOffering, a new typed class, or drop for v1.
4. **Insurance `limits`/`deductible`** — confirm drop (no InsuranceCoverage field).
5. **Personnel `yearsExperience`** — confirm drop or add field.
6. **Financial `profitMargin`/`yearsOperating`/`revenueGrowth`** — confirm drop (no FinancialProfile fields).
7. **`businessType`** (corporate_identity) — -> OrgSegment classification, or drop?
8. **`attestation` section** — migrate (no clean home for most fields) or retire? Data is test-only; leaning retire.
9. **Migration of existing rows.** MPI + provider_* rows are **test-only** (per parkit notes). Decide: clean-cut (no data migration, re-enter) vs. a one-shot backfill. Clean-cut is almost certainly right — flag to confirm.

---

### §7 RESOLUTIONS — all closed 2026-06-23 (Clark + Director). Do NOT re-open in discuss-phase.

| # | Resolution |
|---|---|
| **#1** | **Option B (D-56).** Real Catalog Service segments (133 `segmentType: service` leaf nodes); 9 hydra tags retired; **no schema change** (field already correct). UX detail: category-browse vs flat picker → Phase 33 UI-SPEC. |
| **#2** | **Settled — no new home.** `dana.Org.slug` is a required field; app already reads `currentOrg.slug` (onboarding.guard, org-list, provisioner). OrgProfile correctly defers; drop `slug` from the rewritten provider model. |
| **#3** | **Drop all three for v1.** `hourly_rate`/`availability_status`/`response_time` have no typed home. Rate belongs per-`ServiceOffering` (`pricingType`+`price`) later (not in v1 re-home scope); availability/response are net-new — re-add to OrgProfile if product wants them. |
| **#4** | **Drop.** `InsuranceCoverage` has no `limits`/`deductible`. |
| **#5** | **Drop.** `Personnel` has no `yearsExperience` (it was an `AttestationData` field, not Personnel). |
| **#6** | **Drop.** `FinancialProfile` has none of `profitMargin`/`yearsOperating`/`revenueGrowth`. |
| **#7** | **ADOPT typed enum (D-57).** `businessType` (legacy free-text) → **`OrgProfile.businessClassification`** enum, **7-value shared taxonomy** (Nonprofit/Not-for-profit · Government · Hospital/Healthcare Institution · Publicly-traded · PE-backed · Privately-held · Individual/Sole Proprietor). Platform `Party` carries NO company-classification (`partyType`=User/Team/Org/Vendor/SuggestedVendor/Person is party-nature; `Party.type` is a generic Nmtoken) — so SME Mart owns it on OrgProfile. **Implies one schema field-add → cross-fork PR (the only schema change in Phase 33).** CRM + Zoho form already at the same 7 values (Clark 2026-06-23). |
| **#8** | **Retire the `attestation` section.** Content superseded: `serviceType`→ProviderServiceSegment, certs/specializations→ProviderSkill/credentials; the rest (clientCount/avgProjectDuration/yearsExperience) has no home + is test-only. |
| **#9** | **Clean-cut.** MPI + provider_* rows are test-only → no data migration, re-enter. No backfill script. |

**§2/§5 mapping addendum (from #7):** `corporate_identity.businessType` (legacy `CorporateIdentityData.businessType: string`) → **`OrgProfile.businessClassification`** (new enum field, 7 values). This is the lone new typed field the re-home adds beyond the merged PR #58 set.

---

## 8. Code blast radius (files to touch when executing)

- `core/models/provider.model.ts` — rewrite interfaces (org-scoped, `*Id` FKs, drop `*_name`, add `verified`/`verificationSource`); delete `ProviderProfile`, `ProviderDirectoryRow`, `ProviderDetailRow` VIEW models.
- `core/models/marketplace-profile-item.model.ts` — **delete** (MPI retired); replace with typed-class models or generated GQL types.
- `core/services/provider-profiles.service.ts` — **primary rewrite (280 lines; analyzed 2026-06-25 — already HALF-migrated).** Two clean halves:
  - **Half A (reads):** today queries `MarketplaceProfileItem` via `boundaryExecuteRawQuery` (`queryMpi` + `projectToDirectoryRow`/`projectToDetailRow`) — Neon VIEWs already gone. Re-point to **GQL nested selections over `OrgProfile` + the 6 `Provider*` junctions + `Review` aggregates**, org-scoped; `ProviderDirectoryRow`/`ProviderDetailRow` dissolve into GQL types; names via `CatalogService` on read. Methods: `listProviders`, `searchProviders`, `getProvider`, `getProviderByUserId`.
  - **Half B (writes):** the **13 mutation methods are clean STUBS** (`updateProfile` + `add/delete` × {Skill,Role,Product,Framework,Segment,ServiceSegment}) — each `throw 'not yet implemented for GQL-backed providers'`. Greenfield: implement via `PipelineWriteService` → typed `Provider*` classes, org-scoped (`orgId` not `provider_id`, `*Id` Catalog FKs, `verified`/`verificationSource`). **Gated on PR #61 merging + GQL reload** (the typed write targets must be live).
  - **Dependency flag:** `parseViewJson<T>` helper is still consumed by `bid-ai.service.ts:104` — check/migrate that consumer before deleting it.
- `core/services/catalog.service.ts` — **no change** to loaders; becomes name-resolution source.
- `pages/my-profile/my-profile-expertise.component.ts` — `onAdd` payloads (`orgId` not `provider_id`, `*Id` not `zerobias_*_id`, drop `*_name`); `buildSections()` resolves names via CatalogService.
- `onboarding/company-info-sections.ts` + onboarding save/guard — retarget KV sections to OrgProfile/Address writes; `onboarding_complete` -> PKV.
- Any MPI consumer (profile review form, directory/search) — re-home onto OrgProfile + typed classes + GQL queries.

---

## 9. Execution-readiness checklist (gate before the milestone executes)

- [x] Schema published — npm `@zerobias-org/schema-w3geekery-smemart` at **2.0.5** (gate wanted 2.0.3); base `schema-zerobias-zerobias-base` republished to **3.0.1 + 3.0.2** (the blocker). PR #58 merged 2026-06-08.
- [x] New typed classes live in **UAT** GQL (verified 2026-06-23: OrgProfile, ProviderServiceSegment, ProviderSkill, OrgSegment, InsuranceCoverage); `MarketplaceProfileItem` retired in PR #58.
- [x] §7 gaps resolved (2026-06-23) — see §7 RESOLUTIONS table; #1 = D-56, #7 = D-57.
- [x] Clean-cut vs backfill decided (#9) — **clean-cut** (test-only data; no backfill).
- [x] **Schema follow-up (#7/D-57) — MERGED 2026-06-25:** `OrgProfile.businessClassification` enum (7 values) + `employeeCount` re-band to the 100-emp eligibility boundary. **PR #61 merged** (merge `2d99118`, 17:28 UTC); Daniel published **`@zerobias-org/schema-w3geekery-smemart@2.0.6`** (+ `-ts` twin). **GQL reload COMPLETE — verified live in UAT 2026-06-25 18:11 UTC** (`platform.Class.getClass(OrgProfile)`: `businessClassification` property present + the re-banded `employeeCount` updated + the new "Classification" view column). **Phase 33 is now FULLY ungated — both halves executable.**
- [x] `provider-profiles.service.ts` read fully (2026-06-25) — re-point shape captured in §8 (two halves: reads = MPI-projection → typed GQL nested selections; writes = fill 13 stub methods via PipelineWriteService). Well-bounded; ready for plan-phase.
