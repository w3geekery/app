# Project ResourceLink Vocabulary — Proposal for Backend

**Date:** 2026-06-03 · **Author:** Director Parks (W3Geekery / SME Mart) · **Status:** DRAFT for backend triage
**Expands:** RL-001 / task-13 ("Engagement governs") — this is the full link-type vocabulary that RL-001 was the first of.
**Decision owner:** Backend (Nic registers hydra link types; Kevin/Chris prioritize). **We propose; backend decides adopt/defer; we build with what we're given.**

---

## Why this exists

`platform.Project` today supports **containment only** — its entire hydra link-type set is `project child_of/parent_to project`, `project member_of boundary`, and `board child_of project` (verified prod-zb 2026-06-03 via `hydra.Resource.linkTypeSearch`). All semantic richness lives at the **task** layer (111 link types). Zero project↔project relationship vocabulary: no `relates_to`, `depends_on`, `governs`, `satisfies`, scheduling, etc.

If the **Projects App is to be a real project-management tool** — and it now has a **Schedule tab** — Project needs native PM associations the way MS Project / Primavera / Jira / Project Online do. This doc catalogs the candidate `(project, project)` (and a few `project → other`) link types from the PMI / PPM / systems-engineering / issue-tracker worlds, each with rationale, so backend can pick the adopt set.

**Two implementation notes up front:**
1. **Hydra link types are `(fromType, toType, linkType)` triples.** Most verbs below **already exist** in the registry for other resource types (`depends_on`, `blocks`, `supports`, `provides`, `references`, `superset_of/subset_of`, even `governs`). For those, "registering" = adding the `(project, project, verb)` triple — not inventing a verb. Genuinely-new verbs are flagged.
2. **Dependency *nature* and *lead/lag* are attributes of a dependency, not separate link types.** PMBOK classifies each dependency as Mandatory / Discretionary / External / Internal, and each carries a lead/lag offset. That's 4 PDM types × 4 natures × N lags = an explosion if modeled as distinct link types. **Open question for backend (Q-LINK-ATTR): can a hydra ResourceLink carry metadata/attributes** (nature enum, lag duration)? If yes, we register ~4 scheduling link types + attributes. If no, we either collapse to fewer types or accept a larger type count.

---

## The vocabulary (candidate `project` link types)

Tiers are our *suggestion* — backend re-prioritizes. **Core** = the engagement/onboarding model needs it now. **Schedule** = needed by the Schedule tab. **Trace** = requirements/compliance traceability. **PM** = general project-management completeness. **Defer** = catalog for later.

### 1. Hierarchy / structure
| from → to | link (from/to) | Definition | PM-world source | Verb exists? | Tier |
|---|---|---|---|---|---|
| project → project | `child_of` / `parent_to` | sub-project of a master/program | MS Project inserted subproject; WBS | ✅ registered | **have** |
| project → program *(= a project in the Program node-role)* | `member_of` / `governs` *(or new `part_of`)* | project is a component of a Program | PMI program component | ✅ (`member_of`) | **Core** |

> **Program is a node-ROLE (D-52), not a distinct resource type.** A "Program" is a `platform.Project` playing the Program role (derivable from structural rollup / governed children per the hierarchy model) — same pattern as Engagement. So all program-related links below are **`(project, project)`** triples; no `program` resource type to create.

### 2. Scheduling dependencies — PDM (Schedule tab)
The four PMBOK Precedence Diagramming Method logical relationships. Each is a predecessor→successor link carrying **nature** (mandatory/discretionary/external/internal) and **lead/lag** as attributes (see Q-LINK-ATTR).
| from → to | link | Definition | Source | Verb exists? | Tier |
|---|---|---|---|---|---|
| successor → predecessor | `finish_to_start` (FS) | successor starts after predecessor finishes (the default) | PMBOK PDM | ❌ new | **Schedule** |
| successor → predecessor | `start_to_start` (SS) | successor starts after predecessor starts | PMBOK PDM | ❌ new | **Schedule** |
| successor → predecessor | `finish_to_finish` (FF) | successor finishes after predecessor finishes | PMBOK PDM | ❌ new | **Schedule** |
| successor → predecessor | `start_to_finish` (SF) | successor finishes after predecessor starts (rare) | PMBOK PDM | ❌ new | PM |
| — | *attributes:* `dependencyNature` (MANDATORY/DISCRETIONARY/EXTERNAL/INTERNAL), `lag` (duration, ± for lead) | classification + offset on any scheduling link | PMBOK 6.3 | n/a | **Schedule** (pending Q-LINK-ATTR) |

