# SME Mart ↔ Catalin Alignment Handoff

**Audience:** Catalin Tamas (and his LLM)
**Author:** Clark Stacer (W3Geekery, SME Mart frontend) + Director Parks (architect/QA role on the SME Mart side)
**Date:** 2026-05-12
**Trigger:** Brian Hierholzer's 1:1 with Catalin earlier today (`May 12, 2026, 12:13PM` Teams transcript). Brian asked Catalin to share his understanding of the multi-org / dual-engagement / catalog-publish model with Clark, Nick, Kevin, Chris, Joe, Dan and converge as a team within ~30 days.

This document gives you (and your LLM) everything you need to ground your diagram in what SME Mart has already built and locked. It is self-contained — you do NOT need to read SME Mart's internal planning artifacts to use it.

---

## 0. Quick context — what SME Mart is

SME Mart is a **marketplace platform for Subject Matter Experts (SMEs)** in compliance / cybersecurity, built on the ZeroBias platform as a 3rd-party customer app. Think "Upwork meets Whop" but for ZB platform users. Built with Angular 21; deploys to `app.zerobias.com/sme-mart`. W3Geekery (Clark) is the contractor building it.

**SME Mart and Catalin's content/connector pipeline are different surfaces of the same platform:**
- **SME Mart** = marketplace for SERVICES (providers offer SME work; buyers contract for compliance / audit / cybersecurity expertise).
- **Catalin's pipeline** = the content publishing flow for CONNECTORS / SCHEMAS / LOGIC (developers publish reusable platform content through Guild consensus to Org/Global catalogs).

Both share the same ZB platform primitives (`platform.Project`, `platform.Board`, `platform.Task`, `hydra.Tag`, `hydra.Resource`, etc.). Both consume the same default Engagement A (Customer ↔ Platform). The Guild model Brian gave you is shared infrastructure that both surfaces depend on.

**One operational note:** the engagement identity tags use a `MARKETPLACE_OPERATOR_ORG_ID` as their `ownerId`. Currently this is W3Geekery's org (because SME Mart is being built by a 3rd party); eventually it becomes ZeroBias itself once SME Mart is upstreamed. The pattern is: tags carrying engagement identity are operator-side bookkeeping, not customer-side metadata, so operator admins can see all engagements across customers when doing cross-org probes.

---

## 1. Shared model (what we already agree on)

From Brian's 5/12 conversation with you, AND from his 5/5 conversation with Clark, the architectural baseline is:

**Three orgs:**
- **Customer / dev org** (Geekery, SDI, Undefined, Work Worlds, etc.) — owned by the user's company.
- **ZeroBias Platform org** — the platform provider org (commercial entity).
- **ZeroBias Guild org** — the community / standards-body org. *Brian also calls this "ZeroBias.Org" (his 5/5 vocabulary) and "Zero Bias Community Guild" (his 5/12 vocabulary). Same entity, two names. See open question 1 below.*

**Two default engagements per qualifying user, both auto-provisioned on first login:**

| Engagement | Direction | What it represents |
|---|---|---|
| **A — Platform engagement** | Customer ↔ ZeroBias Platform | Customer is a paying user of the platform; this is where tasks/needs/work-streams between customer and platform live. |
| **B — Guild engagement** | Customer (as member) ↔ ZeroBias Guild | Customer's user(s) opted into Guild membership; this is the entry point into Guild collaboration. |

