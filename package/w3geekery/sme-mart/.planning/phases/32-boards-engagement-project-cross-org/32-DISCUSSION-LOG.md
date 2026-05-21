# Phase 32: Boards (Engagement + Project + Cross-Org) — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 32-boards-engagement-project-cross-org (Foundation)
**Director:** Parks
**Areas discussed:** Phase scoping, Create Board dialog, cog config panel, pin-state storage, list-page entry point, tab URL rename, Vetting rendering, Vetting migration, seed-task content

**Process note:** L-1..L-13 entered LOCKED (not re-debated). Discussion focused on Q-1..Q-12. Q-2/Q-3/Q-8 resolved by pre-discuss research (`.planning/notes/board-api-shape.md`, `board-switcher-reference.md`). Director Parks supplied leans; Clark made final calls. AskUserQuestion unavailable this session — plain-text Q&A used (text-mode fallback).

---

## Q-1 — Phase scoping

| Option | Description | Selected |
|--------|-------------|----------|
| A. SPLIT (Foundation + Polish) | Phase 32 = shared grid + engagement tab + detail page + create dialog + pin state; Phase 33 = cross-org list + seed tasks + Vetting migration + PKV | ✓ |
| B. One phase, 6-8 plans | Bundle everything in Phase 32 | |
| C. Split differently | e.g., grid+tab only in 32; detail page + rest in 33 | |

**User's choice:** A (SPLIT). **Notes:** Reinforced by Q-2 finding — cross-org list is hard-blocked on the platform `orgIds[]` filter; bundling would stall the whole phase on an external dependency. Foundation has zero platform-team dependencies. Switcher placed in Foundation (Director directive).

## Q-7 — `+ Create Board` dialog scope

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal | name + description + boardType dropdown only | ✓ |
| Minimal + template selector | also pick a seed-task template | |

**User's choice:** Minimal. **Notes:** No template selector, no permissions UI, no initial-task seeding. Template-driven creation + seeding is Phase 33 / BACKLOG-111 scope.

## Q-9 — Cog config panel transitions

| Option | Description | Selected |
|--------|-------------|----------|
| mat-sidenav end-drawer | slide-in from right; matches vendor-profile-form | ✓ |
| Modal dialog | more isolation | |
| Inline-expand below header | more context-preserving; pushes content down | |

**User's choice:** mat-sidenav end-position drawer. **Notes:** Consistency + reuse — vendor-profile-form already uses this pattern in the codebase.

## Q-10 — Pin-state storage

| Option | Description | Selected |
|--------|-------------|----------|
| Full PKV from day one | multi-device sync immediately (requires BACKLOG-099 + working PKV) | |
| localStorage + PinStorage stub | localStorage now, swap PKV later, zero call-site changes | ✓ |
| localStorage only, no stub | simplest; refactor when PKV lands | |

**User's choice:** localStorage behind a thin `PinStorage` interface — NOT PKV. **Notes:** PKV (`dana.Pkv`) verified live-broken on UAT 2026-05-20 — read (`dynamodb:Query`) + write (`dynamodb:BatchWriteItem`) denied; UAT gateway role `us-east-1-demo-gateway-role` lacks the DynamoDB IAM policy on `uat-pkvs` (CI works, UAT does not). SME Mart targets UAT → PKV unusable today. Captured as Platform-Team Ask #12 (owner Andrey, cc Kevin).

## Q-11 — `/boards` cross-org list entry point

| Option | Description | Selected |
|--------|-------------|----------|
| Defer to Phase 33 | nothing in Foundation depends on its nav placement | ✓ |
| Top-nav secondary (Director lean) | demoted secondary nav level | |
| In existing dropdown / right-rail | alternatives | |

**User's choice:** DEFER to Phase 33 plan-phase. **Notes:** The cross-org list page is Phase 33 scope (blocked on orgIds[] filter); placement decided at Phase 33 plan-phase. Director lean (top-nav secondary) noted for then.

