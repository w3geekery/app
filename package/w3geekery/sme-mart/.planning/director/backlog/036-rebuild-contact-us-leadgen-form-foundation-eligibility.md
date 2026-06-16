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

1. **Add Foundation-eligibility fields.** Capture the fields needed to determine whether the submitter's Org is eligible for the **ZeroBias Foundation 'community/guild'** on the ZB platform. The current form does not capture these.
   - **OPEN — blocking:** the actual eligibility *criteria* are undefined. Need them from Brian / platform before we know which fields to add. (Form fields are derived from criteria, not the reverse.)
2. **Re-own the form under the Org.** Current form is owned by user **`evaughn`** (departed employee) — see permalink owner segment. New form must be owned by the **Org**, not a single user, so it survives staff changes.

Then **replace** the existing form on the contact-us page with the new Org-owned form.

## Resources / access

- **Current form permalink:** https://forms.zohopublic.com/evaughn/form/CommunitySiteAccessRequest/formperma/7kOXfnFL9l0jurg5VC6GlALcVBsqEiBUWhWUo_2HzRc
- **Clark** has Zoho CRM access under the Zerobias org → can pull CRM field/schema info on request.
- **Chris** holds the actual form backend/code if specific details are needed.
- **Clark** can open the existing form in chrome-devtools for read-only inspection (no backend edit access).

## Tasks / investigations

- [x] Investigate a **Zoho CRM MCP server or CLI** — DONE 2026-06-15 (findings below).
- [ ] **Define Foundation community/guild eligibility criteria** (from Brian/platform) → derive form fields. *(blocker for goal 1)*
- [ ] Inspect current form (chrome-devtools) — inventory existing fields + their CRM Lead mappings.
- [ ] Map new fields → Zoho CRM **Lead** fields (create custom fields in CRM as needed).
- [ ] Build the new **Org-owned** Zoho Form.
- [ ] Swap it onto https://zerobias.com/contact-us/ (coordinate site edit access).

## Approach

Planner agent **or** step-by-step manual build (Clark's call — manual may be simplest given external Zoho tooling). Sequence is gated: eligibility criteria → CRM fields → form → site swap.

## Zoho tooling recon (2026-06-15)

Splits along CRM vs Forms:

- **CRM — usable MCPs exist.** Official **Zoho MCP** (https://www.zoho.com/mcp/) covers Zoho CRM (+ Mail/Calendar/Desk/Cliq/Projects/WorkDrive), OAuth, remote/cloud-hosted, Claude-compatible, can create/update Lead records. Community options: `junnaisystems/zoho-crm-mcp` and `Mgabr90/zoho-mcp-server` (Python, OAuth incl. `settings.ALL`, create/update/search, `convert_lead`, `get_module_fields`) — but `junnaisystems` is early-stage (4 commits, no releases), not prod-safe.
- **Custom Lead-field CREATION** is exposed by none of them — read field metadata only; creating new custom fields stays UI or raw REST (`settings.ALL`).
- **Forms — no tooling.** No MCP covers Zoho Forms. The Forms/Creator REST API reads/writes form *records* and fetches form definitions, but **creating/designing a new form is not an API/CLI path** — forms are built in the Zoho Forms drag-drop UI.

**Decision:** Do NOT stand up a Zoho MCP just for this form. The form build is manual Zoho UI work (no automation lever). For the CRM half, Clark hands over the Lead field schema directly (he has CRM access) — faster/safer than wiring an OAuth MCP into prod CRM. Revisit the **official** Zoho MCP only if ongoing CRM automation becomes a need. → confirms the "manual step-by-step" approach.

**Why now:** Brian directive (2026-06-15); current form is orphaned under a departed employee and misses the Foundation-eligibility signal the platform needs from inbound leads.
**Blocked by:** Foundation community/guild eligibility criteria (undefined — needed from Brian/platform) before the eligibility-field work can proceed. Org-ownership migration + site swap are not blocked.
