---
id: "033"
severity: low
phase: 29.5
found: 2026-05-12
status: fixed
---

# Errata 033 — D-48 Lead Cascade Mechanism Is Eager-Materialized-Per-Project, Not Lazy Parent-Chain

**Date:** 2026-05-12 (Wave 4 checkpoint, Plan 06 SDK round-trip)
**Severity:** Low (spec clarification, not a defect)
**Type:** Decision-document mechanism gap
**Phase:** 29.5 (found)

## What happened

D-48 ("Project Lead Permissions Inherit Down the parentId Chain") stated that parent Project Lead automatically grants Lead permissions on descendant Projects, in addition to each child's own explicitly-named Lead. The original D-48 language did not distinguish HOW that inheritance is realized:
- **Option α — Eager materialize:** Creator added as explicit membership row on EACH Project at creation time. `listMembers(child)` directly returns inherited Leads.
- **Option β — Lazy parent-chain resolution:** Creator added only on the root Project. `listMembers(child)` resolves via walking `parentId` chain at query time.

Plan 06 Assertion 5 empirically resolved this:
- `platform.Project.listMembers(4617e9d7-...)` (depth-1 Engagement): returns Clark as explicit Project Lead, roleId `7dc84215-...`.
- `platform.Project.listMembers(e62b2446-...)` (depth-2 Project tier): returns Clark as explicit Project Lead, roleId `7dc84215-...` — same membership row shape.

**Mechanism: Option α (eager-materialize).** Each Project carries its own explicit membership record for the creator. Both depths return the membership directly.

## Root cause

D-48 was filed 2026-05-12 from backend team guidance without empirical verification. The "inheritance" language naturally implies lazy resolution, but the actual implementation is eager. Empirical verification was held until Plan 06.

## Impact

- **Member-management UI (post-v1.4):** Renaming/transferring Lead at depth 1 does NOT automatically propagate to depth 2 — each is a separate membership record. UI must surface this distinction OR provide a bulk-cascade affordance.
- **"Is X a Lead?" query code:** Can query either Project's `listMembers` directly. No need to walk parents. Simpler than D-48 originally suggested.
- **D-48 UX guidance still stands:** Adding Sam at the Engagement Project still results in Sam having Lead on all descendants — just because the platform eager-materialized that membership on every Project at creation time (or because future-when-we-add-Lead, the platform also eager-cascades). NEEDS CONFIRMATION whether eager-cascade fires on later add-Lead-to-parent, or only at child-creation-time.

## Fix prescription

**1. D-48 addendum in `DECISIONS.md`** (this commit's sibling commit):

> **Mechanism (confirmed empirically 2026-05-12 via Plan 06):** Lead inheritance is implemented as **eager-materialize-per-Project**, not lazy parent-chain resolution. Each Project carries its own explicit membership record for the creator. `platform.Project.listMembers(child)` returns inherited Leads directly without walking the chain.
>
> **Open question (still):** Whether eager-cascade fires when a Lead is added to a parent Project AFTER children already exist. Plan 06 only verified the creation-time path. Verify when SME Mart member-management UI work begins (post-v1.4).

**2. Memory update — `~/.claude/projects/.../memory/`:** Add a 1-line entry to either `project_sme_mart_hierarchy_model.md` OR create `feedback_d48_eager_materialize.md` noting the empirical mechanism.

**3. `.planning/notes/zb-task-reference.md`:** Add a Lead-mechanism note in the RACI section when next edited (Touch-It-Fix-It).

No code change. No 29.5 hotfix.

## Disposition

- **D-48 addendum filed** in DECISIONS.md as part of Wave 4 close commit batch.
- **Status: fixed** — clarification landed.
- **Open follow-up:** "does adding Lead to parent eager-cascade to existing children?" — verify when post-v1.4 member-management UI work begins.

## Related

- D-48 (Project Lead Permissions Inherit Down the parentId Chain — original entry, mechanism gap closed by this errata).
- Plan 06 SUMMARY § Observation 2 + Assertion 5.
- `.planning/notes/zb-task-reference.md` (Touch-It-Fix-It target for Lead-mechanism note).
