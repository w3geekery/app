# Schema Consolidation — Kickoff Plan (get the GQL changes underway pre-milestone)

**Date:** 2026-06-05
**Director:** Parks
**Why now:** Clark's directive — start the `smemart` GQL schema changes *now* so they're released (through the zbb gate + GQL reload) by the time the matchmaking + product-listing milestone needs them. Schema has lead time; front-load it.
**Basis:** `profile-classification-consolidation-brief-2026-06-02.md` (target model) + DECISIONS D-54 (amended) + the FR doc reconciliation (2026-06-05: MPI deprecates entirely).
**Process constraint:** Schema PRs on `zerobias-org/schema` are **Clark + Director hands-on** (no agent push/PR/test — memory `project_schema_pr_process_is_director_clark.md`). This doc is the design + sequence; the authoring/zbb walkthrough is done together.

---

## 0. Repo state — LOOK-FIRST findings (2026-06-05)

Schema fork: `~/Projects/w3geekery/zb-forks/org/schema`, package `package/w3geekery/smemart`.

| Finding | Detail | Risk |
|---|---|---|
| **Current branch = `feat/w3geekery-smemart-resource-metadata`** | HEAD `6e0739a` (2026-05-15). Despite the name, this is the **newest canonical branch**: gradle/zbb publish pipeline (#52), Phase-29.5 deprecations (#54), the real 26-class `smemart` package. | **LOCAL-ONLY — never pushed to origin.** Origin's newest `w3geekery` schema branch is the ancient `feat/w3geekery-sme-mart-schema` (2026-03-16). Canonical state is unbacked. |
| **Two packages** | `smemart` (real, 26 classes) **and** `sme-mart` (hyphenated, 6 files, NO `classes/` — package.json/build.gradle/gate-stamp/catalog/CHANGELOG/.npmrc only). | The empty `sme-mart` still publishes `@zerobias-org/schema-w3geekery-sme-mart` (seen in release commit `05b901c`). Rename leftover. |
| **4 stale branches** | `feat/w3geekery-sme-mart-schema` (origin, 2026-03-16), `fix/schema-smemart-rename`, `feat/sme-mart-project-board-entities`, `feat/sme-mart-schema-deprecation-29-5` (origin). The deprecation work is already folded into the current branch (commit `e0300af`). | Branch sprawl; unclear canonical. |

### Fork-6 reconciliation — status (CORRECTED after upstream sync 2026-06-05)
1. ✅ **Branch renamed** `feat/w3geekery-smemart-resource-metadata` → **`feat/w3geekery-smemart-profile-consolidation`** (clean tree). This is the OrgProfile working branch.
2. ✅ **Synced with upstream + EARLIER WORRY DISPROVEN.** Fetched `upstream` (`zerobias-org/schema`); our branch was **0 ahead / 1 behind** `upstream/main` — i.e. a strict ancestor. **Everything (gradle/zbb pipeline #52/#54/#55, the 26-class `smemart` package, 29.5 deprecations) is ALREADY in `upstream/main`.** The "local-only/unbacked canonical state" worry from parkit-25 was WRONG. Fast-forwarded our branch to `upstream/main` HEAD **`539b603`** (0 ahead / 0 behind, clean). New schema commits go on top of this.
3. ⏳ **TODO (Clark+Director, low urgency):** the empty hyphenated `sme-mart` package is **also in `upstream/main`** (publishes `@zerobias-org/schema-w3geekery-sme-mart`), and its name **violates the repo naming rule** (`{vendor}`/`{code}` must be lowercase-alphanumeric, **no hyphens** — repo CLAUDE.md §"Naming Rules"). Removing it = an upstream PR + platform coordination (repo CLAUDE.md: "NEVER rename/remove a published package without coordinating Chris/Kevin"). Not a blocker for our work; file as a cleanup.
4. ⏳ **TODO:** prune the 4 stale local branches (`feat/w3geekery-sme-mart-schema`, `fix/schema-smemart-rename`, `feat/sme-mart-project-board-entities`, `feat/sme-mart-schema-deprecation-29-5`) — all folded into main.

---

## 1. Target class inventory (from the brief §2, mapped to the live 26-class package)

| Class | Action | Notes |
|---|---|---|
| `MarketplaceProfileItem` | **DEPRECATE** (entirely) | section+`data` blob class; content splits out below. Don't delete yet — mark deprecated, migrate, then drop. |
| `SecurityCredential` / `UserCredential` / `OrgCredential` | **REUSE** | existing typed credential subsystem; certs/attestations land here (not new classes). |
| `Review` | **REUSE** | reputation/trust (S12); the 033 vetting seam. |
| **`OrgProfile`** | **NEW** | 1:1 per org. Typed company identity/marketing/discovery fields (see field set §1b). Addresses → `OrgAddress` (NOT scalar fields here). NO `industry` (→ `OrgSegment`), NO `onboarding_complete` (PKV). |
| **`Address`** (owner-generic; or `OrgAddress` if org-only) | **NEW** | typed address class, **our schema** (platform SC-004/task-10 Address "may be a while" — Clark 2026-06-05). **Generic across all user use cases (Clark 2026-06-05): usable by providers AND buyers because both are orgs.** Owner is a *reference* not a hard-coded org: `ownerType` (enum: `org` v1; `personnel`/`user` reserved) + `ownerId` (FK). 1:**many** per owner. **Two-field type model (Clark 2026-06-05):** `addressType` = typed enum (`HQ`/`BILLING`/`SHIPPING`/`MAILING`/`REGISTERED`/`PHYSICAL_OFFICE`/`OTHER`) — the machine-routable category (billing→invoice, shipping→fulfillment, registered→KYB; queryable) — PLUS `userLabel` = optional free text for human disambiguation when an org has 2+ of the same type ("Austin HQ" vs "Denver Office"). Label is display-only, never routed on; `OTHER` + `userLabel` is the escape hatch for unanticipated types. NOT a free-text type (that re-introduces a soft blob + breaks billing/shipping/KYB routing). Typed scalar fields (`street1/2`, `city`, `region`, `postalCode`, `country` ISO-3166-a2) — NO JSONB. `isPrimary` per type. Verification metadata (`verified`/`verifiedAt`/`verificationSource`) nullable-from-v1 so KYB (033) needs no breaking change. Owner-reference shape mirrors platform SC-004 → a future platform Address can supersede cleanly. **Naming/scope = the one open call:** owner-generic `Address` (recommended, all use cases) vs org-only `OrgAddress`. |
| **`OrgSegment`** | **NEW** | org-scoped Catalog **segment** junction (replaces `industry`); `verified`/`verificationSource` (D-53). |
| **Provider expertise junctions** ×6 | **NEW (re-home)** | `ProviderSkill/Role/Product/Framework/Segment/ServiceSegment` — confirmed NOT in the GQL set today (legacy Neon shapes). Re-author as typed GQL classes. |
| **`InsuranceCoverage`** | **NEW** | from MPI `INSURANCE`. |
| **`ClientReference`** | **NEW** | from MPI `REFERENCE` (distinct from `Review`). |
| **`FinancialProfile`** | **NEW** | from MPI `FINANCIAL`; disclosure-gated (033); may want SC-006 money core types. |
| **`Personnel`** | **NEW (or `OrgProfile.keyPersonnel[]`)** | from MPI `PERSONNEL`; person credentials → `UserCredential`. Fork-4. |
| `Engagement`, `SmeMart{Project,Board,Task,Activity,Workflow}`, `EngagementVettingItem` | **DEPRECATED already** (D-52/29.5) | moved to platform; leave as-is. |

---

## 1b. `OrgProfile` field set + overlap guardrail (reconciled against prod task-8, read 2026-06-05)

Read the cancelled **task-8** (`0893970f…`, "SC-002 dana.OrgProfile") live on prod to confirm nothing was lost. Its description carries the **canonical 11-field set** (Parks-reviewed 2026-05-29). The 1 comment is just the D-54 cancellation note (pre-brief "stays in MPI" framing — superseded). **Nothing slipped through.**

**`OrgProfile` carries (typed, our `smemart` schema):**
`orgId` (FK→Org, unique) · `legalName` · `dba` · `tagline` (≤200) · `shortDescription` (≤500) · `longDescription` (markdown) · `website` (url) · `logoUrl` · `employeeCount` (enum bands `BAND_1_10`…`BAND_500_PLUS`) · `foundedYear` (int 1800–current; "years in business" derived) · `primaryContactUserId` (FK→member User; name/email resolved on read, no denorm).

**Overlap guardrail — what must NOT go on `OrgProfile`** (it belongs elsewhere; this is the "don't collide with the backend-request tasks" check Clark asked for):

| Don't put on OrgProfile | Belongs to | Why |
|---|---|---|
| `industry` (was task-8 field) | **`OrgSegment`** (Catalog segment links) | brief dropped free-text industry for typed Catalog classification |
| `name` / `avatarUrl` / `slug` / `externalId` / `supportEmail` | **platform `dana.Org`** (read, don't copy) | identity fields the platform Org already owns; OrgProfile is profile-above-identity |
| HQ / any address | **`OrgAddress`** (our class; ~platform SC-004/task-10) | typed multi-address w/ type discriminator, not scalar fields on OrgProfile |
| `code` / `activatedDate` / `endDate` | **platform `platform.Project`** (SC-003/task-9) | per-Project lifecycle, not per-Org |
| contract value / billing / renewal / $ terms | **Requirement rows** (+ SC-006/task-8-linked money types) | agreements→Requirements (Clark principle) |
| project tier | **platform Org settings** (SC-001/task-7) | enforced node attribute |
| `engagementStage` / `workspaceType` / `orgTypes` | **platform `AppOrgProfile`** (read-only signal) | classification, admin-gated; never authored from us |
| `onboarding_complete` | **PKV** (`dana.Pkv`, org principal) | private routing state, not profile |

task-8 links confirm the companion FRs are all platform-side and non-overlapping: SC-003 (Project lifecycle), SC-004 (Address — our `OrgAddress` mirrors it locally), SC-006 (money types). None are OrgProfile fields.

---

## 2. Decisions — Clark's calls (2026-06-05)

- ✅ **Naming:** `OrgProfile` (Clark approved).
- ✅ **One PR, not phased** (Clark): schema changes take time to propagate to published, so **all consolidation classes ship in a single PR** (multiple commits as needed). PR-1/PR-2 split below is **dropped** — it's one PR with a commit sequence.
- ✅ **Address: owner-generic `Address`** (Clark 2026-06-05) — `ownerType` (`org` v1; `personnel`/`user` reserved) + `ownerId`, NOT org-locked. Covers providers + buyers (both `ownerType=org`) + future person-level, no breaking change. Naming = `Address` in our `smemart` namespace.
- ✅ **Junction scope (#2): org-scoped — LOCKED** (Clark 2026-06-05, "org-scoped everything"). Everything keys to the **org**: `Address` (via `ownerType=org`), `OrgSegment`, and all 6 expertise junctions move from `provider_id` → `org_id`. One unified model — a provider is an org *with* expertise rows; a buyer is an org with zero. No separate "provider" entity, no multi-seller-identity case for us.

**Still open (don't block the PR — resolve mid-authoring / discuss):**
- **CORPORATE_IDENTITY split** (fork-3) — deep legal/tax/incorporation into `OrgProfile`, or a separate KYB/vetting class? *Lean: keep light identity on `OrgProfile`; defer deep KYB to a vetting class (033).*
- **Disclosure gating** (fork-5) — Insurance/Financial public-discovery vs gated? *Lean: gated; seam into 033. Model the fields now, gate at the read/UI layer.*
- **Personnel shape** (fork-4) — typed `Personnel` class vs `OrgProfile.keyPersonnel[]` junction.

---

## 3. Sequence (ONE PR, commit-staged)

1. **Finish fork-6** (§0): push the renamed branch to origin; delete the empty hyphenated package; prune stale branches. *(Branch rename already done.)*
2. **Settle the junction-scope call** (§2 #2). Naming + one-PR already locked.
3. **Author the PR on `feat/w3geekery-smemart-profile-consolidation`**, commit-staged so it's reviewable but ships as one PR:
   - commit 1: `OrgProfile` + `OrgAddress`
   - commit 2: `OrgSegment` + the 6 re-homed expertise junctions (`ProviderSkill/Role/Product/Framework/Segment/ServiceSegment`, scoped per the #2 call)
   - commit 3: `InsuranceCoverage` + `ClientReference` + `FinancialProfile` + `Personnel`
   - commit 4: `MarketplaceProfileItem` → deprecated (mark; migrate; the blob's content now has typed homes)
   - Verify class shapes against existing `OrgCredential`/`Review` YAML + `linkTo` format as we go; `npm run verify` (Supabase scratch DB) green before opening the PR.
4. **Walk the zbb gate** together (gradle + zb.schema publish pipeline; Daniel Rojas for the `approved` label on the cross-fork PR to `zerobias-org/schema`).
5. **GQL reload ~15 min post-merge** → classes live → SME Mart services/models consume during the milestone (re-home the provider expertise UI off the legacy Neon shapes onto the typed GQL classes; migrate MPI rows — likely test-only).

---

## 3b. Process truth — verified against live schema-repo docs (read 2026-06-05, POST-sync)

**`zbb gate` is THE compass for this repo** (dataloader/pre-CI). Canonical process = **Daniel-maintained** repo `CLAUDE.md` (gradle/zbb sections, #55) + `zbb.yaml` (#52) + app `SCHEMA_CHANGE_PROCESS.md`. **IGNORE** the schema-repo `CONTRIBUTING.md` (ours, Clark 2026-04-13, pre-gradle, Daniel never updated it — preaches `dev`/`npm run validate`/lerna) and the package `smemart/CLAUDE.md` (stale: "7 classes"/`npm run verify`).

**The real recipe (current):**
1. Branch off synced `main` — ✅ done (`feat/w3geekery-smemart-profile-consolidation` @ `539b603`).
2. Author under `package/w3geekery/smemart/`: `classes/*.yml` (PascalCase), `fields/className.fieldName.yml` (camelCase dot-notation; `type:` ∈ string/number/integer/boolean/date/datetime; `multi: true` for arrays), `enums/*.yml` (**values ALL_CAPS** `[A-Z][A-Z0-9_]*`), `interfaces/` for shared property contracts.
3. Links: `linkTo: ClassB.id.reverseProp` at **SIBLING indent** (not nested); define **both sides**; can't `linkTo` platform-native entities (Boundary/Task) — use scalar id fields. GQL strips `Id` suffix on link names.
4. `package.json` must list base packages in **`zerobias.imports`** (`zerobias.zerobias.platform.schema` always; `zerobias.zerobias.base.schema` if extending base classes like `Object`/`File`).
5. **Validate = `zbb gate`** (→ `./gradlew gate`) or single-package `./gradlew :w3geekery:smemart:gate`. Needs: dataloader@latest (`npm i -g @zerobias-com/platform-dataloader@latest`, ≥1.0.87) + scratch DB running (`docker start supabase-pg-content-dev`, Supabase PG17 :15432, db `content_dev`, user/pw postgres/welcome, SSL disable) + env vars exported. `testIntegrationDataloader` is **skipped** (not failed) locally w/o `NEON_API_KEY`; stamp still writes. **`npm run validate` / `npm run verify` ALONE is NOT enough** (structure only).
6. Commit `classes/` + `fields/` + **`gate-stamp.json`** (preflight rejects packages without a fresh stamp). Conventional commits `feat(w3geekery):`. RE-RUN gate after ANY commit edit (cherry-pick/rebase/amend invalidate the stamp). Then `touch .dataloader-validated` (app hook checks <30 min).
7. Push + cross-fork PR = **Clark+Director hands-on** (agents commit locally only, never push/PR). `approved` label (Daniel Rojas) gates CI dataloader — **skipped ≠ pass**.
8. Class IDs = deterministic UUID v5 from YAML content (same local/CI/prod) → app can register ID constants from a clean local gate. GQL reloads ~15 min post-merge.

**⚠️ Before the PR (NOT before authoring): VERIFY PR base branch `main` vs `dev`.** Empirical truth = **`main`** (every PR since #51). The only `dev` mentions are stale (our `CONTRIBUTING.md` + leftover bottom of the repo `CLAUDE.md`). Confirm with **Daniel** — he owns the canonical answer. Stale schema-repo docs (`CONTRIBUTING.md` + `CLAUDE.md` + package `smemart/CLAUDE.md`) cleanup is tracked as **BACKLOG `SCHEMA-DOCS-REFRESH-1`** (Daniel must approve the edits).

## 4. Cross-references
- `profile-classification-consolidation-brief-2026-06-02.md` (target model; forks 1–7)
- DECISIONS **D-54** (amended), **D-53** (vetting), **D-52** (governance node)
- `docs/BACKEND_FEATURE_REQUESTS.md` (MPI-deprecation reconciled 2026-06-05; SC-002 withdrawn)
- `docs/SCHEMA_CHANGE_PROCESS.md` (zbb gate + fork-sync + approved-label)
- `backlog/033` (the verified/assessed layer that consumes the `verified` fields)
- Schema fork: `~/Projects/w3geekery/zb-forks/org/schema/package/w3geekery/smemart`
