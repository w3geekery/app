---
id: "034"
priority: high
scope: platform (Projects App) + SME Mart matchmaking
effort: large (feature) — needs platform primitives (engages link, mutual-consent flow, agreed-hierarchy provisioning, agreement-as-Requirement)
found: 2026-06-03
status: open
promoted_to: null
---

# Customer-to-customer engagement creation — mutual-consent handshake + agreed project hierarchy

## Goal (one sentence)

Let two orgs establish a new engagement with each other through a **bilateral consent handshake** (a party in EACH org must agree), after which the **mirrored engagement + project structure is provisioned on both sides** per the agreed-upon projects hierarchy.

## User story

As a customer org, I want to initiate an engagement with another org such that a designated party (e.g. Org Admin) in **each** org must agree before the engagement is established; on mutual agreement, the mirrored Engagement nodes + the agreed project structure are provisioned on both sides.

## Why this matters

- It's the **core marketplace primitive** — "customers engage each other." The existing matchmaking loop (browse -> RFP -> bid -> `acceptBidAndLink`) is ONE specialization (buyer<>provider); this **generalizes** it to any bilateral engagement creation.
- Every contractor<>ZeroBias pair already needs it (2 engagements per pair, one each direction — W3Geekery, SDI, Work Worlds, Undefined, Luis Inc, …), and it scales to customer<>customer.

## Mechanics to design

1. **Initiation** — one org's party proposes an engagement (with a role: provider / customer / peer) to another org.
2. **Bilateral consent gate** — a party in EACH org must agree before the engagement exists. The agreement is itself an **agreements->Requirements** pattern: a Requirement satisfied by each side's consent (req<>sat). Neither party privileged.
3. **On mutual agreement -> provision** the mirrored Engagement nodes (one per side, org-owned) + the agreed projects under each, per a negotiated hierarchy.
4. **Counterparty binding — NOT a wipeable name, NOT a mutable tag** (both unsafe: org tags are editable/deletable by the owning admin). Durable binding = the **`engages`/`engagedWith` ResourceLink** (by-reference, traversable) + the **consent Requirement** as the auditable record. Display name is a non-load-bearing label only.
5. **Agreed projects hierarchy** — the two parties negotiate the project structure; provisioning builds it on both sides (mirrored).

## The "safe binding" layering (from the 2026-06-03 deliberation)

| Layer | Role | Durability |
|---|---|---|
| Display name | human label | throwaway, non-load-bearing |
| `engages` ResourceLink | structural counterparty edge (UUID->UUID) | referentially sound, traversable, explicit-sever |
| Requirement (req<>sat) | the agreement that the engagement exists + both consented | first-class, auditable — the safe record |

Complementary, not competing. "Safe" = **referential integrity + auditability**, not immutability (nothing here is truly immutable).

## Dependencies / relations

- `engages`/`engagedWith` link type — prod **task-29** (Project ResourceLink vocabulary FR).
- **agreements->Requirements** — `[[BACKLOG-123]]` (Requirements architecture) — consent + engagement-existence as first-class Requirements.
- `satisfies`/`satisfiedBy` seam — the consent handshake IS a satisfies pair.
- OB-001 provisioning / default-engagement onboarding — same machinery, generalized.
- Bilateral mirrored model — D-52 + the 2026-06-03 mirrored-two-org ruling (each org owns its own Engagement+Projects; seam = task satisfies/satisfiedBy).
- Matchmaking milestone — this is a core feature, not a side item.

## Open questions

- Who is the authorized **party** per org (Org Admin? a designated signer?) — ties to the admin-identity cluster Q-ADM-1..4 (`onboarding-admin-rbac-questions-for-kevin-brian.md`).
- How is the **agreed project hierarchy** negotiated and represented *before* provisioning fires?
- **Roles** (provider / customer / peer) — carried on the `engages` link (Q-LINK-ATTR) or as each node's own role marker?