*Generic alternative:* a single `predecessor` / `successor` link with a `relationshipType` attribute (FS/SS/FF/SF) — fewer types, more attribute-driven. Backend's call.

### 3. Prerequisite / blocking (logical, non-schedule)
| from → to | link | Definition | Source | Verb exists? | Tier |
|---|---|---|---|---|---|
| project → project | `depends_on` / `dependency_of` | B requires A complete before it can proceed | PPM cross-project dependency | ✅ | **Core** (the Engagement→Delivery gate) |
| project → project | `blocks` / `blocked_by` | A blocks B (issue-tracker semantics) | Jira default | ✅ | **Core** |

### 4. Governance / portfolio
| from → to | link | Definition | Source | Verb exists? | Tier |
|---|---|---|---|---|---|
| project(engagement) → project | `governs` / `governed_by` | Engagement governs the delivery tree (D-52) | PMI governance | ✅ (boundary uses it) | **Core** (RL-001) |
| project(engagement) <-> project(engagement) [cross-org] | `engages` / `engagedWith` | the two mirrored Engagement nodes (one per party) are counterparts in the same relationship — binds the counterparty by reference (UUID<->UUID), replacing a wipeable name/tag | bilateral engagement pairing (SME Mart mirrored model) | ❌ new | **Core** (counterparty identity) |
| project → program(project) | `contributes_to` / `receives_contribution_from` | a project's output contributes to another initiative | PPM contribution/dependency | ❌ new | PM |
| project → program/portfolio | `rolls_up_to` | rollup of status/metrics into program→portfolio | PMI portfolio hierarchy | ❌ new (or reuse `member_of`) | PM |

**Why `engages` matters — de-load-bearing the counterparty.** In the mirrored model each org owns its own Engagement node; the counterparty currently rides in the display name (`Engagement with provider X`) or an org-scoped tag — both mutable, wipeable *labels* with no referential integrity (org tags are editable/deletable by the owning admin). `engages`/`engagedWith` makes the counterparty a traversable UUID->UUID edge. **Safe = referential integrity + auditability, not immutability** (nothing here is truly immutable). Layering: **display name** (throwaway label) · **`engages` link** (structural navigation, by-reference) · **Requirement (req<>sat)** (the agreement that the engagement exists + both consented — first-class, auditable; agreements->Requirements, [[BACKLOG-123]]). Distinct from the task-level `satisfies`/`satisfiedBy` *work/disclosure* seam — `engages` is identity/relationship pairing, not data disclosure. Drives **backlog/034** (customer-to-customer engagement creation).

### 5. Requirement / compliance traceability (SysML / DOORS + SME Mart requirements model)
| from → to | link | Definition | Source | Verb exists? | Tier |
|---|---|---|---|---|---|
| task/project → requirement | `satisfies` / `satisfiedBy` | work satisfies a requirement (the req↔sat seam) | SysML/DOORS `satisfies` | ❌ new (also pending BACKLOG-108/123) | **Core/Trace** |
| requirement → requirement | `derives` / `derived_from` | requirement derived from a higher-level one | SysML `deriveReqt` | ❌ new | Trace |
| element → requirement | `refines` / `refined_by` | adds detail to a requirement | SysML `refine` | ❌ new | Trace |
| test/task → requirement | `verifies` / `verified_by` | verification that a requirement is met | SysML `verify` | ❌ new | Trace |
| any → any | `traces_to` | general traceability | SysML `trace` / DOORS | ❌ (generic) | Trace |

