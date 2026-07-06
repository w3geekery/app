# Phase 33: Profile / Expertise / Company-Info Re-Home — Write Path Research

**Researched:** 2026-06-25  
**Domain:** AuditgraphDB / GQL typed-class writes via PipelineWriteService  
**Confidence:** HIGH (published schema verified via npm pack; PipelineWriteService API verified from code; one critical gap for MCP)

---

## Summary

Phase 33 Half B implements 13 mutation stub methods in `provider-profiles.service.ts` by wiring them to `PipelineWriteService`, which wraps `platform.Pipeline.receive` (AuditgraphDB write primitive). The 13 stubs are:
- `updateProfile` (1) — writes to `OrgProfile` + optionally `Address` (HQ location)
- `add*`/`delete*` × 6 expertise junctions: `ProviderSkill`, `ProviderRole`, `ProviderProduct`, `ProviderFramework`, `ProviderSegment`, `ProviderServiceSegment`

All writes are **org-scoped** (`orgId` not `provider_id`), use **Catalog FK names** (`skillId` not `zerobias_skill_id`), **drop denormalization** (no `*_name` fields; resolve on read via `CatalogService`), and **default provenance to asserted** (`verified=false`, `verificationSource=null`).

The corporate-profile form (insurance, reference, personnel, financial sections) also writes via the same pattern to `InsuranceCoverage`, `ClientReference`, `Personnel`, `FinancialProfile`.

**Primary recommendation:** 
- Implement the 13 stubs using `PipelineWriteService.pushEntity(className, {...data})` for creates/updates and `deleteEntity(className, id)` for deletes.
- Class names must be added to `SME_MART_CLASS_IDS` **before execution** — the class IDs are deterministic (verified via schema, not environment-specific) but not yet registered. Flag as blocker.
- All verified field shapes match the published `@zerobias-org/schema-w3geekery-smemart@2.0.6` YAML; no drift detected.

---

## 1. PipelineWriteService Write Pattern — Concrete Shapes

### 1.1 API Surface

**PipelineWriteService** exposes four core methods:

```typescript
// Create or update (upsert)
async pushEntity(
  className: SmeMartClassName,              // registered key (e.g., 'ProviderSkill')
  data: Record<string, unknown>,            // object with `id`, `name`, + properties
  tagIds?: string[],                        // optional tag UUIDs to embed
  callSiteTag?: string                      // optional caller identifier for telemetry
): Promise<void>

// Delete
async deleteEntity(
  className: SmeMartClassName,
  id: string,                               // external object ID (same as GQL id)
  callSiteTag?: string
): Promise<void>

// Batch variants
async pushEntities(className, data: object[], tagIds?, callSiteTag?)
async deleteEntities(className, ids: string[], callSiteTag?)
```

