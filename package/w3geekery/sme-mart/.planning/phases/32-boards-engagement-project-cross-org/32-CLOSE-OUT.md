# Phase 32 — Boards FOUNDATION — Close-Out

**Closed:** 2026-05-22 (Director-verified)
**HEAD at close:** `74d32fc3`
**Result:** Foundation complete. Polish deferred to Phase 33.

## What shipped (7-commit ledger)

| Commit | Plan | Summary |
|---|---|---|
| `c11b5a40` | 32-01 | Shared dependency-free `boards-grid` / `board-card` / `board-card-pinned-preview` (L-12, signal I/O, OnPush, theme tokens, a11y; atomic RDF-serializable `BoardCardData` per C-2) |
| `4fa07b39` | 32-02 | Engagement Boards tab replaces Tasks tab; route remap, no redirect (L-1, D-Q12) |
| `2d822c7f` | 32-02 | (fix) boundaryId fetch — superseded by retraction below |
| `20a0637a` | 32-02 | (revert) restored `projectId = engId` — engagement IS a platform.Project; net result correct |
| `279f6d95` | 32-04 | Create Board dialog (name/description/boardType `kanban|list|timeline|calendar` + `status:'active'`) + engagement tab trigger |
| `7e013826` | 32-05 | PinStorage interface + `LocalStoragePinStorage` (sync getPin/setPin, async load) + pin persistence/ordering; PKV swap is DI-only (D-Q10) |
| `74d32fc3` | 32-03 | `/boards/:boardId` page + breadcrumb + board-switcher + `zb-remote-table` tasks list + config-panel surface + admin "Open in ZB Platform"; guarded-child route |

**Gates at close:** `tsc -p tsconfig.app.json` 0, `tsc -p tsconfig.spec.json` 0, **47 Vitest specs pass**. Pre-commit hook (lint-staged + tsc) green on every commit.

## Scope walls held
No task CRUD, no task-detail page, no board CRUD beyond name/description/boardType, no cross-org list, no org filter, no User/Private boards, no seed tasks, no Vetting migration, no PKV, no ngx-library hoist, no mobile polish. Existing Vetting tab untouched.

## Key decisions / deviations (Director-ratified)
- Test harness is **Vitest** (`@angular/build:unit-test`), not Jasmine/Karma — all specs follow it.
- Admin gate uses **`ProjectContextService.isAdmin`** (authoritative org-member admin flag). `getPrincipal().isAdmin` does NOT exist in this SDK version (L-9 *intent* preserved, mechanism corrected).
- `boardType` enum is **`kanban|list|timeline|calendar`**; `create` requires `status` (verified vs `board-api-shape.md` / ZB MCP, not the deprecated Next.js app).
- PinStorage placed in `core/services/` (repo convention), not the plan's literal `src/app/services/`.
- `/boards` registered as a **lazy child of the onboarding-guarded shell** so `ProjectContextService.isAdmin` hydrates on deep-link.
- Tasks-list cells use `$any(task)` + plain chips — no `severity-indicator`/avatar component (not exported by `@zerobias-org/ngx-library`).
- Orphaned `engagements/tabs/tasks-tab.component.ts` left in place (reversible; sweep later).

## E2E — DEFERRED (Director ruling, option b)
`e2e/specs/boards-pin-persistence.spec.ts` is **authored and preserved on disk, intentionally NOT committed**. The eslint flat config type-lints `**/*.spec.ts` against `tsconfig.spec.json`, which excludes `e2e/**` — so all 8 existing e2e specs fail the same parse-lint (only grandfathered by the diff-based hook). Not committing avoids an unauthorized governance-config change and a `--no-verify` bypass. The `data-testid`/`pinned`/`unpinned` hooks the spec relies on ARE committed (board-card / boards-grid).

## Pre-UAT follow-ups (do not lose)
1. **`zb-remote-table` runtime render is UNVERIFIED** — board-detail's tasks list was validated by tsc/strictTemplates and instance-level specs only; no dev server was available to mount it. `ZbRemoteTableService` appears component-scoped by the library. **Needs a live smoke (board-detail page renders the table + 5 columns) before UAT promotion.**
2. **E2E lint-integration backlog item** — add a proper eslint `e2e/**` override + an `e2e` tsconfig so e2e specs lint cleanly, then commit `boards-pin-persistence.spec.ts`. (Pre-existing gap affecting all 8 e2e specs; to be handled as its own task, not folded into Phase 32.)

## Phase 33 (Polish) — gated, see 32-CONTEXT.md "Re-Planning Triggers"
Cross-org `/boards` list (needs Kevin's `orgIds[]` filter — Ask #9), org multi-select filter, User/Private boards, Vetting tab elimination + migration (latest BACKLOG-108 shape), default-board seed-task templates (C-7 provenance, BACKLOG-111), PKV-backed pin sync (Ask #12), config-panel internal content (D-Q9).
