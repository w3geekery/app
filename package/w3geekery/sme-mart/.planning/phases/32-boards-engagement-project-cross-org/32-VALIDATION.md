---
phase: 32
slug: boards-engagement-project-cross-org
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-20
---

# Phase 32 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Karma + Jasmine (Angular CLI default; existing `*.spec.ts`) |
| **Config file** | `karma.conf.js` / `angular.json` test target |
| **Quick run command** | `npx tsc -p tsconfig.spec.json --noEmit` (type gate) |
| **Full suite command** | `ng test --watch=false --browsers=ChromeHeadless` |
| **Estimated runtime** | ~60-120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc -p tsconfig.spec.json --noEmit` + diff-based lint (pre-commit hook auto-runs)
- **After every plan wave:** Run `ng test --watch=false --browsers=ChromeHeadless`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

> Filled by gsd-planner / gsd-validate-phase once PLAN.md tasks are finalized.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | — | — | — | — | — | — | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

> Determined at planning. Karma/Jasmine infrastructure already exists in the project (existing `*.spec.ts`), so Wave 0 likely installs no new framework — only adds spec stubs for new components/services.

- [ ] Spec stubs for the shared `boards-grid` component + sub-components
- [ ] Spec stub for `PinStorage` interface + localStorage implementation
- [ ] Spec stub for board-detail page component

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pin-to-expand inline grid layout (Sketch 001 Variant A; `span 2`; full-width < 760px) | L-5 | Visual/responsive layout not unit-assertable | Pin 1-2 boards on engagement Boards tab; confirm in-place expand + ≤25-task paged preview; resize below 760px to confirm full-width span |
| Board switcher full-URL nav | L-13 / D-Q8 | Router navigation + shareable URL is an integration behavior | Open `/boards/:boardId`; pick a sibling board; confirm URL changes + browser back works |
| Admin "Open in ZB Platform" gating | L-9 | Depends on live `getPrincipal().isAdmin` | Confirm link present for admin principal, absent for non-admin |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
