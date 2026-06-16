---
id: "036"
priority: high
scope: cross-project (zerobias.com marketing site + Zoho Forms/CRM)
effort: medium
found: 2026-06-15
status: open
promoted_to: null
---

# Rebuild zerobias.com/contact-us lead-gen form — Foundation eligibility fields + Org ownership

Brian directive. Rebuild/replace the lead-generation form on https://zerobias.com/contact-us/. It is a **Zoho Form** that creates a **Lead** record in **Zoho CRM** (current form name: "Community Site Access Request").

## Two core goals

1. **Add Foundation/Guild-eligibility fields.** Capture the signal needed to classify whether the submitter's Org is eligible for the **ZeroBias Foundation 'community/guild'**. The current form does not capture these.
   - **CRITERIA KNOWN (locked from Brian, May 2026).** `guildEligible = (nonprofit OR gov OR <100 employees) AND NOT (publicly-traded OR PE-backed OR >100 employees)`. Sources: `.planning/notes/meetings/2026-05-12-catalin-1-1.md:20` and `.planning/director/default-engagement-onboarding-backend-requirements-2026-06-02.md:290` (which names the Contact-Us form as the "Classify" capture surface — Layer 2 of the onboarding feature).
   - **The two new fields (derived):**
     - **Business classification / entity type** (dropdown, required): nonprofit · government · hospital/healthcare institution · not-for-profit · publicly-traded company · PE-backed company · privately-held company.
     - **Number of employees** (size signal; threshold = 100; bands TBD pending Brian).
   - **Design stance:** capture type + size as neutral business-profile questions; compute eligibility downstream (Chris at the approval gate / classify op). Do NOT surface "eligibility" to the applicant.
   - **NOT a repurpose:** the existing "Organization Type" field is almost certainly the Auditor/Auditee axis (invitation model) — a different axis than business classification. Confirm its current options on inspection.
   - **4 confirmations sent to Brian (2026-06-15), non-blocking:** (1) size band granularity, (2) self-attested vs proof, (3) silent-capture vs explicit eligibility framing, (4) edge case: large (>100) nonprofit/gov — eligible or capped? Form base/build can proceed with provisional defaults while these settle.
2. **Re-own the form under the Org.** Current form is owned by user **`evaughn`** (departed employee) — see permalink owner segment. New form must be owned by the **Org**, not a single user, so it survives staff changes.

Then **replace** the existing form on the contact-us page with the new Org-owned form.

## Resources / access

- **Current form permalink:** https://forms.zohopublic.com/evaughn/form/CommunitySiteAccessRequest/formperma/7kOXfnFL9l0jurg5VC6GlALcVBsqEiBUWhWUo_2HzRc
- **Clark** has Zoho CRM access under the Zerobias org → can pull CRM field/schema info on request.
- **Chris** holds the actual form backend/code if specific details are needed.
- **Clark** can open the existing form in chrome-devtools for read-only inspection (no backend edit access).

## Tasks / investigations

- [x] Investigate a **Zoho CRM MCP server or CLI** — DONE 2026-06-15 (findings below).
- [x] **Define Foundation/Guild eligibility criteria** — DONE: already locked from Brian (May 2026); see Goal 1. Only 4 minor confirmations outstanding (sent to Brian, non-blocking).
- [x] **Draft build-ready field spec** — DONE 2026-06-15: `.planning/director/contact-us-form-field-spec-2026-06-15.md`.
- [ ] **Clark:** inspect current form (chrome-devtools) — confirm which fields are actually *presented* vs gated, and the current "Organization Type" options.
- [ ] **Clark:** export/share the Zoho CRM **Lead** field schema → fill the CRM-mapping column in the field spec.
- [ ] Map new fields → CRM Lead fields (create custom fields in CRM as needed).
- [ ] Build the new **Org-owned** Zoho Form (manual, Zoho UI).
- [ ] Swap it onto https://zerobias.com/contact-us/ (coordinate site edit access).

## Related work
- **Layer 2 ("Classify")** of the onboarding feature — `.planning/director/default-engagement-onboarding-backend-requirements-2026-06-02.md` (this form is its capture surface).
- `GUILD-ELIGIBILITY-CLASSIFICATION-1` (model org business classification + gate Guild membership) — this form is the front-end capture half.
- Field spec: `.planning/director/contact-us-form-field-spec-2026-06-15.md`.

## Approach

Planner agent **or** step-by-step manual build (Clark's call — manual may be simplest given external Zoho tooling). Sequence is gated: eligibility criteria → CRM fields → form → site swap.

## Zoho tooling recon (2026-06-15)

Splits along CRM vs Forms:

- **CRM — usable MCPs exist.** Official **Zoho MCP** (https://www.zoho.com/mcp/) covers Zoho CRM (+ Mail/Calendar/Desk/Cliq/Projects/WorkDrive), OAuth, remote/cloud-hosted, Claude-compatible, can create/update Lead records. Community options: `junnaisystems/zoho-crm-mcp` and `Mgabr90/zoho-mcp-server` (Python, OAuth incl. `settings.ALL`, create/update/search, `convert_lead`, `get_module_fields`) — but `junnaisystems` is early-stage (4 commits, no releases), not prod-safe.
- **Custom Lead-field CREATION** is exposed by none of them — read field metadata only; creating new custom fields stays UI or raw REST (`settings.ALL`).
- **Forms — no tooling.** No MCP covers Zoho Forms. The Forms/Creator REST API reads/writes form *records* and fetches form definitions, but **creating/designing a new form is not an API/CLI path** — forms are built in the Zoho Forms drag-drop UI.

**Decision:** Do NOT stand up a Zoho MCP just for this form. The form build is manual Zoho UI work (no automation lever). For the CRM half, Clark hands over the Lead field schema directly (he has CRM access) — faster/safer than wiring an OAuth MCP into prod CRM. Revisit the **official** Zoho MCP only if ongoing CRM automation becomes a need. → confirms the "manual step-by-step" approach.

**Why now:** Brian directive (2026-06-15); current form is orphaned under a departed employee and misses the Foundation-eligibility signal the platform needs from inbound leads.
**Blocked by:** Nothing hard-blocking. Eligibility criteria are known; 4 minor confirmations are out to Brian (band granularity, attest-vs-verify, visibility, large-nonprofit edge) but the field spec, current-form inspection, CRM-schema gathering, base rebuild, and Org-ownership migration all proceed in parallel. Final field options + the site swap (needs site edit access) are the only true gates.
