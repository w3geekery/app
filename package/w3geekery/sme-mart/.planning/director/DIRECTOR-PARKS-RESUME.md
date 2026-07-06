# Director Parks — Resume Context

**Scope:** This file is the resume context for the Director Parks session (the meta:director role instance on SME Mart). Other Claude sessions on this repo have no reason to read it — it is owned by the Director role.

**If you are starting or resuming a Director Parks session, READ THIS FILE FIRST**, then `.planning/director/SESSION-STATE.md`, then the latest entries in `.planning/director/DECISIONS.md`.

**Session pointer:** `claude --resume "Director Parks"`
**Branch (app repo):** `poc/sme-mart`
**Working dir:** `~/Projects/w3geekery/zb-forks/org/app/package/w3geekery/sme-mart` (app repo moved here from `zerobias-org-forks/app` on 2026-07-03 — see parkit-37).

**This doc holds only the latest 1-2 parkit sections** (handoff scratchpad — kept lean so it always reads whole, under the 256KB Read cap). Older sections demote to `DIRECTOR-PARKS-LOG-2026-H1.md` (grep-only cold archive; never loaded by default). The durable, indexed record lives in **memex** (`search_notes`) + **DECISIONS.md** (D-NN) — that's the searchable knowledge layer, not this file. `parkit` (SAVE mode) demotes the oldest section to the archive whenever this doc exceeds 2 sections.

> **⚠ WORKSPACE-INTEGRITY NOTE:** this resume doc + director workspace are **uncommitted** (Clark controls commits). A shared-tree git op once reverted this doc silently (parkit-31/32 lost — durable content survived in memex + DECISIONS + channels). Commit the director workspace at the next stable window to be safe.

---

## 📍 LATEST: 2026-07-03 parkit (37) — app repo MOVE executed cleanly (`zerobias-org-forks/app` -> `zb-forks/org/app`); full path-migration sweep DONE (launchd/hooks/zbb/launcher/docs/memex/skills); app-move fixups COMPLETE; the REAL paused work (provisioning rebuild + axis-model + #8) is unchanged and next

