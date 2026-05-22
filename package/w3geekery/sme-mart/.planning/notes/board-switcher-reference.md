# Board Switcher Reference — for SME Mart Phase 32 board-detail page

**Captured:** 2026-05-19
**Source branch:** `~/Projects/zb/ui:feat/board-context-selector-mvp` @ `77444a82d`
**Locked decision:** L-13 (mirror this switcher's shape)

## Component file paths

- **Wrapper selector:** `zb-board-context-selector.component.ts` (input/output orchestrator)
  - Location: `projects/zb-ui-lib/src/lib/components/zerobias-components/zb-board-context-selector/`
  - Template: `zb-board-context-selector.component.html`
  - Styles: `zb-board-context-selector.component.scss`

- **Autocomplete widget:** `zb-board-autocomplete.component.ts` (search/dropdown UI)
  - Location: `projects/zb-ui-lib/src/lib/components/zerobias-task-components/board-autocomplete/`
  - Template: `board-autocomplete.component.html`
  - Styles: `board-autocomplete.component.scss`

- **Data service:** `PortalBoardsService` (API wrapper)
  - Location: `projects/zb-ui-lib/src/lib/zerobias-services/portal/boards/portal-boards.service.ts`

- **Scope types & helpers:** `board-scope.types.ts`
  - Location: `projects/zb-ui-lib/src/lib/zerobias-services/portal/boards/board-scope.types.ts`

## Component API (inputs / outputs)

### `ZbBoardContextSelectorComponent`

```typescript
@Component({
  selector: 'zb-board-context-selector',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZbBoardContextSelectorComponent {
  // INPUTS
  public scope = input.required<BoardScopeContext>();
  // scope.type: 'org' | 'boundary' | 'user'
  // scope.id: UUID | string (org/boundary/user ID)

  public selectedBoardId = input<string | null>(null);
  // Currently-active board id (source of truth in parent: URL param or signal)

  public parentUrl = input<string[] | null>(null);
  // For routed pages (Gov, Boundary): navigate to [parentUrl, newBoard.id] on create success
  // Null for popover/unrouted contexts (My Tasks)

  // OUTPUTS
  public boardChanged = output<string>();
  // Fires with the new board id when user picks a different board
}
```

### `ZbBoardAutocompleteComponent`

```typescript
@Component({
  selector: 'zb-board-autocomplete',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZbBoardAutocompleteComponent {
  // INPUTS
  public searchFn = input.required<BoardAutocompleteSearchFn>();
  // (term: string, pageSize: number) => Observable<BoardExtended[]>

  public favoritesFn = input<BoardAutocompleteFavoritesFn | null>(null);
  // Optional favorites loader; if null or returns [], favorites group stays hidden

  public selectedBoard = input<BoardExtended | null>(null);
  // Currently-selected board (seeds input display text)

  public defaultPageSize = input<number>(10);
  // Results to fetch on initial/empty-term load

  public searchPageSize = input<number>(25);
  // Results to fetch when user types >= minSearchLength chars

  public minSearchLength = input<number>(3);
  // Minimum typed characters before server search fires

  public debounceMs = input<number>(300);
  // Debounce window before search fetch

  public label = input<string>('Generic.SelectBoard');
  // i18n key for form-field label

  public placeholder = input<string>('');
  // Placeholder text for input

  public noResultsLabel = input<string>('Generic.NoBoards');
  // i18n key for empty-state row

  public favoritesGroupLabel = input<string>('Generic.FavoriteBoards');
  // i18n key for favorites optgroup header

  public showManageEntry = input<boolean>(true);
  // Render "Manage Boards" sentinel at bottom of panel?

  public showArrow = input<boolean>(true);
  // Render down-caret suffix (dropdown affordance)?

  public showSearchIcon = input<boolean>(true);
  // Render search icon prefix?

  public manageLabel = input<string>('Dialogs.ManageBoards.Title');
  // i18n key for "Manage Boards" option

  // OUTPUTS
  public boardSelected = output<BoardExtended>();
  // Fires with the selected board when user picks one

  public manageSelected = output<void>();
  // Fires when user picks "Manage Boards" sentinel
}
```

## Visual structure

**Visual flow:**
- Form field with search icon (prefix) + down-caret (suffix)
- Input displays the selected board's name (via `displayFn`)
- On focus or keydown: dropdown panel opens
- Panel structure:
  1. **Favorites group** (if `favoritesFn` returns >0 items) — optgroup header + board rows
  2. **Main results** (default list or search results)
     - Each row: scope icon + board name + "Default" chip (if `isDefault: true`)
  3. **"Manage Boards" row** (if `showManageEntry: true`) — settings icon + label

**Scope icons:**
- `boundary?.imageUrl` or fallback `images/resourceType/boundary.svg`
- `project?.imageUrl` or fallback `./assets/unknown_project.svg`
- `user?.imageUrl` or fallback `./assets/unknown_user.svg`
- `org?.imageUrl` or fallback `./assets/unknown-company.svg`

**Template snippet (simplifi ed):**
```html
<mat-form-field appearance="outline" full-width>
  <mat-label>{{ label() | translate }}</mat-label>
  <mat-icon matPrefix>{{ showSearchIcon() ? 'search' : '' }}</mat-icon>
  <mat-icon matPrefix color="primary">view_kanban</mat-icon>
  <input [formControl]="searchControl" [matAutocomplete]="auto" />
  <mat-spinner matSuffix *ngIf="loading(); diameter: 20"></mat-spinner>
  <mat-icon matSuffix *ngIf="!loading() && showArrow()">arrow_drop_down</mat-icon>

  <mat-autocomplete [displayWith]="displayFn">
    <!-- Favorites optgroup -->
    <mat-optgroup *ngIf="favorites().length > 0">
      <mat-option *ngFor="let board of favorites()" [value]="board">
        <img [src]="boardScopeIconPath(board)" />
        <span>{{ board.name }}</span>
        <span *ngIf="board.isDefault" class="zb-ui-chip dense">DEFAULT</span>
      </mat-option>
    </mat-optgroup>

    <!-- Main results (scrollable) -->
    <mat-option *ngFor="let board of boards()" [value]="board">
      <img [src]="boardScopeIconPath(board)" />
      <span>{{ board.name }}</span>
      <span *ngIf="board.isDefault" class="zb-ui-chip dense">DEFAULT</span>
    </mat-option>

    <!-- "Manage Boards" (non-scrolling footer) -->
    <mat-option *ngIf="showManageEntry()" [value]="MANAGE_SENTINEL">
      <mat-icon color="primary">settings</mat-icon>
      <span>{{ manageLabel() | translate }}</span>
    </mat-option>
  </mat-autocomplete>
</mat-form-field>
```

## Active-board indication

**Visual primitive:** Implicit — the selected board's name appears in the form-field input as the display text (via `displayFn`).

**Sticky behavior:**
- When user picks a board, `boardSelected` event fires with the `BoardExtended` object
- Parent listens to `boardChanged` output and updates `selectedBoardId` input
- Autocomplete's effect syncs `selectedBoard` input to the form-control's display text
- No visual "checkmark" in the dropdown itself — the input's content IS the indicator

**"Default" chip:**
- Displayed next to every board with `isDefault: true` (both in favorites and main list)
- Text: translated `'Dialogs.ManageBoards.DefaultChip'`
- Tooltip: human-readable scope label (e.g., "Default board for boundary: TAC")

## Click behavior — full nav or in-place swap?

**Observed behavior:** **Callback model, not full nav.**

The component emits `boardChanged` with the selected board id. The parent is responsible for navigation/state update. In routed pages (Gov, Boundary):
- Parent likely listens to `boardChanged`, calls `router.navigate([selectedId])` to update the route param
- New route load → component reinitializes with fresh `selectedBoardId` input

In non-routed contexts (My Tasks popover):
- Parent likely updates a signal or component-level state
- No URL change; UI state stays local

**Implication for Phase 32 Q-8:** **Supports Director lean for full nav.** The component's callback pattern allows the parent to decide: routed (URL-driven) or unrouted (state-driven). Phase 32 board-detail page will be routed (`/boards/:id`), so parent navigates on `boardChanged`.

## Data source pattern

**Three-tier fetch:**

1. **Initial load** — `searchFn('')` (empty term, defaultPageSize) fires on component init via effect
2. **User typing** — debounced (300ms) valueChanges pipeline:
   - If term length < minSearchLength (3): fall back to default list (`searchFn('')`)
   - If term length >= 3: fire `searchFn(trimmedTerm, searchPageSize)`
3. **Favorites** — separate `favoritesFn()` call on component init

**Search function shape:**
```typescript
export type BoardAutocompleteSearchFn = 
  (term: string, pageSize: number) => Observable<BoardExtended[]>;
```

**In `ZbBoardContextSelectorComponent`:**
- Computed signals recompute searchFn whenever `scope` or `reloadVersion` changes
- `searchFn` closure captures current scope, calls `portalBoardsService.searchBoards(scope, filters, pageSize)`
- Service builds scope-aware filter (org → ownerIds; boundary → boundaryIds; user → userIds)

**Boards are NOT pre-fetched into a list;** they're fetched on-demand via the search function. Selector is responsible for plumbing the search/favorites fns; service provides the lower-level API.

## Service dependencies

**For L-12 dependency-free analysis:**

`ZbBoardContextSelectorComponent` injects:
- `PortalBoardsService` — required (API wrapper for board CRUD/search)
- `MatDialog` — required (opens Manage Boards dialog on user click)

`ZbBoardAutocompleteComponent` injects:
- `DestroyRef` — Angular lifecycle management (standard, not business-logic)

**Total business-logic services injected in wrapper + autocomplete: 2**
1. `PortalBoardsService` — encapsulates all board API logic (search, fetch, default, favorites)
2. `MatDialog` — Material dialog service (framework utility)

**Conclusion for L-12:** Selector **depends on PortalBoardsService and MatDialog.** Both are portable to SME Mart (service is generic Portal API, dialog is framework standard). No SME-Mart-specific services are injected; no tight coupling to other zb/ui features.

## Empty / loading / error states

**Loading spinner:**
- Shown in form-field suffix when a fetch is in-flight
- Template: `<mat-spinner matSuffix diameter="20" style="margin-right: 12px"></mat-spinner>` (when `loading()` signal is true)
- Replaces the down-caret while loading

**Empty results:**
- Single disabled row: `{{ noResultsLabel() | translate }}` (i18n key `'Generic.NoBoards'`)
- Rendered when `boards().length === 0 && !loading()`

**Error handling:**
- Service methods catch errors and call `showErrorMessageToast(title, error, logDetails)`
- Errors are logged to snackbar; no UI indication in autocomplete itself
- On error, `boards` signal is set to `[]`, so empty-state row displays

**Scope missing:**
- If no scope is passed (`input.required` will enforce non-null), component won't initialize search

**No favorites:**
- If `favoritesFn()` is null or returns `[]`, the favorites optgroup is hidden entirely

## What SME Mart should reuse vs adapt

### REUSE as-is

- **`zb-board-autocomplete` component** — entire dropdown/search UI is generic and portable. No SME-Mart-specific logic.
- **`BoardAutocompleteSearchFn` and `BoardAutocompleteFavoritesFn` type signatures** — flexible callback model; provider-agnostic.
- **`board-scope.types.ts` helpers** — `boardScopeIconPath`, `boardScopeDefaultIconPath`, `defaultBoardScopeLabel`, `boardOwnerLabel` — all pure functions, no dependencies.
- **Search/favorites reactive pipeline** — signal-based effects and computed signals are clean and reusable.

### ADAPT

- **`ZbBoardContextSelectorComponent`** — thin wrapper that orchestrates autocomplete + "Manage Boards" dialog. SME Mart will adapt it:
  1. Replace `ZbManageBoardsDialogComponent` reference with SME Mart's board-management UI (if needed)
  2. Adjust `parentUrl` input handling — SME Mart phase 32 board-detail routes are `board/:id`, not Gov/Boundary hierarchy
  3. May drop `parentUrl` entirely if board nav is always URL-driven
  4. Adjust i18n keys (`'Generic.SelectBoard'`, `'Dialogs.ManageBoards.Title'`) to SME Mart keys

- **`PortalBoardsService`** — wrap or extend for SME Mart:
  1. `scope` will always be `{ type: 'org', id: currentOrgId }` (boards are org-level in SME Mart)
  2. May add SME-Mart-specific board properties or filters (status, archived, owner)
  3. `getFavoriteBoards()` stub can be enhanced once backend support lands
  4. `getDefault()` may not be needed (Phase 32 Q-1 suggests board selection is explicit, not default-driven)

### DROP

- **"Manage Boards" dialog integration** — Phase 32 doesn't mention board creation/deletion in the detail page. Board management likely lives elsewhere (settings, admin panel). Drop the `onManageSelected` call unless SME Mart has a corollary feature.
- **Favorites group rendering** — until favorites backend lands, this is dead code. Can be removed or left as a hook for future enhancement.

## Gotchas

1. **Search requires >= 3 chars.** Below that, the default list is shown. This keeps unqualified searches cheap. Phase 32 should document this UX (e.g., tooltip "Type 3+ characters to search").

2. **`MANAGE_SENTINEL` sentinel value.** When user picks "Manage Boards," the autocomplete emits `MANAGE_SENTINEL` (`'__manage_boards__'`), which the wrapper intercepts and converts to a `manageSelected()` output. The input's display text is restored to the previous board so it doesn't show `"__manage_boards__"` in the input.

3. **Scope context is required.** `BoardScopeContext` (org/boundary/user + id) is the sole required input; selector can't work without it. Phase 32 must supply this from the routed context.

4. **"Default" chip uses scope-specific tooltip.** e.g., "Default board for boundary: TAC". If a board is multi-scoped or the denormalized scope ref is missing from the API response, the tooltip degrades to "Default board for <type>" (no name). Phase 32 should verify API response shape includes scope denormalization.

5. **Favorites wiring is ready but stub.** `getFavoriteBoards()` returns `[]` in PortalBoardsService. Backend feature is deferred. Once ready, uncomment the feature and wire a real query. The UI scaffold is in place.

6. **No max-height on dropdown panel.** The autocomplete panel is scrollable (explicit `zb-board-autocomplete-scroll` div), but no CSS max-height constraint in the snippet. Material autocomplete auto-sizes; if too many boards exist, the panel may grow tall. Verify UX on 50+ board scenarios.

7. **Form-field encapsulation is `ViewEncapsulation.None`.** Both selector and autocomplete use this. Styles leak freely; be cautious with global class names in SCSS (they may conflict with other form-fields).

8. **Debounce is hardwired to 300ms.** Input provides `debounceMs` as a tuneable signal, but the MVP doesn't expose it as a component input. Phase 32 can hard-code 300ms or extend the wrapper to expose this.

9. **No explicit error UI.** Toast/snackbar are used for error messages, not an error state in the dropdown itself. Phase 32 should decide whether to enhance this (e.g., show an error icon in the form-field suffix).

10. **`BoardExtended` type from `@zerobias-com/portal-sdk`.** Verify SME Mart's Neon Hub Module connector returns data compatible with this shape. If the Hub Module's board representation differs, a transformer will be needed.
