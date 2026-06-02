# SME Mart — Personas & User Stories

**Status:** v1 · 2026-06-01 · living doc · Director Parks
**Purpose:** The reference we check designs against. SME Mart is a two-sided marketplace for **buying and selling SME skills** in compliance/cybersecurity. Every feature should map to a persona's story here AND stay on SME Mart's side of the seam with the Platform Projects App. If a proposed feature maps to no story — or belongs to engagement *execution* (Projects App) — flag it at plan/design review.

---

## What SME Mart is (one line)

> **Canonical positioning (Brian 2026-06-01):** The **ZeroBias Transparency OS** is the world's first **deep real-time vetting solution** for sellers and buyers with the deepest security and compliance requirements on the planet — built into a **multi-party transparency platform** enabling deep secure sharing among parties, nations, and the secure ecosystem. **SME Mart is the marketplace + commerce layer of that OS.** Category = *deep real-time vetting*, not "a gig marketplace."

SME Mart is the **marketplace AND commerce engine** for ZeroBias-platform compliance work — "Upwork meets Whop," but **transparency-native**. It sells **transparency-driven apps, services, and agents**: offerings that are **fully integrated into the ZeroBias platform, secure, real-time transparent, and fully auditable** (full audit playback for all things). That integration + security + real-time transparency is *why* buyers come here rather than a generic marketplace — it's the store for **deep, real-time vendor risk management**, native to the platform.

> **Mental model (Brian 2026-06-01):** think *NATO-wartime secure apps + allied info-sharing* — locked-down, hardened, real-time, continuously hardened by lots of people, then shared among nations as fast and securely as possible. Orgs = nations; SMEs/providers = the hardeners; the marketplace + Transparency Center = the secure real-time sharing rail. The bar is **maximum-security, hardened, real-time, secure multi-party sharing** — not a generic gig/app store. (D-53)

**Two jobs:**
1. **Matchmaking** — orgs with compliance needs (**demand**) discover, evaluate, and engage SMEs/providers (**supply**).
2. **Commerce engine / App Store** — ALL commerce between parties (via the Transparency Center) runs through SME Mart, and ZeroBias takes a **cut (<5%) on all of it**. *Nothing escapes* — the Apple App Store / AWS Marketplace model. (Brian directives 2026-06-01; DECISIONS **D-53**.)

Vocabulary (per D-51): **provider** = supply side · **client** = demand side.

---

## The seam — what SME Mart owns vs hands off

| SME Mart owns (pre-engagement / matchmaking) | Platform Projects App owns (post-handoff) |
|---|---|
| Provider discovery + directory/search | Engagement detail, chrome, routes |
| Provider & org profiles (skills, frameworks, certs) | MSA / engagement-level legal / commercial baseline |
| RFP ("Request for Project") + Bid workflow | Project setup, SOW / license per project |
| Matchmaking search + fit evaluation | Boards / Tasks / Members / Roles |
| "Agree to engage" handoff trigger | Vetting / Requirements / Readiness / Boundaries |
| Reputation + reusable offerings catalog | Work execution + evidence + Crosswalk tracking |

**The work/UI split above is pre/post-handoff. Commerce is a SEPARATE axis that does NOT split that way:** ALL commerce — including engagements whose *work* runs in the Projects App, and the default-ZB engagement — transacts through the **SME Mart commerce engine** so ZeroBias takes its cut (D-53). Working model (Clark-confirmed 2026-06-01): **Projects App *authors* the deal (MSA / SOW / pricing); SME Mart *transacts* the money + takes the cut.** Still don't build engagement *work* surfaces (boards/tasks/vetting) in SME Mart — but commerce / checkout / billing IS SME Mart, for every engagement.

---

## Personas

### Demand side — buyers of SME skills

**P1 · Compliance Owner** *(Clark story 1)*
Org's compliance lead with a Continuous Compliance objective. Needs to find SMEs — auditors, agentic developers, consultants — to close specific compliance gaps. Comparison-shops on specialty, framework coverage, and trust.

**P2 · Delivery / Engineering Lead** *(Clark story 3)*
Owns delivery of a regulated project (e.g., a hospital monitoring device) that MUST be compliant, tracked against many frameworks at once. Hires a provider *company* to build it. Values that ZeroBias **Crosswalk** lets one piece of evidence satisfy requirements across a dozen frameworks.

