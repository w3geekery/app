# Marketplace Meeting — 2026-06-23

**Date:** 2026-06-23
**Time:** 1:30 – ~1:48 PM PT (rescheduled to 1:30; ran ~15–20 min)
**Source:** Teams
**Participants:** Brian Hierholzer (CEO/Product Owner), Clark Stacer (Frontend, W3Geekery)
**Meeting Type:** 1:1 / direction-setting

---

## Brian's main ask (today's headline)

**Build a visual prototype that maps real compliance frameworks into the ZeroBias project structure — "readiness" — using the exact same project/subproject/layer pattern Clark is already building for the Hugo project. Prove the model as a picture first (no backend), publish it, iterate with Brian. It's urgent — other teams (Joe, Raghu) need a sample mapping to lock in their assessment build.**

Concretely:

- **Top-level project = the ZeroBias platform (the "app")** — the thing being audited. That's project one / the default project.
- **Create ~7 subprojects, each = one readiness assessment of the platform, each bound to a framework from the catalog:**
  1. SOC 2 **2017**
  2. SOC 2 **2022**
  3. **SSDF** (Secure Software Development Framework — NIST ~800-218)
  4. **CMMC**
  5. **FedRAMP Low**
  6. **FedRAMP Medium**
  7. **FedRAMP High**
  - (FedRAMP **20X** is the real target but not in the catalog yet → substitute the three FedRAMP levels for now.)
- **Within each subproject, fan out that framework's own hierarchy into the same multi-tier project-layer structure.** Example he walked through live: SOC 2 2017 → Trust Services Criteria → categories → principles → focus areas. Every layer rolls up metrics (task-metric roll-up / "accordion" aggregation).
- **This IS readiness:** "all readiness is, is taking requirements and pushing them into the readiness." Map a requirement/family structure onto the project in progressively lower layers.

## How he wants it delivered

- **Picture first, backend later.** Build the mapping out manually (Claude can do it — Clark: "without involving backend… Claude could do it"). Publish the picture. If it works, lock it; if it breaks, Clark + Brian go back and forth on where. *Then* build the backend once the model is agreed.
- **Capture the recipe** — have Claude capture the repeatable recipe for converting a framework into the project/subproject/task structure.
- **Speed:** "pretty urgent," "as fast as we can," come back with progress "even tomorrow." It unblocks Joe's team and Raghu, who need a sample requirements→readiness mapping + a UI to look at.

## Topics Discussed

- **Hugo / WordPress-retirement project (opener)** — Clark reported he's scaffolding the Hugo program as a project + per-domain subprojects (.com/.org/.labs/.foundation) + marketing catalog under the ZeroBias org / platform boundary. Brian endorsed the subproject-per-domain structure ("eat our dog food").
- **Pivot to Readiness (the meat)** — Brian: the project-structuring work Clark is doing is "extremely relevant to readiness"; he wants the same pattern applied to compliance frameworks. (See main ask.)
- **PMO framing (thinking-aloud, not a directive)** — top level could be a compliance PMO spanning all frameworks, with sub-PMOs/PMs per framework (a FedRAMP PM, a CMMC PM, etc.). Deferred — "for now, just do the project level."
- **Requirements-spec engine (stretch idea)** — a structured requirements template / "ad-hoc requirements builder" that ingests a framework (or even the Hugo project's own requirements) and emits the project-folder + task structure. Clark tied this to the **RDF compass** so output lands in an RDF package; Brian: "the ontological [stuff], correct."

## Key Decisions

1. **Clark pivots from Hugo to the readiness-mapping prototype now** ("I can switch to that right now") — it's the higher priority.
2. **Model-first approach:** build the visual mapping manually for 7 framework subprojects, prove it, then build the backend.
3. **Frameworks for the demo:** SOC 2 2017, SOC 2 2022, SSDF, CMMC, FedRAMP Low/Medium/High (FedRAMP 20X substituted until catalog'd).

## Action Items

| # | Owner | Action | Due/Priority | Context |
|---|-------|--------|-------------|---------|
| 1 | Clark | Build a visual prototype mapping the 7 frameworks into the platform project structure (project = app; subproject = framework; layers = framework hierarchy) | **Urgent** — progress by tomorrow | Brian's headline ask; unblocks Joe + Raghu |
| 2 | Clark | Capture the repeatable recipe (Claude prompt) for converting a catalog framework into project/subproject/task layers | Urgent | Reusable by other teams |
| 3 | Clark | Report progress back to Brian as soon as there's something to look at | Tomorrow-ish | Brian wants fast iteration on the picture |
| 4 | Clark | Once the picture is agreed: define backend endpoints + open feature requests for Raghu | After model validated | Backend follows the proven model |
| 5 | Clark | Sanity-check pulling SOC 2 2017 from the catalog (note: framework search felt slow — file a bug if it persists) | Low | Brian flagged catalog load speed live |

## Open Questions / Unresolved

- **Program vs PMO at the top level** — is the top node a program, a compliance PMO (all frameworks), or per-framework sub-PMOs? Deferred.
- **At what tier do framework levels become subprojects vs boards/tasks?** Brian's answer was "both / every layer abides by the same layer structure" — needs to be pinned down when building the picture.
- **FedRAMP 20X** not yet in the catalog — substitute for now.
- **Connection to the deferred Requirements architecture** (BACKLOG-123 / `requirements-architecture-2026-05-27-pending-kevin.md`, the 3-layer OrgFrameworkAdoption + ProjectFrameworkTarget + ProjectRequirement model) — this prototype is effectively a visual proof of that model and should be reconciled with it + the RDF compass.

## Key Quotes

> "All readiness is, is taking requirements and pushing them into the readiness. It's literally that." — Brian

> "Build out the picture… then publish the picture if it works. And if it doesn't work, then how does it not work?… we can do the back end once we agree that the picture works." — Brian

> "It's the same thing you're doing, just do it more would be my comment." — Brian (readiness mapping == the Hugo project-structuring pattern, applied to frameworks)

> "Like converts requirements into project structures with tasks." — Clark (the requirements-spec-engine idea)
