---
id: "040"
priority: low
scope: sme-mart (agent-UI evaluation) -> platform / ZB SDK (agent-interaction strategy) -> Projects App (eventual)
effort: medium (spike)
found: 2026-06-25
status: open
promoted_to: null
---

# A2UI as Agent-Driven UI Protocol Spike — evaluate when an assistant surface exists

## Goal (one sentence)

Evaluate whether **A2UI** (Google's open protocol for agents to emit declarative, catalog-constrained UI as JSON) is the right way for SME Mart — or, more correctly, the **ZB platform/SDK** — to let AI agents render rich UI safely, **without letting it become a parallel rendering stack or a data carrier**.

This is a **trigger-gated evaluation probe, not an adoption decision**. SME Mart has no agent-generates-UI surface today, so the payoff is zero until one exists. The output is a go/watch/no-go recommendation, an explicit statement of the seam between "A2UI renders presentation" and "the ZB graph carries claim + provenance + entanglement," and a clear routing call on whether this is SME-Mart scope or platform scope (almost certainly the latter).

## What A2UI actually is (grounded, verified 2026-06-25)

- **Declarative JSON UI protocol.** An agent emits a flat list of components (ID-referenced) describing *intent*; the client renders with its **own native components**. MIME `application/a2ui+json`. Flat structure so an LLM can **stream it incrementally** (progressive render, no perfect-JSON-upfront).
- **Core concepts:** Surfaces (containers), Components (pre-approved widgets **from your catalog**), data binding, Actions (user interactions). Bidirectional: user -> agent -> A2UI JSON -> render -> interact -> agent responds.
- **Security model = the whole point.** Agents assemble only from a **vetted component catalog** — "safe like data, expressive like code." No arbitrary code execution, no UI-injection across trust boundaries.
- **Transport:** rides on **A2A**. Integration guides for **AG-UI / CopilotKit** and **MCP**. Ships an **A2UI Composer** visual editor.
- **Maturity:** Apache 2.0, Google-led + community. **v0.9.1 stable, v1.0 release candidate** ("early stage public preview"). ~15.5k stars. TS (66%) / Python (24%).
- **Renderers:** **Lit** is the demonstrated first-class web renderer. **Angular** is roadmap / "Theater examples" only. React roadmap. Flutter via GenUI SDK. Compose/SwiftUI planned.

**What it is NOT (the decisive constraints):**
- **Not a data model and not a claim/ontology.** It is a presentation + interaction layer. It must never carry Req<>Sat pairing, confidence, provenance, or party-scoping — those stay in the ZB graph (same scope-creep guard as [[BACKLOG-035]] / DocLang).
- **Not Angular-first today.** SME Mart is Angular 21 + ngx-library; A2UI's Angular renderer is immature, so adopting now = early-adopter on the exact renderer we need + a hand-built bridge from A2UI's catalog to ngx-library components.
- **Not a 3P-app-level decision.** Agent-UI strategy belongs in the ZB SDK/platform so all three 3P UIs (SME Mart, Readiness Center, Work Worlds) share one approach — same ownership logic as Engagement/Project/Task being platform-owned.

## The thesis under evaluation

If/when ZB agents produce UI (Brian going Claude-enabled; agents responding to tasks/notes; "use the construct to build the construct"), the choice is: (a) agents emit text only, (b) agents emit/execute code (unsafe across trust boundaries), or (c) agents emit **declarative, catalog-constrained UI**. A2UI is the leading open answer to (c), and (c) is the only option compatible with SME Mart's controlled-disclosure model.

Proposed seam if ever adopted:

```
ZB graph (RDF/hydra)   claim + provenance + entanglement + party-scoping   [authoritative]
  -> agent reads/writes graph, then ->
A2UI JSON              presentation + interaction only (catalog-constrained) [disposable view]
  -> client renderer maps to -> ngx-library / native components
```

A2UI is the **dumb presentation leaf**, never the carrier of anything the RDF compass governs.

## Where it could genuinely apply to SME Mart (ranked)

1. **In-app AI assistant that returns rich UI (the real fit).** Help a buyer narrow SMEs, walk a provider through vetting/profile capture, draft a requirement — agent assembles cards/forms/comparison tables from a vetted catalog instead of hardcoding every screen or trusting agent-generated code. Only lights up once an assistant surface exists.
2. **Cross-trust-boundary UI <-> the transparency invariant.** A2UI's headline problem ("how do agents safely send rich UI across trust boundaries?") rhymes with SME Mart's core model (only entangled tasks cross the seam; disclosure is controlled). A safe, declarative, catalog-constrained payload one org's agent presents to another (a vetting ask, an evidence request) is the same *shape* as the RDF-COMPASS / holon / portable-container thinking. Pattern alignment, not a today-build — and A2UI must stay presentation-only, never the disclosure data model.
3. **Dynamic / templated forms.** One existing-art answer to "declarative, server-described forms" — useful reference for the templated-onboarding-step system ([[BACKLOG-038]]) and the doclang-evidence spike ([[BACKLOG-035]]) even if not adopted.

## Compass relevance (RDF-COMPASS §4)

A2UI is a **presentation/transport layer, not a data model**, so C-1..C-5 are mostly **N/A** — *as long as it stays presentation-only*. The one intersection: the cross-trust-boundary disclosure framing (fit #2) is compass-adjacent, but the disclosure decision and party-scoping must live on the graph node, never inside the A2UI payload. **The single design line this spike must protect: A2UI carries what to render, never what is true.** Any prototype encoding claims/scoping/pairing in A2UI components is out of scope and a compass violation (identical failure mode to DocLang's `<custom>` namespace abuse).

## Risks / caveats

- **No producing surface yet.** Zero payoff until SME Mart (or the platform) has an agent emitting UI. Do not build ahead of that.
- **Angular renderer immaturity.** Lit is first-class; Angular is roadmap. Early-adopter risk on the precise renderer SME Mart needs, plus a catalog-to-ngx-library bridge to build/own.
- **Parallel rendering stack.** Adopting A2UI introduces a second way to render UI alongside hand-built Angular + ngx-library. Justified only by an agent-UI use case, not for static screens.
- **Platform-ownership.** A 3P app adopting unilaterally forks the approach. This is a Kevin/Nic platform-strategy flag (it intersects A2A/MCP, which are platform concerns).
- **v0.9.1 maturity.** Fine to prototype; not to put under production vetting/disclosure flows.

## Spike output (the actual deliverables)

1. **Go / watch / no-go recommendation** on A2UI as the agent-UI rendering path, with the presentation-vs-claim seam stated explicitly and the SME-Mart-vs-platform ownership call made.
2. **One render proof (only if an assistant surface is in scope):** stand up a tiny A2UI catalog mapped to ~3 ngx-library components (e.g. a card, a form field, a button) and render one agent-emitted A2UI payload in an Angular 21 harness — measure the bridge effort honestly.
3. **One trust-boundary sketch:** show how a cross-org agent payload would render the *disclosed* view only, with all party-scoping/disclosure decided on the graph node and A2UI carrying zero authority (compass guard demonstrated, not just asserted).
4. **Platform feature-requests / flags** the evaluation surfaces — expected candidates:
   - ZB SDK **agent-interaction + agent-UI strategy** (A2A / AG-UI / MCP alignment) — platform/Kevin-Nic scope, shared across the 3 UIs.
   - A **shared ZB component catalog** (the vetted widget set agents may assemble) — overlaps ngx-library.

## Dependencies / caveats

- **Sequencing:** downstream of any agent-produces-UI surface existing in SME Mart or the platform. Until then this is parked — the value is having the presentation-vs-claim seam and the ownership call decided *before* agentic UI volume arrives, not building speculatively.
- **Verify live before building anything (LOOK FIRST):** whether ZB platform/SDK already has an agent-UI direction (ask Kevin/Nic) — do not prototype a 3P-local approach that the platform will supersede.
- **Do NOT** prototype A2UI as a data model, a claim format, or a disclosure-control mechanism. Evaluated strictly as a presentation leaf. Watch the spec to 1.0 + Angular renderer maturity before letting it leak into anything structural.

## Promote-trigger

Promote when **either** (a) SME Mart gets an AI-assistant surface that needs to render structured UI, **or** (b) the ZB platform/SDK formalizes agent-driven interactions (A2A/MCP/AG-UI) and needs a UI-payload target, **or** (c) the Projects App / platform picks an agent-UI strategy and SME Mart needs to align. Until a trigger fires, this is a watch item — re-check A2UI maturity (v1.0 + Angular renderer) at promote time.

## Cross-references

- `.planning/docs/RDF-COMPASS.md` — §4 (C-1..C-5; A2UI is presentation-only so mostly N/A, but the cross-boundary framing is compass-adjacent), §5 (scope walls — agent-UI strategy is platform-team work)
- [[BACKLOG-035]] — DocLang evidence-payload spike (same scope-creep guard: format/presentation must stay a leaf, never carry compass-governed semantics)
- [[BACKLOG-038]] — Templated onboarding step system (declarative server-described forms — A2UI is adjacent existing art)
- [[BACKLOG-033]] — Transparency / Vetting Scenario Spike (controlled cross-org disclosure that fit #2 would render)
- DECISIONS **D-52** (governance-node model) + **D-53** (deep-real-time-vetting; execution surface -> Projects App)
- zb-dx `architecture/transparency-architecture.md` §3 (cross-trust-boundary seam), §8 (entangled task pairs), §10/§11 (RDF/SHACL/holon container — the portable-disclosure framing A2UI rhymes with)
- memex: *SME Mart core transparency invariant — task entanglement is the only data seam*; *SME Mart is the ZeroBias Transparency OS commerce engine*
- External: a2ui.org · github.com/a2ui-project/a2ui (Apache 2.0, v0.9.1; A2A transport; AG-UI/CopilotKit + MCP integration; renderers Lit/Angular-roadmap/React-roadmap/Flutter)
