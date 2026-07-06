# AuditCrowd — Holon / Hologram / Ontology Alignment Contract
# >>> CLARK MARKUP 2026-06-17 — inline comments tagged `>>> CLARK … <<<`. Original text unchanged. <<<

> **Status: DRAFT — for ratification.**
> **Owner / definer: Clark.** Clark holds the authoritative definitions. This draft
> seeds them from the existing LLamas ONTO substrate so there is a concrete starting
> point; Clark may confirm, refine, or replace any definition below.
> **Conformers: LLamas (substrate) and Gabriel (visualization)** build to whatever
> Clark ratifies.
> **Enforcement: a shared SHACL profile (machine-checkable) + the RDF Compass review
> gate** — alignment is *validated*, not merely asserted.

>>> CLARK [authority]
Appreciate giving this a concrete owner — but I'd reframe "Clark holds the authoritative
definitions." I steward the project/signup/engagement side and I'll ratify the invariants,
but holon/hologram vocabulary adoption and the canonical model are a ZeroBias-platform call
(Brian's directive; Kevin/Nic platform-side), and ZeroBias AuditgraphDB stays the schema of
record. If I ratify solo and it drifts from what the platform lands, we've built three things
that validate against each other but not against ZB. So: I own SME-Mart shapes + the
invariants; the canonical namespace + schema-of-record stay with ZeroBias and I carry the
platform-level calls back rather than declare them unilaterally.
<<<

---

## 1. Why this document exists

AuditCrowd is being built across three workstreams at once:

>>> CLARK [naming — decide separately]
"AuditCrowd" as the umbrella name: let's nail down how it maps to the marketplace / ZeroBias
Transparency OS identity before I ratify a contract titled under a different product name.
Quick conversation, but I don't want to bury it inside the definitions.
<<<

- **Clark** — project / signup / engagement model (boundaries, parties, guild rules).
- **LLamas** — substrate: produces and attests the assessment record.
- **Gabriel** — visualization: shows the assessment to the demand side.

If each workstream carries a slightly different mental model of *holon*, *hologram*,
and *ontology*, the three will look connected but won't actually compose — the viz,
the signup, and the substrate will key on different scopes and speak different terms.

This contract fixes the **shared concepts and shared identifiers** so the three
compose by construction. It is deliberately small: definitions, three invariants,
per-party responsibilities, and the machine-checkable enforcement layer.

---

## 2. Ownership & enforcement model

| Concern | Owner | Mechanism |
|---|---|---|
| **Authoritative definitions** | **Clark** | This document (ratified) |
| Producing the validated assessment | LLamas | holon → hologram pipeline |
| Rendering the assessment | Gabriel | view over the hologram |
| **Machine-checkable contract** | LLamas (maintains), all conform | shared **SHACL profile** |
| **Change review gate** | shared | **RDF Compass** checklist |

>>> CLARK [SHACL profile + namespace ownership]
The shared SHACL profile shouldn't live in (or be owned by) the LLamas namespace —
"LLamas maintains, all conform" puts the substrate party in ownership of the contract
everyone else validates against, and it pre-empts the namespace decision in §7.2. On our
side, the SHACL/RDF artifact + namespace are platform-team scope. Suggest: canonical
namespace = ZeroBias-owned (settle §7.2 before it hardens), profile = co-owned. You building
your own substrate is great and not blocked by this — it's specifically the shared/normative
profile that should sit in a neutral/ZB namespace.
<<<

**Principle:** don't align by meetings — align by **conformance**. When Clark's
project objects, Gabriel's viz nodes, and LLamas's records all validate against the
**same SHACL profile**, they are aligned automatically. Any shape-touching change
passes the RDF Compass review (C-1…C-5) before it lands.

>>> CLARK [+1]
Strong agree on "align by conformance, not meetings" — this is the right model and it's
how I'm already steering the project. No notes here.
<<<

---

## 3. The three concepts (starting definitions — Clark to ratify)

### 3.1 Holon
**A holon = a boundary (a scope identifier) + everything scoped to it + its
requirement tree.** It is *the thing being assessed*, as a self-contained unit.

>>> CLARK [naming convention — adopt Brian's]
Standardize the canonical noun: **A Holon is a System** (Brian's convention). Let's use
"System" consistently in §3.1 and in Gabriel's viz labels so all three of us say the same
word for the same thing.
<<<

- **The boundary IS the holon.** A boundary in the auditor flow has a **twin** on
  the assessor/transparency side (per the 2026-05 standup decision).
- A holon can be a whole system, an org, or a sub-scope — **granularity is an open
  decision for Clark (§7).**

### 3.2 Hologram
**A hologram = a holon's validated assessment state at time T** — the bounded RDF
dataset for that boundary **plus** the validation report that *is* the assessment.

- The **time-series** of holograms over one boundary is the append-only
  "audit movie": `T1 ⊆ T2 ⊆ T3 …` — i.e., continuous monitoring, not point-in-time.
- A hologram is **signed and independently verifiable** ("verify-yourself"): a
  consumer can confirm authenticity + integrity with only a public key — no account,
  no trust in the platform.

>>> CLARK [+1]
Holon / hologram / ontology definitions all line up with the RDF Compass I'm already using —
good. The "audit movie" time-series and verify-yourself framing match. Foundation is solid.
<<<

### 3.3 Ontology
**The ontology = the shared OWL/SHACL vocabulary** (classes + relationships) that
makes a record from one side natively legible to the others. It is the common
language for `Party`, `Boundary`/holon, `Requirement`, `Assessment`, `Record`, and
the `satisfies` / `satisfiedBy` relationship.

- **Grounded to ZeroBias's real model** — e.g., `Party` types map to ZB's
  `PartyTypeEnum` (`user / team / org / vendor / suggested_vendor / person`).
- The shared **namespace** is currently a co-design placeholder — **open for Clark
  to settle with ZeroBias (§7).**

---

## 4. The three invariants (the contract proper)

These are the non-negotiables that make the three workstreams compose. Clark may
adjust the definitions in §3; these three relationships must hold regardless.

### INV-1 — One boundary identity
The **ZeroBias `boundary_id`** is the single key:
`boundary_id = holon key = viz scope = project/engagement scope`.
No workstream invents its own scope identifier or a private translation of it.

>>> CLARK [INV-1 — the one real technical fix]
This flattens the two-party seam. `boundary_id = engagement scope` collapses two different
things. Using Brian's convention (a Holon is a System):
  - A Holon = a System = one *party's* Boundary (one side: its scope, rules, contents).
  - An Engagement = the seam *between two* Systems. It inherently spans TWO holons.
"One boundary id = the holon key" is right; "= engagement scope" is not — an engagement
references two boundary ids, it isn't one. This will bite Gabriel directly: when the viz
renders a node, is it one holon (one System) or the engagement seam (both)? Different
surfaces. Fix: keep the one-boundary-id holon key, but explicitly separate holon (one System)
from engagement (the relationship between two Systems).
<<<

### INV-2 — One assessment artifact
The **validated, signed hologram (produced by LLamas)** is *the* assessment state.
Gabriel **renders the hologram**; Clark's engagement **tracks the hologram**. No
workstream computes a *separate* pass/fail picture, or the demand side sees two
conflicting truths, neither verifiable against the other.

### INV-3 — One vocabulary
All entities and relationships use the **shared ontology**, grounded to ZB. Guild /
company-type rules, viz node labels, and substrate records all reference ontology
classes — never bespoke strings for the same concept.

>>> CLARK [+1]
INV-2 and INV-3 are good as-is. The three invariants are the right minimal contract.
<<<

---

## 5. Per-party responsibilities

### Clark (project / signup) — **definer**
- Ratifies the §3 definitions and §7 open decisions.
- Signup emits **ontology-conformant `Party` + `Boundary` + `Engagement`** objects.
- The boundary created at signup is the **holon** everyone keys on (INV-1).
- Guild / independence rules expressed in **ontology `Party` terms** (INV-3).

### LLamas (substrate) — **producer / validator**
- Produces the **holon → hologram** and signs it (source of the validated assessment).
- Maintains the **shared SHACL profile** (the machine-checkable contract) and the
  RDF Compass gate.
- Exposes the hologram for Gabriel to render and Clark's engagement to track (INV-2).
- Provides the **verify-yourself** path (independent verification).

### Gabriel (visualization) — **consumer / view**
- Renders the **hologram** as the assessment state; the timeline = the hologram
  series (INV-2).
- Visualized boundary = the **same `boundary_id`** (INV-1).
- Node types / labels map to **ontology classes** (INV-3).
- The viz is a *view of the holon*, not a parallel model.

---

## 6. The machine-checkable layer

The contract is enforceable, not just descriptive:

- **Shared SHACL profile** — the canonical, validatable expression of §3/§4. Each
  workstream validates its objects against it. (Today the shared shapes live in the
  LLamas namespace pending the ZB namespace decision — §7.)
- **RDF Compass invariants** (review gate for any shape-touching change):
  - **C-1** entangled `satisfies`/`satisfiedBy` pair preserved (not flattened).
  - **C-2** lossless RDF round-trip (serialize → re-parse → isomorphic).
  - **C-3** append-only hash-chain across the hologram series.
  - **C-4** party-boundary scoping — **only the requirement id + the link cross the
    boundary; private execution detail stays home** (this is what makes **blind /
    anonymous submissions** for regulated entities possible).
  - **C-5** (per checklist).

>>> CLARK [C-5 — fill the blank]
C-5 is left as "(per checklist)". It's the fifth compass invariant: the engagement-pinned
SHACL profile / requirement-set is VERSIONED — both parties pin to a version, nothing silently
swaps the active requirement set under a live engagement. Your C-1–C-4 already match the
compass exactly; drop C-5 in and we're fully in sync.
<<<

- **Verify-yourself** — a hologram's signature is checkable by anyone with the
  published public key; tampering is detectable offline.

---

## 7. Open decisions for Clark

These are the authoritative calls Clark owns. LLamas/Gabriel implement once decided.

1. **Boundary granularity** — is a holon a whole system, an org, a sub-scope? Can
   holons nest (boundary-within-boundary)?

>>> CLARK [§7.1 — answered]
Adopt Brian's convention: **A Holon is a System.** That's the canonical noun (use it in §3.1
and viz labels). From there: **systems nest** — a System contains sub-systems, which are
themselves holons — so a holon can be scoped whole-system / org / sub-scope, with self-similar
nesting up to the engagement. Nesting is in-scope by design, not an exception.
<<<

2. **Canonical namespace** — settle the shared ontology namespace with ZeroBias
   (currently a LLamas placeholder, "TBC with ZeroBias").

>>> CLARK [§7.2]
Agree it lands with ZeroBias. See my note at §2 — canonical namespace = ZB-owned, profile
co-owned. I'll carry this to the platform side (Kevin/Nic).
<<<

3. **Party model mapping** — how do AuditCrowd guild/company-type rules
   (publicly-traded, venture/PE-funded >100 emp, non-profit, etc.) map onto ontology
   `Party` types grounded to ZB `PartyTypeEnum`?

>>> CLARK [§7.3 — answered, but you're mixing two axes]
These are orthogonal: `PartyTypeEnum` = what KIND of party (user/team/org/vendor/person);
nonprofit-vs-PE-vs-public = an ATTRIBUTE on an org party, not a party type. Mapping
company-type onto PartyTypeEnum models it wrong — it's a classification property ON the org
Party, layered over the party type. I already have that taxonomy built (signup side):
  - Business classification (one of): non-profit · government · hospital/healthcare ·
    not-for-profit · publicly-traded · PE-backed · privately-held
  - Employee band: 1-10 / 11-50 / 51-100 / 101-500 / 500+
  - Eligibility: eligible if type-based (non-profit OR government OR hospital OR not-for-profit,
    any size) OR (privately-held for-profit AND <100 emp); NEVER if publicly-traded OR PE-backed.
Model these as properties on the org Party.
<<<

4. **Hologram rendering contract** — does Gabriel render the LLamas-validated
   hologram directly, or a derived projection? (INV-2 requires the *verdict* be the
   validated one either way.)

5. **Assessment coverage model** — adopt the Zachman / "Peri-Audit table" grid
   (perspective × interrogative) as the **completeness coordinate** so requirements,
   skills, and framework controls share one address space? If so, how do grid
   coordinates attach to ontology classes?

>>> CLARK [§7.5 — decide separately, don't fold into this contract]
Adopting a perspective × interrogative grid as the shared completeness address space is a
real architectural commitment — a good idea worth its own evaluation. I don't want to
rubber-stamp it inside a definitions doc; let's give it a dedicated pass.
<<<

6. **Frameworks/standards** — where the catalog of frameworks (the pass/fail "Why")
   lives and how controls map to holon cells.

---

## 8. References (current substrate model — for Clark/Gabriel to read)

These embody the *starting* definitions; they are inputs to Clark's ratification,
not the authority.

- Holon / hologram pipeline: `backend/substrate/rdf_hologram.py`
- Shared ontology vocabulary: `backend/substrate/rdf_vocabulary.py`
- ZeroBias shared-ontology seam + `PartyTypeEnum` grounding: `backend/substrate/zb_seam.py`
- Signed RDF export / verify-yourself: `backend/substrate/rdf_export.py`, `docs/demo/verifier/`
- RDF Compass invariants + checklist: `backend/substrate/rdf_compass.py`, `docs/reviews/rdf-compass-checklist.md`

---

>>> CLARK [bottom line]
Net: it makes sense and it's well-aligned — yes to the structure, the three invariants, and
the conformance model. To ratify, fold in: (1) the INV-1 holon-vs-engagement split [two
Systems, one seam], (2) the authority/namespace reframe [ZB owns schema-of-record + canonical
namespace], (3) the §7.3 axis fix, and drop in C-5. Treat AuditCrowd-naming and the Zachman
grid as their own short threads. Happy to do a quick three-way pass with Gabriel on the
holon-vs-engagement surface (INV-1) since it touches the viz directly.
<<<

*Draft prepared 2026-06-17 as a starting point for Clark to own and ratify. Once
ratified, the SHACL profile becomes the machine-checkable source of truth and the
RDF Compass the gate for every shape-touching change across all three workstreams.*
