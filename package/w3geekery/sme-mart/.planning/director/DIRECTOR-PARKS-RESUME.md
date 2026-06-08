# Director Parks — Resume Context

**Scope:** This file is the resume context for the Director Parks session (the meta:director role instance on SME Mart). Other Claude sessions on this repo have no reason to read it — it is owned by the Director role.

**If you are starting or resuming a Director Parks session, READ THIS FILE FIRST**, then `.planning/director/SESSION-STATE.md`, then the latest entries in `.planning/director/DECISIONS.md`.

**Session pointer:** `claude --resume "Director Parks"`
**Branch (app repo):** `poc/sme-mart`
**Working dir:** `/Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart`

**This doc holds only the latest 2 parkit sections** (handoff scratchpad — kept lean so it always reads whole, under the 256KB Read cap). Older sections demote to `DIRECTOR-PARKS-LOG-2026-H1.md` (grep-only cold archive; never loaded by default). The durable, indexed record lives in **memex** (`search_notes`) + **DECISIONS.md** (D-NN) — that's the searchable knowledge layer, not this file. `parkit` (SAVE mode) demotes the oldest section to the archive whenever this doc exceeds 2 sections.

---

## 📍 LATEST: 2026-06-08 parkit (27) — OrgProfile schema consolidation **AUTHORED → GATED GREEN → COMMITTED → PR #58 MERGED** by Daniel. **But PUBLISH BLOCKED** on a base-schema 3.0.1 regression (NOT ours). Discovered + captured the **canonical AuditgraphDB deprecation recipe** (`deprecated.yml` manifest).

**TL;DR — the parkit-26 kickoff mission is DONE through merge.** 12 new typed classes + MarketplaceProfileItem retired; gated green; committed schema-fork `1283225` (145 files); PR **#58** merged to `zerobias-org/schema:main` by Daniel (merge `88481c0` + release `74edf82` v2.0.3 + stamp `d904bdc`). **HOWEVER the Publish Schema workflow FAILED twice** — root cause is the base dep `@zerobias-org/schema-zerobias-zerobias-base@3.0.1` (`Property 'virtual' already exists on extended class … cannot overload`), a base regression — our gate passed on base 3.0.0. **npm still 2.0.2, no GQL reload yet.** App HEAD `a5b93945` UNCHANGED (zero app commits — all work in the schema fork). MCP `ci-ui-dev`, lock FREE.

### ⏭️ RESUME HERE (parkit-27)
1. **Check if base-schema 3.0.1 `virtual` conflict is fixed** (Daniel/Chris/Nic own it). A paste-ready note for Daniel was drafted in-session (Clark to send) — refs runs `27154671452` + `27156195088`, error `Property 'virtual' already exists on extended class and the fields do not match. You cannot overload an extended properties field` in `schema-zerobias-zerobias-base@3.0.1/interfaces`. Our dep is `latest`, so base bump to 3.0.1 broke the publish.
2. Once base is fixed → **re-run the smemart Publish Schema** (no change to our PR/branch needed) → confirm npm `@zerobias-org/schema-w3geekery-smemart` bumps to **2.0.3**.
3. **Verify GQL reload on CI** (~15 min post-publish): the 12 new classes queryable + `MarketplaceProfileItem` retired (ZB MCP `zerobias_search`/`zerobias_describe` on `w3geekery.smemart`, or GQL introspection).
4. Then the **matchmaking + product-listing milestone** can consume the typed classes — re-home the provider-expertise UI off legacy Neon shapes (`my-profile-expertise.component.ts`, `core/models/provider.model.ts`, `core/services/catalog.service.ts`) onto the new GQL classes.

