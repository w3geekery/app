# Vetting Tab — Current Shape Inventory

**Captured:** 2026-05-19 (Phase 32 discuss-phase pre-capture)  
**Purpose:** Inform Phase 32 Boards brief Q-4 (specialized rendering) + Q-5 (data migration path) + L-10 (Vetting → Board migration)  
**Status:** SME Mart Vetting remains on legacy GQL `EngagementVettingItem` path (Phase 29.5 deferred modernization to backlog entry `VETTING-PLATFORM-MIGRATE-1`).

---

## Component Inventory

| File Path | Role | LOC | Standalone |
|-----------|------|-----|-----------|
| `src/app/pages/engagements/tabs/vetting-tab.component.ts` | Tab container; CRUD wiring; progress calc; status transitions | 232 | Yes |
| `src/app/pages/engagements/tabs/vetting-tab.component.html` | Expansion-panel-based checklist; dual-section layout (buyer requires / provider requires); gate banner | 252 | — |
| `src/app/pages/engagements/tabs/vetting-tab.component.scss` | Material expansion theming; gate-banner colors | ~60 | — |
| `src/app/pages/engagements/tabs/vetting-suggestion-panel.component.ts` | Sub-component: profile-item attachment suggestions (D-04) | ~80 | Yes |
| `src/app/pages/engagements/tabs/vetting-suggestion-panel.component.html` | Inline suggestion panel for expired attachments | ~40 | — |
| `src/app/core/services/vetting.service.ts` | CRUD API: list, create, update, delete; GQL field mapping; cache; DemoVisibilityService integration | ~280 | — |
| `src/app/core/services/vetting.service.spec.ts` | Unit tests | ~100 | — |
| `src/app/core/models/vetting-item.model.ts` | Type defs (VettingStatus, VettingCategory, VettingType); EngagementVettingItem interface; status transition FSM; DEFAULT_VETTING_TEMPLATES | 177 | — |
| `src/app/core/gql-types/vetting-item.types.ts` | GQL response type: GqlVettingItemResponse | 36 | — |
| `src/app/shared/components/vetting-item-dialog/vetting-item-dialog.component.ts` | Dialog: create/edit vetting item | ~100 | Yes |
| `src/app/core/field-mappings/index.ts` | VETTING_ITEM_FIELD_MAPPING; mapGqlToNeon / mapNeonToGql | ~50 | — |

**Total:** ~1,300 LOC (component + service + dialogs + types)

---

## Where It's Mounted

- **Route:** `/engagements/:id/vetting` (child route of engagement detail)
- **Parent component:** `engagement-detail.component.ts` (tabs: overview | tasks | timeline | notes | documents | vetting)
- **Tab position:** #5, label `Vetting`
- **Navigation:** Tab nav bar at engagement detail; each tab routed via `<router-outlet />`

---

## Data Shape

**Type:** Custom GQL schema class (NOT platform.Project, NOT platform.Board, NOT Neon table)

**Storage:** AuditgraphDB via dual-read window (Phase 29.5–31)
- **Write path:** GQL class `EngagementVettingItem` via `PipelineWriteService` (fire-and-forget async)
- **Read path:** GQL `EngagementVettingItem` via `GraphqlReadService` + `VETTING_ITEM_FIELD_MAPPING` hydration
- **Status:** Marked `@Deprecated` on `zerobias-org/schema` (Phase 29.5 Plan 05). Dual-read window still open; deletion blocked until Phase 31 closes the fallback.

**Schema:** GQL class `EngagementVettingItem` with these fields:

```typescript
interface GqlVettingItemResponse {
  // Object base
  id: string;
  name: string;
  description?: string | null;

  // Vetting-specific
  engagementId: string;
  category: 'always' | 'conditional' | 'nice_to_have';
  vettingType: 'corporate_identity' | 'insurance' | 'compliance' | 'financial' | 'legal' | 'reference' | 'certification' | 'documentation';
  evidenceType: 'document' | 'form' | 'certification' | 'attestation' | 'reference';
  status: 'not_started' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 'expired' | 'waived';
  direction: 'buyer_requires' | 'provider_requires';
  conditionTrigger?: string | null;
  documentIds?: string | null;      // JSON stringified array
  submittedAt?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  expiresAt?: string | null;
  rejectionReason?: string | null;
  waivedReason?: string | null;
  notes?: string | null;

  // Timestamps (Object)
  dateCreated: string;
  dateLastModified: string;
}
```

---

## Vetting Status & State Machine

