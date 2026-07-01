---
id: "035"
priority: medium
scope: sme-mart (evidence-payload evaluation) -> platform feature-requests (evidence pipeline) -> Projects App (eventual)
effort: medium (spike)
found: 2026-06-10
status: open
promoted_to: null
---

# DocLang as Evidence-Payload Format Spike — evaluate against the RDF compass

## Goal (one sentence)

Evaluate whether **DocLang** (an AI-native, XML-based, tokenizer-aligned document representation format) is the right **canonical content-body format for compliance evidence artifacts** — the satisfaction-half payloads of Req<>Sat pairs — without letting it leak into the data model the RDF compass governs.

This is a **format-evaluation probe, not an adoption decision**. The output is a go/watch/no-go recommendation + a clear statement of the seam between "DocLang carries content" and "the ZB graph carries claim + provenance + entanglement," plus any platform feature-requests the evaluation surfaces (evidence-ingestion pipeline, region-scoped disclosure).

## What DocLang actually is (grounded in spec v0.6.0, verified 2026-06-10)

- **XML content-representation format** for unstructured documents: `<heading>`, OTSL `<table>`, `<formula>` (raw LaTeX), `<code>`, `<field_region>`/`<field_item>`/`<key>`/`<value>`, bounding-box `<location>` geometry, `<thread>`/`<page_break>`/`<xref>` fragmentation, `<custom>` namespace escape hatch.
- **Plain-text, diffable, version-control-friendly.** Deliberately token-cheap (~1000 syntax tokens max, common patterns pre-baked as single tokens) so an agent can read a whole evidence corpus without burning context.
- Apache 2.0, LF AI & Data Foundation governance, ISO track. Founders: IBM, ABBYY, Red Hat, HumanSignal, NVIDIA, Forgis. Conceptually adjacent to IBM Docling.

