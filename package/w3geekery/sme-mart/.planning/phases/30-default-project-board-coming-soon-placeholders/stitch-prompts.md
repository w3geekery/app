# Stitch Design System Preamble

Material 3 light theme for SME Mart — enterprise-calm, high-contrast text, single saturated azure for primary, green reserved for affirmative.

**Palette:**
- Primary: #00658d (deep azure)
- On-Primary: #ffffff
- Secondary: #3a637c (slate)
- Tertiary: #316b19 (forest, affirmative-only)
- Error: #ba1a1a
- Background / Surface: #f5faff (limestone)
- Surface-Container: #dee3e8 (raised chrome)
- On-Surface: #171c20 (ink)
- On-Surface-Variant: #404b52
- Outline: #556068
- Outline-Variant: #bdc8d1

**Typography (Roboto only):**
- h1: 2rem (32px), weight 500, line-height 1.25
- h2: 1.5rem (24px), weight 500, line-height 1.3
- h3: 1.25rem (20px), weight 500, line-height 1.35
- body-md: 0.875rem (14px), weight 400, line-height 1.5
- label: 0.875rem (14px), weight 500, line-height 1.25
- button: 0.875rem (14px), weight 500, line-height 1, letter-spacing 0.02em

**Shapes:**
- Card/Panel border-radius: 8px
- Button border-radius: 9999px (pill)
- Input border-radius: 4px

**Spacing scale (4px units):**
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

**Component Style Rules:**
- No half-built UI — honest placeholders or complete surfaces only
- Card hover: background -> #c6e7ff (primary-container), cursor pointer
- Buttons: pill-shaped, Material standard padding (10px 20px for medium buttons)
- Status chips: fixed palette (not Phase 30 scope, reference only)
- Inputs: outlined variant, 40px height
- Empty state: centered icon + title + description via container component

---

# Screen Prompts

## S1: Default Project Board (Populated State)

**File:** s1-default-project-board.png  
**Device:** Desktop 1440x900  
**Context:** A Material 3 light dashboard / home view for authenticated marketplace users. The user has just logged in via SSO and landed at `/projects`.

**Layout & Content:**

1. **Page Frame:**
   - Background: #f5faff (surface)
   - Padding: 16px on left/right (md spacing)
   - Content max-width: ~1200px, centered

