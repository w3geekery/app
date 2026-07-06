# Marketplace Meeting — Projects App Nav + Requirements Architecture

**Date:** 2026-05-29
**Source:** Teams
**Participants:** Brian Hierholzer (CEO), Clark Stacer (contractor)
**Refs:** Joe, Dan/Daniel (Readiness), Raghu, Kevin (CIO), Chris (platform), Tom (dev)

## Topics

### Demand / urgency
- Everyone (Joe, Dan, Raghu) is "begging for" the Projects app — even a picture/screenshot helps right now. Brian: "this next month is vital... you're the intersection."
- Floated giving Joe + Raghu **dev access just to view/reference** the app early (not code against it). Clark to raise unlocking them with **Kevin**; in the meantime Clark can send screenshots.

### Clark's current work (5/29)
- Adding the **Projects app navigation into the platform repo** — wires up the skeleton's tabs (Readiness, Requirements, Boards, Tasks, Members, Roles).
- Once nav lands, **Tom** and Clark can split the remaining work → unblocks Tom, speeds delivery.
- Brian wants ~7 **use-case scenarios** modeled (e.g., an audit between two parties with 4 auditors — how it maps to project/sub-project, labeling).

### Requirements architecture (core discussion)
- **Org-level requirements catalog:** load private requirements, categorize freely (legal, finance, compliance, cyber...). Builds on Daniel's context-loading work + Chris's custom-artifact-types-per-org unlock.
- **Catalogs -> project:** pull requirements from a **public catalog** (laws, executive orders, compliance frameworks, crosswalks) or a **private/org catalog** into the project's Requirements tab via resource links; a project can relate to any number of frameworks.
- **Requirements ARE tasks; subtasks are the granular rules/checks.** Examples:
  - MSA = task; each section/clause = a subtask requirement + assessment.
  - Docker container = task (e.g. a STIG); subtasks = each config rule. Assessor side: "assess container instance UUID against DISA STIG," subtasks = every check.
  - Budget: aggregate task ($1,000 total) + subtask thresholds ($200 each across 15 products) -> alerts on spend-threshold breaches.
- **Frameworks** likely uploaded by orgs via **GitHub PRs**, then selectable at project level ("browse frameworks / add framework to project").
- **Readiness = the measurement layer:** a dashboard roll-up aggregating requirement status layer-by-layer ("inception"), rolling up into transparency between parties. "One big requirements tree" — same fractal pattern with aggregation layers.

### Logistics
- Teams transcript: Clark can view + copy/paste it (can't download). Brian tried to make Clark co-organizer for download access — couldn't locate the setting, deferred.
- Business: tight on cash but a good month; Brian aiming to unlock funds early next week. Clark noted he needs to get caught up and submit invoices.

## Action items
- **Clark:** finish Projects-app nav in platform repo (unblocks Tom).
- **Clark:** raise unlocking Joe + Raghu for view-only dev access with Kevin; send screenshots meanwhile.
- **Clark:** model ~7 use-case scenarios against the project/sub-project structure.
- **Brian:** sort out transcript download permissions (co-organizer) later; pursue funding early next week.
