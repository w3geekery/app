# Errata 043 — "zero orphans" verification checked the deleted TYPES, not all EXPORTS of the deleted FILE

**Date:** 2026-06-29
**Phase:** 33, Wave-1 exit (surfaced executing 33-01 Task 2's `marketplace-profile-item.model.ts` deletion)
**Severity:** Medium (caught at Wave-1 gate by the compiler, before commit — no bad commit shipped). Recurring defect class.
**Filed by:** Director Parks

## What happened
33-01 Task 2 deleted `core/models/marketplace-profile-item.model.ts`. The re-plan's consumer inventory — and my independent "zero orphans" verification that green-lit the re-plan — both grepped for consumers of the deleted **types** (`ProviderProfile` / `ProviderDirectoryRow` / `ProviderDetailRow`) and the dropped fields. **Neither checked the other exports of the deleted FILE** (`MarketplaceProfileItem`, `CreateMarketplaceProfileItemRequest`, `SectionType`). Those have 7 live importers in the **vendor-profile + vetting** subsystems (out of Phase 33 scope), so the deletion broke them — surfaced as part of the 29 app + 59 spec tsc errors at the Wave-1 gate.

The 7 real breakers (confirmed by import-path grep, `from '…marketplace-profile-item.model'`): `core/models/index.ts` (barrel), `core/services/vendor-profile.service.ts`, `core/utilities/section-mapping.utility.ts`, `pages/engagements/tabs/vetting-tab.component.ts`, `pages/engagements/tabs/vetting-suggestion-panel.component.ts`, `pages/org/tabs/vendor-profile-form.component.ts`, `pages/org/tabs/vendor-profile-tab.component.ts`. (A broader textual grep also hit `field-mappings.ts`, `marketplace-profile.service.ts`, `company-info.model.ts` — but those are coincidences: a class-name registry key, and a separate `MarketplaceProfileItemRecord` type defined in `company-info.model.ts`. Not breakers.)

## Root cause — methodology gap (same defect class as the orphan-consumer + phantom-path findings)
When a design **deletes a whole FILE**, the consumer inventory must enumerate consumers of **every export of that file** AND every importer of the file path — not just the headline type the phase is about. The inventory (and my verification) scoped to the phase's named types, so a co-located but thematically-unrelated export (`MarketplaceProfileItem`, serving a different subsystem) slipped through. This is the third instance of incomplete-inventory in Phase 33 (orphan consumers, phantom paths, now deleted-file exports).

## Corrective action
- **Restore the file (Option B, authorized).** `marketplace-profile-item.model.ts` was deleted prematurely: Phase 33's profile consumers already migrated off it, so the file now serves ONLY vendor-profile/vetting. Restoring it un-breaks all 7 with zero scope creep; a future phase migrates vendor-profile/vetting off MPI when those subsystems are actually in scope.
- **Amend the 33-01 success criterion** from "MPI model file deleted" to "MPI model removed from the PROFILE read/write path; file retained for out-of-scope vendor-profile/vetting consumers, migration deferred."

## Methodology fix (carry forward)
Before approving any **file deletion**: `grep` for (a) every importer of the file path, and (b) every consumer of each symbol the file exports — not just the phase's headline type. A "zero orphans" check is only valid against the file's FULL export surface. Verification greps must target the deletion unit (the file), not just the concept (the type).

Relates to [[errata-042]] (same phase), the orphan-consumer + phantom-path re-plan findings, and the standing assume-vs-verify discipline.