2. **Engagement Header Panel:**
   - Background: #f5faff (surface)
   - Border: 1px solid #bdc8d1 (outline-variant)
   - Border-radius: 8px
   - Padding: 16px all sides
   - Content:
     - **Title (h1, 32px, weight 500, #171c20):** "W3Geekery <- ZeroBias" (use ASCII arrow <-, NOT Unicode)
     - **Description (body-md, 14px, weight 400, #171c20):** "Platform Services Engagement: ZeroBias ➡️ W3Geekery" (use emoji ➡️)
   - Margin-bottom: 24px (lg spacing)

3. **Project Tier Body Panel:**
   - Background: #dee3e8 (surface-container, slightly raised)
   - Border-radius: 8px
   - Padding: 16px all sides
   - Content:
     - **Title (h2, 24px, weight 500, #171c20):** "ZeroBias Platform"
     - **Description (body-md, 14px, weight 400, #171c20):** "W3Geekery's gateway into ZeroBias — explore your marketplace profile ➡️ Manage profile" (with "Manage profile" as a blue clickable link, color #00658d)
   - Margin-bottom: 24px (lg spacing)

4. **Coming Soon Cards Grid:**
   - Layout: CSS Grid, 3 columns, gap 16px (md spacing)
   - Responsive: show all 3 columns on this desktop view
   - Each card:
     - Background: #f5faff (surface)
     - Border: 1px solid #bdc8d1 (outline-variant)
     - Border-radius: 8px
     - Padding: 16px all sides
     - Content layout:
       - Icon (top): Material design "schedule" icon, 24px, color #00658d
       - Margin-bottom after icon: 8px (sm spacing)
       - Title (h3, 20px, weight 500, #171c20): "Org Documents — Coming Soon" (Card 1), "Engagement Dashboard — Coming Soon" (Card 2), "Message Center — Coming Soon" (Card 3)
       - Margin-bottom after title: 8px (sm spacing)
       - Teaser (body-md, 14px, weight 400, #404b52, on-surface-variant): "Centralized document management for your organization." (Card 1), "Aggregated metrics and progress across all engagements." (Card 2), "Cross-party messaging across all your engagements." (Card 3)
     - Hover effect: background becomes #c6e7ff (primary-container), cursor pointer
     - Subtle drop shadow (Material elevation 1-2)

5. **Overall Spacing:**
   - Top padding (page): 16px
   - Bottom padding (page): 16px
   - Between sections: 24px (lg)
   - Inside card/panel: 16px (md)

**Visual Tone:** Enterprise-calm, professional, high-contrast type. Blue accent (#00658d) for primary action (links, icons). Gray surfaces for hierarchy. No decorative imagery — icon-only. Clean, minimal.

---

## S2: Default Project Board (Error: Missing Project Tier)

**File:** s2-default-project-board-error.png  
**Device:** Desktop 1440x900  
**Context:** Same user, but their organization's Project tier (depth-2) is missing (edge case / error state). The engagement header renders, but the project body and cards are replaced with an empty state.

**Layout & Content:**

1. **Page Frame:**
   - Background: #f5faff (surface)
   - Padding: 16px on left/right
   - Content max-width: ~1200px, centered

2. **Engagement Header Panel:**
   - Same as S1 (renders above the error state)
   - Margin-bottom: 24px

3. **Empty State Container (centered):**
   - Container: centered, max-width 500px
   - Background: #f5faff (surface)
   - Border-radius: 8px
   - Padding: 32px (xl spacing) all sides
   - Content:
     - **Icon (top):** Material design "warning" or "info" icon, 48px, color #00658d, margin-bottom 16px
     - **Message (body-md, 14px, weight 400, #171c20, text-align center):** "Project tier not yet provisioned. Please contact support."
   - Subtle border: 1px solid #bdc8d1 (outline-variant, optional)

4. **Overall Spacing:**
   - Top padding (page): 16px
   - Between header and empty state: 24px (lg)
   - Empty state is centered vertically within the available space

**Visual Tone:** Same enterprise-calm. Error state is stable and transparent (not a crash, not a spinner loop). Copy is friendly but clear.

---

## S3: Feature Coming Soon (Org Documents Placeholder)

**File:** s3-org-documents-coming-soon.png  
**Device:** Desktop 1440x900  
**Context:** User has navigated from the dashboard card to the Org Documents placeholder route (`/org-documents`). Full-page placeholder surface.

**Layout & Content:**

1. **Page Frame:**
   - Background: #f5faff (surface)
   - Padding: 16px on left/right
   - Vertical centering (content is vertically centered in the viewport)

2. **Empty State Container (full-screen centered):**
   - Container: centered, max-width 600px
   - Background: #f5faff (surface)
   - Border-radius: 8px
   - Padding: 32px (xl spacing) all sides
   - Content (from top to bottom):
     - **Icon:** Material design "hourglass_empty" or "schedule" icon (match S1 choice), 48px, color #00658d, margin-bottom 16px
     - **Title (h3, 20px, weight 500, #171c20, text-align center):** "Org Documents — Coming Soon"
     - **Description (body-md, 14px, weight 400, #171c20, text-align center, max-width 500px, margin-top 8px):** "Centralized document management and sharing for your organization is on the roadmap. Once available, you'll be able to upload, organize, and share documents across engagements."
     - **Optional "Notify me" Button (if shown):**
       - Style: stroked (outline) button, color #00658d, background transparent
       - Text: "Notify me when ready"
       - Padding: 10px 20px
       - Border-radius: 9999px (pill)
       - Margin-top: 24px (lg)
       - Hover: background #c6e7ff, cursor pointer
     - **"Back to projects" Link:**
       - Text: "← Back to projects" (with left arrow)
       - Color: #00658d (primary)
       - Underline: none by default, underline on hover
       - Margin-top: 24px (lg)
       - Cursor: pointer

3. **Overall Spacing:**
   - Vertical centering: content is roughly centered in the 1440x900 viewport
   - Horizontal centering: container is centered
   - Internal spacing: 8px between icon and title, 8px between title and description, 24px before button, 24px before back link

**Visual Tone:** Honest placeholder. Not a half-built functional UI — the icon, title, and description communicate clearly that this is a future feature. The button and back link are optional v1.4 additions; if not shown, description alone is sufficient. No animation or loading spinner.

---

# Generation Notes

- All hex values are Material 3 resolved tones (source palette: primary #03aff0, tertiary #6aa84f; output at tone-40 level via mat.theme()).
- Typography uses Roboto font family with standard system font fallbacks.
- Icons are Material Design system icons (Google Fonts Material Icons).
- Spacing strictly adheres to the 4px grid (xs 4, sm 8, md 16, lg 24, xl 32).
- No custom CSS — all styling maps to Material 3 / Material Design defaults.
- Responsive breakpoints: for mocks, focus on desktop (1440x900). Tablet/mobile variants can be addressed in implementation review.
- Cards use Material elevation 1–2 (subtle drop shadow); no harsh borders.
- Hover states are indicated but may render subtly in static mocks — implementation will use actual CSS hover pseudo-classes.
