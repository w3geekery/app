# Standup — Crosswalks are advisory + milestone = baseline×%×time — 2026-07-01

**Time:** ~09:00 AM PT (standup) · **Source:** Teams (exported .txt)
**Participants:** Kevin McCarthy, Chris Scarola, Clark Stacer, Raghu
**Transcript:** `processed/2026-07-01-ui-standup-transcript.txt` (~15 min; recording joined mid-discussion, started as the group discussed the Frameworks panel on the Projects Readiness CMMC mock)
**Primary relevance:** zb/ui Boundary-Manager × Projects **mock** — directs the next round of Readiness-tab changes (Frameworks panel, crosswalk semantics, milestones).

## 1. Crosswalks are ADVISORY, not load-bearing (Kevin, emphatic + repeated)

- "They're advice. They're a **recommendation engine** that says, I think these things look the same, but you're still going to have to make that own mapping yourself."
- "Crosswalk to me is like **metadata**... ultimately someone's going to have to **choose** the way that I satisfy requirement X is with internal control Y. That'll be an **anchored, mapped-out thing.** Not flapping in the breeze or dynamic — it's a choice and it's mapped."
- "Those crosswalks ultimately are **not load-bearing.** They're **guard posts** — I think these things look the same."
- The reuse value: once you've mapped 3 frameworks, building the 4th, "the crosswalks will tell you, here's how we mapped the other three, so we can give you **advice** as to how you'd map them for the 4th. But that's all they are." → **accelerate cross-framework mapping, never auto-satisfy.**
- Chris (his framing to Clark): "when you choose this framework and you're linking to a boundary... based off the **lens** you want to look at, you can choose from these crosswalks to give you a **representation of what you probably can do.**" Kevin: "Correct, but **you still have to make the choice.**"

**Anchored satisfaction = the load-bearing thing.** Requirement ← internal-control mapping is a human, persisted choice. Crosswalks only *suggest* that choice.

## 2. Milestone = a baseline (framework+level) × target % × subset of elements × time period (Chris + Kevin)

- The old milestone system: to create a milestone you "**choose what baseline you're attacking and what percentage you're trying to hit** — what set of elements." Chris: "I think that **still holds.**"
- "When you want to look at a **lens**, you're really looking at it from a specific standpoint of a **baseline**, because that's what matters. This project is attempting **FedRAMP High**; this one's **FedRAMP Low** — very different, different subsets of elements." Kevin: "And they'd have **different time periods** too."
- Clark: had Claude read the current milestone model and project it (→ CAL-001); "that's going to go into the **Schedule tab**." Chris: "that's great."

**Implication:** a project's readiness is scoped to **one baseline/lens**; milestones are baseline-scoped % targets with dates, surfaced on the Schedule tab.

## 3. Direction for the mock (from the Frameworks-panel discussion Clark joined)

