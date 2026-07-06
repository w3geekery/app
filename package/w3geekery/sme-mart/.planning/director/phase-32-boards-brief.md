# Phase 32 — Boards (Engagement + Project + Cross-Org)

**Milestone:** v1.5 candidate (do NOT add to v1.4 — v1.4 is in close-out)
**Director:** Parks (composed 2026-05-19)
**Source backlog items:** [[BACKLOG-100]] (shared component substrate), [[BACKLOG-106]] (engagement UX + cross-org list page + Vetting migration + seed tasks)
**Visual reference:** `.planning/sketches/001-boards-pin-expand/` — Variant A (inline expand-in-place) is the LOCKED layout
**Director recommendation:** large phase — likely 6-8 plans; discuss-phase should propose either ONE phase with many plans OR a split into Phase 32 (Boards Foundation) + Phase 33 (Boards Polish & Migration)

---

## Phase Goal

Replace the engagement-detail **Tasks** tab with a **Boards** tab (card grid, pin-to-expand inline preview, drill to detail). Same shared component powers the Project > Boards tab. New top-level **`/boards`** list page provides cross-org board view with org-multi-select filter, scope-flavor indicators, and User/Private boards section. New **`/boards/:boardId`** detail page with cog config panel + `zb-remote-table` infinite-scroll tasks list + admin "Open in ZB Platform" link. Default-board seed tasks added to provisioner. Vetting tab eliminated — Vetting becomes a Board (specialized via `sme-mart.board.vetting` tag) that shows up in the Boards list alongside everything else.

---

## Locked Decisions (DO NOT re-debate in discuss-phase)

| # | Decision | Source |
|---|---|---|
| L-1 | **Engagement tab rename:** Tasks → Boards | BACKLOG-106, Clark 2026-05-18 |
| L-2 | **Board-detail route:** top-level `/boards/:boardId` (NOT engagement-scoped, NOT project-scoped) — one route, one component, derives breadcrumb from `board.projectId → project.parentId` chain on load | BACKLOG-106 + parkit-13 conversation 2026-05-18; mirrors zb/ui top-level entity-detail pattern (Task, Resource) |
| L-3 | **Cross-org list-page route:** top-level `/boards` — unlocks org-multi-select filter + scope-flavor indicator chip per card + User/Private boards | Clark 2026-05-18 — direct insight after L-2 |
| L-4 | **Pin/drill coexist as DISTINCT card affordances** — pin = paged ≤25-task in-place preview (overview); drill = navigate to `/boards/:boardId` (immersive context). NOT alternatives. | BACKLOG-106, Clark 2026-05-18 |
| L-5 | **Pinned-card layout = inline expand-in-place** via CSS Grid `repeat(auto-fill, minmax(320px, 1fr))` + `grid-column: span 2` on pinned cards (span full width below 760px viewport). Multiple pins coexist naturally. | Sketch 001 Variant A wins, locked 2026-05-19 |
| L-6 | **Pin state storage:** `localStorage` (immediate, per-device) AND PKV (per-user, multi-device sync). PKV may fall back to localStorage-only if [[BACKLOG-099]] PKV spike hasn't landed. | BACKLOG-106 |
| L-7 | **Board-detail tasks-list mirrors zb/ui's tasks-list view** — capture column shapes + row actions in `.planning/notes/zb-ui-tasks-list-reference.md` BEFORE plan-phase. | BACKLOG-106 |
| L-8 | **Tasks-list table = `zb-remote-table`** (search + filtering already wired in ngx-library — REUSE, do not rebuild). | BACKLOG-106 |
| L-9 | **Admin "Open in ZB Platform" link** in board-detail triple-dot menu, gated by `getPrincipal().isAdmin` per [[project_sme_mart_admin_detection]]. | BACKLOG-106 |
| L-10 | **Vetting tab → Vetting Board.** Vetting becomes a board (specialized rendering via a `sme-mart.board.vetting` tag, NOT a `boardType` enum value — tags are the marketplace-extension pattern per D-50). | BACKLOG-106 |
| L-11 | **Default-board seed tasks added at engagement provision time** in `platform-engagement-provisioner.service.ts` — helper tasks: "Welcome to your engagement", "How to get help", "Add a corporate profile item", "Invite a team member", "Review pricing tiers" (final list during discuss). | BACKLOG-106 |
| L-12 | **Shared components dependency-free of SME-Mart-specific services** so the Project > Boards tab + eventual ngx-library hoist reuse without rewrite. | BACKLOG-100 + BACKLOG-106 |
| L-13 | **Board switcher widget** (sibling boards list + active indicator + click-to-switch) on the detail page only, NOT on the card grid. Mirror zb/ui's `feat/board-context-selector-mvp` shape. | BACKLOG-100 |

---

## Open Questions (focus discuss-phase here)

