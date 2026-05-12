---
id: "030"
severity: medium
phase: 29.5
found: 2026-05-12
status: deferred
---

# Errata 030 — D-49 Namespace Drift: Code Uses Legacy `sme-mart.eng.*`, Live UAT Artifact Uses New `sme-mart.engagement.*`

**Date:** 2026-05-12 (Wave 4 checkpoint, Plan 06 SDK round-trip)
**Severity:** Medium (SME Mart correctness bug; blocks Phase 31 re-provisioning + UAT onboarding-guard go-live)
**Type:** Implementation drift from locked decision (D-49)
**Phase:** 29.5 (found); Phase 31 (target for fix)

## What happened

Plan 06's SDK round-trip on the live UAT engagement artifact surfaced a namespace mismatch between SME Mart code and the canonical D-49 namespace:

- **Live UAT artifact** (created by manual walkthrough 2026-05-12): tag `sme-mart.engagement.zerobias-to-w3geekery` (UUID `b39bf3eb-d8eb-4024-a610-80bcf39ddefa`) — NEW namespace per D-49.
- **SME Mart code** (`src/app/core/services/provisioner.service.ts` lines 84 + 167): probes and creates with the LEGACY pattern `` `sme-mart.eng.${PLATFORM_SUPPLY_SLUG}-to-${slug}` ``.

## Root cause

D-49 was filed 2026-05-12 (full-word `sme-mart.engagement.*` namespace, supersedes `sme-mart.eng.*` for NEW tags). The Plan 02 v3 amendment (commit `523e924`, 2026-05-12 EVE) was scoped to 5 surgical changes (drop Step F+G, flip Workspace→Project label, add tier tag, etc.). Namespace migration was correctly out-of-scope for v3 — the recipe still passes 14/14 specs, just on the wrong namespace.

## Impact

If `provisioner.service.isOrgProvisioned(W3Geekery)` runs on UAT today:
1. Probe issues `hydra.Tag.searchTags({ name: 'sme-mart.eng.zerobias-to-w3geekery' })`.
2. Tag does NOT exist (live tag is in `.engagement.` namespace).
3. Probe returns false.
4. Onboarding guard routes Clark to the holding page despite the org being provisioned.

This blocks:
- Phase 31 (W3Geekery as first customer + production smoke test).
- Any UAT-facing onboarding flow that depends on the provisioning check.

## Fix prescription

**Director call: Option (a) — probe BOTH namespaces, union the results.**

1. Update `provisioner.service.ts` constants + JSDoc:
   - Define `ENGAGEMENT_TAG_NAMESPACE_NEW = 'sme-mart.engagement.'`
   - Retain `ENGAGEMENT_TAG_NAMESPACE_LEGACY = 'sme-mart.eng.'` (read-only)
   - Tag creation uses `_NEW` exclusively going forward.
2. `isOrgProvisioned()` probes both namespaces; returns true if either matches.
3. No UUID-churn migration of legacy `sme-mart.eng.*` tags (forbidden by D-43 anti-pattern (d)). Legacy tags retain their existing names; their UUIDs remain stable; coexistence is the long-term steady state.
4. Tests cover both code paths (legacy-only org, new-only org, both-present org).

**Why Option (a):** Preserves D-43 UUID-stability guarantee for legacy artifacts. Cost is one extra MCP call per probe (acceptable; provisioning check runs once per session). Avoids the "are there legacy-namespace orgs anywhere?" audit that Option (b) requires.

**Empirical state at filing:** Zero "legacy-namespace + active-engagement" orgs exist on UAT — the legacy `sme-mart.eng.w3geekery-default-zb` tag (`a81cd320-...`) exists but is NOT linked to the current Engagement Project. So Option (b) would be viable today; (a) is chosen for forward-compatibility with CI / future migrations that may surface legacy orgs.

## Disposition

- **NOT a 29.5 hotfix.** Out of v3-amendment surgical scope. Specs pass at HEAD.
- **Filed as BACKLOG entry `D-49-NAMESPACE-MIGRATE-1`** in `.planning/BACKLOG.md`.
- **Hard prerequisite for Phase 31** — must land before re-provisioning exercise.
- Phase 31 plan must reference this errata in its CONTEXT.md.

## Related

- D-49 (engagement namespace, `sme-mart.engagement.*` full word; supersedes `sme-mart.eng.*` for NEW tags).
- D-43 (engagement tag namespace + classifier pattern; anti-pattern (d) forbids UUID-churn renames of legacy tags).
- Plan 06 SUMMARY § Observation 4 (empirical finding).
- BACKLOG entry: `D-49-NAMESPACE-MIGRATE-1` (Phase 31 prep).
