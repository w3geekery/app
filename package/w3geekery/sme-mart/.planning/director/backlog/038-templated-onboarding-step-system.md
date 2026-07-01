---
id: "038"
priority: high
scope: sme-mart onboarding -> reusable template system across ZB apps/services/sellers
effort: large (multi-phase; spans onboarding UX + a template/config engine)
found: 2026-06-22
status: open
promoted_to: null
related: ["036", "037", "GUILD-ELIGIBILITY-CLASSIFICATION-1", "BACKLOG-123"]
---

# Templated Onboarding Step System (pilot ~30 steps / production ~50 steps, reusable)

## Goal (one sentence)

Build a **templated, multi-step onboarding system** — a configurable sequence of steps (pilot: ~1-30, production: ~1-50) — that drives a new org/seller from first login through full activation, and is **reusable as a template** so other ZB apps / services / requirements can run the same engine for their own onboarding.

## Brian directive (2026-06-22, verbatim intent)

> "Will want some sort of onboard steps 1-30 etc for pilot and then steps 1-50 for 'production' onboarding and make this a template system so others can use the same thing for their apps/services/requirement as sellers. Legal, banking, d&b, etc etc."

Context: Brian gave this right after confirming (a) pilot T&C accepted at **first login** (not form), and (b) the team is adopting the SME Mart **project structure / pillars** as a major structural deliverable. Onboarding rides on those pillars.

## What it implies

- **A step-engine, not a hardcoded wizard.** Steps are data/config (ordered, typed, gated, skippable/required, role-scoped), so a "pilot" template = ~30 steps and a "production" template = ~50 steps are two configurations of the same engine. Other apps/services define their own step set.
- **Step categories seen so far:** legal (Pilot Ts&Cs accept — step 1, see `pilot-terms-and-conditions-boilerplate-2026-06-22.md`), **banking** (payout/billing setup), **D&B** (Dun & Bradstreet org verification), plus the eligibility/classification capture (the contact-us form / 036 feeds the pre-step), profile completion, framework adoption, etc.
- **Seller-oriented:** "as sellers" — the template covers the provider/seller activation path (KYC-style: legal + banking + business verification), not just buyer onboarding.
- **Template reuse** is the architectural ask — this is a platform-shaped capability, likely a candidate for a backend/platform feature request once the SME Mart instance proves the pattern.

## Connections (do not design in isolation)

- **First-login T&C accept** — `pilot-terms-and-conditions-boilerplate-2026-06-22.md` (step 1 of pilot onboarding).
- **Default-engagement onboarding** — `default-engagement-onboarding-backend-requirements-2026-06-02.md`, `default-engagement-onboarding-flow.html` (the "Classify" layer + auto-engagement).
- **Guild/Foundation eligibility classification** — the contact-us form (036) captures the eligibility signals; classification is an onboarding step. `GUILD-ELIGIBILITY-CLASSIFICATION-1`.
- **Profile/classification consolidation** — `profile-classification-consolidation-brief-2026-06-02.md`, D-54 (typed OrgProfile + credential classes are what onboarding populates).
- **Requirements architecture** — `requirements-architecture-2026-05-27-pending-kevin.md` (BACKLOG-123); "requirement" as a seller-onboarding template element matches Brian's "…/requirement as sellers."
- **Project structure / pillars** — Brian: the team is jumping into the project structure; onboarding steps hang off those pillars.

## Open questions (for discuss-phase)

1. Step-engine carrier: platform-native (Tasks/Workflow on a Project) vs SME-Mart schema vs a config doc? (RDF-compass check applies.)
2. What's the real pilot step list (enumerate the ~30) vs the production ~50 delta?
3. Banking (payout) + D&B verification — which integrations/providers, and are they platform features or SME-Mart-side?
4. Template definition format + how another app instantiates it (the "reusable" mechanism).
5. Buyer vs seller onboarding — one template engine, two configs, or separate?

## Next action

Director scoping pass once the pilot is moving — enumerate the pilot step list with Brian, decide the step-engine carrier (RDF-compass), and identify which steps are platform feature-requests (banking, D&B) vs SME-Mart UI. Likely a dedicated milestone, not a single phase.
