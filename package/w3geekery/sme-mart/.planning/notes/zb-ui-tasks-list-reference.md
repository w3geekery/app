# zb/ui Tasks-List Reference — for SME Mart Phase 32 board-detail mirror

**Captured:** 2026-05-19
**Source:** `~/Projects/zb/ui` main @ `91c546c0f`
**Locked decision:** L-7 (Phase 32 board-detail tasks-list mirrors this shape)

## Component file paths

- **Primary:** `projects/zb-ui-lib/src/lib/components/zerobias-components/zb-tasks-panel/zb-tasks-list-panel/zb-tasks-list-panel.component.ts`
- **Template:** `projects/zb-ui-lib/src/lib/components/zerobias-components/zb-tasks-panel/zb-tasks-list-panel/zb-tasks-list-panel.component.html`
- **Constants:** `projects/zb-ui-lib/src/lib/components/zerobias-components/zb-tasks-panel/zb-tasks-panel.constants.ts`
- **Parent:** `zb-remote-table` via ngx-library

## Column inventory

Default visible columns (5):

| Column | Field path | Header text | Width/flex | Format/pipe | Sortable? | Notes |
|--------|-----------|-------------|-----------|------------|----------|-------|
| **Priority** | `element.priority.label` | Icon (low_priority tooltip) | Icon-only | `zb-severity-indicator` component | Yes (via remote-table header) | Numeric: 1000/500/200/100 → severity label |
| **Activities** | `element.code` | Generic.Code | Flex | Plain chip `zb-ui-chip square` | Yes | Activity code in square chip |
| **Name** | `element.name` | Generic.Name | Flex | Plain text | Yes | Task title/name |
| **Status** | `element.status` | Generic.Status | Flex | `snakeToSpaces` pipe + class-bind `task-status-<lower>` | Yes | Snake-case → spaced label; chip styling per status |
| **Assigned** | `element.assigned.contactName` + `.imageUrl` | Generic.Assigned | Flex | `zb-avatar` component | Yes | Party name + avatar image or initials |

Optional columns (available via column picker, not shown by default):

| Column | Field path | Format | Notes |
|--------|-----------|--------|-------|
| **Attachments** | `element.nbAttachments` | Numeric count | File count badge |
| **Comments** | `element.nbComments` | Numeric count | Comment count badge |
| **Boundary** | `element.boundary.name` + static icon | `zb-avatar` with boundary icon | Boundary scope |
| **Orgs** | `element.owner.imageUrl` + `.name` | Org image or unknown-company.svg | Owner organization |

## Row actions

**Row click behavior:**
- If `openTaskInDialog = true`: Opens task in full-screen `MatDialog` (90vh × 80vw)
- If `disableUrlUpdates = true`: Opens right-side drawer without updating query params
- Default: Updates query params with `selectedTask=<taskId>`, slides out drawer on right side (side vs. over based on `mobileQuery`)

**Drawer panel (right-side):**
- Component: `zb-task-panel` (nested, receives `task`, `params`, `source`)
- Close behavior: Clears `selectedTask` from query params (if URL updates enabled)
- Keyboard: ESC closes (native MatDrawer)

**Triple-dot menu: NONE.**
Row actions are ONLY click-to-open. No inline menu. All task actions (edit, delete, comment) are inside the drawer via `zb-task-panel` subcomponent.

## Filter UX

**Filter Button (single icon-button):**
- Icon: `filter_alt` (Material)
- Disabled until `taskColumnOptions` is populated
- Opens `TaskFiltersDialogComponent` (modal dialog)

**Dialog Contents (`TaskFiltersDialogComponent`):**
- Dimensions: 720px wide, 220px tall (max 95vw/95vh)
- Allows filtering by any visible or non-visible column
- Special handling for multi-select arrays: `statuses`, `priorities`, `boundaries`, `activities`, `parties`, `resources`, `boundaryRoles`, `assigned`, `accountable`, `approvers`, `notified`, `roles`, `phases`, `orgs`
- Custom field support: `customFields` (indexed by custom field `code`)

**Special Options (boundaries & orgs):**
- **Boundaries:** "All" + "Org-level Tasks Only" (radio-like: mutually exclusive)
- **Orgs:** "All Orgs" (toggleable)
- Both update `tableService.updateParams()` which syncs into page state

**Search param:** `search` (free-text, handled by remote-table)

**Filter Chips:**
- Displayed inline below column headers via `zb-remote-table`
- Excludes: `orgOnly`, `resources`, `boardIds` (never shown as chips)
- Update URL query params in real-time (unless `disableUrlUpdates = true`)

## Table primitive: `zb-remote-table`

**Type:** Standalone ngx-library component `ZbRemoteTableComponent`

