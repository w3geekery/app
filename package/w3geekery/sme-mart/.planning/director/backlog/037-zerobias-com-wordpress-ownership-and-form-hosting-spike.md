---
id: "037"
priority: medium
scope: zerobias.com marketing site (devops/infra ownership) + contact-us form hosting -> decouples from sme-mart backlog 036
effort: Q1 = large (tiered: A small / B large / C very large); Q2 = small (~3-5 days)
found: 2026-06-19
status: open
promoted_to: null
related: ["036"]
---

# zerobias.com WordPress Ownership + Self-Hosted Form Spike

## Goal (one sentence)

Decide (a) how much effort it takes to "take full ownership" of the zerobias.com marketing site so ZB owns the devops/infra with git-tracked history + PR-merge deploys, and (b) whether to own JUST the contact-us **form** by self-hosting it on our AWS/static stack and pushing leads straight to the Zoho CRM API — removing Zoho Forms from the picture while leaving WordPress as-is.

This is a **scoping/decision spike, not an adoption decision.** Output = effort tiers + a recommendation + the access/discovery questions that gate a firm estimate.

---

## Current state (fingerprinted live 2026-06-19)

| Layer | What it is | Source of evidence |
|---|---|---|
| **DNS / CDN / WAF** | **Cloudflare** in front | `server: cloudflare`, `cf-ray`, `cf-cache-status` |
| **WordPress host** | **WP Engine** (managed WordPress PaaS) | `x-powered-by: WP Engine`, `x-cache`, `x-cache-group` |
| **CMS** | WordPress (REST API on, `/wp-json/`) | `link: .../wp-json/` |
| **Page builder** | **Elementor Pro** + `hello-elementor` theme + `wpb-elementor-addons` | `meta generator Elementor 4.1.3`, `/wp-content/themes/hello-elementor`, `/wp-content/plugins/elementor*` |
| **Contact form** | **Zoho Forms iframe embed**, owned by departed `evaughn` | `iframe src="https://forms.zohopublic.com/evaughn/form/CommunitySiteAccessRequest/..."` on `/contact-us/` |

**Two findings drive everything below:**

1. **The site is an Elementor site.** Elementor stores page content/design as serialized JSON blobs in the WordPress MySQL database (`wp_postmeta._elementor_data`), NOT as code files. Marketing freelancers edit visually; their changes write to the DB. **Git can version the *code* (theme, plugins, mu-plugins, wp-config) but NOT the *content* that marketing actually changes.** This is the crux of Q1.

2. **The contact form is already an iframe.** Swapping it for a self-hosted form is, mechanically, changing one iframe `src` (or one Elementor widget). This makes Q2 cheap and **decoupled from the WordPress-ownership question.**

---

## Q1 — Effort to "take full ownership" of the marketing site

**The honest framing: "full ownership" means very different things at very different costs, and Elementor is the deciding factor.** If the literal goal is *"complete history/tracking of the site in git,"* WordPress+Elementor structurally cannot deliver that without rebuilding the site — because the content lives in the DB, not in files. So separate two goals:

- **Goal X — ZB controls the infra/devops/access** (own the WP Engine + Cloudflare accounts, review code changes, have staging + rollback of code). Achievable cheaply.
- **Goal Y — complete git history of the *site itself* (content + design)** with PR-merge deploy, AWS-hosted like our KB/static-assets. Only achievable by leaving Elementor/WordPress (Tier C).

