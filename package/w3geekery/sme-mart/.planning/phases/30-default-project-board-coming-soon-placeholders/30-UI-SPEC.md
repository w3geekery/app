---
phase: 30
title: "Default Project Board + Coming Soon Placeholders"
status: draft
design_contract: ../../design/DESIGN.md
stitch_prompts: stitch-prompts.md
mocks_dir: mocks/
requirements:
  - PB-01
  - PB-02
  - PB-03
  - PB-04
  - PB-06
  - PB-07
date_created: "2026-05-12"
---

# UI Design Contract — Phase 30: Default Project Board + Coming Soon Placeholders

## Overview

Phase 30 delivers a **default project board** view at `/projects` for authenticated, onboarded ZeroBias users arriving from the ZB portal. The surface renders:

1. **Engagement Header** — locked verbiage from D-32/D-33 (engagement name + description).
2. **Project Tier Body** — locked verbiage from D-34/D-35 (Project tier name + description).
3. **Three "Coming Soon" Placeholder Cards** — Org Documents (046), Engagement Dashboard (066), Message Center (065) in a Material grid.
4. **Defensive Empty State** — inline `ZbEmptyStateContainerComponent` if the Project tier is missing.

**Phase 30 is NOT:** a signup flow, a Tasks/Board UI, a tier display, or a multi-engagement switcher. SME Mart never authenticates users — they arrive with a pre-existing ZeroBias session.

---

## Design Decisions (Director-Locked)

