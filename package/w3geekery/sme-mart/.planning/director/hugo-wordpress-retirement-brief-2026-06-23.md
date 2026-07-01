# Hugo / WordPress-Retirement — Project Brief

**Created:** 2026-06-23 · **Owner (UI lead):** Clark · **Status:** planning
**Decision of record:** [DECISIONS.md D-55](./DECISIONS.md) · **Spike:** [backlog 037](./backlog/037-zerobias-com-wordpress-ownership-and-form-hosting-spike.md)
**Tracking board (PROD):** UI Feature Requests (`5631d499-16cd-4767-96c2-177650d780fd`)
**Epic:** **task-50** (`b68b74d4-69bd-4868-9f63-2b7d612d725e`)

> This is a **ZB-wide marketing-infra initiative**, not SME Mart proper. Tracked here because Clark (W3Geekery) is the UI lead. To be scaffolded as a project in the new zb/ui Projects App.

---

## What & why (one paragraph)

Retire WordPress entirely across `.com`, `.org`, `.foundation`, `.labs` and rebuild ZeroBias's public web presence as **Hugo static sites on S3 + CloudFront**, git-tracked with PR-merge deploys, built AI-first. Greenlit by Brian (CEO) + Kevin (CIO) 2026-06-19. The same Hugo→CloudFront infra also serves the public anonymous catalog at catalog.zerobias.com. Current state: WordPress on WP Engine behind Cloudflare, built with Elementor Pro (content lives in MySQL, not files — git can't track the real site while Elementor is in play).

## Team silos

| Team | Members | Owns |
|---|---|---|
| **UI** | Clark, Tom | Hugo monorepo, design system, templates, content migration, CMS wiring, AI-first `CLAUDE.md`/skills, in-repo form markup, build-time fetch + static emission |
| **Backend** | Kevin, Chris, Nic, Raghu | Catalog build-time data contract + anti-scrape model (Nic), Zoho CRM Lead-create endpoint (Chris, later) |
| **DevOps** | Andrey (**not yet a PROD party** — assigned via **Kevin**) | S3/CloudFront, GitHub Actions deploy + invalidation, TLS, DNSimple cutover, scheduled rebuild trigger |

## Task tree (PROD, as of 2026-06-23)

```
task-50  EPIC — Retire WordPress -> Hugo                          [Clark]
├── task-51  Hugo shared infra (monorepo/design/skills)           [UI · Clark]
│   └── task-59  DevOps - S3/CloudFront pipeline + DNSimple        [DevOps · Kevin]   NEW
├── task-52  Git-backed CMS for marketing self-serve              [UI · Clark]
├── task-53  Contact form -> Zoho CRM   (Low; folds into task-54) [UI/Backend]
├── task-54  Migrate zerobias.com                                 [UI · Clark]
├── task-55  Migrate .org / .foundation / .labs                   [UI · Clark]
└── task-16  Public catalog — catalog.zerobias.com (linked)       [UI · Clark]
    └── task-60  Backend - Catalog data API + anti-scrape         [Backend · Nic]    NEW
```

| Code | UUID | Team | Assigned | Notes |
|---|---|---|---|---|
| task-50 | `b68b74d4-69bd-4868-9f63-2b7d612d725e` | — | Clark | Epic |
| task-51 | `cf05d231-c02a-44c9-a19f-13d4de2e62f6` | UI | Clark | Foundation — **blocks the rest** |
| task-59 | `60bc6628-82b7-471a-a3bf-c97d8ff2b378` | DevOps | Kevin | Child of task-51 |
| task-52 | `789b8fe6-bdaf-4b54-a160-083cd4b2baf9` | UI | Clark | CMS pick TBD (Decap/Sveltia vs CloudCannon/Tina) |
| task-53 | `3f259575-8d91-4154-8610-c490f0e157b0` | UI/Backend | Clark | **Low** — Zoho Forms works fine; build during task-54 |
| task-54 | `91fd26fb-5b56-4a92-b9e8-5d07b33c9f31` | UI | Clark | First domain migration |
| task-55 | `714d26ab-575d-43a7-af62-979599ba2085` | UI | Clark | 3 domains, one ticket; split later |
| task-16 | `cdeedcda-aede-480b-873f-968c01e8fe4e` | UI | Clark | Linked to epic, not a parentId child (re-parent in UI if supported) |
| task-60 | `32d73d9e-1fc0-4c88-868e-60257d655d64` | Backend | Nic | Child of task-16 |

## Dependencies / sequencing

- **task-51 + task-59 first** — repo + pipeline are the foundation everything else rides.
- **task-54** (proves the full path on the first real domain) → **task-55** (remaining domains).
- **task-16 + task-60** can run parallel once the pipeline exists; task-60 (backend data) gates the catalog build.
- **task-53** last / folded into task-54.

## Open questions (non-blocking — owners decide as they go)

- CMS pick (task-52): Decap/Sveltia (free, GitHub-native) vs CloudCannon/TinaCMS (visual, paid). If Decap+GitHub → a small OAuth proxy is needed (backend/devops micro-task, not yet created).
- Design reference site from Joey/Brian (Kevin: prefer "a site I like" over a theme).
- Catalog teaser/anti-scrape threshold (task-60, Nic's call).
- DNS = **DNSimple** (Kevin); Cloudflare is only the current CDN in front of WP Engine.

## Constraints / gotchas

- **Andrey is not a PROD Party** — DevOps tasks assigned to Kevin to route until Andrey is onboarded.
- **`Task.update` has no `parentId`** — parent is create-time only. task-16 stays linked-not-nested to the epic; task-53 stays under the epic (re-create if true nesting is ever needed).
- Reuse the existing **KB/static-assets** S3+CloudFront + GitHub Actions pattern; CloudFront invalidation precedent in `UAT_CLOUDFRONT_CACHE_INVALIDATION.md`.

## For ui-meta-director (zb/ui Projects App scaffolding)

Scaffold a project mirroring the tree above: epic task-50 with children task-51 (→ task-59), task-52, task-53, task-54, task-55, and task-16 (→ task-60). Three workstreams/silos: **UI**, **Backend**, **DevOps**. Foundation-first ordering (task-51/59 → task-54 → task-55; task-16/60 parallel after pipeline). Source of truth for status remains the PROD UI Feature Requests board; this brief is the planning mirror.
