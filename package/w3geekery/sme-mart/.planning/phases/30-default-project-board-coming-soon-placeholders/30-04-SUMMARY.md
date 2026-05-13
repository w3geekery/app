# Plan 30-04 SUMMARY — DefaultProjectBoardComponent

**Status:** Complete
**Wave:** 2 (parallel-safe with 30-02 + 30-03 modulo depends_on: [30-01, 30-02])
**Final commit:** `d518073` (spec-typing fix); component code unchanged from Wave 2 close `3830ded`
**Backfill note:** This SUMMARY was hand-written by Director on 2026-05-13 during Phase 30 close. The execute-plan workflow did not auto-emit a 30-04-SUMMARY.md during the Wave 2 close cycle (artifact gap; root cause unclear — possibly suppressed by the spec-tsc failure that mid-flighted the wave). All gates and code-state below are verified post-fix at HEAD `d518073`.

## What shipped

Four new files in `src/app/pages/default-project-board/`:

| File | LOC | Purpose |
|---|---|---|
| `default-project-board.component.ts` | 73 | Standalone Angular 21 component; injects `EngagementsService` + `ZerobiasClientApp`; signal-based state (`loading`, `engagement`, `projectTier`, `error`); `computed()` derived booleans; async `ngOnInit()` does whoami-replacement via `app.getCurrentOrgId()` → `getDefaultEngagement()` → `getProjectTierProject()`; defensive null checks per G5; `retry()` method calls `window.location.reload()`; under G6 ceiling (73 < 150) |
| `default-project-board.component.html` | ~30 | `@if`/`@else if` control flow (no `CommonModule`); 3 states — loading (`<mat-progress-spinner>`), error (user message + retry button bound to `retry()`), success (2 Material `<mat-card>` for engagement + Project tier with D-32..D-35 verbiage bindings) |
| `default-project-board.component.scss` | ~70 | All colors via `var(--mat-sys-*)` (zero hex literals); CSS Grid `auto-fit minmax(400px, 1fr)`; flex-centered loading + error states; Material spacing tokens |
| `default-project-board.component.spec.ts` | ~140 | 7 Vitest test cases: create, load engagement+tier, missing-org error, missing-engagement error, missing-tier error, success-render template assertion, `retry()` window.location.reload spy |

## Key design decisions held

- **G1(c) lightweight new component** — NO ProjectDetail reuse. Inline 2-card render + 3-state UI.
- **G2(a + hoist)** — calls `engagements.service` helpers from Plan 30-02; uses `SME_MART_TIER_PROJECT_TAG_ID` from the hoisted `core/constants/tier-tags.ts` (Plan 30-01).
- **G4 Material `<mat-card>` × 2 grid** — engagement card (depth 1) + Project tier card (depth 2). The `<mat-card>` × 3 cards in the UI-SPEC are the Coming Soon surfaces on the OUTER dashboard layout, mounted in app.routes.ts (Plan 30-05) — not nested within this component.
- **G5(a) defensive UX** — null returns from `engagements.service` → `error` signal set with user-friendly copy ("No default engagement found", "Project tier not yet provisioned", "Unable to determine your organization"); NO auto-reprovision (deferred to Phase 31 / `D-49-NAMESPACE-MIGRATE-1`).
- **G6 ceiling held** — 73 LOC against 150 ceiling. No SPLIT recommendation triggered.

## Defect-regression guards (all GREEN at HEAD `d518073`)

Per the Director-hand-fixed plan's verification section:

| Guard | Status |
|---|---|
| No `CommonModule` import | ✓ |
| No `<mat-spinner>` deprecated alias (uses `<mat-progress-spinner mode="indeterminate" diameter="48">`) | ✓ |
| Template binds `(click)="retry()"`; `retry()` method in `.ts` calls `window.location.reload()` | ✓ |
| Uses `inject(ZerobiasClientApp).getCurrentOrgId()` (NOT `whoAmI().organizations[0].id`) | ✓ |
| No fabricated `<sme-mart-empty-state-container>` selector | ✓ |
| No `*ngIf`/`*ngFor` in template (`@if`/`@else if`/`@else` only) | ✓ |
| No hex literals in `.scss` (theme-aware via `var(--mat-sys-*)`) | ✓ |
| G6 ceiling: component `.ts` < 150 LOC | ✓ (73 LOC) |

