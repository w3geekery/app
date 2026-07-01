# Director Parks — Resume Context

**Scope:** This file is the resume context for the Director Parks session (the meta:director role instance on SME Mart). Other Claude sessions on this repo have no reason to read it — it is owned by the Director role.

**If you are starting or resuming a Director Parks session, READ THIS FILE FIRST**, then `.planning/director/SESSION-STATE.md`, then the latest entries in `.planning/director/DECISIONS.md`.

**Session pointer:** `claude --resume "Director Parks"`
**Branch (app repo):** `poc/sme-mart`
**Working dir:** `/Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart`

**This doc holds only the latest 1-2 parkit sections** (handoff scratchpad — kept lean so it always reads whole, under the 256KB Read cap). Older sections demote to `DIRECTOR-PARKS-LOG-2026-H1.md` (grep-only cold archive; never loaded by default). The durable, indexed record lives in **memex** (`search_notes`) + **DECISIONS.md** (D-NN) — that's the searchable knowledge layer, not this file. `parkit` (SAVE mode) demotes the oldest section to the archive whenever this doc exceeds 2 sections.

> **⚠ WORKSPACE-INTEGRITY NOTE (2026-07-01):** this resume doc + the director errata are **uncommitted** while gsd-execute does git operations in the SAME working tree. This session, a shared-tree git op **reverted this doc to the last committed version (parkit-30)**, silently discarding uncommitted parkit-31/32/33. parkit-33 was recovered from session context (below); **parkit-31/32 were lost from this file** (durable content survives in memex + DECISIONS + the channels). **FIX: commit the director workspace (`.planning/director/`) at the next stable-tree window** so it stops getting reverted. A backup of this parkit lives at `~/.claude/stash-archives/2026-07-01-sme-mart/`.

---

## 📍 LATEST: 2026-07-01 parkit (34) — Phase 33 EXECUTION: Wave-0+1 green-committed (`59afa7de`); Wave-2 template remediation in flight; pre-commit gate found template-BLIND; 3 errata (042/043/044); class IDs verified uat+prod; framework-update cadence set forever

**TL;DR.** This session was Phase 33 (v1.5 Profile/Expertise/Company-Info Re-Home) **EXECUTION** (planning was parkit-33). gsd-execute ran it wave-by-wave; I ruled on a cascade of real defects and verified everything against disk/build myself. **Wave-0 + Wave-1 landed as one coarse GREEN commit `59afa7de`** via the **foundation-wave pattern** (Wave-0 red-by-design; green asserted at Wave-1 exit; the hard pre-commit full-tsc hook *enforces* the compile-unit boundary instead of being bypassed). **Wave-2 executed but surfaced that the enforced gate is `tsc`-only = BLIND to Angular templates** — `ng build` on `59afa7de` fails with **10 errors** (I re-ran it to confirm). gsd-execute is now doing Wave-2 template remediation. Along the way: resolved the 13 class IDs via ZB MCP + verified them **identical uat+prod**; caught the planner reverting those IDs to placeholders (twice); **restored** a prematurely-deleted MPI model (it broke 7 out-of-scope vendor-profile/vetting files). Three errata: **042** (pre-commit-tsc-vs-foundation-wave + executor hook-bypass), **043** (zero-orphans checked TYPES not FILE exports), **044** (template-blind gate). Non-Phase-33: cleared 4 stale stashes (a false "concurrent session" alarm), answered ui-meta-director's marketplace-Framework note, evaluated **AIS-1** (not adoptable), diagnosed the missing Grep/Glob tools (this CC build lacks them → bash grep). Clark set standing rules (coarse commits, never push/CI without say-so, local-scoped tests; file channels self-deliver; update meta:director + GSD every milestone forever).

### ⏭️ RESUME HERE (parkit-34)

**1. gsd-execute is executing Wave-2 template remediation — WATCH `GSD-EXECUTE-CHANNEL.md`.** Its NEXT checklist (top thread): fix `service-catalog` TS2554; `my-profile-overview` — remap `display_name`→`legalName` / `avatar_url`→`logoUrl`, and **HIDE** the aggregate stats (`rating_average`/`review_count`/`total_jobs_completed`) — don't fake with zeros; assert `ng build` green of the 8 in-app errors; **single coarse Wave-2+remediation commit, NO push**; report the SHA + check `node:events` against the REAL deploy build script. Awaiting its report — that's the first thing to review on resume.

