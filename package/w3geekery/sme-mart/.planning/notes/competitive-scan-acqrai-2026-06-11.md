# Competitive / Market Scan — AcqrAI (acqrai.com)

> **Scanned:** 2026-06-11 (Clark). **Type:** market observation + catalog-pattern input for the existing Product-Listing work.
> **Reconciled:** 2026-06-11 against `ServiceOffering` + the v1.5 "Matchmaking + Product Listing" milestone + DECISIONS.md (no-marketplace-tiers; Products-vs-Services nav split). This is NOT greenfield — see "Where this fits existing plans."
> **Net contribution:** AcqrAI surfaces a **third Product subtype — content/knowledge packs** (prompt packs, checklist libraries, framework-mapped templates) — that the current "Products = apps + agents" framing doesn't yet name. That's the genuinely new input for the P33 product-vs-service discriminator / `ServiceSegment` discussion.

## What AcqrAI is

A **content + prompt library for U.S. DoD acquisition professionals** (contracting officers, procurement specialists). NOT a platform or an agentic system — a curated knowledge hub of pre-built AI prompts, checklists, templates, and clause libraries that the user feeds into *agency-authorized* AI tools (NIPRgpt, CAMOgpt) rather than running its own model.

- Six content categories: Contract Review, Price Analysis Toolkit, IP Rights Framework, Meeting Documentation, Contract Templates, PWS Compliance Guide.
- All aligned to **FAR/DFARS**.
- Hard data-sovereignty story: **"all operations run on your machine, zero external API calls, no data leaves."** In a defense context that *is* the moat — it's how you get adopted inside secure environments where SaaS is a non-starter.

**Honest read:** thin-but-sharp. Low technical depth, high domain depth. The value is *encoded domain expertise* (a SME who knows FAR/DFARS turned it into reusable prompts/checklists) + a sovereignty posture that fits a paranoid regulated buyer.

## Where this fits existing plans (reconciliation)

Productized-listing already has a home and active decisions. AcqrAI is an *input* to in-flight work, not a new proposal:

- **`ServiceOffering` is the existing listing entity** — one of the 8 migrated Pipeline+GQL classes (UUID `ff689173-…`). Currently *generic*; `pricing_type` already carries `subscription` / `fixed`; **pricing is seller-defined per offering.**
- **Current milestone is "v1.5 Matchmaking + Product Listing"** (PROJECT.md / ROADMAP.md). *Committed* v1.5 = profile re-home (P33) + matchmaking loop (browse → RFP → bid → accept-and-link, P34–35). **Product-Listing pricing + the P29 display layer are explicitly DEFERRED out of committed v1.5** (PROJECT.md:21; Phase 29 deferred v1.4 → v1.5 → still parked).
- **The live open design question is the one AcqrAI speaks to:** DECISIONS.md:1036 (Clark, 2026-06-01) — nav likely **RFPs / Services / Products**, where **Products = apps + agents**, **Services = bespoke**; "needs a product-vs-service discriminator on `ServiceOffering` (current model is generic)."
- **`ServiceSegment` / `ProviderServiceSegment`** is the categorization (taxonomy) axis, and **"§7 open decision #1 ServiceSegment A/B" is a CI build-breaker** being resolved in P33 discuss-phase (`director/profile-migration-mapping-2026-06-08.md` §7; ROADMAP.md:27). The taxonomy mechanism is in active flux right now — don't propose a parallel one. **Leading direction (Clark, 2026-06-11, NOT yet settled):** mint services in the **`zb-forks/org/segments`** repo and map `ServiceOffering` to those, rather than introduce a new SME-Mart entity. Treat as pending until Clark confirms; the catalog-taxonomy and framework-badge patterns below should bind to whatever the segments repo exposes, not a new local class.

**Two settled constraints any catalog idea MUST respect (DECISIONS.md):**

1. **No SME-Mart-internal pricing tiers.** Monetization = a ~3% toll-booth cut (AWS/Shopify pattern); sellers set their own pricing per `ServiceOffering`. The old "Free / Growth $99 / Enterprise $999" placeholders were **killed** and ServiceOffering seeding deferred pending Brian. Reintroducing Free/Pro/Enterprise marketplace tiers is a **named anti-pattern** (DECISIONS.md:105–107, 218–247). Any "subscription pack" framing below means a *seller-defined* recurring price (`pricing_type: subscription`), never a marketplace tier.
2. **Display layer (P29) is parked.** Tier/ToS/branding surfaces have nothing to surface yet and are not committed for v1.5.

