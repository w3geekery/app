# Director Parks — Resume Context

**Scope:** This file is the resume context for the Director Parks session (the meta:director role instance on SME Mart). Other Claude sessions on this repo have no reason to read it — it is owned by the Director role.

**If you are starting or resuming a Director Parks session, READ THIS FILE FIRST**, then `.planning/director/SESSION-STATE.md`, then the latest entries in `.planning/director/DECISIONS.md`.

**Session pointer:** `claude --resume "Director Parks"`
**Branch (app repo):** `poc/sme-mart`
**Working dir:** `/Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart`

**This doc holds only the latest 1-2 parkit sections** (handoff scratchpad — kept lean so it always reads whole, under the 256KB Read cap). Older sections demote to `DIRECTOR-PARKS-LOG-2026-H1.md` (grep-only cold archive; never loaded by default). The durable, indexed record lives in **memex** (`search_notes`) + **DECISIONS.md** (D-NN) — that's the searchable knowledge layer, not this file. `parkit` (SAVE mode) demotes the oldest section to the archive whenever this doc exceeds 2 sections.

---

## 📍 LATEST: 2026-06-15 parkit (30) — Services taxonomy LIVE through L1 (L2 PR #30 open) · Contact-Us form rebuild specced (036) · both parked on external people (Daniel, Chris)

**TL;DR — two workstreams, both authored/specced and parked awaiting OTHER people, not us.** (1) The Services segment taxonomy was split into top-down LEVEL PRs per Chris ("no inside-dep publishing — publish top first, then down"): **L0 `d_svc` + L1 37 `c_*` PUBLISHED 1.0.0**; **L2 131 `s_*` = PR #30 OPEN, awaiting Daniel's merge** → completes the 169-pkg taxonomy + resolves the `ProviderServiceSegment` build-breaker. (2) **Contact-Us lead-gen form rebuild** (Brian directive, backlog **036**): eligibility criteria found already locked, build-ready field spec written; **BLOCKED on Zoho admin access (Chris notified)**. Soft-launch (Projects App shell) shaping was HANDED OFF to ui-meta-director. App `src/` unchanged; this session's commits are all `.planning/` + the segment fork.

### ⏭️ RESUME HERE (parkit-30)