**What it is NOT (the decisive constraints):**
- **No provenance, signing, confidence, or source-attribution primitives.** It represents *what a document says*, not *who captured it, when, or how sure they are*.
- **No native audio/video** in the spec yet (the org markets multimodal; v0.6.0 doesn't deliver A/V).
- It is a **content format, not an inter-agent protocol** and not a claim/ontology.
- **Pre-1.0** (v0.6.0), early on the ISO track.

## The thesis under evaluation

Our seam is `requirement <> satisfaction` (compass C-1). The satisfaction side is increasingly (a) **evidence artifacts** and (b) **agent assessments** of them. DocLang lands squarely on (a) and must stay out of (b). The proposed three-part shape:

```
Requirement            (graph node; RDF/OWL Class + SHACL NodeShape)
  <> satisfaction-claim (graph node: agent/SME-authored; signed; confidence; PROV-O lineage)
       -> references ->  Evidence artifact (DocLang body: content-hashed, diffable, layout-preserved)
```

Claim + entanglement live in the RDF/hydra spine (where the compass requires them). DocLang is the **faithful, dumb content leaf** referenced by a graph node. It maps onto primitives we already have: a satisfaction artifact = a **File (DocLang content) attached to a Task that is ResourceLinked to a Requirement**.

## Why it might be worth it (the candidate wins)

1. **Continuous-compliance drift detection — the sharpest fit.** DocLang is structured, diffable XML, so periodic re-ingestion + diff yields "vendor retention policy changed §4.2 between June and September." That diff *is* a compliance event attachable to the Requirement. Makes "continuous" mechanical instead of aspirational; a flat PDF cannot do this.
2. **Evidence normalization layer.** SOC2 reports, policy PDFs, scanned attestations, config exports -> one canonical, layout-preserving, agent-readable body. Layout preservation matters for audit ("the control statement is in §4.2, here on the page").
3. **Inter/intra-agent evidence interchange.** A lossless-enough, token-cheap, deterministic/diffable representation of "what the document says" that collector-agent -> assessor-agent -> human-reviewer can all share and that two runs can be compared against (audit-defensible). Caveat below.
4. **Multi-org controlled disclosure (Transparency Center).** DocLang regions/threads/layers permit **structural-level redaction** — disclose counterparty org B threads 1-3 but not the rest. Disclosure scoped to DocLang sub-trees beats all-or-nothing PDF sharing — exactly what multi-org projects need. Adjacent to the `TaskTransparency` opt-in unknown in [[BACKLOG-033]].
5. **Marketplace deliverable loop-closure.** SME work products (gap assessments, policy drafts, audit reports) exported as DocLang feed continuous-compliance input directly — machine-readable, agent-round-trippable, no re-parse.

## Compass checklist (RDF-COMPASS §4, applied)

| # | Check | Verdict for "DocLang as referenced evidence leaf" |
|---|---|---|
| **C-1** | Entangled demand/supply pair preserved? | **PASS (by staying out of it).** DocLang is the satisfaction-half *payload*, not the pairing. The Req<>Sat link stays a graph edge. DocLang must never become the carrier of the pairing relationship. |
| **C-2** | Every field round-trips to RDF triples w/o loss? | **PASS as a leaf, FAIL if used as the model.** A DocLang body is referenced by a single triple (`satisfaction prov:used <evidence-uri>`) + a content hash. Its *internal* XML structure is opaque content, not graph fields — so it must not hold any field that needs to be a first-class predicate. Decision rule: anything queryable/assessable is a graph field; only the human-document body is DocLang. |
| **C-3** | Records append-only + hash-chainable? | **PASS, and reinforces it.** DocLang is plain text -> content-addressable hash is trivial; immutable bodies + new versions on change fit append-only + PROV-O attribution. Drift detection (win #1) is literally hash-diff over an append-only series. |
| **C-4** | Party-boundary scoping present (Holon computable)? | **PASS (in the envelope).** Party scoping lives on the graph node referencing the DocLang body, not in DocLang. Region/thread structure additionally enables per-party Holon *projection* of disclosed sub-trees (win #4). |
| **C-5** | Engagement-pinned SHACL/Requirement version explicit? | **N/A to DocLang; PASS by separation.** DocLang carries no Requirement-set semantics, so it cannot silently mutate a pinned profile. The version anchor stays where it belongs — on the Engagement profile, not the evidence body. |

**Net:** No compass check fails *as long as DocLang stays a referenced content leaf.* The one failure mode that would break the compass is **scope creep** — using DocLang's `<custom>` namespace to encode claims, confidence, party-scoping, or Req<>Sat pairing instead of putting those in the graph. That is the single design line this spike must protect.

## Risks / caveats

- **Pre-1.0 on the ISO track.** Betting core infra on it now is premature; betting it as a *swappable payload format* behind a content-hash reference is low-risk and reversible.
- **We supply all provenance/signing ourselves** — fine (that's ZB's layer per the compass), but it means DocLang gives us nothing on C-3/C-4 by itself; the envelope does the work.
- **No A/V in spec.** If agentic evidence includes call/screen recordings, DocLang isn't ready for that leg — carry those separately, do not block on DocLang.
- **Inter-agent caveat.** DocLang carries "what was read," not "what the agent concluded." Agent verdict + confidence + rationale ride in the graph claim node, NOT in DocLang. Conflating the two re-introduces a C-2 failure.
- **Production dependency.** Something must *produce* DocLang from source artifacts (a Docling-style conversion pipeline). That's a real pipeline dependency and likely platform-team scope, not SME Mart frontend.

## Spike output (the actual deliverables)

1. **Go / watch / no-go recommendation** on DocLang as the canonical evidence-body format, with the content-vs-claim seam stated explicitly.
2. **One round-trip proof:** take one real evidence artifact (e.g. a sample SOC2 section or policy PDF), convert to DocLang, reference it from a mock satisfaction-claim node + content hash, and confirm the graph fields round-trip to RDF triples while the DocLang body stays opaque (C-2 leaf test).
3. **One drift-diff proof:** two versions of the same artifact, show the structural diff surfaces a discrete compliance event (win #1).
4. **Platform feature-requests** the evaluation surfaces — expected candidates:
   - **Evidence-ingestion pipeline** (source artifact -> DocLang) — ownership likely platform (Kevin), parallel to the receiver pipeline.
   - **Region/thread-scoped disclosure** primitive — overlaps `TaskTransparency` opt-in ([[BACKLOG-033]]); DocLang sub-tree disclosure is a concrete shape for it.
   - **Content-addressable evidence-body storage + version series** (append-only, hash-chained) wired to Records / PROV-O.

## Dependencies / caveats

- **Sequencing:** this sits *downstream* of the Requirement/Assessment/Record entities being [PLANNED] (transparency-architecture §10.1). Evidence-payload format only matters once there's a satisfaction-claim node to hang it on. Do not promote ahead of [[BACKLOG-033]] proving the Req<>Sat mechanics.
- **Verify live before building anything:** whether File attachments + ResourceLink-to-Task is the right carrier on UAT (LOOK FIRST). Confirm FileService can store an arbitrary text body and expose a stable content hash.
- **Do NOT** prototype DocLang as a data model, a triplestore input, or a claim format. It is evaluated strictly as a referenced content leaf. Any prototype that puts compass-relevant semantics inside DocLang is out of scope and a compass violation.
- **Watch the spec to 1.0** before letting DocLang leak into anything structural; payload-only adoption is the only posture this spike endorses.

## Cross-references

- `.planning/docs/RDF-COMPASS.md` — §3.1 (RDF-serializable), §3.4 (append-only Records), §4 (C-1..C-5 checklist applied above), §5 (scope walls — evidence pipeline is platform-team work)
- [[BACKLOG-033]] — Transparency / Vetting Scenario Spike (Req<>Sat entangled-task reference; `TaskTransparency` opt-in unknown that region-scoped disclosure feeds)
- DECISIONS **D-52** (governance-node model) + **D-53** (deep-real-time-vetting central; execution surface -> Projects App; SME Mart keeps pre-engagement trust signal)
- zb-dx `architecture/transparency-architecture.md` §8 (entangled Req<>Sat pair), §10 (Requirement/Assessment/Record [PLANNED])
- memex: *SME Mart core transparency invariant — task entanglement is the only data seam*; *RDF Final-State Compass*; *Transparency Center — controlled multi-party disclosure layer*; *AuditgraphDB data lifecycle*; *zb-file-upload-sdk-reference* (FileService for attachment carrier)
- External: github.com/doclang-project/doclang (spec.md, v0.6.0, Apache 2.0)

## The routing question this sits behind

DocLang only earns a milestone slot once the **satisfaction-claim node exists** (downstream of [[BACKLOG-033]] / Requirement-Assessment-Record landing). Until then this is a parked evaluation: the value is having the content-vs-claim seam decided *before* agentic evidence-gathering volume arrives, so we don't retrofit a format choice under load. Promote when either (a) [[BACKLOG-033]] proves Req<>Sat mechanics and evidence volume is imminent, or (b) the platform evidence-ingestion pipeline gets prioritized and needs a target format.
