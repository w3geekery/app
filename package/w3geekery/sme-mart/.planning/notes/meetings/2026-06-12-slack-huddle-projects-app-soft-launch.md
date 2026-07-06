# Slack Huddle — Projects App Soft-Launch Strategy

**Date:** 2026-06-12
**Time:** 10:04 AM – 10:19 AM PT (15 min)
**Source:** Slack Huddle
**Participants:** Brian Hierholzer (CEO), Clark Stacer (contractor)

## Headline

Brian wants the **Projects app published now as a "soft / slow-rolling launch"** — the whole app visible as-if-active, with dead links for unbuilt areas, color-coded (grayed-out = not yet available, brighter = live), and dead pages opening a **screenshot** so customers/partners can visualize and walk through it. Goal: let stakeholders (incl. mission teams planning 90–120 days out) *see* the vision rather than hear it described.

## Key points

- **Validation:** Brian just off a call with someone who ran all of NSA offense + defense; came away feeling the architectural vision is on the right path. His mission teams are starting to build (logging, KSI) and want to fit into the project structures soon.
- **Already possible via API/MCP:** the project nesting (projects -> boards -> tasks) already works on **UAT via the MCP/API** — there's just no front end yet (what Clark is building). Teams could build their own UI against the API today.
- **Soft-launch ask (Brian):** publish the whole app as if active; dead links for now; color-code available vs. not; dead pages (e.g. Documents, Notes) open a screenshot on click so they can be discussed visually.
- **Clark's fallback:** clickable HTML mockups (load an HTML file, nav tabs clickable). Brian: take the real thing if feasible, screenshots-on-dead-pages otherwise; clickable > flat picture.
- **2-week MVP target (Clark):** app launched; portal home page with **Projects launcher**; **Overview / Boards / Tasks** all working ("the guts"); **Documents / Notes** MVP; **Schedule** MVP — timeline/calendar view with milestones (Kevin gave a good starting point).
- **Readiness & Requirements:** deferred — Brian says Dan's piece is too early; will tie in over the next couple weeks once the basic constructs exist. Clark may ask Dan for a screenshot mockup later.
- **Dependency / blocker:** **Chris** must finish merging the Projects navigation into the portal/platform app. Clark pings him ~daily; Chris is swamped on pipeline work.

## Action items

- **Clark:** put together a plan for the soft-launch / slow-roll (publish app as-if-active, color-coded, screenshots on dead pages).
- **Clark:** keep pushing Chris to merge Projects nav into the portal; target unblock in ~1–2 weeks.
- **Clark:** drive toward the 2-week MVP (Projects launcher + Overview/Boards/Tasks + Documents/Notes + Schedule).
- **Brian:** encourage the NSA-side stakeholder to send user stories / use cases to Clark.
- **Deferred:** Readiness / Requirements (Dan) — revisit in a couple weeks.