**Key wiring:**
```html
<zb-remote-table
  [columns]="displayColumns"           <!-- Array of column keys: ['priority', 'activities', 'name', 'status', 'assigned'] -->
  [columnLabels]="displayColumnLabels" <!-- Map<string, i18n-key> -->
  [rowClickEnabled]="true"
  [selectableRows]="false"
  [drawerColumnFilters]="columnFilters"
  [showDrawerFilters]="columnFilters.length > 0"
  [loading]="loading"
  [searchPageKey]="'search'"
  (selectionChange)="onSelectionChange($event)"
  (rowClick)="onRowClick($event)"
>
```

**Column definitions:**
- Each column is an `<ng-container matColumnDef="columnKey">` with `<th>` + `<td>`
- Headers wired to `zb-remote-table-header` with optional filter template (`templateRef`)
- Cells render data directly or via pipes/components

**Pagination:** Handled by `ZbRemoteTableService` + `tableService.setData(PagedResults<T>)`

**Sorting:** Enabled by default on all columns; clicking column header sorts + updates URL query params

## Status / Priority / Party rendering

**Priority (numeric → severity):**
```typescript
// In component:
element.priority.label  // e.g., "Critical", "High", "Normal", "Low"

// In template:
<zb-severity-indicator [severity]="element.priority.label" [showText]="false">
```
Maps 1000 → Critical, 500 → High, 200 → Normal, 100 → Low (via SDK type)

**Status (enum → human):**
```typescript
// In template:
<span class="zb-ui-chip square" [ngClass]="'task-status '+element.status|lowercase">
  {{element.status|snakeToSpaces}}
</span>
```
Pipe converts `AWAITING_APPROVAL` → `Awaiting Approval`. CSS class `.task-status-awaiting_approval` applies color:
- `backlog` / `todo`: `#e9e9e9` bg + `#0f0f10` text
- `in_progress` / `awaiting_approval`: `#d7e0ee` bg + `#0f0f10` text
- `done`: `#d8ecba` bg + `#0f0f10` text
- `cancelled`: `#eed5d1` bg + `#0f0f10` text

**Assigned (party):**
```typescript
// In template:
<zb-avatar
  class="dense small"
  [label]="element.assigned?.contactName"
  [imageUrl]="element?.assigned?.imageUrl"
  [useInitials]="!element?.assigned?.imageUrl"
  [labelOn]="true"
>
</zb-avatar>
```
Avatar shows initials or image (from `element.assigned`, a Party object).

## Empty state

**When zero tasks loaded:**
```html
<!-- Implicitly handled by zb-remote-table -->
<!-- No explicit empty state component in this code -->
<!-- Remote-table likely shows "No data" message or spinner if loading=true -->
```
**Action:** Component shows `[loading]="loading"` spinner during fetch. After data loaded, remote-table renders empty rows or "no results" message (handled by ngx-library).

## Pagination model

**Type:** Page-based, not infinite scroll.

**Configuration:**
- Pagination params baked into `PortalTasksPage` or `PortalMyTasksPage` (inputs to `list()` method)
- `tableService.setData(PagedResults<TaskExtended>)` receives paged results with metadata: `total`, `pageNumber`, `pageSize`

**Behavior:**
- URL query params include `pageNumber` + `pageSize` (auto-preserved by remote-table)
- Clicking "Next" or page number button updates URL, triggers `list()` fetch

**Reset on action:**
- `tableService.resetPageIndex()` called after task create, delete, or manual filter change → back to page 1

## View modes

**Two exclusive views (toggle via select dropdown):**

1. **LIST_VIEW** (default: `'list'`)
   - Standard table layout (one row per task)
   - All columns visible according to `displayColumns` array

2. **COLUMN_VIEW** (value: `'column'`)
   - Card-based Kanban / board column layout (NOT implemented in this code; selector just swaps the value)
   - Likely triggers different component/template at parent level

**Toggle control:**
```html
<mat-select [formControl]="viewSelectControl">
  <mat-option [value]="COLUMN_VIEW">View Columns</mat-option>
  <mat-option [value]="LIST_VIEW">View List</mat-option>
</mat-select>
```

Emits `viewChange.emit(newView)` if `disableUrlUpdates = true`, otherwise updates query params.

## WebSocket real-time updates

**Card service integration:**
- Subscribes to `cardsService.getCardEvents()`
- Handles three event types: `TASK_CARD_CREATED`, `TASK_CARD_UPDATED`, `TASK_CARD_DELETED`

**Pending refresh banner:**
- Shows "Refresh" button + tooltip when changes detected
- Debounce: 500ms for deletes (avoid flicker if task is immediately recreated)
- Tooltip text i18n keys: `Boundaries.Tasks.RefreshNewTasks`, `RefreshUpdatedTasks`, `RefreshRemovedTasks`

**Behavior:**
- Does NOT auto-refresh; user clicks "Refresh" button
- Queues events if refresh already in progress; processes queue after refresh completes

## Board scope context

**Optional input: `boardScope: BoardScopeContext | null`**

If provided, renders a board context selector:
```html
<zb-board-context-selector
  leftActions
  [scope]="boardScope"
  [selectedBoardId]="selectedBoardId"
  [parentUrl]="parentUrl"
  (boardChanged)="boardChanged.emit($event)"
>
</zb-board-context-selector>
```

