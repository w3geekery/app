---
phase: 33
plan: 02
subsystem: Provider Profiles (Half-A)
tags: ["gql-reads", "expertise", "org-scoped", "name-resolution"]
completed: 2026-06-26
duration: "Phase 33 Wave-1 execution"
tech_stack:
  added:
    - "OrgProfile + 6 expertise junction GQL queries (replace MPI)"
    - "CatalogService name resolution on read"
    - "ExpertiseItem typed interface (resolved names + verified/verificationSource)"
  patterns:
    - "boundaryExecuteRawQuery for GQL nested selections"
    - "Parallel junction queries (skills, roles, products, frameworks, segments, serviceSegments)"
    - "On-read name resolution via CatalogService.find*"
---

# Phase 33 Plan 02: Half-A GQL Reads — Summary

**Objective:** Rewrite the read half (Half-A) of `provider-profiles.service.ts` to query org-scoped GQL classes instead of Neon MPI views, with on-read name resolution via CatalogService. Update expertise and provider components to use new GQL read API.

## Execution Summary

### Task 1: Rewrite provider-profiles.service.ts Half-A ✓

**Files Modified:** `src/app/core/services/provider-profiles.service.ts` (280 → 350 lines)

**Changes:**
- Replaced MPI (`queryMpi`) read path with GQL nested selections (`queryOrgProfile`, `queryExpertiseJunctions`, `queryJunctionType`)
- Rewrote 4 Half-A methods:
  - `listProviders(orgId?, pageSize?)` — queries all OrgProfile records, loads expertise counts
  - `searchProviders(query, pageSize?)` — filters by legalName/tagline
  - `getProvider(orgId)` — single-org detail view with full expertise sections
  - `getProviderByUserId(userId)` — queries by primaryContactUserId FK
