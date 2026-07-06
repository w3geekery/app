---
phase: 33
phase_name: Profile / Expertise / Company-Info Re-Home
status: draft
design_contract: ../../design/DESIGN.md
scope: Two net-new surfaces + two picklist specifications (no design work)
mocks_generated: 0
stitch_prerequisites_missing: true
---

# Phase 33: UI Specification
## Profile / Expertise / Company-Info Re-Home

**Date:** 2026-06-25  
**Scope:** Exactly 2 net-new UI surfaces; 2 picklist specifications (LOCKED values, standard components); out-of-scope re-pointing of existing patterns.

---

## Surface 1: ServiceSegment Multi-Select Picker

**Requirement:** PROF-08 + Phase Context §7 #1 (D-56, Option B)

**Problem:**
The legacy provider onboarding offered 9 hardcoded hydra `service-segment` tags. Phase 33 migrates to the real Catalog Service segments: **37 categories beneath the `d_svc` Services domain, with 133 `segmentType: service` leaf nodes** (deterministic UUIDs, resolved via `CatalogService.findSegment()` on read). A flat 9-chip picker does NOT scale to 133.

**Design Recommendation: Hybrid Category-Browse + Search Typeahead**

**Rationale:**
- **Category taxonomy is user-navigable.** The 37 categories (e.g., "Governance," "Risk Assessment," "Incident Response") are broad enough to reduce cognitive load; users can browse categories then drill to specific services.
- **Search covers long-tail discovery.** A user looking for "CMMC compliance" can typeahead rather than hunting the category tree.
- **Multi-select flexibility.** Providers typically claim 2–5 services; single-select would underserve the intent.
- **ngx-library fit:** `ZbSimpleMultiAutocompleteComponent` + optional custom category-group UI above it (or dual-column: categories on left, services on right when a category is selected).

**Component Selection:**
- **Primary:** `ZbSimpleMultiAutocompleteComponent` (core multi-select typeahead, resolves service names via loader)
- **Alternative UI:** An optional category-browse pane (Material `mat-nav-list` with category headers) piped into a filtered service list when a category is clicked (advanced implementation; core requirement is typeahead + multi-select)

**Interaction:**
1. User opens the picker (dialog or inline dropdown, context determines)
2. Sees a typeahead input field (placeholder: "Search or browse services…")
3. Typing filters services by name (case-insensitive prefix match)
4. Selected services appear as chips below the input, each removable
5. If category-browse UI is implemented: left pane shows 37 categories; clicking a category narrows the typeahead to services in that category; user can still freetext search within the narrowed set
6. Escape or click outside closes the picker