### 6. Association / lifecycle (issue-tracker standard — Jira)
| from → to | link | Definition | Source | Verb exists? | Tier |
|---|---|---|---|---|---|
| project → project | `relates_to` | generic association, no dependency | Jira default | ✅ | **Core** (cheap, useful) |
| project → project | `clones` / `cloned_by` | one is a copy of another | Jira default | ❌ new | PM (**template instantiation** — ties to BACKLOG-111 engagement templates) |
| project → project | `duplicates` / `duplicated_by` | dedup marker | Jira default | ❌ new | Defer |
| project → project | `supersedes` / `superseded_by` | replaces a prior version | versioning | ~ (`superset_of/subset_of`) | PM |
| project → project | `causes` / `caused_by` | causation (e.g. remediation project caused by finding) | Jira custom | ❌ new | Defer |
| project → resource | `references` / `referenced_by` | citation | hydra | ✅ | Nice |

### 7. Resource / output flow (PPM)
| from → to | link | Definition | Source | Verb exists? | Tier |
|---|---|---|---|---|---|
| project → project | `provides` / `consumes` | A's deliverable feeds B (information/output dependency) | PPM information dependency | ✅ (`provides`) | PM (offering chains) |
| project → project | `shares_resource_with` | shared critical resource (resource dependency) | PPM resource dependency | ❌ new | Defer |

### 8. Provenance / audit-trail (PROV-O) — RDF-compass-central
The RDF compass (`.planning/docs/RDF-COMPASS.md` §2, §3.4) makes Records = RDF + **PROV-O** with hash-chained tamper-evidence. These provenance predicates are the audit-trail backbone — the point of the transparency-OS container.
| from → to | link | Definition | W3C predicate | Tier |
|---|---|---|---|---|
| record/project → activity | `generated_by` / `generated` | what produced this artifact | `prov:wasGeneratedBy` / `prov:generated` | Trace |
| project/record → project/record | `derived_from` / `derives` | lineage from a prior artifact | `prov:wasDerivedFrom` | Trace |
| activity → resource | `used` / `used_by` | activity consumed an input | `prov:used` | Trace |
| record → record | `informed_by` | one activity informed another | `prov:wasInformedBy` | Trace |
| record → party | `attributed_to` | responsibility attribution | `prov:wasAttributedTo` / `prov:wasAssociatedWith` | Trace |

---

## RDF / OWL / SHACL compass alignment

Run against `.planning/docs/RDF-COMPASS.md`. **Verdict: the vocabulary fits the landscape cleanly — and the compass adds three things.**

**Fit (no painted corner):**
- Hydra ResourceLinks **are** RDF triples (subject = fromResource, predicate = linkType, object = toResource) → satisfies compass **C-2** ("if a field can't be named with a predicate URI, it shouldn't exist"). Every link type IS a predicate URI.
- The hydra `fromLinkType` / `toLinkType` pairs **are `owl:inverseOf` pairs** (child_of⇄parent_to, blocks⇄blocked_by, depends_on⇄dependency_of, governs⇄governed_by). Inverse semantics already encoded.

**Three additions the compass surfaces:**
1. **PROV-O provenance category (§8 above)** — Records/lineage are compass-central. `derives`/`derived_from` IS `prov:wasDerivedFrom`; `provides`/`consumes` ≈ `prov:wasGeneratedBy`/`prov:used`. Add provenance verbs so the audit-trail container has its lineage predicates.
2. **OWL-Time for scheduling** — the PDM FS/SS/FF/SF are temporal-interval constraints = **Allen's interval algebra** in W3C **OWL-Time** (`time:intervalBefore/after/meets/overlaps/starts/finishes`). The Schedule tab's links should map to OWL-Time so schedule data round-trips to RDF temporal reasoning (C-2).
3. **Predicate-URI mapping per verb** — align the RDF export to W3C standards, not bespoke verbs.

