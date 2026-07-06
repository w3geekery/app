# Slack Huddle — Project model: context / lifecycle / types (confirmation + refinement)

**Date:** 2026-07-03
**Time:** 1:20–1:45 PM PT
**Source:** Slack Huddle
**Participants:** Kevin (CIO), Clark

## Headline

Kevin and Clark nailed the project model to three dimensions — **context** (tags), **lifecycle** (standard | evergreen), and **types** (feature-sets, stackable, primary-first). This **confirms** the shape already captured in MODEL.md; the huddle adds clarifications, nothing contradicts. Kevin: "this resolves most of the stuff we talked about today in a clean shape."

## The model (as landed)

- **context** — a TAG dimension: `project` / `workspace` / `aperture` / `thread` / xyz. "Tree-like if we want, but NOT the structural parent-child relationship." Nic's tree (project > workspace > aperture|thread, guard-enforced, overridable at org/program level) is relegated to an optional global tag group. **Tier is dead** — Clark: "you don't need the whole tier system at all, ever"; Kevin: "all that is is a way to put as many of Brian's words on the screen as possible."
- **lifecycle** — the fundamental structural switch (renamed from "mode"): **standard** ("I'm done when I'm done") | **evergreen** ("I never die; always representing a state"). Defaults to standard. Load-bearing (behaviors differ — e.g. no %-complete on an evergreen). Evergreen = Brian's "readiness."
- **types** — feature-sets (Kevin: "the word type eats [features] up"). Object-oriented: a project can be several types at once (bug-tracking + clinical + hot). Some stack, some are mutually exclusive. **Primary-first, with constraints** — a primary can require a structure ("can't make a phase without a program"). A type bundles a lifecycle + a feature-set, so "type becomes meaningful."
  - primary types: **program** (evergreen feature-project whose child is a phase), **phase** (temporary; its job is to extend / roll requirements up to its parent program), **assessment** ("audit without saying audit" — "this is not an audit").
  - accessory types: **entanglement** (transparency-entangled — mechanically watch-a-change-in-one-project-and-enact-it-in-another; "effectively copy-paste"), **template**, domain-specific packs (clinical, financial, …).

## Refinements vs prior MODEL (what sharpened)

1. **context ≠ structural hierarchy.** Context tags are optional labels; the real parent-child containment tree is a separate thing. Don't conflate.
2. **types are an EXTENSIBILITY point.** A base feature-set ships; customers/orgs author their own feature packs (clinical, financial) — templates + fields + widgets + workflow (deluge-style scripts) — and load them without changing core software (Kevin: "like making a Zoho app"). Load-bearing types (program/phase) are "coded at the factory"; accessory features are user-loadable.
3. **type bundles lifecycle + features**, and a feature can require/imply a lifecycle (program ⇒ evergreen).
4. **entanglement = a feature** (watch-and-copy across projects), not structural.
5. **aperture-the-lens is a boundary/runtime thing, not a project** — Clark: "the way Brian was talking about aperture, that would be a boundary thing… that wouldn't even be a project." Distinct from the "aperture" context-tag label; resolves the earlier collision.
6. **tier permanently dead;** context stays only as an optional tag group.

## Does anything contradict the current model?

No. All confirmation + refinement of the context/lifecycle/types model already in MODEL.md, SC-008/task-74, and tag PR #8 (project-context). Nothing to unwind.

## Action items

- Fold refinements 1–5 into `~/Projects/zb/boundary-projects-mocks/MODEL.md`. *(done 2026-07-03)*
- No change needed to SC-008/task-74 (lifecycle + types already correct) or tag PR #8 (project-context + project-domain already correct).