**P3 · Org Admin / Procurement**
Turns "we picked a provider" into a real engagement — fires the handoff, owns the commercial relationship. Manages *many* engagements (different providers; or the same provider under different contract baselines).

### Supply side — sellers of SME skills

**P4 · Compliance Consultant / SME**
Independent expert selling advisory, gap assessment, remediation, framework expertise. Wants to be discoverable and win RFPs.

**P5 · Agentic Developer** *(Clark story 2)*
Developer with LLM/agent experience who builds agents to gather compliance evidence — one of many possible uses — on the ZeroBias platform / API / MCP. Sells both bespoke builds and reusable agent offerings.

**P6 · Auditor / 3PAO**
Third-party assessor offering attestation/audit in accredited specialties (clinical compliance, HL7 / clinical engineering, cyber HIPAA/NIST/SOC2, AI governance, ...). The "category #1" provider type.

**P7 · Provider / Vendor Company**
An *org-level* provider (not an individual) delivering products or services under compliance — the counterpart to P2's buy. Has its own org profile + team.

> **Roles, not fixed orgs.** One org can be both demand and supply — e.g., a consulting firm that *buys* agentic-dev skills and *sells* audit services. Personas are role-based.

### Platform actor

**ZeroBias** — the default provider. Every org has a baseline engagement with ZeroBias (org = client, ZeroBias = provider) for the platform service itself (the **invariant**, confirmed Brian 2026-06-01). All marketplace engagements are *additional* to this baseline.

---

## User stories

### Demand — buying SME skills
- **S1** (P1) As a compliance owner, I want to browse/search the marketplace for SMEs who solve my compliance needs — auditors, agentic developers, consultants — so I can close gaps against my Continuous Compliance objective.
- **S2** (P1) As a compliance owner, I want to compare provider profiles by specialty, framework coverage, certifications, and track record so I pick the right SME.
- **S3** (P1/P3) As a buyer, I want to post an RFP describing my need (frameworks, scope, timeline) so qualified providers bid.
- **S4** (P3) As a buyer, I want to evaluate bids and select a provider, then "agree to engage" so the relationship moves into a formal engagement. *[SME Mart fires the handoff; Projects App forms the engagement.]*
- **S5** (P1/P3) As a buyer, I want to engage *multiple* providers for one objective (e.g., a 3PAO for attestation + an agentic dev for evidence automation) so I assemble the right team.
- **S6** (P3) As a buyer, I want to re-engage a provider I trust under a *new* contract baseline so I reuse the relationship for a new scope. *[Many engagements per party-pair; each is its own engagement node.]*
- **S7** (P2) As a delivery lead hiring a vendor to build a regulated product, I want providers surfaced by the frameworks my project must satisfy — knowing Crosswalk lets one evidence satisfy many frameworks — so I find a vendor who delivers compliant-by-design. *[Matchmaking in SME Mart; multi-framework tracking executes in Projects App.]*
- **S15** (P1/P3) As a buyer, I want to buy an **app or agent directly** (buy-now, no RFP) so I can self-serve a packaged solution — confident it's platform-integrated, secure, and fully auditable. *[The App Store lane — D-53; needs a buy-now path distinct from RFP/bid.]*

### Supply — selling SME skills
- **S8** (P4/P6/P7) As a provider, I want to publish a profile advertising my skills, specialties, frameworks, and certifications so buyers discover me.
- **S9** (P5) As an agentic developer, I want to list reusable agent offerings (e.g., "SOC2 evidence-collector agent") so buyers can hire pre-built capabilities, not only bespoke work.
- **S10** (P6) As an auditor/3PAO, I want to declare accredited specialties so buyers seeking attestation in my domain find me.
- **S11** (P4/P5/P6) As a provider, I want to browse open RFPs and submit bids so I win work.
- **S12** (P4/P6/P7) As a provider, I want my completed engagements / reputation visible so I build marketplace trust.
- **S16** (P5/P7) As a provider, I want to list and sell **apps and agents** as packaged products (not only bespoke services) so buyers can buy them directly. *[The "Whop" / App Store half — D-53.]*
- **S17** (P4-P7) As a provider, I want to get paid through the marketplace when a buyer transacts — ZeroBias takes its cut — so all commerce runs on one rail. *[SME Mart commerce engine; <5% cut; "nothing escapes."]*
- **S18** (P6) As an assessor, I want to continuously, real-time assess the apps / agents / stacks in the marketplace so every offering is held to the highest scrutiny and buyers can trust what they buy. *[Continuous assessment is core marketplace infrastructure — D-53; the assessor corps is supply-side, not only buyer-hired.]*

