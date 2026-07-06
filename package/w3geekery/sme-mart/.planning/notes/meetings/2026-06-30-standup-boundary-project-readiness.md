# Standup — Boundary/Project readiness split — 2026-06-30

**Time:** ~08:30 AM PT (standup) · **Source:** Teams
**Participants:** Kevin McCarthy, Chris Scarola, Clark Stacer
**Transcript:** `processed/2026-06-30-standup-transcript.txt`
**Primary relevance:** ZeroBias **boundary↔project↔readiness** data model (applies to both SME Mart's
project/boundary surfaces and the zb/ui Boundary-Manager × Projects **mock** exercise — deep mock analysis
in `~/Projects/zb/boundary-projects-mocks/MEETING-2026-06-30-readiness-pivot.md`).

## The decision — readiness moves out of the boundary, into the project

To make the boundary **lighter** and answer Brian's objection that the product/boundary shouldn't *own*
readiness:

- **Boundary = the house.** Holds **internal controls** + their evidence/assessment + asset reality. It's a
  real thing for itself; it doesn't care who observes it.
- **Project = the nosy HOA.** Observes the house from outside. Holds the **external controls, crosswalks,
  gap analysis, readiness %, and milestones**. Readiness is **computed/externalized**, never owned by the
  boundary.
- Trade-off acknowledged: more data-shuffling / more logic in the project, but **defensible** — a project
  can *be* "all of my SOC 2 compliance," and **another project can reference it** (e.g. a bank-requirements
  project that demands SOC 2 + other terms references your SOC 2 project). → project→project references.

## UI placement (Chris + Clark, after Kevin left)

- **Readiness tab** = choose framework(s) → backend auto-detects associated **crosswalks** → user **enables
  which crosswalks** (toggles) → readiness % **recalculates**. Milestones (target level, % by date) live
  here too (moved out of the boundary).
- **Requirements tab** = create **external requirements** + map them to controls.
- **Pulling a boundary into a project does NOT grant its frameworks.** The project dictates the target; you
  get **completion computed from the boundary's existing work via crosswalks** (boundary does NIST, project
  targets SOC 2 → list of crosswalks → check which to apply → auto-rollup).
- This becomes the **add-boundary flow**: select boundary → Next → select crosswalks/frameworks → adjust in
  Readiness after.

## Action items

- [Director/zb-ui] Brief `BRIEF.md` updated (§1a refinement + §6 page inventory re-balanced) — **DONE**.
- [Clark] Confirm the new mock open questions (BRIEF §7.5–7.7): add-boundary wizard steps, crosswalk-recalc
  in mock, project→project reference scope.
- [Team] The internal/external control split + readiness-in-project is the agreed direction "for now"
  (Chris: "who knows what'll happen tomorrow") — treat as current, watch for Brian reversal.
