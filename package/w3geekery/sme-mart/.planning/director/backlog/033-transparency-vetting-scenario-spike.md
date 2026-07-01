---
id: "033"
priority: high
scope: sme-mart (disposable scaffold) -> platform feature-requests -> Projects App (eventual)
effort: medium (spike) + ongoing (FR follow-through)
found: 2026-06-01
status: open
promoted_to: null
---

# Transparency / Vetting Scenario Spike — real W3Geekery <- ZeroBias entangled-task reference

## Goal (one sentence)

Stand up a **real, disposable reference engagement** (ZeroBias vetting W3Geekery) with both-sides hierarchy + a real demand->proof vetting flow, use SME Mart short-term to iterate the design fast, and let the friction it exposes drive **platform feature-request tasks** for the missing Transparency primitives — then rebuild canonically in the Projects App once the platform supports it.

This is a **design probe, not production**. The output is *learning + feature requests + a clickable scenario Brian can react to*, NOT keeper SME Mart execution UI. That framing is what avoids the duplication trap (we are not forking the Projects App's execution boards — we are building throwaway scaffolding to find the primitives).

## The scenario (concrete, as Clark specified 2026-06-01)

1. **New engagement:** **provider = W3Geekery, buyer = ZeroBias.** ZeroBias wants to *vet* W3Geekery for an upcoming project. (NOTE: this is a marketplace engagement, the reverse of the default-ZB invariant where org=buyer/ZB=provider. Here ZeroBias is the demand/buyer side raising vetting demands; W3Geekery is the supply/provider side providing proof. Demand->supply matches transparency-architecture §9.)
2. **Both-sides matching hierarchy** — set up the demand-side (ZeroBias) and supply-side (W3Geekery) project structure to mirror two real companies doing vetting work with each other.
3. **MVP board config — simplest first:** **one board for all Vetting asks.** Do not over-structure; start with a single Vetting board and grow only if the scenario demands it.
4. **Real Req<>Sat pairs** — create demand-side Requirement tasks <> supply-side Satisfaction tasks. **Interim mechanism allowed:** if `satisfies` / `satisfiedBy` link types are not available on UAT, use **org tags** to pair them in the interim (verify link-type availability first — see deps).
5. **Then observe what Tasks need on each side** — specifically, **what new platform primitive a `TaskTransparency` opt-in value would be.** What does controlled per-task disclosure actually look like? (Zero default visibility, explicit publication — transparency-architecture §9.2 opt-in publication is [PLANNED]; this spike is how we discover its concrete shape.)
6. **Iterate in SME Mart short-term**, capturing every gap.
7. **Propose platform changes** via feature-request tasks (the gaps from step 5 become FRs — e.g. TaskTransparency opt-in field, satisfies/satisfiedBy if missing, Requirement/Assessment/Record entities).
8. **Once platform supports it -> build out canonically in the Projects App** (execution surface belongs there per D-52/D-53; SME Mart keeps only the pre-engagement trust *signal*).

## Why this is the right shape

- Brian has been pushing to **expose the Transparency Center** so the team can iterate on design and surface gaps. A real entangled-task scenario is the fastest way to expose those gaps with something clickable.
- It exercises the **[PLANNED]** parts of the platform (Requirement/Assessment/Record, opt-in publication, TaskTransparency) empirically instead of on paper — turning "what's the design?" into concrete FR tasks.
- It stays on the correct side of the seam at steady state: **execution + live disclosure -> Projects App; pre-engagement trust signal -> SME Mart.** SME Mart is only the short-term iteration harness here.
- Disposable scaffolding sidesteps the migration-debt concern that PAUSED Joe/Luis/Dan provisioning — we are deliberately NOT minting production-structure trees.

## Platform-gap output (the actual deliverable)

Feature-request tasks for the primitives the scenario proves are missing. Expected candidates:
- **`TaskTransparency` opt-in** — per-task controlled-disclosure value(s). The headline unknown this spike exists to define.
- **`satisfies` / `satisfiedBy`** entangled link types — verify existence on UAT; FR if absent (interim = org tags).
- **Requirement / Assessment / Record** entities ([PLANNED], transparency-architecture §10.1) — what subset the vetting flow actually needs first.
- Opt-in **publication granularity** (tier / tag-view / whole-project — §9.2).

## Dependencies / caveats

- **Structure is `governs`-gated.** The canonical governance-node structure (Program root + Engagement node + `governs` ResourceLink) depends on the `governs` link-type id from umd/Nic (RL-001 / task-13), still FILED-not-delivered. For a *disposable scaffold* this is fine — use whatever structure is expedient (simple nested projects / org tags) and flag it as throwaway. Do NOT treat scaffold structure as the production recipe.
- **Provisioning ownership is moving to platform** (Brian/Kevin direction, 2026-06-01) — another reason not to harden the scaffold's structure.
- **Verify link-type + entity availability live (MCP) before building** — satisfies/satisfiedBy, any TaskTransparency field. LOOK FIRST; the [PLANNED] tags in transparency-architecture mean several pieces are not callable yet.
- MCP profile: scenario writes need a UAT profile (e.g. uat-cstacer) with admin in both ZeroBias and W3Geekery scopes. cstacer admin status in the ZeroBias org scope is unverified for this direction — check before building.

## Cross-references

- [[BACKLOG-108]] — vetting (this spike is the concrete, real-data evolution of it; R4 = vetting-on-Engagement-node)
- DECISIONS **D-52** (governance-node model) + **D-53** (deep-real-time-vetting is central; commerce three-way split; Ledger owns money)
- `.planning/docs/PERSONAS.md` — S18 (continuous assessment as core infra), S12 (trust signal), P6 (assessor corps)
- zb-dx `architecture/transparency-architecture.md` §8 (entangled Req<>Sat pair), §9 (Transparency Center scenario), §10 (Requirement/Assessment/Record [PLANNED])
- memex: *Transparency Center — controlled multi-party disclosure layer*; *SME Mart core transparency invariant — task entanglement is the only data seam*
- `.planning/director/backlog/027` — personnel-level vetting (adjacent; the *content* of vetting demands)
- BACKLOG-095 (zb/ui) — three-app convergence sync (Joe/Dan/Clark) — the forum for shared Transparency-Center chrome

## The routing question this sits behind

Whether to START this spike now vs. start the matchmaking/origination end (onboarding -> Org Profile -> RFP -> matchmaking) is a **Brian product-priority call** (drafted for Clark to ask, 2026-06-01). This item is ready to promote into a milestone the moment Brian says "transparency end first." If he says "matchmaking end first," this stays parked as the next-up spike.
