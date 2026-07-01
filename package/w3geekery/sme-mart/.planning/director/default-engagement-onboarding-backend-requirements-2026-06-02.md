# Default Engagement + Onboarding — Backend Requirements

**Date:** 2026-06-02 · **Author:** Director Parks
**Status:** DRAFT — requirements-capture to unlock backend ownership
**Source:** Brian/Clark Slack 2026-06-02 (verbatim at bottom) + existing SME Mart provisioner + D-52/D-53.

---

## Why this doc exists

Backend has **agreed to take ownership** of minting the default "ZeroBias-providing-service-to-customer" Engagement + Project + Board + onboarding Tasks. The blocker has never been capability — the backend infra is mostly already built (Clark's assessment; the activity registry below confirms it). The blocker is the **long-standing ZeroBias comms gap**: requirements get discussed and then **not captured**, so backend has nothing concrete to build against and the work stalls.

This doc breaks that pattern. It converts Brian's chat into (1) a **usable requirements shape**, (2) a **plain-English question list to steer Brian through the unknowns**, and (3) a **backend feature-request list** that slots into the existing zb/ui FR tracker so it can be filed as ZB Tasks and actually worked.

**Lane note:** this is *not* a SME Mart build. The default ZB→customer engagement is the **platform's own customer onboarding** (provider = ZeroBias core platform; buyer = customer org). SME Mart originates *marketplace* engagements (SME→customer); this is upstream of that. Director captures the requirements because Director holds the Brian context and is the one positioned to unblock backend. Ownership lanes are marked per-item below.

**Companion visual:** `default-engagement-onboarding-flow.html` (this directory) — Brian-facing explainer of the whole flow with diagrams.

---

# PART 0 — THE END-TO-END FLOW (context, Clark 2026-06-02)

The provisioning op doesn't stand alone — it's step 5 of an 8-step customer-acquisition flow. Steps 1–4 are the **existing ZeroBias invite mechanism** (documented in zb/ui `.claude/diagrams/INVITE_MECHANISM_EXPLAINED.html`; mirrored to memex):

1. Prospect navigates to `https://zerobias.com/contact-us/` and fills out the **Lead form**.
2. Form submits to **Zoho CRM** as a **Lead**.
3. A ZeroBias employee reviews the lead; if it looks good, **approves** → triggers an **email invitation link**.
4. Prospect clicks the invite → platform **login + OAuth sign-in**. *(EULA is accepted here today via Dana `acceptDocument(eulaId)` — IP/UA/principal recorded.)*
5. **Backend provisions the Org record** for the prospect's organization *(black box from Clark's perspective — this is what we're defining)*.
6. (Invite-system details live in the zb/ui doc above — mirrored to memex.)
7. **On step 5, Engagement + Project init should happen** and the initial onboarding **Tasks should be materialized in their onboarding Task Board.**
8. The customer may **only** have access to **Projects App > Engagements > their engagement**, where they access onboarding tasks. **Each completed task unlocks more features.**

**Where this lives in the existing machinery:** the invite is an `app.organization_invitation` row with lifecycle **New → Sent → Approved → Accepted** and a `crm_record_id` (Zoho lead). When the org is created, `invited_org_id` is set. A `base.PlatformAdminProvisioning` event + `PlatformAdminProvisioningHandler` already exists — **the OB-001 provisioning op should hook there** (org-created/accepted), rather than inventing a new trigger. (This informs Q-B.)

**Scope clarity (Clark):** "Step 5 is all of the stuff we're trying to define." Steps 1–4 and the org-record creation itself are existing/backend-owned black box; our requirements job is **what gets created at step 5 and the gate/unlock behavior that follows.**

### Broadcast to team (Brian, Kevin, Chris, Nic) — 2026-06-02

Clark sent the MVP starting-point to the team as a low-friction free-for-all (replies to be processed into the next-round questions). **Additions in the sent version, beyond this brief — fold responses against these:**

- **Step 0 adds a "Public Anonymous Catalog mini-site (TBD)"** — anonymous/pre-signup catalog browsing is the one thing visible before login; everything else locked. New surface to scope (entitlement layer has an *anonymous* tier, not just non-paying/paying).
- **Open Q (architecture) — which tier OWNS the onboarding tasks:** the Engagement node itself, or a separate Project that is `governedBy` the Engagement? Ties to D-52. Director's lean: **tasks live on the governed Project's Board; the Engagement is the nav anchor + commercial seam** — confirm with team.
- **Open Q (governance) — who may assert Org Profile details:** every employee, or an isAdmin check? **Pre-existing locked answer (D-54): Organization Admin only; members read-only.** Not a blank — if the team lands elsewhere it's a change to flag.
- Step 5 (payment) unlock target = open (`-> unlocks ?`); Step 6 (contributor / Foundation Labs) = TBD/later.
- Proposed unlock mapping in the sent version (Clark's, for the team to react to): **MSA -> Catalog + Governance + Projects + Learning Center**; **Guild Membership -> ZeroBias Foundation**.

### Brian reply 2026-06-02 PM — custom-frameworks ("Requirements") engine (partial; full reply tomorrow)

**CONTEXT (Clark, post-reply) — what Brian means by "Requirements":** customer **custom frameworks** — bespoke Controls / Requirements / Frameworks (e.g. "Customer B Bespoke Framework") loaded alongside ZeroBias's existing **Catalog** frameworks (SOC2, NIST, …). This is a **Content-team capability (Daniel)** — a **new repo in the `zerobias-org` namespace** for customers to upload their own frameworks, same content format as existing frameworks/maturity models. The legal docs (MSA/EULA) are just artifacts loaded in that same system. Brian wants it wired into onboarding, but it's large net-new scope. **Clark moved it to a dedicated `#custom_requirements` channel (Daniel, Kevin, Brian) to keep the onboarding-MVP thread tight.** It is **OUT of onboarding MVP** except the single seam noted below.

**The only onboarding↔custom-frameworks seam to TRACK** (so onboarding isn't silently blocked): how a loaded requirement/framework artifact becomes an onboarding **Req<>Sat** task. For MVP we bypass it — see "cheat and load" below.

Brian's reply reframes the **Req** side of onboarding and surfaces parallel tracks.

**THE REFRAME (on-topic, load-bearing): the org-level "Requirements Catalog" IS the source of our onboarding gates.** The legal agreements that gate onboarding (EULA / MSA / Guild / license) are "legal requirements loaded at the org level." Brian wants an **engine to load requirements by type — legal first — into an org-level Catalog / requirements.** That engine:
- Produces the **Req** side of our Req<>Sat onboarding gates. **OB-004 reframed:** agreements come *from* the requirements catalog, not invented per-gate.
- **Generalizes to the marketplace:** the SAME engine lets customers load THEIR OWN requirements for the apps / services / agents they publish (D-53 offering types) into their programs / engagements / projects. "Build the engine, use the engine, let others use the engine to publish."
- **MVP = whole documents** (a PDF/doc artifact + a type), not structured parsing. Brian: "same format as our Frameworks / maturity models."
- Ownership (Brian's assumption): **Daniel = artifact types, Chris = publishing rules.** Brian to provide **5 legal samples** (MSA, EULA, license…).

**MVP de-risk — Brian's own shortcut: "we can cheat and load for us."** Onboarding MVP need NOT block on the general engine — hardcode/manually load ZeroBias's own legal requirements for the default engagement; the general requirements-loading engine runs in **parallel** (Daniel/Chris). This keeps onboarding MVP unblocked.

**Parallel / backlog tracks (OUT of onboarding MVP scope — TRACK, don't build now):**
- **Custom-frameworks / org-requirements engine = ALREADY [[BACKLOG-123]]** ("Project-scoped Requirements feature — 3-class schema + org library + project targeting", DEFERRED PENDING KEVIN since 2026-05-27; full capture `.planning/notes/requirements-architecture-2026-05-27-pending-kevin.md`). That doc already scopes the org-level catalog/library **including custom/private framework upload + MSA-specific/contract-bound rules** + the provider-publishing generalization. **Brian's 2026-06-02 message RE-SURFACES BACKLOG-123** and partially answers its deferred open-question (b): custom-framework storage = **a new `zerobias-org` Content repo (Daniel)**, NOT an MPI extension; sequencing = **legal-first**; venue = the new `#custom_requirements` channel (Kevin now in it = the alignment that 123 was waiting on). **Action: don't file new — un-defer 123 in `#custom_requirements`.**
- **Offering taxonomy** — apps / services / agents + **forward-deployed-engineering = "services."** Ties to D-53 / PERSONAS. **[backlog candidate]**
- **Pricing plans / subscription models** as org-level requirement *types* (same engine, later than legal). Onboarding's payment gate (step 5) is the MVP touchpoint; full modeling is backlog. **[backlog candidate]**
- **Storage billing — ~$0.20/GB** metered for all users (+ a platform fee). Ledger/billing territory (D-53: Ledger transacts). **[backlog candidate]**
- **Referral / partner tracking** — referrers / referral-link senders earn a cut of end-customer spend (affiliate model). Ledger/commercial; net-new. **[backlog candidate]**

**Status:** captured here; not promoted to formal backlog files yet (Brian said he'll "start to model all the ingredients" — fuller reply tomorrow). Promote after that lands. Probing questions staged for Brian (relay block in session).

### Brian/Kevin thread 2026-06-02 PM → 06-03 AM — MVP STRUCTURE LOCKED (in progress; Brian still adding)

Clark moved requirements-engine talk to `#custom_requirements` and held the onboarding thread to MVP. Brian confirmed **onboarding is NOT blocked** — "those custom requirements / legal & policies have been sitting waiting for Daniel… run in parallel by Daniel and Chris." Then the structure got locked:

**LOCKED — MVP onboarding structure (Brian 7:04 PM + 9:26–9:32 AM):**
- For **all platform + Guild-eligible orgs**: a **Default platform Engagement** → Project **"Zerobias Platform"** (Brian shorthand "ZB Platform") → **sub-project "onboarding"** → list of tasks.
- **MVP legal handling — embed terms IN THE TASK.** "Imbed all legal tasks/requirements INTO THE TASK and allow the TASK TO ACCEPT terms: SIGN/accept… accept legal terms IN THE TASK ITSELF." **→ No requirements-catalog dependency for MVP.** The Req<>Sat wiring seam is bypassed: the onboarding task carries the terms and the accept action. (OB-004 reframed for MVP: terms-in-task now; catalog-sourced later via [[BACKLOG-123]].)
- **Engagement = company-to-company**, "all things required to do biz" — BEFORE platform apps/features/subscriptions. The do-business gate is composed of **requirement TYPES** (Brian 9:47, answering Clark's "Policies a type? Are there other types?"): **budget, background check, DUNS score, MSA, policies, certifications** (+ banking, from the earlier list). **Framing:** these are *requirement types* (→ the catalog, [[BACKLOG-123]]), the company-to-company subset of which gates at the Engagement level. Several go beyond legal-accept — they're data-collection (provide DUNS, run background check, declare budget, list certifications). **Open for MVP:** collect all of these, or only the legal-accept subset (MSA/EULA in-task) with the rest as fuller onboarding? (Certifications cross-links [[BACKLOG-090]] Seller Credentials Catalog.)
- **Projects (under the Engagement) = apps / services / agents offerings**, each with own pricing / subscription / hourly model. **Sub-projects = individual apps** (app a, app b). "Project is loose by design."
- **Progressive unlock:** partial data at Engagement unlocks Projects; deeper Project unlock may require more at the Engagement; same pattern at Project level (app subscription tiers).

**RESOLVED — task ownership (the diagram's OPEN DECISION).** Onboarding tasks live on a Board in the **"onboarding" sub-Project** (a Project governed by / under the Engagement), **NOT on the Engagement node directly.** Confirmed split (Clark 9:31, Brian agreed): **Engagement-level boards = org<>org specific; Delivery-Project boards = the apps/services/agents offerings, governed by the Engagement.**

**Guild membership model (Brian 7:04 + 7:55):**
- **Default FREE membership** → land in a **Guild Default Project LIST**; browse + opt into projects **with no gate**.
- Project **functions are LIMITED** (secondary objective).
- **Pay Guild membership fee (by company size)** → unlock more features.
- **Connector library is gated** (in their normal-org Platform project) until membership paid; **further connector usage/logic unlocks once CONTRIBUTOR** (contribute a connector/logic/alerts).
- **Membership tiers** keyed on company size / users / API consumption / storage (Brian detailing this week).

**API as a gate (Brian 7:37):** "No API is a good gating mechanism… until paying member or paying non-guild member." API access is itself a paywall.

**Kevin's challenge + resolution.** Kevin (7:13, 10:24): is there even an *initial* Engagement? — if an Engagement reflects a contract and there's no value-prop/contract basis yet, "there is no basis for one." Brian (7:37): no value prop deliverable to auditor/advisory yet; paywalls pulled in later when value is conveyable; platform "too raw"; likely a platform fee but can't justify it yet. **Resolution:** keep the Engagement as the company-to-company "do business" container (the onboarding sub-project lives under it); it exists BEFORE apps. (Engagement-as-contract vs Engagement-as-onboarding-container tension — watch; Kevin may want the term tightened.)

**CONCRETE ACTION agreed (Clark 9:22–9:23, Brian "yes!"):** stand up **one model Engagement — W3Geekery <> ZeroBias** — by hand via MCP (the "Zerobias Platform" project + "onboarding" sub-project + the tasks), use it as the **reference model for backend automation**. This is unblocked, in our lane (prod-zb MCP), and is the natural next build step.

**Referral / Channel (Brian 9:35–9:37):** "who refers each org to platform" = a **separate binding** (referring partner) — bindable at registration origin or post-registration assignment. → tracked in [[BACKLOG-124]].

**Other:** ZeroBias has its own SCIM (no WorkOS needed). Requirements catalog gets monetized once loadable well (→ 123).

**Status:** Brian still adding to the thread. Holding the polished next-round question set until it settles; capture above is current.

### Firmed two-entity shape (2026-06-03, converged with Clark) — CANONICAL

**Discriminator — Project vs Board vs Task:**
- **Project** = a thing with its own identity + commercial lifecycle — an offering (app/service/agent) with own pricing/subscription/provider, or a genuine workspace tier.
- **Board** = a lane of work / comms / checklist *within* a Project.
- **Task (REQ/SAT)** = a single requirement or action.
- Rule: an unlock *action* = **Board + REQ-task**; a thing *being unlocked* = a **child Project** only if it has its own commercial lifecycle.

**The two entities + the divide:**

| **Engagement** (governance / org<>org — "can we do business") | **Zerobias Platform** Project (the offering we provide) |
|---|---|
| Sign MSA · company profile · banking · budget · DUNS · background check · policies · certifications | Accept EULA · feature unlocks (Catalog / Governance / Projects / Learning) · connector library · Guild membership + tier |
| = establish the business relationship | = access the platform offering and its features |

**Engagement REQs are BEFORE / GATE the Delivery Project (Brian 9:29; confirmed Clark 2026-06-03).** Engagement-level requirements must be satisfied before the Delivery Project / app access unlocks. **Not strictly all-or-nothing — progressive/layered:** partial Engagement data unlocks *basic* Project access; deeper/higher Project (and per-app subscription) unlocks may require *more* Engagement REQs; the same gate-pattern recurses at Project level (app subscription tiers).

**Implication — cross-entity gate dependencies:** a Project-level unlock REQ is **`blocked_by`** the relevant Engagement-level REQs (task blocked_by/blocks links). The unlock flow is a dependency graph: **Engagement REQs → unlock Delivery Project → Project REQs → unlock features/apps.**

**Structure:**
```
Engagement  "W3Geekery <> ZeroBias"        platform.Project, role=engagement, ownerId=W3Geekery
   Board "Business Onboarding"  -> REQ-tasks: MSA · company profile · banking · DUNS · background · policies · certs
   Board "Support"              -> org<>org comms (bugs/features)
        |  governs (stub until RL-001)        [Engagement may govern MANY offering-Projects]
        v
Project  "Zerobias Platform"               the offering ZeroBias provides (default; siblings = future ZB offerings)
   Board "Platform Access"      -> REQ-tasks: EULA · unlock Catalog/Governance/Projects/Learning · connector access · Guild tier
        (Project-level REQs blocked_by the Engagement REQs above)
        (child Projects later, only for distinct offerings with their own lifecycle)
```

- **Engagement can govern MANY offering-Projects** — "Zerobias Platform" is the default; future ZB offerings (advisory services, agents) are sibling governed Projects. The Engagement's own governance content = boards+tasks on the Engagement node, **not** separate projects.
- **Delivery-Project unlock actions = boards + REQ-tasks**; child Projects only for distinct offerings.

**CONFIRMED by Brian 2026-06-03 (thumbs-up):** onboarding = **boards split across the Engagement (business) and the Zerobias Platform Delivery Project (access)** + cross-entity gate dependencies — **NOT** a single "onboarding" sub-project holding everything. (Refined his 7:04 literal; he approved the split.) → next step: build the W3Geekery <> ZeroBias model with this two-board split.

### Cross-org mirroring + the SEAM (CANONICAL — Clark ruling 2026-06-03)

**Both orgs hold their OWN Engagement + Projects with mirrored structure — there is NO shared node.** ZeroBias enters an Engagement with Bob's Org; ZeroBias has its `ZeroBias <> Bob's Org` Engagement+Project tree, and Bob's Org has its mirrored `Bob's Org <> ZeroBias` Engagement+Project tree. Each side owns, governs, and sees its own structure (party-scoped). This resolves **Q-ENG-1: two mirrored nodes, not one shared resource.**

**The ONLY cross-org connection is a Task-level `satisfies`/`satisfiedBy` ResourceLink between the mirrored task pairs.** This is the "task entanglement is the only data seam" transparency invariant made concrete: orgs do not share structure, they share *task satisfaction signals*. Bob's `Sign MSA` task `satisfies` ZeroBias's mirrored `Counterparty MSA executed` task (and vice-versa via `satisfiedBy`).

```
  ZeroBias side                                Bob's Org side
  ┌─────────────────────────┐                  ┌─────────────────────────┐
  │ Engagement (ZB<>Bob's)  │                  │ Engagement (Bob's<>ZB)  │   ← mirrored, each party-owned
  │   Board: Business Onb.  │                  │   Board: Business Onb.  │
  │     Task: MSA (REQ) ────┼──satisfies/──────┼──── Task: MSA (SAT)     │   ← the SEAM (task<>task only)
  │     Task: ...      ◄─────┼──satisfiedBy─────┼─────► Task: ...         │
  └─────────────────────────┘                  └─────────────────────────┘
```

**Seam link-type status:** `task→task satisfies/satisfiedBy` is **not registered yet** (confirmed prod-zb; task→task today = only `blocked_by`/`blocks`, `child_of`/`parent_to`, `relates_to`). **Expected to land later today (2026-06-03)** per Nic — treat as a same-day dependency, **NOT a design blocker.** Build interim if the seam type lags: stand up the two mirrored structures now, wire the seam with `relates_to` as a placeholder, swap to `satisfies`/`satisfiedBy` once registered.

**Satisfaction drives provisioning (Q-ENG-2 = BOTH layers).** When a task is marked **satisfied + closed**, its **Activity `onTransition` workflow fires** — which may create the next round of Tasks / Boards / Projects (or unlock features) depending on what comes next. So progressive disclosure is **both** a platform Board/Task capability (the workflow engine spawns/reveals the next items) **and** Projects-App UI (renders what currently exists/is visible). The next-step graph is data-driven by task-activity `onTransition`, not hardcoded in UI. → ties directly to OB-003 (`onTransition`) + OB-005 (unlock model).

### Platform link-type reality (verified prod-zb 2026-06-03 via `hydra.Resource.linkTypeSearch`)

**Hydra link types are resource-specific triples** `(fromType, toType, linkType)` — no generic any↔any link; even `relates_to` is registered per target type. The build entities:

| Entity | Complete link-type set | Notes |
|---|---|---|
| **project** | `project child_of/parent_to project` · `project member_of boundary` · `board child_of/parent_to project` (project as target) | **Only ONE project↔project link: `child_of`.** Containment + boundary only. |
| **board** | `board child_of/parent_to project` · `task member_of board` (board as target) | Containment only. |
| **task** | 111 link types | The rich layer: `member_of` board (`34bbebfc-4f0d-11f1-934a-9f6ab63a10d9`), `blocked_by`/`blocks` task (`9ac2efea-1d62-11f1-…`), `child_of` task, `extends` activity (`fda28c82-…`), `member_of` boundary, `relates_to` ~90 types incl. party/subscription/order/framework/control/boundary_requirement. **No `satisfies`.** |

**Build chain:** `Project ← (board child_of) Board ← (task member_of) Board`. Tasks attach to **boards**, never directly to projects. Project/board express **containment only**; all relationships live at the task layer.

**Consequence:** the Engagement→Delivery scaffold can only be **parentId containment** today (`governs` doesn't exist). The gate is expressible **only at task level** (`task blocked_by task`). Every project-level relationship must be registered fresh.

**Nic bundle (all `project`-scoped link-type registrations the model needs — none exist today):**
- `governs` / `governed_by` — D-52 Engagement governance (RL-001 / task-13, filed)
- `depends_on` / `dependency_of` — prerequisite gate (Delivery Project requires Engagement); **recommended** semantic for the gate (standard prerequisite link across the registry)
- `blocked_by` / `blocks` — workflow-state gate (optional; mirrors task-level)
- `relates_to` — generic project↔project association
- `satisfies` / `satisfiedBy` — req↔sat (also task→requirement; overlaps BACKLOG-108/123 pending ask)

**CI build interim (until Nic registers the above):** Engagement→Delivery via `parent_to` containment; gate at **task level** (`task blocked_by task`); tasks via `task member_of board`. Backfill project-level links when registered.

#### Project↔project link-type catalog (PM vocabulary to consider — Clark 2026-06-03)

> **Full research-backed FR now lives in `project-link-type-vocabulary-proposal-2026-06-03.md`** (PMI/PDM + Jira + SysML/DOORS + PPM, with rationale per verb, for backend triage — expands RL-001). **Update:** Projects App has a **Schedule tab**, so the scheduling links (FS/SS/FF/SF + lead/lag) are **IN scope**, not "later." The condensed table below is superseded by that doc.

A Program-of-projects wants a real PM relationship vocabulary, not just containment. Cataloged for consideration. **Note:** classic MS Project deps (FS/SS/FF/SF) are *task*-level; project↔project relations are a portfolio/program (PPM) + governance concern. **Most verbs already exist in hydra** (`depends_on`, `blocks`, `supports`, `provides`, `references`, `superset_of/subset_of`, `governs`) — registering = adding the `(project, project, verb)` triple, not inventing verbs (except `satisfies`).

| Category | Link | Meaning | PM analog | Verb in hydra? | SME Mart |
|---|---|---|---|---|---|
| Hierarchy | `child_of`/`parent_to` | sub-project | inserted subproject | ✅ registered | **have** |
| | `member_of`/`governs` | Program membership | program membership | ✅ (boundary) | consider |
| Scheduling | `finish_to_start` | B after A done | FS (default) | ❌ | later (only if Gantt) |
| | `start_to_start` | B starts w/ A | SS | ❌ | later |
| | `finish_to_finish` | B done w/ A | FF | ❌ | later |
| | `start_to_finish` | rare | SF | ❌ | skip |
| Prerequisite/gate | `depends_on`/`dependency_of` | B requires A | external dep / predecessor | ✅ | **register** (gate) |
| | `blocks`/`blocked_by` | A blocks B | blocker | ✅ | optional |
| Governance | `governs`/`governed_by` | Engagement governs Project | portfolio governance | ✅ | **register** (D-52) |
| | `contributes_to`/`rolls_up_to` | rollup into Program | portfolio rollup | ❌ | consider |
| Requirement | `satisfies`/`satisfiedBy` | meets a requirement | deliverable→requirement | ❌ missing | **register** (req↔sat) |
| Association | `relates_to` | generic | "related" | ✅ | **register** (cheap) |
| | `references`/`referenced_by` | cites | — | ✅ | nice |
| | `supersedes`/`superseded_by` | replaces | versioning | ~ (superset/subset) | consider |
| Output | `provides`/`consumes` | A feeds B | producer/consumer | ✅ (provides) | consider (offerings) |

**Register-now set (the Nic bundle):** `governs`, `depends_on`, `relates_to`, `satisfies` (+ existing `child_of`). **Consider-later (don't register speculatively):** scheduling 4 (only if real Gantt), `contributes_to`/`rolls_up_to` (Program rollups), `provides`/`consumes` (offering chains). Discipline: link types are cheap to register but permanent in a shared registry — register what the model uses; keep the rest a documented wishlist.

---

# PART 1 — THE SHAPE

## 1.1 The object being minted

Per **D-52**, the default engagement is an **Engagement governance node** — a `platform.Project` carrying the `engagement` role tag, with **ZeroBias as provider and the customer org as buyer**, that **governs** a project-rooted delivery tree via the `governs` ResourceLink. Provisioning creates:

```
Engagement node (platform.Project, engagement role)        <- commercial seam: ZB -> Customer
   |  governs (hydra ResourceLink, RL-001 — link-type id still pending)
   v
Delivery root Project (platform.Project, project tier)
   + default Board   (auto-created by platform.Project.create — already verified)
   + Onboarding Task list  (the new piece — see 1.4)
```

This is the **same construct the SME Mart provisioner already builds today** (`platform-engagement-provisioner.service.ts`: creates Engagement Project + Project tier + auto-Board, idempotent, 20/20 specs). Backend ownership = lift this op up to the platform, parameterize the trigger, and bolt on the **onboarding gate** (the part SME Mart never built).

## 1.2 The four layers

The whole feature is four stacked layers. Brian's chat touches all four; only the first is built.

| Layer | What it does | State today |
|---|---|---|
| **1. Provision** | Mint Engagement + Project + Board + onboarding Tasks for an (org, ZeroBias) pair | **Built** (SME Mart provisioner is the reference impl; backend lifts it) |
| **2. Classify** | Capture entity **size + type** → derive Guild eligibility + which agreements apply | **Not built** — needs fields + a capture surface (Contact Us form) |
| **3. Gate (Agree)** | Customer signs the required agreements; each agreement = a **Requirement** that becomes satisfied on signature | **Not built** — rides on Requirements architecture ([[BACKLOG-123]]) |
| **4. Entitle (Unlock)** | A satisfied agreement-set unlocks apps (Catalog first); payment + contribution gate deeper access | **Not built** — needs an entitlement model + enforcement at the API surface |

## 1.3 The onboarding flow (state shape)

```
[Org exists]
   |
   |  TRIGGER (Q-B: which? one or more of)
   |    - org-create hook   - Contact Us submit   - admin action   - backfill (current customers first)
   v
[PROVISION]  ->  Engagement node (ZB->Org) + delivery Project + default Board + onboarding Task list
   |
   v
[CLASSIFY]  entity size + type  (Q-C / Q-D: enum + where captured)
   |    guildEligible = (nonprofit OR gov OR <100 employees) AND NOT (public-traded OR PE-backed OR >100)
   |    -> determines WHICH agreements apply (conditional set, Q-F)
   v
[GATE]  customer signs agreements; each signature satisfies a Requirement
   |    - EULA                         (all)                         [placeholder text]
   |    - Platform MSA                 (ZeroBias core platform)      [placeholder text]
   |    - Guild membership agreement   (eligible entities; by size+type)  [placeholder]
   |    - Contributor agreement        (contributor path; git-PR-measured)  [placeholder]
   |    - Foundation Labs agreement    (build labs; via Guild membership/contributor)  [placeholder]
   |    - Payment ($ tier)             (placeholder for now)
   v
[ENTITLE]  satisfied agreement-set -> app unlocks
        sign X (Q-E) -> Catalog App unlocked
        paying -> full Catalog ;  non-paying -> limited Catalog (Q-L)
        contribution (maintain >=1 connector) -> connector access  [future, Q-J]
```

## 1.4 Tasks vs Requirements — the dual model (important for backend)

Brian says "onboarding **Tasks**" and "customer must **sign** EULA." These are two linked things, and keeping them distinct is what makes the gate enforceable:

- **Onboarding Task** = the *actionable work item* on the customer's board ("Sign the EULA", "Complete company profile", "Submit payment"). Has RACI, is assigned to the customer admin, is what the human sees and checks off on the Projects App > Engagements page.
- **Agreement Requirement** = the *contractual fact* (`EULA executed: yes/no`) that **gates entitlement**. Per Clark's **agreements→Requirements** principle (already locked; see `BACKEND_FEATURE_REQUESTS.md`), agreements are **Requirement rows**, not scalar fields.

A sign-task **points at** its agreement Requirement; completing the task satisfies the Requirement; the satisfied Requirement (or set) flips the app entitlement. **Tasks drive humans; Requirements gate apps.** This means the onboarding Task list (Layer 1 output) and the agreement gate (Layer 3) are wired through Requirements, and the whole feature gives the deferred **Requirements architecture ([[BACKLOG-123]]) its first concrete driving use case** — worth surfacing to Kevin as the reason to un-defer it.

**The Req/Sat split (Clark 2026-06-02) — which side holds what:** this is the req↔sat entangled-task pair (the same cross-party seam that powers transparency):
- **Req (Requirement) task** lives on the **ZeroBias platform side** — the assertion "this customer must sign X / pay / be verified."
- **Sat (Satisfaction) task** lives on the **customer side**, on their onboarding board — the action "Sign X."
- The customer completing the **Sat** task **satisfies the Req**, which **fires a workflow** that either **(a) auto-unlocks** the feature (simple gate, e.g. sign → open an app) **or (b) notifies an admin to unlock** (review-gated, e.g. payment verification, eligibility/Guild review). **Which gates are auto vs admin-reviewed is part of OB-005 + Q-E/Q-H.**

## 1.5 Known / Placeholder / Unknown

**KNOWN (locked from Brian + existing infra):**
- Backend owns the work; most infra built. Start with **current customers** (backfill first).
- Customer's view = **Projects App > Engagements page** with their default engagement + project + onboarding tasks.
- The three agreement-issuing **entities**: ZeroBias **core platform** (Platform MSA), ZeroBias **Guild** (membership/licensing + contributor agreement, by entity size+type), ZeroBias **Foundation Labs** (build labs, accessed via Guild membership/contributor).
- **Guild eligibility rule:** eligible = non-profit OR gov entity OR company <100 employees. **Not eligible** = publicly-traded OR PE-backed OR >100 employees (limit changeable later).
- **Contributors** = measured by actual contribution traceable from **git-based PRs**.
- **All current customers are the same right now** (HIS / WW / Armorstack all fall in the Guild-eligible bucket) → **no per-customer agreement differences at launch**.
- Catalog access is **gated**: non-paying = limited, paying = open; contribution unlocks tweaks (e.g. "to use connectors you must maintain a connector").

**PLACEHOLDER (Brian said stub it for now):**
- Actual agreement document text (EULA / MSA / Guild / contributor / Foundation Labs).
- Payment amounts / tiers.

**UNKNOWN → Part 2 questions:**
- Exact onboarding Task list contents · provisioning trigger · entity-type enum + size definition · where classification is captured/verified · which agreement unlocks which app · conditional-agreement rules · non-eligible-entity path · contributor mechanics scope · "limited catalog" definition.

---

# PART 2 — QUESTIONS FOR BRIAN

*Plain-English, no platform jargon. Grouped. Hand these to Brian as-is.*

### A. The onboarding task list (the one you bounced back to me)
1. For a brand-new customer, what is the **exact list of onboarding tasks** they should see in their default project? (e.g. Sign EULA → Sign Platform MSA → Sign Guild agreement → Complete company profile → Submit payment → ...). List them in the order you want them done.
2. Are any of those tasks **dependent** on each other (must sign A before B unlocks), or can they be done in any order?
3. We already have a mature onboarding task set — but it's the **consulting/audit engagement** flow (Welcome → Leadership Huddle → Kickoff → Discovery → Compliance Roadmap → Delivery, run by an Engagement Lead). The **platform/Guild signup gate** you described (sign EULA → MSA → join Guild → pay → unlock Catalog) has **no tasks defined at all** yet. Do you want the new signup onboarding to **reuse/adapt** the existing consulting flow, or be a **separate, lean self-service sequence**? (They're different audiences: white-glove audit delivery vs. self-serve signup.)

### B. What kicks it off
3. When should a customer's default engagement get **created**? Pick any that apply: (a) automatically the moment their org is created, (b) when they submit the **Contact Us** form, (c) a ZeroBias admin creates it by hand, (d) a one-time backfill for existing customers. You said "start with current customers" — is that a one-time backfill, with one of (a)/(b)/(c) for everyone after?

### C. Entity type + size
4. What are the official **entity types** we classify a customer as? From your note I have: non-profit, government entity, private company, publicly-traded, private-equity-backed. Is that the complete list?
5. Is **size purely employee count** (the <100 cutoff), or does revenue / funding also factor in?

### D. Where we capture it
6. Where does the customer's size + type **come from** — do they self-declare it on the Contact Us / signup form, and do we **trust it as-is for now**, or does someone verify it?

### E. What signing unlocks what
7. You said "once the customer signs X, the Catalog App unlocks." **What is X exactly** — the EULA? the Platform MSA? the Guild agreement? all of them?
8. Besides the Catalog, are there **other apps that unlock** as agreements get signed, and which agreement unlocks each?

### F. Different agreements for different customers
9. You said right now all current customers sign the same things. **Going forward**, which entity types trigger which **extra agreements**? (e.g. "a publicly-traded company must also sign ___"). Or is conditional logic a later phase and everyone signs the same set at launch?

### G. The agreement documents
10. We'll use **placeholders** for the actual agreement text for now — confirmed. Just so we model it right: is the **full list of distinct agreements** = EULA, Platform MSA, Guild membership agreement, Guild contributor agreement, Foundation Labs agreement? Anything missing or extra?

### H. Money (placeholder, but shape)
11. Payment is a placeholder for now — but at onboarding, does **non-payment block** anything (e.g. Catalog stays locked until they pay), or do they get in and pay later?
12. Roughly, do payment tiers key off the **same entity size + type** as Guild membership?

### I. Customers who can't be Guild members
13. For an entity that **can't be a Guild member** (publicly-traded / PE-backed / >100 employees) — do they still get a default engagement and onboarding? What's **their path** — a paid-only platform relationship, a different agreement set, or are they out of scope for now?

### J. Contributors (future?)
14. The "measured by git PRs" contributor status and the "maintain a connector to use connectors" rule — is that **a later phase**, or part of the first launch?

### K. Foundation Labs
15. What is **Foundation Labs** concretely as something a customer accesses, and does it unlock at onboarding or later?

### L. "Limited" catalog
16. For a non-paying member, what does **"limited catalog access"** mean — browse-only, a subset of items, read-only? What specifically is withheld until they pay?

### M. Admin identity + RBAC at onboarding (Kevin-leaning) → see dedicated list
The "who becomes the Org Admin / how is it gated / do we need a personnel roster" cluster (surfaced by Clark 2026-06-03 via the *Bob of Bob's Org* worked example) lives in its own running doc: **`onboarding-admin-rbac-questions-for-kevin-brian.md`**. Covers: first/only signup = Admin by default? (Q-ADM-1), CRM/lead-acceptance as the admin-gate (Q-ADM-2), non-happy-path officer credentialing (Q-ADM-3), personnel roster up front for groups/roles (Q-ADM-4), mirrored-Engagement one-node-vs-two (Q-ENG-1), progressive task visibility (Q-ENG-2).

**RACI confirmed (Clark 2026-06-03):** to start, **all onboarding tasks assign to the Org's default `Org Admins` group / `Organization Admin` role** — confirms the new-model RACI already recorded at OB-003 / §A.2. The §M questions are about how the right human lands in that role, not which role tasks target.

---

# PART 3 — BACKEND FEATURE-REQUEST LIST

*Slots into the zb/ui authoritative tracker (`~/Projects/zb/ui/.claude/docs/BACKEND_FEATURE_REQUESTS.md`), filed as ZB Tasks on the Backend Feature Requests board. **IDs proposed as a new `OB-` (Onboarding) family — umd/Clark to confirm prefix + slot before filing.** Several depend on already-filed FRs.*

| ID | Title | Owner lane | Depends on |
|---|---|---|---|
| **OB-001** | Default-engagement provisioning op (platform-owned, multi-trigger, idempotent) | Platform | RL-001 (governs link) |
| **OB-002** | Entity classification fields + Guild-eligibility derivation | Platform (Dana/Org) | — |
| **OB-003** | Onboarding Task list template (default, instantiated per provision) | Platform · TaskService | OB-001, Q-A |
| **OB-004** | Agreement-as-Requirement model (agreement-type registry + signature lifecycle) | Platform | [[BACKLOG-123]], SC-006 |
| **OB-005** | App-entitlement / unlock model (agreement-set → app access, enforced at API) | Platform | OB-004 |
| **OB-006** | Eligibility + entitlement rule config (classification/payment/contribution → access) | Platform | OB-002, OB-005 |
| **OB-007** | Contributor-contribution tracking + connector-maintenance entitlement | Platform | OB-006 · **backburner/future** |

### OB-001 — Default-engagement provisioning op
Platform-owned operation that mints the default ZB→customer engagement: Engagement node (`engagement` role tag) + delivery-root Project + default Board + onboarding Task list, with ZeroBias as provider and the org as buyer. **Idempotent** (probe-before-create, per existing provisioner). **Triggerable** from: org-create hook / Contact Us submit / admin action / backfill (Q-B). **Reference implementation exists** — SME Mart's `platform-engagement-provisioner.service.ts` (Steps A/C/D + auto-Board, 20/20 specs); backend lifts and generalizes it. Once platform owns this, the **SME Mart provisioner deprecates** (per parkit-20 direction). Gated on **RL-001** (`governs` link-type id) for the governance link — but can ship structure-now with `governs` stubbed and backfilled (deferred-governs workaround already specced).

### OB-002 — Entity classification fields + Guild-eligibility derivation
Typed fields capturing the customer's **entity type** (enum: nonprofit / gov / company / publicly-traded / PE-backed — confirm Q-C) and **employee-count band** (Q-C/Q-D), with a **derived `guildEligible`** signal computed by the rule: `(nonprofit OR gov OR <100 emp) AND NOT (public OR PE OR >100)`. Note the platform `AppOrgProfile` already carries `orgTypes` / `engagementStage` classification signal — **extend that** rather than inventing a parallel home (verify with umd whether `orgTypes` covers the entity-type enum). Captured at the Contact Us / signup surface (Q-D); trust model TBD (Q-D).

### OB-003 — Onboarding Activity definitions (create missing gate activities + update existing to new model)
Tasks are created from **Activities** (`platform.Activity`, `Task.create` takes `activityId`). The registry holds **142 activities** (prod, 2026-06-02). **Finding: the existing onboarding family (`oba*`, ~25 activities in `zerobias.zerobias.platform.workflow`) is the white-glove *consulting/audit engagement* onboarding — NOT the self-service platform/Guild signup gate Brian described.** RACI on those is `Engagement Lead` (R) / `VP of Consulting Services` (A) — the legacy Neverfail consulting org model. **No activity exists for any of the commercial/legal/membership gates** (EULA, MSA, Guild, contributor, Foundation Labs, payment, Catalog unlock). So OB-003 is two asks:

**(a) CREATE the missing gate Activities** (see Appendix A for the full gap table). Each needs: `name`, `code`, `taskNameTemplate`, RACI roles (new model — customer **Org Admin** responsible, ZeroBias platform/Guild role accountable, *not* VP Consulting), `links` (the agreement Requirement / resource it gates), and `onTransition` (fire the unlock or next gate on completion).

**(b) UPDATE the existing onboarding Activities "to reflect the new model"** (Clark's direction): re-RACI the reusable `oba*`/`org*` setup activities off the consulting org (Engagement Lead / VP Consulting) onto the self-service platform/Guild model, OR fork a lean signup sequence so a Guild signup doesn't drag in 25 steps of audit-delivery work (kickoff meetings, control discovery, compliance roadmap). **Reuse-vs-fork is a product-shape steering decision for Brian — Q-A3 below.**

Instantiation when OB-001 runs likely composes the bulk-task/template capability already filed as **TS-001** (epic task-19). Each sign-Activity's task **links to its agreement Requirement** (OB-004) so completion satisfies the gate.

### OB-004 — Agreement-as-Requirement model
Model each agreement (EULA / Platform MSA / Guild membership / Guild contributor / Foundation Labs — Q-G) as a **Requirement row** on the engagement node (per the locked agreements→Requirements principle), with: an **agreement-type registry** (the distinct agreement kinds), **signature capture**, and **lifecycle** (presented → signed → countersigned). Monetary terms ($ tiers) depend on **SC-006** (money core types). **This is the concrete driving use case for un-deferring [[BACKLOG-123]] Requirements architecture** — flag to Kevin.

### OB-005 — App-entitlement / unlock model
Per-(org, app) **entitlement state** derived from satisfied agreement-Requirements, plus a **gate map** (which agreement-set unlocks which app — Q-E/Q-H). Catalog is the first gated app ("sign X → Catalog unlocks"). **Enforced at the API surface, not the UI** — consistent with the platform-enforces-invariants direction (DECISIONS, CE12 tighten-never-loosen rationale). UI reflects entitlement; it does not implement the gate.

### OB-006 — Eligibility + entitlement rule config
The **rule layer** (config, not per-org data) mapping classification + payment + contribution → access decisions: Guild eligibility (OB-002), paying-vs-non-paying Catalog scope (Q-L), conditional-agreement selection by entity type (Q-F). Keep rules **configurable** — Brian explicitly said the <100 limit and contribution rules will change.

### OB-007 — Contributor tracking + connector-maintenance entitlement *(backburner)*
Measure contributor status from **git-based PR** activity and gate contribution-based entitlements ("maintain ≥1 connector to use connectors"). **Future phase** unless Brian says launch (Q-J). Listed for completeness so it isn't lost.

### Cross-cutting dependencies (already filed)
- **RL-001** (`governs` link-type) — gates OB-001's governance link. FILED (task-13), awaiting id.
- **SC-006** (money core types) — gates OB-004's monetary terms. FILED (task-11).
- **[[BACKLOG-123]]** Requirements architecture — OB-004/005 ride on it; **deferred pending Kevin**, now with a concrete driver.
- **SC-003** (Project lifecycle `code`/`activatedDate`/`endDate`) — engagement activation state. FILED (task-9).

---

---

## Appendix A — Activity (TaskActivity) inventory + gap analysis

**Source:** `platform.Activity.list` on **prod-zb**, 2026-06-02. Registry total = **142 activities**. Onboarding-relevant subset below; mapped against the proposed onboarding task list.

### A.1 — Existing activities relevant to onboarding (REUSE / UPDATE candidates)

The `oba*` family (package `zerobias.zerobias.platform.workflow`) is the **consulting/audit engagement** onboarding — RACI `Engagement Lead` / `VP of Consulting Services`:

| code | name | note |
|---|---|---|
| `obaSe01` | Welcome | consulting-model RACI |
| `obaSe02` | Engagement Leadership Huddle | audit-delivery, likely N/A for self-serve |
| `obaSe03` | Post Huddle Steps | audit-delivery |
| `obaSe04`–`obaSe06` | Prepare / self-service / guided Workflow IQ onboarding | product onboarding |
| `obaSe08`–`obaSe10` | Kickoff prep / meeting / follow-up | audit-delivery |
| `obaSe11`–`obaSe17` | Review info → Discovery → Self-Assessment → Roadmap → Playbook → Delivery | audit-delivery body |
| `obaCp01` | Create Auditee Profile | closest to "complete company profile" (audit-context) |
| `obaIr00`–`obaIr03` | Request for Information (docs / architecture / **BAA & Customer MSA templates** / IT survey) | `obaIr02` *requests* MSA templates — not signing the platform MSA |
| `am05` | Zerobias Base Camp Setup | generic setup |
| `audSurv1` | Send Onboarding Survey to Customer | closest to entity classification capture |
| `orgSetupBoundary` / `orgSetupNode` / `orgSetupScim` | org infrastructure setup | reusable post-signup |

### A.2 — MISSING activities (CREATE — the backend FR list, OB-003a)

None of the commercial / legal / membership gate steps from the chat (Clark's gate flow + Brian's agreement entities) exist as activities:

| Proposed onboarding task | Existing activity? | Action |
|---|---|---|
| Sign **EULA** | none | **CREATE** |
| Sign **Platform MSA** | none (`obaIr02` only requests templates) | **CREATE** |
| Sign **Guild Membership Agreement** | none | **CREATE** |
| Sign **Guild Contributor Agreement** (conditional) | none | **CREATE** |
| Sign **Foundation Labs Agreement** (conditional) | none | **CREATE** |
| **Submit Membership Payment** (placeholder $) | none (`subMod*` = EC service subscription, unrelated) | **CREATE** |
| **Declare/verify Entity Type & Size** (eligibility) | partial — `audSurv1` survey | **CREATE or extend survey** |
| **Complete Company Profile** (signup) | partial — `obaCp01` (audit-context) | **CREATE signup variant or adapt** |
| **Grant Catalog Access** (entitlement unlock) | none | **CREATE** (or model as a non-task entitlement fired `onTransition`) |

**New-model RACI for all created gate activities:** responsible = customer **Org Admin**; accountable = a ZeroBias platform/Guild role (TBD — *not* VP of Consulting Services). Each links to its agreement Requirement (OB-004) and fires the relevant unlock via `onTransition`.

### A.3 — Notes
- `Activity` has `taskNameTemplate`, built-in RACI (`responsible`/`accountable`/`consulted`/`informed`), `links` (gated resource types), `onTransition` (chain/trigger), `workflowId`, `code`, `packageCode`, `activityGroup`. Rich enough to model the whole gate without new infra — the gap is **content (activity definitions), not capability.** Confirms the "infra is mostly already built" read.
- `obaSe01` (Welcome) had **empty `onTransition`** — the `oba*` sequence is bound by a shared `workflowId`, not per-step auto-cascade on that step. Backend should confirm how the workflow advances the sequence before wiring the new gate chain.
- The new gate activities should likely live in a **new package/activityGroup** (e.g. `*.platform.onboarding` / group `guild-signup`) to keep them distinct from the consulting `workflow` package.

---

## Source — Brian/Clark Slack 2026-06-02 (verbatim)

> **Clark 9:19** — ok in order to UNLOCK creating default Engagement and Project and Board for Zerobias Providing Service to Customer: it's mostly backend work BUT the requirements need to be defined. Most of the backend infra is already built. we just need to refine the Contact Us form a little more and start with the current customers <-- what does their Service Project onboarding Task list look like exactly? for example: customer only sees Projects App > Engagements page with their default engagement + project + onboarding Tasks / customer must sign EULA / if customer type is A they must sign B / once customer signs X then the Catalog App is unlocked
>
> **Brian 9:20/9:23** — yes, we can talk through this. there is platform MSA, and there is ZeroBias Guild member agreement / contributor agreement, and their $ they need to pay etc... just put placeholders in for now. But entities are ZeroBias core platform. ZeroBias Guild (licensing/membership/by entity size and type), ZeroBias Foundation Labs (for the ZB build labs they use) via Guild membership, contributor status) by Entity size and type
>
> **Clark 9:25/9:27** — is there any difference between any of our customers for what they see in their initial Project and Tasks i.e. HIS vs. WW vs. Armorstack — do they have different agreements that need to be signed?
>
> **Brian 9:42/9:43** — Right now based on entity size and type no for Guild member. Meaning guild members can ONLY BE one of these 1) non profits, gov entities, companies smaller than 100 employees. Guild Contributors will be based on actual measurable contribution into platform traceable from git based PRs etc. Entities that can't be members: Public traded, private equity backed, over 100 employees (for now. We can change that limit later). We will have to get a way to limit catalog access to non paying members, then open catalog to paying members, and then other tweaks based on contributions (ex: to use connectors you must maintain one connector is an example)