**VettingStatus enum:**
```typescript
type VettingStatus =
  | 'not_started'    // Initial state
  | 'submitted'      // Evidence uploaded / attested
  | 'under_review'   // Verifier actively reviewing
  | 'verified'       // Approved; satisfies requirement
  | 'rejected'       // Verifier denied; resubmit or waive
  | 'expired'        // Verified item has passed expiration date
  | 'waived'         // Requirement explicitly waived
```

**Valid transitions (VETTING_STATUS_TRANSITIONS FSM):**

| From | To (allowed) |
|-----|------|
| `not_started` | submitted, waived |
| `submitted` | under_review, rejected, waived |
| `under_review` | verified, rejected |
| `verified` | expired |
| `rejected` | submitted, waived |
| `expired` | submitted |
| `waived` | not_started |

**VettingGateStatus** (summary-level rollup):
- `not_started` — zero items added
- `in_progress` — items pending verification; >= 1 "always" item unresolved
- `blocked` — >= 1 rejected or expired item
- `verified` — all "always" items verified or waived

---

## UX Primitives Worth Preserving (Q-4)

1. **Vetting Gate Banner** — Status-coded card (verified→green checkmark, in-progress→hourglass, blocked→red stop-icon) with summary text. Sits above the checklist. Communicates overall engagement readiness.
2. **Dual-section layout** — "Requirements FOR Provider" (buyer's requirements) and "Requirements FROM Provider" (provider's requirements). Each section has its own expansion-panel accordion, progress bar, and add button.
3. **Material Expansion Panels** — Each vetting item is a Material expansion panel with:
   - Header: status icon (material icon per status), item name, status badge (Material pill via `zb-resource-status`), verified-date and expiration-date meta
   - Collapsed → title only visible
   - Expanded → full details (description, evidence-type, category, verified-by, rejection-reason, waiver-reason, notes, document-count, action buttons)
4. **Progress bar** — Teal progress bar showing resolved/total per section (resolved = verified + waived)
5. **Expired attachments alert** — Yellow warning panel for items with expired `profile_item_id` references; includes action button to navigate to Corporate Profile renewal
6. **Status transition menu** — Dropdown menu on each item allowing state changes to valid next states (per FSM). Updates immediately; snackBar confirmation.
7. **Delete button** — Icon button on each item for removal (red/warn color).
8. **Add button** — Icon button in each section header to create new vetting item for that direction.

---

## CRUD Wiring

**Read:**
- `vetting.service.listVettingItems(engagementId)` → GraphQL query via `GraphqlReadService`
- `vetting.service.getVettingSummary(engagementId)` → Computes progress/gate status from loaded items
- Component initializes on `ngOnInit` via `loadItems()`, which sequentially awaits `vetting.initializeVetting(engagementId)` (returns items + side-effects any required seed) then `vetting.getVettingSummary(engagementId)` (rolls up gate status from loaded items)
- DemoVisibilityService post-filters results (admin bypass)

**Create:**
- `openAddDialog(direction)` → `VettingItemDialogComponent` modal
- Dialog returns `CreateVettingItemRequest` on close
- `vetting.service.addVettingItem(engagementId, request)` → `PipelineWriteService.pushEntity('EngagementVettingItem', ..., CALLSITE_TAG.VETTING_ADD)`
- On success: reload items + snackBar

**Update:**
- `vetting.service.updateVettingItem(itemId, patch: UpdateVettingItemRequest)` → `PipelineWriteService.pushEntity(..., CALLSITE_TAG.VETTING_UPDATE)`
- Status changes: `onStatusChange()` → validate transition via FSM → update
- Profile item attach/detach: `attachProfileItem()` / `detachProfileItem()` → update + reload
- On success: reload items + snackBar
- Fire-and-forget async (no await in component)

**Delete:**
- `vetting.service.deleteVettingItem(itemId)` → `PipelineWriteService.deleteEntity(itemId, ...)`
- `onDelete()` → confirm, delete, reload, snackBar
- Fire-and-forget async

---

## Volume in Production / UAT / CI

**Current status:** SME Mart vetting data lives in **AuditgraphDB** (GQL class). No direct count available without running a GQL query or checking Phase 29.5 schema-provider side-effects.

**Key finding from Phase 20 audit (errata 023, 2026-04-28):**
- EngagementVettingItem had a **fictional class ID** from Plan 063 until corrected by Plan 026 (commit range `977828c..904276d`)
- All vetting writes through `vetting.service.ts` silently failed for months under the wrong class ID
- **Result: ZERO vetting-item writes ever landed in production.** Component read-only; no actual engagement vetting records exist beyond demo seed data (if any)

**Implication for Q-5 migration risk:** Data migration risk is **LOW** — no production records to migrate, only demo data (seeded as part of engagement provisioning templates).

---