### What happened (parkit-27)
1. **Authored the full consolidation** on schema-fork branch `feat/w3geekery-smemart-profile-consolidation`: **OrgProfile** (1:1 company identity/marketing), **Address** (owner-generic `ownerType`+`ownerId`, typed `addressType` enum + free `userLabel`), **OrgSegment** (Catalog-segment classification, replaces `industry`), **6 Provider* expertise junctions** (Skill/Role/Product/Framework/Segment/ServiceSegment — org-scoped, scalar Catalog-UUID FKs, one row per claim, `verified`/`verificationSource` per D-53), **InsuranceCoverage / ClientReference / FinancialProfile / Personnel** (typed homes for the old MPI blob sections). Locked design calls (Clark): **no denorm names on junctions** (resolve on read); **single `segmentId`** (reified — per-claim provenance); **FinancialProfile carries NO disclosure-gating field** (gate at read, 033 owns it); **Personnel = typed class** (person certs via `UserCredential.userId`). Mirrors the `SecurityCredential` opaque-UUID-FK precedent.
2. **Toolchain bumped:** dataloader 2.0.8→**2.0.14**, zbb 0.3.72→**0.3.73**.
3. **Gate saga (3 runs):** (a) `catalog.migrated_artifact does not exist` → content-master was stale, **Chris refreshed it**; (b) `No such DataType: datetime` → fixed `address.verifiedAt` to `date` (**only string/boolean/date/number/integer are valid** field types — `datetime` is NOT); (c) **GREEN** (BUILD SUCCESSFUL 20m53s). The recurring 404 (`BranchProducerImpl.deleteBranch`) is benign branch-teardown after a passing run.
4. **MPI deprecation — the big reusable learning.** Clark corrected "deprecation removes files + leaves a marker, not just a flag." Dug through **`auditlogic/schema`** history (commits `eac088628` single-class, `230a26409` "deprecate content properly") → **canonical recipe = DELETE the content files + record their names in a package-root `deprecated.yml` manifest (by category) + whitelist `deprecated.yml` in `package.json` `files`.** The per-class `deprecated: true` flag (what 29.5 did) is NOT the mechanism. Applied to MPI (deleted class+5 fields+enum, created `deprecated.yml`, whitelisted), re-gated green. Captured in a clean **memex** note.
5. **Committed → pushed → PR'd → merged:** `1283225` → origin → PR #58 → Daniel merged + bumped v2.0.3. Then diagnosed the publish failure via `gh run` logs.

