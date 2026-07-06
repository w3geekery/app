# Feedback — Holon / Hologram / Ontology Alignment Contract

**From:** Clark
**To:** Joe (LLamas / substrate) · cc Gabriel (visualization)
**Date:** 2026-06-17
**Re:** `holon-hologram-ontology-contract.md` (draft for ratification)

---

## Short version

Yes — it makes sense, and it's genuinely well-aligned with the RDF Compass I'm already steering the project by. I'm a **yes on the structure, the three invariants, and the "align by conformance, not meetings" model** — that's the right way to keep three workstreams composing instead of just *looking* connected.

Before I ratify the definitions, there are **four things to adjust** (one is a real technical fix), **one trivial gap**, and **two items I'd pull out as separate decisions** rather than fold into this contract. There are also **two of your §7 open decisions I can answer right now** so you and Gabriel aren't blocked.

---

## What's already working (so we're clear on the starting point)

This isn't a different mental model bolted on — you've built on the same substrate I have. The holon (boundary + scope + requirement tree), the hologram (validated state at time T, time-series = the "audit movie"), the ontology (shared OWL/SHACL grounded to the ZeroBias model), verify-yourself, hash-chaining, and your **C-1 through C-4 line up in the same order** as the compass checklist I'm using. So the three workstreams really can compose by construction. Good foundation.

---

## Four things to adjust before I ratify

### 1. INV-1 flattens the two-party seam (the one real technical fix)

INV-1 sets `boundary_id = holon = viz scope = project/engagement scope` as one universal key. That works for **one holon = one boundary**, but it breaks at the engagement level, and that matters for all three of us.

In our model the layers are distinct (using Brian's convention that **a Holon is a System**):
- A **Holon = a System = one *party's* Boundary** (one side — its scope, its rules, its contents).
- An **Engagement = the seam *between two* Systems** (two parties' boundaries). It inherently spans **two** holons.

So `boundary_id = engagement scope` collapses two different things. Concretely it'll bite Gabriel: when the viz renders a node, is it rendering *one* holon (one party's boundary) or the *engagement seam* (both)? Those are different surfaces.

**Suggested fix:** keep INV-1's "one boundary id" as the holon key, but explicitly separate **holon (one boundary)** from **engagement (the relationship between two holons)**. The engagement references two boundary ids; it isn't one.

### 2. Definitions authority — I steward, but I'm not the sole definer

I appreciate the "Clark holds the authoritative definitions" framing as a way to give this a concrete owner. But to keep us from quietly forking: the holon/hologram vocabulary adoption and the canonical model are a **ZeroBias-platform decision** (Brian's directive; Kevin/Nic on the platform side), and **ZeroBias AuditgraphDB stays the schema of record.** If I ratify definitions solo and they drift from what the platform actually lands, we've built three things that validate against each other but not against ZB.

**Suggested reframe:** I ratify the **invariants** and own the **project/signup/engagement side** shapes; the **canonical namespace + schema-of-record stay with ZeroBias.** I'll carry the relevant calls back to the platform side rather than declare them unilaterally.

### 3. The shared SHACL profile shouldn't live in (or be owned by) the LLamas namespace

Right now the master profile sits in the LLamas namespace with "LLamas maintains, all conform." That puts the substrate party in ownership of the contract everyone else has to validate against — and it pre-empts the namespace decision in §7.2. On our side, the SHACL/RDF artifact and namespace are platform-team scope.

**Suggested fix:** treat the canonical namespace as **ZeroBias-owned** (settle it under §7.2 before it hardens), and make the profile **co-owned**. You building out your own substrate is great and not blocked by this — it's specifically *the shared, normative profile* that should sit in a neutral/ZB namespace.

### 4. §7.3 mixes two different axes

§7.3 asks how guild/company-type rules (publicly-traded, PE-funded >100, non-profit, etc.) map onto ontology `Party` **types** grounded to ZB `PartyTypeEnum`. Those are two orthogonal axes:
- `PartyTypeEnum` = *what kind of party* (`user / team / org / vendor / suggested_vendor / person`).
- nonprofit / PE-backed / publicly-traded = an **attribute *on* an org party**, not a party type.

Mapping company-type onto `PartyTypeEnum` will model it wrong. It should be a **property/classification on the org Party**, layered over the party type.

**Good news:** I already have that taxonomy built (see "what I can define now," below) — so §7.3 is answerable, just on the right axis.

---

## One trivial gap

- **C-5 is left blank** ("(per checklist)"). It's the fifth compass invariant: **the engagement-pinned SHACL profile / requirement-set is versioned** — both parties pin to a version; nothing silently swaps the active requirement set under a live engagement. Your C-1-C-4 already match the compass; copy C-5 in and we're fully in sync.

---

## Two items I'd decide separately (not fold into this contract)

- **"AuditCrowd" as the umbrella name** — I want to nail down how it maps to the marketplace / Transparency OS identity before I ratify a contract titled under a different product name. Quick conversation, but let's not bury it.
- **The Zachman / "Peri-Audit" grid (§7.5)** — adopting a perspective × interrogative grid as the shared completeness address space is a real architectural commitment, and a good idea worth its own evaluation. I don't want to rubber-stamp it inside a definitions doc; let's give it a dedicated pass.

---

## Two of your §7 open decisions I can answer now

**§7.1 — Granularity / nesting — adopt Brian's naming convention: _A Holon is a System._** That's the canonical noun we should all standardize on (in §3.1 and in the viz labels) — a holon = a system. From there: **systems nest** (a system contains sub-systems, which are themselves holons), so a holon can be scoped at the whole-system, org, or sub-scope level, with self-similar nesting up to the engagement. Nesting is in-scope by design, not an exception.

**§7.3 — Party / company-type model:** Use this classification on the **org Party** (this is the buyer/eligibility taxonomy I've been building on the signup side):

- **Business classification** (one of): non-profit · government · hospital/healthcare institution · not-for-profit · publicly-traded · PE-backed · privately-held.
- **Employee band:** 1-10 / 11-50 / 51-100 / 101-500 / 500+.
- **Eligibility rule:** eligible if *type-based* (non-profit OR government OR hospital OR not-for-profit — any size) **OR** (privately-held for-profit AND <100 employees); **never** eligible if publicly-traded OR PE-backed.

Model these as properties on the org Party, not as `PartyTypeEnum` variants (per #4).

---

## Suggested next step

If you fold in the INV-1 split (#1), the namespace/ownership reframe (#2-3), the §7.3 axis fix (#4), and drop in C-5, I'm ready to ratify the invariants and the conformance model, and we take the AuditCrowd-naming and Zachman-grid questions as their own short threads. Happy to do a quick three-way pass with Gabriel on the holon-vs-engagement surface (#1) since it's the one that touches the viz directly.
