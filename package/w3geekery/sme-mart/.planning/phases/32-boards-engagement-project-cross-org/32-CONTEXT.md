# Phase 32: Boards (Engagement + Project + Cross-Org) — Foundation — Context

**Gathered:** 2026-05-20
**Status:** Ready for planning (pending Director draft scan)
**Director:** Parks
**Source brief:** `.planning/director/phase-32-boards-brief.md`
**Source backlog:** [[BACKLOG-100]] (shared component substrate), [[BACKLOG-106]] (engagement UX + cross-org list + Vetting migration + seed tasks)

---

## ⚠ NON-NEGOTIABLE PATTERNS BLOCK — PASTE VERBATIM INTO EVERY PLAN AND EXECUTE HANDOFF

Every gsd-plan / gsd-execute handoff for Phase 32 (and Phase 33) MUST include this block verbatim.

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

### RDF Compass checks (fold alongside the modernization rules at every plan-phase)

Source: `.planning/docs/RDF-COMPASS.md` §4. Any design touching Engagement / Project / Task / Vetting / Record / Board shapes must satisfy:

- **C-1** — Preserve the entangled demand-half + supply-half task pair structure. Every Requirement decomposes into exactly 2 linked tasks (or N matched pairs); none orphaned.
- **C-2** — Every field round-trips cleanly to RDF triples without information loss. Typed, atomic, predicate-nameable. No mixed-axis strings, no positional ordering.
- **C-3** — Records are append-only + hash-chainable. No in-place mutation paths; PROV-O attribution preservable; tamper-evidence intact.
- **C-4** — Party-boundary scoping present so the Holon projection is computable. Every entity under an Engagement carries a Party UUID (or is unambiguously inferable from the parent).
- **C-5** — Engagement-pinned SHACL profile / Requirement-set version is explicit. The Requirement registry has a version anchor at engagement creation; UI does not silently swap versions under live data.
- **C-7** — Engagement-template instantiation preserves provenance: every entity created from a template (Engagement, sub-Projects, Vetting Boards, seed Tasks) records `template_id` + `template_version` + `ontology_source(s)` so the audit trail can answer "why does this exist?" by walking back to the template and its source ontology; RDF-serializable as a PROV-O attribution chain.

**Phase 32 Foundation compass exposure:** ONLY **C-2** (Board + pin-state data shapes must be RDF-serializable) and **C-4** (party-boundary scoping on Tasks read in board-detail). Foundation provisions no tasks — the Create Board dialog creates only the Board (no seed tasks). **C-1, C-3, C-5, and C-7 are primarily Phase 33 concerns** — template instantiation and seed-task provenance (C-7) happen at provision time in Phase 33; entangled demand/supply pairs (C-1), append-only Records (C-3), and engagement-pinned profile versioning (C-5) attach to the Vetting migration.

---

<domain>
## Phase Boundary

**Phase 32 = Boards FOUNDATION** (Q-1 LOCKED: split into Phase 32 Foundation + Phase 33 Polish).

Foundation delivers the **generic, dependency-free Boards substrate** plus the engagement-scoped surface and the board-detail page:

