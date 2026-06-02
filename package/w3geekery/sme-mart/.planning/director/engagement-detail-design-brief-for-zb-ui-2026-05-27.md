# Engagement Detail — Design Brief for zb/ui Projects App

**Date:** 2026-05-27
**Author:** Director Parks (SME Mart side)
**Audience:** ui-meta-director (zb/ui Claude, Projects App scope)
**Purpose:** Forward-looking design intent for the Engagement-detail page that Projects App is inheriting per the 2026-05-27 scope-reduction pivot. Answers *what should this page DO* — not *what SME Mart built* (that's the [reference doc](../notes/engagement-feature-reference-for-zb-ui-2026-05-27.md)).
**Read with:**
- [Scope-reduction pivot brief](sme-mart-scope-reduction-pivot-2026-05-27.md) — the architectural context
- [Engagement feature reference](../notes/engagement-feature-reference-for-zb-ui-2026-05-27.md) — what SME Mart shipped (patterns/code/services)
- 2026-05-27 huddle notes — Requirements/Readiness reframe + Boundaries-security-only

**Mock-validated:** Two screenshots delivered 2026-05-27 5:29/5:31 PM PT (FY26 Continuous Compliance Engagement, Acme Corp ↔ ZeroBias Platform). Most of the strokes below are validated by that mock; deltas and open questions are called out inline.

---

## 1. One-sentence intent

**The Engagement-detail page is where two parties see, together, the state of the relationship they've agreed to operate under.** It is the bilateral umbrella over all Projects/Boards/Tasks executed inside the engagement. It is the rendering surface for the MSA-tier commercial agreement, the obligations both sides owe each other, and the bilateral activity trail.

If you can answer "is this engagement healthy?" in five seconds standing in front of this page, it's working. If the user has to leave the page to know, it's not.

---

## 2. Personas and jobs-to-be-done

### A. Compliance Owner (Client/3PO buyer-side)

Lands here from their portfolio when they need to know the state of one vendor relationship.

**Jobs:**
- "Are we current on what we owe this vendor?" (payments, deliverables, attestations)
- "Are they current on what they owe us?" (audit reports, insurance, SLA performance)
- "What projects are under this engagement and how are they doing?"
- "Is the MSA still good — when does it renew?"
- "What's happened recently that I should know about?"

### B. Service Provider (Vendor/supplier-side)

Lands here when they need to know the state of one client relationship.

**Jobs:**
- "What do I owe this client this period?"
- "What outstanding requests are blocking my work or payment?"
- "What projects are in flight and what's their health?"
- "Who on their side do I coordinate with?"
- "When does our agreement renew — do I need to start negotiation?"

### C. Auditor / Compliance Reviewer (third-party or internal)

Lands here when they need verifiable record of a bilateral relationship's history.

**Jobs:**
- "Was the MSA in effect when X happened?"
- "Did both parties fulfill their stated obligations during the audit period?"
- "What's the full activity trail (bilateral) for this engagement?"
- "What documents (MSA, SOWs, attestations) are pinned at engagement scope?"

### D. Engagement Lead (operational owner, either side)

The person responsible for day-to-day health of the relationship.

**Jobs:**
- "What needs my attention right now?"
- "Drill into a Project that's behind."
- "Add/remove a team member from the engagement."
- "Note something about a recent meeting for context preservation."

**Design implication:** The page should serve all four personas without forking renders. Permission-aware visibility (some activity events private to one side; some metadata client-only) but a single information architecture.

---

## 3. The Engagement vs Project framing at the UX level

This page is **structurally different** from Project-detail, not a deeper-zoom version of it.

| Dimension | Engagement (depth-0) | Project (depth-1+) |
|---|---|---|
| Ownership | **Bilateral** — two parties share the umbrella | **Unilateral** — one party (the owner) drives execution |
| Primary signal | Relationship health | Delivery health |
| Commercial gate | MSA (master) | SOW (per-deliverable, bound by MSA) |
| Readiness composition | Combined view of both parties' obligations | One party's obligations |
| Activity stream | Bilateral (both sides' events, visibility-filtered) | Mostly one side |
| Members | Cross-org (members from both client + provider orgs) | Org-scoped Project members |
| Documents | MSA + bilateral attestations + audits | Working files / deliverables |
| Tabs that don't exist on Project-detail | **Readiness (bilateral), Requirements (engagement-level)**, MSA-anchored Documents/Resource Links | — |
| Tabs that don't exist on Engagement-detail | — | Project-specific execution surfaces (sprint planning, etc.) |

**Implication for the page header:** The header must read as a *relationship between two parties*, not a *project owned by one party*. The mock's two-party identity strip (Acme Corp left, ZeroBias Platform right) is the right pattern. Don't downgrade to a single ownerOrg display.

---

## 4. Tab strip — purpose and rationale

Validated by the 2026-05-27 mock; one open question on Roles (see below).

| Tab | Purpose | Primary signal | Mock-validated? |
|---|---|---|---|
| **Overview** | Five-second relationship health check + drill-down launchpad | Bilateral readiness snapshot + Programs/Projects list + Recent Activity + Engagement identity rail | ✅ |
| **Readiness** | Detailed bilateral readiness — full obligation breakdown per side | Per-party readiness checklist; what each side owes | ✅ (shown as tab; full surface TBD) |
| **Requirements** | The engagement-level requirements catalog (MSA-derived obligations, plus engagement-scoped compliance requirements) | List of requirements + status + per-side responsibility | ✅ (tab present; per BACKLOG-123 deferred-pending-Kevin) |
| **Boards** | Engagement-scope Kanban/list boards (cross-Project view) | Card grid; pin-to-expand pattern | ✅ |
| **Tasks** | Engagement-scope task list (cross-Project rollup) | Flat list with Project provenance chip | ✅ |
| **Members** | Cross-org member list (both parties' people) with role assignments shown inline | Member table; org affiliation chip; role chip | ✅ |
| **Roles** | First-class **ProjectRoles CRUD** — define, edit, scope, and assign roles at the engagement (and applicable to descendant Projects). Roles is NOT a subview of Members; it's the role-catalog management surface. | Role list with permission grant summary; create/edit/delete role; assign-to-member affordance | ✅ (confirmed by Clark 2026-05-27 — first-class, own CRUD) |
| **Notes** | Engagement-scope freeform notes (per Clark 2026-05-27 confirmation) — meeting minutes, context preservation, side discussions | Folder tree + `.md` notes (FileService-backed per Kevin) | ✅ |
| **Boundaries** | Security-only access/data-isolation boundaries between the parties (per huddle §2.9) | What data crosses the engagement seam; what stays org-local | ✅ (tab present; semantics TBD per Q below) |
| **Documents** | Working files / deliverables not pinned as engagement-identity Resource Links | File browser | ✅ |
| **Activities** | Full bilateral activity stream (audit trail) | Time-ordered events with party-of-origin chip | ✅ |

**Roles is first-class** (confirmed by Clark 2026-05-27). The mock's `Members · Notes` strip-positions are misleading — Roles is a separate tab with its own **ProjectRoles CRUD** surface, not merged into Members. This matters because the role *catalog* (define / scope / permission-shape a role) is structurally different from role *assignment* (attach a defined role to a member). Two tabs, two jobs:

- **Members tab** — who's in the engagement (member list, with their assigned role chips for context).
- **Roles tab** — what roles exist in this engagement's scope, their permission grants, and management thereof. CRUD on the role catalog itself.

The Members table may render role chips for context, but Roles is the authoritative surface for the catalog. They cross-link (clicking a role chip on a member → opens that role definition in Roles tab; "members with this role" surface on a role detail).

### Tab strip lock recommendation

`Overview · Readiness · Requirements · Boards · Tasks · Members · Roles · Notes · Boundaries · Documents · Activities`

11 tabs. That's on the heavy end for a tab strip — but Roles being first-class means it earns its position. Consider whether Documents+Activities collapse into a "More" overflow, or stay flat. Mock shows flat; defensible because each tab has a single coherent surface.

---

## 5. Page header — information hierarchy

What must be visible without scrolling:

### Top bar (always visible)
- Breadcrumbs: `Portfolio > Engagements > <this engagement>`
- Engagement type chip: `ENGAGEMENT` (distinguishes from Project at depth-1+)
- Lifecycle status chip: `Active` / `Forming` / `Paused` / `Closing` / `Closed` / `Cancelled`
- **MSA status chip** (NEW vs mock — add this) — `MSA: Active` / `MSA: Pending renewal` / `MSA: Expired` / `MSA: None`. MSA is the commercial gate; its state belongs in the header, not buried in details.
- Primary action menu (`Actions ▾`) — Edit, Close, Cancel, Transfer Lead, etc.

### Identity strip (always visible)
- Engagement name
- Two-party identity: `<Client Org> ↔ <Provider Org>` rendered as the two-card pattern from the mock (logo + name + role label)
- Effective date range
- Engagement code (compact, ID-shaped)

### Right rail / Details panel (always visible on Overview; collapsible on other tabs)
- Description
- Client + Provider org references
- Visibility / Membership policy
- Effective + MSA effective dates
- Engagement code
- Engagement Metadata (Tier, Sector/Industry, Billing model, Renewal cadence, Services)
- Tag chips
- Resource Links (MSA + pinned identity docs — see §7)

### What does NOT go in the header
- Readiness scores → Overview body (not header — too much surface area)
- Recent activity → Overview body
- Member count → Members tab
- Document counts → Documents tab

---

## 6. The Overview tab — signature pattern

The Overview tab is the **load-bearing tab**. Other tabs are deep-dives.

### Recommended structure (top to bottom)

1. **Bilateral readiness band** (mock-validated) — two readiness cards side-by-side, one per party, plus a composed engagement-level number.
   - Per side: 3-item snapshot of most-load-bearing obligations (NOT the full 5+ list — that's Readiness tab depth).
   - Composed score: function of both sides — recommend `min(client_readiness, provider_readiness)` semantically (the weaker side gates the engagement health). Defines the math; alternatives possible but pick one.
2. **Programs/Projects list** — depth-1 children of this Engagement, with their own per-Project mini-readiness + status.
   - **NAMING — open question.** Mock uses "Programs." Canonical 7-tier vocab calls depth-1 "Project." Either (a) "Programs" is just the display label for "Projects under this Engagement" (acceptable but invents vocab), or (b) introduces a new tier (not in canonical stack). Recommend: call them `Projects`, or pick "Programs" only after updating canonical-vocab memex. Don't ship vocab divergence silently.
3. **Recent Activity** (bilateral, visibility-filtered) — last ~10 events with party-of-origin chip. Full feed in Activities tab.
4. **Related Engagements** (mock-validated) — cross-engagement relationships (e.g., "this engagement is the parent of the audit-scope sub-engagement"). Useful for compliance reviews.

### What does NOT go on Overview
- Full readiness breakdown (Readiness tab)
- Full member list (Members tab)
- Full document list (Documents tab — Resource Links rail still shows MSA + pinned)
- Full activity feed (Activities tab)
- Settings/configuration (Actions menu or dedicated edit surface)

**Density discipline.** The mock currently shows ~5+ readiness line items per side on Overview. Recommend pruning to 3 most-load-bearing per side; the rest is Readiness tab. Otherwise Overview duplicates Readiness.

---

## 7. The two-tier commercial model surface

Brian's 2026-05-27 12:12 PT refinement: **MSA at Engagement, SOW per Project.** Project terms are *bound by* engagement-level MSA constraints.

### Engagement-detail responsibilities (this page)
- **MSA status chip** in header (see §5).
- **MSA document** pinned as the first Resource Link in the right rail.
- **MSA effective date + renewal date** in the details panel.
- **MSA-derived obligations** rendered into the Requirements tab as engagement-scope requirements.
- **No SOW authoring here.** SOW/Order Form/License Agreement are Project-detail concerns (depth-1).

### How SOW-relatedness should be visible from Engagement-detail
- Programs/Projects list (Overview) shows per-Project status; clicking through goes to Project-detail where the SOW lives.
- Optionally: a "Project Agreements" summary card showing total active SOWs + warnings if any project lacks one. Useful for compliance personas.

### Anti-pattern
- Don't render SOW authoring/signing UI at Engagement scope. Engagement is the commercial umbrella; per-deliverable terms belong to the deliverable.

---

## 8. Lifecycle states

The Engagement is a state machine. Page chrome should adapt.

| State | Header chip | What's editable | What's prominent |
|---|---|---|---|
| **Forming** | `Forming` (amber) | Most fields; MSA still being drafted/signed | "Complete formation" CTA; checklist of formation steps |
| **Active** | `Active` (green) | Member roster, tags, descriptions, supplemental docs | Bilateral readiness; recent activity |
| **Paused** | `Paused` (gray) | Nothing material; pause reason editable | Pause reason; resume CTA |
| **Closing** | `Closing` (amber) | Closure paperwork; final attestations | Closure checklist; outstanding obligations |
| **Closed** | `Closed` (gray) | Read-only except internal notes | Archive; final readiness state preserved |
| **Cancelled** | `Cancelled` (red) | Read-only | Cancellation reason; refund/dispute state if any |

**Implication:** Don't render full edit chrome on Closed/Cancelled engagements. The mock shows Active — design for the others explicitly.

---

## 9. Cross-app deep-link contract

When SME Mart's matchmaking flow concludes with "parties agreed to engage," it deep-links into Projects App to form the Engagement.

### Recommended URL contract (proposal — needs zb/ui + Kevin confirmation)

**Formation entry:**
```
/engagements/new?from=sme-mart-matchmaking&matchmakingId=<uuid>&clientOrgId=<uuid>&providerOrgId=<uuid>
```

**Existing engagement entry (after formation):**
```
/engagements/:id?from=sme-mart
```

### What Projects App should do on `from=sme-mart` entry
- Optionally render a "via SME Mart matchmaking" badge in the header (small, non-intrusive — auditor signal).
- Pre-fill formation fields from the matchmaking record (parties, proposed scope, draft services).
- On successful formation, send a `matchmakingComplete(engagementId)` callback to SME Mart so it can mark the matchmaking record as transitioned.

### What SME Mart will NOT need from Projects App
- No return click-through. Once formation is complete, the user lives in Projects App.
- No reverse data sync. SME Mart's matchmaking record is closed; the Engagement is now authoritative.

**Open per zb/ui INTENT Q13** — Tom/Kevin to confirm URL shape.

---

## 10. What this page is NOT

Stated explicitly to prevent scope creep:

- **NOT a Project execution surface.** No sprint planning, no per-deliverable Gantt, no PR-style work queue. Drill to Project-detail for that.
- **NOT a matchmaking surface.** No vendor browse, no RFP/Bid, no vendor profile authoring. That's SME Mart.
- **NOT an MSA editor.** MSA authoring/signing happens once at formation (or via amendment flow); the page renders MSA state, doesn't edit it inline.
- **NOT a billing portal.** Render billing model and renewal cadence; don't process payments. Payment is a separate domain.
- **NOT a vendor risk-management dashboard.** Render vendor obligations and readiness; don't model risk scores. (May overlap conceptually with Readiness — keep Readiness about *did they do it*, not *how risky are they*.)
- **NOT a chat / messaging surface.** Notes tab is for context preservation, not conversation. Real-time comms live elsewhere.

---

## 11. The "Honesty note" banner — open question

Mock shows a banner labeled "Honesty note" above the readiness band. Director Parks doesn't know what this is. Two readings:

- **(a) Aspirational marker** — "this readiness data is self-reported, not verified" disclaimer.
- **(b) Maturity/quality marker** — "this engagement has reached X level of transparency / data quality."
- **(c) Something else** — possibly tied to the Transparency Center pattern (controlled multi-party disclosure layer).

**Concern:** If buyers misread this as a verification badge when it isn't, it conflicts with the platform's transparency invariant. Needs explicit semantics + design treatment that won't be misread.

Recommend: zb/ui-meta-director clarify intent before this lands in production chrome. If the concept survives, define it precisely in INTENT.md and pick a treatment (color, icon, copy) that signals what it actually means.

---

## 12. Boundaries tab at Engagement scope — open question

Per 2026-05-27 huddle §2.9, Boundaries are security-only (data-isolation + access-control). At Engagement scope, what's a Boundary?

**Director Parks lean:** A Boundary at Engagement scope is an access/data-isolation policy between the parties:
- "Provider can read Client's data class X under this engagement; cannot read class Y."
- "Client can see Provider's audit reports; cannot see internal staffing."
- Connects to the platform Boundary concept (memex `Brian P0 — task/subtask partitions as boundary access control`) but applied at the relationship seam.

**If that's right**, the Boundaries tab renders:
- Active boundaries between the two parties.
- What data classes/resources are governed by which boundary.
- Boundary lifecycle (negotiated at formation, possibly amended).

**If it's different**, define it. Either way, this tab needs an INTENT-level definition before any visual treatment.

---

## 13. Documents vs Resource Links split

Both surface attached files. Needs an explicit rule.

### Recommended split

**Resource Links** (right rail, always visible) — *engagement-identity docs*:
- MSA (always first)
- Active SOWs (or summary link to per-Project SOW list)
- Audit reports pinned at engagement scope
- Insurance certificates / attestations
- Compliance certifications

Curated, ~5-10 items max, manually pinned. These are the docs an auditor would ask to see.

**Documents tab** — *working files / deliverables*:
- Uncategorized uploads
- Meeting decks
- Drafts
- Anything that doesn't belong in the curated Resource Links rail

Browseable, paginated, search-friendly. May have its own folder structure.

**Rendering rule:** A doc is either pinned (Resource Links) or filed (Documents tab), not both. Pinning is an explicit action ("Pin as Engagement Resource Link"). Author/audit trail tracks the pin.

**Anti-pattern:** Don't let the Documents tab become a dumping ground that auditors have to grep. The curated Resource Links is the auditor's surface.

---

## 14. Activity feed visibility rules

Recent Activity (Overview) and Activities tab (full feed) show bilateral events. Both sides see most events, but there must be a visibility model.

### Recommended visibility tiers

| Tier | Visible to | Examples |
|---|---|---|
| **Bilateral / Public** | Both parties + auditors | MSA signed, Project created, deliverable submitted, member added, status changed |
| **Client-internal** | Client org only | Internal compliance notes about the vendor, internal stakeholder discussions |
| **Provider-internal** | Provider org only | Internal staffing notes, cost analysis |
| **Audit-only** | Auditors (post-hoc, time-bound) | Full bilateral + both-internals during audit window |

**Implication for rendering:**
- Each activity event has a `visibility` field.
- Default new events are Bilateral.
- Marking an event Internal is an explicit action.
- The feed renders only events the current viewer is allowed to see.

**Open question:** Where do Internal events live? Same feed with a visibility chip, or a separate "Internal Notes" surface? Recommend same feed with chip — keeps the bilateral trail intact for the side that authored it; auditors get full feed under audit-only access.

---

## 15. Notes at Engagement scope (per Clark 2026-05-27 confirmation)

Notes lives as a top-level tab on Engagement-detail (mock-validated; confirmed by Clark same-day).

**What Engagement-level Notes is for:**
- Meeting minutes between the two parties.
- Context preservation across handoffs (engagement lead changes, etc.).
- Side discussions that aren't formal Activity events.
- Pre-decisional drafts before they become Requirements or Project work.

**What Notes is NOT for:**
- Project-execution work product (lives on Project-detail Notes, when that exists).
- Real-time chat (Notes is async by design).
- Documents/deliverables (lives in Documents tab).

**Carrier:** FileService Folders + `.md` files per Kevin 2026-05-27 confirmation. See [carrier-rule memex note](file:///Users/cstacer/basic-memory/memex/zerobias/platform/Carrier%20rule%20—%20cardinality%20+%20query-shape%2C%20not%20feature%20category.md).

**Visibility:** Same model as Activities feed — bilateral default, with internal-only available.

**Patterns worth lifting from SME Mart Notes implementation:**
1. Folder tree (recursive) for organization.
2. Markdown editor with task-status plugin (inline checkboxes that bind to platform.Task).
3. Note → Task injection (extract a TODO from a note, create a Task linked back).
4. Meeting-minutes as a first-class folder type with attendees field.
5. AccessLevel three-tier (private / engagement / org).

Director Parks already sent these as a Tell-block 2026-05-27; ui-meta-director will decide which to incorporate.

---

## 16. Open design questions (prioritized)

| # | Question | Blocker for | Owner |
|---|---|---|---|
| 1 | ~~Roles tab — merged into Members?~~ **CLOSED 2026-05-27 — Roles is first-class with its own ProjectRoles CRUD per Clark.** | — | — |
| 2 | "Programs" vs "Projects" — vocab choice for depth-1 children on Overview | Overview rendering + canonical-vocab consistency | ui-meta-director + Director Parks (memex if "Programs" sticks) |
| 3 | "Honesty note" banner — what does this signify? | Overview rendering | ui-meta-director |
| 4 | Boundaries at Engagement scope — definition + render? | Boundaries tab implementation | ui-meta-director + Kevin |
| 5 | Readiness math — how does engagement-level compose from per-side? | Readiness rendering | ui-meta-director (proposal) → Brian (sign-off) |
| 6 | MSA status chip placement — header or details panel? | Header chrome | ui-meta-director (Director Parks recommends header) |
| 7 | Cross-app deep-link URL contract | SME Mart handoff impl | Tom + Kevin (per INTENT Q13) |
| 8 | Activity visibility model + UI affordance | Activities tab rendering | ui-meta-director + Brian (visibility policy) |
| 9 | Documents vs Resource Links split rule | Documents tab + right rail | ui-meta-director |
| 10 | Engagement formation flow — how does SME Mart matchmaking hand off into formation? | Cross-app handoff timing | Tom + Director Parks |
| 11 | MSA amendment / re-ratification semantics | MSA lifecycle | Brian (next Tue/Fri meeting) |
| 12 | Per-Project SOW catalog source + reuse model | Project-detail (not this page, but informs Engagement view) | Daniel Rojas (catalog) + Brian |

---

## 17. Anti-patterns

- **Don't single-party-render the Engagement.** Two parties; show both in the header at all times.
- **Don't surface SOW authoring at Engagement scope.** SOWs are Project-scope.
- **Don't dump all readiness detail on Overview.** Overview = snapshot, Readiness tab = breakdown.
- **Don't put MSA in Documents tab.** MSA is engagement-identity; right-rail Resource Link.
- **Don't render Closed/Cancelled engagements with active edit chrome.** Lifecycle-aware chrome.
- **Don't ship vocab that diverges from canonical 7-tier stack** ("Programs" vs "Projects") without updating memex first.
- **Don't conflate Notes with chat.** Notes is async context preservation.
- **Don't make the Documents tab a dumping ground.** Curate Resource Links; everything else is a working file.
- **Don't render an "Honesty note"-style label that could be misread as verification.** Define semantics or drop.
- **Don't replicate the Project-detail tab strip on Engagement-detail.** Different surfaces; different jobs.

---

## 18. How to use this brief

1. **Use it to scope your Engagement-detail plan-phase.** Each tab in §4 deserves its own plan; this brief defines the *intent* per tab so plan-phases stay aligned.
2. **Pin the open questions in §16.** Some need Brian/Kevin/Tom; others are pure design calls you can make and document in your INTENT.md.
3. **Use §10 as a scope-creep firewall.** When someone proposes adding billing / chat / vendor-risk-scoring to Engagement-detail, the §10 list is your "not on this page" reference.
4. **Anchor visual decisions in §5-§6.** Header hierarchy and Overview structure are load-bearing; everything else cascades.
5. **Refer back to Director Parks via Tell-block** when an open question has no clear owner or when a design decision implicates SME Mart's matchmaking-side contract. Clark relays.

---

## References

- [Engagement feature reference (SME Mart prior art)](../notes/engagement-feature-reference-for-zb-ui-2026-05-27.md)
- [Scope-reduction pivot brief](sme-mart-scope-reduction-pivot-2026-05-27.md)
- [2026-05-27 huddle notes (Requirements/Readiness reframe)](../notes/meetings/2026-05-27-slack-huddle-requirements-readiness-reframe.md)
- [Requirements architecture (deferred pending Kevin)](../notes/requirements-architecture-2026-05-27-pending-kevin.md)
- Mock screenshots — 2026-05-27 5:29 PM PT (top) + 5:31 PM PT (bottom), FY26 Continuous Compliance Engagement (Acme Corp ↔ ZeroBias Platform)
- Memex notes:
  - `memex/zerobias/platform/carrier-rule-cardinality-query-shape-not-feature-category`
  - `memex/zerobias/platform/canonical-projects-vocabulary-stack-engagement-project-middle-tiers-task`
  - `memex/zerobias/sme-mart/sme-mart-scope-reduction-engagement-moves-to-platform-2026-05-27` (pending write)
- D-51 Engagement Display Verbiage decision — `.planning/director/DECISIONS.md`
- BACKLOG items in scope: 099, 108, 111, 112, 117-121, 123 — see [BACKLOG.md](../BACKLOG.md)