**Predicate-URI mapping (proposed canonical):**
| ZB link verb | W3C predicate |
|---|---|
| child_of / parent_to | `dcterms:isPartOf` / `dcterms:hasPart` (or `sh:node` recursion for Requirements) |
| depends_on / dependency_of | `dcterms:requires` / `dcterms:isRequiredBy` |
| relates_to | `dcterms:relation` (`skos:related` / `rdfs:seeAlso`) |
| references / referenced_by | `dcterms:references` / `dcterms:isReferencedBy` |
| supersedes / superseded_by | `dcterms:replaces` / `dcterms:isReplacedBy` |
| derives / derived_from | `prov:wasDerivedFrom` |
| provides / consumes | `prov:wasGeneratedBy` / `prov:used` |
| satisfies / satisfiedBy | SHACL conformance — acceptance_primitive = `sh:and`/`sh:xone`/`sh:or`; SysML `satisfy` |
| verifies / verified_by | Assessment = `sh:ValidationReport`; SysML `verify` |
| FS / SS / FF / SF | `time:interval*` (OWL-Time / Allen) |
| governs / governed_by | ZB-custom (no exact W3C; nearest ODRL governance) |
| engages / engagedWith | ZB-custom (no exact W3C org-to-org engagement predicate; nearest W3C ORG relationship / ODRL agreement) |
| blocks / blocked_by | ZB-custom (nearest ODRL prohibition / precedence) |

**OWL property characteristics to declare (for reasoning):** transitive — `child_of`, `depends_on`, `supersedes`, `derived_from`; symmetric — `relates_to`, `equals`, `engages`/`engagedWith` (if modeled mutual — see Q-ENGAGES-DIR); asymmetric — `governs`, `blocks`, `supersedes`. Declaring these lets design-time OWL reasoning + SHACL validation work later.

**Adjacent (requirement *content*, not project links — noted for completeness):** the legal/policy/agreement requirement types (MSA/EULA/policies) are **ODRL** constructs (permission / duty / prohibition) per the compass coverage-extensions table; pricing → ODRL duty + schema.org `MonetaryAmount`; security frameworks → **OSCAL**. These shape the *requirement* vocabulary ([[BACKLOG-123]]), not the project-link vocabulary — but the same W3C-alignment discipline applies.

---

## SME Mart's actual ask (the subset we need to build the onboarding/engagement model)

