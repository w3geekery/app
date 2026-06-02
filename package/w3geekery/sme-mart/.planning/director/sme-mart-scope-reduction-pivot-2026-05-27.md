# SME Mart Scope Reduction Pivot — Seed for Plans Refactor

**Date:** 2026-05-27
**Director:** Parks
**Status:** SEED brief — not yet milestone-shaped. Captures the architectural pivot from today's Brian Slack thread + this morning's Brian huddle. Plans refactor consumes this; do NOT skip the open questions before re-scoping.
**Sources:**
- Today's Slack thread Clark↔Brian (12:00-12:12 PT) — Engagement ownership decision + two-tier commercial model refinement
- This morning's huddle (10:09-10:56 PT) — Requirements/Readiness reframe + Boundary-is-security-only, captured in [`../notes/meetings/2026-05-27-slack-huddle-requirements-readiness-reframe.md`](../notes/meetings/2026-05-27-slack-huddle-requirements-readiness-reframe.md)
- zb/ui Projects-app INTENT.md (read 2026-05-27) at `~/Projects/zb/ui/.claude/plans/public/projects-app-mocks/INTENT.md`

---

## TL;DR — The Pivot

**SME Mart narrows to matchmaking-only.** Engagement detail/governance/Boards/Tasks/Members/Vetting move OUT of SME Mart and INTO Platform Projects App (`zb/ui` Projects-app). SME Mart owns the pre-engagement workflow (RFP/Bid, vendor catalog, OrgProfile authoring, matchmaking search, party-agreement handoff). Platform Projects App owns everything post-handoff (MSA + project setup + work execution + per-project legal/$).

**Brian endorsed via Slack thumbs-up 2026-05-27 12:07 PT.** Quote (Brian 12:04): *"One is matchmaking high level / And then into legal, $, and Detail."* Refinement (Brian 12:12): commercial structure is two-tier — MSA at Engagement, SOW/license/usage-model per Project, where projects are bound by engagement-level MSA constraints.

**Why this is right:**
- Entity ownership becomes clean — one canonical Engagement UI (Platform), not two.
- Aligns with Brian's eventual vision: "marketplace will be a platform app too." Shrinking now reduces migration debt later.
- Resolves the lens-divergence problem at depth-0 (only one app renders Engagement detail).
- SME Mart's job becomes legible — matchmaking is a one-sentence pitch.

**What it costs:** Some recent SME Mart investment (Phase 32 Boards Foundation, the planned Phase 33, the BACKLOG-117..121 tab work) becomes legacy or migrates to Platform. Net positive.

---

## Architectural Decision Summary

### 1. Entity ownership split

| Concern | Owner | Notes |
|---|---|---|
| Engagement (depth-0 `platform.Project`) detail, chrome, routes | **Platform Projects App** | Same `platform.Project` row — only UI ownership moves. Data stays in AuditgraphDB. |
| MSA / engagement-level legal / banking / party list / vetting | **Platform Projects App** | Per Brian 12:04 + 12:12. |
| Project (depth-1+) detail, chrome, routes | **Platform Projects App** | Confirmed via zb/ui INTENT §2.3 — canonical Projects UI. |
| Per-project SOW / license / usage model / project-specific legal | **Platform Projects App** | Per Brian 12:12 two-tier refinement. |
| Boards / Tasks at any scope | **Platform Projects App** | Engagement-scope and Project-scope. |
| Members / Roles at any scope (NICE NIST binding) | **Platform Projects App** | From huddle §2.8. |
| Readiness / Requirements at any scope | **Platform Projects App** | From huddle §2.8. |
| Boundaries (security-only) | **Platform Projects App** | From huddle §2.9. |
| RFP / Bid workflow | **SME Mart** | Pre-engagement only. |
| Vendor catalog / vendor profile authoring (`MarketplaceProfileItem`) | **SME Mart** | Pre-engagement marketplace surface. |
| OrgProfile authoring (`OrgProfileItem`) | **SME Mart** | Authoring here; consumption from Platform Projects App via GQL. |
| Matchmaking search + filters | **SME Mart** | Core marketplace UX. |
| Pre-engagement scope negotiation (informal, pre-MSA) | **SME Mart** | Up to "parties agreed to engage." |
| "Engage with this party" handoff trigger | **SME Mart** | Transitions to Platform Projects App for MSA + project setup. |

