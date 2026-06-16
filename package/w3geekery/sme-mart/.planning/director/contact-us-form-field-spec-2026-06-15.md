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

Legend: **KEEP** = exists today, carry over · **NEW** = add · **CONFIRM** = verify against live form when Clark inspects in chrome-devtools.

| # | Field | Type | Req | Options / notes | CRM Lead mapping | Status |
|---|---|---|---|---|---|---|
| 1 | Your Name (First & Last) | text | ✓ | | First/Last Name | KEEP |
| 2 | Phone | text | ✓ | | Phone | KEEP |
| 3 | Company Name | text | ✓ | | Company | KEEP |
| 4 | Company Website | text | ✓ | drives `getOrgByEmailDomain` pairing downstream | Website | KEEP |
| 5 | Work Email | email | ✓ | email-verified before submit (Zoho feature) | Email | KEEP |
| 6 | Organization Type | dropdown | ✓ | **CONFIRM current options** — believed to be Auditor/Auditee (invitation axis). Distinct from #7. | (existing mapping) | KEEP / CONFIRM |
| 7 | **Business classification** | dropdown | ✓ | nonprofit · government · hospital/healthcare institution · not-for-profit · publicly-traded company · PE-backed company · privately-held company | **NEW custom field** (TBD) | **NEW** |
| 8 | **Number of employees** | dropdown | ✓ | threshold = 100. Provisional bands (pending Brian Q1): 1-10 / 11-50 / 51-100 / 101-500 / 500+ | **NEW custom field** (TBD) | **NEW** |
| 9 | Cloud Version | checkbox group | — | Public/Private/Hybrid/Unknown/Other — **CONFIRM still used** (may be gated/unused) | (existing) | KEEP / CONFIRM |
| 10 | Cloud Provider | checkbox group | — | AWS/Azure/Google/Unknown/Other — **CONFIRM still used** | (existing) | KEEP / CONFIRM |
| 11 | Hypervisor | checkbox group | — | **CONFIRM still used** | (existing) | KEEP / CONFIRM |
| 12 | Secrets Manager | checkbox group | — | **CONFIRM still used** | (existing) | KEEP / CONFIRM |
| 13 | Privacy Policy Consent | checkbox | ✓ | | (existing) | KEEP |
| 14 | Terms & Conditions | checkbox | ✓ | | (existing) | KEEP |
| 15 | Lead Source | dropdown | — | attribution | Lead Source | KEEP |
| 16 | Channel Source | text | — | attribution | (existing) | KEEP |

> Fields 9-12 came from the raw form *definition*; Clark noted some may be **hidden/gated** (not shown when he filled it). Confirm presented-vs-gated in chrome-devtools before deciding keep/drop.

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

None block building fields #1-8 + #13-16. Only #8's final band list and #9-12's keep/drop are soft-pending.

---

## What Clark can do now (parallel, non-blocked)

1. **Inspect the live form** (chrome-devtools) → confirm which fields are actually *presented* (resolve #9-12) and the current **Organization Type** options (#6).
2. **Export the Zoho CRM Lead field schema** → fill the "CRM Lead mapping" column; identify whether `Business classification` / `Number of employees` need **new custom Lead fields** (likely yes).
3. **Org-ownership prep:** confirm in Zoho how to create the new form under the Org (not a user) — admin/ownership settings.

## Then (gated)
- Create the 2 new CRM custom Lead fields (#7, #8).
- Build the Org-owned form per this spec.
- Wire form→Lead mapping; preserve Chris's approval gate.
- Swap onto zerobias.com/contact-us/ (needs site edit access — Chris).
