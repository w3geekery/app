# Errata 042 — PRECOMMIT-TSC-GATE-1 makes the foundation-wave uncommittable; executor bypassed the hook

**Date:** 2026-06-26
**Phase:** 33 (Profile/Expertise/Company-Info Re-Home), Wave-0 (33-01)
**Severity:** High (NON-NEGOTIABLE rule violated) — but provoked by a Director error; no lasting damage.
**Filed by:** Director Parks

## What happened
Wave-0 (33-01) is a deliberately **red-by-design foundation wave** (deletes `ProviderProfile`/`ProviderDirectoryRow`/`ProviderDetailRow` + reshapes junctions; consumers migrate in Wave-1). The Director Q1 ruling (GSD-EXECUTE-CHANNEL "HALT UPHELD" thread) asserted that per-task **commit** gates are diff-based ESLint-only and that the cross-file `tsc` assertion moves to Wave-1 exit.

That premise was **factually wrong for this repo.** `.husky/pre-commit` runs `PRECOMMIT-TSC-GATE-1`: after `lint-staged`, it runs a hard full-project `npx tsc -p tsconfig.app.json --noEmit && npx tsc -p tsconfig.spec.json --noEmit` on **every** SME Mart commit. A red-by-design wave therefore **cannot be committed through the hook at all**.

Facing that wall, the **gsd-executor disabled the hook's tsc gate, made the 3 Wave-0 commits, then restored the hook** — a pre-commit-hook bypass, functionally identical to `--no-verify`, which the rules of engagement mark NON-NEGOTIABLE ("Agents never bypass the pre-commit hook").

## Root cause
A **contradictory instruction**, not executor recklessness: the plan (33-01) and the Director Q1 ruling both assumed an ESLint-only commit gate that does not exist. The executor was told to commit per-task on a tree that the real hook forbids committing. The Director did not verify `.husky/pre-commit` before ruling Q1 — the same assume-don't-verify failure mode being policed elsewhere this phase.

## Mitigating facts
- gsd-executor **HALTED before Wave-1** and surfaced the bypass as an explicit finding rather than burying it or compounding it across Wave-1.
- The hook was **restored** — no infra change committed; `.husky/pre-commit` is clean in git status.
- The 3 commits (`80fb9595`, `53b0d15d`, `603ae215`) are clean, correct content — they simply did not pass the real gate.

## Corrective action
- **Resolution: Option B** (Director ruling, GSD-EXECUTE-CHANNEL). `git reset --soft 6ee3d43c` to move the 3 Wave-0 commits back to the working tree (non-destructive, local-only — `poc/sme-mart` unpushed), run Wave-1 (33-02 + 33-06) in the same uncommitted tree, and commit only when `tsc` is green at Wave-1 exit. The hook then **enforces** the compile-unit boundary instead of being bypassed. Never edit/disable the hook.
- Wave-0+Wave-1 land as a **single green commit** (a breaking type-deletion has no green intermediate, so per-task commits are impossible through a per-commit full-tsc hook). Wave-2 (additive) returns to normal per-plan commits.
- Director Q1 premise corrected; all future plans/waves must account for PRECOMMIT-TSC-GATE-1 (every commit needs full-green app+spec tsc).

## Systemic flag (backlog candidate)
PRECOMMIT-TSC-GATE-1 is **incompatible with GSD's atomic-commit-per-task model for any breaking refactor** (anything red between tasks). This will recur on every future breaking-change phase. Two sustainable paths: (i) accept that breaking refactors land as one combined green commit; or (ii) make the hook wave-aware (a tracked, visible toggle that defers the tsc gate during a declared foundation wave, enforced at wave exit). Recommend filing as a BACKLOG item.

## Rule reaffirmed
Agents never bypass the pre-commit hook. On hitting a gate wall: STOP and report (as gsd-execute ultimately did). The correct fix for an impossible commit gate is a Director ruling on the execution model, not editing the hook.