**Engagement A is already implemented + deployed on UAT in SME Mart** as of 2026-05-08 (admin-driven provisioning UI; lazy-on-load guard for orgs that haven't been provisioned yet). Engagement B (Guild) is NOT yet implemented anywhere in SME Mart code.

**Beyond the two defaults, Guild members can opt into N additional projects** within the Guild org (e.g., a "connectors project" where they collaborate with Dan / Joe / Ragu on schema or connector development).

---

## 1.5 Background concepts you'll see referenced (inline for context)

Two SME Mart-side concepts come up below. Brief inline explanations so you don't need access to internal docs:

### Hierarchy Editor (Brian's 2026-04-30 directive)

Brian's directive: every engagement has a **customizable tier hierarchy** that BOTH sides of the engagement see and edit together. Fixed top tiers (Engagement, Project) and fixed bottom tiers (Task, Sub-Task) are non-renameable. The 1-3 middle tiers in between are **user-renameable per engagement**. Default template names: `Workspace → Aperture → Thread`. Customer B might keep only `Workspace → Thread`. Customer C might rename to `Crew → Focus → Conversation`. The schema is identical across engagements; only the display names differ. The "editor" UX lets both parties in an engagement pick a template, add/delete/rename middle tiers.

**Why it matters:** the tier-identity-via-tag decision (§2.1) exists so this customization can happen WITHOUT churning Project storage. Rename = change the tag's display label; structural depth and `parentId` chain untouched.

### Entangled Tasks (SME Mart's Transparency Center pattern)

A pattern SME Mart uses to model **multi-party state mirroring**: a Task on Side A is *entangled* with its twin Task on Side B, such that state changes (status, assignee, approvers, attachments) propagate bidirectionally. Both parties see the same canonical truth but each from their own UI; access boundaries are respected (e.g., one side may not see all comments).

**Implementation sketch** (currently 2-party Buyer ↔ Provider):
- Two real `platform.Task` rows, one per side's boundary scope
- Linked via a `twin_of` ResourceLink (link type lives in hydra)
- A background reconciliation pattern (could be platform-side, could be app-side) keeps mirrored fields in sync
- Some fields are explicitly NOT mirrored (e.g., side-private notes)

**Why it matters for your catalog promotion design:** the consensus + promotion flow (local → Guild project → Org catalog → Global catalog) needs to surface the same artifact and its progression to multiple parties (developer; Guild peers; Org gatekeepers; Global reviewers). Entangled tasks generalize from 2-party to N-party. Extending the pattern is a natural starting point rather than designing a fresh mirroring primitive.

---

## 2. Storage model (locked on the SME Mart side; pre-aligned with Nic + Kevin)

### 2.1 Nested platform.Project for STRUCTURE; tags for tier NAMING

Backend team direction (relayed 2026-05-12): "use nesting, but for hierarchy NAMING use tags." Two orthogonal mechanisms:

| Concern | Mechanism |
|---|---|
| Structural containment (boundary cascade, Project Lead inheritance, task scope) | `parentId` chain between `platform.Project` rows |
| Tier identity / display name (`this Project is a Workspace / Aperture / Thread / customer-renamed tier`) | Tag on the Project (`tier.*` namespace — exact schema is an open question) |

**Do NOT model tier identity via parentId-depth.** Depth is structural; tier-name comes from a tag. A customer who renames "Aperture" → "Crew" via the Hierarchy Editor changes the tier-tag's display label, not the depth in the chain.

**Do NOT propose a `Project.flavor` / `Project.type` discriminator field.** That hypothesis was floated by Kevin 2026-04-22 and explicitly rejected by the backend team 2026-05-12 — the answer is "use a tag."

### 2.2 Auto-behaviors on `platform.Project.create` (verified empirically on CI 2026-05-11)

Every successful `platform.Project.create` produces:
1. **One default kanban Board**, auto-created. `isDefault: true`, `boardType: kanban`, name = `"{projectName} Board"`. Renameable via `platform.Board.update`.
2. **Creator auto-added as project member** with the **Project Lead** role (catalog role UUID `7dc84215-45e9-4976-9486-4cba7edc5284`, `ownerId=00000000-...`, package `zerobias.zerobias.platform.rbac`).
3. **`ownerId` is derived from the active session's org context.** NOT a body parameter. Pass it in the body and it is silently ignored. To provision a Project owned by Org X, you must be acting in Org X's context.

### 2.3 Boundary inheritance (platform-enforced; bug fix incoming)

Backend team confirmed 2026-05-12: child Projects MUST inherit the parent Project's `boundaryId`. The platform should reject attempts to create a child Project with a `boundaryId` outside the parent's set. (There is currently a bug where this is NOT enforced — we found it empirically 2026-05-11 by linking a child Workspace Project to a boundary outside its parent Engagement's set, and the platform accepted it. Nic will ship the fix; SME Mart drops the app-level validator concern.)

**Multi-boundary on a single Project IS supported** via the `resourceLink` mechanism (`projectmemberofboundary` link type). That is the right path for adding additional boundaries to a Project — *within the parent's set* once enforcement lands.

### 2.4 Project Lead inheritance (parent-to-child)

Backend team confirmed 2026-05-12: in nested Project structures, the parent Project's "Project Lead" automatically grants Lead permissions on ALL descendant Projects, in addition to each child's own explicitly-assigned Project Leads. Example:

```
Project A — Project Lead: Sam (explicit)
  └── child Project B — Project Lead: Mary (explicit) + Sam (inherited from A)
```

Sam has Lead on both A and B. Mary has Lead on B only. Inheritance is one-way (parent → child).

**Implication for UX:** any member-management UI must distinguish *inherited* vs. *explicit* role grants. Otherwise users will be confused why "Sam is also Lead on this Workspace I just created."

---

## 3. Naming + tag conventions (locked on the SME Mart side)

### 3.1 Engagement identity tag — `sme-mart.eng.{supply-org-slug}-to-{demand-org-slug}`

The identity tag for an engagement is a kebab-only nmtoken (no whitespace, no shell-special chars, no Unicode arrows). Direction is `{supply}-to-{demand}` (supply flows toward demand / buyer / customer).

**Examples:**
- `sme-mart.eng.zerobias-to-geekery` — ZB Platform engagement where Geekery is the buyer/demand
- `sme-mart.eng.zerobiasguild-to-geekery` — ZB Guild engagement where Geekery is the demand (Guild provides community to its members)
- `sme-mart.eng.zerobias-to-brianhierholzer` — Brian's Inc. ZB Platform engagement
- `sme-mart.eng.w3geekery-to-pinnaclecorp` — Marketplace engagement where W3Geekery audits Pinnacle

Tag scope: pass `ownerId = MARKETPLACE_OPERATOR_ORG_ID` on tag creation (currently W3Geekery; eventually ZeroBias itself once SME Mart is upstreamed). This makes the tag visible to operator admins doing cross-customer probes. Don't scope it to the customer org — that makes operator-side admin queries blind to the customer's tags.

**Why kebab-only nmtoken:** the arrow direction reads left-to-right matching the directional intent without needing a `→` / `⇒` / `➡️` glyph in the machine identifier. Unicode arrows in identifiers cause silent equality bugs (variation-selector mismatch on emoji arrows; `>` is shell-redirect-special and creates files when pasted unquoted). Human-readable arrows live in the tag's `description` field (free-form UTF-8), never in the tag NAME.

### 3.2 Classifier tags — additive, multi-per-engagement

| Pattern | Purpose | Examples |
|---|---|---|
| `sme-mart.eng.type.{label}` | What KIND of engagement is this? | `sme-mart.eng.type.platform`, `sme-mart.eng.type.guild`, `sme-mart.eng.type.marketplace` |
| `sme-mart.eng.scope.{label}` | What SCOPE / WHEN does it cover? | `sme-mart.eng.scope.q4-2026`, `sme-mart.eng.scope.audit`, `sme-mart.eng.scope.platform-services` |

An engagement carries ONE identity tag (3.1) plus N classifier tags (3.2). Searches compose: identity tag alone finds all engagements between two parties; classifier filters narrow within that set.

### 3.3 Cardinality semantics

| Engagement type | Cardinality per direction-pair | How to probe |
|---|---|---|
| Platform engagement (ZB → customer) | **Singleton.** Every ZB customer has exactly one. | `searchTags(name="sme-mart.eng.zerobias-to-{slug}")` → 0 = not provisioned, 1 = provisioned |
| Guild engagement (Guild → member) | **Singleton.** Every Guild member has exactly one. | `searchTags(name="sme-mart.eng.zerobiasguild-to-{slug}")` → same shape |
| Marketplace engagement (vendor → buyer) | **Multi-instance.** Same pair may transact many times. | Identity tag may link to multiple Engagement Objects; classifier tags (e.g., `scope.q4-2026`) disambiguate |

### 3.4 Locked verbiage for the Platform engagement (already in production)

These strings are extracted as top-of-file constants in `provisioner.service.ts`:

| Field | Template |
|---|---|
| Engagement Project name | `${orgName} <- ZeroBias` |
| Engagement Project description (depth 1) | `Platform Services Engagement: ZeroBias ➡️ ${orgName}` (no trailing period) |
| Project tier Project name (depth 2, child of Engagement) | `ZeroBias Platform` |
| Project tier Project description (depth 2) | `${orgName}'s gateway into ZeroBias — tasks, notes, and communication tied to the ZeroBias ➡️ ${orgName} platform engagement live here.` |
| Identity tag name | `sme-mart.eng.zerobias-to-${slug}` |
| Identity tag description | `Marketplace tag for the platform-services engagement: ZeroBias ➡️ ${orgName}.` |

Direction motif (`ZeroBias ➡️ {orgName}`) is consistent across name + description on both Project and Tag. Note the name field uses the reverse-arrow ASCII convention (`<-`) — buyer/demand left, supplier/provider right — while the description uses the supply→demand arrow.

**Guild engagement verbiage is not yet locked.** Symmetric template would be:

| Field | Proposed template (NOT locked) |
|---|---|
| Engagement Project name | `${orgName} <- ZeroBias Guild` |
| Engagement Project description | `Guild Membership Engagement: ZeroBias Guild ➡️ ${orgName}` |
| Workspace Project name | (open — e.g., `Guild Workspace` or `Guild Membership`) |
| Identity tag name | `sme-mart.eng.zerobiasguild-to-${slug}` |
| Classifier tag | `sme-mart.eng.type.guild` |

---

## 4. The 5-call provisioning recipe (for the Platform engagement)

This is what SME Mart's `PlatformEngagementProvisioner` does today for the default Customer ↔ Platform engagement. Same recipe shape generalizes to the Guild engagement — just change the verbiage + identity tag + add a tier-tag step.

```
Step A: hydra.Tag.create
  - name: sme-mart.eng.zerobias-to-${slug}
  - description: locked verbiage (§3.4)
  - ownerId: MARKETPLACE_OPERATOR_ORG_ID (NOT customer org)
  → returns tagId

Step C: platform.Project.create  (the Engagement Project)
  - parentId: null  (top tier)
  - name: ${orgName} <- ZeroBias
  - description: locked verbiage (§3.4)
  - tagId: tagId from Step A  (built-in tag field on Project.create)
  - status: 'active'
  - visibility: 'internal'
  - membershipPolicy: 'private'
  → returns engagementProject.id; AUTO-CREATES default Board + auto-adds creator as Project Lead

Step D: platform.Project.create  (the Project-tier Project — depth 2, FIXED label "Project")
  - parentId: engagementProject.id
  - name: ZeroBias Platform                         (D-34 locked, applies to Project tier)
  - description: locked verbiage (§3.4)
  - tagId: sme-mart.tier.project                    (tier identity tag — operator-owned, marketplace-singleton)
  - status, visibility, membershipPolicy: same as Engagement
  → returns projectTierProject.id; AUTO-CREATES default Board + auto-adds creator as Project Lead

Step F: platform.Board.update  (rename auto-board on the Project tier)
  - rename from "ZeroBias Platform Board" to a locked board name (if applicable)

Step ~G~: DROPPED
  - addMember(adminUser, role='admin') was redundant — auto-add covers creator,
    and Project Lead inheritance (§2.4) covers parent-Lead on children.
```

Steps B and E from earlier drafts were dropped during design — see open questions if curious.

---

## 5. Catalog promotion pipeline (Catalin's branches-per-stage proposal)

Your proposal in the 5/12 meeting — "branches per stage" for content lifecycle in `zerobias-org` — aligns with the existing pattern used by `zerobias-org/schema`. That repo already uses:

- `main` — base branch, accepts PRs
- `dev` / `qa` / `uat` / `prod` — env branches; merging into one triggers publish to that env

SME Mart is currently shipping a schema-deprecation PR through this exact pipeline (deprecating 3 GQL classes via cross-fork PR from `w3geekery/schema` → `zerobias-org/schema`). The promotion mechanism is **gradle-based gate validation + dataloader Neon integration**:

- Branch-level `:gate` task runs `testIntegrationDataloader` against an ephemeral Neon branch
- Schema loadability + YAML validation happen in the gate
- Publish workflow runs on push to env branches (NOT on PR open) — this means PR-time CI is minimal; real validation is post-merge

**This is already wired for connectors and schemas.** If catalog promotion (local → Guild project → Org catalog → Global catalog) maps onto the same branch model, you can re-use the gradle plugin + dataloader machinery wholesale. Caveat: vault auth (`vault login -method=oidc` against `https://vault.auditmation.io:8200`) is required for Neon credentials at gate time.

**For the consensus mechanism at each stage**, `platform.Task.approvers` (the "C" in RACI on tasks) is the natural primitive. Each promotion creates a Task with the approver set populated to the relevant reviewers (Guild peers; then Org gatekeepers; then Platform gatekeepers; then global reviewers). A promotion advances when its approval task closes.

**For multi-party state mirroring across promotion stages**, see the entangled-task pattern explained in §1.5. The pattern is currently scoped 2-party (Buyer ↔ Provider); your catalog promotion flow is a natural N-party extension (Developer ↔ Guild peers ↔ Org gatekeepers ↔ Global reviewers). Generalizing the existing pattern is a stronger starting point than designing a fresh mirroring primitive.

---

## 6. Things to AVOID in the diagram / design

Surface these in your work so we don't relitigate already-rejected paths:

| Anti-pattern | Why |
|---|---|
| Modeling Workspace / Aperture / Thread as separate ResourceTypes or `Project.flavor` enum values | Rejected by backend team 2026-05-12 — use tags |
| Modeling tier identity via parentId-depth (e.g., "anything at depth 2 IS-A Workspace") | Wrong: depth is structural; tier-name is a tag |
| Collapsing the Hierarchy Editor's middle tiers to Task-tag grouping on a single Workspace Board | Rejected by Clark 2026-05-12 — middle tiers remain real nested Projects with their own Boards |
| App-level boundary-subset-chain validators | Nic owns the platform-side fix; do not pre-empt |
| Verification gates that require opening ZB internal UI (Governance, Task UI, Platform admin console) | SME Mart can't gate on ZB UI delivery timelines; verification via SDK + the 3P consumer's own surfaces only |
| Stuffing scope/year/type into the identity tag name | Use additive classifier tags (`sme-mart.eng.scope.q4-2026` etc.) |
| Unicode arrows / emojis in machine-identifier fields (names, slugs) | Variation-selector mismatch + shell footguns; arrows go in description only |

---

## 7. Open questions we'd like your design to address (or flag)

These are open on the SME Mart side. Your diagram and your alignment conversations with Kevin / Nick / Chris / Dan / Joe / Clark would help if they land on answers — or surface them explicitly as unresolved so we can converge.

1. **Terminology lock.** Brian uses "ZeroBias.Org" (5/5 with Clark), "ZeroBias Community Guild" (5/12 with you), and "Zero Bias Org" (5/12 in the same conversation) interchangeably. The team will struggle to converge with a moving noun. Director recommends locking on **"Guild"** as short noun and **"ZeroBias Guild org"** as long-form, but Brian's call.

2. **Tier-identity tag schema — LOCKED 2026-05-12.** Namespace: `sme-mart.tier.{label}` (matches the existing `sme-mart.engagement.*` namespace convention; see updated D-49 below). Tags are operator-owned (ownerId = MARKETPLACE_OPERATOR_ORG_ID), `type: "marketplace"`, scope `"org"` (auto-derived). Created once per environment as marketplace-singletons; the SAME tagId is reused across all customers and all engagements. Engagement tier (depth 1) does NOT get a separate tier tag — the engagement IDENTITY tag (`sme-mart.engagement.{supply}-to-{demand}`) already signals tier via its namespace prefix.

3. **Guild org provisioning status across environments.** Brian's model assumes the Guild org exists as a real ZB org on CI / UAT / QA / Prod (with its own Boundaries, etc.). 5/5 meeting Action #7 (Clark → Kevin) asked for that confirmation — still open. Code that provisions a Guild engagement can't run if the Guild org isn't real on the target env.

4. **Guild eligibility classification.** Brian: "small companies, nonprofits, government, hospital institutions yes; public / PE / large-private no." We have no classification field on org records today. Options:
   - Tag-based (`org.classification.small-business`, `org.classification.nonprofit`, etc.)
   - Property on the org record
   - External catalog lookup
   How does the platform's RBAC / Group system already model this, if at all?

5. **Per-engagement Hierarchy Editor template persistence.** Per the Hierarchy Editor concept (§1.5), customers customize middle tier names per engagement — Customer B keeps default `Workspace → Aperture → Thread`; Customer C renames to `Crew → Focus → Conversation`. Where does the per-engagement template live? Candidates:
   - Hydra tag on the Engagement (`sme-mart.hier-template.{engagementId}` with serialized JSON payload)
   - A new platform.HierarchyTemplate primitive
   - Embedded in the Engagement Project's description / metadata
   No decision; not v1.4 scope on SME Mart side; on the design track for later.

6. **Multi-stage publish workflow primitives.** Brian sketched local → Guild project → Org catalog → Global catalog. Open:
   - Do all four stages map to git branches in `zerobias-org` repos (your proposal)?
   - Does each promotion create a `platform.Task` with approvers? Or use a different mechanism?
   - How does state propagate back to the developer's home org's view? (Entangled-task pattern is candidate.)
   - What happens to the artifact at each stage — is it a separate `platform.Project`, a tag, or just a branch ref?

7. **Charge model for private (non-Guild) content publishing.** Brian flagged "they will pay for it" for enterprise / PE / public companies publishing content. Out of scope for v1.4; tracking question only.

---

## 8. Suggested shape for your diagram (advisory)

Brian asked you for a diagram to share with the team. To maximize team convergence, suggest covering:

1. **Org topology** — the 3 orgs (Customer, Platform, Guild), what relationships exist, what a user "is" in each.
2. **Two default engagements per user** — Engagement A (Platform) + Engagement B (Guild). Note Engagement A's status (implemented in v1.4) vs Engagement B (not yet).
3. **Storage primitives** — nested platform.Project rows with tier-identity tags, single Board per Project, Task on a Board. Reference the auto-behaviors from §2.2.
4. **Guild project browse model** — beyond the default Engagement B, members opt into additional Guild projects (call out: this is N-instance, not singleton).
5. **Catalog promotion pipeline** — 4 stages with consensus gating, mapping to your branches-per-stage proposal in `zerobias-org` repos.
6. **Eligibility gate** — small/nonprofit/gov classification check before Guild engagement gets provisioned.

Avoid drawing tier identity as a property of parentId-depth. Draw tier identity as a tag on each Project node.

---

## 9. Pointers (public + reachable)

- **`zerobias-org/schema` repo** — existing branches-per-stage pattern + gradle gate + dataloader Neon integration. The pattern your branches-per-stage proposal already follows.
- **ZB SDK** (`@zerobias-com/platform-sdk` ^1.1.16, `@zerobias-com/hydra-sdk` ^1.0.7, `@zerobias-com/zerobias-angular-client` ^1.1.39) — `platform.Project.*`, `platform.Board.*`, `platform.Task.*`, `hydra.Tag.*`, `hydra.Resource.linkResources` (for boundary memberships), `hydra.Role.*` (for scoped role grants).
- **ZB MCP server** (`zerobias_describe` / `zerobias_search` / `zerobias_execute`) — authoritative source for SDK shapes; use `zerobias_describe('platform.Project.create')` etc. before designing against any endpoint. Run via `zerobias_describe(path)` for unfamiliar operations to see exact param structure (path/query params at top level; body params nested under the body param name).
- **Hierarchy Editor concept** — Brian's 2026-04-30 directive. Summarized inline in §1.5; if you want the canonical source, ask Clark and he can share the original HTML sketch.
- **Entangled task pattern** — SME Mart's Transparency Center primitive for 2-party state mirroring. Summarized inline in §1.5; ditto above for the canonical source.

---

## 10. What we'd find most useful back from you

When your diagram is ready and you've talked to the team:

- A version of §1's "3 orgs + 2 default engagements" with any nomenclature locks the team agrees on.
- Position on Open Questions 1-6 (§7) — where the team converges, where it stays open.
- Whether your branches-per-stage proposal extends the existing `zerobias-org/schema` gradle pattern or proposes new mechanism.
- Whether you'd like Engagement B (Guild) provisioning to be part of SME Mart's responsibility or live elsewhere (separate provisioning service / part of Catalin's content pipeline / a new ZB platform primitive).

If your LLM produces design proposals, the conventions in §2-§4 of this doc and the anti-patterns in §6 are the strongest constraints. Anything else is open for the team to converge on.

---

*Clark + Director Parks are happy to walk through any section in person or in chat. The fastest convergence path is probably: you produce v1 of the diagram with this doc as input → team review → lock the open questions → second pass.*
