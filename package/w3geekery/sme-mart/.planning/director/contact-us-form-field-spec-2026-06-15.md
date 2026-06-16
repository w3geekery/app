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
| 1 | Your Name (First & Last) | text (2-part) | ✓ | | First/Last Name | KEEP |
| 2 | Phone | phone (+country code) | ✓ | | Phone | KEEP |
| 3 | Company Name | text | ✓ | | Company | KEEP |
| 4 | Company Website | text | ✓ | drives `getOrgByEmailDomain` pairing downstream | Website | KEEP |
| 5 | Work Email | email | ✓ | | Email | KEEP |
| 6 | **Business classification** | dropdown | ✓ | nonprofit · government · hospital/healthcare institution · not-for-profit · publicly-traded company · PE-backed company · privately-held company | **NEW custom field** (TBD) | **NEW** |
| 7 | **Number of employees** | dropdown | ✓ | threshold = 100. Provisional bands (pending Brian Q1): 1-10 / 11-50 / 51-100 / 101-500 / 500+ | **NEW custom field** (TBD) | **NEW** |
| — | Privacy policy notice | static text + link | — | "By submitting this form, I consent…" — **notice text, NOT a checkbox** | — | KEEP |
| 8 | Terms & Conditions | checkbox | ✓ | "I accept the Terms and Conditions." | (existing) | KEEP |

**Placement:** insert the 2 new fields (#6, #7) after Work Email and before the privacy notice — i.e. company-profile questions grouped together.

**Dropped from the raw definition (not presented on the live form, do NOT carry over unless CRM explicitly needs them):** Organization Type (Auditor/Auditee), Cloud Version, Cloud Provider, Hypervisor, Secrets Manager.

**Possible hidden attribution fields:** Lead Source, Channel Source may be hidden fields auto-populated for CRM attribution — confirm in CRM mapping; keep as hidden if the CRM workflow uses them, otherwise drop.

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
