# RDF-COMPASS — Long-term RDF/SHACL/OWL Final-State Alignment

> **Status:** ACTIVE COMPASS (durable, slowly-changing). Designs and plans for SME Mart that touch Engagement / Project / Task / Vetting / Record data shapes MUST satisfy the constraints below to preserve a clean migration path to the RDF/SHACL/Holon final state described in Brian's 2026-05-19 directive.
>
> **Last updated:** 2026-05-19
> **Source of vision:** `.claude/handoffs/shacl-owl-holon-quantum-overlay-2026-05-19-fixed.html` (Clark, 2026-05-19, answer to Brian's 2026-05-19 ask)
> **Primary stakeholders:** Brian (CEO directive), Kevin (CIO platform-side), Nic (GQL), Clark/W3Geekery (SME Mart consumer)

---

## 1. The Vision (one paragraph)

The W3C ontology stack — **OWL 2 + SHACL 1.2 + RDF (+RDF-star)** — is the **language we describe our model in, not the runtime we replace it with**. ZB AuditgraphDB stays the schema of record. But every Engagement, every Project, every Vetting Requirement, every Task, every Record we produce must be **shape-able into a versioned RDF/JSON-LD/Turtle container** that carries the full audit trail of a cross-org assessment — transportable, signable, projectable. Each **Engagement** is the **seam** between two parties' policies (Layer 2) bound by ZB Platform invariants (Layer 1), and the engagement-scoped Requirement registry is jointly authored and versioned as a **SHACL profile** that both parties pin to. Each party's **Boundary + scoped Resources + Rules** is a **Holon** (named sub-graph in the ontology). The validated state of that Holon at time T is a **Hologram** — projectable onto any rendering surface (2D dashboard, 3D world model, audio brief, time-series compliance movie). The **acceptance_primitive** on each Requirement (conjunction / precedence / disjunction) is the **measurement operator** that collapses the entangled demand-half + supply-half task pair into a definite contract state. Hash-chained Records on top of PROV-O give tamper-evident provenance. The **Multi-Protocol Gateway** speaks Turtle / JSON-LD / N-Quads / TriG via content negotiation — Records cross between orgs as RDF, but the rest of each org's data stays sovereign.

**Final deliverable shape (per Brian, 2026-05-19):** an **agreed-upon JSONL / RDF container** for an entire engagement assessment — every Project, every Task, every Vetting Requirement, every Record, every hash-chained provenance link, every party Boundary — transportable as a single signed package between orgs and their downstream auditors / regulators / partners.

---

## 2. ZB ↔ W3C vocabulary mapping (canonical pairs)

ZB stays canonical (schema of record). W3C vocabulary is the publication / validation / federation language.

| ZB concept (canonical) | W3C / standards analog | What we gain by naming it |
|---|---|---|
| **Requirement** (the contract) | `owl:Class` + `sh:NodeShape` | Both a concept (OWL — "what IS an access-control requirement?") and a shape (SHACL — constraining its tasks). Child Requirements = `sh:node` recursion. |
| **Assessment** | `sh:ValidationReport` | Direct match. Carries `sh:conforms`, `sh:result` (severity · focusNode · value) — pass/fail/inconclusive + evidence refs. |
| **Record** (hash-chained, append-only) | RDF + **PROV-O** (`prov:Activity`, `prov:wasGeneratedBy`) | RDF carries the data. PROV-O carries lineage. Hash chain layers tamper-evidence on top of standard W3C provenance. |
| **acceptance_primitive** (conjunction · precedence · disjunction) | `sh:and` / `sh:xone` (ordered) / `sh:or` | Lexical match. Conjunction default = SHACL's default AND of property shapes. |
| **Boundary Manager** (scope · policy · RACI) | SHACL Property Shapes + Rules | Each "check" is a SHACL constraint. SHACL Rules (2026 spec) derives new facts (e.g., "if both halves accepted → Requirement satisfied"). |
| **Engagement** | **SHACL Profile** (packaged · versioned · jointly authored) | Both parties pin to a version. SHACL 1.2 Profiling spec is built for this. |
| **Transparency View** | SHACL ValidationReport renderer + provenance viewer | Open-source renderers exist (TopBraid, Apache Jena, RDF4J). |
| **Multi-Protocol Gateway** | RDF content-negotiation + signed serializations | Turtle, JSON-LD, N-Quads, TriG. Records cross orgs as RDF. |
| **Boundary + scoped Requirements + Resources** | **Holon** (named sub-graph) | A Boundary IS a Holon: container + rules + contents. Naming makes self-similar nesting (Boundary inside Boundary inside Engagement) explicit + assessable. |
| **Transparency surface** (at a moment in time) | **Hologram** (validated sub-graph projection) | Holon × Assessment × time, projected onto a surface. Time-series of Holograms = stateful audit trail. |
| **Engagement seam · demand-half task · supply-half task** | Entangled task pair · `acceptance_primitive` = measurement operator | Paired by Requirement id; neither half has a definite "accepted" state until joint measurement; collapse = Record emission. |

**Coverage extensions (plug-in SHACL packages on the Engagement profile):**

| Concern | Ontology / vocabulary |
|---|---|
| Commerce · permissions · obligations · prohibitions | **ODRL** (W3C Recommendation) |
| Legal · GDPR · jurisdictional compliance | **DPV** (Data Privacy Vocabulary, W3C) + smashHitCore + DSAP |
| Data sharing agreements | DSAP + ODRL + DPV composition |
| Payment · billing · settlement | ODRL duty + Schema.org `PaymentMethod` / `MonetaryAmount` |
| Security frameworks (SOC2 · DISA STIG · CIS · NIST 800-53) | **OSCAL** (NIST) + framework-specific SHACL packages |

---

## 3. Non-negotiable constraints for SME Mart designs

These are the constraints any new SME Mart design — Engagement provisioning, Project hierarchy, Vetting, Tasks, Records, Boards — MUST preserve so that nothing we ship blocks the future RDF/SHACL/Holon overlay.

### 3.1 Data shape must be RDF-serializable
Every entity field must be expressible as RDF triples (subject–predicate–object). No fields that depend on positional ordering, no fields whose meaning is implicit in their UI rendering, no fields that mix multiple semantic axes into a single string. If a field can't be named with a predicate URI, it shouldn't exist.

### 3.2 Engagement = the seam, Party = the boundary
Every Engagement is the seam between exactly two Parties (demand-side + supply-side). Every Project / Task / Vetting Requirement / Record under an Engagement must carry an unambiguous **party-scoping** signal (the Party UUID that owns it, OR the Party UUID it answers to). Without this, Holon projection (each party's view of the engagement) can't be computed.

### 3.3 Entangled-pair structure must survive any Task refactor
Every Vetting Requirement (and any future Requirement-class entity) decomposes into a **demand-half task + supply-half task pair** linked by Requirement id. The pair is the unit of measurement; the `acceptance_primitive` is the measurement operator. Any Task model refactor that loses the pairing (e.g., flattening into independent unlinked tasks) breaks the OWL/SHACL framing.

### 3.4 Records are append-only + hash-chain-friendly
Records (the audit-trail artifacts emitted on Requirement state transitions) must remain append-only with content-addressable hashes. No in-place mutation; no soft-delete that erases prior states. PROV-O attribution must be preserveable on every Record.

### 3.5 Engagement-pinned SHACL profile is versioned
The set of Requirements an Engagement uses (the Vetting checklist + any extension SHACL packages) is **pinned by version** at engagement creation. Template upgrades are deliberate. Both parties agree to a version. Don't build UIs or provisioners that silently mutate the active Requirement set under a live engagement.

### 3.6 No information-loss serialization round-trip
The provisioner-emitted Engagement+Project+Task data must round-trip through RDF/Turtle/JSON-LD **without information loss**. If you can't serialize a field to a triple and deserialize it back to the same value, the field shape is wrong.

---

## 4. The Director / plan-phase compass checklist

At every plan-phase, at every Director design review, at every backlog refinement that touches Engagement / Project / Task / Vetting / Record shapes, ask these 5 questions:

| # | Check | Pass criterion |
|---|---|---|
| **C-1** | Does the design preserve the **entangled demand-half + supply-half task pair** structure? | Every Requirement decomposes into exactly 2 linked tasks (or N matched pairs); none are orphaned. |
| **C-2** | Does every field round-trip cleanly to **RDF triples** without information loss? | Fields are typed, atomic where possible, predicate-nameable. No mixed-axis strings, no positional ordering. |
| **C-3** | Are Records **append-only + hash-chainable**? | No in-place mutation paths; PROV-O attribution preservable; tamper-evidence intact. |
| **C-4** | Is **party-boundary scoping** present so the Holon projection is computable? | Every entity under an Engagement carries Party UUID (or is unambiguously inferable from the parent). |
| **C-5** | Is the engagement-pinned **SHACL profile / Requirement set version** explicit? | The Requirement registry has a version anchor at engagement creation; UI does not silently swap versions under live data. |

A design that fails any check needs explicit remediation before it ships, OR an explicit Director-level "accept the gap, file a debt entry" call (entered into BACKLOG with the constraint reference).

---

## 5. What we explicitly DON'T do yet (scope walls)

Building the RDF/SHACL gateway / triplestore / OSCAL binding is **platform-team work** (Kevin / Nic / Brian / Brian Ruf), NOT SME Mart frontend work. SME Mart's job is to be **ready to consume** when those land, by not painting corners.

Specifically, in SME Mart we do NOT:

- **Replace AuditgraphDB with a triplestore.** ZB AuditgraphDB stays the schema of record. OWL/SHACL is publication/validation/federation language, not runtime DB.
- **Run full OWL reasoning in the hot path.** Use it design-time / publish-time only. Most "is this Requirement satisfied?" answers are faster against the canonical relational schema.
- **Lock to SHACL 1.2 Node Expressions.** Still First Public Working Draft (Jan 2026). Core + Rules + Profiling are the stable surface to commit to.
- **Write the OWL/SHACL artifact before ZB schema lands.** Requirement / Assessment / Record need to settle in AuditgraphDB first; the W3C artifact is downstream.
- **Build the Multi-Protocol Gateway RDF endpoint.** That's platform-team scope.
- **Build the OSCAL → SHACL binding.** That's a spike likely owned by Kevin / Nic / external consultants.
- **Oversell the quantum framing externally before substrate path is concrete.** Internal narrative: precise and motivating. External (regulator / auditor): lead with SHACL/OWL/RDF — quantum is a parenthetical for now.

---

## 6. How this compass surfaces across the project

This doc is the single canonical compass. Cross-references that make it niggle at every level:

- **`/CLAUDE.md`** (SME Mart project root) — one-line link in the LOCKED-decisions / non-negotiables block so it loads in every session.
- **`.planning/director/DIRECTOR-PARKS-RESUME.md`** — Quick-start-prompt section reminds Director to apply the compass checklist at plan-phase / design review.
- **basic-memory `zerobias/integration/rdf-final-state-compass.md`** — cross-project memory entry pointing here; surfaces in any Claude session, any project, when relevant.
- **Future `meta/roles/director-parks.md`** (basic-memory) — role clause: "Director Parks maintains the RDF compass; reject backlog scope that paints corners without explicit debt entry."
- **BACKLOG entries** — anything that touches the compass-relevant entities (Engagement / Project / Task / Vetting / Record / Board) should reference this file in its scope section + note compass implications in open questions.

---

## 7. Open questions (to evolve this doc)

These need resolution as the RDF/SHACL/Holon framing matures. They don't block any current phase; they shape future ones.

1. **Holon / Hologram vocabulary adoption** — schema-of-record (new ZB entities) vs narrative-only (external pitch language only)? Brian/Kevin/Nic decision per handoff section 9 item #6. Filed as BACKLOG-110.
2. **Engagement-pinned SHACL profile versioning** — does ZB platform support per-engagement profile versioning today, or is that platform-team gap?
3. **PROV-O integration on Records** — when does ZB Records gain PROV-O attribution surfaces? Affects how Records are emitted from SME Mart provisioner / Vetting workflows.
4. **Mirrored Engagement+Vetting shape** — locked as **Option 3 (single Vetting Board, perspective-aware projection)** per 2026-05-19 Director decision. Confirms compass C-1 (entangled-pair preserved) + C-4 (party-boundary scoping via per-task direction tag). Filed as BACKLOG-108.
5. **`platform.Board` boardType + soft-delete behavior** — clarify with Kevin (Director-side Brian/Kevin findings list items #10, #11).
6. **JSONL container shape** — Brian's "final deliverable" framing references JSONL/RDF. Is the container JSONL-of-RDF-quads, JSON-LD, TriG, or something else? Pending platform-team spec.

---

## 8. Living-doc rules

- This is a **compass**, not a spec. It points; it doesn't prescribe.
- Update when new W3C / OSCAL / Brian-directive signal lands that materially shifts the constraints or vocabulary mapping.
- Don't add new constraints lightly — every constraint becomes a plan-phase gate.
- When a constraint is operationalized via tooling (e.g., a lint rule, a schema validator), reference the tool here.

---

**See also:**
- `.claude/handoffs/shacl-owl-holon-quantum-overlay-2026-05-19-fixed.html` — source of vision (Clark's overlay doc, May 2026)
- `.claude/handoffs/transparency-center-entangled-tasks-2026-04-21.html` — Hierarchy Editor + entangled-task framing predecessor
- BACKLOG-108 (mirrored Vetting Option 3 — applies compass C-1 + C-4)
- BACKLOG-109 (RDF readiness constraint for SME Mart provisioner / data shapes)
- BACKLOG-110 (Holon/Hologram vocabulary adoption — Brian/Kevin/Nic ask)