## Phase 29.5 Migration Touchpoints

**Brief:** `.planning/phases/29.5-platform-model-migration/29.5-CONTEXT.md` + `INVENTORY.md`

**Outcome:** Phase 29.5 Plan 07 was authored pre-amendment expecting vetting to migrate to `platform.Board` (lazy-create, `boardType="list"`, `isDefault=false`). During Plan 07 execution, empirical grep confirmed zero `platform.Board` / `platform.Task` references in `vetting.service.ts` — modernization was never implemented.

**Director Decision (errata 031, 2026-05-12):** Vetting modernization **deferred** to backlog entry `VETTING-PLATFORM-MIGRATE-1` (broader scope: both items→Task AND Board lazy-create). Plan 07 marked **PREMISE-OBSOLETE / DEFERRED**.

**Schema status:**
- EngagementVettingItem marked `@Deprecated` in PR (Phase 29.5 Plan 05)
- Dual-read window: open until Phase 31 closes the fallback
- Deletion: post-Phase 31 via `SCHEMA-RETIREMENT-DELETE-1` (coordinate with Daniel Rojas / Content team)

**App code impact:** ZERO impact from Phase 29.5 to vetting-tab or vetting.service. They remain on legacy path. Phase 32 (Boards brief) does not touch vetting (Foundation scope); Vetting migration lives in Phase 33 Polish per Director SPLIT.

---

## Phase 32 Migration Risk — For Q-5

**Risk level: LOW**

**Why:**
1. **Zero production records** — Phase 20 audit confirmed all vetting writes silently failed under old class ID; no real engagement vetting data exists
2. **Demo data only** — any vetting items are seeded during engagement provisioning (demo scope)
3. **Component is read-only in practice** — no actual create/update/delete occurring
4. **Clean GQL→platform.Task mapping available** — vetting items map cleanly to `platform.Task` (parent engagement + subtasks for buyer/provider requirements)
5. **Status FSM translates directly** — VettingStatus → platform.Task.status (verified → resolved, rejected → failed, etc.)

---

## Migration Approach Options

### Option A: Bulk re-create as Tasks under new Vetting Board

**Approach:**
1. On first engagement load, detect any legacy `EngagementVettingItem` records via GQL query
2. If found, auto-create a `platform.Board` (tag: `sme-mart.board.vetting`, `boardType: "list"`, `isDefault: false`)
3. Bulk-create `platform.Task` records for each vetting item (parent: engagement Project, board: vetting Board)
4. Map status: VettingStatus → platform.Task.status (see mapping table below)
5. Delete legacy GQL records (optional; dual-read window allows both to coexist)

**Pros:**
- Single migration step; no dual-read window
- Leverages platform.Task machinery (priority, due-date fields available for future use)
- Vetting Board taxonomy matches Q-10 design intent
- Clean separation of concerns

**Cons:**
- Requires new logic in provisioner or engagement-context service
- Platform.Task has different field shape (no `evidence_type`, `condition_trigger` fields); these become metadata or dropped

### Option B: Leave legacy records, add tag, rendering layer handles both

**Approach:**
1. Keep `EngagementVettingItem` records in GQL
2. Add `sme-mart.board.vetting` tag to engagement Project to signal "has vetting requirements"
3. Update vetting-tab component to detect tag and signal Board-rendering preference to parent
4. Rendering layer (engagement-detail or transparency-center) switches from tab to Board view
5. Dual-read window remains open until Phase 31 closes it

**Pros:**
- Zero data migration; leave legacy GQL path intact
- Minimal component changes
- Clean Phase 31 transition point

**Cons:**
- Maintains dual-read burden longer
- Component logic branches on tag presence
- Phase 31 still requires backlog `VETTING-PLATFORM-MIGRATE-1` to clean up

### Option C: Wipe + reseed

**Approach:**
1. Delete all legacy `EngagementVettingItem` records (demo data only; no production loss)
2. Lazy-create vetting `platform.Board` on first vetting requirement add
3. Force new vetting flow to use only `platform.Task` going forward
4. Phase 32 (Boards Foundation) ships generic boards; Phase 33 (Polish) adds the Vetting Board specialization on top — both phases consume the same shared component substrate

**Pros:**
- Cleanest final state; no legacy path
- Single source of truth (platform.Task only)
- Phase 30 can assume vetting Board exists

**Cons:**
- Breaks demo scenarios that expect vetting items to exist pre-seeded
- Requires engagement provisioner + demo-seed updates

---

## Recommended Approach: **Option A (Bulk re-create)**

**Rationale:**