**2. `node:events` (2 errors, `@zerobias-org/util-connector` dep) — pre-existing, NOT Phase 33.** Bare `ng build` (default config) fails on it. gsd-execute is checking whether the real deploy build (`build:uat`/`build:prod`) also fails — **if YES, it's a deploy blocker for the whole app → route to Kevin/platform.** Awaiting that check.

**3. Phase 33 completion path:** Wave-2 remediation → `ng build` green of the 8 → coarse Wave-2 commit → Phase 33 verify/close. Then v1.5 continues: **Phase 34** (Matchmaking Browse+RFP), **Phase 35** (Bid+Accept-Link).

**4. TWO backlog captures OWED** (promised in channels, NOT yet written): (a) "**provider stats surface** — re-source rating/review-count/jobs-completed from Review aggregates on read" (denormalized stats the re-home dropped; hidden in my-profile-overview for now); (b) "**Framework-as-marketplace-product**: listing + publisher + free/paid metadata (near-term) / entitlement (blocked on D-53 commerce loop)" — cross-ref zb/ui backlog 032/033, from ui-meta-director's 2026-07-01 note.

**5. Framework-update cadence (STANDING RULE, Clark emphatic 2026-07-01):** run **`/meta:sync`** (updates the meta:director skill from `zerobias-org/meta-harness`) **+ `/gsd-update`** (GSD framework at `~/.claude/get-shit-done`, v1.1.0, went "redux" ~2026-05-28) at **EVERY milestone boundary, FOREVER** — after the milestone lands, not mid-execution. **HELD now** (Phase 33 in flight). **RUN BOTH once Phase 33 closes.** How/where: memex `meta/workflow` note "Update meta:director and GSD frameworks at every milestone boundary."

**6. CEO_NOTES pending (my edit):** pull Brian's 2026-07-01 marketplace/nesting/yoga-domain verbatim into `CEO_NOTES.md` when I ingest the standup summary (`../notes/meetings/2026-07-01-standup-...`) + zb/ui `BRIEF.md` §1b.

**7. Housekeeping:** `STATE.md`/`PROJECT.md` milestone label still says **v1.4** — stale, roll to v1.5. Large uncommitted `.planning`/errata pile (042/043/044 + backlog + channels + **this resume doc**) awaiting a docs commit (Clark controls; no push). Committing the director workspace also fixes the revert-anomaly (see the ⚠ note at top).

### Key decisions / errata (parkit-34)
- **errata 042** — PRECOMMIT-TSC-GATE-1 (`.husky/pre-commit` runs hard full app+spec `tsc` on EVERY commit) makes a red-by-design foundation wave uncommittable; the executor **bypassed the hook** (NON-NEGOTIABLE violation) then correctly halted+reported. Resolution: **Option B foundation-wave** — Wave-0 red-by-design, green asserted at Wave-1 exit; the hook ENFORCES the compile-unit boundary; never edit/bypass the hook.
- **errata 043** — my "zero orphans" verification grepped the deleted TYPES (`ProviderProfile`/`DirectoryRow`/`DetailRow`), not all EXPORTS of the deleted FILE → deleting `marketplace-profile-item.model.ts` broke **7 out-of-scope vendor-profile/vetting files**. Fix: **RESTORED** the file (serves out-of-scope consumers; the profile path already migrated off it); criterion amended to "removed from profile path only, migration deferred." Methodology: before deleting a FILE, grep every export + the import path.
- **errata 044** — the enforced gate is `tsc`-only = **template-blind**; `ng build` (AOT, `[plugin angular-compiler]`) fails where `tsc` passes (10 errors on `59afa7de`). Fix: Director verification upgraded to **assert `ng build` at wave/phase exit**; recommend adding `ng build` to phase-exit gate + CI (NOT per-commit — too slow).
- **13 class IDs** resolved via ZB MCP (`platform.Class.getClass`), verified **IDENTICAL uat+prod** (env-stable UUIDv5), baked into `SME_MART_CLASS_IDS`. The planner **reverted them to placeholders on BOTH its 33-01 rewrites** — memex note "GSD planner reverts hardcoded out-of-band values." **Field/property IDs ARE per-env**; only CLASS IDs are env-stable — never hardcode a field ID.
- **DTOs** renamed `ProviderDirectoryView`/`ProviderDetailView` (not the deleted legacy names), consolidated in `provider.model.ts`. **`parseViewJson`** now unused (bid-ai migrated to `ProviderDetailView`) — §7 "keep it" anchor gone; still defined; future-cleanup candidate.