Emits `boardChanged($boardId)` → parent updates `selectedBoardId` input → `ngOnChanges` detects board change → re-filters tasks by `page.boardIds`.

## Buttons & actions bar

**Left actions:**
- Board context selector (if `boardScope` provided)

**Right actions:**
- View toggle select (if `!lockView`)
- Filter button (icon-only)
- "Link Task to Resource" button (if `linkableResource` provided)
- "Create Task" button (primary, always visible)

**Pending refresh button:**
- Floats in the table header alongside other action buttons
- Shows only when `hasPendingRefresh = true`
- Styled with `.zb-pulse-button` CSS class

## What SME Mart should reuse vs adapt

### REUSE as-is:
- `zb-remote-table` component + `ZbRemoteTableService` (pagination, sorting, filtering backbone)
- `zb-remote-table-header` with filter template pattern (sortable, filterable columns)
- `zb-avatar` component for party display (initials + image)
- `zb-severity-indicator` for priority rendering
- `zb-ui-chip square` styling for status + activities
- `snakeToSpaces` pipe for enum → human labels
- Filter dialog flow (`TaskFiltersDialogComponent` → column options → update table params)
- Right-side drawer pattern (MatDrawer over/side based on media query)
- Board scope context selector integration
- WebSocket card event subscription + pending refresh banner

### ADAPT (SME Mart-specific):
- **Default columns:** Swap or add SME Mart-specific fields (e.g., budget, engagement status, marketplace metrics)
- **Filter options:** Add SME Mart domain filters (e.g., vendor rating, engagement phase, contract type)
- **Row actions:** Extend with SME Mart-specific row menu items (e.g., "View Vendor Profile", "Message Provider")
- **Task labels/i18n keys:** Map to SME Mart's domain language (e.g., "Provider Task" vs "Task", "Engagement" vs "Activity")
- **Empty state messaging:** Customize "No tasks found" to match SME Mart UX tone
- **Status colors:** If SME Mart uses different task statuses, update chip CSS classes + color map
- **Dialog behavior:** Customize task dialog (currently `TaskDialogComponent`; SME Mart might embed vendor preview or engagement summary)

### DROP (not applicable to boards):
- `orgOnly` filter toggle (org-level vs boundary-level task split) — if SME Mart is single-org or doesn't expose this boundary concept
- `boundaryRoles` / `roles` filters — if SME Mart doesn't have role-based task scoping
- `phases` filter — if engagements don't map to "phases" as a first-class concept (use "status" instead)

## Gotchas / non-obvious behavior

1. **`zb-remote-table-header` filter template** — the `templateRef` is used ONLY in the filter dialog, not in the column header cell. Header shows the main content; dialog shows the option picker. Two different renderings for one column.

2. **`element.assigned` is nullable** — can be undefined if task has no assignee. Template uses optional chaining (`?.assigned?.contactName`), but no "unassigned" label shown; cell just renders empty.

3. **Status AND priority are enum-typed in SDK, but rendered as labels.** `element.priority` is an object with `.label` property; raw numeric value (1000/500/200/100) is NOT exposed in template.

4. **Column visibility ≠ column definition.** All 8 columns (name, activities, priority, status, assigned, attachments, comments, boundary, orgs) are DEFINED in template, but only 5 are VISIBLE by default. The others are hidden until user selects them in the column picker. Hidden columns still participate in sorting/filtering (remote-table handles this).

5. **`displayColumnLabels` is a flat map, keyed by column name.** It includes keys for non-default columns too (e.g., `attachments`, `comments`, `boundary`, `orgs`). Constants file provides the full set: `ZB_TASKS_PANEL_DISPLAY_LABELS`.

6. **Filter dialog is STATELESS.** Opening the dialog doesn't pre-populate selected values. User must click to open, then select, then submit. No "current filters" indicator in the UI.

7. **Row click opens DRAWER by default, not dialog.** The `openTaskInDialog` input swaps behavior to modal dialog, but default is side drawer. Drawer mode is faster for mobile (over) vs desktop (side).

8. **`tableService.resetPageIndex()` does NOT reload data automatically.** It clears pagination, but the parent must call `list()` to fetch. This is by design — allows batching multiple state changes before fetching.

9. **Custom fields are NOT rendered in table columns.** They're only accessible via the filter dialog. The table columns are pre-defined; custom metadata is hidden unless exposed via a separate custom-column feature (not present in this code).

10. **Card events queue if a refresh is already in progress.** This prevents race conditions when real-time updates pile up during a slow network fetch. Events are processed AFTER refresh completes, not immediately.

11. **`displayColumnLabels` keys are i18n translation keys, NOT the actual human text.** E.g., `'Generic.Name'` is a key; the actual label depends on the active language + translation file. No hardcoded English strings.

12. **Board context selector (if present) controls the `page.boardIds` filter.** Changing board doesn't reset pagination, but the filter is applied top-down: filter updates → `ngOnChanges` detects board change → calls `list()` with new filter.
