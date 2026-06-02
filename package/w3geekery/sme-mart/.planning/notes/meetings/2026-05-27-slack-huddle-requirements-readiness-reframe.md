# 2026-05-27 — Slack Huddle: Projects-App Requirements & Readiness Reframe

**Date:** 2026-05-27
**Time:** 10:09 AM – 10:56 AM PT (47 min)
**Participants:** Clark Stacer, Brian Hierholzer
**Source:** Slack Huddle
**Transcript:** [processed/2026-05-27-slack-huddle-transcript.md](processed/2026-05-27-slack-huddle-transcript.md)

## Headline

Brian walked through Clark's projects-app mockups and pushed two major reframes that bubble up into a top-level structural change: **Requirements** must be a first-class tab (Brian: "it may blow up to be that big… an entire legal repository"), and **Readiness** is the right name and conceptual home for what's currently "Health & Progress." Boundary stops being a compliance construct — it is security-only. Standards/compliance content migrates out of Boundary into a new Readiness app/tab. Org Profile blob becomes the carrier for private/org-scoped requirements catalogs (legal, MSA, custom frameworks).

## Topics Discussed

- **SME Mart ↔ Projects-app relationship.** Clark is 90% focused on projects-app because the platform projects-app is canonical for project/engagement structure. Open question: when drilling into a project from SME Mart, does it open the platform projects-app, or does SME Mart have a custom view? Both have merit — Brian leans toward "let it inform the platform, force schema-extension affordances; we may end up with a community-driven extension model."
- **Community-driven platform contribution.** Brian's broader thesis: platform value is contribution-weighted. Members who don't contribute have less marketplace credibility ("brotherhood concept"). Schema extension capability + contribution declaration is part of the moat.
- **Portfolio page — boundary column.** A project has one anchor boundary but can resource-link to many. Brian wants visual delineation between anchor and other linked boundaries, and surfaces the eventual need for a cross-cutting boundary view ("hey, here's anchor, here are 50 others I can traverse").
- **Project-detail banner / tier label.** Program · Workspace · Project · Aperture · Thread is correctly treated as a malleable user-tagged label, not load-bearing structurally. Brian: "however you wanna label those" — affirmed.
- **Persona-driven lenses (Program Manager lens, etc.).** Brian endorsed this strongly ("you may end up with a program app at the end of the day"). IT admin doesn't care about Program; PM does.
- **Real-world depth — 20-floor-deep hierarchies.** Brian gave concrete example: infra → containers → CIS benchmark → DISA STIG → individual configuration rules (each rule = an assessable layer with its own runtime/state). Confirmed the n-deep nested structure is correct and warranted.
- **Health & Progress rollup.** Renaming this to "Readiness" — see Key Decisions.
- **★ Requirements as first-class.** Brian's main push. Requirements aren't tasks-and-boards in disguise; they're a scratch space → catalog → application pipeline that lives BEFORE tasks. Pattern: load reqs into org-level catalog (private + global), then pick from catalog when assembling a project. Quote: "I don't build a task until I define the requirements." Could grow large enough to be its own app.
- **★ Readiness as construct + tab.** "Readiness is the measurement of requirements satisfied, not satisfied, partial. That's readiness." Boundary is to be stripped of compliance/standards content — boundary is security permissions ONLY. Readiness becomes its own home for compliance/legal/financial/cyber/AI/licensing requirement measurement across many "by-type" domains. Layered: task-readiness, project-readiness, engagement-readiness.
- **Org Profile blob as private requirements catalog.** Clark already has an `OrgProfileItem` GQL entity (JSON blob) in SME Mart. Brian: that's the carrier — load custom legal reqs, MSAs, business rules, private compliance frameworks ("Joe/Sam/Betty built this, don't share it globally") into org profile, expose via catalog pick lists when assembling projects.
- **Boundaries panel/tab on project detail.** Brian wants explicit boundary surface area on the project page (not just primary boundary field + resource-links section).
- **Members & Roles.** Bind to NICE NIST roles/responsibilities/tasks/skills/knowledge catalog (governance pattern). Local custom naming OK as long as bound to NICE verbiage underneath. Brian to check with Daniel for newer NICE catalog version.
- **Activities tab.** Already on the back burner with Nic + Kevin (from this morning's standup). Endpoints coming.
- **Customizable widget dashboard.** Future enhancement — PM-configurable widget grid on project overview.

## Key Decisions

1. **Rename "Health & Progress" → "Readiness"** on the project-detail page. Readiness is the canonical term; widely used in defense/cyber/compliance.
2. **Add an explicit "Requirements" tab** on project detail. Requirements come before tasks; tasks are derived from requirements.
3. **Add an explicit "Readiness" tab** (or treat Overview AS Readiness) — where requirement-satisfaction is measured per-task, per-project, per-engagement.
4. **Boundary becomes security-only.** Strip standards/compliance content out of Boundary entirely. Boundary = "who can access what" (people, machines, data, applications). All compliance/standards content migrates to Readiness construct.
5. **Org Profile blob carries private requirements catalogs.** Clark's existing `OrgProfileItem` GQL entity is the right carrier for custom legal/MSA/business-rule/private-compliance reqs at the org level. Schema extension to formalize this is needed.
6. **Add a Boundaries panel/tab** to project detail (multi-boundary visibility, not just primary + resource-links).
7. **Members → Roles binds to NICE NIST framework** (mirroring governance roles pattern). Custom local labels permitted as long as bound to the NICE canonical underneath.
8. **Requirements catalog = global shared + private org.** Both sources feed the project-assembly pick list.

## Action Items

| # | Owner | Action | Priority | Context |
|---|-------|--------|----------|---------|
| 1 | Clark | Add Requirements tab to mockups; rethink Boards/Tasks tab structure so Requirements → Tasks pipeline is visible | high | Brian's main push; the current §2.8 Req↔Sat pair on a default board doesn't surface requirements enough |
| 2 | Clark | Add Readiness tab (or reframe Overview as Readiness) to mockups | high | Pairs with #1 |
| 3 | Clark | Update mockups: rename "Health & Progress" → "Readiness" | medium | Quick win |
| 4 | Clark | Add explicit Boundaries panel/tab to project-detail mock | medium | Multi-boundary visibility |
| 5 | Clark | Bring framework-resource-link question to Kevin (project ↔ framework link type; private vs global) | medium | Catalog-pull mechanism for requirements |
| 6 | Clark | Bring org-level requirements catalog schema question to Kevin (Daniel's area) | high | Org Profile blob shape, framework type extension |
| 7 | Brian | Talk to Daniel about loading requirements at org level (private legal, MSA, custom frameworks) — extension of existing global-catalog work | high | Currently Daniel only loads global catalog; needs org-private equivalent |
| 8 | Brian | Check for newer NICE roles/responsibilities/tasks/skills/knowledge catalog version with Daniel | medium | Foundational role binding for Members & Roles tab |
| 9 | Clark | Update INTENT.md to reflect Requirements + Readiness as first-class tabs; mark Boards/Tasks pipeline as derivative | high | Tied to the meta-director session's pending INTENT.md updates |

## Open Questions

- Does the Org Profile blob carry the private requirements catalog inline, or does it need a separate `RequirementsCatalog` entity referenced from the blob? (Question for Kevin)
- How exactly do requirements link to tasks once both exist? Are tasks instantiated FROM requirements (template-style), or is there a separate link table? (The §2.8 Req↔Sat pair pattern partially answers this for the Engagement use case — but Brian's framing implies a broader catalog → assemble → instantiate pipeline.)
- Per-project vs. per-engagement vs. per-org readiness scope: how do rollups work across layers? Brian said "task readiness, layer readiness, engagement readiness" — UI mechanics TBD.
- Cross-project boundary visibility — where does that live? Inside Projects app, or inside a Boundaries-app drilldown showing "projects that touch this boundary"?
- Does SME Mart drill-down navigate INTO the platform projects-app, or render its own view? Defer until projects-app is in flight.

## Key Quotes

> "Readiness is nothing more than the measurement of requirements satisfied, not satisfied, partial. That's readiness." — Brian

> "Boundary is security. It is nothing but a security construct. Delete all things compliance relative to a boundary other than we are enforcing compliance via security." — Brian

> "I don't build a task until I define the requirements… I'm building the [task] template from a requirements workspace." — Brian

> "Requirements may [become] coming out [as its own app], for God's sakes… it may blow up to be that big." — Brian

> "This is an integer, an entire legal repository, in my opinion. I don't know how else it can be." — Brian (on the org-level requirements catalog)

## Implications for In-Flight Work

- **`.claude/plans/public/projects-app-mocks/INTENT.md`** — pending updates from the meta-director session need to be expanded to include Requirements + Readiness tabs and the Boundary-is-security-only reframe. The previously planned tab strip (`Overview · Boards · Tasks · Members · Roles · Documents · Activities`) likely becomes `Overview · Readiness · Requirements · Boards · Tasks · Members · Roles · Boundaries · Documents · Activities` — needs prioritization pass.
- **`zb/ui` Boundary surface area** — anything in the existing zb-ui-lib that surfaces "Standards" inside Boundary is a deletion candidate (or migration candidate) once Readiness is real.
- **SME Mart `OrgProfileItem` extension** — confirm shape with Kevin/Daniel before Clark adds requirement-catalog support in the org profile UI.
- **Backend asks consolidated list (12 items in restart_context)** — needs additions for: (a) org-level requirements catalog schema, (b) framework-link types, (c) readiness measurement endpoints, (d) NICE NIST catalog version refresh.

## Next Steps Offered

1. Update mockups to reflect Requirements + Readiness reframe (Clark)
2. Update INTENT.md with the structural shift (Clark)
3. Draft Slack message for Kevin summarizing the framework-link + org-catalog questions
4. Append backend-asks list with the 4 new items
5. Save this summary (done — this file)