**Segments — when Daniel merges L2 (#30):**
1. Watch the new "Publish Segment" run: `gh run list --repo zerobias-org/segment --workflow "Publish Segment" --limit 3`. All-green → 131 services published → **taxonomy COMPLETE**.
2. Then retire the full-tree archive branch `feat/service-segments` @ `69c600e` (no longer needed); mark the workstream done. Build-breaker resolved (provider service-lines now have real Catalog service-type segments to point at).

**Contact-Us form (036) — BUILD DAY is 2026-06-16 (Chris grants Clark Zoho admin):**
3. Spec is LOCKED (Brian confirmed all 4 on 6-15; live form + CRM schema captured). **3 new form fields:** Business Classification, Number of Employees, **Identity Provider/SSO** (Brian 6-15 — dropdown of Auth0-supported IDPs + "Other (specify)" that still submits but flags "needs Auth0 support"). Once admin access lands, work the **build checklist** in `contact-us-form-field-spec-2026-06-15.md`: get the supported-IDP list + `Identity Provider` picklist + "needs-support" flag mechanism **from Chris** → create the 2 custom Lead fields (Business Classification 7 values; Number of Employees 5 bands; IDP maps to the EXISTING `Identity Provider` field) → build the Org-owned form → wire mapping + web-form Lead Source, **preserve the `Review Status` approval gate (no auto-approve)** → swap onto `zerobias.com/contact-us/` (may need site edit access) → decommission the old `evaughn` form.
4. Brian's locked answers: bands = 5 brackets; self-attested (Chris verifies); silent capture; large nonprofit/gov >100 = still eligible (type-based wins, <100 cap only for private for-profits).

### What happened (parkit-30)
- **Segments level-split + publish.** Chris: "no inside-dep publishing — publish top first, then down." Split `69c600e` into 3 level branches. **L0 `d_svc` (#28)** merged+published 1.0.0 all 5 envs; **L1 37 `c_*` (#29)** merged+published 1.0.0 (run `27439349155` green); **L2 131 `s_*` (#30)** open/clean. **Gate recipe nailed:** `unset ZB_SLOT; zbb :zerobias:<code>:gate` (slot-less, remote dataloader-service); **gate-stamps MUST be committed** (publish preflight requires them — the parkit-29 "don't commit" guidance was WRONG); gate many via a **SCRIPT FILE**, not a pasted one-liner (long-paste truncation bit us twice). Verified each level's stamps (passed + distinct sourceHashes) before push. **Daniel merges directly — NO approve-label on this repo.** Recipe saved to memex: "zbb segment/content gate — slot-less recipe".
- **Contact-Us form (036, Brian directive).** Rebuild `zerobias.com/contact-us` Zoho Form (creates a Zoho CRM Lead). Goals: add Guild/Foundation eligibility fields + re-own under the Org (current owner = departed `evaughn`). **Found Brian's criteria already LOCKED** (May): `guildEligible = (nonprofit OR gov OR <100 emp) AND NOT (public-traded OR PE-backed OR >100)`. Derived **2 new fields**: Business Classification (picklist) + Employee count (band) — both confirmed **net-new custom Lead fields** (no std No-of-Employees/Industry on the "Auditmation Lead" layout; distinct from the existing CC Org Type / Partner Service Focus / Lead-Contact Type axes). Live form is dumb-simple (Name/Phone/Company/Website/WorkEmail + privacy notice + T&C). **Approval gate = `Review Status` field; Chris Scarola = default Lead Owner.** Zoho tooling recon: no Forms MCP — manual UI build. **Blocker: Zoho Setup/admin access — Clark permission-denied; Chris notified.** 4 confirmations out to Brian (only band granularity touches a field).

### State (parkit-30)
- **Segment fork** (`~/Projects/w3geekery/zb-forks/org/segment`): `feat/service-segments-l0-dsvc` (→ merged #28), `-l1-categories` (→ merged #29), `-l2-services` (#30 OPEN, HEAD `98de0ab`). Full-tree archive `feat/service-segments` @ `69c600e` intact (retire after L2 publishes).
- **App repo** (`poc/sme-mart`): `src/` unchanged. New `.planning/` artifacts: `director/backlog/036-rebuild-contact-us-leadgen-form-foundation-eligibility.md`, `director/contact-us-form-field-spec-2026-06-15.md`, `notes/schedule-tab-requirements-2026-06-12.md`.
- **Machine config (from parkit-29, still live):** `~/.zbb/config.yaml` (Java 21 pin); `~/dev_env_vars` `ZB_TOKEN` = `360d626e…`.
- **MCP:** `prod-zb`.

### In-flight / blockers (parkit-30)
- **Segments:** L2 PR #30 awaiting Daniel's direct merge → then watch the publish run.
- **Contact-Us form:** spec LOCKED (Brian confirmed all 4, 6-15). **Build day = 2026-06-16** when Chris grants Clark Zoho admin → work the field-spec build checklist.
- **Soft-launch (Projects App):** HANDED OFF to ui-meta-director; Schedule-tab reqs doc written. Not Director's active thread.

### Key docs / learnings (parkit-30)
- Memex: **"zbb segment/content gate — slot-less recipe"** (gate howto). Segments toolchain detail (Java 21, ZB_TOKEN, dataloader-service) → parkit-29 (now in `DIRECTOR-PARKS-LOG-2026-H1.md`) + memex.
- **Field spec:** `.planning/director/contact-us-form-field-spec-2026-06-15.md` (build-ready: CRM mapping + 2 custom fields + Review Status gate). The form is the front-end capture half of the onboarding "Classify" layer (`.planning/director/default-engagement-onboarding-backend-requirements-2026-06-02.md`) + `GUILD-ELIGIBILITY-CLASSIFICATION-1`.
- **Schedule tab reqs:** `.planning/notes/schedule-tab-requirements-2026-06-12.md` (search+options→remote-table; timeline+calendar; ICS/RSS interop; data shape via backend feature request).

### Quick-start prompt (parkit-30)
You're Director Parks for SME Mart. Two workstreams, both parked on other people. **(1) Services segment taxonomy** (169 pkgs in `~/Projects/w3geekery/zb-forks/org/segment`): published top-down per Chris — L0 `d_svc` (#28) + L1 37 categories (#29) LIVE at 1.0.0; **L2 131 services (#30) is OPEN awaiting Daniel's direct merge** → when it merges, watch the "Publish Segment" Actions run; all-green = taxonomy COMPLETE (resolves the `ProviderServiceSegment` build-breaker) → retire the `feat/service-segments` archive branch. Gate recipe (memex "zbb segment/content gate — slot-less recipe"): `unset ZB_SLOT; zbb :zerobias:<code>:gate`, COMMIT the gate-stamps, gate via a script file (not a pasted one-liner). Daniel merges directly (no approve-label). **(2) Contact-Us lead-gen form rebuild** (backlog 036, Brian directive): rebuild the `zerobias.com/contact-us` Zoho Form (creates a CRM Lead) to capture Guild/Foundation eligibility + re-own under the Org (owner = departed `evaughn`). Criteria locked: `guildEligible = (nonprofit OR gov OR <100 emp) AND NOT (public OR PE OR >100)`. Build-ready field spec at `.planning/director/contact-us-form-field-spec-2026-06-15.md` (2 new custom Lead fields: Business Classification + Employee count; `Review Status` = Chris's approval gate; has a build checklist). **Spec LOCKED — Brian confirmed all 4 (6-15); Chris grants Clark Zoho admin 2026-06-16 → that's BUILD DAY: work the checklist.** Soft-launch (Projects App shell) handed to ui-meta-director; Schedule-tab reqs at `.planning/notes/schedule-tab-requirements-2026-06-12.md`. **Rules:** content/segment PRs are Clark+Director hands-on (agent authors + local-commits + verifies stamps; Clark gates in his shell; push/PR walked together; no autonomous merge); the Zoho build needs admin (Chris); LOOK FIRST.

### Pinned moments (parkit-30)
Session JSONL: `~/.claude/projects/-Users-cstacer-Projects-w3geekery-zerobias-org-forks-app-package-w3geekery-sme-mart/61d026a4-326a-4272-bf67-577b752c6068.jsonl`

No `[[PIN:]]` markers dropped this session.

---