- **Production risk is zero** (no real data), so cost of migration is purely code
- **Aligns with Phase 32 Boards intent** — vetting Board should exist as a specialized Board type (L-10 lock)
- **Unblocks Phase 30** (Boards brief) — if Boards rendering code assumes vetting Board is a `platform.Board`, then Option A makes that true from day one
- **Clean Q-5 answer** — "vetting items become platform.Task records under the vetting Board"
- **Phase 31 cleanup is simpler** — schema deletion happens without data migration (all records already migrated in Phase 32)

**Implementation sequence:**

1. **Phase 32 Plan 02** (Platform Vetting Board creation):
   - Lazy-create `platform.Board(tag: sme-mart.board.vetting, ...)` on first vetting requirement
   - Add helper in provisioner or engagement-context to create the board if missing
   
2. **Phase 32 Plan 03** (Vetting items → platform.Task):
   - Migrate legacy `EngagementVettingItem` → `platform.Task` on engagement load (one-time, auto)
   - Map VettingStatus → platform.Task.status:
     ```
     vetting.not_started        → task.not_started
     vetting.submitted          → task.in_progress (or new "pending_verification" if platform adds it)
     vetting.under_review       → task.in_progress
     vetting.verified           → task.resolved
     vetting.rejected           → task.failed
     vetting.expired            → task.resolved (with "expired" marker in notes/metadata)
     vetting.waived             → task.resolved (with "waived" marker)
     ```
   - Store non-portable fields (evidence_type, condition_trigger) in `platform.Task.notes` or tag it with metadata
   
3. **Phase 32 Plan 04** (Vetting-tab rendering refactor):
   - Repoint vetting-tab to read from `platform.Board / platform.Task` query
   - Keep expansion-panel UX intact (Q-4 requirement)
   - Remove legacy `EngagementVettingItem` service calls

4. **Phase 31 cleanup:**
   - Close dual-read fallback
   - Delete `EngagementVettingItem` from schema (backlog `SCHEMA-RETIREMENT-DELETE-1`)

---

## Gotchas & Surprises

1. **Profile item references** — `EngagementVettingItem.profile_item_id` links to `MarketplaceProfileItem` (another legacy GQL class slated for Phase 29.5 migration). On vetting items→Task migration, these links persist but may need explicit handling if `MarketplaceProfileItem` itself migrates before Phase 32.

2. **Status icon rendering** — Component has specialized Material icons per VettingStatus (`check_circle` for verified, `cancel` for rejected, etc.). When moving to platform.Task, the icon set changes (platform.Task has different status enum). Q-4 rendering preservation means the vetting Board specialization must include a custom status-icon pipe/directive.

3. **Dual-section layout** — Vetting items are grouped by `direction` (buyer_requires vs provider_requires). platform.Task has no native direction field. Options:
   - Store direction as a tag (sme-mart.vetting-direction.buyer | sme-mart.vetting-direction.provider)
   - Derive direction from parent hierarchy (buyer = parent engagement; provider = derived from Task.assignee or org context)
   - Store direction in Task notes/metadata
   Choose before Plan 02.

4. **Expiration tracking** — `EngagementVettingItem.expires_at` is vetting-specific. platform.Task has `dueDate` field; consider mapping expires_at → dueDate for automatic expiration alerting (Phase 32 Plan 04 consideration).

5. **Default templates** — `DEFAULT_VETTING_TEMPLATES` (6 "always required" items) are hardcoded in `vetting-item.model.ts`. On platform.Task migration, these become seeded Task records. May need a provisioner helper or dedicated board initialization.

6. **Fictional class ID recovery** — Phase 20 audit corrected the wrong class ID. Verify that the correct ID is in use in `vetting.service.ts` before running migration. Grep for `VETTING_ITEM_CLASS_ID` in field-mappings.

---

## Summary Table

| Aspect | Current State | Phase 32 Target |
|--------|---------------|-----------------|
| **Data storage** | GQL EngagementVettingItem (deprecated) | platform.Task (under vetting Board) |
| **Component mount** | Tab #5 on engagement detail | Board card in transparency-center (TBD) |
| **Status enum** | VettingStatus (7 values) | platform.Task.status (mapped) |
| **CRUD** | vetting.service via PipelineWrite | engagement-context / board service |
| **Records in production** | Zero (Phase 20 bug) | Zero → auto-created on first vetting use |
| **Demo data** | Seeded during provisioning | Seeded Task records under vetting Board |
| **Risk level** | LOW (no production data) | LOW → Phase 33 Polish includes the Vetting Board migration + specialized rendering; Phase 32 Foundation untouched |

---

**Next step for Phase 32 brief Q-5:** Confirm that migrating vetting items to `platform.Task` is the intended path, or propose an alternative using Options B/C above.