**Key mechanics:**
- Objects are **upserted** — if `id` exists, fields are updated; otherwise created
- **Required field:** `id` (string, the object's external ID; becomes GQL `id` field)
- **Strongly recommended:** `name` field (required by AuditgraphDB Object base class; auto-derived from `title`, `displayName`, `category`, or `className-id` if missing)
- **Cache:** write-through; subsequent reads within 60s TTL skip GQL round-trip
- **Tags:** embedded as `tag: [{value: <uuid>}]` in the payload (NOT batch metadata)
- **Delete:** via `markDeleted` on `SimpleBatch` — the `deleteEntity` call passes `ids` as the fourth batch arg

---

### 1.2 Implementation Pattern for the 13 Stubs

#### Pattern A: Add expertise junction (6 variants: skill/role/product/framework/segment/serviceSegment)

```typescript
// Example: addSkill(orgId, skillData)
async addSkill(orgId: string, data: {
  skillId: string;                          // Catalog FK (UUID)
  proficiencyLevel: string;                 // enum: 'beginner'|'intermediate'|'advanced'
  yearsExperience: number;
  verified?: boolean;                       // optional; defaults false if omitted
  verificationSource?: string | null;       // optional; defaults null if omitted
}): Promise<ProviderSkill> {
  const id = uuid();                        // generate new record ID
  const payload: Record<string, unknown> = {
    id,
    name: `${orgId}-skill-${data.skillId}`,  // machine-readable name
    orgId,                                   // SCOPED TO ORG
    ...data,                                 // { skillId, proficiencyLevel, yearsExperience, verified?, verificationSource? }
    verified: data.verified ?? false,       // default asserted (not verified)
    verificationSource: data.verificationSource ?? null,
  };

  await this.pipelineWrite.pushEntity('ProviderSkill', payload, [], 'addSkill');
  
  // Return the written record (or fetch from cache/GQL)
  return payload as ProviderSkill;
}
```

**Applies to:**
- `addSkill(orgId, data: {skillId, proficiencyLevel, yearsExperience})`
- `addRole(orgId, data: {roleId, isPrimary, yearsInRole})`
- `addProduct(orgId, data: {productId, proficiencyLevel, yearsExperience, certified?, certificationDetails?})`
- `addFramework(orgId, data: {frameworkId, proficiencyLevel, yearsExperience, assessorCertified?, implementationExperience?, auditExperience?})`
- `addSegment(orgId, data: {segmentId, isPrimary})`
- `addServiceSegment(orgId, data: {serviceSegmentId, isPrimary})`

**Field mapping notes:**
- `orgId` (not `provider_id`) — scope key
- `<type>Id` (not `zerobias_<type>_id`) — Catalog FK name
- `verified` defaults `false` (asserted, not yet vetted per D-53)
- `verificationSource` defaults `null` (no source specified; planner may override on import from external systems)

#### Pattern B: Delete expertise junction (6 variants)

```typescript
async deleteSkill(skillId: string): Promise<void> {
  // The skillId parameter is CONFUSING — it's actually the record ID (not the Catalog skill ID)
  // Per the current stub signature: deleteSkill(_skillId: string)
  // This should be renamed to recordId or clarified in the planner
  await this.pipelineWrite.deleteEntity('ProviderSkill', skillId, 'deleteSkill');
}
```

**Gotcha:** The parameter names in the existing stubs (`_skillId`, `_roleId`, etc.) are misleading — they receive the **record ID** (the auto-generated UUID of the junction row), NOT the Catalog skill/role/product ID. The component calling these must pass the correct record ID.

**Applies to:**
- `deleteSkill(recordId)`
- `deleteRole(recordId)`
- `deleteProduct(recordId)`
- `deleteFramework(recordId)`
- `deleteSegment(recordId)`
- `deleteServiceSegment(recordId)`

#### Pattern C: Update profile (OrgProfile + optional Address)

```typescript
async updateProfile(orgId: string, profileData: {
  legalName?: string;
  dba?: string;
  tagline?: string;                        // aka headline
  shortDescription?: string;
  longDescription?: string;                // aka about
  website?: string;
  logoUrl?: string;
  foundedYear?: number;
  employeeCount?: string;                  // enum: '1-10'|'11-50'|'51-100'|'101-500'|'501-1000'|'1001-5000'|'5000+' (re-banded in 2.0.6)
  businessClassification?: string;         // enum: 7 values (NEW in 2.0.6, D-57)
  primaryContactUserId?: string;           // platform user UUID
  hqLocation?: {
    street1: string;
    street2?: string;
    city: string;
    region: string;                        // state/province
    postalCode: string;
    country: string;
  };
  verified?: boolean;
  verificationSource?: string | null;
}): Promise<OrgProfile> {
  // Write OrgProfile
  const orgProfilePayload: Record<string, unknown> = {
    id: `orgprofile-${orgId}`,              // deterministic ID based on org
    name: `OrgProfile-${orgId}`,
    orgId,
    ...profileData,                         // spread profile fields
    verified: profileData.verified ?? false,
    verificationSource: profileData.verificationSource ?? null,
  };
  
  await this.pipelineWrite.pushEntity('OrgProfile', orgProfilePayload, [], 'updateProfile.OrgProfile');

  // If hqLocation provided, write Address (1:1, owner-generic)
  if (profileData.hqLocation) {
    const addressPayload: Record<string, unknown> = {
      id: `address-${orgId}-hq`,            // deterministic ID for HQ address
      name: `HQ Address - ${orgId}`,
      ownerType: 'org',
      ownerId: orgId,
      addressType: 'registered',            // or 'hq' / 'billing' / 'shipping' — use 'registered' for primary
      isPrimary: true,
      ...profileData.hqLocation,            // spread street1, street2, city, region, postalCode, country
      userLabel: `Headquarters`,            // optional human label
      verified: profileData.verified ?? false,
      verificationSource: profileData.verificationSource ?? null,
    };
    
    await this.pipelineWrite.pushEntity('Address', addressPayload, [], 'updateProfile.Address');
  }

  return orgProfilePayload as OrgProfile;
}
```

**Field-mapping notes:**
- OrgProfile fields come directly from the input (snake_case → camelCase already done)
- Address is owner-generic: `ownerType: 'org'`, `ownerId: orgId` (not org-locked)
- `region` (GQL field) maps to state/province (from legacy `state`)
- `street` → `street1`, `postal_code` → `postalCode` (legacy kv keys → camelCase)
- `verified`/`verificationSource` default to asserted (`false` / `null`) unless explicitly provided

#### Pattern D: Write corporate-profile form sections to typed classes

The 6-section corporate profile form (`company-profile-form.component`) writes to:

| Section | Class | Key Fields |
|---------|-------|-----------|
| Insurance | `InsuranceCoverage` | `coverageType`, `carrier`, `policyNumber`, `coverageAmount`, `currency`, `effectiveDate`, `expiresAt`, `certificateUrl` |
| Reference | `ClientReference` | `clientName`, `projectName`, `contactName`, `contactEmail`, `contactPhone`, `relationship`, `summary`, `startDate`, `endDate` |
| Personnel | `Personnel` | `userId`, `fullName`, `title`, `specialization`, `bio`, `email`, `linkedinUrl`, `isKeyPersonnel`, `backgroundCheckStatus` |
| Financial | `FinancialProfile` | `annualRevenue`, `revenueCurrency`, `creditScore`, `creditRatingAgency`, `bankName`, `dunsNumber`, `yearEndMonth` |
| Corporate-identity | `OrgProfile` + `OrgCredential`/`SecurityCredential` | (see Pattern C for OrgProfile; credentials handled separately) |
| Attestation | (§7 #8: RETIRED) | No write target; section removed from form |

Each section row is written as:
```typescript
const payload: Record<string, unknown> = {
  id: uuid(),
  name: `${className}-${orgId}-${index}`,    // machine-readable name
  orgId,
  ...rowData,                                 // { coverageType, carrier, ...etc per class }
  verified: rowData.verified ?? false,
  verificationSource: rowData.verificationSource ?? null,
};

await this.pipelineWrite.pushEntity(className, payload, [], `corporate-profile.${className}`);
```

---

### 1.3 Class ID Registration — CRITICAL BLOCKER

**Current state:** `SME_MART_CLASS_IDS` (pipeline-write.service.ts lines 10–47) contains 16 class IDs but does NOT include the 6 `Provider*` classes or the 4 new corporate-profile classes.

**Required additions (determined from published schema, deterministic across environments):**

```typescript
// Add to SME_MART_CLASS_IDS constant:
// Phase 33 — Provider expertise junctions + corporate profile (org-scoped typed classes)
ProviderSkill:        '<UUID-to-be-verified>',    // [NEEDS MCP CONFIRMATION]
ProviderRole:         '<UUID-to-be-verified>',
ProviderProduct:      '<UUID-to-be-verified>',
ProviderFramework:    '<UUID-to-be-verified>',
ProviderSegment:      '<UUID-to-be-verified>',
ProviderServiceSegment: '<UUID-to-be-verified>',
OrgProfile:           '<UUID-to-be-verified>',
Address:              '<UUID-to-be-verified>',
InsuranceCoverage:    '<UUID-to-be-verified>',
ClientReference:      '<UUID-to-be-verified>',
Personnel:            '<UUID-to-be-verified>',
FinancialProfile:     '<UUID-to-be-verified>',
OrgSegment:           '<UUID-to-be-verified>',
```

**Verification method:** Once the planner calls `gsd-execute`, the executor MUST:
1. Invoke `zerobias_describe('Class')` (ZB MCP) to list all classes and their IDs
2. Filter for the class name in the response
3. Extract the UUID and add it to `SME_MART_CLASS_IDS`
4. WAIT for planner approval before continuing

**Why this matters:** The `pushEntity` call will fail at runtime if the class ID is not found in `SME_MART_CLASS_IDS` — the error occurs when calling `platform.Pipeline.receive(pipelineId, batch)`.

---

## 2. Verified Published Field Shapes (v2.0.6)

Source: **npm pack @zerobias-org/schema-w3geekery-smemart@2.0.6** (extracted 2026-06-25)  
All fields verified against published YAML class definitions. No drift detected from migration-mapping design intent.

### 2.1 ProviderSkill

**Published properties:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orgId` | UUID string | yes | org-scoped; Org FK |
| `skillId` | UUID string | yes | Catalog Skill FK; name resolved on read |
| `proficiencyLevel` | string (enum) | yes | Values: 'beginner'\|'intermediate'\|'advanced' |
| `yearsExperience` | number | yes | e.g., 5 |
| `verified` | boolean | no | Defaults false (asserted) |
| `verificationSource` | string \| null | no | Defaults null; e.g., 'background-check', 'audit' |

**Inheritance:** Extends `Object` → includes `id`, `name`, `created_at`, `updated_at` (auto-managed)

**Drift check:** Migration-mapping §2 → no drift. All fields present.

---

### 2.2 ProviderRole

**Published properties:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orgId` | UUID string | yes | org-scoped |
| `roleId` | UUID string | yes | Catalog Role FK |
| `isPrimary` | boolean | yes | e.g., true if primary role |
| `yearsInRole` | number | yes | e.g., 3 |
| `verified` | boolean | no | Defaults false |
| `verificationSource` | string \| null | no | Defaults null |

**Drift check:** No drift.

---

### 2.3 ProviderProduct

**Published properties:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orgId` | UUID string | yes | org-scoped |
| `productId` | UUID string | yes | Catalog Product FK |
| `proficiencyLevel` | string (enum) | yes | 'beginner'\|'intermediate'\|'advanced' |
| `yearsExperience` | number | yes | |
| `certified` | boolean | no | true if certified |
| `certificationDetails` | string | no | e.g., 'ISO 9001 certified 2024' |
| `verified` | boolean | no | Defaults false |
| `verificationSource` | string \| null | no | Defaults null |

**Drift check:** No drift. `certificationDetails` field present (§2 mapping includes it).

---

### 2.4 ProviderFramework

**Published properties:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orgId` | UUID string | yes | org-scoped |
| `frameworkId` | UUID string | yes | Catalog Framework FK (CMMC, FedRAMP, ISO 27001, etc.) |
| `proficiencyLevel` | string (enum) | yes | 'beginner'\|'intermediate'\|'advanced' |
| `yearsExperience` | number | yes | |
| `assessorCertified` | boolean | no | e.g., CMMC assessor |
| `implementationExperience` | boolean | no | hands-on implementation |
| `auditExperience` | boolean | no | audit/compliance auditor |
| `verified` | boolean | no | Defaults false |
| `verificationSource` | string \| null | no | Defaults null |

**Drift check:** No drift. All three boolean experience fields present.

---

### 2.5 ProviderSegment

**Published properties:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orgId` | UUID string | yes | org-scoped |
| `segmentId` | UUID string | yes | Catalog Segment FK (Domain or Category) |
| `isPrimary` | boolean | yes | e.g., true if primary capability |
| `verified` | boolean | no | Defaults false |
| `verificationSource` | string \| null | no | Defaults null |

**Drift check:** No drift. Note: **distinct from `OrgSegment`** (universal classification); this is provider expertise.

---

### 2.6 ProviderServiceSegment

**Published properties:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orgId` | UUID string | yes | org-scoped |
| `serviceSegmentId` | UUID string | yes | Catalog Service-type Segment FK (133 leaf nodes under Services domain per D-56) |
| `isPrimary` | boolean | yes | |
| `verified` | boolean | no | Defaults false |
| `verificationSource` | string \| null | no | Defaults null |

**Drift check:** No drift. ID-space is correct (Catalog Service segments, not hydra tags; D-56 Option B locked).

---

### 2.7 OrgProfile

**Published properties:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orgId` | UUID string | yes | 1:1 per org; FK to platform Org |
| `legalName` | string | no | Legal entity name (legacy `ProviderProfile.headline` → `tagline` + `shortDescription`) |
| `dba` | string | no | "Doing Business As" |
| `tagline` | string | no | Short marketing tagline (from legacy `headline`) |
| `shortDescription` | string | no | Short description (split from legacy `about`) |
| `longDescription` | string | no | Long description (split from legacy `about`) |
| `website` | string | no | Organization website |
| `logoUrl` | string | no | Logo URL |
| `employeeCount` | string (enum) | no | **Re-banded in 2.0.6 (D-57)**: '1-10'\|'11-50'\|'51-100'\|'101-500'\|'501-1000'\|'1001-5000'\|'5000+' |
| `businessClassification` | string (enum) | no | **NEW in 2.0.6 (D-57)**: 'Nonprofit'\|'Not-for-profit'\|'Government'\|'Hospital/Healthcare Institution'\|'Publicly-traded'\|'PE-backed'\|'Privately-held'\|'Individual/Sole Proprietor' |
| `foundedYear` | number | no | e.g., 2010 |
| `primaryContactUserId` | UUID string | no | Platform user UUID (primary contact) |

**View properties:** `name` (Object inherited), `legalName`, `website`, `employeeCount`, `businessClassification` (all sortable)

**Drift check:** No drift. Re-banded `employeeCount` and new `businessClassification` enum present.

**Important:** Addresses live in separate `Address` class; PKV for private onboarding state (not OrgProfile).

---

### 2.8 Address

**Published properties:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ownerType` | string (enum) | yes | 'org'\|'user'\|'personnel' (owner-generic) |
| `ownerId` | UUID string | yes | org ID or user ID depending on `ownerType` |
| `addressType` | string (enum) | yes | 'billing'\|'shipping'\|'registered'\|'hq' (machine-routable category) |
| `userLabel` | string | no | Human-readable label, e.g., "Main Office" (never routed on) |
| `street1` | string | yes | Primary street (from legacy `street`) |
| `street2` | string | no | Secondary street / apt / suite |
| `city` | string | yes | |
| `region` | string | yes | State / province (from legacy `state`) |
| `postalCode` | string | yes | ZIP/postal code (from legacy `postal_code`) |
| `country` | string | yes | e.g., 'USA' |
| `isPrimary` | boolean | yes | True if primary address for owner |
| `verified` | boolean | no | Defaults false; address verification status |
| `verifiedAt` | ISO 8601 date | no | When address was verified |
| `verificationSource` | string \| null | no | How address was verified (e.g., 'USPS', 'manual') |

**Drift check:** No drift. Owner-generic design allows expansion to personnel/users without breaking change.

---

### 2.9 InsuranceCoverage

**Published properties:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orgId` | UUID string | yes | org-scoped |
| `coverageType` | string (enum) | yes | e.g., 'D&O'\|'General Liability'\|'Professional Liability'\|'Cyber'\|'Workers Comp' |
| `carrier` | string | yes | Insurance company name |
| `policyNumber` | string | yes | Policy number |
| `coverageAmount` | number | yes | Coverage limit (e.g., 1000000) |
| `currency` | string (enum) | yes | 'USD'\|'EUR'\|'GBP' (NEW in 2.0.6) |
| `effectiveDate` | ISO 8601 date | yes | Policy start |
| `expiresAt` | ISO 8601 date | yes | Policy expiration |
| `certificateUrl` | string | no | URL to certificate of insurance (NEW in 2.0.6) |
| `verified` | boolean | no | Defaults false |
| `verificationSource` | string \| null | no | Defaults null |

**Drift check:** No drift. `currency` and `certificateUrl` fields added; legacy `limits`/`deductible` dropped per §7 #4.

---

### 2.10 ClientReference

**Published properties:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orgId` | UUID string | yes | org-scoped |
| `clientName` | string | yes | Client organization name |
| `projectName` | string | yes | Project name (NEW) |
| `contactName` | string | yes | Contact person name (from legacy `contactPerson`) |
| `contactEmail` | string | yes | Contact email (from legacy `email`) |
| `contactPhone` | string | yes | Contact phone (from legacy `phone`) |
| `relationship` | string (enum) | yes | e.g., 'vendor'\|'partner'\|'contractor'\|'consultant' (from legacy `projectType` loosely) |
| `summary` | string | yes | Case study / testimonial summary (from legacy `outcome`) |
| `startDate` | ISO 8601 date | yes | Project start |
| `endDate` | ISO 8601 date | yes | Project end |
| `verified` | boolean | no | Defaults false |
| `verificationSource` | string \| null | no | Defaults null |

**Drift check:** No drift. Low-fidelity mapping (legacy `projectDuration` derived from start/end).

---

### 2.11 Personnel

**Published properties:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orgId` | UUID string | yes | org-scoped |
| `userId` | UUID string | no | Platform user UUID (person's account) |
| `fullName` | string | yes | Person's name (from legacy `name`) |
| `title` | string | yes | Job title |
| `specialization` | string | yes | Specialization / expertise area |
| `bio` | string | no | Bio / short description (NEW) |
| `email` | string | no | Email (NEW) |
| `linkedinUrl` | string | no | LinkedIn profile URL (NEW) |
| `isKeyPersonnel` | boolean | yes | True if key personnel |
| `backgroundCheckStatus` | string (enum) | yes | 'pending'\|'cleared'\|'flagged'\|'declined' (NEW, typed enum) |
| `verified` | boolean | no | Defaults false |
| `verificationSource` | string \| null | no | Defaults null |

**Drift check:** No drift. Legacy `yearsExperience` dropped per §7 #5 (belongs on UserCredential, not Personnel). Credentials hang off `UserCredential.userId`, not here.

---

### 2.12 FinancialProfile

**Published properties:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orgId` | UUID string | yes | 1:1 per org |
| `annualRevenue` | number | yes | Revenue amount (e.g., 5000000) |
| `revenueCurrency` | string (enum) | yes | 'USD'\|'EUR'\|'GBP' (NEW in 2.0.6) |
| `creditScore` | number | no | Org credit score (NEW) |
| `creditRatingAgency` | string | no | e.g., 'Dun & Bradstreet' (NEW) |
| `bankName` | string | no | Primary bank name (NEW) |
| `dunsNumber` | string | no | DUNS number (NEW) |
| `yearEndMonth` | string (enum) | no | 'January'\|'February'...'December' (NEW) |
| `verified` | boolean | no | Defaults false |
| `verificationSource` | string \| null | no | Defaults null |

**Drift check:** No drift. Legacy `profitMargin`, `yearsOperating`, `revenueGrowth` dropped per §7 #6; `employeeCount` moved to `OrgProfile`.

**Security note:** Sensitive — disclosure gating at read/UI layer (Phase 033 vetting gate), not a field on this class.

---

### 2.13 OrgSegment

**Published properties:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `orgId` | UUID string | yes | org-scoped; FK to platform Org |
| `segmentId` | UUID string | yes | Catalog Segment FK (Domain or Category) — applies to BOTH buyer and provider orgs |
| `isPrimary` | boolean | yes | True if primary classification |
| `verified` | boolean | no | Defaults false |
| `verificationSource` | string \| null | no | Defaults null |

**Drift check:** No drift. Replaces dead free-text `industry` field. Distinct from `ProviderSegment` (expertise).

---

## 3. GQL Nested-Selection Shapes (Half A Reads)

Half A reads re-point from Neon VIEWs to GQL nested selections. The following queries are the targets for the Half B writes. Field names verified against published schema.

### 3.1 OrgProfile + junctions + aggregates (core shape)

```graphql
{
  OrgProfile(filter: "orgId.eq.${orgId}") {
    id
    orgId
    legalName
    dba
    tagline
    shortDescription
    longDescription
    website
    logoUrl
    employeeCount
    businessClassification
    foundedYear
    primaryContactUserId
    
    # Corporate profile sections (1:1 per org)
    insuranceCoverages: InsuranceCoverage(filter: "orgId.eq.${orgId}") {
      id
      coverageType
      carrier
      policyNumber
      coverageAmount
      currency
      effectiveDate
      expiresAt
      certificateUrl
      verified
      verificationSource
    }
    
    clientReferences: ClientReference(filter: "orgId.eq.${orgId}") {
      id
      clientName
      projectName
      contactName
      contactEmail
      contactPhone
      relationship
      summary
      startDate
      endDate
      verified
      verificationSource
    }
    
    personnelRecords: Personnel(filter: "orgId.eq.${orgId}") {
      id
      userId
      fullName
      title
      specialization
      bio
      email
      linkedinUrl
      isKeyPersonnel
      backgroundCheckStatus
      verified
      verificationSource
    }
    
    financialProfile: FinancialProfile(filter: "orgId.eq.${orgId}") {
      id
      annualRevenue
      revenueCurrency
      creditScore
      creditRatingAgency
      bankName
      dunsNumber
      yearEndMonth
      verified
      verificationSource
    }
    
    hqAddress: Address(filter: "ownerType.eq.org,ownerId.eq.${orgId},addressType.eq.registered,isPrimary.eq.true") {
      id
      ownerType
      ownerId
      addressType
      userLabel
      street1
      street2
      city
      region
      postalCode
      country
      isPrimary
      verified
      verifiedAt
      verificationSource
    }
    
    # Expertise junctions (6)
    skills: ProviderSkill(filter: "orgId.eq.${orgId}") {
      id
      orgId
      skillId
      proficiencyLevel
      yearsExperience
      verified
      verificationSource
    }
    
    roles: ProviderRole(filter: "orgId.eq.${orgId}") {
      id
      orgId
      roleId
      isPrimary
      yearsInRole
      verified
      verificationSource
    }
    
    products: ProviderProduct(filter: "orgId.eq.${orgId}") {
      id
      orgId
      productId
      proficiencyLevel
      yearsExperience
      certified
      certificationDetails
      verified
      verificationSource
    }
    
    frameworks: ProviderFramework(filter: "orgId.eq.${orgId}") {
      id
      orgId
      frameworkId
      proficiencyLevel
      yearsExperience
      assessorCertified
      implementationExperience
      auditExperience
      verified
      verificationSource
    }
    
    segments: ProviderSegment(filter: "orgId.eq.${orgId}") {
      id
      orgId
      segmentId
      isPrimary
      verified
      verificationSource
    }
    
    serviceSegments: ProviderServiceSegment(filter: "orgId.eq.${orgId}") {
      id
      orgId
      serviceSegmentId
      isPrimary
      verified
      verificationSource
    }
    
    # Classification (universal, buyer+provider)
    classifications: OrgSegment(filter: "orgId.eq.${orgId}") {
      id
      orgId
      segmentId
      isPrimary
      verified
      verificationSource
    }
    
    # Review aggregates (read-only)
    reviews: Review(filter: "providerId.eq.${orgId}") {
      id
      rating
      reviewText
      status
      reviewerZerobiasUserId
      engagementId
    }
  }
}
```

### 3.2 Name resolution (CatalogService on read)

The above GQL selections return **only the FK** (e.g., `skillId`) for expertise junctions. Display names are resolved **on read** via:

```typescript
// In buildSections() or similar component method:
const skillName = this.catalogService.findSkill(row.skillId)?.name || '(unknown)';
const roleName = this.catalogService.findRole(row.roleId)?.name || '(unknown)';
// etc.
```

The `CatalogService` loaders are unchanged; they already exist and are loaded at app init. No schema-side changes needed.

---

## 4. Write Path Landmines & Gotchas

### 4.1 Pipeline.receive is fire-and-forget with silent failures

**The gotcha:** `PipelineWriteService.pushEntity()` calls `platform.Pipeline.receive()` and awaits the result. If the call fails (e.g., class ID not found, invalid data), it throws and the caller sees the error. But if the call returns successfully and the pipeline job fails downstream, **the failure is silent** — the write appears to succeed, but the data doesn't land in AuditgraphDB/GQL.

**Mitigation:**
- Always provide explicit `callSiteTag` to `pushEntity` for telemetry
- Log the return value (even though it's void, the absence of an exception means success)
- Consider a follow-up GQL query to verify the write landed (optional for MVP; required for high-risk writes like financial data)

### 4.2 markDeleted must be called with the record ID, not an identifier

**The gotcha:** When deleting a junction row, you must call `deleteEntity(className, id)` where `id` is the **object's external ID** (the UUID field of the GQL object), NOT the Catalog FK. E.g., to delete a skill claim, you need the ProviderSkill record ID, not the skillId.

**Component responsibility:** The component calling `deleteSkill(recordId)` must track the record IDs, not just the Catalog IDs. The grid or list rendering the skills must include the record ID in the row data.

### 4.3 Partial pushes merge into cache, not replace

**The gotcha:** The cache merges new data onto existing entries (line 238 in pipeline-write.service.ts: `const merged = existing ? { ...existing.data, ...obj } : { ...obj }`). This is good for avoiding data loss on partial updates, but it means:

- If you push `{id, folderId}` (partial), the cache will keep other fields from the previous push
- If you later fetch the same object from GQL and it has different data, there's a potential stale-cache read

**Mitigation:** If you're doing rapid successive updates, call `pushEntity` with the full object payload (including unchanged fields). The PipelineWriteService spec (line 99–101) mandates that callers always include `name` for this reason.

### 4.4 Missing or auto-derived name field

**The gotcha:** If the data object doesn't include a `name` field, `PipelineWriteService` auto-derives it from `title`, `displayName`, `category`, or `className-id`. This is fine for most objects, but it can lead to confusing Object names in the GQL schema if the auto-derivation picks an unexpected field.

**Best practice:** Always include `name` explicitly in the data object. For junctions, use a machine-readable name like `${orgId}-${fkId}` or `${orgId}-skill-${skillId}`.

### 4.5 Delete via markDeleted (not separate method)

**The gotcha:** AuditgraphDB doesn't have a separate DELETE operation. Instead, you mark objects for deletion using the `markDeleted` field on the `SimpleBatch`. The `PipelineWriteService.deleteEntity()` method handles this by passing the IDs as the fourth argument to `SimpleBatch()`:

```typescript
const batch = new SimpleBatch(
  new UUID(classId),
  [],       // no data to add
  [],       // no tags
  ids,      // markDeleted — IDs to soft-delete
);
```

The record is marked but may still be fetchable depending on the GQL read filter. This is intentional (audit trail preservation).

### 4.6 Class ID not found at runtime

**The gotcha:** If a class name (e.g., `'ProviderSkill'`) is not in `SME_MART_CLASS_IDS`, the lookup `SME_MART_CLASS_IDS[className]` returns `undefined`. This is passed to `SimpleBatch` as `new UUID(undefined)`, which may fail silently or throw an obscure error.

**Mitigation:** Verify all class IDs are registered BEFORE executing any writes. The planner must gate on this.

### 4.7 Enum values must match published schema exactly

**The gotcha:** Enum fields like `proficiencyLevel`, `businessClassification`, `addressType` must match the exact string values defined in the YAML schema. Typos or mismatched cases will likely fail at the GQL write layer or cause silent failures.

**Examples (must be exact):**
- `proficiencyLevel`: 'beginner' | 'intermediate' | 'advanced' (lowercase)
- `businessClassification`: 'Nonprofit' | 'Not-for-profit' | 'Government' | ... (mixed case)
- `employeeCount`: '1-10' | '11-50' | '51-100' | '101-500' | ... (ranges with hyphens)
- `coverageType`: 'D&O' | 'General Liability' | ... (exact spelling)

---

## 5. Needs MCP Confirmation

The following gaps cannot be resolved without ZB MCP (currently locked due to profile conflict):

1. **Class IDs for Provider* + corporate-profile classes** — all 13 classes need their deterministic UUIDs verified from `platform.Class.list` or `platform.Class.getClass(className)`:
   - `ProviderSkill`, `ProviderRole`, `ProviderProduct`, `ProviderFramework`, `ProviderSegment`, `ProviderServiceSegment`
   - `OrgProfile`, `Address`, `InsuranceCoverage`, `ClientReference`, `Personnel`, `FinancialProfile`, `OrgSegment`
   
   **Priority:** CRITICAL — blocks all writes

2. **businessClassification enum values (D-57)** — the YAML schema lists 7 values, but MCP can confirm the exact GQL enum:
   - Expected (from migration-mapping §7 #7): 'Nonprofit', 'Not-for-profit', 'Government', 'Hospital/Healthcare Institution', 'Publicly-traded', 'PE-backed', 'Privately-held', 'Individual/Sole Proprietor'
   - Verify spelling, casing, and whether all 7 are present in the live GQL schema

   **Priority:** HIGH — form validation depends on this

3. **employeeCount enum values (D-57 re-band)** — the YAML lists the re-banded 7 values:
   - Expected: '1-10', '11-50', '51-100', '101-500', '501-1000', '1001-5000', '5000+'
   - Verify the legacy '51-200' / '201-500' bands are NOT in the live schema (migration blocker if they coexist)

   **Priority:** MEDIUM — impacts legacy form migration

4. **Coverage type enum values** — the schema lists examples (D&O, General Liability, etc.) but the authoritative list lives in the GQL schema:
   - Current values unclear; likely an extensible enum, not a fixed set
   
   **Priority:** LOW — form can use free-text if needed

---

## 6. Open Questions for Planner

1. **Delete parameter naming:** The existing stub signatures use confusing names (`deleteSkill(_skillId)` where `_skillId` is actually the record ID, not the Catalog skill ID). Should these be renamed to `deleteSkill(_recordId)` for clarity, or is the current naming acceptable? This affects the component call sites.

2. **ID generation strategy:** Should `PipelineWriteService` handle UUID generation for new records, or should callers provide IDs? Current code assumes callers provide `id` in the data object; if not present, the object is rejected. Should there be a convenience method like `pushNewEntity()` that auto-generates an ID?

3. **OrgProfile write semantics:** When `updateProfile()` is called with only a subset of fields (e.g., just `tagline`), should other fields be cleared or preserved? Current pattern pushes the full object, so fields not in the payload will be overwritten with `undefined`. Should the service fetch the current OrgProfile, merge incoming changes, and then push the merged result?

4. **Address lifecycle:** When HQ location is updated, should the old address be deleted (markDeleted)? Current pattern assumes a 1:1 HQ address per org with deterministic ID `address-${orgId}-hq`. If that ID is reused on each update, the Pipeline.receive will upsert (update), not create a new address. This is likely correct but should be confirmed.

5. **Verification defaults for corporate-profile form:** Should the form default to `verified: false`, `verificationSource: null` for all manually-entered claims, or should some sections (e.g., insurance with certificate upload) have a path to `verified: true`? Current Half B implementation defaults all to `false` per D-53 ("asserted, not yet vetted").

6. **Error handling strategy:** If `pushEntity` throws (class ID not found, invalid enum value, etc.), should the component show a user-friendly error dialog, log to sentry, or both? Current PipelineWriteService logs to console.warn and re-throws.

---

## Confidence Breakdown

| Area | Level | Reason |
|------|-------|--------|
| **PipelineWriteService API** | HIGH | Verified from source code; pushEntity/deleteEntity signatures locked |
| **Published field shapes** | HIGH | Verified via npm pack of 2.0.6; all YAML class definitions inspected |
| **Org-scoped write pattern** | HIGH | Design intent (migration-mapping) matches published schema exactly; no drift |
| **Enum values (businessClassification, employeeCount)** | MEDIUM | YAML lists values; GQL enum may differ; needs MCP confirmation |
| **Class ID registration** | LOW | Not in code; MCP query required to resolve |
| **Delete via markDeleted** | MEDIUM | Verified from code; no field data, no tags; only IDs in SimpleBatch fourth arg; semantics (soft-delete vs hard-delete) unconfirmed |
| **Cache merge behavior** | HIGH | Verified from code (line 238); intended for partial updates |

---

## Sources

### Primary (HIGH confidence)
- Published schema npm package: **`@zerobias-org/schema-w3geekery-smemart@2.0.6`** — all class YAML definitions verified 2026-06-25
- **`src/app/core/services/pipeline-write.service.ts`** — PipelineWriteService API, pushEntity/deleteEntity signatures, SimpleBatch structure
- **`.planning/phases/33-profile-expertise-company-info-re-home/33-CONTEXT.md`** — phase locked contract, decisions D-54/D-56/D-57, §7 RESOLUTIONS
- **`.planning/director/profile-migration-mapping-2026-06-08.md`** — migration design intent, junction field mappings (§2), typed-class targets (§4)

### Secondary (MEDIUM confidence)
- **`src/app/core/services/seed-zb-provider.ts`** — demonstrates class ID registration pattern and empirically-validated UAT class ID for MarketplaceProfileItem
- **`src/app/core/services/pipeline-write.service.spec.ts`** — unit tests verify pushEntity cache behavior, name derivation, tag embedding

### Tertiary (references for future work)
- **`.planning/REQUIREMENTS.md`** (lines 25–34) — PROF-01..PROF-10 traceability
- **`.planning/docs/SDK_VERIFICATION_SOURCES.md`** — authoritative source policy (live schema verified before coding)
- **`.planning/docs/MODERNIZATION_GUIDE.md`** — Angular 21 patterns (executor must apply Touch-It-Fix-It on all modified files)

---

## Validation Checklist (for Planner)

Before `gsd-execute` is called:

- [ ] Class IDs for all 13 classes verified via ZB MCP (zerobias_describe or platform.Class.getClass)
- [ ] SME_MART_CLASS_IDS constant updated with verified UUIDs
- [ ] businessClassification enum values confirmed (7-value list, exact spelling)
- [ ] employeeCount re-band confirmed (51-100, 101-500 bands present; old bands removed or coexist?)
- [ ] Delete parameter naming clarified (recordId vs current naming)
- [ ] OrgProfile merge-vs-replace semantics decided
- [ ] Address lifecycle (1:1 HQ, upsert on update) confirmed
- [ ] Verification defaults strategy locked (all false/null, or per-section?)
- [ ] Error handling strategy (console.warn + rethrow, sentry, user dialog?) decided

---

**Phase 33 is fully ungated for planning. Both Half A (reads) and Half B (writes) are immediately executable pending class ID registration.**