| # | Question | Notes / Director lean |
|---|---|---|
| Q-1 | **Phase scoping** — one phase with 6-8 plans, or split into Phase 32 (Foundation: shared component + engagement tab + create-board + detail page) and Phase 33 (Polish: cross-org list + seed tasks + Vetting migration + PKV)? | Director lean: SPLIT. Foundation lands a usable Boards tab; Polish adds the cross-org view + migrations after Foundation dogfoods. |
| Q-2 | **`platform.Board.search(orgIds: UUID[])` filter capability** — Clark believes the endpoint accepts an `orgIds` array. Verify via ZB MCP (`zerobias_describe platform.Board.search` or `.list`) BEFORE plan-phase. If absent, file ask to Kevin/Nic. | Plan-phase blocker for cross-org list page. |
| Q-3 | **User/Private boards** — does `platform.Board` support null `projectId` + a `userId` field today? Verify via ZB MCP. If absent, scope decision: defer User/Private boards to Phase 33, or file gap to Kevin/Nic and ship without them initially. | Director lean: defer if not supported today — cross-org list page works without User/Private boards. |
| Q-4 | **Vetting-board specialized rendering** — when the Vetting Board card is pinned or drilled-into, does it render specialized UI (vetting circle, checklist) OR the generic tasks table? | Director lean: specialized when pinned + drilled. The current Vetting tab has its own visual conventions worth preserving. Need to inventory current Vetting tab implementation before deciding. |
| Q-5 | **Vetting data migration** — existing Vetting items (if any) need to land on the new Vetting Board. How is current Vetting data shaped? Inventory `vetting-tab.component.*` + the underlying schema/Task representation. | Plan-phase task: write `.planning/notes/vetting-current-shape.md` |
| Q-6 | **Seed-task content** — exact list + ordering of helper tasks added to the default board. Should they link to specific routes (`/org/profile`, `/members`, etc.) or be plain Markdown? | Brian-ask candidate. Ship draft Director list (in L-11) as placeholders; refine via Brian Tue/Fri meeting. |
| Q-7 | **`+ Create Board` dialog scope** — name + description + initial boardType? Or also seed-tasks template selector? | Director lean: minimal scope (name + description + boardType from a dropdown). Templates = future polish. |
| Q-8 | **Board switcher route behavior** — when user clicks a sibling board in the switcher on `/boards/:boardId`, does the URL change (full nav) or swap in-place (preserving query state like config-panel-open)? | Director lean: full URL change. Simpler, browser-history works, URL is shareable. |
| Q-9 | **Cog config panel transitions** — slide-in drawer from the right? Modal? Inline-expand below header? | Director lean: slide-in drawer (mat-sidenav end-position) — established pattern in this codebase (vendor-profile-form uses the same). |
| Q-10 | **PKV plumbing** — is [[BACKLOG-099]] PKV spike landed by the time Phase 32 starts? If yes, build with PKV; if no, ship with localStorage-only and stub the PKV layer for upgrade. | Plan-phase status check. |
| Q-11 | **`/boards` list page entry point** — top-nav link? In an existing dropdown? Right rail? | Director lean: top-nav link, demoted to a secondary nav level. Most users will enter via engagement/project context, not the cross-org list. |
| Q-12 | **Tab-rename URL** — `/engagements/:id/tasks` → `/engagements/:id/boards`? Or alias both? | Director lean: rename + redirect old path to new (single-segment URL change is cheap, but old bookmarks shouldn't 404). |

---

## Pre-Discuss-Phase Captures (DO before discuss runs)

1. **`zerobias_describe platform.Board.list`** (and `Board.search` if separate) — verify `orgIds`, `projectId`, `userId`, `boardType` filter capabilities. Capture in `.planning/notes/board-api-shape.md`.
2. **`.planning/notes/zb-ui-tasks-list-reference.md`** — read zb/ui's tasks-list component (`~/Projects/zb/com/ui/...`) and capture column shapes + row actions + filter UX to mirror on board-detail.
3. **`.planning/notes/board-switcher-reference.md`** — pull latest from `zb/ui:feat/board-context-selector-mvp` and capture switcher's input/output + UX behaviors.
4. **`.planning/notes/vetting-current-shape.md`** — inventory current `vetting-tab.component.*` + underlying data shape (Task records? separate schema?). Required for Q-4 + Q-5.

These are research artifacts the discuss-phase consumes. Direct gsd-discuss-phase to ASK whether they exist + spawn the captures if missing.

---

## Out of Scope (HARD walls — strike at plan-checker if proposed)

- Task creation / edit UI (separate phase — board-detail page READS tasks via `zb-remote-table`; CRUD is later)
- Task-detail page (out of scope; board-detail row-click goes to existing task-detail surface if one exists, or a stub)
- Board CRUD beyond name/description (no archive, no clone, no permissions UI in Phase 32)
- Board-type CRUD (the `sme-mart.board.vetting` tag is a marketplace-singleton — bootstrap-once, not per-customer)
- ngx-library hoist (separate downstream effort once SME Mart implementation stabilizes)
- Mobile / responsive polish beyond the `< 760px` full-width-span fallback (Phase 32 is desktop-first)

---

## Non-Negotiable Patterns Block — PASTE INTO EVERY DOWNSTREAM PLAN AND EXECUTE HANDOFF

Every gsd-plan / gsd-execute handoff for Phase 32 MUST include this verbatim:

```
ANGULAR 21 MODERNIZATION RULES — NON-NEGOTIABLE

Every new and touched file in this phase MUST follow these rules. Pre-commit hook is diff-based, --max-warnings=0, blocks commit on violation. Touch-it=fix-it on every modified file.

1. STANDALONE COMPONENTS ONLY. No NgModules.
2. SIGNAL-BASED I/O: input() / output() — NEVER @Input() / @Output().
3. DEPENDENCY INJECTION via inject() — NEVER constructor parameter injection.
4. SIGNALS for state: signal() / computed() / effect() — not BehaviorSubject for component-local state.
5. VIEW QUERIES: viewChild() / viewChildren() — NEVER @ViewChild() / @ViewChildren().
6. CHANGE DETECTION: ChangeDetectionStrategy.OnPush on every component.
7. TEMPLATE CONTROL FLOW: @if / @for / @switch — NEVER *ngIf / *ngFor / *ngSwitch.
8. TYPE SAFETY: no `: any`. Narrow types. No empty catch {} blocks (comment + log or rethrow).
9. NGX-LIBRARY REUSE: prefer zb-remote-table, zb-simple-panel, zb-button-label, zb-dialog, zb-resource-status, zb-chip-colors-directive, snake-to-spaces pipe, etc. BEFORE building custom.
10. THEME TOKENS: --zb-background, --zb-background-card, --zb-text, --mat-sys-* — NEVER hardcoded colors. See BACKLOG-103 for what hardcoded colors cost.
11. FILE NAMING: keep type suffixes (`foo.component.ts`, `foo.service.ts`) — project convention overrides Angular 21's drop-the-suffix default.
12. SHARED-COMPONENT DEPENDENCY RULE: any component that ends up in `src/app/shared/components/` MUST be free of SME-Mart-specific services (engagements.service, sme-mart-project.service, etc.) so it can be reused on Project > Boards + hoisted to ngx-library later.

INVOKE the `sme-mart-architect` skill (and/or `/angular-architect`) at plan-phase for any decomposition question on shared components, signal-input shape, ngx-library reuse, or change-detection patterns. Don't guess.

Reference: .planning/docs/MODERNIZATION_GUIDE.md (canonical rules + troubleshooting). Eslint config at eslint.config.js encodes the rules; pre-commit hook at ../../../.husky/pre-commit + .lintstagedrc.json enforces them.
```

---

## References

- **BACKLOG entries:** [[BACKLOG-100]], [[BACKLOG-106]] (fully fleshed out with scope blocks, files-likely-touched, effort estimates)
- **Sketch:** `.planning/sketches/001-boards-pin-expand/` — Variant A winner marked
- **Modernization:** `.planning/docs/MODERNIZATION_GUIDE.md`
- **CLAUDE.md project rules:** `/Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/CLAUDE.md`
- **Hierarchy model:** [[project_sme_mart_hierarchy_model]] (engagement = `platform.Project` depth 1; project tier = `platform.Project` depth 2)
- **Tier-tag conventions:** D-50 (marketplace-singleton, ops-owned, `sme-mart.tier.*`)
- **Engagement verbiage:** D-51 (provider/client role labels; arrows banned)
- **Admin detection:** [[project_sme_mart_admin_detection]] — `getPrincipal().isAdmin`
- **SDK verification protocol:** `.planning/docs/SDK_VERIFICATION_SOURCES.md` — ZB MCP > ZB platform source > SDK source (NOT the deprecated Next.js app)
- **Existing related code:** `project-boards-tab.component.ts` (commit `28fe83b`) shows the `platform.Board.list(.., projectId)` data-fetch pattern that works today
- **Related effort:** [[BACKLOG-099]] (PKV spike — pre-req for board preferences; status check at plan-phase)

---

## Director Notes for gsd-discuss-phase

- This is a LARGE phase (combined effort estimate 32-48 hrs across BACKLOG-100 + 106). Discuss-phase should focus on **Q-1 (one phase or split into two)** as the first question because it shapes everything downstream.
- The sketch is locked — DO NOT re-debate layout patterns. If discuss-phase brings up alternative layouts, point at `.planning/sketches/001-boards-pin-expand/` and the L-5 lock.
- The route is locked — DO NOT re-debate `/boards/:boardId` vs scoped routes. L-2 + L-3 capture the 5-point rationale.
- The shared-component direction is locked — do NOT propose component duplication between engagement scope and project scope. L-12.
- The Vetting migration has data-migration risk that discuss-phase should explicitly ask Clark about (Q-4 + Q-5 + `.planning/notes/vetting-current-shape.md` capture).
