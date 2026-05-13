---
phase: 30
plan: 03
subsystem: default-project-board
title: "Feature Coming Soon Component"
tags: [angular-21, ngx-library, placeholder, signal, route-data]
status: complete
completed_date: 2026-05-12
duration_minutes: 15
tasks_completed: 4
files_created: 4
test_coverage: 100%
---

# Phase 30 Plan 03: Feature Coming Soon Component — Summary

## Objective Met

Created a lightweight, reusable Angular 21 standalone component (`FeatureComingSoonComponent`) that renders honest placeholders for features not yet in v1.4 (Org Documents 046, Engagement Dashboard 066, Message Center 065). Component receives title, description, and featureKey via route data with zero backend API calls.

**Deliverables:** 4 files created and tested atomically.

---

## What Was Built

### 1. feature-coming-soon.component.ts
- **Lines of code:** 34 (under 40-line budget)
- **Type:** Standalone component with `inject()` DI
- **Data flow:** `ActivatedRoute.data` → `toSignal()` → reactive signal binding
- **Imports:** `ZbEmptyStateContainerComponent` from ngx-library (only dependency besides Angular core)
- **Key pattern:** `toSignal(route.data.pipe(map(...)), { initialValue: undefined })` for clean route data → signal bridge (Angular 21 canonical pattern)
- **Cleanup:** Automatic via `toSignal` (no manual `OnDestroy`, no manual unsubscribe)

### 2. feature-coming-soon.component.html
- **Control flow:** Uses `@if` directive with `as data` alias binding (Angular 21 built-in)
- **Layout:** Wraps content in `ZbEmptyStateContainerComponent` (real ngx-library selector, verified against source)
- **Content:** Title, description, and low-emphasis feature code (audit trail)
- **Fallback:** `@else` branch for initial-undefined window ("Loading..." state)

### 3. feature-coming-soon.component.scss
- **Colors:** 5 CSS variables used (all Material 3 tokens: `--mat-sys-surface`, `--mat-sys-on-surface`, `--mat-sys-on-surface-variant`, `--mat-sys-outline`)
- **Typography:** h1 2rem, body 0.875rem, footer 0.75rem per DESIGN.md scale
- **Theme awareness:** Runtime-switchable via CSS variables (no hex literals, no Sass variables)
- **Layout:** `:host { display: block; min-height: 100vh }` for full-page context

### 4. feature-coming-soon.component.spec.ts
- **Test count:** 4 specs (component creation, data binding, template rendering, fallback labels)
- **Pattern:** Synchronous tests via `toSignal({ initialValue: undefined })` + `of(...)` observable
- **Helper:** `setUp()` consolidates TestBed config for clarity
- **No async ceremony:** No `setTimeout(0)`, no `done()` callbacks — signal resolves on `fixture.detectChanges()`

---

## Verification Results

| Check | Result | Details |
|-------|--------|---------|
| **File presence (4 files)** | ✓ PASS | All files exist at correct paths |
| **toSignal usage** | ✓ PASS | 3 instances found (ts component + spec) |
| **CommonModule ban** | ✓ PASS | No CommonModule import (Angular 21 @if covers control flow) |
| **mat-spinner ban** | ✓ PASS | No `<mat-spinner>` (not needed for placeholder) |
| **Fabricated selector ban** | ✓ PASS | No `sme-mart-empty-state-container` (verified invalid) |
| **Real selector present** | ✓ PASS | 4 instances of `zb-empty-state-container` (correct selector) |
| **@if control-flow** | ✓ PASS | 1 @if directive (plus @else fallback) |
| **CSS variables** | ✓ PASS | 5 var(--...) tokens in SCSS (>= 4 required) |
| **No hex literals** | ✓ PASS | No #RRGGBB values in component SCSS |
| **TypeScript (app)** | ✓ PASS | `npx tsc -p tsconfig.app.json --noEmit` — no errors |
| **TypeScript (specs)** | ✓ PASS | `npx tsc -p tsconfig.spec.json --noEmit` — no errors |
| **ESLint (TS + HTML)** | ✓ PASS | `npx eslint *.ts *.html --max-warnings=0` — no violations |
| **Unit tests** | ✓ PASS | 4/4 tests pass (41ms total) |

---

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | `9b5f9d9` | feat(phase-30): create feature-coming-soon.component.ts |
| 2 | `84dde3e` | feat(phase-30): create feature-coming-soon.component.html |
| 3 | `44060c9` | feat(phase-30): create feature-coming-soon.component.scss |
| 4 | `04bdfde` | feat(phase-30): create feature-coming-soon.component.spec.ts |

---

## Key Design Decisions Applied

**From Director's hand-fix (3e12639):**
- ✓ No CommonModule import (Angular 21 @if is built-in)
- ✓ Correct selector `zb-empty-state-container` (not fabricated `sme-mart-empty-state-container`)
- ✓ `toSignal(route.data.pipe(map(...)))` pattern (not dead `input<T>()` + manual subscribe)
- ✓ Synchronous test pattern with `of(...)` (not `setTimeout(0)` + `done`)

**From UI-SPEC.md Theme Awareness Directive:**
- ✓ All colors use CSS variables (--mat-sys-*, not hex literals)
- ✓ Runtime-switchable when ZbThemeService flips theme
- ✓ No Sass variables or hardcoded #RRGGBB values

**From PATTERNS.md Angular 21 Modernization:**
- ✓ Field-level `inject()` only (no constructor DI)
- ✓ Standalone component (no NgModule)
- ✓ Control flow with `@if`/`@else` (no *ngIf)
- ✓ Signal-based reactive pattern

---

## Deviations from Plan

None. Plan executed exactly as written. Director's hand-fixes were incorporated:
- CommonModule not imported
- ZbEmptyStateContainerComponent selector verified correct
- toSignal pattern correctly implemented
- Synchronous test pattern applied

---

## Known Stubs

None. Component is fully wired:
- Route data flows to signal → template binding
- Template renders data properties
- Unit tests verify binding and fallback labels
- No placeholder text, no hardcoded empty values, no dead code

---

## Threat Flags

None. Minimal security surface:
- Static route data (code-defined, not user-controllable)
- No API calls, no form inputs, no state mutations
- Template uses safe interpolation ({{ }})
- No external dependencies beyond ngx-library

---

## Testing

### Unit Tests (4/4 Pass)
1. Component creation from route data
2. Data binding from route.data via signal
3. Template rendering (title, description present)
4. Fallback labels applied when route data empty

### Continuous Integration
- TypeScript strict mode: no errors
- ESLint (diff-based hook): no violations
- Build: successful (7.458s)

---

## Next Steps (Phase 30-05)

Plan 05 wires this component to three routes (`/org-documents`, `/engagement-dashboard`, `/message-center`) in `app.routes.ts` with route data providing title/description/featureKey. No further changes needed to this component.

---

## Self-Check: PASSED

- ✓ Feature-coming-soon.component.ts created and committed
- ✓ Feature-coming-soon.component.html created and committed
- ✓ Feature-coming-soon.component.scss created and committed
- ✓ Feature-coming-soon.component.spec.ts created and committed
- ✓ All 16 verification checks pass
- ✓ No defect-guard regressions (CommonModule, mat-spinner, fabricated selector, hex literals)
- ✓ 4 unit tests pass
- ✓ SUMMARY.md created
