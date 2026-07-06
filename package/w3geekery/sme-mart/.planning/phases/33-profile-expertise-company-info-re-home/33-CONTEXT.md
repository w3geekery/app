# Phase 33: Profile / Expertise / Company-Info Re-Home - Context

**Gathered:** 2026-06-25
**Status:** Ready for planning
**Source:** Synthesized from LOCKED director docs (express/ingest path) — `/gsd-discuss-phase` is intentionally OFF (design LOCKED; §7 all CLOSED). Green-lit by Director Parks in `director/GSD-PLAN-CHANNEL.md` (2026-06-25).

<domain>
## Phase Boundary

Re-home all provider profile/expertise + company-info UI off the legacy Neon/`MarketplaceProfileItem` (MPI) shapes onto the **typed GQL classes** published in schema PR #58 (+ PR #61), **org-scoped**, with **on-read** `CatalogService` name resolution and **per-claim** `verified`/`verificationSource` provenance.

**This is a migration, not a feature.** The matchmaking loop already exists; this phase relocates its data substrate. The whole migration is four structural shifts (see Decisions §"The structural shift") applied across the expertise junctions, the dissolved `ProviderProfile`, the 6 MPI section blobs, and the onboarding KV sections.

**The work centers on `core/services/provider-profiles.service.ts` (280 lines, already HALF-migrated), in two clean halves:**
- **Half A — reads (re-point existing code):** today queries MPI via `boundaryExecuteRawQuery` (`queryMpi` + `projectToDirectoryRow`/`projectToDetailRow`). Neon VIEWs (`v_provider_directory`/`v_provider_detail`) are ALREADY gone. Re-point to **GQL nested selections over `OrgProfile` + the 6 `Provider*` junctions + `Review` aggregates**, org-scoped. `ProviderDirectoryRow`/`ProviderDetailRow` dissolve into GQL types; names resolve via `CatalogService` on read (no denorm). Methods: `listProviders`, `searchProviders`, `getProvider`, `getProviderByUserId`.
- **Half B — writes (greenfield):** the **13 mutation methods are clean STUBS** today (`updateProfile` + `add`/`delete` × {Skill, Role, Product, Framework, Segment, ServiceSegment}) — each `throw 'not yet implemented for GQL-backed providers'`. Implement via `PipelineWriteService` → typed `Provider*` classes + `OrgProfile`/`Address`/`InsuranceCoverage`/`ClientReference`/`Personnel`/`FinancialProfile`, org-scoped (`orgId` not `provider_id`, `*Id` Catalog FKs, `verified`/`verificationSource`).

**In scope:** `provider.model.ts` rewrite, MPI model deletion, the service rewrite (both halves), `my-profile-expertise.component`, onboarding company-info sections + the 6-section corporate profile form, provider directory/search + profile-review read surfaces, the new `OrgSegment` onboarding classification step.

