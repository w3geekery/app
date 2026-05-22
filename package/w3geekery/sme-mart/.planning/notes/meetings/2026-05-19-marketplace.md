# Marketplace Meeting — 2026-05-19

**Date:** 2026-05-19
**Time:** ~2:30 PM – 3:05 PM PT (35 min)
**Participants:** Brian Hierholzer (CEO, ZeroBias / Product Owner), Clark Stacer (W3Geekery, SME Mart Frontend)
**Source:** Teams
**Meeting Type:** Planning / direction-alignment (post-Clark's SHACL/OWL/Holon overlay handoff)

---

## Topics Discussed

- **The SHACL/OWL/RDF ontology overlay landed cleanly.** Brian read Clark's handoff (`.claude/handoffs/shacl-owl-holon-quantum-overlay-2026-05-19-fixed.html`) and confirmed it captures the data-layer the ZB Transparency framework has been missing. "We've defined the pipes. We just have not defined what is moving through the contract. And this is the ontology data layer."
- **Vetting reframed as Project + sub-projects + many Boards** (not the single-Board model from our recent BACKLOG-108 lock). Each Vetting section (banking, corporate identity, D&B, financial, MSA, office background checks) becomes its OWN Board (or sub-project) with granular requirement tasks (e.g., banking → routing, wire, ACH, bank info as sub-tasks).
- **Industry-standard ontologies for commerce / credentials / banking / payment events** — Brian wants research spike: "I don't think we have to redefine these. There are W3C standard ontologies for commerce, credential ontologies..." Lean on W3C / industry consortia rather than invent.
- **Engagement template library** — Brian wants a catalog of engagement-type templates (each defining its own Vetting structure + Boards + Task templates + SHACL constraints eventually). Pulled from public-domain ontologies where they exist. "It's got to be out there."
- **Compliance gates per ontology** — SHACL Rules apply: if banking requirements not met, downstream tasks gated. "Has it been satisfied?" governs flow.
- **Task / Workflow template library on platform side** — Tom is building the task app on the ZB core side with task templates by type AND a playbook/workflow construct (stringing tasks together). Both demand-side and supply-side. Sometimes single-sided/internal-only.
- **Mirrored engagement** — Clark proposed each side has its own engagement view (W3Geekery's side + ZeroBias's side, mirrored). Brian: "Maybe, yes, yes, maybe. Fingers crossed, I don't know." Open question; ontology may already have bidirectional supply/demand nomenclature.
- **Convergence with audit crowd (Joe / Dan / Raghu)** — Brian wants Clark in the audit-crowd meetings 2x/week instead of just 1x so SME Mart prototype shapes converge with their work earlier. Currently meeting Friday 7am Clark-time; possibly add a second day.
- **Project app lands in ZB core in ~3 months** — Clark: SME Mart's project work IS the prototype; refined version moves to core platform.
- **"System graph" as substitute for "Holon"** — Brian: "we want to use the construct of these of the, let's just say it's a system graph rather than a Holland graph." Suggests Brian's mental model uses "system" interchangeably with "Holon" — vocabulary not locked.
- **Timing on SHACL 1.2** — confirmed "just came out like last week" (W3C release matches our handoff's "March 2026" reference).

## Key Decisions

1. **Vetting is a Project with sub-projects + many Boards.** Not a single Board (supersedes the Option 3 lock in BACKLOG-108 from earlier today — see "Implications" section below for proposed amendment).
2. **Industry-ontology research spike is the next research priority.** Clark to do W3C commerce / credentials / banking / payment-event ontology survey before redesigning Vetting structure.
3. **Engagement templates will be a first-class concept** in SME Mart (and eventually ZB platform) — template library, catalog, pulled from public-domain ontologies.
4. **No urgency on the ontology data layer yet.** Brian: "not critical because we've got to get pipes in place. We got to get projects in place. We got to get the transparency center in place." Keep building scaffolding; fold ontology layer in as research lands.
5. **Audit-crowd meeting cadence to increase** — operational, Clark scheduling with Joe / Dan / Raghu tomorrow morning.

## Action Items

| # | Owner | Action | Due/Priority | Context |
|---|-------|--------|-------------|---------|
| 1 | Clark | Research spike — W3C commerce / credentials ontologies, banking / payment-event ontologies, candidate SHACL packages | Before Vetting redesign | Brian: "what are the known ontologies to support these types of transactions and these requirements?" |
| 2 | Clark | Amend BACKLOG-108 — Vetting shape from "ONE Board" to "Project + sub-projects + Boards per section" | Now | Direct contradiction surfaced in this meeting |
| 3 | Clark | File new BACKLOG — Engagement template library (W3C-ontology-backed templates per engagement type) | Now | Brian directive |
| 4 | Clark | File new BACKLOG — Industry-ontology research spike (preliminary survey) | Now | Action #1 captured as backlog entry |
| 5 | Clark | Update RDF-COMPASS — fold in template-library + industry-ontology adoption + "system graph" alternate terminology | Now | Compass should reflect meeting outcomes |
| 6 | Clark | Update BACKLOG-110 — Brian's "system graph" mental model suggests Holon may not be the locked term | Now | Vocabulary still in flux per meeting |
| 7 | Clark | Schedule with Joe / Dan / Raghu tomorrow 9am — possible 2nd weekly meeting (Friday slot or new slot) | Tomorrow's meeting | Brian wants tighter convergence on prototype shapes |
| 8 | Brian | Send transcript to Clark | Within day | Already in incoming/ — done before meeting summary processing |

## Open Questions / Unresolved

- **Mirrored engagement vs. ontology-native bidirectional nomenclature** — does the W3C commerce/SHACL ontology already define "demand-side / supply-side" or "buyer / seller" mirror semantics? Or do we build the mirror ourselves at the SME Mart layer? Research spike (#1) should answer.
- **"System graph" vs "Holon"** — vocabulary not locked. Brian uses both interchangeably. Awaiting ZB-leadership decision (BACKLOG-110).
- **Vetting section granularity** — banking has sub-requirements (routing, wire, ACH, etc.). Are those Tasks under a "Banking" Board, or sub-projects under a "Banking" sub-project? Likely answered by which ontology shape we adopt.
- **Tom's task-app delivery timeline** — when does the platform-side task template library + workflow construct land? Affects when SME Mart can consume vs build standalone.
- **Audit-crowd meeting cadence** — Clark + Joe / Dan / Raghu to decide tomorrow morning (1x/week stays, OR add 2nd weekly, OR use Friday slot back-to-back with current Brian meeting).

## Key Quotes

> "We've defined the pipes. Let's say that a pipe between two, you know, pipes or a spigot or whatever is, you know, but we just have not defined what is moving through the contract. And this is the ontology data layer of the information format." — Brian

> "These are extremely known standards with the SHACL and the RDF. There's like a SHACL 1.2 release that literally just came out... So all of this is extremely programmatic and there is nothing that we have to invent." — Brian

> "Vetting might actually be a project with sub-projects and many boards. There might be many pairs of requirement, satisfaction tasks, twin tasks." — Clark (Brian: "Yeah, and you may have a whole bunch of templates in the engagement templates, maybe, right?")

> "We're not having to reinvent ****. And even in that diagram with Google and Microsoft and Palantir, you know, this is known stuff." — Brian

> "I'm just substituting system for Holland." — Brian (on "system graph" vs "Holon graph" terminology)

> "Our timing is very good, very good. Like for us to be at this spot right now, thinking about this and literally Google and Microsoft now jumping to like crazy timing." — Brian