### Engagement & relationship — the buy/sell outcome
- **S13** (all orgs) As any org, I have a default baseline engagement with ZeroBias (the platform provider) without doing anything — the invariant.
- **S14** (P1/P3) As a buyer, I want to see my **matchmaking pipeline** — open RFPs, bids I'm evaluating, providers I've shortlisted — so I can manage deals *up to the point the other party is locked*. SME Mart may render a simple table/cards for this **pre-handoff pipeline only**. **The moment matchmaking concludes and the other party is locked, the Platform Projects App is canonical** for the engagement portfolio — SME Mart does not duplicate it (zero duplication of effort).

---

## The buy -> sell -> engage lifecycle

```
DEMAND: browse / search / post RFP  --+
                                       +-->  bids  -->  evaluate  -->  select
SUPPLY: publish profile / bid  -------+                                  |
                                                                         v
                                              "parties agreed to engage"
                                                         |
                                                         |  == SME Mart handoff ==>
                                                         v
                          Platform Projects App: form engagement (MSA),
                          set up project(s), execute work, track compliance (Crosswalk)
```

---

## Scope guardrails (check against this)

- Feature about engagement *detail/execution* (boards, tasks, members, vetting, requirements, readiness, MSA/SOW authoring) -> **Projects App**, not SME Mart.
- Feature about discovery, profiles, RFP/bid, matchmaking, reputation, or the agree-to-engage handoff -> **SME Mart**.
- SME Mart never authors MSAs and never renders engagement work surfaces.
- The default-ZB engagement is an invariant baseline, not a marketplace transaction — its provisioning ownership is a pending Kevin/standup decision (may move to platform).
- **Every offering (app / service / agent) must be transparency-driven** — integrated into the ZB platform, secure, real-time transparent, fully auditable (audit playback). A non-integrated / non-transparent listing doesn't belong on SME Mart; that integration is the moat vs generic marketplaces (D-53 / Brian 2026-06-01).
- **Everything in the marketplace is continuously assessed** — real-time, deep, ongoing assessment ("most scrutiny ever," an army of assessors), NOT a one-time vetting gate. Marketplace entry AND standing = continuous assessment; the assessor corps is supply-side infrastructure. (D-53)
- **Commerce is SME Mart's even when work is the Projects App's.** If a feature is about transacting money / taking the cut / checkout / billing for ANY engagement -> SME Mart. If it's about authoring terms or executing work -> Projects App.

## Open questions (affect scope)

1. Provisioning of the default-ZB engagement — **platform will own it** (direction set 2026-06-01); mechanism details TBD (auto org-create hook / admin action / backfill). SME Mart's provisioner deprecates once platform ships. See `provisioner-refactor-governance-node-2026-05-29.md`.
2. **Resolved:** SME Mart shows only the **pre-handoff matchmaking pipeline** (open RFPs, bids, shortlist) as a simple table/cards; from the moment the other party is locked, the **Platform Projects App is canonical** for the engagement portfolio. Zero duplication.
3. **Resolved (Brian 2026-06-01, D-53):** the "Whop half" IS in scope — SME Mart sells services, apps, and agents and is the commerce engine taking a cut on all commerce. Remaining build: product *fulfillment/delivery* + licensing/entitlement (listing is ~80% there per the code finding; the transaction/delivery layer is the gap).
4. Reputation/track-record model (S12) — what the trust signal is. **Strong signal from Brian 2026-06-01** ("army of deep assessors," "most scrutiny ever"): trust is likely **continuous-assessment-driven** (real-time deep assessment of the app/stack), not subjective star-ratings. Lean assessment-driven; confirm with Brian. **Brian owns it.**
5. **Nav:** candidate split to **RFPs / Services / Products** (Clark 2026-06-01) — Products = apps + agents, Services = bespoke. Needs a product-vs-service discriminator on `ServiceOffering` (current model is generic; `pricing_type` already has `subscription`/`fixed`).
6. **Commerce-engine mechanics (D-53):** how the cut is collected, payment rails, the buy-now / checkout lane, and the exact authoring-vs-transacting boundary with the Projects App.