## Q-12 — Tab URL rename

| Option | Description | Selected |
|--------|-------------|----------|
| Rename + redirect | `/tasks` → `/boards`, redirect old path | |
| Rename, NO redirect | drop old path entirely | ✓ |
| Alias both permanently | more code, ambiguous canonical URL | |

**User's choice:** Rename `/engagements/:id/tasks` → `/engagements/:id/boards`, NO redirect. **Notes:** Clark confirmed the old path doesn't matter — drop it.

## Q-4 — Vetting Board specialized rendering (Phase 33; locked now)

| Option | Description | Selected |
|--------|-------------|----------|
| Drop-in template variant | tag-driven `boardKind` signal inside shared board-detail; one component | ✓ |
| Sibling component | separate `vetting-board-detail.component.ts` selected by tag | |

**User's choice:** Drop-in variant (Director-locked). **Notes:** `boardKind` signal sourced from `sme-mart.board.vetting` tag (NOT a boardType-enum check, per D-50). Data-shape divergence is rendering-divergence inside the shared substrate, not architectural.

## Q-5 — Vetting data migration (Phase 33; locked now)

| Option | Description | Selected |
|--------|-------------|----------|
| A. Bulk re-create as platform.Task | auto-detect legacy records, migrate with status mapping | ✓ |
| B. Leave legacy + dual-render | keep GQL, add tag, render switches | |
| C. Wipe + reseed | delete all (demo data), lazy-create fresh | fallback only |

**User's choice:** Option A (Director-locked). **Notes:** C kept as a silent execute-time fallback ONLY if an A-path idempotency edge fails — NOT a planning option. Migration risk LOW (Phase 20 audit: zero production vetting records ever landed due to fictional-class-ID bug). Target shape superseded by 2026-05-19 Brian meeting (Project + sub-projects + N Boards per section) — Phase 33 plan-phase reads latest BACKLOG-108.

## Q-6 — Seed-task content (Phase 33)

| Option | Description | Selected |
|--------|-------------|----------|
| Ship L-11 list verbatim | 5 helper tasks as final draft | ✓ |
| Defer to Brian meeting | wait for Brian's wordsmithing | |

**User's choice:** Ship L-11 verbatim ("Welcome to your engagement", "How to get help", "Add a corporate profile item", "Invite a team member", "Review pricing tiers"). **Notes:** Four task-shape concerns deferred to Foundation-pattern plan-phase (NOT Director-decides): descriptions vs titles, clickable route links vs plain Markdown, starting status (Todo presumed), assignment (engagement owner vs unassigned).

---

## Resolved by research (not user-discussed)

- **Q-2** (`platform.Board.list` orgIds[] array filter) — NOT supported; single `orgId` only. Platform-Team Ask #9 (Kevin). Cross-org list page blocker → reinforces Q-1 SPLIT.
- **Q-3** (User/Private boards via `userId`) — supported; ships with cross-org list in Phase 33.
- **Q-8** (board switcher click behavior) — full URL nav, confirmed by zb/ui `boardChanged(id)` callback shape (`feat/board-context-selector-mvp @ 77444a82d`).

## Claude's Discretion

- Shared `boards-grid` component decomposition (card / pin-preview sub-components) — resolve at plan-phase via `sme-mart-architect` skill.
- Signal-input shape for shared components (modernization rules 2 + 12).
- `zb-remote-table` column config for board-detail — mirror `.planning/notes/zb-ui-tasks-list-reference.md`, adapt SME-Mart labels.

## Deferred Ideas

All Phase 33 Polish (gated): cross-org `/boards` list + org-multi-select + scope-flavor chips; User/Private boards; seed tasks in provisioner; Vetting tab elimination + Option A migration + drop-in specialized rendering; PKV-backed pin sync; engagement template library + industry ontology adoption (BACKLOG-111/112).

Out of milestone: Task CRUD UI, task-detail page, board archive/clone/permissions, board-type CRUD, ngx-library hoist, mobile polish.