### 2. The matchmaking/governance boundary

**The seam is "parties agreed to engage," NOT "MSA signed."**

- Pre-agreement (in SME Mart): vendor browsing, RFP, Bid, informal scope discussion.
- Agreement moment: a button or flow that transitions the matched pair into an active Engagement.
- Post-agreement (in Platform Projects App): MSA authoring + signing, project creation, per-project legal/$, work execution.

This means SME Mart does NOT author MSAs. SME Mart sets up the *conditions* for an engagement to begin; Platform owns the engagement itself.

### 3. Two-tier commercial model (Brian 2026-05-27 12:12)

| Scope | Legal | Financial | Catalog source |
|---|---|---|---|
| Engagement | MSA (Master Services Agreement) | Master commercial terms (volume tier, billing cycle, payment net-days) | `OrgProfileItem` private catalog + global catalog (Daniel's area) |
| Project | SOW / Order Form / License Agreement | Per-deliverable pricing, usage model, metering | Same catalog sources — picked per-project |

**Constraint:** Project-level terms are *bound by* engagement-level MSA. Likely additive-only (project adds project-specific terms; cannot override MSA), pending Brian confirmation. Re-ratification semantics when MSA changes — also pending Brian.

This two-tier structure maps cleanly onto Brian's earlier (huddle) "Readiness is layered" framing: engagement-readiness includes MSA satisfaction; project-readiness includes MSA satisfaction AND project-specific term satisfaction. Same construct, scope-layered.

### 4. GQL schema continuity

**SME Mart's custom GQL schema remains readable from Platform Projects App.** Verified architecturally:
- Schema-extension classes (`MarketplaceProfileItem`, `OrgProfileItem`, `EngagementVettingItem` legacy, NoteHierarchy entities) are registered platform-wide once loaded via dataloader.
- Class IDs are deterministic across environments (memex `GQL class IDs are deterministic across environments`).
- Any client with proper org-scope + hydra-tag read access can query via standard `platform.Project.search` / `platform.Object.list` ops.
- No special arrangement needed. Author/consumer split is clean: SME Mart authors via `Pipeline.receive`; Platform Projects App reads via GQL.

**Coupling implication:** Platform Projects App becomes aware of relevant SME Mart entities (`OrgProfileItem` for private catalog, possibly `EngagementVettingItem` for vetting state). This is OK per Brian's "Projects App becomes Engagement cross-org aware" framing. Platform should NOT need to know about RFP/Bid (those are pre-engagement, SME Mart-internal).

---

## Teardown Matrix — In-Flight SME Mart Work Disposition

### Phase status

| Phase | Status | Disposition |
|---|---|---|
| Phase 32 Boards Foundation | SHIPPED + CLOSED 2026-05-22 | **Maintenance mode** — keep working until Platform Projects App ships its Engagement-detail equivalent. Bug fixes only; NO new feature work. |
| Phase 33 Boards Polish | PLANNED (not started) | **CANCEL** — scope migrates to Platform Projects App. Do not plan/execute in SME Mart. Document the cancellation in ROADMAP. |
| v1.4 milestone | Idle (Phase 19 closed 2026-04-21) | Defer remaining v1.4 work pending pivot re-scope. Possibly close v1.4 cleanly and define v1.5 around matchmaking-narrowing. |

### BACKLOG re-targeting

Filed 2026-05-22 from zb/ui mock review:

| Item | Pre-pivot target | Post-pivot target |
|---|---|---|
| **117** Members tab | SME Mart engagement + project detail | **Platform Projects App** |
| **118** Hierarchy tab (Tree/Graph + lateral panel) | SME Mart + Platform | **Platform Projects App only** |
| **119** Tier chip primitive | Both apps | **Platform Projects App only** (SME Mart doesn't need it for matchmaking) |
| **120** Overview enrichment | SME Mart | **Platform Projects App** |
| **121** Portfolio multi-lens (Wheel/List/Tree/Timeline) | Both apps | **Platform Projects App only** |

Proposed additions from huddle (NOT YET FILED — file at Tuesday pass with new target):

| Item | Post-pivot target |
|---|---|
| **Requirements tab** | Platform Projects App |
| **Readiness tab** | Platform Projects App |
| **Boundaries tab** (security-only) | Platform Projects App |
| **OrgProfileItem private catalog extension** | **SME Mart** (authoring); Platform consumes |
| **Members → NICE NIST role binding** | Platform Projects App |
| **Engagements Portfolio nav root** | Platform Projects App |
| **Boundary surfaces audit — strip compliance content** | Cross-cutting (Tom's zb-ui-lib audit + SME Mart cleanup) |
| **122** **Evaluate FileService as Notes carrier** (FILED below) | **SME Mart spike**, decision affects both apps |

### Code surfaces that become legacy in SME Mart

These should NOT be deleted yet (Platform Projects App needs to ship its equivalents first), but they're targeted for deprecation:

- `/engagements/:id/*` route family — engagement-detail, Overview tab, Boards tab, Hierarchy tab, Members tab, etc.
- `engagement-detail.component.*` and all its tab children
- `boards-grid` / `board-card` / `pinned-preview` / `board-detail` / `board-switcher` shared components (Phase 32 outputs)
- `PkvPinStorage` / pin state plumbing
- `vetting-tab.component.*` (already deprecated when Phase 32 Boards landed, but the underlying Vetting Project design — BACKLOG-108 Option 5-prime — also migrates)
- Engagement-scope Notes routes (`/engagements/:id/notes`, `notes-tab.component.*`, all `src/app/shared/components/note*` + `notebook*` + `folder-dialog` + `markdown-editor` + `markdown-view` + `notes.service`, `note-folder.service`, `note-hierarchy.service`) — sunset alongside Engagement detail when Platform Projects App ships its Notes tab. No migration (existing SME Mart notes are test-only per Clark 2026-05-27). Canonical Notes implementation transferred to zb/ui Projects App scope same day; see BACKLOG-122 CLOSED entry.
- `platform-engagement-provisioner.service.ts` D-51 display-verbiage logic — may stay (provisioner creates the depth-0 row; verbiage is metadata), but the chrome that renders it moves.

**Code that STAYS in SME Mart (definitely):**
- Vendor profile authoring (`vendor-profile-form`, `vendor-profile-tab`)
- OrgProfile authoring surfaces
- Marketplace search / catalog browsing
- RFP / Bid workflow surfaces (when built)
- Notes authoring surfaces (pending FileService spike — see below)
- D-51 engagement display verbiage decision (still valid; just renders elsewhere)

---

## Notes — CLOSED 2026-05-27 (transferred to zb/ui Projects App scope)

The Notes carrier question was resolved same-day this brief was written, in three steps:

1. **Kevin Slack 12:44-12:50 PT** confirmed FileService is in-bounds for `.md` Notes. Quotes: *"yes, you are in bounds / that is why we use it for tasks / attachments, etc"* and *"every File and Folder is a resource / so works with tags, resource links, etc"*.
2. **ui-meta-director (zb/ui Claude) accepted Notes-feature ownership transfer** via Tell-block reply 2026-05-27 — canonical Notes implementation now lives in zb/ui Projects App scope. SME Mart did the POC.
3. **Clark confirmed existing SME Mart Notes are test-only data** — no migration script needed.

**SME Mart-side disposition:**
- Sunset `/engagements/:id/notes` routes + `notes-tab.component.*` + all `src/app/shared/components/note*` + `notebook*` + `folder-dialog` + `markdown-editor` + `markdown-view` + `notes.service`, `note-folder.service`, `note-hierarchy.service` alongside broader Engagement-detail teardown (covered by the teardown matrix above).
- Zero migration work. Zero new Notes investment in SME Mart.
- BACKLOG-122 marked CLOSED / TRANSFERRED in `.planning/BACKLOG.md`.

**Where the canonical lives now:**
- zb/ui Projects App, FileService-backed (Folders + `.md` files as hydra Resources).
- zb/ui INTENT.md updates pending on their side (Notes tab in the §2.8 strip + Requirements-must-be-DB-backed constraint also updated same-day).
- Reference doc they wrote: `~/Projects/zb/ui/.claude/plans/public/projects-app-mocks/notes-tab-sme-mart-reference.md`.
- The 5 SME Mart value-add patterns (markdown-editor task-status plugin, note→Task injection, sharing, meeting-minutes first-class, AccessLevel three-tier) were shared via Tell-block; ui-meta-director will decide which to lift into the canonical impl.

**Director Parks watch-points** (for the upcoming session pass):
- Confirm Notes lands as a tab in their INTENT.md tab strip.
- Confirm the 5 value-adds survive into their plan or are explicitly deferred.
- Pull their carrier-rule INTENT updates into our context once stable.

### The broader carrier rule that emerged (memex-worthy)

The Notes decision surfaced a generally-applicable platform rule worth crystallizing — **cardinality + query-shape decides DB vs FileService, not feature category.** Captured 2026-05-27 in memex as `memex/zerobias/platform/carrier-rule-cardinality-query-shape-not-feature-category` ([Basic Memory note](file:///Users/cstacer/basic-memory/memex/zerobias/platform/Carrier%20rule%20—%20cardinality%20+%20query-shape%2C%20not%20feature%20category.md)).

Summary: many-small-structured-records (Requirements: thousands per scope, queryable, joinable) MUST stay DB-backed; few-to-moderate freeform documents (Notes, meeting minutes, policy docs) fit FileService; hybrid via `linkResources` when content has structured AND freeform halves. Examples + anti-patterns in the memex note. Provenance: Kevin Slack 2026-05-27 + Director Parks ↔ ui-meta-director Tell-block exchange same-day.

This is the most reusable artifact from today's exchange — applies far beyond Notes (Requirements stays DB-backed per §2.8 of their INTENT, OrgProfileItem stays SME Mart authoring + DB, MSA/SOW likely hybrid, etc.).

---

## Open Questions for Brian (next Tue/Fri meeting)

1. **Override semantics in two-tier commercial model.** Can a project's terms *override* engagement-level MSA terms (with sign-off), or only *add* (additive/refinement only)? Brian said "bound by" — sounds additive-only. Need confirmation; affects negotiation UX.
2. **Ratification scope.** When MSA changes (engagement-level amendment), do child projects need re-ratification, or inherit silently?
3. **MSA authoring location.** Confirm MSA authoring happens in Platform Projects App (post-handoff), NOT as a last step of SME Mart matchmaking. (Director lean: Platform. Brian implied this 12:04 but worth pinning explicitly.)
4. **License catalog reuse.** Project-1 and Project-2 using "Standard SaaS Sub v3" — one shared catalog item instantiated twice, or two project-local copies? (Director lean: catalog-shared, instantiated-per-project. Same pattern as Requirements catalog.)
5. **Migration timing of existing UAT Engagements.** Brian's-Org and W3Geekery Engagements (per D-51) exist today in SME Mart. When Platform Projects App ships, do they auto-render there with no migration, or is there work? (Architecturally none — they're already `platform.Project` rows. UI routes just change.)
6. **Phase 32 Boards Foundation in maintenance mode for how long?** Need a target ship date for Platform Projects App's Engagement-detail capability to plan SME Mart deprecation timing.

## Open Questions for Kevin / Platform Team

7. FileService questions above (1-5 in Notes section).
8. **Cross-app deep-link URL contract** (already in zb/ui INTENT standup Q13). With pivot, this becomes one-way (SME Mart → Platform Projects App), no return click-through needed at engagement-formation handoff.
9. **OrgProfileItem private requirements catalog schema extension** (huddle action item #6).
10. **Project↔Framework link type** (huddle action item #5).
11. **Readiness measurement endpoints** (huddle gap).
12. **Tier-as-tag mechanism** (zb/ui standup Q1) — still relevant since BACKLOG-119 moves to Platform.

## Open Questions for zb/ui Claude

13. **§2.4 and §2.7 of `INTENT.md` are now stale.** The depth-1 anchor with chip-to-SME-Mart pattern was right under the previous contract; with the pivot, Platform Projects App owns depth-0 Engagement-detail directly. Their INTENT needs rework before they harden anything in those sections. **Tell-block sent 2026-05-27** — ui-meta-director has the staleness markers in place on §2.4 / §2.7 awaiting their rework.
14. **Engagements Portfolio entry point.** Where does it live in their nav? They previously had Portfolio = Programs (depth-1). Now they need Engagements Portfolio (depth-0) + Programs Portfolio (depth-1) — possibly two routes, or scoped-root with depth-0 default for compliance/partner persona.

---

## Next-Session Action Sequence

**Date-note (correction):** This brief was authored 2026-05-27 (Wednesday) — earlier prose referencing "Tuesday-AM" was inherited from parkit-16's Friday-anticipated-Tuesday-resume framing and never recalibrated. Reframed below as next-working-session items independent of weekday.

Some items below have moved (✅ done already this session) and the remaining items are queued for the next working session.

1. ✅ **Memex notes — cardinality carrier rule** written 2026-05-27 in `memex/zerobias/platform/carrier-rule-cardinality-query-shape-not-feature-category`. (Two earlier-proposed memex candidates around FileService specifics dropped — those facts moved to zb-dx scope when Notes-feature ownership transferred.)
2. ✅ **Tell-block to ui-meta-director (zb/ui Claude)** — sent 2026-05-27. Reply ratified the pivot. Notes ownership transferred to their scope same-day.
3. ✅ **BACKLOG-122 closed** — `.planning/BACKLOG.md` updated; status CLOSED / TRANSFERRED.
4. ✅ **Teardown matrix updated** — Notes row in this brief now reflects sunset-only disposition (no migration; test-data only per Clark).
5. **Pending — Memex notes for the rest of the pivot** (queue for next session, est. 10-15 min):
   - `zerobias/sme-mart/sme-mart-scope-reduction-engagement-moves-to-platform-2026-05-27` (the architectural decision; cite this brief)
   - `zerobias/platform/two-tier-commercial-model-msa-at-engagement-sow-at-project` (Brian 12:12 refinement; cite real-world MSA+SOW analog)
   - Update existing `sme-mart-will-eventually-be-absorbed-into-the-zb-platform` to reference this pivot as the first concrete narrowing step
6. **Pending — parkit-16 carryover items** (still queued from Friday):
   - Verify `.planning/docs/RDF-COMPASS.md` C-7 reference (10 min)
   - Push `b5ff75e6` if still unpushed
   - Memex perishable platform facts firmed up in parkit-16 (RoleScope=Project, lateral link vocab, 7-tier triangulation, satisfies/satisfiedBy≠lateral, OSCAL confirmed)
7. **Pending — Commit pass** on this brief + BACKLOG-122 update + memex writes. Awaiting explicit batch-commit instruction from Clark.
8. **Pending — ROADMAP update** marking Phase 33 CANCELLED with link to this brief; update v1.4 status if appropriate.
9. **Pending — Relay to zb/ui Claude** for the 6 memex notes they offered under `zerobias/ui/*` + `zerobias/platform/*` (needs Clark to action — carryover from parkit-16).
10. **Pending — Define next milestone (v1.5? v2.0?)** scoped around matchmaking-narrowing. Director-side work. Defer to dedicated session — too big for an end-of-day pass.

---

## Anti-patterns / What NOT to Do

- **Don't delete SME Mart's Engagement-detail code yet.** Platform Projects App needs to ship its equivalent first. Premature deletion creates a regression window.
- **Don't try to dual-render Engagement detail.** Maintaining parallel implementations in SME Mart + Platform Projects App is exactly what this pivot eliminates. Maintenance mode means bug-fixes-only, not feature-parallel-work.
- **Don't expand the SME Mart tab strip.** Tabs like Requirements/Readiness/Boundaries that the huddle proposed for SME Mart now belong in Platform Projects App. Don't ship them in SME Mart "for now."
- **Don't author MSAs in SME Mart.** That's Platform Projects App territory post-handoff. SME Mart's role ends at "parties agreed to engage."
- **Don't fork the tier-chip / hierarchy-tab / members-tab implementations.** They land in Platform Projects App once; SME Mart doesn't need them. Avoid duplicating effort just because some of this work was scoped for SME Mart before the pivot.
- **Don't migrate UAT data preemptively.** Existing Engagement rows are `platform.Project` already; nothing to migrate. UI routes change; data is invariant.
- **Don't promise Brian a date.** Platform Projects App is mockup-only; SME Mart's deprecation timeline depends on Platform shipping. Estimate after a Platform Projects App phase-plan exists.

---

## Cross-References

- Today's huddle summary: [`../notes/meetings/2026-05-27-slack-huddle-requirements-readiness-reframe.md`](../notes/meetings/2026-05-27-slack-huddle-requirements-readiness-reframe.md)
- zb/ui Projects-app INTENT (depth-1 anchor + chip pattern that this pivot supersedes): `~/Projects/zb/ui/.claude/plans/public/projects-app-mocks/INTENT.md` §2.4 / §2.7
- Transparency Architecture Handoff canonical (zb-dx): `~/Projects/zb/zerobias-org/zb-dx/architecture/transparency-architecture.md`
- Current Director RESUME: [`DIRECTOR-PARKS-RESUME.md`](DIRECTOR-PARKS-RESUME.md)
- Existing memex notes that this brief modifies the implications of:
  - `zerobias/sme-mart/sme-mart-will-eventually-be-absorbed-into-the-zb-platform` (this pivot is the first concrete step)
  - `zerobias/ui/projects-app-in-zb-ui-is-the-canonical-projects-ui` (reinforced)
  - `zerobias/platform/canonical-projects-vocabulary-stack-engagement-project-middle-tiers-task` (unchanged; data shape stays)
  - `zerobias/ui/engagement-chip-stapled-governance-pattern-in-projects-app` (pattern was right under prior contract; with pivot it becomes in-app breadcrumb chrome, NOT a cross-app handoff)

---

## BACKLOG-122 — Evaluate FileService as Notes Carrier (filed alongside this brief)

See `.planning/BACKLOG.md` for the stub. Summary: spike whether SME Mart's Notes/Notebooks should migrate from custom GQL entities to FileService Folders + `.md` files. Needs Kevin discussion before any plan-phase. Decision affects Platform Projects App since Notes will land there as a tab regardless of carrier.

---

## Notes — Cross-App Commitment (2026-05-27 Tell-block to ui-meta-director)

**Committed (not just inferred):** zb/ui Projects App WILL incorporate Notes as a tab on Project-detail. Director Parks sent ui-meta-director a domain-transfer Tell-block 2026-05-27 covering current SME Mart Notes implementation (entity shape, component locations, services, patterns to lift vs question, BACKLOG-122 carrier spike context). The Tell-block does not request implementation now — it pre-loads context so when ui-meta-director scopes the Notes tab in Projects App, the SME Mart prior art is already in their reference set.

**Director Parks watch-points:**
- Track ui-meta-director's INTENT.md updates for Notes-tab inclusion (currently §2.8's tab strip mentions Documents but not Notes — confirm Notes lands there or as a sibling tab).
- When ui-meta-director's Notes-tab plan emerges, verify SME Mart's patterns (folder-tree recursive component, meeting-minutes first-class flag, note→ZB Task comment injection) were considered.
- BACKLOG-122 outcome (FileService vs GQL) will inform their service-layer planning even if the tab chrome is carrier-independent. Relay the spike result when it lands.

**SME Mart Notes maintenance mode:** Keep `/engagements/:id/notes` route working until Platform Projects App ships its Notes tab. Then deprecate. SME Mart MAY keep a smaller matchmaking-scope notes surface ("notes about a vendor I'm evaluating") — that's a downstream decision, not in current scope.
