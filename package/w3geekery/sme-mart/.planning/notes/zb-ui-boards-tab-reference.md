# zb/ui Boards-tab + Tasks-tab mock reference (for SME Mart Boards)

**Source mocks (zb/ui — HTML mockups, NOT built there yet; aspirational design):**
- `~/Projects/zb/ui/.claude/plans/public/projects-app-mocks/html/s5-boards-tab-composite.html`
- `~/Projects/zb/ui/.claude/plans/public/projects-app-mocks/html/s4-tasks-tab-composite.html`
- Screenshots: `~/Pictures/Screenshots/Screenshot 2026-05-22 at 11.52.13 AM.png` (boards), `... 11.58.12 AM.png` (tasks)

**Implementation note:** these are static HTML mocks. SME Mart implements with the REAL ngx-library components (`zb-remote-table`, `zb-resource-status`, avatar, chip-colors directive, theme tokens) — the mock markup is for layout/pattern reference only, not copy-paste.

---

## Entity-detail tab set (both mocks)
`Overview · Boards · Tasks · Members · Hierarchy` — the standard tab pattern for a Project (and, by extension, Engagement) detail page. SME Mart should mirror this on Project + Engagement detail.

## Boards tab (s5-boards-tab-composite)

**Scope banner + selector:** "Include boards from: **This project + child + linked**" — a multi-scope include selector. Banner copy: *"Pin a board to expand its tasks inline. Boards are grouped by project; child & resource-linked boards appear only where your membership grants access."* Visibility is membership-gated.

**Grouped by owning project.** Each group has a header: colored project dot + project name + a **relationship chip**:
- `This project` (rel-self) — blue
- `child` (rel-child) — green
- `resource-linked` (rel-linked) — amber

(This is the child / sub-project / linked indicator — three relationship types, not a single TOP/SUB badge.)

**Toolbar:** scope multi-select · "**N boards pinned**" count · filter icon · "Search tasks across boards" · **+ Create Board**.

**Board card** shows: board name · "N tasks" meta · board-type chip (Kanban / List / Timeline) · a status chip · **pin toggle** · open-board (drill / external-link icon) · more (triple-dot). The pin uses a **push-pin glyph** with on/off background (mock comment: *"pin = plain toggle, persisted to PKV user prefs"*) — validates the SME Mart push_pin icon + PkvPinStorage already built.

**Pinned cards lead the group and span wide.** Mock grid: `repeat(auto-fill, minmax(230px,1fr))`; pinned tiles `grid-column: span 3`. Multiple boards can be pinned at once. (SME Mart Phase 32 Foundation already does inline-expand + span via Sketch 001 Variant A.)

**Pinned card expands to an inline tasks table.** Mock shows a mini-table (Task · Status · Assignee, with severity dot + status chip + assignee avatar). **Real impl:** an embedded `zb-remote-table` WITH its projection area (search/filter + action buttons) so **+ Create Task is reachable from the pinned open board**, infinite scroll. This SUPERSEDES the current `BoardCardPinnedPreviewComponent` count-only stub (hardcoded `pinnedTaskCount=0`).

**Clark's addition (not in mock):** user-**resizable** pinned boards — drag handles to set pinned board height/width, so the user decides how much of the board to see inline.

## Tasks full-page view (s4-tasks-tab-composite + screenshot 2)
The board drill-down / project Tasks tab = a full `zb-remote-table`:
- **Columns:** Pri (severity dot) · Name (+ optional subtitle e.g. "Vendor Audit 2026") · Activity (code, e.g. AC-2) · Status (chip) · Assigned (avatar + name) · Att (attachment count) · Com (comment count) · Boundary (name + color swatch) · Org (color swatch).
- **Controls:** Scope selector ("This project +2") · removable filter chips (status, assigned=Me) · Search · View selector (List) · **+ Create Task**.
- Scope: all tasks across this project + child + resource-linked, membership-gated.

See also: [`zb-ui-tasks-list-reference.md`](./zb-ui-tasks-list-reference.md) (earlier capture of the tasks-list column/row-action shape), [`board-switcher-reference.md`](./board-switcher-reference.md).