- The **Frameworks panel** on the Readiness tab is likely **replaced** by a **rollup of this project's framework + child projects' frameworks** (if any).
- **One framework "pinned" per project** (Clark's read of the room) — different baselines/lenses live in different (possibly child) projects, not multiple frameworks on one project.

## Team / tickets
- **Raghu** — task part 9 (seed the project creator as a **member**); had clarifying queries answered, expects to finish tomorrow. Needs more tickets queued.
- **Clark** — will pick a few more tickets and Slack them to Raghu.
- Chris/Clark: "settling in on something... as long as Brian can stay back" — keep pulling Brian back "just close enough to keep it going."

## Clark confirmations (post-standup)
- **One requirement product pinned per project** — yes; multiple baselines (FedRAMP High vs Low) = **sibling child projects**.
- **Frameworks panel → rollup** (leaf = single pinned; program = child rollup) — yes; **won't be called "Frameworks" anymore** (name TBD).
- **Crosswalks advisory** — yes; possibly a **new tab/panel for forecasting / scenario projections / "how do we compare with these other frameworks?"** (name TBD).
- **New Requirements mock** — yes; crosswalks may live there.

## Async follow-up — Brian (Slack, ~9:35–9:40 AM): "requirement products" generalization
- **Readiness (top-level + cascading) is measured via *requirement products*.** A compliance framework is one
  *type* of requirement product — a product an org produces that defines requirements you can be measured against.
- **Taxonomy = domain / sub-category / type:**
  - Cyber / compliance / assessment → SSDF, SOC 2, CMMC, FedRAMP (compliance framework products)
  - Cyber / technical standard → STIG, CIS, VM/container config hardening (tech-standard products)
  - Legal → licensing, EULA, terms
  - Financial → $$-spend / budget requirement products (**budget readiness**)
  - Clinical → standard of care
- **All are used to *measure* readiness** — compliance, budget/spend, legal, clinical. Each measurement
  **produces a dashboard** at its layer.
- **Entanglement = shared measurements.** The **Transparency Center** holds joint/shared **measurements +
  dashboards + alerts** at each layer, shared between two/multi parties. Entangled **project trees + tasks/subtasks**
  measure using requirement products and surface those in the Transparency Center (the shared info between parties).
- **Impact (initial read):** treat the pinned thing as a general "requirement product." **→ Corrected below.**

## Correction — "requirement product" === Framework (Kevin/Chris, Slack 9:49–9:58)
- Clark relayed Brian's requirement-product framing to Kevin/Chris.
- **Chris:** "That generally is what we said. We're only looking at it from frameworks; Brian has this crazy
  requirement-product thing. But it's the same — **1 per project**."
- **Kevin:** "a **Requirement is already a thing** — there is resource search for it (in plans if not reality).
  And a **Framework is also a thing (resource-wise) which is a collection of Requirements**."
- **Clark:** "so 'requirement product' === Framework." **Kevin:** "yes — that is the flag chooser, that is the
  **localized label**." (+ Kevin's joke: "declare Brian as a language… `en_bh`… localize things for him" — the
  serious core: the concept's UI label is an i18n string.)
- **Net:** NOT a new primitive. The pinned resource is a **Framework** (= collection of **Requirements**, both
  existing resources). Brian's "requirement product" + its legal/financial/clinical domains = a **localized label
  + Framework categories**. Durable generalization: a Framework can be non-compliance. Neutral panel name
  **"Readiness target"** sidesteps the label debate. Ingested → `BRIEF.md` §1b/§6/§7 + `DECISIONS.md` (corrected).
- **Custom feature — grounded (repos verified 2026-07-01):** there is **no `zerobias-org/requirements` repo.**
  The real precedent is **`zerobias-org/framework`** — a **monorepo** where each
  `package/<authority>/<framework>/<version>/` is one publishable framework package (cis/csc/v8_1, nist/800_207/v1,
  …; ~30 authorities incl scf, iso, nist, dod, owasp). It's already on the **gradle + `zbb`** publish pipeline
  (`zerobias-org/devops`), with **`examples/testvendor`** as the starter template and **`validateContent`** as the
  gate; auth via `ZB_TOKEN`. Siblings: `zerobias-org/standard`, `zerobias-org/crosswalk` (crosswalk pushed today —
  Daniel active). auditlogic mirrors (`framework_new`, `standard`, `crosswalk`). So "custom requirement product"
  = **add a framework package to this monorepo (or a customer-facing analog)** via the testvendor template + zbb
  `validateContent` gate + PR. Requirements aren't a separate repo — a **framework package IS a collection of
  requirements** (matches Kevin). **Only genuinely new piece = the LLM authoring skill** (prose → package). Backlog
  as "custom Framework authoring rails (on the framework monorepo + zbb)".

## Brian cont. (Slack 10:03–10:10) — marketplace + nesting
- **Products have publishers + are free or paywalled** ("some free, some paywall… sold and not sold"). → a
  Framework carries **publisher + sold/free marketplace status** (the `framework` monorepo `<authority>` =
  publisher; SME Mart = marketplace). One genuinely new attribute; surfaces in the **browse/add Readiness target**
  picker, not the CMMC exhibit.
- **Any domain** — yoga studio-ops / lesson / pose standards ("even a pose may have a standard… top-down and
  bottom-up"). Restates the non-compliance generalization; keep the mock CMMC-grounded.
- **Nesting / bottom-up rollup** — "products nest; bottom-up maps into top-down; if the pose standard isn't met
  you fail the sequence standard." = the **rollup we already model** (project-tree child rollup + framework
  element tree + task/subtask workflows). Not a new mechanism; "same as what we said" holds. Ingested → BRIEF §1b (cont).

## Action items
- [Director/zb-ui] **Verify frameworks-panel pivot with Clark** (this doc's §3) — **CONFIRMED** (see above).
- [Director/zb-ui] Ingest Brian's requirement-products input into BRIEF/plans — **DONE** (BRIEF §1b/§6/§7).
- [Director/zb-ui] Reframe **crosswalks in the Readiness mock** from load-bearing recompute-toggles → **advisory recommendation layer** over anchored requirement→control mappings.
- [Director/zb-ui] Rework **Frameworks panel** → single pinned framework + **child-project framework rollup**.
- [Director/zb-ui] Milestones exhibit → **baseline × target% × time period**, projected onto the Schedule tab (aligns with CAL-001).
- [Clark] Queue tickets for Raghu.