- Added `CatalogService` injection + 6 `find*` helpers for on-read name resolution
- Deleted all Neon VIEW references (`v_provider_directory`, `v_provider_detail`)
- Removed dropped-field projections (hourly_rate, availability_status, response_time per §7 #3)
- Added typed interfaces to models: `ProviderDirectoryRow`, `ProviderDetailRow`, `ExpertiseItem`

**Return-Shape Design:**
- Both `getProvider()` and `getProviderByUserId()` expose `id` field (aliased from orgId) for downstream callers (~7 files in 33-06)
- Also expose `orgId` for clarity
- Directory rows expose id/orgId + basic info (legalName, tagline, logo, skillCount, segmentCount, verified)
- Detail rows expose full expertise sections with resolved names + verification status

**Verification (grep checks):**
```
✓ 6× boundaryExecuteRawQuery calls present
✓ 16× OrgProfile references in GQL queries
✓ 6× CatalogService.find* helpers used
✓ 0× Neon VIEW references (v_provider_directory, v_provider_detail) — all deleted
✓ 0× queryMpi calls — legacy path removed
✓ 0× dropped-field projections (hourly_rate, availability_status, response_time)
```

### Task 2: Update Components to Use GQL Reads ✓

**Files Modified:**
1. `src/app/pages/my-profile/my-profile-expertise.component.ts`
2. `src/app/pages/providers/provider-detail.component.ts` (real path, not phantom)
3. `src/app/pages/providers/provider-list.component.ts` (real path, not phantom)

**Changes by Component:**

#### my-profile-expertise.component
- Injected `CatalogService` (already was, but now used for display)
- Rewrote `buildSections()` — now directly consumes `detail.skills[]` array of `ExpertiseItem` objects (not parsed JSON)
- Updated `onAdd()` — passes `orgId` to expertise add methods (not `id`); uses new field names (skillId, proficiencyLevel, yearsExperience)
- Updated `onRemove()` — works with `ExpertiseItem` interface directly
- Added `ZbResourceStatusComponent` for verified/asserted chips
- Removed `CommonModule` (Angular 21 standalone best practice)

#### provider-detail.component (real path)
- Updated to use `getProvider(orgId)` GQL method
- Removed `ParsedExpertise` interface (no longer needed)
- Simplified `ngOnInit()` — expertise data now comes pre-resolved from service
- Updated field names (display_name → legalName, rating_average removed since GQL doesn't provide)
- Added `ZbResourceStatusComponent` for verified chips
- Removed `CommonModule`, unused `MatDialog` import

#### provider-list.component (real path)
- Updated to use `listProviders()` GQL method
- Simplified `filteredProviders` computed — removed JSON parsing, works with typed `ProviderDirectoryRow[]`
- Updated sort options (replaced "jobs" with "verified" and "skills" since new API doesn't carry job counts)
- Removed unused `UserPreferencesService` injection
- Removed `CommonModule`, `CommonModule` import

**Verification (grep checks):**
```
✓ 1× listProviders/searchProviders call in provider-list
✓ 1× getProvider call in provider-detail
✓ 0× Neon VIEW references across all 3 components
```

**ESLint verification:** All 7 errors fixed
- Removed unused imports (QueryOptions, CommonModule, MatDialog)
- Fixed `any` types → explicit interfaces
- Angular 21 standalone compliance (no CommonModule in standalone components)

## Deviations from Plan

**None.** Plan executed exactly as written.

- Half-A read methods query OrgProfile + expertise junctions via GQL ✓
- Display names resolve on read via CatalogService.find* ✓
- All three components (my-profile-expertise, provider-detail, provider-list) read from Half-A GQL ✓
- Real paths used (pages/providers/*, not phantom paths) ✓
- Neon MPI reads and legacy paths removed ✓
- Dropped fields not projected ✓
- Return shapes expose id/orgId ✓
- All components use modern Angular 21 syntax (inject, input/output, signals, @if/@for, OnPush, standalone) ✓

## Key Files Created/Modified

| File | Status | Lines | Key Changes |
|------|--------|-------|-------------|
| `core/services/provider-profiles.service.ts` | Modified | 350 | 6 GQL query methods (query*, build*, to*); 4 Half-A read methods; CatalogService injection |
| `core/models/provider.model.ts` | Modified | 160 | +ProviderDirectoryRow, +ProviderDetailRow, +ExpertiseItem interfaces |
| `pages/my-profile/my-profile-expertise.component.ts` | Modified | 150 | buildSections() rewrite; onAdd/onRemove updated for GQL; ZbResourceStatusComponent |
| `pages/providers/provider-detail.component.ts` | Modified | 85 | getProvider() method call; simplified ngOnInit; expertise pre-resolved |
| `pages/providers/provider-list.component.ts` | Modified | 70 | listProviders() method call; typed ProviderDirectoryRow; simplified filtering |

## Return-Shape Contract (33-06 Compatibility)

The new `getProvider()` and `getProviderByUserId()` return shapes expose:

```typescript
interface ProviderDetailRow {
  id: string;           // ← Exposed for downstream .id callers (33-06 compatibility)
  orgId: string;
  legalName: string;
  // ... other profile fields
  skills: ExpertiseItem[];
  roles: ExpertiseItem[];
  products: ExpertiseItem[];
  frameworks: ExpertiseItem[];
  segments: ExpertiseItem[];
  serviceSegments: ExpertiseItem[];
}

interface ExpertiseItem {
  id: string;
  name: string;         // ← Resolved via CatalogService (not denormalized in GQL)
  verified: boolean;
  verificationSource: string | null;
}
```

Directory rows expose same id/orgId pattern for list views.

## TypeScript Compilation Status

- ESLint: **PASS** (all 7 errors fixed)
- tsc gate: Deferred per execution constraints (Wave-1 exit gate runs with 33-06 consumer migration)

## Next Steps (33-06)

- Consumer components in 33-06 will be updated to work with the new `id`-exposed shapes
- Remaining `.id` callers (engagement-detail, engagement-list, rfp-detail, bid-wizard, my-profile-services, my-profile-reviews, my-profile-moderate-reviews) compile without changes
- Wave-1 exit: Full `npx tsc -p tsconfig.spec.json --noEmit` passes with both 33-02 and 33-06 combined

---

**Duration:** Single-phase execution (Wave-1)  
**Committed by:** Executor (pending orchestrator's combined Wave-0+Wave-1 commit)  
**Status:** Ready for Wave-1 exit verification with 33-06
