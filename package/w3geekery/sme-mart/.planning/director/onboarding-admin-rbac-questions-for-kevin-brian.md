# Onboarding — Admin Identity + RBAC Questions for Kevin / Brian

**Status:** LIVING list. Surfaced by Clark during the default-Engagement onboarding design (2026-06-03). Add to it as more questions come up; check items off as Kevin/Brian answer.

**Context:** Worked example used throughout — *ZeroBias is entering an Engagement with **Bob** of **Bob's Org**.* ZeroBias provides certain things, Bob provides certain things. When ZeroBias invites Bob into the platform, Bob can see only certain things; we steer him to the freshly-minted Engagement between Bob + Bob's Org and ZeroBias. **Both sides hold an Engagement mirroring the other.** The onboarding tasks ZeroBias asks Bob to complete live on that Engagement project.

**Decision already made (so it does NOT block the build):** to start, **all onboarding tasks are assigned to the Org's default `Org Admins` group / `Organization Admin` role** (Clark, 2026-06-03). This confirms the brief's existing new-model RACI ("customer Org Admin responsible"). The questions below are about *how the right human lands in that Org Admin role* and *who else needs roles* — not about which role tasks go to.

Cross-ref: canonical brief `default-engagement-onboarding-backend-requirements-2026-06-02.md` (PART 2 §M points here).

---

## Cluster 1 — Who becomes the Org Admin (identity gating)

### Q-ADM-1 — Is the first/only signup the Admin by default? *(Kevin — verifiable)*
If Bob is the only person in his Org, is he the `Organization Admin` **by default**? What does the platform actually do today — does the first member of a newly-provisioned org auto-receive the `Organization Admin` role / auto-join the `Org Admins` group, or must it be granted explicitly?
- **Working assumption:** yes, sole signup = Org Admin by default.
- **Verifiable live (CI/prod via ZB MCP)** before we even ask — flag for Director to confirm against the provisioning/role behavior.

### Q-ADM-2 — How is admin-rights eligibility gated — at the CRM/lead level? *(Brian + Kevin)*
Is the decision "Bob *ought* to be granted admin" gated **upstream at the CRM / lead-acceptance stage**? i.e. the leads we accept are leads we're already fairly certain should be handed the keys, so lead-acceptance *is* the implicit admin-credentialing step.
- If yes: what's the explicit criterion at lead acceptance, and is it recorded on the `crm_record_id` / `app.organization_invitation` so provisioning can trust it?
- If no: where else does the "this person is authorized to be Org Admin" assertion come from?

### Q-ADM-3 — Non-happy-path: signup person is NOT the right admin *(Brian — policy; Kevin — mechanism)*
Happy path = Bob is the correct person to administer Bob's Org. How do we handle when the self-signup person is **not** the right person?
- Do we need a **credentialing step** where an **officer of the Org** must identify/attest who gets admin privileges?
- What's the recovery flow — re-assign admin, invite the real officer, hold provisioning until verified?

---

## Cluster 2 — Other personnel + role setup

### Q-ADM-4 — Do we need a personnel roster up front to set up groups/roles? *(Brian — product; Kevin — RBAC)*
What about users who are **not** Org officers? To configure groups/roles (and any non-admin access) at onboarding, do we need the customer to supply a **list of personnel** up front, or is that deferred until after the Org Admin is established and they invite their own people?
- Bearing: does onboarding need a "enumerate your team" task before RBAC can be configured, or is single-admin-then-self-serve-invites enough for MVP?

---

## Cluster 3 — Engagement model + visibility

### Q-ENG-2 — Progressive task visibility mechanism *(Kevin — Board/Task capability; Brian — which tasks)*
Bob sees the org<>org tasks on the Engagement project, but **some appear only after he completes prerequisite tasks**.
- **ANSWERED (Clark 2026-06-03): BOTH.** When a task is marked **satisfied + closed**, its **Activity `onTransition` workflow** fires and may create the next round of Tasks / Boards / Projects (or unlock features). So progressive disclosure is *both* a platform Board/Task capability (the workflow engine spawns/reveals the next items) *and* Projects-App UI (renders what's currently visible). The next-step graph is **data-driven by task-activity `onTransition`**, not hardcoded.
- **Remaining for Kevin/Brian:** confirm `onTransition` can create downstream Tasks/Boards/Projects (not just status changes); confirm visibility is keyed off task/link state vs. an explicit "published" flag. Ties to OB-003 (`onTransition`) + OB-005 (unlock model) / Q-E.

---

## Resolved / answered

### Q-ENG-1 — Mirrored Engagement: one shared node or two? → **TWO mirrored nodes** *(Clark ruling 2026-06-03)*
**Both orgs hold their OWN Engagement + Projects with mirrored structure — NO shared node.** Each side is party-owned and party-scoped. **The only cross-org connection is a Task-level `satisfies`/`satisfiedBy` ResourceLink between the mirrored task pairs** ("task entanglement is the only data seam"). Seam link-type `task→task satisfies/satisfiedBy` is not registered yet (confirmed prod-zb) but **expected to land 2026-06-03 (Nic)** — same-day dependency, not a blocker; interim seam = `relates_to` placeholder, swap when registered. Captured canonical in the brief ("Cross-org mirroring + the SEAM").