## Relevance to SME Mart

1. **It names a missing Product subtype: content/knowledge packs.** The current Products framing is "apps + agents" (DECISIONS.md:1036). AcqrAI is proof of market for a *third* kind of `ServiceOffering` — packaged compliance content (prompt packs, checklist libraries, framework-mapped template sets) authored by vetted SMEs, sold as an artifact rather than a bespoke engagement. This is the concrete input for the product-vs-service discriminator decision.
2. **Opposite end of our spectrum.** AcqrAI = static curated content you self-serve. SME Mart = vetted experts + continuous, entangled Req<>Sat assessment. They're a checklist; we're the live compliance graph. Overlapping buyer: compliance/procurement teams who need both the templates *and* someone accountable to attest the work was done.
3. **Sovereignty signal is real.** Regulated buyers won't send evidence to external servers. Our transparency-architecture posture ("evidence stays in your boundary; only signed claims cross org lines") is exactly what that market demands — we're already architecturally aligned.
4. **FAR/DFARS/OSCAL precedent.** RDF-COMPASS §2 already lists OSCAL + framework-specific SHACL packages as coverage extensions. AcqrAI is proof that "framework-specific compliance content" is a populated, monetized niche, and the framework-pack-as-SHACL-profile idea has market precedent. Adjacent backlog: CE8 (publishable SLA template), BACKLOG-107 (GRC Finding deliverable), BACKLOG-105 (GRC toolkit / OSCAL interop).

## The catalog pattern (as observed)

| Layer | AcqrAI implementation |
|---|---|
| **Primary taxonomy** | Six top-level *category cards* in a grid; each card -> dedicated resource page. |
| **Item metadata** | Title; single-sentence value-prop descriptor; secondary feature tags (e.g. "Review / Compliance / FAR-DFARS"); a capability badge ("AI Prompt Available"); a quantified-abundance signal ("15+ checklists," "20+ templates"). |
| **Packaging** | Bundled *by category*, not sold à la carte. Breadth-of-assets framing ("X+ items") over per-item granularity. |
| **Discovery** | Card grid, browse-by-category. No search/filter UI. No tiers/pricing shown — all universally accessible. |
| **Attribution / versioning** | **None shown** — no author, version, or contributor metadata. (A gap, not a virtue — see below.) |
| **Trust posture** | Local-first / zero-external-calls messaging carried as a first-class catalog message, not buried in fine print. |

**UX paradigm:** templated-marketplace — breadth of pre-built assets + simplicity + a security message, over sophisticated search/filter.

## Patterns worth incorporating (mapped onto our existing model)

What to borrow:

1. **Content-pack as a `ServiceOffering` subtype.** Don't invent a new "Product" entity — extend `ServiceOffering` with the product-vs-service discriminator already on the table (DECISIONS.md:1036), and let "content/knowledge pack" be a value alongside app / agent / bespoke-service. AcqrAI shows there's a market for the artifact alone.
2. **Category-card taxonomy as the browse entry — via `ServiceSegment`.** A small, legible top-level taxonomy (by framework / compliance domain / artifact type) with category cards -> listing pages is a good default for a young catalog before search maturity. The taxonomy carrier is `ServiceSegment`/`ProviderServiceSegment` — feed this into the P33 §7 ServiceSegment decision rather than standing up a parallel category mechanism.
3. **Capability badges + framework-alignment tags on each card.** "AI-ready," "FAR/DFARS," "SOC2," "NIST 800-53" as scannable badges. Maps cleanly to our framework-pack / SHACL-profile concept (RDF-COMPASS §2) — an offering can declare which framework(s) it serves, which is also a filter axis and a future SHACL-profile link.
4. **Quantified-abundance signal, honestly.** "12 controls covered," "30 mapped requirements" gives a buyer a size sense at a glance. Useful *if* backed by real metadata, not marketing inflation.
5. **Trust/sovereignty as a catalog-level message.** Our differentiator: surface "vetted SME," continuous-assessment status, and the boundary/disclosure posture on the listing itself — the thing AcqrAI structurally *can't* offer.

What to deliberately NOT copy (where we beat them):

