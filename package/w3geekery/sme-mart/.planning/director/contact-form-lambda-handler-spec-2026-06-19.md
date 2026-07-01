# Contact-Us Lambda Handler Spec — form submit -> Zoho CRM Lead

**For:** task-53 (Owned contact-us form -> Zoho CRM API) under epic task-50 · **Date:** 2026-06-19 · **Author:** Director Parks (Clark)
**Trigger:** Kevin (2026-06-19) — "need to spec out the lambda handler that updates CRM."
**Status:** draft for Kevin's review. Build-ready except the items in "Open / needs input."

---

## Purpose

A serverless HTTP handler that receives a submission from the in-repo static contact-us form (served via CloudFront) and creates a **Lead** in Zoho CRM via API — replacing the Zoho Forms iframe entirely. It must **never silently drop a lead** and must **preserve Chris's `Review Status` human approval gate** (the handler never sets Review Status).

## Architecture (fits the existing static-assets/KB pattern)

```
[static form on CloudFront]
      | HTTPS POST (JSON)  + Turnstile token
      v
[API Gateway HTTP API]  -- throttled, CORS-locked to the site origin
      v
[Lambda: contact-lead-handler]  (Node.js/TypeScript)
      |-- 1. verify Turnstile (Cloudflare siteverify)
      |-- 2. validate + normalize payload
      |-- 3. get Zoho access token (refresh-token grant, cached)
      |-- 4. POST /crm/v8/Leads   (create Lead)
      |        success -> 200 to client
      |        transient failure -> enqueue to SQS DLQ, still 200 to client
      v
[SQS dead-letter / retry queue]  -- redrive Lambda retries with backoff
[Secrets Manager]  -- Zoho client id/secret + refresh token, Turnstile secret
[CloudWatch]  -- logs, metrics, alarm on DLQ depth > 0
```

Everything (Lambda code + API Gateway + SQS + IAM) defined as **IaC in the repo** (SAM or CDK — match whatever KB/static-assets uses) and deployed via GitHub Actions on PR merge.

## Request contract (form -> Lambda)

`POST /contact` — `Content-Type: application/json`

```jsonc
{
  "firstName": "...",        // required
  "lastName": "...",         // required
  "phone": "...",            // required (E.164 preferred)
  "company": "...",          // required
  "companyWebsite": "...",   // required -> drives getOrgByEmailDomain downstream
  "workEmail": "...",        // required, validated
  "businessClassification": "...", // required, enum (7 values)
  "employeeBand": "...",     // required, enum (5 bands)
  "identityProvider": "...", // required, enum + "Other (specify)"
  "identityProviderOther": "...", // required IFF identityProvider == "Other (specify)"
  "termsAccepted": true,     // required, must be true
  "turnstileToken": "..."    // required, Cloudflare Turnstile
}
```

## Field mapping (Lambda -> Zoho CRM Lead)

Per the captured "Auditmation Lead" layout (see `contact-us-form-field-spec-2026-06-15.md`):

| Form field | Zoho Lead field | Notes |
|---|---|---|
| firstName | `First_Name` | std |
| lastName | `Last_Name` | std (required by Zoho) |
| phone | `Phone` | std |
| company | `Company` | std (required by Zoho) |
| companyWebsite | `Company Website` (custom) | NOT the std `Website` |
| workEmail | `Email` | std |
| businessClassification | `Business_Classification` (custom) | verify API name |
| employeeBand | `Number_of_Employees` (custom) | verify API name |
| identityProvider | `Identity Provider` (custom picklist) | verify API name |
| identityProviderOther | append to `Identity Provider` value or a notes field | when "Other" |
| — (constant) | `Lead_Source` = "Contact Us / Web Form" | attribution |
| — | `Review_Status` — **NEVER SET** | preserves Chris's gate |
| — (constant) | `Lead Owner` — leave default (Chris) | do not override |

## Zoho CRM API specifics

