# 042 — Migrate SME Mart onto the Project tag-AXIS model (type / role / archetype / domain)

**Status:** captured, blocked on upstream · **Origin:** ui-meta-director note (DIRECTOR-PARKS-CHANNEL 2026-07-02, 12:27 PT) + Clark 2026-07-02 · **Upstream:** `zerobias-com/tag` PR #8 (fork→main; Nic reconciles `project-type` UUIDs to live SQL in review)

## The change

ZB resolved "is Framework/Requirement/Program its own primitive" into an **orthogonal axis model** for Projects — a node is described by independent axes, not one fused type:

1. **`project-type`** (tagType) — single-valued, positional; governs nesting via the project-type tree. Tags: `program` / `project` / `workspace` / `aperture` / `thread`.
2. **`project-role`** (tagType) — multi-valued, orthogonal, any-tier; the job a node plays. Tags: **`engagement`** / `transparency-entangled` / `template`.
3. **`project-archetype`** (tagType) — shape of a program's work. Tags: `readiness` (GRC) / `delivery` / `portfolio`.
4. **`project-domain`** (tagType) — subject area: compliance / legal / financial / clinical. **Being minted NOW (Clark 2026-07-02) — NOT deferred** (the umd note called it deferred; that's overtaken).
- **`project-tier` is being RETIRED** (Chris owns the deprecation; no clean path yet — the new axes are minted "as if" tier is already gone).
- **Relationships stay separate:** `governs` / `engages` ResourceLinks (live on CI). "tag = what a node IS; link = how nodes RELATE."
- **`program` and `engagement` are ROLES, not tiers/types.** `engagement` governs a delivery tree via `governs` rather than containing it. (`program` is in `project-type` in PR #8 only to mirror Nic's SQL — flagged to move to `project-role`.)

## Why it's load-bearing for SME Mart (the SDK 2.x migration sits on it)

The 2026-07-02 SDK 1.x→2.x migration (green, uncommitted at capture time) mapped SME Mart's tier ladder onto **`project-type`** — including the engagement node as `projectTypeId == engagement`. Per the new model that's a **project-ROLE**, so when #8 lands two things break:

1. **Engagement identity moves `projectTypeId==engagement` → `project-role==engagement`** (positional `projectType` becomes `program`/`project`). Touchpoints: `platform-engagement-provisioner.service.ts` (detect + create), `engagements.service.ts` (tier filter + `getProjectTierProject`).
2. **The hardcoded `project-type` UUIDs may change** on #8 merge (Nic reconciles to SQL). Touchpoint: `src/app/core/constants/project-types.ts`.

Grep **`RECONCILE-TAG-AXES`** (currently in `project-types.ts`) for the reconcile sites. Also revisit any `project-tier` references (fixtures, seeders, RDF-COMPASS tier language) once Chris's deprecation lands.

## When / prep

Nothing to change the day of capture — tier still exists until Chris's deprecation; #8 not merged. When #8 merges + Nic reconciles UUIDs: (a) re-verify the `project-type` UUIDs against Nic's SQL, (b) re-home engagement identity onto `project-role`, (c) decide positional `projectType` for the engagement + project-tier nodes (`program` vs `project`), (d) plan `project-domain`/`project-archetype` usage for SME Mart's requirement-products.

## Cross-refs

- umd note — `DIRECTOR-PARKS-CHANNEL.md` (2026-07-02)
- Code marker `RECONCILE-TAG-AXES` — `src/app/core/constants/project-types.ts`
- Sibling debt `RECONCILE-FR-014` (task-71, backlog 041) — the inline-tags FR + demo-visibility interim
- Relationships live on CI: RL-001 `governs`/`engages` (BACKEND_FEATURE_REQUESTS.md)