**States & Tokens:**
- **Input field:** `mat-form-field appearance="outline"`, tokens: `input` component (outline #556068, surface #f5faff)
- **Selected chips:** `ZbChipColorsDirective` on rendered chip elements, or re-render via chip output; neutral chip tokens (`chip-neutral`: surface-container bg, on-surface text, caps typography)
- **Removal button:** standard Material close icon per chip
- **Empty state:** "No services selected. Start typing to search or browse categories." (body-md, on-surface-variant text)
- **Loading state:** spinner during `CatalogService.findSegments()` call (if async)
- **No-match state:** "No services match 'xyz'. Try another keyword." (body-sm, error color #ba1a1a for emphasis)

**Field Mapping:**
- Component receives org ID + reads `ProviderServiceSegment[]` from GQL (which carries `serviceSegmentId` UUIDs)
- Component calls `CatalogService.findSegments(ids)` to resolve names (leverages existing loader)
- On save: emits `@output() serviceSegmentsChanged: EventEmitter<string[]>` (array of Catalog service-segment UUIDs)
- Service receives the array and writes via `addServiceSegment(orgId, {serviceSegmentId, isPrimary})` (one call per selected UUID)

**Out of Scope:**
- Browse provider directory filter by service segment (Phase 34)
- RFP request with service-segment targeting (Phase 34)

---

## Surface 2: Asserted-vs-Vetted Provenance Display (PROF-07)

**Requirement:** PROF-07 + Phase Context Decisions D-53 (per-claim verification)

**Problem:**
Every expertise claim (skill, role, product, framework, segment, service-segment) + typed-class record (insurance, reference, personnel, financial) now carries `verified` (boolean) + `verificationSource` (string|null). The buyer/user needs to see which claims are self-asserted ("I say I have CMMC experience") vs platform-vetted ("Verified via background check"). Currently INVISIBLE; no existing pattern in the codebase.

**Design Recommendation: Status Chip + Optional Tooltip**

**Approach:**
Render a small **inline status chip** next to each claim, following the ngx-library status-chip pattern (`ZbResourceStatusComponent`). Two states:

| State | Chip | Rendering | Semantic |
|-------|------|-----------|----------|
| **Asserted** (verified=false) | `status: 'asserted'` | Light gray background (#e9e9e9, neutral), text "ASSERTED", white ink (#0f0f10) | Claim not yet vetted; self-entered by the user |
| **Verified** (verified=true) | `status: 'verified'` | Light green background (#d8ecba, status-done), text "VERIFIED", white ink (#0f0f10) | Claim has been vetted; source in `verificationSource` (tooltip) |

**Interaction & Tokens:**
- **Chip placement:** Immediately after the claim label/name. E.g., "CMMC Assessor VERIFIED" or "Kubernetes ASSERTED"
- **Chip size:** `ZbResourceStatusComponent` default (small, inline); uses `ZB_TABS_DEFAULTS` padding (4px 10px, caps typography 12px)
- **Tooltip (verified only):** On hover of a VERIFIED chip, show a small Material tooltip: "Verified via: {verificationSource}". E.g., "Verified via: background-check" or "Verified via: audit-report". If `verificationSource` is null, omit the tooltip.
- **Interaction:** Click on the chip does nothing (info-only); icons (if any) are read-only status indicators
- **Typography:** `caps` token (Roboto, 12px, 500 weight, +letter-spacing) for chip text

**Component Implementation:**
- Loop over expertise claims (skills, roles, products, frameworks, segments, service-segments) in the display component
- For each claim, render: `<zb-resource-status [label]="claim.verified ? 'verified' : 'asserted'" [tooltip]="claim.verificationSource || null"></zb-resource-status>`
- Leverage `ZbResourceStatusComponent`; it handles caps rendering + color mapping per the ngx-library design
- Apply the status-color mapping: `asserted` → `status-backlog` (#e9e9e9), `verified` → `status-done` (#d8ecba)

**Application Scopes:**
- **Expertise list (my-profile expertise component):** Each row in the skill/role/product/framework/segment/service-segment list shows its status chip inline
- **Provider detail view (read surfaces):** Same chip display when viewing another provider's claims
- **Corporate-profile form sections:** Each row in insurance/reference/personnel/financial tables shows status chip for that record's `verified`/`verificationSource`

**Design Tokens Used:**
- Colors: `status-backlog` (#e9e9e9 asserted), `status-done` (#d8ecba verified), `status-label` (#0f0f10 text)
- Typography: `caps` (12px, 500, +letter-spacing)
- Spacing: ngx-library chip defaults (4px 10px padding, full 9999px border-radius)
- Component: `ZbResourceStatusComponent` (from ngx-library public-api)

**Out of Scope:**
- Vetting workflow (who verifies, approval process) — Phases 033/transparency track
- Disclosure-gating (hiding sensitive sections from unvetted claims) — Phases 033 vetting gate
- User-facing "request verification" UI — out of this phase scope

---

## Picklist Specifications (No Design Work)

### businessClassification Enum Picker

**Requirement:** PROF-05 + PROF-10 + Phase Context D-57

**Component:** Standard Angular Material `mat-select` (single-select), no custom styling.

**Field:** `OrgProfile.businessClassification` (enum, 7 values, LOCKED per Director precision 2026-06-25)

**Values (key → label, verbatim):**
```
NONPROFIT               → "Nonprofit / Not-for-profit"
GOVERNMENT             → "Government"
HOSPITAL_HEALTHCARE    → "Hospital/Healthcare Institution"
PUBLICLY_TRADED        → "Publicly-traded Company"
PE_BACKED              → "PE-backed Company"
PRIVATELY_HELD         → "Privately-held Company"
INDIVIDUAL_SOLE_PROPRIETOR → "Individual / Sole Proprietor"
```

**Integration:** Used in the company-info onboarding section + the 6-section corporate-profile form (`company-profile-form.component`). Bind the selected value to the service write path (`updateProfile(orgId, {businessClassification})` via `PipelineWriteService`).

---

### employeeCount Re-Banded Enum Picker

**Requirement:** PROF-05 + PROF-10 + Phase Context D-57 (re-band)

**Component:** Standard Angular Material `mat-select` (single-select), no custom styling.

**Field:** `OrgProfile.employeeCount` (enum, 7 re-banded values, LOCKED per 2.0.6 published schema)

**Values (single-select options, exact strings):**
```
"1-10"
"11-50"
"51-100"
"101-500"
"501-1000"
"1001-5000"
"5000+"
```

**Note:** Legacy onboarding used `"51-200"` and `"201-500"`; these are RETIRED in schema 2.0.6. Touch-it-fix-it: any legacy values in `company-profile-form.component.html:210-211`, `company-info.model.ts`, or `seed-zb-provider.ts` must be updated to the new bands.

**Integration:** Used in company-info onboarding + corporate-profile form. Bind to service write path (`updateProfile(orgId, {employeeCount})`).

---

## Out of Scope (Repoint, Do Not Redesign)

The following components are **being re-pointed to typed classes** but require **no UI-SPEC changes** (they retain their current design, only the data source changes):

- **Expertise component layout** (`my-profile-expertise.component`) — layout unchanged; component re-points reads from MPI to GQL selections over `ProviderSkill`/`ProviderRole`/`ProviderProduct`/`ProviderFramework`/`ProviderSegment`/`ProviderServiceSegment` + resolves names via `CatalogService`
- **Onboarding company-info screens** — KV section writes re-point to `OrgProfile` + `Address` + PKV; no layout changes
- **6-section corporate-profile form** — sections re-point to `InsuranceCoverage`/`ClientReference`/`Personnel`/`FinancialProfile`/`OrgProfile`; form UX unchanged
- **Provider directory / search surfaces** — read re-points from Neon VIEWs to GQL nested queries; no filter/sort/layout changes
- **Profile-review surfaces** — read re-point; no redesign

---

## Implementation Notes

### Angular 21 Modernization (Machine-Enforced)

Every touched file must apply these rules (diff-based gating at `--max-warnings=0`):
- `inject()` not constructor injection
- `input()`/`input.required<T>()`/`output<T>()` not `@Input`/`@Output`/`EventEmitter`
- `signal()`/`computed()`/`effect()` for state
- `@if`/`@for`/`@switch` not `*ngIf`/`*ngFor`
- Standalone only (no NgModule)
- `OnPush` change detection
- `readonly` properties
- No `any` types
- Type-suffixed filenames (`.component.ts`, `.service.ts`, etc.)

Consult `.planning/docs/MODERNIZATION_GUIDE.md` for detailed before/after patterns.

### ngx-library Component Verification

All components referenced in this spec are verified live in `@zerobias-org/ngx-library` public-api (v0.2.25+):
- `ZbSimpleMultiAutocompleteComponent` ✓
- `ZbSearchInputComponent` ✓ (optional, for category-browse typeahead variant)
- `ZbResourceStatusComponent` ✓
- `ZbChipColorsDirective` ✓

### Design Token Compliance

All colors, typography, spacing, and component styles derive from `.claude/design/DESIGN.md` (canonical source). No hardcoded hex values in component code; use `--zb-*` / `--mat-sys-*` CSS custom properties.

---

## Phase Deliverables

**This UI-SPEC covers the design contract for:**
1. ServiceSegment picker interaction, component selection, and state/token mapping
2. Asserted-vs-vetted provenance chip display + tooltip interaction
3. businessClassification + employeeCount picklist value mappings (no design work)

**Not included in this spec:**
- Half A read-path queries (GQL nested selections — covered in `33-RESEARCH.md`, write-path research)
- Half B write-path mechanics (PipelineWriteService — covered in `33-RESEARCH.md`)
- Model rewrite or service migration (in-scope for the planner/executor, not UI-SPEC)

---

*UI-SPEC locked: 2026-06-25*  
*Scope intentionally narrow per Director Parks 2026-06-25 guidance (migration phase, not feature expansion)*
