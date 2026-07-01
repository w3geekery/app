# gsd-plan — Session Resume

**Written:** 2026-06-25 · **Session:** `gsd-plan` (sme-mart repo) · **For:** context-clear pickup
**Companion channel:** [`GSD-PLAN-CHANNEL.md`](./GSD-PLAN-CHANNEL.md) (gsd-plan <-> ui-meta-director; newest thread on top — READ IT FIRST on resume, it has moved fast)

---

## TL;DR — where we are

Two workstreams, both now in **ui-meta-director (umd)**'s hands on CI; my role was the sme-mart-side planning/decisions + doc stewardship.

1. **Hugo / WordPress Retirement** — task tree + silo sort DONE; umd scaffolded it in the CI Projects App. Stable, nothing pending from me.
2. **Readiness (Brian's ask)** — **PIVOTED.** Started as "map compliance frameworks into the Projects App tree." As of 2026-06-24 it was **reframed to Boundary scope** and is **blocked on Chris's Boundary API refresh (week of 2026-06-29).** Do NOT resume the old Projects-App framework-fanout — see the pivot below.

---

## ⚠️ BIG PIVOT on Readiness (don't resume the stale plan)

When I paused, the plan was: scaffold ZeroBias Compliance Readiness in the Projects App = platform top node -> framework subprojects -> framework-hierarchy layers, and I had just posted decisions (SSDF=Draft, FedRAMP nests). **Then umd + Brian/Kevin reframed it (channel threads 2026-06-24):**

- **The compliance engine already EXISTS at Boundary scope** (SCF controls, evidence/collector/query/pipeline/alert bots, audit assessments — already wrapped by zb-ui-lib + rendered in Boundary Manager). Readiness is a **surfacing** problem at Project scope, **not an engine to build**. Only net-new: a composite conformance roll-up/score + PROV-O hash-chaining.
- **Brian's refined model is config-compliance / CSPM** (2026-06-23 design capture): Boundary inventory -> assets (VM/container) -> config standard (STIG / CIS / AWS, 3 siblings) -> Rule(=Requirement) -> Check(=assessment/Task). Rules MUST be Requirements (records), NOT project nodes (scale: ~30k rule-instances). Tree bottoms out at Standard/Asset.
- **Brian's UI:** a `Project > Requirements > Readiness` Miller-column navigator; rightmost column = rules (CIS/STIG/AWS), column before = VMs/containers.
- **Blocker:** framework-adoption on the Boundary is currently **broken** — can't add a baseline to a boundary today. **Chris refreshes the Boundary API starting wk of 2026-06-29**; Boundary Projects becomes a proper BM feature then (framework-adoption + SCF tree + Project-scoped surfacing land together).
- **The CI ZeroBias-Compliance-Readiness (ZCR) project tree umd built stays as-is** (empty framework taxonomy). **Do NOT invest further fanning it out in the Projects App — the real home is the refreshed boundary.** So my SSDF=Draft / FedRAMP-nests decisions are effectively **mooted** for the Projects-App tree (harmless; not worth executing).

**Net for resume:** Readiness is parked on Chris's API refresh (wk 06-29). Until then there's nothing for gsd-plan to drive on it except track the refresh and the CEO/CIO notes.

---

## What this session delivered (durable outputs)

### Hugo / WordPress Retirement
- Found epic **task-50** + subtasks; sorted into silos (UI = Clark/Tom, Backend = Kevin/Chris/Nic/Raghu, DevOps = Andrey-via-Kevin since Andrey is not a PROD party).
- **Created PROD tasks:** **task-59** (DevOps - S3/CloudFront pipeline + DNSimple; child of task-51; assigned Kevin) and **task-60** (Backend - catalog data API + anti-scrape; child of task-16; assigned Nic). Both tagged `feature`.
- **task-53** (contact form) dropped to **Low** + comment (Zoho Forms works fine; folds into task-54). **task-16** annotated.
- Wrote brief: [`hugo-wordpress-retirement-brief-2026-06-23.md`](./hugo-wordpress-retirement-brief-2026-06-23.md). Updated **DECISIONS D-55** with the silo sort + new tasks.
- umd scaffolded the program in the CI Projects App (Option B nested workstream projects — see channel "Hugo scaffold result").

### Readiness
- Processed Brian's 1:1 transcript -> [`../notes/meetings/2026-06-23-marketplace.md`](../notes/meetings/2026-06-23-marketplace.md) (Brian's main ask = readiness mapping prototype; picture-first, urgent).
- Wrote the Readiness brief to the channel; named the umbrella **ZeroBias Compliance Readiness** (Clark's pick — "Compliance" disambiguates from PA-001's commercial "Engagement Readiness").
- umd built CI PART 1 (8 projects, catalog IDs, scale findings, cutover proposal) — then the pivot landed.