- **Auth:** OAuth2 **refresh-token grant** (self-client / server-to-server). Store `client_id`, `client_secret`, `refresh_token` in Secrets Manager. Exchange for an access token (`https://accounts.zoho.<dc>/oauth/v2/token`), **cache it ~55 min** in Lambda memory / Parameter Store to avoid re-minting per request.
- **Create:** `POST https://www.zohoapis.<dc>/crm/v8/Leads` with `{ "data": [ {<mapped fields>} ], "trigger": [...] }`.
  - Decide whether to fire Zoho **workflow/blueprint triggers** on create (`trigger` array) — likely yes so existing Lead automations (notifications to Chris) still run.
- **Datacenter (`<dc>`):** confirm `.com` vs `.eu`/other for this Zoho org.
- **Dedup:** optionally use **upsert** (`/crm/v8/Leads/upsert` with duplicate_check_fields `Email`) so repeat submissions update rather than create dupes — Kevin said "updates CRM," so upsert-on-email may be the intended semantic. Confirm.
- **Rate limits:** Zoho per-day API credit limits; the handler is low-volume (contact form), so fine, but error-handle 429.

## Validation & security

- **Turnstile:** server-side `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with the token + secret; reject on failure (bot/spam gate that Zoho Forms used to provide).
- **Server-side validation:** all required present; `workEmail` RFC-valid; `termsAccepted === true`; enum values in allowed sets; `identityProviderOther` required when IDP == Other. Reject 400 with field errors (never trust the client).
- **CORS:** allow only the production site origin(s) (`https://zerobias.com`, plus preview origin if any).
- **No secrets in code/env-plaintext** — Secrets Manager only; least-privilege IAM (Lambda reads only its secrets + writes its SQS/logs).
- **Honeypot field** (optional, cheap second bot filter).

## Durability — never drop a lead

- On **transient Zoho failure** (5xx, 429, token error after one refresh retry): push the validated payload to an **SQS retry queue** and return 200 to the user (they shouldn't see infra failures). A redrive consumer (same Lambda or a sibling) retries with exponential backoff.
- **Idempotency:** include a client-generated submission UUID; use it as the upsert/dedup key so a retried message can't create a duplicate Lead.
- **Alarm:** CloudWatch alarm on DLQ depth > 0 and on handler error-rate so a Zoho outage is visible.
- On **validation failure** (client error): return 400, do NOT enqueue.

## Response contract (Lambda -> form)

- `200 { "ok": true }` — Lead created or safely queued. Form shows thank-you / redirect.
- `400 { "ok": false, "errors": { field: msg } }` — validation/turnstile failure. Form shows inline errors.
- `500 { "ok": false }` — only for unexpected handler crash (should be rare; transient Zoho issues go to the queue, not a 500).

## Observability

- Structured JSON logs (no PII beyond what's needed; mask on error).
- Metrics: submissions, creates, validation-rejects, turnstile-rejects, queue-enqueues, Zoho-errors.
- Alarms: DLQ depth, error rate, Zoho-auth failures.

## Open / needs input

1. **Zoho CRM API credentials** (client id/secret + refresh token) + **datacenter** — from Chris.
2. **Custom field API names** — verify `Business_Classification`, `Number_of_Employees`, and the `Identity Provider` field's exact API name (Developer Hub -> APIs -> API Names -> Leads). Clark has CRM admin.
3. **Create vs upsert** — Kevin said "updates CRM"; confirm whether repeat submissions should upsert-on-email (recommended) or always create.
4. **Fire Zoho triggers on create?** — confirm so existing Lead workflows (Chris notifications) still run.
5. **Turnstile** site+secret keys (Cloudflare) — or alternative captcha.
6. **IaC tool** — match KB/static-assets (SAM vs CDK vs Serverless Framework).
7. **Runtime** — Node.js/TS assumed (matches our stack); confirm.

## References

- task-53 (parent feature), epic task-50, DECISIONS D-55.
- `contact-us-form-field-spec-2026-06-15.md` — the field list + CRM mapping + Review Status gate.
- backlog 036 (Zoho Forms build — superseded by this owned-form path), 037 (ownership/hosting spike).