- **Their missing attribution/versioning is a defect for us, not a model.** Every SME-sold offering MUST carry **author (vetted SME identity), version, and provenance** — our entire trust premise, compass-load-bearing (PROV-O / hash-chained Records, RDF-COMPASS §3.4, C-3). A versionless, authorless artifact is a non-starter on SME Mart.
- **Don't ship "static content dump" as the ceiling.** A content-pack offering should be able to *link into* the live Req<>Sat assessment flow (e.g. a checklist instantiates as demand-half Requirement tasks), not just sit as a downloadable. That's the bridge from AcqrAI's static model to our continuous-compliance model — and the tie to [[BACKLOG-123]] (project-scoped Requirements) and the entangled-pair invariant.
- **Don't skip filter/search past MVP.** Category cards are fine to launch; a vetting marketplace needs framework/domain/SME-credential filtering early (cf. BACKLOG-090 credentials filter row) because trust attributes are the buying criteria.
- **No marketplace tiers.** (See settled constraint above — DECISIONS.md:105.)

## Compass / architecture implications

- A content-pack `ServiceOffering` must stay RDF-serializable (C-2): typed fields, framework-alignment as predicate-nameable links (toward SHACL-profile references), author as a Party UUID (C-4), version anchor explicit. No mixed-axis "category string" — use the `ServiceSegment` link, not a free-text category.
- Offering **provenance + versioning** ride the graph (PROV-O / Records, C-3) — never inside the artifact body. (Cf. [[035-doclang-evidence-payload-spike]]: same content-vs-claim seam — artifact body is the leaf; attribution/version/entanglement live in the graph.)
- A content-pack that instantiates Requirement tasks must preserve the **entangled demand/supply pair** (C-1) when it lands in an engagement.

## Open questions — reframed as inputs to live decisions (not new asks)

These feed decisions already in flight; they are not net-new Brian asks:

1. **Product-vs-service discriminator (DECISIONS.md:1036, P33 §7):** does the discriminator's value set include **content/knowledge pack** as a peer of app / agent / bespoke-service? (AcqrAI is the evidence it should.)
2. **Does a content-pack instantiate into the live assessment flow** (preferred — closes the loop to Req<>Sat / [[BACKLOG-123]]), or is it a sold download (AcqrAI-style, weaker)? Design choice for whoever picks up Product-Listing after P33.
3. **Packaging shape on `ServiceOffering`:** flat artifact sale vs. bundled-with-engagement vs. *seller-defined* `pricing_type: subscription` for a maintained/updated pack. The maintained-pack (recurring) variant aligns with continuous compliance — but pricing stays seller-defined (no marketplace tier; DECISIONS.md:105).

## Cross-references

- **`ServiceOffering`** — existing listing entity (8 migrated Pipeline+GQL classes; MILESTONES.md:51; UUID `ff689173-…` per DECISIONS.md:160).
- **DECISIONS.md** — §105–107 (toll-booth model; no marketplace tiers; seller-defined pricing — *the* constraint), §218–247 (ServiceOffering tier-seeding deferred pending Brian), §1036 (RFPs/Services/Products nav + product-vs-service discriminator), §426–443 (Phase 29 display layer deferred).
- **PROJECT.md** — v1.5 "Matchmaking + Product Listing" (committed vs deferred scope, line 21); **ROADMAP.md** — v1.5 Phases 33–35; Phase 29 deferred (line 122, 550).
- **`director/profile-migration-mapping-2026-06-08.md` §7** — open decision #1 ServiceSegment A/B (CI build-breaker; resolve in P33 discuss-phase).
- [[035-doclang-evidence-payload-spike]] — same content-vs-claim seam (artifact body = leaf; attribution/provenance = graph).
- `.planning/docs/RDF-COMPASS.md` — §2 (OSCAL + framework-specific SHACL packages), §3.4 (append-only Records / PROV-O), §4 (C-1..C-5).
- Backlog adjacents — **CE8** (publishable SLA contract template; BACKLOG.md:182), **BACKLOG-107** (GRC Finding deliverable schema), **BACKLOG-105** (GRC toolkit / OSCAL / plugin-marketplace interop), **BACKLOG-090** (Seller Credentials Catalog + filter row), **BACKLOG-123** (project-scoped Requirements — the instantiate-into-assessment tie).
- `.planning/notes/sme-mart-resource-types-summary.md` — resource/listing type inventory.
- memex: *SME Mart is the ZeroBias Transparency OS commerce engine*; *Transparency Center — controlled multi-party disclosure layer*.
- External: acqrai.com (scanned 2026-06-11).
