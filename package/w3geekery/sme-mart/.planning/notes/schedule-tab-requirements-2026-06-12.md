# Schedule Tab — Requirements (input capture for planning)

**Author:** Director Parks (capturing Clark's input) · **Date:** 2026-06-12 · **Status:** INPUT CAPTURE — feeds plan-phase when we build the Schedule page for real
**Source:** Clark, post-Kevin input (2026-06-12 huddle + follow-up). A Schedule **mockup is pending** (Kevin gave a starting point; Clark to produce the mock shortly).
**Part of:** Projects-App soft-launch (Phase C — MVP features that light up dead tabs). Schedule is one of the 2-week MVP targets.
**Related:** `.claude/proposals/002-schedule-sync-pm-integration.md` (external-PM-sync proposal — DIFFERENT scope: syncing with external PM tools; THIS doc is the in-app Schedule tab widget) · `.planning/docs/RDF-COMPASS.md` (C-1..C-5 shape constraints) · ngx-library `ZbRemoteTableComponent`.

---

## 1. What it is

A **Schedule** tab on a Project (`projects-app` tab strip: Overview · Readiness · Requirements · Boards · Tasks · Documents · Notes · **Schedule**). Shows time-anchored items for the project (milestones and other trackable project activity) in **multiple view modes** over a single shared data source. This is the in-app scheduling/timeline widget, not external-PM sync.

**Guiding principle:** define a **generic "schedule item" data shape** that many UI widgets can ingest, and a UI widget library that can render that shape multiple ways. The Schedule tab is the first consumer; the data shape and components should be reusable across the app (and ideally the platform widget library).

---

## 2. Data source

- **Newer search + options endpoint** (the search endpoint that returns filter *options* alongside results) — so it drives **`ZbRemoteTableComponent`** (remote-table) directly.
- All view modes (timeline, calendar) are **filtered via the search endpoint's filter options** — one query surface, multiple renderings.
- **Backend is greenfield / TBD.** We define the data shape we want via **backend feature requests** (track in `.planning/docs/BACKEND_FEATURE_REQUESTS.md`). Leverage existing infra where possible.
  - Open idea: schedule data could be **fed from Task Boards of type Calendar/Timeline** — i.e. a board "type" whose contents project onto the schedule. Let backend decide whether this is the source or a separate store.

---

## 3. View modes

Built on / extending remote-table. Two views beyond the default table:

### 3a. Timeline view
- A **simple list-like view**, similar to the current **Overview "Recent Activity" mockup list**.
- ~**2-3 columns**.
- May be achievable as just an **SCSS style set applied to the `mat-table`** (remote-table) rather than a separate component — evaluate during planning.

### 3b. Calendar view
- Standard **wall-calendar boxes**, each schedule item rendered in its respective **calendar day box**.
- **Daily / weekly / monthly** sub-views (a button-set toggle).
- Fully filterable via the same search endpoint filter options.

### Mockup intent (Kevin's starting point; mock pending)
- Default to **monthly** calendar view.
- **Button-set** for daily / weekly / monthly.
- **Search** input.
- **Filter icon** that opens a filtering dialog — pattern parallel to the **Tasks tab filter** (the funnel icon → filter dialog seen on the Tasks panel).

---

## 4. Schedule-item data shape (to be defined via feature request)

Greenfield — the data shape is the deliverable to nail down with backend. Design intent:

- **One shared "schedule item" shape** consumed by many widgets (Schedule tab today; other timeline/calendar widgets later).
- A **user-extendable enum of item "types"** — the kinds of things that land on a project's schedule/timeline. Seed set (illustrative, not final):
  - **project milestone**
  - **task**
  - **finding**
  - **evidence**
  - **file**
  - **note**
  - ...i.e. *everything about the Project that needs to be tracked* — project-management activity types **and** transparent-compliance activity types.
- The type set should follow the **RDF Compass** (`.planning/docs/RDF-COMPASS.md`) so schedule items fit the long-term OWL/SHACL/RDF audit-trail container (C-1..C-5). Each schedule item is a trackable project event with a type, a time anchor, and a link back to its source entity (milestone / task / finding / evidence / file / note).
- Implementation (table vs derived projection vs board-fed) — **let backend decide**; we specify the shape and the query surface, not the storage.

**Minimum fields the UI needs** (to confirm in the feature request):
- stable id
- **type** (from the extendable enum)
- **time anchor** (date/datetime; possibly start+end for ranges/milestones)
- display title / label
- status (optional — drives chip color, reuse task-status chip palette)
- link/reference to the source entity (for click-through)
- assignee/owner (optional — for column + filter)
- filterable facets surfaced by the search-options endpoint (type, status, assignee, date range)

---

## 5. UI widget library vision

The reusable layer ingests the §4 data shape and prints it multiple optional ways:
- **Extension of `ZbRemoteTableComponent`** (table + timeline-as-styled-table), and/or
- **New reusable components** (calendar grid with day boxes; daily/weekly/monthly switch).
- Same data shape → table / timeline / calendar / future widgets. Build the Schedule tab as the first consumer but keep the widget(s) generic.

---

## 6. Interoperability / sync / export (ideas to consider)

Clark's directive: design the schedule-item shape so it **matches, or is trivially mappable to, the shapes common PM/calendar tools use** — so syncing out (and possibly in) is near-free. This is where this doc meets `002-schedule-sync-pm-integration.md` (the external-PM-sync proposal): get the *shape* right here and 002 becomes mostly plumbing.

**Standard shapes to align with:**
- **iCalendar (ICS, RFC 5545)** — the universal interchange format for calendars. `VEVENT` (dated/range events, `DTSTART`/`DTEND`, `RRULE` for recurrence) and `VTODO` (tasks, `DUE`/`STATUS`/`PERCENT-COMPLETE`). Consumed by Google Calendar, Outlook, Apple Calendar, most PM tools. **If a schedule item maps cleanly to VEVENT/VTODO, calendar sync is essentially solved.** Our §4 fields (id, type, time anchor, title, status, link, assignee) line up well: id→`UID`, time→`DTSTART/DTEND/DUE`, title→`SUMMARY`, status→`STATUS`, link→`URL`, assignee→`ATTENDEE/ORGANIZER`, type→`CATEGORIES`.
- **RSS / Atom** — feed format for "what's new / upcoming" streams. Good for activity surfaces and lightweight subscription; weaker for rich filtering (no faceted options like the search endpoint).
- **webcal / CalDAV** — subscribable ICS-over-HTTP (`webcal://`) lets external calendars *live-subscribe* to a project schedule. CalDAV is the heavier 2-way protocol (probably out of scope for MVP).
- **CSV** — trivial tabular export for the table/timeline views.

**Export / feed mechanisms to weigh:**
- **ICS feed per project** (subscribable `webcal://` URL) — highest-leverage external-calendar integration.
- **RSS/Atom feed per project** — upcoming/recent schedule items as a stream.
- **One-shot exports** — ICS download, CSV download.

**The "backend is purely RSS feeds, widgets read RSS" idea:**
- Attractive for simplicity and built-in interop, but **RSS/Atom alone is a poor primary query surface** — no faceted filter options, weak pagination, no rich status/assignee filtering the calendar/table views need. 
- **Recommended split to evaluate:** primary interactive surface = the **search+options endpoint** (drives remote-table + filtering); **secondary surfaces = generated ICS + RSS/Atom feeds** over the same schedule-item store (for subscription/sync/export). Same data, two serializations. The feed could be the *export/sync* face, not the *interactive* face.
- RSS/Atom and ICS are also clean **RDF-Compass serializations** of the same underlying items — consistent with the audit-trail-container direction.

**To capture in the backend feature request:** ask backend to (a) shape schedule items as ICS-mappable (VEVENT/VTODO-compatible fields), and (b) expose ICS + RSS/Atom feed endpoints per project in addition to the search+options endpoint — so the data shape is "born interoperable."

---

## 7. Open questions (resolve before / during plan-phase)

1. **Schedule scope** — per-project only for MVP (this doc assumes per-project). Is a portfolio/cross-project schedule wanted later? (Kevin's input leaned per-project milestones.)
2. **Source of truth** — does schedule data come from a new store, a derived projection over project entities, or **Task Boards of type Calendar/Timeline**? Backend feature request decides.
3. **Item-type enum governance** — where does the user-extendable type list live (table? catalog segment? hydra tag?), and who can extend it (org-admin? platform?).
4. **Range vs point items** — do milestones/tasks need start+end (bars on a timeline) or just a single date? Affects timeline rendering.
5. **Timeline = styled mat-table or distinct component?** — decide once the mock lands.
6. **Reuse vs ngx-library contribution** — build calendar widget in sme-mart first, or propose into `@zerobias-org/ngx-library` from the start?

---

## 8. Next steps

1. **[pending] Schedule mockup** (Clark, from Kevin's input) — monthly calendar default, day/week/month button-set, search, filter-dialog icon.
2. **Backend feature request** — author the schedule-item data-shape + search-options endpoint request in `BACKEND_FEATURE_REQUESTS.md`; flag the "boards-of-type-calendar/timeline as source" question.
3. **plan-phase** — feed this doc + the mock to the planner when Schedule is scheduled for real build (Phase C of the soft-launch).
