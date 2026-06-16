# Contact-Us Form — Build-Ready Field Spec

**For:** backlog 036 (rebuild zerobias.com/contact-us lead-gen form) · **Date:** 2026-06-15 · **Author:** Director Parks (Clark)
**Purpose:** the complete field list for the NEW Org-owned Zoho Form, so the Zoho UI build is mechanical. Marks what's locked vs. pending Brian's 4 confirmations, and what Clark needs to gather.

---

## Form-level
- **Owner:** the **Org** (Zerobias), NOT a user account. (Current form is owned by departed `evaughn` — the reason for the rebuild.)
- **Action:** create a **Lead** in Zoho CRM. A submission is **not** a valid sign-up until **Chris approves** it (existing human gate → appears in Leads channel → triggers the invite/onboarding flow).
- **Title / framing:** keep neutral business "tell us about your company" framing. Per design stance, do **not** surface "Foundation/Guild eligibility" to the applicant — eligibility is computed downstream.

---

## Field list (in display order)

**Verified against the LIVE form 2026-06-15 (screenshot).** The current form is dumb-simple — 5 inputs + a privacy notice + T&C. All the cloud/infra/org-type/attribution fields in the raw form *definition* are **NOT presented** to the user (vestigial or hidden). The new form keeps the simple presented set and adds the 2 eligibility fields.

Legend: **KEEP** = presented today, carry over · **NEW** = add · **HIDDEN** = not user-facing (auto-populated; keep only if CRM uses it).

| # | Field | Type | Req | Options / notes | CRM Lead mapping | Status |
|---|---|---|---|---|---|---|
| 1 | Your Name (First & Last) | text (2-part) | ✓ | | **First Name** + **Last Name** (std) | KEEP |
| 2 | Phone | phone (+country code) | ✓ | | **Phone** (std) | KEEP |
| 3 | Company Name | text | ✓ | | **Company** (std) | KEEP |
| 4 | Company Website | text | ✓ | drives `getOrgByEmailDomain` downstream | **Company Website** (custom; NOT the separate std "Website" field) | KEEP |
| 5 | Work Email | email | ✓ | | **Email** (std) | KEEP |
| 6 | **Business classification** | dropdown | ✓ | nonprofit · government · hospital/healthcare institution · not-for-profit · publicly-traded company · PE-backed company · privately-held company | **NEW custom field** — confirmed not present; distinct from CC Org Type / Partner Service Focus / Lead-Contact Type | **NEW** |
| 7 | **Number of employees** | dropdown | ✓ | threshold = 100. Provisional bands (pending Brian Q1): 1-10 / 11-50 / 51-100 / 101-500 / 500+ | **NEW custom field** — confirmed no std "No. of Employees" on this layout | **NEW** |
| — | Privacy policy notice | static text + link | — | "By submitting this form, I consent…" — **notice text, NOT a checkbox** | — | KEEP |
| 8 | Terms & Conditions | checkbox | ✓ | "I accept the Terms and Conditions." | (consent capture; optional custom checkbox if CRM should record it) | KEEP |

**Placement:** insert the 2 new fields (#6, #7) after Work Email and before the privacy notice — i.e. company-profile questions grouped together.

**Dropped (not presented on the live form, do NOT carry over):** Organization Type, Cloud Version, Cloud Provider, Hypervisor, Secrets Manager.

---

## CRM Lead schema (captured 2026-06-15, "Auditmation Lead" layout)

**Approval gate:** the **`Review Status`** field — options `-None- / Needs Review / Approved Dev / Approved QA / Approved UAT / Approved Prod / Rejected`. **Chris Scarola** is the default **Lead Owner**. A web-form lead lands un-approved; Chris sets `Review Status` to approve (per environment) → becomes a valid sign-up. The form must NOT set Review Status.

**Form does NOT touch these (set later by invite/provisioning flow):** Org Invitation Id, Inviting Org Name/Id, Inviting User Name/Id, Organization Slug, Email Domain, Default Login Provider, Allow Self Registration, Identity Provider, Referring Organization, Organization Logo URL.

**Existing role/sector axes — leave alone (NOT eligibility):** `CC Org Type` (Auditee/Advisory Firm/Auditor/Client/Technology Partner), `Partner Service Focus` (Advisory/Auditor/Government/Insurer/Law Firm/MSP-MSSP/Technology), `Lead/Contact Type` (Advisor/Auditee/Auditor/Competitor/MSP/Platform/Vendor Manager). Business classification (#6) is a separate new axis — do not overload these.

**Attribution:** `Lead Source` (existing; e.g. "Platform API" — web submissions should set a value like "Contact Us / Web Form"), `Channel Source` (existing, free text). Confirm desired Lead Source value for web-form leads.

### Two custom Lead fields to create (the precise ask for the Zoho admin / Chris)
1. **Business Classification** — picklist, values = the 7 in row #6. (Requires Setup access — Clark was permission-denied, so Chris or an admin creates it.)
2. **Number of Employees (band)** — picklist, values per Brian's Q1 answer (provisional 5 bands). (Same — needs admin.)

> **Access gap:** creating these fields + building/owning the form are Setup-level ops Clark lacks (Permission Denied 2026-06-15). Chris (Lead Owner / form backend owner / likely Zoho admin) either grants Clark Setup rights or executes the Zoho-side build from this spec.

---

## Eligibility computation (downstream, NOT in the form)

```
guildEligible = (nonprofit OR gov OR <100 employees)
                AND NOT (publicly-traded OR PE-backed OR >100 employees)
```
Computed at the classify/approval step from fields #7 + #8. The form only captures the two signals.

---

## Pending Brian (4 confirmations sent 2026-06-15) — provisional defaults in use

1. **Size bands (#8):** provisional = 5 brackets above. If Brian wants simple, collapse to `<100 / 100+`.
2. **Attest vs verify:** provisional = self-attested at form, Chris verifies at approval. (No proof upload added.)
3. **Visibility:** provisional = silent capture (no eligibility shown to user).
4. **Large nonprofit/gov (>100) edge:** affects downstream computation only, not the form fields — no form change either way.

None block building the form. Only #7's final employee-band list is soft-pending Brian (provisional bands stand in the meantime).

---

## What Clark can do now (parallel, non-blocked)

1. ~~Inspect the live form~~ **DONE 2026-06-15** (screenshot) — presented set confirmed; table above is reality.
2. **Export the Zoho CRM Lead field schema** → fill the "CRM Lead mapping" column; confirm `Business classification` / `Number of employees` need **new custom Lead fields** (likely yes); confirm whether Lead Source / Channel Source hidden fields are in use.
3. **Org-ownership prep:** confirm in Zoho how to create the new form under the Org (not a user) — admin/ownership settings.

## Then (gated)
- Create the 2 new CRM custom Lead fields (#7, #8).
- Build the Org-owned form per this spec.
- Wire form→Lead mapping; preserve Chris's approval gate.
- Swap onto zerobias.com/contact-us/ (needs site edit access — Chris).