1. **Shared `boards-grid` component** — card grid with pin-to-expand inline preview (Sketch 001 Variant A) + drill-to-detail affordance. Dependency-free of SME-Mart-specific services (L-12) so Project > Boards tab and a future ngx-library hoist reuse it without rewrite.
2. **Engagement tab rename** — Tasks tab → Boards tab; wire the shared `boards-grid`.
3. **`/boards/:boardId` detail page** — top-level route (L-2); header + breadcrumb derived from `board.projectId → project.parentId` chain; cog config panel (mat-sidenav end-drawer); `zb-remote-table` infinite-scroll tasks list (read-only); board switcher widget (L-13, in Foundation per Director); admin "Open in ZB Platform" link gated by `getPrincipal().isAdmin` (L-9).
4. **`+ Create Board` dialog** — minimal: name + description + boardType dropdown.
5. **Pin-state persistence** — localStorage behind a thin `PinStorage` interface (PKV deferred — UAT IAM gap, see Platform-Team Ask #12).

**What Foundation does NOT include (deferred to Phase 33 Polish — see Re-Planning Triggers):**
cross-org `/boards` list page, org-multi-select filter, scope-flavor indicator chips, User/Private boards section, default-board seed-task *templates*, Vetting tab elimination + data migration, PKV plumbing.

**Hard out-of-scope walls (strike at plan-checker if proposed):**
- Task creation/edit UI (board-detail READS via `zb-remote-table`; CRUD is a later phase)
- Task-detail page (row-click goes to existing task-detail surface or a stub)
- Board CRUD beyond name/description (no archive, clone, permissions UI)
- Board-type CRUD (`sme-mart.board.vetting` tag is a marketplace-singleton — bootstrap-once)
- ngx-library hoist (separate downstream effort)
- Mobile/responsive polish beyond the `< 760px` full-width-span fallback (desktop-first)

</domain>

<decisions>
## Implementation Decisions

### Locked by Director (L-1..L-13 — DO NOT re-debate; see brief for full rationale)
- **L-1** Engagement tab Tasks → Boards.
- **L-2** Board-detail route is top-level `/boards/:boardId`; breadcrumb derived from `board.projectId → project.parentId` chain on load.
- **L-3** Cross-org list route is top-level `/boards` (Phase 33).
- **L-4** Pin and drill coexist as distinct affordances — pin = paged ≤25-task in-place preview; drill = navigate to detail. Not alternatives.
- **L-5** Pinned-card layout = inline expand-in-place; CSS Grid `repeat(auto-fill, minmax(320px, 1fr))` + `grid-column: span 2` on pinned cards (full-width below 760px). Sketch 001 Variant A.
- **L-6** Pin state: localStorage now; PKV per-user multi-device sync when available (see L-6 amendment in Q-10 below — PKV unusable on UAT today).
- **L-7** Board-detail tasks-list mirrors zb/ui tasks-list shape (`.planning/notes/zb-ui-tasks-list-reference.md`).
- **L-8** Tasks-list table = `zb-remote-table` (REUSE search + filtering; don't rebuild).
- **L-9** Admin "Open in ZB Platform" link in board-detail triple-dot menu, gated by `getPrincipal().isAdmin`.
- **L-10** Vetting becomes a Board specialized via `sme-mart.board.vetting` tag (NOT a boardType enum value; tags are the marketplace-extension pattern per D-50). [Phase 33; superseded shape — see Re-Planning Triggers.]
- **L-11** Default-board seed tasks added at engagement provision time. [Phase 33.]
- **L-12** Shared components dependency-free of SME-Mart-specific services.
- **L-13** Board switcher widget on the detail page only (sibling boards + active indicator + click-to-switch). In Foundation per Director.

### Phase scoping (Q-1)
- **D-Q1:** SPLIT — Phase 32 Foundation + Phase 33 Polish. Reinforced by the Q-2 finding (cross-org list is hard-blocked on the platform `orgIds[]` filter; bundling it would stall the whole phase on an external dependency). Foundation has zero platform-team dependencies.

### Board-detail tasks list (Q-7, Q-8, L-7, L-8)
- **D-Q8:** Board switcher click = **full URL nav** (`router.navigate([boardId])`). Confirmed by zb/ui `feat/board-context-selector-mvp` `boardChanged(id)` callback shape — selector emits, parent owns routing. URL is shareable; browser history works.
- **D-Q7:** `+ Create Board` dialog is **MINIMAL** — name + description + boardType dropdown only. No template selector, no permissions UI, no initial-task seeding. (Template-driven creation + seeding is Phase 33 / BACKLOG-111 scope.)

### Cog config panel (Q-9)
- **D-Q9:** **mat-sidenav end-position drawer** (slide-in from right). Matches the `vendor-profile-form` pattern already in the codebase — consistency + reuse over a new modal/inline pattern.

### Pin-state storage (Q-10) — amends L-6
- **D-Q10:** **localStorage behind a thin `PinStorage` interface — NOT PKV.** PKV (`dana.Pkv`) verified live-broken on UAT 2026-05-20: both read (`dynamodb:Query`) and write (`dynamodb:BatchWriteItem`) denied because the UAT gateway role `us-east-1-demo-gateway-role` lacks the DynamoDB IAM policy on the `uat-pkvs` table (CI works; UAT does not). SME Mart targets UAT, so PKV is unusable today. Build pin-state behind a `PinStorage` interface, back with localStorage now, swap to PKV when UAT IAM is fixed — **zero call-site changes**. See Platform-Team Ask #12.

### Tab URL rename (Q-12)
- **D-Q12:** Rename `/engagements/:id/tasks` → `/engagements/:id/boards`, **NO redirect**. Old path doesn't matter — drop it entirely.

### Vetting rendering + migration (Q-4, Q-5) — Phase 33, locked now
- **D-Q4:** Vetting Board specialized rendering = **drop-in template variant inside the shared board-detail component**, driven by a `boardKind` signal sourced from the `sme-mart.board.vetting` tag (NOT a boardType-enum check, per D-50). Data-shape divergence is rendering-divergence inside the shared substrate, not an architectural split — no sibling component.
- **D-Q5:** Vetting migration = **Option A** (bulk re-create legacy `EngagementVettingItem` records as `platform.Task` under tagged Board(s), with status mapping). Option C (wipe+reseed) kept as a silent execute-time fallback ONLY if an A-path idempotency edge fails — NOT a planning option. Migration risk is LOW (Phase 20 audit confirmed the fictional-class-ID bug meant zero production vetting records ever landed). **NOTE:** the Vetting target shape was superseded by the 2026-05-19 Brian meeting — see Re-Planning Triggers; do not lock the Vetting structure from this CONTEXT.md.

### Seed-task content (Q-6) — Phase 33
- **D-Q6:** Ship the L-11 list verbatim as the final draft: "Welcome to your engagement", "How to get help", "Add a corporate profile item", "Invite a team member", "Review pricing tiers". Four task-shape concerns are **Foundation-pattern decisions deferred to plan-phase** (NOT Director-decides): (a) descriptions in addition to titles, (b) clickable route links vs plain Markdown text, (c) starting status (Todo presumed), (d) assignment (engagement owner vs unassigned).

### Claude's Discretion
- Component decomposition of the shared `boards-grid` substrate (card sub-component, pin-preview sub-component, etc.) — resolve at plan-phase via the `sme-mart-architect` skill.
- Signal-input shape for the shared components (per modernization rule 2 + 12).
- `zb-remote-table` column config for the board-detail tasks list — mirror `.planning/notes/zb-ui-tasks-list-reference.md`; adapt SME-Mart labels.

</decisions>

## Phase 33 Re-Planning Triggers

Phase 33 (Polish) plan-phase MUST NOT start until these gates resolve. Phase 32 Foundation is UNAFFECTED by all of them (generic Boards primitives only).

| Gate | What it unblocks |
|---|---|
| **Kevin platform-team ask #9** — `platform.Board.list(orgIds: UUID[])` array filter | Cross-org `/boards` list page (otherwise N+1 fan-out) |
| **[[BACKLOG-108]] amendment** — Vetting shape | Vetting tab elimination + migration. **Shape was in active Director refinement at CONTEXT.md write — Phase 33 plan-phase reads the LATEST locked version in BACKLOG.md at re-planning trigger. DO NOT rely on any shape snapshot here.** |
| **[[BACKLOG-111]]** — engagement template library | Template-driven board layout + seed-task templates + C-7 provenance |
| **[[BACKLOG-112]]** — industry ontology research spike | Vetting section structure (W3C commerce/credentials/banking ontologies) |

Brian-meeting context (2026-05-19, `.planning/notes/meetings/2026-05-19-marketplace.md`): Vetting was reframed from "ONE Board" to "Project + sub-projects + N Boards per Vetting section" (banking, corporate identity, D&B, financial, MSA, office background checks). This is Phase 33 scope only.

## Platform-Team Asks

Inline summaries below. **For current resolution status, see `.planning/director/DIRECTOR-PARKS-RESUME.md`.**

- **#9** — `platform.Board.list` needs an `orgIds: UUID[]` array filter (accepts single `orgId` only today). Hard blocker for the Phase 33 cross-org `/boards` list page. Owner: Kevin (cc Nic).
- **#10** — `platform.Board` boardType enum clarification: are `timeline` and `calendar` live values or reserved? Affects the Create Board dialog dropdown. Owner: Kevin.
- **#11** — `platform.Board.listTasks` (GET `/app/boards/{boardId}/tasks`) soft-delete visibility behavior — does it return soft-deleted tasks? Affects board-detail tasks-list accuracy. Owner: Kevin.
- **#12** — UAT gateway role `us-east-1-demo-gateway-role` lacks the DynamoDB IAM policy on the `uat-pkvs` table; PKV read (`dynamodb:Query`) + write (`dynamodb:BatchWriteItem`) denied on UAT (CI works). Needs the policy added (Query + BatchWriteItem + likely GetItem/PutItem/DeleteItem). Blocks PKV-backed pin-state sync (Foundation ships localStorage-only behind `PinStorage` interface as the workaround). Owner: Andrey (cc Kevin).

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase brief + visual
- `.planning/director/phase-32-boards-brief.md` — full L-1..L-13 rationale, Q-1..Q-12, out-of-scope walls, references
- `.planning/sketches/001-boards-pin-expand/index.html` — Variant A LOCKED layout (pin-to-expand-in-place)
- `.planning/sketches/001-boards-pin-expand/README.md` — sketch notes

### Pre-discuss research captures (written 2026-05-19)
- `.planning/notes/board-api-shape.md` — `platform.Board` API: Q-2 (orgIds[] NOT supported), Q-3 (userId supported), L-10 (tag-on-Board viable), platform-team asks
- `.planning/notes/zb-ui-tasks-list-reference.md` — zb/ui tasks-list column shapes + row actions + filter UX to mirror (L-7). Key: no triple-dot row menu; actions in right-side drawer; modal filter dialog; 500ms delete debounce
- `.planning/notes/board-switcher-reference.md` — zb/ui `feat/board-context-selector-mvp @ 77444a82d`: `boardChanged(id)` callback (Q-8 full nav), 2 framework-only deps (L-12 clean)
- `.planning/notes/vetting-current-shape.md` — current Vetting tab inventory (Phase 33 input): GQL `EngagementVettingItem`, 7-state FSM, dual-section layout, LOW migration risk (zero prod records), Option A migration plan

### Architecture + conventions
- `.planning/docs/RDF-COMPASS.md` — C-1..C-7 plan-phase checklist (§4); ZB↔W3C vocabulary mapping; non-negotiable RDF-serializability constraints
- `.planning/docs/MODERNIZATION_GUIDE.md` — Angular 21 modernization rules (canonical) + troubleshooting
- `.planning/docs/SDK_VERIFICATION_SOURCES.md` — SDK shape verification protocol (ZB MCP > ZB source > SDK source; NOT the deprecated Next.js app)
- `.claude/handoffs/transparency-center-entangled-tasks-2026-04-21.html` — Hierarchy Editor (canonical hierarchy model)
- `eslint.config.js` — encodes modernization rules; `../../../.husky/pre-commit` + `.lintstagedrc.json` enforce diff-based

### Existing related code
- `src/app/pages/.../project-boards-tab.component.ts` (commit `28fe83b`) — working `platform.Board.list(.., projectId)` data-fetch pattern
- `src/app/pages/engagements/tabs/vetting-tab.component.ts` — current Vetting tab (Phase 33 migration target)
- `src/app/pages/org/tabs/vendor-profile-form.component.*` — mat-sidenav end-drawer pattern (Q-9 reuse reference)

### Decisions + memory
- D-50 (marketplace-singleton tags; `sme-mart.board.vetting` is a tag, not an enum) — see DECISIONS.md
- [[project_sme_mart_hierarchy_model]] — Engagement = platform.Project depth 1; project tier = depth 2
- [[project_sme_mart_admin_detection]] — `getPrincipal().isAdmin` (L-9 gating)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`zb-remote-table`** (ngx-library) — board-detail tasks list; search + filtering already wired (L-8). Mirror column config from `zb-ui-tasks-list-reference.md`.
- **`vendor-profile-form` mat-sidenav drawer** — Q-9 cog config panel reuses this end-drawer pattern.
- **`project-boards-tab.component.ts`** (commit `28fe83b`) — proven `platform.Board.list(.., projectId)` fetch pattern; the shared `boards-grid` generalizes this.
- **zb/ui board-context-selector** (`feat/board-context-selector-mvp @ 77444a82d`) — switcher; ~1-2 hr drop-in with `boardChanged(id)` callback. If the branch hasn't merged by Phase 32 start, vendor a pinned copy.
- **`getPrincipal().isAdmin`** — admin gating for the "Open in ZB Platform" link (L-9).

### Established Patterns
- Standalone + OnPush + signal-based + `inject()` throughout (modernization rules, machine-enforced).
- `sme-mart.board.vetting` tag for marketplace specialization (D-50) — drives `boardKind` signal (Q-4), no enum.
- Top-level entity-detail routes mirror zb/ui (Task, Resource) — L-2 `/boards/:boardId`.

### Integration Points
- Engagement detail tab bar — Tasks tab replaced by Boards tab; route `/engagements/:id/tasks` → `/boards` (no redirect).
- `platform.Board.list(projectId)` — engagement/project board fetch (works today).
- `platform.Board.listTasks` (GET `/app/boards/{boardId}/tasks`) — board-detail tasks list (verify soft-delete visibility, Ask #11).
- Engagement provisioner (`platform-engagement-provisioner.service.ts`) — seed-task injection (Phase 33).

</code_context>

<specifics>
## Specific Ideas

- Pin-to-expand-in-place layout is LOCKED to Sketch 001 Variant A — multiple pins coexist via CSS Grid `span 2`; full-width span below 760px. Do not re-explore alternative layouts.
- Board-detail tasks list deliberately mirrors zb/ui (L-7) — actions live in a side drawer, NOT a triple-dot row menu; filter is a modal dialog, not search-as-you-type.
- Board switcher ships in Foundation (not Polish) so the detail page doesn't feel half-shipped on day one.

</specifics>

<deferred>
## Deferred Ideas

All Phase 33 Polish (gated — see Re-Planning Triggers):
- Cross-org `/boards` list page + org-multi-select filter + scope-flavor indicator chips (Q-11 entry-point placement deferred to Phase 33 plan-phase; Director lean was top-nav secondary).
- User/Private boards section (`userId` filter supported; ships with cross-org list).
- Default-board seed tasks in provisioner (Q-6 list locked; task-shape concerns to Foundation-pattern plan-phase).
- Vetting tab elimination + Option A migration + drop-in `boardKind` specialized rendering (Q-4/Q-5 locked; shape per latest BACKLOG-108).
- PKV-backed pin-state sync (swap behind `PinStorage` when UAT IAM fixed — Ask #12).
- Engagement template library + industry ontology adoption (BACKLOG-111 / BACKLOG-112; C-7 provenance).

Out of this milestone entirely:
- Task CRUD UI, task-detail page, board archive/clone/permissions, board-type CRUD, ngx-library hoist, mobile polish.

</deferred>

---

*Phase: 32-boards-engagement-project-cross-org (Foundation)*
*Context gathered: 2026-05-20*