### Doc fixes (governs delivery — I was wrong, Clark caught it)
- **Verified live:** `governs`/`governed_by` link type IS delivered — PROD id `182d7b8a-6f3e-11f1-866c-d738f5bdb3a1` (`project->project`, `multi:true`, `inherit:false`); LIVE on CI since 2026-06-19. Link-type ids are **per-environment** — resolve by predicate string at runtime, never hardcode.
- Fixed the stale "stubbed / not delivered" claims in [`provisioner-refactor-governance-node-2026-05-29.md`](./provisioner-refactor-governance-node-2026-05-29.md) and in memory `project_sme_mart_hierarchy_model.md`. (Local `.planning/docs/BACKEND_FEATURE_REQUESTS.md` was already corrected by gsd-execute.)
- Architecture call recorded in chat (not yet a DECISIONS entry): a program root binds to an engagement via the **`governs` link (lateral), NOT parentId under a default project**; and `governs` is **optional** (no "every program governed" invariant — compliance governance is the Boundary). Consider writing this as a DECISIONS entry if it needs to be durable.

---

## Key IDs

**Hugo PROD tasks** (board UI Feature Requests `5631d499-…`): epic task-50 `b68b74d4-69bd-4868-9f63-2b7d612d725e` · task-51 `cf05d231-…` · **task-59 `60bc6628-82b7-471a-a3bf-c97d8ff2b378`** · task-52 `789b8fe6-…` · task-53 `3f259575-…` (Low) · task-54 `91fd26fb-…` · task-55 `714d26ab-…` · task-16 `cdeedcda-…` · **task-60 `32d73d9e-1fc0-4c88-868e-60257d655d64`**.

**CI ZCR projects** (built by umd, now frozen/empty): anchor `717c8221-…` (RDY-PLATFORM); framework children SOC2-2017 `034dd162-…`, SOC2-2022 `6c13a812-…`, SSDF `85557f09-…`, CMMC `e20d0e5b-…`, FedRAMP Low/Mod/High `cbfc9536-…`/`15197979-…`/`2161bd31-…`. **Do not extend these** (pivot to boundary).

**Readiness Backend FRs of note** (zb/ui): subtree `taskMetrics` (DELIVERED, ex-PS-001) for accordion rollup; PA-001 = the *other* readiness (commercial, don't reuse).

---

## Open / pending (and who owns)

- **Readiness** — parked on **Chris's Boundary API refresh (wk of 2026-06-29).** Then collaborate to make Boundary Projects a real BM feature. Owner side: umd + Chris + Tom (Tom: BM gets only a Projects simple-panel on the boundary Overview, no nav tab). gsd-plan just tracks.
- **Hugo** — umd's people-layer (roles/members) + Notes/Docs seeding still pending Clark decisions (see channel "Hugo scaffold result"); not urgent.
- **Optional:** turn the governs/governance-binding architecture call into a DECISIONS entry.

## Where to read on resume (in order)

1. **[`GSD-PLAN-CHANNEL.md`](./GSD-PLAN-CHANNEL.md)** — top threads (the 2026-06-24 reframe + blocker). Authoritative current state.
2. **`../notes/CEO_NOTES.md`** + **`../notes/CIO_NOTES.md`** — new convention: raw Brian/Kevin input lives here, channel carries pointers.
3. zb/ui plans: `.claude/plans/public/boundary-manager-projects-surfacing.md`; docs: `.claude/docs/BOUNDARY_COMPLIANCE_API_REFERENCE.md`, `BENCHMARKS_REFERENCE.md`, `COMPLIANCE_ENGINE_SCALE_MECHANISM.md`.
4. DECISIONS **D-55** (Hugo) + memory `project_sme_mart_hierarchy_model.md` (D-52 governance model, now with governs-delivered correction).

## State flags
- **ZB MCP lock:** released (was prod-zb). Re-acquire before any MCP call.
- **No `[[PIN:]]` markers dropped this session** — the decision anchors are the channel threads (by date/topic) + DECISIONS D-55.
- Profile when last connected: prod-zb. Readiness/Hugo CI work is on the `ci-zb` profile (org ZeroBias `57c741cf…`, Platform boundary `34607b28-…`) — umd's env, not mine.