**Out of scope:** any net-new matchmaking surface (Browse/RFP/Bid = Phases 34/35); engagement minting; `ServiceOffering` pricing; provider operational fields (`hourly_rate`/`availability_status`/`response_time` — dropped for v1, §7 #3); the `bid-ai.service.ts` consumer of `parseViewJson` (out-of-scope; do NOT delete the helper blind — see Decisions).

**Discuss-phase is OFF.** The §7 open-decision list in the migration-mapping doc is CLOSED (all #1–#9 resolved 2026-06-23). Two PROF requirements carry stale "per the discuss-phase decision" language that is ALREADY ANSWERED — do not hunt for a discuss-phase (see Decisions §"Stale discuss-phase language").
</domain>

<decisions>
## Implementation Decisions (ALL LOCKED — do NOT re-open)

### The structural shift (the whole migration in four moves)
1. **provider-scoped → org-scoped.** Legacy junctions key on `provider_id` (FK to a `ProviderProfile` row). New junctions key on `orgId`. **`ProviderProfile` no longer exists** — it dissolves; expertise hangs directly off the platform Org.
2. **Denormalized names dropped.** New junctions carry ONLY the Catalog UUID FK (`skillId`, `roleId`, …) and resolve display names **on read** via `CatalogService` (the component already injects it; `find*` helpers already exist — wire them into `buildSections()`).
3. **`zerobias_<x>_id` → `<x>Id`.** Every Catalog FK renames (`zerobias_skill_id` → `skillId`, etc.).
4. **Per-claim verification provenance (D-53).** Every junction + typed class gains `verified` + `verificationSource`. Default on write: `verified=false`, `verificationSource=null` (asserted, not yet vetted).

Plus the read-path change: Neon VIEWs with JSON-string sub-arrays → native GQL nested queries; `ProviderDirectoryRow`/`ProviderDetailRow` dissolve into GQL selections over `OrgProfile` + junction collections + `Review` aggregates.

### Carrier decision (D-54, amended)
MPI-as-section+blob **DEPRECATES** → a NEW typed **`OrgProfile`** class (1:1, our schema) + existing typed credential classes (`SecurityCredential`/`UserCredential`/`OrgCredential`/`Review`) + the NEW typed classes (`InsuranceCoverage`/`ClientReference`/`FinancialProfile`/`Personnel`). Catalog **segment** junctions replace the dead `industry` idea (no `industry` field). `AppOrgProfile` stays read-only platform classification — do NOT author it from SME Mart, do NOT consolidate onto it.

### The 6 expertise junctions (`provider.model.ts` → 6 `Provider*` classes)
Each legacy provider-scoped interface → org-scoped class: `provider_id`→`orgId`, `zerobias_*_id`→`*Id`, `*_name`→dropped (resolve on read), snake_case→camelCase, + NEW `verified`/`verificationSource`. The six: `ProviderSkill`, `ProviderRole`, `ProviderProduct`, `ProviderFramework`, `ProviderSegment` (provider-CAPABILITY segment), `ProviderServiceSegment`. Field-level mapping is in migration-mapping §2 (canonical ref) — follow it exactly.

### `ProviderProfile` dissolution (migration-mapping §3)
No 1:1 successor; fields scatter: `headline`→`OrgProfile.tagline`; `about`→`OrgProfile.shortDescription`/`longDescription`; `zerobias_org_id`→`OrgProfile.orgId`; `display_name`/`avatar_url`/`slug`→READ from platform `dana.Org` (don't store); `rating_average`→derived from `Review` aggregate; `total_*`→derived/Ledger. Delete `ProviderProfile`, `ProviderDirectoryRow`, `ProviderDetailRow`.

### MPI sections → typed classes (migration-mapping §4)
`insurance`→`InsuranceCoverage` (clean 1:1), `reference`→`ClientReference` (low-fidelity map), `personnel`→`Personnel`, `financial`→`FinancialProfile` (1:1 per org), `corporate_identity`→`OrgProfile`+others, `attestation`→**RETIRED** (§7 #8). Onboarding KV sections → `OrgProfile`+`Address`+PKV (migration-mapping §5). `hq_location`→an `Address` row (`ownerType=org`, `ownerId=orgId`, `addressType=registered`/HQ, `isPrimary=true`; `street`→`street1`, `state`→`region`, `postal_code`→`postalCode`).

### §7 RESOLUTIONS (all closed 2026-06-23 — do NOT re-open)
- **#1 ServiceSegment → Option B (D-56).** Use the real Catalog Service segments (**133 `segmentType: service`** leaf nodes under 37 categories beneath the `d_svc` Services domain). Loader = `platform.Segment.list` filtered to `segmentType=service`; `CatalogService` resolves names on read. The 9 hydra `service-segment` tags are **RETIRED**. **No schema change** (field is already a Catalog FK). Open UX-only detail for UI-SPEC: category-browse vs flat picker for 133 options.
- **#2 `slug`** — dropped from the provider model; `dana.Org.slug` is required and already read app-wide. OrgProfile correctly defers.
- **#3 operational fields** — `hourly_rate`/`availability_status`/`response_time` **dropped for v1** (no typed home; rate belongs to a future per-`ServiceOffering` field).
- **#4 / #5 / #6 — drop:** `InsuranceCoverage` has no `limits`/`deductible`; `Personnel` has no `yearsExperience`; `FinancialProfile` has none of `profitMargin`/`yearsOperating`/`revenueGrowth`.
- **#7 businessClassification → ADOPT typed enum (D-57).** `businessType` (legacy free-text) → **`OrgProfile.businessClassification`** enum, **7-value shared taxonomy** (Nonprofit/Not-for-profit · Government · Hospital/Healthcare Institution · Publicly-traded · PE-backed · Privately-held · Individual/Sole Proprietor). SME Mart owns it (platform `Party` carries no company classification). Schema field-add is **already MERGED** (see Live-schema fact) — no further schema PR in this phase.
- **#8 attestation → RETIRED.** Content superseded; remaining fields are marketing-stat with no home + test-only.
- **#9 → CLEAN-CUT.** MPI + `provider_*` rows are test-only → no data migration, re-enter. No backfill script.

### Stale discuss-phase language in PROF requirements (treat as ANSWERED)
- **PROF-08** says "per the discuss-phase ServiceSegment A/B decision (§7.1)" → that is **D-56 Option B** (above). No schema change.
- **PROF-10** says "per the discuss-phase keep/drop calls (attestation retire decision)" → those are the §7 #2–#9 dispositions (drop/retire/clean-cut). Attestation retire STANDS.

### Live-schema fact (bind to the PUBLISHED shape, NOT pre-PR-61 names)
`@zerobias-org/schema-w3geekery-smemart@2.0.6` published; **PR #58 + PR #61 both MERGED**. `OrgProfile.businessClassification` (7-value enum) + re-banded `employeeCount` (`51-100`/`101-500`) **verified live in UAT GQL 2026-06-25 18:11 UTC** (`platform.Class.getClass(OrgProfile)`: property present, new "Classification" view column live). Phase 33 is FULLY ungated — both halves immediately executable, no Half-B gate.

### businessClassification + employeeCount coverage (Director ask — don't let it slip)
`businessClassification` (D-57) + the re-banded `employeeCount` ride under PROF-05/PROF-10 + success-criterion #5 — they have **no dedicated req ID** but the schema is SHIPPED and the UI wiring is in-scope. **At least one plan task MUST explicitly cover** writing the `businessClassification` enum picklist + the re-banded `employeeCount` picklist in the company-info/profile form. The legacy onboarding dropdown (`company-profile-form.component.html:210-211`), `company-info.model.ts`, `seed-zb-provider.ts`, and the MPI spec still carry the OLD bands (`51-200`/`201-500`) — update to `51-100`/`101-500` (touch-it-fix-it).

### Director precisions (2026-06-25 — LOCKED, fold into plans)
- **`businessClassification` enum — CONFIRMED 7 values (NOT 8); HIGH flag CLOSED.** Director read the published YAML (`enums/orgProfile.businessClassification.yml`) directly. The earlier "8" was a researcher misread of the slash inside the `Nonprofit / Not-for-profit` label. Use these **canonical key → label** pairs verbatim in the picklist (D-57 === published schema === CRM/contact-us form; no follow-up PR, no MCP re-confirm for this item):
  - `NONPROFIT` → "Nonprofit / Not-for-profit"
  - `GOVERNMENT` → "Government"
  - `HOSPITAL_HEALTHCARE` → "Hospital/Healthcare Institution"
  - `PUBLICLY_TRADED` → "Publicly-traded Company"
  - `PE_BACKED` → "PE-backed Company"
  - `PRIVATELY_HELD` → "Privately-held Company"
  - `INDIVIDUAL_SOLE_PROPRIETOR` → "Individual / Sole Proprietor"
- **Wave-0 BLOCKER — register the 10 missing class IDs.** `SME_MART_CLASS_IDS` (`pipeline-write.service.ts:10-47`) has 16 IDs but NONE of the 6 `Provider*` + 4 corporate-profile classes (`InsuranceCoverage`/`ClientReference`/`Personnel`/`FinancialProfile`). `pushEntity` fails at runtime without them. A **Wave-0 plan task MUST register their class IDs before any Half-B write executes.**
- **Class IDs are env-STABLE — do NOT build a per-env class-ID switch.** Schema CLASS IDs are deterministic UUIDv5 (schema namespace + class name, zbb-derived) → identical in UAT and prod (this is why D-56 quotes `ProviderServiceSegment 5d698106-…` as a single ID). The per-environment caution in project memory applies only to hydra/platform **LINK-TYPE** IDs (DB-generated, e.g. CI-vs-UAT `child_of`/`blocks`) — a different ID family this phase does NOT touch. Optional single MCP confirm of the exact 13 when the lock frees (belt-and-suspenders), but the registration values are env-stable.

### `parseViewJson` dependency flag
`parseViewJson<T>` is still consumed by `bid-ai.service.ts:104` (out-of-scope this phase). **Do NOT delete the helper blind** — leave it, or coordinate the consumer migration; either way it must not break `bid-ai.service.ts`.

### Angular 21 modernization (NON-NEGOTIABLE, machine-enforced)
Every touched file: `inject()` (never constructor injection); `input()`/`input.required<T>()`/`output<T>()` (never `@Input`/`@Output`/`EventEmitter`); `signal()`/`computed()`/`effect()`; `@if`/`@for`/`@switch` (never `*ngIf`/`*ngFor`); standalone only (no `NgModule`/`CommonModule`); `OnPush`; `readonly`; no `any`; no unused vars (prefix intentionally-unused with `_`); type-suffixed filenames. **Touch-It-Fix-It:** fix every violation in any file you modify. Pre-commit + CI gate diff-based at `--max-warnings=0`. `git commit --no-verify` is human-only — agents NEVER use it.

### Architect machine-gate (execute-time awareness)
`.claude/hooks/architect-skill-gate.sh` (PreToolUse) **blocks any `src/` Edit/Write** until the agent consumes the `sme-mart-architect` skill (or Reads `.claude/skills/sme-mart-architect.md`). It's per-agent, one-time, keyed by session+agent. **Every execute handoff MUST instruct the executor to consume the skill (or Read its SKILL.md) as its first step**, so `gsd-executor`s don't burn a turn on the block. Caveat: the hook only activates on a fresh session load — start executors fresh at execute time.

### Source-of-truth discipline
SDK/API/schema ground truth = ZB MCP (`zerobias_search`/`zerobias_describe`) + GQL introspection + actual SDK source. The migration-mapping doc is **design intent** — the published 2.0.6 classes are **ground truth**; reconcile any drift toward the published shape. **NEVER** cite the deprecated Next.js sme-mart app.

### Tests + gate
Unit tests ship with each deliverable (rewritten service + components). Verification gate = `npx tsc -p tsconfig.spec.json --noEmit` clean (the spec config, NOT the default — the default excludes specs).

### Claude's Discretion
- Plan wave/task decomposition (suggested seam: Half A reads vs Half B writes as separate waves, model/MPI-deletion foundation first).
- GQL query construction mechanics and exact nested-selection field lists (the Half-B research pass nails these against live introspection).
- Test structure and coverage layout.
- UI-SPEC detail for the 133-segment ServiceSegment picker (category-browse vs flat/typeahead) — deferred to UI-SPEC if a UI phase gate fires.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The migration contract (LOCKED)
- `.planning/director/profile-migration-mapping-2026-06-08.md` — the full migration design: §1 (4 structural shifts), §2 (6 junction field mappings), §3 (`ProviderProfile` dissolution), §4 (MPI section→typed-class mappings), §5 (onboarding KV→OrgProfile/Address/PKV), §6 (CatalogService name-resolution role), **§7 RESOLUTIONS table (#1–#9 CLOSED)**, §8 (code blast radius), §9 (execution-readiness — all green).
- `.planning/director/DECISIONS.md` — **D-54** (amended: MPI→typed `OrgProfile` class), **D-56** (ServiceSegment Option B), **D-57** (`businessClassification` enum + `employeeCount` re-band).
- `.planning/director/GSD-PLAN-CHANNEL.md` — the Phase 33 handoff thread + Director Parks' green-light scoping (2026-06-25).

### Requirements
- `.planning/REQUIREMENTS.md` — PROF-01..PROF-10 (lines 25-34) + milestone constraints + traceability table.

### Project conventions (binding)
- `.planning/docs/MODERNIZATION_GUIDE.md` — Angular 21 modernization rules (read before writing any component).
- `.planning/docs/SDK_VERIFICATION_SOURCES.md` — authoritative SDK/schema sources; the deprecated Next.js app is NOT authoritative.
- `.planning/docs/RDF-COMPASS.md` — the 5-question shape constraint (C-1..C-5); typed/controlled enums (e.g. businessClassification) are ontology-friendly — keep satisfiable.
- `.claude/skills/sme-mart-architect.md` — repo conventions (standalone, ngx-library theming, DataProducer/Generic-SQL data layer) + the machine-gate's satisfaction target.

### Code (read the current state before touching)
- `core/services/provider-profiles.service.ts` (primary rewrite, 280 lines), `core/models/provider.model.ts`, `core/models/marketplace-profile-item.model.ts` (to delete), `core/services/catalog.service.ts` (unchanged loaders), `pages/my-profile/my-profile-expertise.component.ts`, `onboarding/company-info-sections.ts`, the 6-section corporate profile form (`company-profile-form.component.*`), `bid-ai.service.ts:104` (out-of-scope `parseViewJson` consumer).
</canonical_refs>

<specifics>
## Specific Ideas

- **Half A / Half B is the natural plan seam.** Foundation (model rewrite + MPI deletion) → Half A reads → Half B writes is a clean wave order; Half A and Half B both depend on the model foundation but are independent of each other.
- **`businessClassification` is the lone new typed field** the re-home adds beyond the merged PR #58 set (per migration-mapping §2/§5 addendum) — and it's already live in 2.0.6. No further schema PR in this phase.
- **`OrgSegment` is a net-new onboarding step** (universal buyer+provider classification; replaces dead `industry` free-text) — PROF-09. One row per (org, segment); `segmentId` → Catalog Domain/Category.
- **Verification provenance is user-visible** (PROF-07): the expertise UI must surface the asserted-vs-vetted distinction (`verified`/`verificationSource`).
- **The Half-B research pass (scoped by Director)** targets ONLY: the `PipelineWriteService` write pattern for the 13 stubs + the precise GQL nested-selection shapes for read verification — bound to **live published schema via ZB MCP / introspection**, NOT migration-mapping field names, NOT the deprecated Next.js app. Researcher reconciles + flags any drift.
</specifics>

<deferred>
## Deferred Ideas

- **Browse Providers / RFP** → Phase 34. **Bid / Accept-and-Link** → Phase 35.
- **Provider operational fields** (`hourly_rate`/`availability_status`/`response_time`) → dropped for v1 (§7 #3); rate may return as a per-`ServiceOffering` field later.
- **`ServiceOffering` pricing model** → not in v1 re-home scope.
- **Disclosure-gating of sensitive sections** (insurance/financial public-vs-gated) → the seam into the 033 vetting track; parked.
- **`parseViewJson` removal** → blocked on migrating its `bid-ai.service.ts` consumer; out-of-scope here.
- **`bid-ai.service.ts` migration** → separate, out-of-scope.
</deferred>

---

*Phase: 33-profile-expertise-company-info-re-home*
*Context synthesized: 2026-06-25 via locked-docs express path (discuss-phase OFF; §7 CLOSED). Green-lit by Director Parks.*