### Tier A — Code-in-git, stay on WP Engine (achieves Goal X) — *small-moderate, ~1-2 wks*
- Take over the **WP Engine account** + **Cloudflare account/zone** (access transfer — usually the long pole, see discovery Qs).
- Pull the WP install's **code** (theme, plugins, mu-plugins, `wp-config`, `composer.json` if present) into a git repo. WP Engine natively supports **Git Push deploys** + SFTP + native staging->prod environments.
- Wire **GitHub Actions -> WP Engine deploy** on PR merge (deploy keys). We already run the equivalent Actions->S3/CloudFront pattern for sme-mart + KB, so the muscle exists.
- Content/DB stays the source of truth in WP Engine; use WP Engine "copy environment" or a DB-migrate tool for staging<->prod content.
- **You get:** code review/history, plugin/theme change tracking, staging, code rollback, full infra control. **You do NOT get:** content/design version history (it's in the Elementor DB). No ongoing server ops burden (WP Engine keeps absorbing patching/security/caching/backups).

### Tier B — Self-host WordPress on AWS (Goal X, the hard way) — *large + permanent ops load, 3-6+ wks*
- Move off WP Engine to self-managed WP on AWS: **EC2/ECS (PHP compute) + RDS MySQL + EFS/S3 for media + CloudFront**.
- **Reality check on Clark's "host it like static-assets":** WordPress is NOT a static site. It's PHP + MySQL + a writable filesystem (uploads, plugin installs). It does not fit the S3+CloudFront static model the KB articles use. You'd run real compute + a managed DB + media store + a caching layer, and you'd own uptime, security patching, backups, PHP upgrades, and scaling — exactly the managed-hosting burden WP Engine exists to absorb.
- **Recommend against** unless a strategic driver exists (cost at scale, data residency, deep AWS integration). For a marketing brochure site this is usually net-negative vs managed WP. Still doesn't deliver Goal Y.

### Tier C — Rebuild marketing site as a real static site in git (achieves Goal Y) — *very large, weeks-to-months*
- The **only** path that delivers the stated goal. Stop using WordPress/Elementor for marketing; rebuild as a static-site generator (**Hugo / Astro / Next static**) whose **content IS files in git**.
- Deploys exactly like KB/static-assets: **S3 + CloudFront, GitHub Actions on merge**. Full PR history of content + design.
- Marketing freelancers edit via a **git-backed headless CMS** (Decap/Netlify CMS, TinaCMS) or markdown PRs — a workflow change for them (lose the Elementor WYSIWYG).
- Cost = migrating every page's design+content out of Elementor. Scales with page count and design fidelity. **The "Community Site Access Request" form naming hints the site may have gated/membership features** — if so, it's more than a brochure site and Tier C is materially bigger.

### Q1 bottom line
- If Clark means **"ZB should own the infra and review changes"** -> **Tier A**, cheap, do it.
- If Clark means **"complete git history of the actual site"** -> only **Tier C** delivers it, and it's a real project. Tier A + "complete history" is a contradiction while Elementor is in play — say so up front.
- **Tier B is a trap** (all the ops cost, none of the history win) — avoid unless a cost/strategy driver appears.

---

## Q2 (secondary) — Own just the FORM: self-hosted on AWS, leads -> Zoho CRM API

**Strong, cheap, and independent of Q1 — because the form is already an iframe.**

### Shape
- Stand up a **static form** on **S3 + CloudFront** (the KB/static-assets pattern we already operate) — could be a single static HTML page; doesn't even strictly need Hugo. Reuse the field spec from backlog 036 verbatim.
- Submission hits a small **serverless endpoint** (Lambda + API Gateway, or equivalent) that calls the **Zoho CRM API** to create the **Lead** directly — sets Lead Source = "Contact Us / Web Form", writes the custom fields (`Business_Classification`, `Number_of_Employees`, `Identity Provider`), and **does NOT set `Review Status`** (preserve Chris's human approval gate). **Removes Zoho Forms entirely; keeps Zoho CRM as the lead store.**
- **Git owns the form**: HTML/JS/validation + the Lambda in the repo; PR-merge deploys to S3+CloudFront (+ invalidation). Full history of the form.
- Embed by swapping the existing **iframe `src`** on the WP contact-us page (one change; needs WP admin we'd have via Chris).

### Effort: ~3-5 days
- Static form page (spec exists).
- Serverless Lead-create endpoint: Zoho CRM OAuth2 (self-client / server-to-server refresh token), create-Lead call, field mapping, **retry/queue so a failed call never silently drops a lead**.
- GitHub Actions deploy (pattern reused).
- Swap the WP iframe.

### What we take on (Zoho Forms was handling these)
- **Spam/bot mitigation** -> add **Cloudflare Turnstile** / hCaptcha.
- **Zoho CRM API integration + token rotation** (small but real ongoing surface).
- **Consent/accessibility/deliverability** reimplemented (T&C checkbox + privacy notice — already in the 036 spec).
- **Zoho CRM API rate limits + error handling.**
- Needs **Zoho CRM API credentials** from Chris.

### Q2 vs just finishing 036
- Finishing the **Zoho Forms** build (036, in progress) is **~hours**. The self-hosted form is **~a week** but **owns the form, kills the departed-`evaughn` dependency, and advances the same git-owned/PR-deployed/AWS-hosted philosophy.**
- **Recommendation:** ship the Zoho Forms version now (fast, unblocks lead capture), and treat Q2 as the **deliberate follow-on** that replaces it once we want the form in git. They're not mutually exclusive — 036 is the bridge.

---

## Discovery questions that gate a firm estimate (can't see from outside)

1. **Who owns the WP Engine account + the Cloudflare zone today?** (Access transfer is usually the long pole, not the tech.)
2. **Page count + Elementor design complexity**, and any **dynamic/membership/gated** features (the "Community Site Access" naming is a flag).
3. **Other load-bearing plugins** (membership, SEO, redirects, analytics, forms).
4. **DB size + media volume** (migration cost if AWS is ever considered).
5. **Marketing team size + git/markdown comfort** (decides Tier C feasibility).
6. **Any WP Engine cost/contract angle** (a cost driver could justify a move that the brochure-site case alone doesn't).
7. **Zoho CRM API access** available for Q2? (Chris.)

---

## Recommendation

- **Q2 first, as a follow-on to 036.** Highest leverage / lowest cost, independent of the WordPress decision, reuses our existing S3/CloudFront/Actions stack, removes the `evaughn` Zoho-Forms dependency, and gives us a git-owned form. Ship 036 (Zoho Forms) now; build the self-hosted form next when we want ownership.
- **Q1: do Tier A if the goal is control; do NOT promise "complete site history" without committing to Tier C.** Name the Elementor-DB constraint to whoever set the goal (Brian?) before any effort estimate is treated as firm. Tier B is off the table absent a cost/strategy driver.
- **Next action if pursued:** answer discovery Qs 1-3 + 7 (one conversation with Chris covers most), which converts the tier ranges into a real number.
