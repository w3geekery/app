# Pilot Terms & Conditions — MVP Boilerplate

**Status:** PLACEHOLDER boilerplate for the pilot. Brian directive 2026-06-22: "do boiler and do it when they login for first time to accept for mvp. Not on form submission… first is accept 'pilot Ts and Cs'. Any mumbo jumbo is fine for now. I will work on getting legal formalities produced soon once we are a tad further."
**Where it's used:** the **first-login acceptance gate** (app/login side), NOT the contact-us form. New users accept "Pilot Terms and Conditions" on first sign-in.
**Replace before GA:** legal-produced Terms of Use / Terms of Service post-pilot. This is not legal advice; it's a stand-in.

---

## Pilot Terms and Conditions

_Last updated: 2026-06-22 — Pilot release_

Welcome to the ZeroBias pilot. By accessing or using the ZeroBias platform and the SME Mart marketplace (collectively, the "Service") during this pilot period, you agree to these Pilot Terms and Conditions ("Pilot Terms"). If you do not agree, do not use the Service.

**1. Pilot status.** The Service is provided as an early-access pilot. Features may change, be added, or be removed at any time, and the Service may contain errors or be interrupted. The Service is provided "as is" and "as available," without warranties of any kind.

**2. Eligibility & accounts.** You must provide accurate information and are responsible for activity under your account. You must have authority to accept these Pilot Terms on behalf of your organization.

**3. Acceptable use.** You agree not to misuse the Service, including: attempting to disrupt or gain unauthorized access to the Service or its data; scraping or bulk-extracting data; or using the Service to violate any law or third-party right.

**4. Your data.** You retain ownership of content you submit. You grant ZeroBias a license to host, process, and use that content to operate and improve the Service during the pilot. Do not submit sensitive personal or regulated data beyond what the Service requests.

**5. Confidentiality & feedback.** Pilot details, non-public features, and performance may be confidential. Feedback you provide may be used by ZeroBias without restriction or obligation to you.

**6. No fees / no commitment (pilot).** Unless separately agreed in writing, no fees apply during the pilot. Participation does not create any obligation for either party to continue beyond the pilot.

**7. Limitation of liability.** To the maximum extent permitted by law, ZeroBias is not liable for any indirect, incidental, or consequential damages, or for any loss of data or profits, arising from your use of the pilot Service.

**8. Changes & termination.** ZeroBias may modify these Pilot Terms or suspend or end the pilot (or your access) at any time. Continued use after changes means you accept the updated terms.

**9. Governing terms.** These Pilot Terms are interim and will be superseded by ZeroBias's formal Terms of Service and Privacy Policy when published. Your continued use after those are published is subject to them.

By clicking "I Accept," you acknowledge you have read and agree to these Pilot Terms and Conditions.

---

**[ I Accept ]**

---

### Notes for implementation
- Render on **first login** as a blocking modal/step; record acceptance (user, timestamp, version "Pilot 2026-06-22") so re-acceptance can be required when the formal ToS lands.
- Version the document so the formal legal ToS supersession (clause 9) is auditable.
- Connects to the onboarding-step template system (backlog 038) — first-login T&C acceptance is step 1 of pilot onboarding.
