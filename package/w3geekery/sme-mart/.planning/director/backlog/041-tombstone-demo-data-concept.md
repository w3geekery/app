# 041 — Tombstone the "demo data" concept entirely

**Status:** captured (not scheduled) · **Origin:** Clark, 2026-07-01, during the SDK 2.x migration

## Idea

Retire the whole **demo-data visibility** apparatus (`DemoVisibilityService`, the D-24 / DG-02/03 client-side post-filters, `DEMO_TAG_UUID_LIST`, seeder demo-tagging). It's a **Neon-era artifact**: when we developed UIs against Neon with hand-loaded fake fixtures, demo-visibility hid those fixtures from non-admin users so demos looked clean. Post-Neon — real `platform.Project` engagements, Pipeline writes + GraphQL reads, real onboarding data — the "fake fixtures we must hide" rationale is largely gone.

## Why it matters now (ties to FR-014 / the SDK 2.x migration)

The hardest slice of the SDK 2.x upgrade (Category A → **FR-014** / task-71) is **preserving demo-visibility for engagements**. Engagements are `platform.Project` rows (`type=engagement`); 2.x no longer returns a project's resource-tags inline, so demo-visibility now needs a `getTagsForResource` read per engagement. We shipped an interim batched workaround marked **`RECONCILE-FR-014`**.

**If demo-data is tombstoned, that entire concern evaporates:** no resource-tag read for demo-visibility, and the `RECONCILE-FR-014` interim gets **deleted** rather than reconciled. FR-014 itself may still be wanted for *marketplace* tags on projects, but its demo-visibility justification disappears.

## Scope (if pursued)

- Remove `DemoVisibilityService` and every `applyVisibility` / `isLocalDemoTagged` call site (engagements, reviews, documents, org-documents, note-hierarchy, admin, etc.).
- Remove `DEMO_TAG_UUID_LIST` / `demo-tags` constants and any seeder demo-tagging.
- Confirm nothing else relies on demo-hiding (admin dashboards, counts).
- Decide whether "demo/sandbox" needs any replacement (probably not — real data now).

## Cross-refs

- **FR-014** (inline project tags) — `.planning/docs/BACKEND_FEATURE_REQUESTS.md`, PROD task-71, code marker `RECONCILE-FR-014`
- **D-24 / DG-02/03** demo-visibility decisions (Phase 24)
- `src/app/core/services/demo-visibility.service.ts`, `src/app/core/constants/demo-tags.ts`