## Wave 2 spec-typing remediation (commit `d518073`)

The original Wave 2 close (`3830ded`) had 16 TS errors in the spec file:

- **Root cause:** mock holders typed as `Partial<EngagementsService>` / `Partial<ZerobiasClientApp>`. `Partial<T>` makes every method optional, collapsing `vi.fn()`'s return type back to the production method signature. `mockResolvedValue` then doesn't exist on the optional production signature → TS18048 + TS2339 × 8 lines.
- **Fix per Director option (i):** drop `Partial<T>`; type each mock as concrete literal `{ method: ReturnType<typeof vi.fn> }` shape. Preserves vi.fn mock type.
- **Two additional runtime test gaps caught in same commit:**
  - `should render success state` was missing `await whenStable()` after `fixture.detectChanges()` — Angular lifecycle race. Fixed with `await ngOnInit() → whenStable() → detectChanges() → whenStable() → detectChanges()` sequencing + 3 signal-state pre-assertions for tighter failure signals.
  - `vi.spyOn(window.location, 'reload')` threw `TypeError: Cannot redefine property: reload` because jsdom defines `reload` as non-configurable. Switched to `vi.stubGlobal('location', { reload: vi.fn() })` + `vi.unstubAllGlobals()` cleanup.

Both additional fixes were defects in the Director-hand-fixed plan text from 2026-05-12 (Jasmine→Vitest translation). The executor's translation was correct; the residual jsdom + lifecycle quirks needed empirical fixup.

## Verification gates at HEAD `d518073`

- `npx tsc -p tsconfig.app.json --noEmit` — exit 0
- `npx tsc -p tsconfig.spec.json --noEmit` — exit 0 (previously 16 errors; gate now clean)
- `npx eslint default-project-board.component.* --max-warnings=0` — exit 0
- `npm test -- --include="**/default-project-board.component.spec.ts" --watch=false` — 7/7 PASS
- pre-commit hook (lint-staged → eslint) — ran cleanly, no `--no-verify`

## Side-channel finding (escalated to Director)

The pre-commit hook (`.husky/pre-commit`) invokes only `lint-staged` → eslint. There is NO tsc gate in the pre-commit hook. Commit `ad0c5fb` passed its hook via ESLint (which doesn't catch TS type errors of the `Partial<T>` collapse shape) while the spec-tsc gate was never enforced at commit time. This validates the existing `PRECOMMIT-TSC-GATE-1` BACKLOG entry (HIGH priority) which proposes adding `tsc -p tsconfig.app.json && tsc -p tsconfig.spec.json` to the pre-commit hook to make this class of miss impossible to skip. Director defers landing PRECOMMIT-TSC-GATE-1 to immediately AFTER Phase 30 closes per the backlog item's own guidance ("do NOT add it under duress of finishing another phase").

## Files committed for Plan 30-04

```
src/app/pages/default-project-board/default-project-board.component.ts
src/app/pages/default-project-board/default-project-board.component.html
src/app/pages/default-project-board/default-project-board.component.scss
src/app/pages/default-project-board/default-project-board.component.spec.ts
```

## Commits (chronological, all on `poc/sme-mart`)

- `a712c1b` — initial component skeleton
- `32e0293` — template + ngOnInit discovery flow
- `aba24e6` — SCSS with theme variables + Material grid
- `7691eec` — wave-2 close additions
- `ad0c5fb` — spec refactor with Vitest syntax + (incorrect) Partial typing
- `3830ded` — original Wave 2 close commit
- `d518073` — spec-typing fix per Director option (i) + runtime test gap repairs

## Cross-references

- Plan: `30-04-PLAN.md`
- UI design contract: `30-UI-SPEC.md`
- Pattern analogs: `30-PATTERNS.md`
- Locked decisions: `30-CONTEXT.md` (gray areas A + G1..G7)
- Verification: `30-VERIFICATION.md`
- Errata 035 — GSD 1.41.2 plan-phase aftermath (commit_docs:false ignored + STATE.md corruption + PATTERNS untracked) — fixed in Director cleanup commit `5ba9926`