**TL;DR.** The app repo move happened and is **clean** — new path confirmed, `git` HEAD `644c3458` + ahead-17 intact, **memory migrated** (`cp -a` of the Claude project dir), and **gsd-plan (`0862a3e4`) + gsd-execute (`0b53dd57`) sessions came along** (they shared the `-sme-mart` project dir, 160/160 JSONLs copied). Then a comprehensive path-migration sweep of everything that hardcoded the old path: **launchd** (2 agents: slack-scorer + slack-scanner WorkingDirectory, reloaded), **`settings.json:279`** (schema-guard hook re-registered — I took ui-gsd's piece; guard is live), **zbb** (3 sme-mart-local stack `source:` lines), the **launcher `~/bin/sme-mart-director.sh`** (`SME_MART` var — was pointing at the dead path), the **`memex-session-start.py`** hook matcher, **`daemon/roster.json`**, the in-repo **`architect-skill-gate.sh`** hook, the **slack-scanner skill**, the **`~/.claude/docs/projects.md`** registry (SME Mart rows + RETIRED marker for the old container), in-repo docs (`SOURCE_PATHS.md`, `SCHEMA_CHANGE_PROCESS.md`, `CLAUDE.md` fork-root directive), and **7 memex notes**. All FUNCTIONAL refs are clean; only intentional retired-markers + historical artifacts (old plans/handoffs/post-mortems/stashes/session logs) keep the old string.

### ⏭️ RESUME HERE (parkit-37)

**1. APP MOVE + PATH SWEEP COMPLETE — nothing move-related pending** except optional cleanup: delete the OLD Claude project dirs (`~/.claude/projects/-Users-...-zerobias-org-forks-*` — duplicates left by the `cp -a`) and the now-empty `~/Projects/w3geekery/zerobias-org-forks/` container, once you're confident everything resumes. ui-gsd's `settings.json` piece is DONE (I took it). `/ss`, `/zb-task`, `/tt` etc. were verified clean (only slack-scanner had hardcoded the path).

**2. THE REAL WORK (paused, unchanged) — provisioning/onboarding rebuild decision.** Two open questions for Clark: **(a) lead vs mirror** — how far ahead of the zb/ui reference app should SME Mart run? Engagement-as-role-TAG is safe (matches #8 + zb/ui). The `projectTypeId`-positional-tiers + `governs`/`engages` links are where SME Mart would be *leading* the platform. **(b) dynamic ID resolution** — does the SDK expose a `ProjectTypeTree`/`ProjectTypeOption` **API** to fetch project-type IDs at runtime? If yes, the hardcoded `constants/project-types.ts` (what broke /projects) evaporates. **Feeds the axis-model thread** (projectTypeId = Type/nesting axis ONLY; engagement + program = `feature`s, not project-types; domains = `project-domain` tags; "load-bearing ⇒ NOT a tag"). Full research + findings in parkit-36 below.

**3. #8 / tag-axis reconciliation (RECONCILE-TAG-AXES, backlog 042).** Check if `zerobias-com/tag` #8 merged (Nic was replacing the project-type IDs, "later tonight" 2026-07-02) → re-pull canonical project-type UUIDs, reconcile `constants/project-types.ts`. The stale-catalog-vs-SQL ID mismatch is literally why /projects was empty.

**4. Carryover:** UAT runtime smoke + `npm test` (migration verification gaps); STATE/PROJECT label v1.4->v1.5; `/meta:sync` + `/gsd-update` at milestone boundary; RECONCILE-FR-014 (task-71).

### State (parkit-37)
- **Working dir NOW: `~/Projects/w3geekery/zb-forks/org/app/package/w3geekery/sme-mart`** (move verified — old app gone, new present, git intact).
- **App repo** (`poc/sme-mart`): HEAD `644c3458`, ahead of upstream by 17, **NOT pushed**. Uncommitted pile grew this session — the path sweep + prior edits touched `check-git-workflow.sh`, `SOURCE_PATHS.md`, `SCHEMA_CHANGE_PROCESS.md`, `CLAUDE.md`, `RDF-COMPASS.md`, `CEO_NOTES.md`, the channel, this RESUME, + `app-repo-move-plan-2026-07-03.md`, on top of the pre-existing untracked `.planning` pile. Clark controls commits.
- **Global config swept** for the old path (see TL;DR list); durable refs clean, historical/retired-marker refs intentionally kept.
- **MCP:** locks released.
- **Cleanup pending (optional):** old Claude project dirs + empty `zerobias-org-forks/` container.

### Quick-start prompt (parkit-37)
You're Director Parks for SME Mart, now in the new location (`zb-forks/org/app/...` — app repo moved 2026-07-03, verified clean, memory + gsd sessions migrated). **The app move + entire path-migration sweep are DONE** — nothing move-related is pending except optional cleanup of the old duplicate Claude project dirs + empty container. **Go straight to the REAL paused work: the onboarding/provisioning rebuild decision** — lead-vs-mirror (engagement-as-role-TAG is safe/matches #8; projectTypeId-tiers + governs-links = SME Mart leading the platform) and whether the SDK exposes a ProjectTypeTree API for dynamic project-type-ID resolution (kills the hardcoded constant that broke /projects). Ties to the parked axis-model thread (projectTypeId = Type/nesting ONLY; engagement+program = features; "load-bearing ⇒ NOT a tag"). Check if `zerobias-com/tag` #8 merged → reconcile `constants/project-types.ts` (backlog 042). Full research/findings in parkit-36. **Rules:** coarse commits, NEVER push/CI without Clark's say-so, local-scoped tests; file channels self-deliver; verify against disk/build not agent reports; LOOK FIRST; trust-but-verify channel path claims (bit me repeatedly this session). Carryover: UAT smoke + npm test, STATE/PROJECT v1.4->v1.5, /meta:sync + /gsd-update at milestone boundary.

### Pinned moments (parkit-37)
Session JSONL now under: `~/.claude/projects/-Users-cstacer-Projects-w3geekery-zb-forks-org-app-package-w3geekery-sme-mart/` (migrated from the `zerobias-org-forks` hash dir via `cp -a`).

| Pin | What it marks |
|---|---|
| `[[PIN:sme-mart-ahead-of-platform-engagement-is-role-tag]]` | SME Mart on platform-sdk 2.0.10 (has projectTypeId); zb/ui 2.0.5 doesn't. Reference pattern = engagement is a hydra node-role tag via listTaggedResources, not projectType/parentId. Migration mis-encoded it. |

Drill in: `/pins sme-mart-ahead-of-platform-engagement-is-role-tag`.

---

## 📍 2026-07-03 parkit (36) — smoke-test found /projects empty (root cause = stale-IDs + dead parentId-model); DECIDED to rebuild provisioning; research says SME Mart is AHEAD of zb/ui (engagement = role-TAG); PAUSED on lead-vs-mirror; RDF-COMPASS Holon->System swept

**TL;DR.** Smoke-tested the SDK 2.x migration against UAT: **plumbing HEALTHY, no runtime regression.** But `/projects` renders empty despite 2 rows on the wire — root cause = the tier filter compares `Project.projectTypeId` against the **stale catalog constant** in `constants/project-types.ts` (`4a7b806c…`) while live UAT rows carry **Nic's SQL IDs** (`420b0753…` project / `b39bf3eb…` engagement); compounded by the demo rows being **stale + modeling a dead parentId-hierarchy** (engagement is a `governs` link NOW, not a parent). Clark's call: **delete the stale engagements/default-projects and REBUILD the onboarding/provisioning path from scratch** on the proper hierarchy. Researched zb/ui Projects App → **SME Mart is running AHEAD of the reference app** (platform-sdk 2.0.10 has `projectTypeId`; zb/ui 2.0.5 doesn't) and the battle-tested engagement pattern is a **hydra node-role TAG** (via `listTaggedResources`), NOT `projectType`/`parentId` — the migration mis-encoded engagement as `projectType==engagement`. **PAUSED on the lead-vs-mirror decision.** Then a large repo-reorg housekeeping wave (hook paths, `SOURCE_PATHS.md` deferral, `RDF-COMPASS.md` Holon->System sweep + C-6/C-7).

### ⏭️ RESUME HERE (parkit-36)

**1. (SUPERSEDED by parkit-37 — the app move + fixups are DONE.)** Original note: finish the app-move fixups per `.planning/notes/app-repo-move-plan-2026-07-03.md`. All complete as of parkit-37.

**2. THE REAL WORK (paused) — provisioning/onboarding refactor decision.** Two open questions for Clark: **(a) lead vs mirror** — how far ahead of the zb/ui reference app should SME Mart run? Engagement-as-role-TAG is safe (matches #8 + zb/ui). The `projectTypeId`-positional-tiers + `governs`/`engages` links are where SME Mart would be *leading* the platform (nobody uses governs-links yet) — deliberate call, not migration-accident. **(b) dynamic ID resolution** — does the SDK expose a `ProjectTypeTree`/`ProjectTypeOption` **API** to fetch project-type IDs at runtime? If yes, the whole hardcoded `constants/project-types.ts` (what broke /projects) evaporates. **This feeds the axis-model thread** (see below).

**3. Axis-model thread (parked for post-move, per Clark).** ui-meta-director 2026-07-03: `projectTypeId` should carry **ONLY the Type/nesting axis** (project/workspace/aperture/thread). **Engagement and program are NOT project-types — they're `feature`s; compliance/security/etc. are `project-domain` tags.** Rule: **"load-bearing ⇒ NOT a tag."** If current `projectTypeId` modeling folds engagement/program/domain into the type discriminator, that's the thing to unwind — which is exactly the provisioning refactor. Full axis breakdown in that channel thread.

**4. #8 / tag-axis reconciliation (RECONCILE-TAG-AXES, backlog 042).** Nic said he'd merge `zerobias-com/tag` #8 "later tonight" (2026-07-02), **replacing the project-type IDs**. CHECK if #8 merged → re-pull canonical project-type UUIDs, reconcile `constants/project-types.ts`. The stale-vs-SQL ID mismatch is literally why /projects was empty.

**5. Carryover:** UAT runtime smoke + `npm test` (the two migration verification gaps, still open); CEO_NOTES **has** the 2026-07-03 Holon-kill note; STATE/PROJECT label v1.4->v1.5; `/meta:sync` + `/gsd-update` at milestone boundary; RECONCILE-FR-014 (task-71).

### Key facts / decisions (parkit-36)
- **Smoke-test verdict:** SDK 2.x plumbing HEALTHY (call executes, deserializes, transforms, renders — no regression). `/projects` empty = stale catalog-constant IDs + stale demo rows on a dead parentId-model. `/engagements` shows 1 but via the OLD `!parentId` filter (`listEngagements`) — a FALSE pass, not the new model. `getProjectTierProject` uses both stale assumptions (parentId + broken constant).
- **Research (zb/ui Projects App, HEAD 3f8a37e02):** engagement = hydra node-role TAG (`PortalProjectsService.searchEngagements` → `listTaggedResources`, interim CI-hardcoded tag id, moving to server-side `ProjectApi.search({tags})`). Nesting = `parentId` (both apps; `getTree()` exists, unused). governs/engages links used NOWHERE (only `member_of` project→boundary). Provisioning dead-simple: `ZbCreateProjectDialog` (name/visibility/membershipPolicy/description/optional parent+boundary) + seed creator as Member. Mirror `PortalProjectsService` + `ResourcesService`. Rebuild target is SMALLER than current.
- **SDK versions:** SME Mart platform-sdk **2.0.10** (has `projectTypeId`); zb/ui **2.0.5** (doesn't). angular-client both at latest **2.0.13**. zb/ui updating = catching UP to SME Mart's chain.
- **RDF-COMPASS.md swept 2026-07-03:** Holon->System / Hologram->System state (Brian ruling; concepts unchanged, filenames+permalink kept for links). Added **C-6** (§3.6 round-trip promoted) + **C-7** (§3.7 template-provenance) → real C-1..C-7. Fixed dangling memex pointer. Memex mirror note also updated to C-1..C-7. BACKLOG-110 RESOLVED.

### Quick-start prompt (parkit-36)
(Superseded by parkit-37's quick-start; kept for the research detail above.) The onboarding/provisioning rebuild is the real work: lead-vs-mirror + ProjectTypeTree dynamic-ID question, feeding the axis-model thread. Smoke test proved SDK 2.x healthy; the empties are data/model reconciliation, not code regression.

### Pinned moments (parkit-36)
`[[PIN:sme-mart-ahead-of-platform-engagement-is-role-tag]]` (carried forward to parkit-37 table above).