Of all the above, the **engagement/onboarding model uses only**: `governs`, `depends_on` (the Engagement→Delivery gate), `relates_to`, `satisfies`/`satisfiedBy`. Everything else is **Projects-App PM completeness** — valuable if the Projects App is a real PM tool (Clark's thesis), but not blocking SME Mart onboarding.

**Recommended backend framing:**
- **Adopt-now (SME Mart-blocking):** `governs`, `depends_on`/`dependency_of`, `relates_to`, `satisfies`/`satisfiedBy`, **`engages`/`engaged_by`** (durable counterparty binding for the mirrored engagement pair — role direction RESOLVED, see **Q-ENGAGES-ROLE**). **STATUS: `governs`/`engages`/`depends_on` LIVE on CI 2026-06-19** (task-13) — the org-scoped-tag interim can now be retired in favor of the real `engages` link.
- **Adopt-with-Schedule-tab:** the 4 PDM links (or the attribute-driven `predecessor`/`successor`) + the nature/lag attribute decision (Q-LINK-ATTR).
- **PM completeness (triage):** `clones` (templates), `blocks`/`blocked_by`, `contributes_to`, `rolls_up_to`, traceability set (`derives`/`refines`/`verifies`/`traces_to`).
- **Defer:** `duplicates`, `causes`, `supersedes`, `shares_resource_with`, `provides`/`consumes`.

## Open questions for backend
- **Q-LINK-ATTR:** Can a hydra ResourceLink carry attributes (dependency nature enum, lead/lag duration)? Decides whether scheduling is ~4 typed links + attributes, or an attribute-driven `predecessor`/`successor` pair, or a type explosion.
- **Q-DIRECTION:** Direction convention for scheduling — successor→predecessor (as written) or predecessor→successor? Match whatever the Schedule tab's read model expects.
- **Q-REUSE:** For verbs that exist on other types (`depends_on`, `provides`, `references`, `superset_of/subset_of`), is registering the `(project, project)` triple trivial, or does each need review?
- **Q-PROGRAM:** ~~Is "Program" a distinct resource type or just a `project` playing a role?~~ **RESOLVED (Clark 2026-06-03):** Program is a **node-role** (D-52) — a `platform.Project` playing the Program role, NOT a distinct resource type. All program links are `(project, project)`. (Backend: no `program` resource type needed.)
- **Q-RDF:** Should each link type carry its **canonical predicate-URI mapping** (Dublin Core / PROV-O / OWL-Time / SHACL) as registry metadata, so the future RDF/JSON-LD export (RDF-COMPASS final-state container) aligns to W3C standards rather than bespoke ZB verbs? (Cheap to record now; expensive to retrofit.)

- **Q-ENGAGES-ROLE — RESOLVED (zb/ui RL-001 / task-13; LIVE on CI 2026-06-19):** **Option (A) direction-encoded role**, but the names stay **`engages` / `engaged_by`** (not the `provides_to`/`provided_by` rename the lean floated). The engaging party renders `engages`, the counterparty renders `engaged_by`; provider/customer is read off direction via `linkSide` — no link attribute needed, and it collapses PS-004 (engagement-counterparty discovery) + role into one query. Binary-role caveat from Option A stands (>2-role needs would move to an explicit `context.role` attribute or the Requirement layer). **`Q-ENGAGES-DIR` folds in here** — direction = engaging→counterparty. Authority: `~/Projects/zb/ui/.claude/docs/BACKEND_FEATURE_REQUESTS.md` RL-001. The two options below are retained as historical record.
  - **(A) Role-in-direction** — a *directional* link with asymmetric inverse names (`provides_to` / `provided_by`), the **same mechanism as `child_of`/`parent_to`** (one stored row, distinct from/to ends, role read off each end's link-type name). Role becomes **structural + queryable** ("all engagements where X is provider" = X's outgoing `provides_to` links), and the direction **flips per engagement** — in the platform engagement ZeroBias points provider→customer; in the reverse dev-services engagement W3Geekery does — so the same org pair expresses opposite roles cleanly. **No dependency on link attributes.** *Cost:* bakes provider/customer as *the* role axis — binary only; peer / >2-party / richer roles would need attributes or the Requirement layer.
  - **(B) Symmetric link + role carried elsewhere** — symmetric `engagedWith`/`engagedWith` for pure identity-pairing, with provider/customer as a link **attribute** (requires **Q-LINK-ATTR** = yes) or a per-node role marker / the Requirement. Decouples "who are the parties" from "what are their roles" (more flexible), but role then lives in something mutable (tag/marker) or attribute-dependent.
  - **Lean (Clark + Director 2026-06-03):** **(A) directional is the correct long-term direction** — role is structural, queryable, attribute-independent, and flips per engagement for free. **Short-term**, an org-scoped tag can stand in for counterparty/role until the link type lands (non-durable; acceptable interim). *Naming consequence:* if direction = role, `engages`/`engagedWith` reads too symmetric — prefer role-explicit names (`provides_to`/`provided_by`, `serves`/`served_by`), or reserve `engages` for pure symmetric identity-pairing and carry role via a separate directional link.
- **Q-ENGAGES-VS-REQ:** Is the counterparty binding best as the link alone, or must the engagement's **legitimacy** also be a first-class **Requirement** (agreements→Requirements, [[BACKLOG-123]])? Likely both — link = navigation, Requirement = the auditable agreement that both parties consented.

## Sources
- [PDM — Precedence Diagramming Method (FS/FF/SS/SF)](https://project-management.info/pdm-precedence-diagramming-method/)
- [Mandatory vs Discretionary Dependencies (4PMTI)](https://www.4pmti.com/learn/mandatory-vs-discretionary-dependencies/)
- [PMBOK 6.3 Sequence Activities — leads & lags](https://4squareviews.com/2018/04/28/6th-edition-pmbok-guide-process-6-3-sequence-activities-tools-and-techniques/)
- [Jira default issue link types (Atlassian)](https://confluence.atlassian.com/adminjiraserver/configuring-issue-linking-938847862.html)
- [SysML/DOORS traceability — satisfies/derives/refines/verifies/traces](https://docs.nomagic.com/spaces/SYSMLP2022xR1/pages/106627501/Requirements+management)
- [Cross-project dependencies — Project Online](https://learn.microsoft.com/en-us/projectonline/define-project-dependencies)
- [Managing project interdependencies (Acuity PPM) — contributions & rollup](https://acuityppm.com/managing-project-interdependencies/)