| Decision | Option | Rationale |
|----------|--------|-----------|
| **G1: Default Surface Composition** | Lightweight new `default-project-board.component.ts`; NO ProjectDetail reuse | Minimizes blast radius. `ProjectDetail` stays the rich workspace at `/project/:projId/*`. Dashboard is a separate home view. |
| **G2: Discovery Helpers** | Both in `engagements.service.ts` — `getDefaultEngagement(orgId)` + `getProjectTierProject(engagementId)` | Reuses dual-read pattern. Helpers small (~20–40 lines each). Tag constant hoisted to `src/app/core/constants/tier-tags.ts`. |
| **G3: Rich Coming Soon** | NEW `feature-coming-soon.component.ts` co-located with board. Existing thin `ComingSoon` untouched. | Separates concerns. Existing stub stays for non-feature routes (catalog, request-assistance, feedback). |
| **G4: Navigation Pattern** | Material `mat-card` × 3 grid on dashboard. Each card links to a placeholder route. | Clean, visual. Deep-link parity required (direct URLs render the same placeholder). |
| **G5: Defensive UX** | Inline `ZbEmptyStateContainerComponent` if Project tier missing. No auto-reprovision. No crash. | Phase 31 owns auto-reprovision. Phase 30 surfaces the error state transparently. |
| **G6: Stop-the-Line** | ~150-line ceiling for new board template/class. Stop and escalate if exceeds budget. | Prevents silent expansion into a ~400-line component (Discovery Flag #3 risk). |
| **G7: Verification Scope** | D-32..D-35 verbiage checks ONLY as Phase 30 exit criterion. Plan 06 UI cross-checks deferred. | Phase 31 (dogfooding) exercises broader coverage. |

---

## Screen Inventory

| Screen | Route | Purpose | Mock File |
|--------|-------|---------|-----------|
| **S1** | `/projects` | Default project board (populated state): engagement header + project body + 3 coming-soon cards | `s1-default-project-board.png` |
| **S2** | `/projects` | Default project board (error: missing project tier): inline empty state | `s2-default-project-board-error.png` |
| **S3** | `/org-documents` | Feature coming soon placeholder (Org Documents — 046) | `s3-org-documents-coming-soon.png` |

---

## Design Contract — Tokens & Spacing

### Theme Awareness Directive (NON-NEGOTIABLE)

**Hex values in this spec are visual reference only — for cross-checking against mocks and against DESIGN.md.** Implementation MUST bind to CSS custom properties so the UI swaps cleanly when `ZbThemeService` flips the theme (light/dark/custom) at runtime.

**Rule (carried forward verbatim from DESIGN.md line 274):** *"Do not hard-code hex values in components — read `--zb-*` / `--mat-sys-*` custom properties or the tokens above."*

**How to apply in this phase:**

- Component SCSS uses `var(--mat-sys-primary)` etc., NEVER `#00658d` literals.
- If a component template inlines a style (avoid where possible), it uses the var form too.
- The `feature-coming-soon` component, the `default-project-board` component, and the empty-state inline styling all bind through variables.
- Material 3 components (`mat-card`, `mat-button`, `mat-icon`, `mat-progress-spinner`) auto-resolve via `--mat-sys-*` from `mat.theme()` — don't override their tokens.
- ngx-library primitives (`ZbEmptyStateContainerComponent`) consume `--zb-*` internally — don't restyle from the outside.
- Status-chip-style hex values (e.g., `#d7e0ee` "in-progress") are NOT used in Phase 30 (no status surfaces here), so no exception is needed.

**Where hex IS allowed in this phase's deliverables:**
- The Stitch prompts (mockup generation only — Stitch doesn't speak CSS variables)
- This spec document, as visual reference next to the variable name
- DESIGN.md itself (canonical hex-to-tone-40 reference)

**Anti-pattern (block at code review):**
- `color: #00658d` or `background: #f5faff` in any `*.component.scss`
- Sass variables like `$primary: #00658d` declared at component scope — those defeat theme switching
- Inline `style="color: #..."` in templates

### Colors (from DESIGN.md)

| Token | Hex (reference) | CSS variable (implementation) | Usage in Phase 30 |
|---|---|---|---|
| Primary | `#00658d` | `var(--mat-sys-primary)` | Primary CTAs, links ("Manage profile", "Back to projects"), card icons, focus rings |
| On-Primary | `#ffffff` | `var(--mat-sys-on-primary)` | Text on filled primary buttons |
| Primary Container | `#c6e7ff` | `var(--mat-sys-primary-container)` | Card hover background |
| On-Primary Container | `#001e2d` | `var(--mat-sys-on-primary-container)` | Text on primary-container hover state |
| On-Surface | `#171c20` | `var(--mat-sys-on-surface)` | Body text (engagement + project descriptions, card teasers) |
| On-Surface Variant | `#404b52` | `var(--mat-sys-on-surface-variant)` | Secondary text (timestamps, helper text — minimal in Phase 30) |
| Surface | `#f5faff` | `var(--mat-sys-surface)` | Page background, S1 outer surface |
| Surface Container | `#dee3e8` | `var(--mat-sys-surface-container)` | Project tier body raised background |
| Outline | `#556068` | `var(--mat-sys-outline)` | Dividers, form-field borders |
| Outline Variant | `#bdc8d1` | `var(--mat-sys-outline-variant)` | Subtle separators (card borders if any) |
| Error | `#ba1a1a` | `var(--mat-sys-error)` | Destructive only — not exercised in Phase 30 |
| Tertiary | `#316b19` | `var(--mat-sys-tertiary)` | Affirmative-only — not exercised in Phase 30 |

### Typography (from DESIGN.md)

| Scale | Font | Size | Weight | Line Height | Usage |
|-------|------|------|--------|-------------|-------|
| **h1** | Roboto | 2rem (32px) | 500 | 1.25 | Engagement name (header title) |
| **h2** | Roboto | 1.5rem (24px) | 500 | 1.3 | Project tier name |
| **h3** | Roboto | 1.25rem (20px) | 500 | 1.35 | Card titles ("Org Documents — Coming Soon") |
| **body-md** | Roboto | 0.875rem (14px) | 400 | 1.5 | Engagement description, Project description, card teasers |
| **label** | Roboto | 0.875rem (14px) | 500 | 1.25 | Form labels, chip text |
| **button** | Roboto | 0.875rem (14px) | 500 | 1 | Button copy |

### Spacing (from DESIGN.md)

- **xs:** 4px
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px

**Layout rhythm:**
- Page padding: `md` (16px) per side
- Major section gap: `lg` (24px)
- Card padding: `md` (16px)
- Button padding: 10px 20px (Material standard)

### Rounded Corners (from DESIGN.md)

- **Card / Panel:** `md` (8px)
- **Button:** `full` (9999px) — pill shape
- **Input:** `sm` (4px)

---

## Screen: S1 — Default Project Board (Populated)

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Page Frame (md padding on sides)                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ENGAGEMENT HEADER (bg: surface)                    │
│  ┌────────────────────────────────────────────────┐ │
│  │ h1: "W3Geekery <- ZeroBias"                   │ │
│  │ body-md: "Platform Services Engagement:      │ │
│  │           ZeroBias ➡️ W3Geekery"             │ │
│  └────────────────────────────────────────────────┘ │
│  Gap: lg (24px)                                     │
│                                                     │
│  PROJECT TIER BODY (bg: surface)                    │
│  ┌────────────────────────────────────────────────┐ │
│  │ h2: "ZeroBias Platform"                       │ │
│  │ body-md: "W3Geekery's gateway into ZeroBias—  │ │
│  │           explore your marketplace profile   │ │
│  │           ➡️ Manage profile" [link]"          │ │
│  │ (optional) Small "Open project workspace"    │ │
│  │           link to `/project/:projId/overview"│ │
│  └────────────────────────────────────────────────┘ │
│  Gap: lg (24px)                                     │
│                                                     │
│  COMING SOON CARDS GRID (3 columns, responsive)    │
│  ┌────────────┬──────────────┬──────────────┐      │
│  │ mat-card   │  mat-card    │  mat-card    │      │
│  │ [schedule] │  [schedule]  │  [schedule]  │      │
│  │ Org Docs   │  Engagement  │  Message     │      │
│  │ Coming Soon│  Dashboard   │  Center      │      │
│  │            │  Coming Soon │  Coming Soon │      │
│  └────────────┴──────────────┴──────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
DefaultProjectBoardComponent
├── engagement-header
│   ├── h1: engagement.name
│   ├── body-md: engagement.description
├── project-tier-body
│   ├── h2: project.name
│   ├── body-md: project.description
│   ├── [optional] "Open project workspace" link
├── coming-soon-grid
│   ├── mat-card (route: /org-documents)
│   │   ├── mat-icon: "schedule"
│   │   ├── h3: "Org Documents — Coming Soon"
│   │   ├── body-md: 1-line teaser
│   ├── mat-card (route: /engagement-dashboard)
│   │   ├── mat-icon: "schedule"
│   │   ├── h3: "Engagement Dashboard — Coming Soon"
│   │   ├── body-md: 1-line teaser
│   ├── mat-card (route: /message-center)
│   │   ├── mat-icon: "schedule"
│   │   ├── h3: "Message Center — Coming Soon"
│   │   ├── body-md: 1-line teaser
```

### Copy

**Engagement Header (D-32 & D-33 — VERBATIM, NO REFORMATTING):**
- **Name:** `"W3Geekery <- ZeroBias"` (ASCII reverse-arrow `<-`, no Unicode substitution)
- **Description:** `"Platform Services Engagement: ZeroBias ➡️ W3Geekery"` (includes the `➡️` emoji)

**Project Tier Body (D-34 & D-35 — VERBATIM, ORG NAME INTERPOLATED):**
- **Name:** `"ZeroBias Platform"` (literal constant)
- **Description:** (from D-35, org-name-interpolated) `"W3Geekery's gateway into ZeroBias — explore your marketplace profile ➡️ Manage profile"` (with "Manage profile" as a clickable link)

**Coming Soon Card — Org Documents (046):**
- **Title:** `"Org Documents — Coming Soon"`
- **Description (teaser):** `"Centralized document management for your organization."` (1 line max)

**Coming Soon Card — Engagement Dashboard (066):**
- **Title:** `"Engagement Dashboard — Coming Soon"`
- **Description (teaser):** `"Aggregated metrics and progress across all engagements."` (1 line max)

**Coming Soon Card — Message Center (065):**
- **Title:** `"Message Center — Coming Soon"`
- **Description (teaser):** `"Cross-party messaging across all your engagements."` (1 line max)

### Styling Details

**Engagement Header Panel:**
- Background: `surface` (`#f5faff`)
- Border radius: `md` (8px)
- Padding: `md` (16px) all sides
- Title (h1) color: `on-surface` (`#171c20`)
- Description (body-md) color: `on-surface` (`#171c20`)

**Project Tier Body Panel:**
- Background: `surface-container` (`#dee3e8`)
- Border radius: `md` (8px)
- Padding: `md` (16px) all sides
- Title (h2) color: `on-surface` (`#171c20`)
- Description (body-md) color: `on-surface` (`#171c20`)
- Optional "Open workspace" link color: `primary` (`#00658d`)

**Coming Soon Cards Grid:**
- Layout: CSS Grid, 3 columns, gap `md` (16px)
- Responsive breakpoints: 3 cols on desktop (>1024px), 2 cols on tablet (640–1024px), 1 col on mobile (<640px)
- Card background: `surface` (`#f5faff`)
- Card border: 1px `outline-variant` (`#bdc8d1`)
- Card border radius: `md` (8px)
- Card padding: `md` (16px)
- Card hover state: background shifts to `primary-container` (`#c6e7ff`), cursor `pointer`
- Icon (Material `schedule`): color `primary` (`#00658d`), size 24px, margin-bottom `sm` (8px)
- Card title (h3): color `on-surface` (`#171c20`)
- Card teaser (body-md): color `on-surface-variant` (`#404b52`), margin-top `sm` (8px)

---

## Screen: S2 — Default Project Board (Error: Missing Project Tier)

### Layout Structure

If `getProjectTierProject(engagementId)` returns `null` (Project tier missing for an engagement that exists):

```
┌─────────────────────────────────────────────────────┐
│  Page Frame (md padding on sides)                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ENGAGEMENT HEADER (bg: surface) [as S1]            │
│  ┌────────────────────────────────────────────────┐ │
│  │ h1: "W3Geekery <- ZeroBias"                   │ │
│  │ body-md: "Platform Services Engagement:      │ │
│  │           ZeroBias ➡️ W3Geekery"             │ │
│  └────────────────────────────────────────────────┘ │
│  Gap: lg (24px)                                     │
│                                                     │
│  EMPTY STATE (inline, centered)                     │
│  ┌────────────────────────────────────────────────┐ │
│  │  <zb-empty-state-container>                  │ │
│  │                                                │ │
│  │    [icon: warning or info]                   │ │
│  │                                                │ │
│  │    "Project tier not yet provisioned.        │ │
│  │     Please contact support."                 │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Copy (G5 lock):**
- **Title/Message:** `"Project tier not yet provisioned. Please contact support."`

**Logging (G5 lock):**
- `console.warn('[DEFAULT_PROJECT_BOARD:MISSING_PROJECT_TIER]', { orgId, engagementId })`

**No auto-action; no crash; no infinite spinner; no redirect.** Component reaches a stable error state.

---

## Screen: S3 — Feature Coming Soon (Org Documents Placeholder)

### Layout Structure

Route: `/org-documents` (also `/engagement-dashboard` and `/message-center` with different title/description)

```
┌─────────────────────────────────────────────────────┐
│  Page Frame (md padding on sides)                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  COMING SOON FULL VIEW (centered)                   │
│  ┌────────────────────────────────────────────────┐ │
│  │                                                │ │
│  │  <zb-empty-state-container>                  │ │
│  │                                                │ │
│  │    [icon: hourglass_empty or schedule]       │ │
│  │                                                │ │
│  │    h3: "Org Documents — Coming Soon"        │ │
│  │                                                │ │
│  │    body-md: "Centralized document            │ │
│  │             management and sharing for your  │ │
│  │             organization is on the roadmap.  │ │
│  │             Once available, you'll be able   │ │
│  │             to upload, organize, and share   │ │
│  │             documents across engagements."   │ │
│  │                                                │ │
│  │    [optional button]                          │ │
│  │    "Notify me when ready" (toast on click)   │ │
│  │                                                │ │
│  │    [link] "← Back to projects"                │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Component: FeatureComingSoonComponent

**Inputs (signal-based `input()`):**
- `title: InputSignal<string>` — e.g., `"Org Documents — Coming Soon"`
- `description: InputSignal<string>` — full body text (1–2 sentences)
- `featureKey: InputSignal<string | undefined>` — optional, reserved for future analytics (no v1.4 behavior)

**Routes (route-data binding):**

Three sibling routes under AppShell guarded children array:

```typescript
{
  path: 'org-documents',
  component: FeatureComingSoonComponent,
  data: {
    title: 'Org Documents — Coming Soon',
    description: 'Centralized document management and sharing for your organization is on the roadmap. Once available, you\'ll be able to upload, organize, and share documents across engagements.',
    featureKey: '046',
  },
},
{
  path: 'engagement-dashboard',
  component: FeatureComingSoonComponent,
  data: {
    title: 'Engagement Dashboard — Coming Soon',
    description: 'Aggregated metrics and progress views across all your engagements are coming soon. You\'ll see status, milestones, and key activity at a glance.',
    featureKey: '066',
  },
},
{
  path: 'message-center',
  component: FeatureComingSoonComponent,
  data: {
    title: 'Message Center — Coming Soon',
    description: 'Cross-party messaging across all your engagements is coming soon. Today, conversations live within individual engagements.',
    featureKey: '065',
  },
},
```

**Styling:**
- Background: `surface` (`#f5faff`)
- `<zb-empty-state-container>` centers the icon + title + description
- Icon color: `primary` (`#00658d`)
- Title (h3) color: `on-surface` (`#171c20`)
- Description (body-md) color: `on-surface-variant` (`#404b52`)

**Optional "Notify me" Button (if implemented):**
- Click → `MatSnackBar.open('We\'ll let you know when this is ready', 'Dismiss', { duration: 5000 })`
- NO Pipeline.receive write, NO tag-write, NO server call, NO analytics — toast-only
- Button style: secondary (stroked, `primary` color)

**"Back to projects" Link:**
- `routerLink="/projects"`
- Text color: `primary` (`#00658d`)
- Margin-top: `lg` (24px)

---

## Component Inventory

| Component | Location | Inputs | Outputs | Primitive / Custom |
|-----------|----------|--------|---------|-------------------|
| **DefaultProjectBoardComponent** | `src/app/default-project-board/default-project-board.component.ts` | `engagement: Signal`, `projectTier: Signal`, `loading: Signal`, `error: Signal` | N/A (routing, no data out) | Custom — NEW |
| **FeatureComingSoonComponent** | `src/app/default-project-board/feature-coming-soon.component.ts` | `title: InputSignal<string>`, `description: InputSignal<string>`, `featureKey: InputSignal<string \| undefined>` | N/A (routing) | Custom — NEW |
| **Engagement Header** | Inline in DefaultProjectBoard | Renders `engagement.name`, `engagement.description` | N/A | Inline markup |
| **Project Tier Body** | Inline in DefaultProjectBoard | Renders `projectTier.name`, `projectTier.description` | N/A | Inline markup |
| **Coming Soon Card Grid** | Inline in DefaultProjectBoard | Routes to 3 placeholders | routerLink navigation | Material `mat-card` |
| **ZbEmptyStateContainerComponent** | `@zerobias-org/ngx-library` | Content (slot) | N/A | ngx-library primitive |
| **MatSnackBar** | `@angular/material/snack-bar` | Message, action, config | N/A (service-driven) | Material service |

---

## Routes

### Phase 27 Reserved Slot (to be replaced in Phase 30)

**Current (Phase 27/28):**
```typescript
{ path: 'projects', component: ComingSoon, data: { title: 'Projects' } }
```

**Phase 30 Change:**
```typescript
{ path: 'projects', component: DefaultProjectBoardComponent }
```

(Or lazy-loaded variant if the board pulls in non-trivial sub-components; plan author's call.)

### Three Coming Soon Placeholder Routes

Add as siblings of `/projects` inside the same AppShell guarded children array:

```typescript
{
  path: 'org-documents',
  component: FeatureComingSoonComponent,
  data: { ... },
},
{
  path: 'engagement-dashboard',
  component: FeatureComingSoonComponent,
  data: { ... },
},
{
  path: 'message-center',
  component: FeatureComingSoonComponent,
  data: { ... },
},
```

All three routes are **deep-linkable** (direct URL renders the placeholder with matching title + description).

---

## Interactions

### S1: Coming Soon Card Click

- Card hover state: background → `primary-container` (`#c6e7ff`), cursor → `pointer`
- Card click → navigate via `routerLink` to `/org-documents`, `/engagement-dashboard`, or `/message-center`
- Navigation happens within AppShell (same layout, new route component)

### S3: Notify Me Button (Optional)

- Click → `MatSnackBar.open('We\'ll let you know when this is ready', 'Dismiss', { duration: 5000 })`
- Dismiss button or auto-close after 5s
- NO Network activity

### S3: Back to Projects Link

- Click → `routerLink="/projects"` navigates back to S1

---

## States & Error Handling

### Loading State (S1)

While discovering engagement + project tier:
- Display: centered `<mat-progress-spinner></mat-progress-spinner>`
- Spinner color: `primary` (`#00658d`)

### Error: Network Failure (S1)

If `getDefaultEngagement` or `getProjectTierProject` throws (network/SDK error, not a `null` miss):
- Toast: `MatSnackBar.open('Failed to load default project — please retry', 'Dismiss', { duration: 5000 })`
- Log: `console.warn('[DEFAULT_PROJECT_BOARD:LOAD_FAILURE]', { stage: 'engagement' | 'project-tier', error })`
- Component state: recoverable (retry button optional)

### Error: Missing Default Engagement (S2 variant)

If `getDefaultEngagement(orgId)` returns `null`:
- Render inline `<zb-empty-state-container>` with copy: `"Default engagement is missing. Please contact support."`
- Log: `console.warn('[DEFAULT_PROJECT_BOARD:MISSING_DEFAULT_ENGAGEMENT]', { orgId })`

### Error: Missing Project Tier (S2)

If `getDefaultEngagement` succeeds but `getProjectTierProject` returns `null`:
- Render inline `<zb-empty-state-container>` with copy: `"Project tier not yet provisioned. Please contact support."`
- Log: `console.warn('[DEFAULT_PROJECT_BOARD:MISSING_PROJECT_TIER]', { orgId, engagementId })`

---

## Accessibility

- All interactive elements (card clicks, links, buttons) are keyboard-accessible (`Tab`, `Enter`)
- Card titles are semantic `<h3>` (not divs with large font)
- Section headings (h1, h2) are semantic heading tags
- Icons have `aria-label` or are purely decorative with `aria-hidden="true"`
- `MatSnackBar` messages are announced to screen readers
- Empty state container uses `ZbEmptyStateContainerComponent` semantic slot content

---

## Testing Requirements

### Unit Tests

1. **DefaultProjectBoardComponent.spec.ts:**
   - Renders engagement header (D-32 verbatim) + project tier body (D-34 verbatim)
   - Renders 3 coming-soon cards with correct titles + teasers
   - Navigation `routerLink` resolves to correct placeholder routes
   - Handles missing Project tier: renders inline empty state
   - Handles missing default engagement: renders inline empty state
   - Handles network error: displays snackbar + console.warn logged

2. **FeatureComingSoonComponent.spec.ts:**
   - Renders `title` + `description` from inputs
   - Optional "Notify me" button emits `MatSnackBar.open` on click with exact copy
   - "Back to projects" link `routerLink` resolves to `/projects`
   - Reads route-data on init (if using `ActivatedRoute.snapshot.data`)

3. **engagements.service.spec.ts (extend existing):**
   - `getDefaultEngagement(orgId)` returns engagement with identity tag match
   - `getDefaultEngagement(orgId)` returns `null` if no match found
   - `getDefaultEngagement` dual-namespace recognition (`sme-mart.engagement.*` AND `sme-mart.eng.*`)
   - `getProjectTierProject(engagementId)` returns Project with tag = `SME_MART_TIER_PROJECT_TAG_ID`
   - `getProjectTierProject(engagementId)` returns `null` if no Project-tier child found

---

## UAT Verification (G7 Lock — Exit Criterion)

**Environment:** UAT (`uat.zerobias.com/sme-mart/projects`)  
**User:** Clark @ W3Geekery  
**Session:** Valid ZB session inherited from W3Geekery branded login

1. **Engagement Header Rendering (D-32/D-33):**
   - Engagement name renders **verbatim** as `"W3Geekery <- ZeroBias"` (ASCII reverse-arrow, no Unicode substitution, no reformatting)
   - Engagement description renders **verbatim** as `"Platform Services Engagement: ZeroBias ➡️ W3Geekery"` (includes `➡️` emoji)

2. **Project Tier Rendering (D-34/D-35):**
   - Project name renders **verbatim** as `"ZeroBias Platform"` (literal constant)
   - Project description renders **verbatim** per D-35 (org-name-interpolated, includes ➡️)

3. **Coming Soon Cards:**
   - Card 1 title: `"Org Documents — Coming Soon"`
   - Card 2 title: `"Engagement Dashboard — Coming Soon"`
   - Card 3 title: `"Message Center — Coming Soon"`
   - Click each card; each renders the `FeatureComingSoonComponent` with matching title + locked description

4. **Deep-Link Parity:**
   - Direct URL `/org-documents` renders Org Documents placeholder
   - Direct URL `/engagement-dashboard` renders Engagement Dashboard placeholder
   - Direct URL `/message-center` renders Message Center placeholder
   - Each placeholder renders the same content as reached via card navigation

5. **Error States (if applicable during test):**
   - Missing Project tier → inline empty state renders verbatim copy
   - Network failure → snackbar appears with "Failed to load..." message

---

## Stitch Drift Notes

**S1 — Default Project Board (Populated State)**

Generated mock shows:
- Engagement header "W3Geekery <- ZeroBias" (h1, correct scale and color #171c20 on #f5faff surface)
- Engagement description "Platform Services Engagement: ZeroBias ➡️ W3Geekery" (body-md, correct scale)
- Project tier body "ZeroBias Platform" (h2, on #dee3e8 surface-container background — correctly rendered as raised surface)
- Project tier description with "Manage profile" link (body-md, #00658d primary blue link)
- Three coming-soon cards in a grid layout with schedule icons (#00658d), titles (h3), and teasers (body-md, #404b52 on-surface-variant)
- Card borders and spacing match spec (8px radius, 16px padding, 16px gaps between cards)

**Drift observed:** Stitch auto-generated an additional "Advanced Enterprise Resource Planning" card below the three specified cards — this is ideation drift (Stitch sometimes adds plausible extra content). Implementation will use ONLY the three specified routes (Org Documents, Engagement Dashboard, Message Center). Card shadows render slightly softer in Stitch vs. Material's elevation system — acceptable ideation variance; implementation uses actual `mat-card` component with proper Material Design elevation.

**S2 — Default Project Board (Missing Project Tier)**

Generated mock shows:
- Engagement header "W3Geekery <- ZeroBias" + description (identical to S1, correct)
- Centered error container with warning icon (#00658d, 48px)
- Message text "Project tier not yet provisioned. Please contact support." (body-md, #171c20, centered)
- Container background #f5faff (surface), border 1px #bdc8d1 (outline-variant), border-radius 8px

**Drift observed:** Stitch added a "Contact Support" button below the error message (as a helpful affordance). The spec marks the button as optional/plan-author's call. Implementation can choose to include or omit the button; the fixed message copy is what matters. The vertical centering and spacing match the spec.

**S3 — Feature Coming Soon (Org Documents)**

Generated mock shows:
- Full-page view, vertically centered
- Hourglass/schedule icon (#00658d, 48px)
- Title "Org Documents — Coming Soon" (h3, #171c20)
- Description text (body-md, #171c20, centered, 2 full sentences as spec'd)
- "Notify me when ready" button (stroked, #00658d color, pill-shaped, 10px 20px padding)
- "← Back to projects" link (body-md, #00658d, underline on hover)
- Container background #f5faff (surface), border 1px #bdc8d1 (outline-variant), padding 32px (xl)

**Drift observed:** Stitch injected a left sidebar navigation panel (not in the spec — Stitch inferred the presence of a main app layout and auto-generated navigation). The sidebar is extraneous. The centered empty state content itself is accurate to spec. Implementation will render the `FeatureComingSoonComponent` standalone within the AppShell layout, which will provide its own navigation chrome; the mock's sidebar is pure Stitch ideation and should be disregarded during implementation.

---

## Approval Sign-Off

- **Design Contract:** Locked (DESIGN.md tokens verbatim)
- **Director Decisions:** Locked (A, G1–G7 verified)
- **Verbiage:** Locked (D-32, D-33, D-34, D-35 verbatim)
- **Requirements Coverage:** PB-01, PB-02, PB-03, PB-04, PB-06, PB-07 mapped
- **Status:** Ready for planning phase

---

**Phase 30 UI Design Contract**  
*Gathered 2026-05-12*  
*Director-locked gray areas verified; design tokens resolved from DESIGN.md; Stitch mocks generated for feedback*