### State (parkit-27)
- **App repo:** HEAD `a5b93945`, **ZERO app commits** this session. The parkit-26 uncommitted planning pile (~22 mod + 8 untracked) is **untouched/unchanged** — still uncommitted.
- **Schema fork** (`~/Projects/w3geekery/zb-forks/org/schema`): local `feat/w3geekery-smemart-profile-consolidation` @ `1283225` (3 behind / 1 ahead of `upstream/main` — content is merged as `88481c0`; local branch is now stale and can be deleted/re-synced, the work lives in upstream).
- **upstream/main:** `88481c0` (our PR #58) + `74edf82` (release v2.0.3) + `d904bdc` (stamp refresh).
- **npm:** `@zerobias-org/schema-w3geekery-smemart` still **2.0.2** (2.0.3 NOT published — publish blocked).
- **MCP:** `ci-ui-dev`, lock FREE.

### In-flight / blockers (parkit-27)
- **PUBLISH BLOCKED** on base-schema 3.0.1 `virtual` overload conflict (Daniel/Chris/Nic). Paste-ready Daniel note drafted (Clark sends). Re-run publish after base fix; no PR change needed.
- **29.5 cleanup debt:** `Engagement`/`SmeMartProject`/`EngagementVettingItem` are still the flag-only (wrong) deprecation — proper retirement = delete files + `deprecated.yml`, future follow-up (per the memex recipe).
- **Matchmaking milestone** (the real v1.5 goal): consume the typed classes once schema lands; migrate any MPI rows (test-only).

### Key docs / artifacts (parkit-27)
- **Memex (canonical):** `memex/zerobias/integration/deprecating-auditgraph-db-schema-canonical-recipe-delete-files-deprecated.yml-manifest` — the deprecation recipe (DRAFT predecessor deleted).
- Master plan (still the design ref): `director/schema-consolidation-kickoff-2026-06-05.md`.
- Schema fork package: `~/Projects/w3geekery/zb-forks/org/schema/package/w3geekery/smemart` (classes/fields/enums + `deprecated.yml`).
- PR: https://github.com/zerobias-org/schema/pull/58 (merged).

### Quick-start prompt (parkit-27)
You're Director Parks for SME Mart. The OrgProfile schema-consolidation (parkit-26 kickoff) is **DONE through merge**: 12 new typed classes + MarketplaceProfileItem retired, gated green, committed `1283225`, PR #58 merged to `zerobias-org/schema:main` by Daniel (`88481c0` + release v2.0.3). **BUT the Publish Schema workflow FAILED twice — NOT our fault:** base dep `@zerobias-org/schema-zerobias-zerobias-base@3.0.1` has a `virtual` property overload conflict (our gate passed on base 3.0.0). npm still 2.0.2, no GQL reload. **FIRST on resume:** check whether base 3.0.1 is fixed (Daniel/Chris/Nic — paste-ready note drafted for Clark to send); once fixed, re-run the smemart publish (no PR change), then verify the 12 classes are live in CI GQL + MPI gone. **Big reusable win to carry:** the canonical AuditgraphDB deprecation recipe = delete content files + package-root `deprecated.yml` manifest + whitelist it (NOT a `deprecated: true` flag) — memex note above. App HEAD `a5b93945` unchanged; the parkit-26 uncommitted planning pile is still uncommitted. Rules that bit this session: **`datetime` is not a valid field type** (date/string/boolean/number/integer only); **publish resolves deps at `latest`** so a base bump can break us even when our content is fine; **deprecation = files + `deprecated.yml`, not a flag**; schema-PR work is Clark+Director hands-on (agents commit local, push/PR together — done this round). NEXT real milestone = matchmaking + product listing (re-home provider-expertise UI onto the new typed GQL classes once the schema publishes).

### Pinned moments (parkit-27)
Session JSONL: `~/.claude/projects/-Users-cstacer-Projects-w3geekery-zerobias-org-forks-app-package-w3geekery-sme-mart/6e484b1a-ae18-44fa-a3e9-2eedeea3d5f4.jsonl`

| Pin | What it marks |
|---|---|
| `[auditgraph-schema-deprecation-process]` | the canonical schema-deprecation recipe (delete files + `deprecated.yml` manifest, not a flag) — the session's big reusable learning |

Drill in: `/pins auditgraph-schema-deprecation-process`.

---

## 2026-06-05 parkit (26) — v1.4 CLOSED + ROADMAP/PROJECT drift reconciled · Vercel PURGED (docs) · FR doc reconciled to brief · **GQL SCHEMA CONSOLIDATION KICKED OFF** (decisions locked, branch synced+renamed, process docs read fresh, task-8 verified). ZERO git commits (big uncommitted pile).

**TL;DR — app HEAD `a5b93945` (unchanged; ZERO commits). Schema fork branch `feat/w3geekery-smemart-profile-consolidation` synced clean to upstream/main `539b603` (no schema commits yet — authoring is the next action).** MCP `ci-ui-dev`, lock FREE.

### ⏭️ RESUME HERE — start the schema authoring (DO THIS FIRST on /parks load)
**Goal: author the OrgProfile schema-consolidation PR (ONE PR) so it's released before the matchmaking milestone needs it. Schema work is Clark+Director hands-on (agents commit locally, never push/PR).**

1. **READ FIRST — the master plan:** [`.planning/director/schema-consolidation-kickoff-2026-06-05.md`](schema-consolidation-kickoff-2026-06-05.md). It has: fork-6 status (DONE — synced), the full class inventory, the locked decisions, the `OrgProfile` field set + **overlap guardrail** (§1b), the `Address` design, the commit sequence (§3), and **§3b "Process truth"** (the verified `zbb gate` recipe + doc-drift flags). Everything below is a pointer INTO this doc.
2. **Re-read the process fresh** (docs drift — don't trust memory): app [`.planning/docs/SCHEMA_CHANGE_PROCESS.md`](../docs/SCHEMA_CHANGE_PROCESS.md) (canonical, corrected 2026-06-05) + Daniel-maintained schema-repo `~/Projects/w3geekery/zb-forks/org/schema/{CLAUDE.md,zbb.yaml}`. **`zbb gate` = THE compass** for dataloader/pre-CI (→ `./gradlew :w3geekery:smemart:gate`). **IGNORE schema-repo `CONTRIBUTING.md`** (ours, Clark 2026-04-13, pre-gradle, Daniel never updated — preaches dev/npm-validate/lerna) **+ package `smemart/CLAUDE.md`** (stale: 7-classes/npm-verify). **PR base = `main`** (empirical; confirm with Daniel before PR). Stale-doc cleanup tracked as BACKLOG `SCHEMA-DOCS-REFRESH-1`.
3. **Read the existing class YAMLs to model against** (don't re-grep the world): `~/Projects/w3geekery/zb-forks/org/schema/package/w3geekery/smemart/classes/{OrgCredential,UserCredential,SecurityCredential,Review,MarketplaceProfileItem}.yml` + a few `fields/*.yml` for the field-YAML shape + `package.json` for `zerobias.imports`.
4. **Author** (on `feat/w3geekery-smemart-profile-consolidation`, commit-staged, ONE PR): `OrgProfile` + `Address` → `OrgSegment` + 6 re-homed expertise junctions (`ProviderSkill/Role/Product/Framework/Segment/ServiceSegment`, all **org-scoped** now) → `InsuranceCoverage`/`ClientReference`/`FinancialProfile`/`Personnel` → mark `MarketplaceProfileItem` deprecated. Run `zbb gate` green (scratch DB up: `docker start supabase-pg-content-dev`; dataloader@latest) → commit `gate-stamp.json` + YAMLs locally. Push/PR = walk with Clark.

### LOCKED DECISIONS (Clark, 2026-06-05) — don't re-litigate
- **`OrgProfile`** (name), 1:1 per org, our `smemart` schema. Carries the task-8 11-field set (verified live on prod) MINUS `industry`.
- **`industry` is DEAD** → classification via **`OrgSegment`** (typed Catalog segment links, Domain/Category). Confirmed superseded.
- **`Address` = owner-generic** (`ownerType`+`ownerId`, not org-locked): providers + buyers (both `ownerType=org`) + future personnel/user. `addressType` typed enum (HQ/BILLING/SHIPPING/MAILING/REGISTERED/PHYSICAL_OFFICE/OTHER, machine-routable) **+ `userLabel`** free text (human disambiguation, display-only). Mirrors platform SC-004 for clean future supersede.
- **Org-scoped EVERYTHING** (#2 resolved): all junctions key to `org_id`, no separate "provider" entity (buyer-org = zero expertise rows).
- **ONE PR**, multiple commits (schema propagation has lead time).
- **Overlap guardrail** (don't collide with backend-request tasks): OrgProfile carries identity/marketing only. NOT on it: address (→`Address`), money/contract terms (→Requirements + SC-006), project lifecycle code/dates (→platform.Project SC-003), tier (→platform SC-001), engagementStage/orgTypes (→read-only AppOrgProfile), name/avatar/slug (→read from dana.Org), onboarding_complete (→PKV).

### What happened (parkit-26)
1. **v1.4 CLOSED + ROADMAP/PROJECT drift reconciled.** Fixed Phase 27 checkbox (was `[ ]`, actually validated 2026-05-01) + Phase 26 parenthetical; rebuilt the stale Progress table; marked v1.4 ✅ COMPLETE 2026-05-13; Phase 29 + 31 deferred to v1.5; moved P24/25/30 to Validated in PROJECT.md. NOT formally `/gsd:complete-milestone`-archived (pairs with `/gsd:new-milestone` for matchmaking).
2. **Vercel PURGED (docs).** Code/config was already clean (removed 2026-05-22). Swept ~14 live docs (PROJECT/PROJECT-CONTEXT by me + 12 via background agent) → ZB-platform-publishing reality; BACKLOG `VERCEL-PURGE-1` marked ✅ DONE. Frozen historical mentions (resume/errata/phases) left intact.
3. **FR doc reconciled to the brief.** `docs/BACKEND_FEATURE_REQUESTS.md` got a superseded-banner + fixed carrier map (was pointing at withdrawn SC-002) + rewrote MPI disposition from "keep+cleanup" → "**MPI deprecates ENTIRELY** → typed OrgProfile + classes."
4. **Schema kickoff.** Wrote the kickoff doc. Renamed schema branch + **synced upstream** (fast-forward to `539b603` — disproved the parkit-25 "local-only/unbacked" worry; everything's in upstream/main). Read schema-repo process docs fresh (spotted dev-vs-main + stale-package-CLAUDE drift). **Read prod task-8 live** (switched profile prod-zb → read → restored ci-ui-dev, lock acquired+released cleanly) — confirmed the 11-field OrgProfile set is canonical, nothing slipped through.

### State (parkit-26)
- **App repo:** HEAD `a5b93945`, ZERO commits. **Large uncommitted pile** (commit when Clark says): this session added/modified `ROADMAP.md`, `PROJECT.md`, `director/PROJECT-CONTEXT.md`, `BACKLOG.md`, `docs/BACKEND_FEATURE_REQUESTS.md`, 12 Vercel-swept docs (`codebase/*`, `research/STACK.md`, `notes/*`, `backlog/003`, `PLATFORM-DATA-INVENTORY.md`), NEW `director/schema-consolidation-kickoff-2026-06-05.md`, this resume — on top of the parkit-22..25 carryover pile.
- **Schema fork** (`~/Projects/w3geekery/zb-forks/org/schema`): branch `feat/w3geekery-smemart-profile-consolidation` @ `539b603`, clean, 0 ahead/0 behind upstream/main. NO schema commits yet.
- **MCP:** `ci-ui-dev`, lock FREE, profile restored.

### Key docs (read fresh on resume — pointers for schema work)
- Master plan: `director/schema-consolidation-kickoff-2026-06-05.md` ← START HERE
- Design brief: `director/profile-classification-consolidation-brief-2026-06-02.md`
- FR doc (reconciled): `docs/BACKEND_FEATURE_REQUESTS.md`
- Process: `docs/SCHEMA_CHANGE_PROCESS.md` (canonical, corrected 2026-06-05) + Daniel's schema-repo `CLAUDE.md`/`zbb.yaml`. **`zbb gate` = THE compass.** IGNORE schema-repo `CONTRIBUTING.md` + package `smemart/CLAUDE.md` (both stale). Cleanup → BACKLOG `SCHEMA-DOCS-REFRESH-1`.
- Catalog segment taxonomy: `docs/ZEROBIAS_CATALOG_API_GUIDE.md` §6
- DECISIONS: D-52 (governance node), D-53 (vetting/commerce), D-54 (profile dispositions, amended by the brief)
- Existing class YAMLs to model against: schema-fork `package/w3geekery/smemart/classes/{OrgCredential,UserCredential,SecurityCredential,Review,MarketplaceProfileItem}.yml`
- Code to re-home (provider junctions): app `src/app/pages/my-profile/my-profile-expertise.component.ts`, `core/models/provider.model.ts`, `core/services/catalog.service.ts`, `onboarding/company-info-sections.ts`, `core/models/marketplace-profile-item.model.ts`

### Quick-start prompt (parkit-26)
You're Director Parks for SME Mart. **App HEAD `a5b93945`, ZERO commits, big uncommitted pile (commit only when Clark says). Schema fork branch `feat/w3geekery-smemart-profile-consolidation` synced clean @ upstream/main `539b603`, no schema commits yet.** The mission NOW: **author the OrgProfile schema-consolidation PR** (ONE PR, Clark+Director hands-on, agents never push/PR). **READ FIRST:** `director/schema-consolidation-kickoff-2026-06-05.md` — it has the locked decisions, class inventory, OrgProfile field set + overlap guardrail, and the verified `zbb gate` process recipe (§3b). Decisions are LOCKED: `OrgProfile` (no `industry` — use `OrgSegment` Catalog links); owner-generic `Address` (`ownerType`+`ownerId`, `addressType` enum + free `userLabel`); org-scoped everything; ONE PR. Validate with **`zbb gate`** (not stale `npm run verify`); scratch DB Supabase PG17 :15432; dataloader@latest; commit `gate-stamp.json`. **VERIFY PR base `main` vs `dev`** before the PR (upstream docs disagree). Model new YAMLs on the existing `OrgCredential`/`Review` class files. Rules carried: schema PRs are Clark+Director hands-on (commit local only); LOOK FIRST; never broad-grep the filesystem (Clark flagged — scope searches, ask before big ones); release MCP lock + restore profile after any prod read; the prod-zb profile is a near-prod hazard (verify env before any write).

### Pinned moments from this session
Session JSONL: `~/.claude/projects/-Users-cstacer-Projects-w3geekery-zerobias-org-forks-app-package-w3geekery-sme-mart/<this session>.jsonl`. No new `[[PIN:]]` markers; durable capture is the kickoff doc + this parkit.

---
