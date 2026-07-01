---
id: "039"
priority: high
scope: sme-mart vetting track -> per-individual inventory + full vetting + task-capability matching, designed as a cross-app shareable substrate
effort: large (multi-phase; spans schema, vetting pipeline, capability-matching, and cross-app ontology alignment)
found: 2026-06-23
status: open
promoted_to: null
related: ["033", "035", "BACKLOG-123", "AUDITCROWD-CONTEXT", "RDF-COMPASS"]
---

# Individual Inventory + Full Vetting -> Task-Capability Matching (AuditCrowd-shareable substrate)

## Goal (one sentence)

Within an org, inventory **all individuals** and run **full per-person vetting** (gov ID validation, certificates, background checks, credentials) so we know which individuals meet **task-level roles / responsibilities / skills / knowledge (certifications)** — modeled as a clean, ontology-aligned substrate that a sibling app (AuditCrowd) can build on.

## Brian directive (2026-06-23, verbatim intent)

> "Within an org we get to individuals, gov ID validation, certificates (auditor etc), background checks etc etc. So we are always going to go inventory all people and do full vetting on those people so that we know if those individuals meet task level roles/responsibilities/tasks/skills/knowledge (certifications etc) but we will go farther and list their 'assessor logic' they have published into private or guild catalog."

## What it is (5-layer stack, bottom-up)

1. **Individual inventory** — enumerate every person in an org (org = container of vetted individuals). Seed: `Personnel` (org-scoped, has `userId`, `title`, `specialization`, `isKeyPersonnel`, `backgroundCheckStatus`, `verified`/`verificationSource`).
2. **Per-individual full vetting** — gov ID validation (NEW), certificates/auditor creds (`UserCredential`/`SecurityCredential`), background checks (`Personnel.backgroundCheckStatus`), each with verification provenance.
3. **Task-capability matching** — vet people against platform `Task` roles/skills/knowledge/cert requirements (RACI-grade, per person). Today expertise is ORG-scoped (D-54 `ProviderSkill`→`orgId`); this needs a per-person capability layer the org's claimed capability is backed by.
4. **Assessor logic catalog (private / guild)** — individuals publish reusable "assessor logic" into a private or guild catalog. "Guild" is a NEW construct; "assessor logic" definition still loose (automated assessment rules/content the person authors — needs scoping).
5. **AuditCrowd competitive layer** — gaming / earnings / logic-leader leaderboards over the above. **NOT built here** — that's the sibling app (see [[AUDITCROWD-CONTEXT]]).

## Architectural framing (why this is load-bearing)

- This extends SME Mart's existing **Holon / task-entanglement transparency model down to the individual level** (the model Clark authored in `transparency-architecture-handoff-2026-05-22`, zb-dx — the canonical architecture serving SME Mart + AuditCrowd + Readiness Center + Work Worlds).
- It is the **shared substrate** AuditCrowd consumes to rank assessors. So it must be modeled as a clean, ontology-aligned, shareable node/edge graph — **RDF-COMPASS is the design gate** (this is now a cross-app contract, not SME-Mart hygiene). Aligns with Joe Llamas's Holon-Hologram ontology + Brian Ruf's OSCAL/Zachman layer.

## Gating decision (resolve before planning)

**Who owns the individual-vetting graph?** — platform-level (most reusable; fits "individuals as `Party.Person`"), SME-Mart-owned (we produce, AuditCrowd consumes), or AuditCrowd-owned (they own assessors, we read back). Undecided since AuditCrowd just started. Cross-app call for the Joe/Dan/Clark/Brian group, NOT a unilateral SME Mart decision.

## Open scoping questions

- Define "assessor logic" precisely (publishable IP vs. just credentials) and the private-vs-guild catalog mechanics.
- Gov ID validation: which provider/integration, what evidence is stored.
- Per-person capability layer shape (a `PersonnelSkill`-style class? or hang off `Party.Person`?) vs. the existing org-scoped `ProviderSkill`.
- How org-level claimed capability derives from / is backed by its vetted individuals.

## NOT in v1.5

Phase 33 stays **org-level**. This is a future SME Mart milestone (a dedicated Vetting milestone). The seam already exists (`Personnel.userId`) so org-scoping does not corner us — but the v1.5 model must leave clean room to hang per-person vetting/capability/assessor-logic off `Personnel` / `Party.Person` later (compass check at Phase 33 design review).
