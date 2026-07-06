# Standup — Compliance = Commitment (not a Project) reframe

**Date:** 2026-07-03
**Time:** ~08:30 – 08:43 AM PT
**Source:** Teams
**Participants:** Kevin McCarthy, Clark Stacer
**Context:** Follow-on to Brian's steer that the boundary is the runtime control plane and the "promises" (compliance obligations) should live on the project/readiness side, not the boundary. BM×Projects compliance mock work.

## The core reframe

- **Where are the "promises" recorded — project or boundary?** Brian wants the promises NOT in the boundary; they live over in "these screens" (the project/readiness side).
- **An ongoing "readiness project" is not a project.** Kevin: what Brian calls a readiness project is really an **obligation / commitment / capability** — "something we've elected to do forever." It does not start and stop. Calling it a project is wrong.
  - Example: "We have an organizational **commitment** to be SOC 2 compliant."
- **The audit IS the project.** Under each commitment sit temporary, calendared **audit projects** — one per period (SOC 2 for 2024, SOC 2 for 2025). "Every year I get audited — that's a project, in service of that commitment."
- **Discharge: commitment writes the check, boundary cashes it.** The thing that satisfies a commitment is the **combination of project + boundary**. The commitment holds the requirements; each requirement is discharged by pointing it at the boundary (or by a default self-audit open/close task).
- **The commitment acts as a template.** SOC 2 = a commitment to ~50 controls. Each audit stands up a project carrying the evidence for those 50 controls for a given period — requirements are NOT redefined (already defined by the commitment); the audit project just collects the period's substantiating documents. That's where the **entangled 3PAO tasks** stand up.

## Model (agreed shape)

```
boundary  (forever — current runtime state)
   ^  discharge (per-requirement mapping: 1..N boundaries)
commitment  (forever — the ongoing objective; holds requirements; acts as a template)
   |  instantiates per period
audit project(s)  (temporary, calendared — "SOC 2 2024"; carries evidence + entangled 3PAO tasks)
```

## Multi-boundary — resolved (re: backlog 035)

Kevin: multi-boundary is **not** a structural "one lens views N boundaries." It's part of the **discharge mapping** — *how* a requirement of the commitment is satisfied is answered **per requirement**: a given requirement may be discharged against one boundary or several. "Do I handle this obligation in one boundary or multiple boundaries? — it's part of that same discharge mapping."

## Meta / process

- Kevin: **not a material change** — "different labels and lenses on what you're doing; it doesn't invalidate much of what you've done." Relabel readiness → commitment; keep audits as projects.
- Kevin on doing mocks before the data model: worth it — Brian is visual and needs to see it before he understands it; the mocks are driving buy-in and making the data model obvious. "If this is what makes the data model obvious to people, it's a successful process."
- Brian was "all in on the boundary is the control plane" today — a shift from his earlier "everything's in the project" stance.

## Decisions

1. The ongoing readiness thing is a **commitment** (obligation / capability), not a project — ongoing, no start/stop.
2. **Audit** = the temporal project underneath a commitment (per period; carries evidence + 3PAO entangled tasks).
3. Commitment **holds the requirements** and acts as a **template** that stands up audit projects.
4. Requirements are **discharged** to the boundary (commitment writes the check; boundary cashes it); default satisfaction = a self-audit open/close task.
5. **Multi-boundary = per-requirement discharge mapping** (1..N boundaries), not a lens-to-N-boundaries structure.

## Action items

- [ ] Clark: run the reframe through Claude, bounce against the project-role rename + tagType PR #8, plan changes (no changes yet — planning first).
- [ ] Decide whether **commitment** stays a Project (tagged as a commitment) or becomes its own entity — the key open modeling question for PR #8.
- [ ] Fold multi-boundary into the requirement discharge-mapping concept (updates backlog 035's framing).