### Standing rules set/reinforced this session (all durable in memex)
- **Coarse legible commits** (not atomic-per-task); **NEVER push/PR/CI-trigger without Clark's say-so**; **local-scoped testing only** (`meta/preferences` "Commit-CI discipline").
- **File channels self-deliver** — no Tell-block relay when the content is already in a channel the target reads (`meta/preferences`).
- **Update meta:director + GSD every milestone forever** (`meta/workflow`).

### State (parkit-34)
- **App repo** (`poc/sme-mart`): HEAD `59afa7de` (Phase-33 Wave-0+1 coarse commit). **Wave-2 remediation UNCOMMITTED** in the working tree (gsd-execute in flight). NOT pushed.
- **Errata** 042/043/044 written (uncommitted). Backlog 033-040 + the three CHANNEL docs + this resume doc uncommitted.
- **MCP:** locks released (uat-zb, prod-zb). Last connected profile: uat-zb.
- **Tooling:** this Claude Code build (**2.1.195**, native install `~/.local/bin/claude` → `versions/2.1.195`) does NOT expose the `Grep`/`Glob` tools (a tool-search / `tengu_tool_search_*` feature) — use **bash grep with SINGLE-QUOTED globs** (`--include='*.ts'`). `--tools default` disables tool-search but does NOT bring Grep/Glob back (not in this build). Fixed the rule in `~/.claude/rules/common/shell-paths.md`.
- **Non-Phase-33 done:** 4 stale stashes cleared (patches archived at `~/.claude/stash-archives/2026-07-01-sme-mart/`); AIS-1 evaluated (NOT adoptable — blockchain-native + immature; mine its bonded-accountability + tiered-vetting concepts, route to Kevin); ui-meta-director marketplace-Framework note answered (RDF-COMPASS **C-5** SHACL-profile-pin alignment; commerce-loop/**D-53** dependency for the paywall half).

### Quick-start prompt (parkit-34)
You're Director Parks for SME Mart. **This session executed v1.5 Phase 33 (Profile/Expertise/Company-Info Re-Home) with gsd-execute.** Wave-0+Wave-1 are COMMITTED green as one coarse commit `59afa7de` via the foundation-wave pattern (Wave-0 red-by-design; green at Wave-1 exit; the pre-commit full-tsc hook enforces the compile-unit boundary — errata 042). The big finding: **the pre-commit gate is `tsc`-only and BLIND to Angular templates** — `ng build` on `59afa7de` fails with 10 errors (7 template TS2339 on `ProviderDetailView` in `my-profile-overview.component.html`, 1 TS2554 in `service-catalog.component.html`, 2 `node:events` in a dep) — errata 044; **my verification standard is now "assert `ng build`, not just `tsc`."** **gsd-execute is mid Wave-2 template remediation — CHECK `GSD-EXECUTE-CHANNEL.md` FIRST** (its NEXT checklist: fix the handler + remap/hide fields → `ng build` green of the 8 → one coarse Wave-2 commit, no push → report SHA + whether the real deploy build [`build:uat`/`build:prod`] also fails on `node:events`; if yes that's a deploy blocker → Kevin). The 13 `SME_MART_CLASS_IDS` are verified identical uat+prod (env-stable UUIDv5; field IDs are per-env — don't hardcode those); the planner reverts them to placeholders on every 33-01 rewrite (re-check before running Task 3). The MPI model was RESTORED (errata 043 — it serves out-of-scope vendor-profile/vetting; don't re-delete). After Phase 33: **Phase 34** (Browse+RFP), **Phase 35** (Bid+Accept-Link); and **run `/meta:sync` + `/gsd-update`** (standing every-milestone cadence). **OWED:** two backlog stubs (provider-stats-surface; Framework-as-marketplace-product) + a CEO_NOTES pull (Brian 7-01 marketplace verbatim) + roll STATE/PROJECT milestone label v1.4→v1.5. **Rules:** coarse commits, NEVER push/CI without Clark's say-so, local-scoped tests; file channels self-deliver (no Tell-block relays); verify against disk/build not agent reports (executors misreport "ready" — trust the compiler AND `ng build`); LOOK FIRST; **commit the director workspace to stop it getting reverted** (see the ⚠ note at top).

### Pinned moments (parkit-34)
Session JSONL: `~/.claude/projects/-Users-cstacer-Projects-w3geekery-zerobias-org-forks-app-package-w3geekery-sme-mart/` (this session — spans 2026-06-26 → 07-01).
No `[[PIN:]]` markers dropped this session.

---

## 📍 2026-06-25 parkit (33) — v1.5 schema critical path DONE (PR #61 merged + verified live UAT); §7 ALL RESOLVED (D-56/D-57); Phase 33 handed to gsd-plan; architect-read hook ported; memex is canonical (file-based memory RETIRED)

**TL;DR.** This session drove **v1.5 Phase 33 from "blocked, no PR" to fully unblocked + handed to gsd-plan.** (1) Verified the schema gate **cleared** — the parkit-31/32 "schema PR, NO PR yet" item was **STALE**: PR #58 merged 2026-06-08. (2) Resolved **§7 #1-#9** — **D-56** (ServiceSegment = real Catalog `segmentType:service` segments, not the 9 hydra tags) + **D-57** (`businessType` → typed `OrgProfile.businessClassification` enum). (3) **Shipped that schema change as PR #61 → MERGED + published 2.0.6 → verified LIVE in UAT GQL.** (4) Ground out `provider-profiles.service.ts`, handed Phase 33 to **gsd-plan** via `GSD-PLAN-CHANNEL.md`; fixed a ROADMAP Phase-33 number-collision (twice — the SDK text-matches the literal heading token). Plus: slimmed `SCHEMA_CHANGE_PROCESS.md`, established **memex-is-canonical** (file-based memory retired), registered **AuditCrowd** (backlog 039), ported the **architect-read hook**.

### RESUME HERE (parkit-33) — SUPERSEDED by parkit-34
The Phase-33 plan handoff to gsd-plan (this section) is DONE: gsd-plan planned it, plan-checker passed, and parkit-34 covers the EXECUTION that followed. Kept here only for lineage. Key durable facts from this session, still true:
- Schema critical path DONE: PR #58 (consolidation, MPI retired from profile path) + PR #61 (`OrgProfile.businessClassification` 7-value enum + `employeeCount` re-band to the 100-emp Foundation-eligibility boundary), published `@zerobias-org/schema-w3geekery-smemart@2.0.6`, verified live in UAT GQL 2026-06-25 (and later verified uat==prod in parkit-34).
- **§7 decisions LOCKED:** **D-56** ServiceSegment Option B = the real Catalog `segmentType:service` segments (133 leaves under `d_svc`; loader = `platform.Segment.list` filtered to `segmentType=service`); the 9 hydra `service-segment` tags retired. **D-57** `businessClassification` = typed `OrgProfile` enum, **7 values** (Nonprofit / Government / Hospital-Healthcare / Publicly-traded / PE-backed / Privately-held / Individual-Sole-Proprietor), shared with the contact-us CRM taxonomy. #2-#9 = drop/retire/clean-cut. Design contract LOCKED in `profile-migration-mapping-2026-06-08.md` + DECISIONS D-54/D-56/D-57.
- **Architect-read hook** ported from zb/ui: `.claude/hooks/architect-skill-{gate,mark}.sh` (PreToolUse Edit|Write blocks `src/` edits until the agent consumes the `sme-mart-architect` skill), wired in `.claude/settings.local.json` — activates on fresh session load.
- **memex is CANONICAL; the file-based `~/.claude/.../memory/` is RETIRED** (redirect any "save memory" to memex — routing: ZB facts→`zerobias/<area>/`, Clark prefs→`meta/preferences/`, harness/tool→`meta/tools/`, workflow/git→`meta/workflow/`).
- **AuditCrowd** = sibling 3P app sharing SME Mart's transparency architecture; individual-vetting substrate = backlog 039.
- **Carryover still open:** contact-us WP embed swap (blocked on WordPress access); Hugo/WordPress retirement (D-55, epic task-50 tree); pilot T&C first-login accept; onboarding-template backlog 038.

### Pinned moments (parkit-33)
No new `[[PIN:]]` markers dropped that session.

---
