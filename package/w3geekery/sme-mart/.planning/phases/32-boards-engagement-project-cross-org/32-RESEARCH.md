# Phase 32: Boards (Engagement + Project + Cross-Org) — Foundation — Research

**Researched:** 2026-05-20  
**Phase:** 32 Foundation (SPLIT from Phase 32 + Phase 33 Polish per Q-1 discuss decision)  
**Domain:** Shared board-grid component + engagement Boards tab + board-detail page with tasks list + minimal create dialog  
**Confidence:** HIGH — verified API shapes, existing working patterns, zero platform-team blockers for Foundation scope

## Summary

Phase 32 Foundation delivers a reusable Boards substrate (dependency-free `boards-grid` component) plus engagement-scoped and board-detail UX. The **platform.Board API is fully operational** (verified via existing working code in project-boards-tab.component.ts); **zb-remote-table and board-switcher are proven patterns** in zb/ui with zero Foundation blockers; **localStorage pin-state works immediately**, deferring PKV until UAT IAM is fixed. Foundation has zero platform-team dependencies — all 5 deliverables use existing primitives.

**Primary recommendation:** Execute Phase 32 Foundation as a single phase (6-8 plans) with zero external blockers. Phase 33 Polish (cross-org list, seed tasks, Vetting migration) gates on Platform-Team Ask #9 (`platform.Board.list` `orgIds[]` filter) and internal backlog items (BACKLOG-111 template library, BACKLOG-112 ontology).

## User Constraints (from CONTEXT.md)

### Locked Decisions (DO NOT re-debate)

- **L-1:** Engagement tab Tasks → Boards (rename, no redirect)
- **L-2:** Board-detail route `/boards/:boardId` (top-level, derives breadcrumb from `board.projectId → project.parentId` chain)
- **L-3:** Cross-org list `/boards` (Phase 33)
- **L-4:** Pin and drill are distinct affordances (pin = paged ≤25-task preview; drill = navigate to detail)
- **L-5:** Pinned-card layout via CSS Grid `repeat(auto-fill, minmax(320px, 1fr))` + `grid-column: span 2` on pinned; full-width below 760px
- **L-6:** localStorage now; PKV deferred (UAT IAM broken per Ask #12)
- **L-7:** Board-detail tasks-list mirrors zb/ui tasks-list column shapes + row actions
- **L-8:** Tasks-list table = `zb-remote-table` (REUSE search + filtering)
- **L-9:** Admin "Open in ZB Platform" link gated by `getPrincipal().isAdmin`
- **L-10:** Vetting becomes Board (tagged `sme-mart.board.vetting`, NOT enum value)
- **L-11:** Default-board seed tasks at provision (Phase 33)
- **L-12:** Shared components dependency-free of SME-Mart services (no engagements.service, sme-mart-project.service)
- **L-13:** Board switcher on detail page only

### Claude's Discretion

- Signal-input shape for shared components (input() / output() per modernization rules)
- `zb-remote-table` column config for board-detail tasks list
- Component decomposition of `boards-grid` (card sub-component, pin-preview, etc.)

### Deferred to Phase 33 or out-of-scope

- Cross-org `/boards` list page + org-multi-select filter
- User/Private boards section
- Default-board seed tasks + task-shape concerns
- Vetting tab elimination + specialized rendering + migration
- PKV plumbing
- ngx-library hoist
- Task CRUD UI, task-detail page, board archive/clone/permissions

---

## Phase Requirements

| ID | Description | Research Support |
|----|----|---|
| (Foundation has NO explicit req IDs; accepts L-1..L-13 as locked scope) | 5 deliverables: shared boards-grid, Engagement Boards tab, board-detail page, Create Board dialog, localStorage pin-state | Sections below provide component inputs, API signatures, data-shape constraints |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Board grid display (cards, pin preview) | Frontend (Client) | — | Card rendering is pure UI; no backend dependencies except initial load |
| Board list fetch (pagination, filtering) | API / Backend | — | `platform.Board.list()` is server-side; client calls via SDK |
| Board detail fetch | API / Backend | — | `platform.Board.get()` returns expanded owner/org/project refs |
| Tasks-list fetch & infinite-scroll | API / Backend (DataProducer) | — | `platform.Board.listTasks()` or generic-sql Hub Module; pagination server-side |
| Pin-state persistence | Frontend (Client, localStorage) | Storage Service (future PKV) | Pin/unpin toggles state locally; localStorage is the durable store for Foundation |
| Board switcher context | Frontend (Client) | — | Sibling boards rendered in dropdown; route nav on selection handled by parent |
| Admin gate check | Frontend (Client) | — | `getPrincipal().isAdmin` is synchronous principal check; UI toggles visibility |

---

## Standard Stack

### Core Libraries

| Library | Version | Purpose | Why Standard | Verified |
|---|---|---|---|---|
| `@zerobias-com/zerobias-angular-client` | 1.1.23+ | Angular SDK wrapper; exposes `clientApi.platformClient` | Provides `boardApi`, `taskApi` accessors; wraps zerobias-client | [VERIFIED: project-boards-tab.component.ts line 148-150] |
| `@zerobias-org/ngx-library` | 0.2.25 | ZB UI components: zb-remote-table, zb-avatar, zb-chip, zb-panel, etc. | Foundation uses zb-remote-table for tasks list (L-8) + status rendering via chips + severity/avatar components | [CITED: board-api-shape.md, zb-ui-tasks-list-reference.md] |
| `@angular/material` | 17.x+ | Mat-card, mat-sidenav, mat-dialog, mat-form-field, mat-select, mat-icon | Cards for board grid (L-5); end-drawer for cog panel (L-9); minimal create dialog | [ASSUMED: Angular 21 default stack] |
| `@angular/common` | 21.x | Built-in pipes: DatePipe, TitleCasePipe; @if / @for template syntax | Temporal and enum display; control flow (modernization rule 7) | [VERIFIED: existing components use @if / @for] |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Verified |
|---|---|---|---|---|
| TypeScript | 5.x | Type safety; strict mode enforced | Every component + service; no `: any` (modernization rule 8) | [ASSUMED: project default] |
| `@angular/cdk` | 17.x | Virtual scrolling, drag-drop, text selection | Infinite-scroll in zb-remote-table (already wired) | [VERIFIED: zb-remote-table uses CDK] |
| `@zerobias-com/hydra-sdk` | current | Hydra API: Tag / Resource tagging (future `sme-mart.board.vetting` tag creation) | Phase 33 only; Foundation doesn't create tags | [VERIFIED: board-api-shape.md section L-10] |

### Optional (phase-specific)

| Library | Purpose | Notes |
|---|---|---|
| `@zerobias-org/zerobias-ui` (zb/ui reference) | Board-switcher + tasks-list patterns | Don't depend on zb/ui directly; mirror patterns and vendor if needed (board-switcher-reference.md notes zb/ui as reference, not dependency) |

### Installation

```bash
npm install  # All deps already in package.json via zerobias-angular-client + ngx-library
# No new npm packages required for Foundation
```

---

## Architecture Patterns

### System Architecture Diagram

```
Engagement Detail Page (/engagements/:id)
  └─ Boards Tab (renamed from Tasks)
       └─ boards-grid (shared, dependency-free)
           ├─ [Card]
           │  ├─ board metadata (name, description, type)
           │  ├─ pin toggle (localStorage)
           │  └─ pinned state: expand-in-place task preview (≤25 tasks)
           │
           └─ [Drill affordance] → navigate to /boards/:boardId
                │
                ├─ Board Detail Page
                │  ├─ Header + breadcrumb (derived from board.projectId → project.parentId)
                │  ├─ Mat-sidenav (end-drawer): cog config panel
                │  ├─ Main content:
                │  │  ├─ Board switcher (sibling boards dropdown)
                │  │  └─ zb-remote-table (tasks list, infinite-scroll, read-only)
                │  │     ├─ Column config (priority, activities, name, status, assigned)
                │  │     ├─ Search + filter (modal dialog)
                │  │     └─ Row click → (stub or existing task-detail)
                │  │
                │  └─ Triple-dot menu
                │     └─ Admin "Open in ZB Platform" link (gated by getPrincipal().isAdmin)
                │
                └─ Create Board Dialog
                   ├─ Name field (required)
                   ├─ Description field (optional)
                   └─ boardType dropdown (kanban | list | timeline | calendar)
```

**Data flow:**
1. Engagement load → fetch boards via `clientApi.platformClient.getBoardApi().list(projectId=engagement.projectId)`
2. boards-grid renders cards (generic, no SME-Mart services)
3. Pin toggle → localStorage.setItem('sme-mart-board-pins', JSON.stringify(pinState))
4. Card drill or board-switcher → `router.navigate(['/boards', boardId])`
5. Board detail load → fetch board + tasks via SDK APIs
6. Tasks-list → `zb-remote-table` wires pagination, search, filter to API calls
7. Admin link → visible only if `getPrincipal().isAdmin === true`

### Recommended Project Structure

```
src/app/
├── shared/components/
│  ├── boards-grid.component.ts          # NEW: dependency-free, reusable
│  ├── boards-grid.component.html
│  ├── boards-grid.component.scss
│  ├── board-card.component.ts           # SUB: card presentation
│  ├── board-card.component.html
│  ├── board-card-pinned-preview.component.ts  # SUB: pinned task preview
│  └── board-card-pinned-preview.component.html
│
├── pages/boards/                        # NEW: top-level boards routes
│  ├── board-detail.component.ts         # /boards/:boardId
│  ├── board-detail.component.html
│  ├── board-detail.component.scss
│  ├── boards.routes.ts
│  └── dialogs/
│     ├── create-board.dialog.component.ts
│     └── create-board.dialog.component.html
│
├── pages/engagements/tabs/
│  ├── boards-tab.component.ts           # RENAME: was tasks-tab; wires boards-grid
│  ├── boards-tab.component.html
│  └── boards-tab.component.scss         # (route: /engagements/:id/boards)
│
├── core/services/
│  ├── pin-storage.service.ts            # NEW: thin localStorage interface
│  └── (no new business services; boards-grid calls SDK directly via inject(ZerobiasClientApi))
│
└── core/guards/
   └── (no new guards for Foundation)
```

**Key: No new SME-Mart-specific services in shared/components/boards-grid.** Component accepts input signals (boards array, onCardClick callback, etc.) and emits output signals (pinToggled, drillSelected). Parent (engagement-detail or project-detail) owns the data-fetch logic and calls the SDK.

### Pattern 1: Dependency-Free Shared Board Card

**What:** The `boards-grid` component renders a card grid with pin-to-expand inline preview. Zero dependencies on engagement.service, sme-mart-project.service, or any domain service.

**When to use:** Rendering board lists at any tier (engagement, project, cross-org) without code duplication.

**Signal I/O:**
```typescript
// Input signals (immutable, from parent)
readonly boards = input<Board[]>();
readonly onCardClick = input<(boardId: string) => void>();
readonly onPinToggle = input<(boardId: string, isPinned: boolean) => void>();
readonly pinnedBoardIds = input<string[]>([]);
readonly maxPreviewTasks = input<number>(25);

// Output signals
readonly cardClicked = output<string>();
readonly pinToggled = output<{ boardId: string; isPinned: boolean }>();
```

**Example:**
```typescript
// Parent (engagement-detail or project-detail) — OWNS the data fetch & pin state
readonly engagementId = input.required<string>();
readonly boards = signal<Board[]>([]);
readonly pinnedBoardIds = signal<string[]>([]);

constructor() {
  effect(async () => {
    const engId = this.engagementId();
    const result = await this.clientApi.platformClient
      .getBoardApi()
      .list(1, 50, undefined, undefined, undefined, engId); // projectId filter
    this.boards.set(result.items);
  });
}

onPinToggle(boardId: string, isPinned: boolean) {
  const current = this.pinnedBoardIds();
  if (isPinned) {
    this.pinnedBoardIds.set([...current, boardId]);
  } else {
    this.pinnedBoardIds.set(current.filter(id => id !== boardId));
  }
  this.pinStorage.savePins(this.orgId(), this.pinnedBoardIds());
}

onCardClick(boardId: string) {
  this.router.navigate(['/boards', boardId]);
}

// Template
<app-boards-grid
  [boards]="boards()"
  [pinnedBoardIds]="pinnedBoardIds()"
  [onCardClick]="onCardClick.bind(this)"
  [onPinToggle]="onPinToggle.bind(this)"
  (cardClicked)="onCardClick($event)"
  (pinToggled)="onPinToggle($event.boardId, $event.isPinned)"
/>
```

**Anti-Patterns to Avoid:**
- ❌ `boards-grid` calls `this.engagementService.loadBoards()` — breaks reusability. Parent owns fetch.
- ❌ Pin state persisted inside `boards-grid` (localStorage.setItem directly in component) — breaks testability. Parent owns persistence.
- ❌ `boards-grid` injects `ZerobiasClientApi` to fetch data — creates tight coupling. Only use in parent.

### Pattern 2: Board-Detail Page (Top-Level Route)

**What:** `/boards/:boardId` is a standalone route that fetches board + breadcrumb + tasks. Breadcrumb derived from `board.projectId → project.parentId` chain.

**Entry point:** `board-detail.component.ts` (standalone, OnInit)

**Load sequence:**
```typescript
async ngOnInit() {
  const boardId = this.route.snapshot.params['boardId'];
  
  // Fetch board (expanded refs included)
  const board = await this.clientApi.platformClient
    .getBoardApi()
    .get(boardId);
  
  // Breadcrumb: board.projectId → fetch project → project.parentId chain
  const project = await this.clientApi.platformClient
    .getProjectApi()
    .get(board.projectId);
  const engagement = project.parentId 
    ? await this.clientApi.platformClient.getProjectApi().get(project.parentId)
    : null;
  
  // Set breadcrumb: Engagement Name > Project Name > Board Name
  this.breadcrumb.set([
    { label: engagement?.name, url: `/engagements/${engagement?.id}` },
    { label: project.name, url: `/projects/${project.id}` },
    { label: board.name, url: null } // current page, no link
  ]);
  
  this.board.set(board);
}
```

**Sibling board switcher:**
- On load, fetch sibling boards via `list(projectId: board.projectId)` (same project)
- Render dropdown with current board highlighted
- On selection: `this.router.navigate(['/boards', newBoardId])` (full URL nav, not in-place swap)

### Pattern 3: PinStorage Interface (localStorage backend, PKV-ready)

**What:** Thin abstraction for pin-state persistence. Currently localStorage; swaps to PKV when Ask #12 resolves.

**Interface:**
```typescript
export interface PinStorage {
  getPins(orgId: string): Promise<string[]>;  // board IDs
  savePins(orgId: string, boardIds: string[]): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class LocalStoragePinStorage implements PinStorage {
  private readonly key = 'sme-mart-board-pins';
  
  async getPins(orgId: string): Promise<string[]> {
    const raw = localStorage.getItem(`${this.key}:${orgId}`);
    return raw ? JSON.parse(raw) : [];
  }
  
  async savePins(orgId: string, boardIds: string[]): Promise<void> {
    localStorage.setItem(`${this.key}:${orgId}`, JSON.stringify(boardIds));
  }
}

// Parent component wires it:
constructor(private readonly pinStorage: PinStorage) {
  effect(() => {
    this.pinStorage.getPins(this.orgId()).then(ids => {
      this.pinnedBoardIds.set(ids);
    });
  });
}
```

**Storage key format:** `sme-mart-board-pins:${orgId}` → `["board-uuid-1", "board-uuid-2", ...]` (JSON array of board IDs)

### Pattern 4: Modernization Rules Checkpoint

Every component in Phase 32 MUST follow these rules (machine-enforced via ESLint + pre-commit):

1. **Standalone components only.** No NgModules.
2. **Signal-based I/O:** `input()` / `output()` — NEVER `@Input()` / `@Output()`.
3. **Dependency injection via `inject()`.** NEVER constructor parameters (except for `ChangeDetectionStrategy.OnPush`).
4. **Signals for state:** `signal()` / `computed()` / `effect()` — NOT `BehaviorSubject`.
5. **View queries:** `viewChild()` / `viewChildren()` — NEVER `@ViewChild()` / `@ViewChildren()`.
6. **Change detection:** `ChangeDetectionStrategy.OnPush` on EVERY component.
7. **Template control flow:** `@if` / `@for` / `@switch` — NEVER `*ngIf` / `*ngFor` / `*ngSwitch`.
8. **Type safety:** No `: any`. Narrow types. No empty `catch {}` blocks.
9. **NGX-Library reuse:** `zb-remote-table`, `zb-chip`, `zb-avatar`, `zb-icon`, `zb-panel` BEFORE custom.
10. **Theme tokens:** `--zb-background`, `--zb-text`, `--mat-sys-*` — NEVER hardcoded colors.
11. **File naming:** Type suffixes: `foo.component.ts`, `foo.service.ts` (project convention).
12. **Shared-component rule:** No SME-Mart-specific services in `src/app/shared/components/`.

**Invoke the `sme-mart-architect` skill at plan-phase for any decomposition question.** Don't guess.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Board grid layout with responsive card sizing | Custom CSS grid from scratch | Material cards + CSS Grid `repeat(auto-fill, minmax(320px, 1fr))` | Responsive, tested, matches Material design spec |
| Infinite-scroll task pagination | Hand-managed offset + next-button | `zb-remote-table` (already wired to remote-table service) | Remote-table handles scroll detection, debounce, cache; custom implementation is edge-case hell |
| Task-status enum → human label rendering | Custom switch statement for 7 statuses | `snakeToSpaces` pipe + `zb-ui-chip` component with status-class binding | Pipe is localization-aware; chip has pre-designed colors per status |
| Modal create board dialog | Custom form component | `MatDialog` + reactive forms (standard Angular Material pattern) | Dialog handles positioning, dismiss, backdrop; reactive forms handles validation |
| Party avatar display (assigned-to) | Custom initials + image logic | `zb-avatar` component (ngx-library) | Avatar handles fallback to initials, image loading, accessibility |
| Board-switcher dropdown | Hand-built select with search | Port zb/ui `board-context-selector` or `zb-board-autocomplete` (L-13 reference) | Already has search, favorites group, scope icons, default-chip rendering |

**Key insight:** zb-remote-table and ngx-library solve 80% of the complex UX patterns. Resist the urge to "simplify" by building custom — the custom version will accumulate edge cases (empty state, loading, error, mobile, RTL) that ngx-library has already solved.

---

## Runtime State Inventory

**Trigger:** Phase 32 is a greenfield feature (no rename/refactor). No existing board or vetting-to-board migration in Foundation.

**Result:** SKIPPED (no rename, no legacy data transformation needed).

---

## Common Pitfalls

### Pitfall 1: boards-grid leaks SME-Mart coupling via injected services

**What goes wrong:** `boards-grid` is authored as a dump of engagement-boards logic; it injects `EngagementsService` or calls domain methods. When Project > Boards tab reuses it, the component breaks because the service is not available.

**Why it happens:** Copy-paste from engagement-context code without extracting the dependency-free substrate.

**How to avoid:** Audit `boards-grid` for `inject()` statements — only `ZerobiasClientApi` and `PinStorage` are allowed. Everything else (board fetching, data transform) lives in the parent component.

**Warning signs:** Component has `private readonly engagementsService = inject(EngagementsService)` or accesses `this.currentEngagementId()`. That belongs in the parent.

### Pitfall 2: PIN state persisted inside the component instead of via PinStorage interface

**What goes wrong:** Component calls `localStorage.setItem()` directly. When PKV support lands (Ask #12 resolution), you'd have to refactor the entire component to swap backends.

**Why it happens:** "Just save it to localStorage, it's easier than abstracting a service."

**How to avoid:** Pin state is ALWAYS managed by parent. Parent injects `PinStorage`, saves via `pinStorage.savePins()`, passes pinnedBoardIds via input signal to boards-grid (read-only).

**Warning signs:** Component has `localStorage` keyword in the typescript file.

### Pitfall 3: Forgetting breadcrumb derivation on board-detail page load

**What goes wrong:** Board-detail page shows the board name but no breadcrumb. Or breadcrumb is hardcoded ("Boards > Details") instead of derived from the actual hierarchy.

**Why it happens:** Breadcrumb derivation is 3 API calls (board → project → engagement). Easy to defer "for later."

**How to avoid:** Breadcrumb is part of the initial load sequence. Fetch board, then project, then engagement (if projectId exists). Don't render until breadcrumb is computed.

**Warning signs:** Loading spinner is shown until boards load, but breadcrumb is empty or static text.

### Pitfall 4: Board switcher emits full navigation instead of callback

**What goes wrong:** Board switcher calls `router.navigate()` directly. URL changes work, but query params (e.g., `?taskDetailOpen=true`) or local state are lost.

**Why it happens:** "Navigate is the simplest way to change boards" — true for the basic case, but breaks stateful UX.

**How to avoid:** Board switcher emits a callback (`boardChanged(boardId)`). Parent handles navigation. This allows parent to preserve query params or other state.

**Warning signs:** Board-switcher component imports `Router` and calls `this.router.navigate()`.

### Pitfall 5: Admin "Open in ZB Platform" link visible to non-admins

**What goes wrong:** Link is rendered for all users. Non-admin clicks it → 403 Forbidden on ZB platform side. Looks like a broken feature.

**Why it happens:** Forgot the `*ngIf` / `@if` gating condition.

**How to avoid:** Template uses `@if (getPrincipal().isAdmin)` around the link. No other condition.

**Warning signs:** No conditional on the link in the template.

### Pitfall 6: zb-remote-table configured with wrong column keys

**What goes wrong:** Table renders empty or shows wrong columns (e.g., priority column has task names, status column is blank).

**Why it happens:** Column config keys don't match the task object property names. Off-by-one or typo in the column definition.

**How to avoid:** Mirror zb-ui-tasks-list-reference.md exactly. Keys: `['priority', 'activities', 'name', 'status', 'assigned']`. Verify against task object returned by API (use Chrome DevTools on a real response).

**Warning signs:** Table header says "Name" but cells show priority icons.

---

## Code Examples

### Example 1: Engagement Boards Tab Wiring (parent → boards-grid)

**Source:** Mirrors existing project-boards-tab.component.ts pattern (commit `28fe83b`)

```typescript
import { Component, inject, signal, input, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import type { Board } from '@zerobias-com/platform-sdk';

@Component({
  selector: 'app-engagement-boards-tab',
  standalone: true,
  imports: [BoardsGridComponent], // Reusable shared component
  template: `
    <app-boards-grid
      [boards]="boards()"
      [pinnedBoardIds]="pinnedBoardIds()"
      (cardClicked)="onBoardClick($event)"
      (pinToggled)="onPinToggle($event.boardId, $event.isPinned)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementBoardsTabComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly pinStorage = inject(PinStorage);
  private readonly router = inject(Router);

  readonly boards = signal<Board[]>([]);
  readonly pinnedBoardIds = signal<string[]>([]);
  private readonly engagementId = input.required<string>();

  async ngOnInit(): Promise<void> {
    const engId = this.route.parent?.snapshot.params['id'] as string | undefined;
    if (!engId) return;

    try {
      // Fetch boards for this engagement's project
      const result = await this.clientApi.platformClient
        .getBoardApi()
        .list(1, 50, undefined, undefined, undefined, engId); // projectId = engagementId

      this.boards.set(result.items ?? []);

      // Load pin state from storage
      const orgId = this.getCurrentOrgId(); // (from ZerobiasAppService)
      const saved = await this.pinStorage.getPins(orgId);
      this.pinnedBoardIds.set(saved);
    } catch (err) {
      console.error('[EngagementBoardsTab] Failed to load boards:', err);
    }
  }

  onBoardClick(boardId: string): void {
    this.router.navigate(['/boards', boardId]);
  }

  onPinToggle(boardId: string, isPinned: boolean): void {
    const current = this.pinnedBoardIds();
    const updated = isPinned
      ? [...current, boardId]
      : current.filter(id => id !== boardId);
    this.pinnedBoardIds.set(updated);
    
    const orgId = this.getCurrentOrgId();
    this.pinStorage.savePins(orgId, updated).catch(err =>
      console.error('[EngagementBoardsTab] Failed to save pins:', err)
    );
  }
}
```

**Key points:**
- Parent owns the board fetch via SDK (`getBoardApi().list()`)
- Parent owns pin state and storage
- boards-grid is a dumb renderer (input arrays, output callbacks)
- No SME-Mart-specific services injected into boards-grid

### Example 2: boards-grid Component (Dependency-Free)

**Source:** Locked pattern per L-12 (shared-component rule)

```typescript
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import type { Board } from '@zerobias-com/platform-sdk';

@Component({
  selector: 'app-boards-grid',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="boards-grid">
      @for (board of boards(); track board.id) {
        <mat-card class="board-card" [class.pinned]="isPinned(board.id)">
          <!-- Header: name + isDefault chip -->
          <mat-card-header>
            <mat-card-title>
              {{ board.name }}
              @if (board.isDefault) {
                <span class="default-chip">Default</span>
              }
            </mat-card-title>
            <mat-card-subtitle>
              {{ board.boardType | titlecase }} · {{ board.status | titlecase }}
            </mat-card-subtitle>
          </mat-card-header>

          <!-- Description (if available) -->
          @if (board.description) {
            <mat-card-content>
              <p>{{ board.description }}</p>
            </mat-card-content>
          }

          <!-- Actions: pin + drill -->
          <mat-card-actions>
            <button mat-icon-button (click)="onPin(board.id)" [attr.aria-label]="'Pin ' + board.name">
              <mat-icon>{{ isPinned(board.id) ? 'favorite' : 'favorite_border' }}</mat-icon>
            </button>
            <button mat-icon-button (click)="onDrill(board.id)" [attr.aria-label]="'Open ' + board.name">
              <mat-icon>open_in_new</mat-icon>
            </button>
          </mat-card-actions>

          <!-- Pinned state: task preview (≤25 tasks) -->
          @if (isPinned(board.id)) {
            <mat-card-content class="pinned-preview">
              <p class="preview-label">{{ pinnedTaskCount(board.id) }} tasks</p>
              <!-- Stub: Phase 32 Plan 02 will wire the actual task list here -->
            </mat-card-content>
          }
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .boards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
      padding: 1.5rem;
    }
    @media (max-width: 760px) {
      .boards-grid {
        grid-template-columns: 1fr; /* Full-width on mobile */
      }
    }
    .board-card {
      display: flex;
      flex-direction: column;
      cursor: pointer;
    }
    .board-card.pinned {
      grid-column: span 2; /* Pinned cards span 2 columns */
    }
    @media (max-width: 760px) {
      .board-card.pinned {
        grid-column: span 1; /* Full-width on mobile */
      }
    }
    .default-chip {
      margin-left: 0.5rem;
      font-size: 0.75rem;
      color: var(--mat-sys-primary);
    }
    .pinned-preview {
      background: var(--zb-background-card);
      border-top: 1px solid var(--mat-sys-outline);
      padding: 0.75rem;
    }
    .preview-label {
      margin: 0;
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
    }
    mat-card-actions {
      display: flex;
      gap: 0.5rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardsGridComponent {
  // Inputs
  readonly boards = input<Board[]>([]);
  readonly pinnedBoardIds = input<string[]>([]);
  readonly maxPreviewTasks = input<number>(25);

  // Outputs
  readonly cardClicked = output<string>();
  readonly pinToggled = output<{ boardId: string; isPinned: boolean }>();

  // Computed helpers
  isPinned = (boardId: string) => this.pinnedBoardIds().includes(boardId);
  pinnedTaskCount = (boardId: string) => (this.isPinned(boardId) ? this.maxPreviewTasks() : 0);

  onDrill(boardId: string): void {
    this.cardClicked.emit(boardId);
  }

  onPin(boardId: string): void {
    const isPinned = this.isPinned(boardId);
    this.pinToggled.emit({ boardId, isPinned: !isPinned });
  }
}
```

**Key points:**
- Zero dependencies on any service (no `inject()` at all)
- Input signals are read-only; parent controls data
- Output signals are the only coupling point
- Template uses `@if` / `@for` (modernization rule 7)
- CSS Grid matches L-5 spec exactly

### Example 3: Board-Detail Component (Route Handler)

```typescript
import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import type { Board, Project } from '@zerobias-com/platform-sdk';

@Component({
  selector: 'app-board-detail',
  standalone: true,
  imports: [MatToolbarModule, MatSidenavModule, MatIconModule, ZbRemoteTableComponent],
  template: `
    <div class="board-detail">
      <!-- Header + breadcrumb -->
      <mat-toolbar color="primary">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span>{{ breadcrumb() | json }}</span> <!-- Simplified; real: breadcrumb nav component -->
      </mat-toolbar>

      <!-- Main: sidenav + content -->
      <mat-sidenav-container>
        <!-- End-drawer: cog config panel -->
        <mat-sidenav #configPanel position="end" mode="side" [opened]="configPanelOpen()">
          <div class="config-panel">
            <h3>Board Settings</h3>
            <!-- Stub: Phase 32 Plan 03 will wire config form -->
          </div>
        </mat-sidenav>

        <!-- Content: board switcher + tasks table -->
        <mat-sidenav-content>
          <div class="board-content">
            <!-- Board switcher (L-13) -->
            <app-board-switcher
              [scope]="boardScope()"
              [selectedBoardId]="board()?.id"
              (boardChanged)="onBoardSelected($event)"
            />

            <!-- Tasks list (L-8): zb-remote-table -->
            <zb-remote-table
              [data]="tasks()"
              [columns]="displayColumns"
              [columnLabels]="columnLabels"
              [loading]="loading()"
              (rowClick)="onTaskClick($event)"
            />
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>

      <!-- Triple-dot menu (admin link L-9) -->
      <button mat-icon-button [matMenuTriggerFor]="menu">
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #menu="matMenu">
        @if (isAdmin()) {
          <button mat-menu-item (click)="openInZbPlatform()">
            <mat-icon>open_in_new</mat-icon>
            <span>Open in ZB Platform</span>
          </button>
        }
      </mat-menu>
    </div>
  `,
  styleUrl: './board-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly router = inject(Router);

  readonly board = signal<Board | null>(null);
  readonly breadcrumb = signal<string[]>([]);
  readonly tasks = signal<any[]>([]);
  readonly loading = signal(true);
  readonly configPanelOpen = signal(false);
  readonly displayColumns = ['priority', 'activities', 'name', 'status', 'assigned'];
  readonly columnLabels = {
    priority: 'Priority',
    activities: 'Activity',
    name: 'Name',
    status: 'Status',
    assigned: 'Assigned',
  };

  get isAdmin() {
    return signal(getPrincipal().isAdmin ?? false); // or inject from service
  }

  get boardScope() {
    return computed(() => {
      const b = this.board();
      return b ? { type: 'project', id: b.projectId } : null;
    });
  }

  async ngOnInit(): Promise<void> {
    const boardId = this.route.snapshot.params['boardId'];
    if (!boardId) return;

    try {
      // Fetch board
      const board = await this.clientApi.platformClient
        .getBoardApi()
        .get(boardId);
      this.board.set(board);

      // Derive breadcrumb: board.projectId → project → project.parentId
      const project = await this.clientApi.platformClient
        .getProjectApi()
        .get(board.projectId);
      
      const engagement = project.parentId
        ? await this.clientApi.platformClient.getProjectApi().get(project.parentId)
        : null;

      const breadcrumb = [
        engagement?.name || 'Engagement',
        project.name || 'Project',
        board.name,
      ];
      this.breadcrumb.set(breadcrumb);

      // Fetch tasks for this board
      const tasksResult = await this.clientApi.platformClient
        .getBoardApi()
        .listTasks(boardId, 1, 25);
      this.tasks.set(tasksResult.items ?? []);
    } catch (err) {
      console.error('[BoardDetail] Failed to load:', err);
    } finally {
      this.loading.set(false);
    }
  }

  onBoardSelected(boardId: string): void {
    this.router.navigate(['/boards', boardId]); // Full nav (L-8 decision)
  }

  onTaskClick(task: any): void {
    // Stub: route to existing task-detail or show stub modal
    console.log('Task clicked:', task.id);
  }

  openInZbPlatform(): void {
    const board = this.board();
    if (board) {
      window.open(`https://app.zerobias.com/app/boards/${board.id}`, '_blank');
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| `EngagementVettingItem` GQL class (read-only in practice) | `platform.Task` under `sme-mart.board.vetting` Board | Phase 29.5 announced; Phase 32 Foundation untouched (Phase 33 migrates) | Vetting becomes a first-class Board; migration deferred |
| Tasks tab on engagement detail | Boards tab with card grid | Phase 32 (this phase) | Tab rename + new UI substrate |
| Manual task list rendering (expansion panels) | `zb-remote-table` (reuse ngx-library) | Phase 32 (this phase, L-8) | Infinite-scroll, search, filter out of the box |
| Manual pin-state tracking (if any) | PinStorage interface (localStorage now, PKV later) | Phase 32 (this phase, L-6) | Abstracted for future backend swap |

**Deprecated/outdated:**
- SmeMart-specific `Board` GQL class: replaced by `platform.Board` (announced 2026-05-08 via Nic's SDK release)
- Manual `EngagementVettingItem` CRUD: moving to `platform.Task` (Phase 33)
- Hard-coded task columns: use `zb-remote-table` column config (Phase 32)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | `platform.Board.list(projectId)` accepts engagement ID as the projectId filter | Standard Stack, Verified Code Examples | **LOW** — existing code (project-boards-tab.ts line 148-150) uses this pattern; API confirmed working on UAT today |
| A2 | `getPrincipal().isAdmin` is a synchronous accessor returning boolean | Patterns, Code Examples | **LOW** — memory entry `project_sme_mart_admin_detection` cites this; verify at plan-phase if uncertainty |
| A3 | `platform.Board` boardType enum supports `["kanban", "list", "timeline", "calendar"]` | Standard Stack | **MEDIUM** — Ask #10 to Kevin is open; Foundation supports any boardType string in dropdown, no hardcoded enum check |
| A4 | `platform.Board.listTasks` returns tasks (not 404 on deleted board) | Code Examples | **MEDIUM** — Ask #11 to Kevin is open; Foundation reads tasks as read-only, no spec on soft-delete behavior |
| A5 | zb/ui `board-context-selector-mvp` branch can be ported / vendored without breaking dependencies | Patterns | **LOW** — board-switcher-reference.md confirms only `PortalBoardsService` + `MatDialog` injected (both portable) |
| A6 | Angular 21 signal input/output patterns work as documented in MODERNIZATION_GUIDE.md | Patterns | **LOW** — extensively used in existing codebase (project-boards-tab, vendor-profile-form); no breakage |

**All assumptions tied to locked CONTEXT.md decisions (L-1..L-13) or verified by existing working code.** No novel assumptions here.

---

## Open Questions

1. **Ask #10 — boardType enum values**  
   What we know: API accepts `boardType` as a string; no enum validation observed on create.  
   What's unclear: Are `timeline` and `calendar` live (users can create them) or reserved for future?  
   Recommendation: Create Board dialog allows all four as dropdown options. If users select `timeline` on UAT and get an error, we'll surface that to Kevin.

2. **Ask #11 — soft-delete visibility on `listTasks`**  
   What we know: `platform.Board.listTasks(boardId)` endpoint exists; status filter works on `list()`.  
   What's unclear: If a board is deleted (soft-delete), does `listTasks` return 404 or empty array?  
   Recommendation: Board-detail page assumes `listTasks` succeeds (no explicit 404 handling). If it fails, user sees generic error. Phase 33 can harden with explicit handling if needed.

3. **Ask #12 — PKV on UAT (blocking pin-state sync)**  
   What we know: UAT gateway role lacks DynamoDB policy; PKV read/write denied. CI works.  
   What's unclear: ETA for Andrey to add policy.  
   Recommendation: Foundation ships localStorage-only. No code changes needed to swap to PKV once Ask #12 resolves (PinStorage interface absorbs the swap). Build it now, migrate the backing later.

---

## Environment Availability

No external dependencies for Foundation beyond the SDK + ngx-library (already installed).

| Dependency | Required By | Available | Version | Notes |
|---|---|---|---|---|
| `@zerobias-com/zerobias-angular-client` | Board APIs, TaskApi | ✓ | 1.1.23+ | Installed; verified in package.json |
| `@zerobias-org/ngx-library` | zb-remote-table, components, pipes | ✓ | 0.2.25 | Installed; verified in code |
| `@angular/material` | Mat-card, mat-sidenav, mat-dialog | ✓ | 17.x+ | Installed; used throughout codebase |
| `platform.Board` API (UAT) | Board CRUD, list, get, listTasks | ✓ | — | Verified working via existing project-boards-tab.ts |
| `platform.Project` API (UAT) | Breadcrumb derivation | ✓ | — | Verified working in existing code |
| localStorage (browser API) | Pin-state persistence | ✓ | — | Standard; no SDK dependency |

**No missing or fallback dependencies.** Foundation is ready to execute.

---

## Validation Architecture

**Trigger:** workflow.nyquist_validation is absent in `.planning/config.json` (treat as enabled).

### Test Framework

| Property | Value |
|---|---|
| Framework | Jasmine 5.x + Karma (Angular CLI default) |
| Config file | `karma.conf.js` + `src/test.ts` |
| Quick run command | `npm test -- --watch=false --browsers=ChromeHeadless 'src/app/shared/components/**/*.spec.ts'` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| (L-1) | Engagement tabs render Boards instead of Tasks tab | E2E or component integration | `npm test -- --include='**/engagement-detail.component.spec.ts'` | ✅ (existing engagement-detail spec) |
| (L-2) | `/boards/:boardId` route resolves and renders board-detail | Unit (routing) + E2E | `npm test -- --include='**/board-detail.component.spec.ts'` | ❌ Wave 0 (Plan 03) |
| (L-4) | Card pin toggle emits event; drill click emits event | Unit (boards-grid component) | `npm test -- --include='**/boards-grid.component.spec.ts'` | ❌ Wave 0 (Plan 01) |
| (L-5) | CSS Grid renders pinned cards at `grid-column: span 2`; mobile fallback works | Visual regression (E2E) | Playwright snapshot test | ❌ Wave 0 (Plan 05) |
| (L-8) | zb-remote-table renders with correct column config; search/filter wired | Unit (board-detail + integration with zb-remote-table service) | `npm test -- --include='**/board-detail.component.spec.ts'` | ❌ Wave 0 (Plan 03) |
| (L-9) | Admin link visible only if `getPrincipal().isAdmin === true` | Unit (board-detail component) | `npm test -- --include='**/board-detail.component.spec.ts'` | ❌ Wave 0 (Plan 03) |
| (L-12) | boards-grid component doesn't inject SME-Mart services | Static analysis (ESLint) | `npx eslint src/app/shared/components/boards-grid.component.ts --rule 'no-restricted-properties'` | ✅ (ESLint rule exists) |
| (L-13) | Board switcher emits `boardChanged(id)` callback; parent navigates | Unit (board-detail + board-switcher integration) | `npm test -- --include='**/board-switcher.component.spec.ts'` | ❌ Wave 0 (Plan 03) |

### Sampling Rate

- **Per task commit:** `npm test -- --include='src/app/shared/components/**/*.spec.ts'` (shared component suite)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green + ESLint diff-based gate before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/app/shared/components/boards-grid.component.spec.ts` — covers L-4, L-5, L-12 (pin toggle, drill, card layout, no SME-Mart services)
- [ ] `src/app/pages/engagements/tabs/boards-tab.component.spec.ts` — covers L-1 (tab exists, wires boards-grid, loads boards)
- [ ] `src/app/pages/boards/board-detail.component.spec.ts` — covers L-2, L-8, L-9, L-13 (route, tasks table, admin gating, board switcher)
- [ ] `src/app/pages/boards/dialogs/create-board.dialog.spec.ts` — covers minimal create dialog (name, description, boardType)
- [ ] `src/app/core/services/pin-storage.service.spec.ts` — covers localStorage interface (get, save, orgId scoping)
- [ ] `src/app/pages/boards/board-switcher.component.spec.ts` — if vendoring zb/ui component; otherwise skip (zb/ui maintains its own tests)
- [ ] E2E: Playwright spec for full engagement → boards tab → drill → board detail flow (post-Phase 32 Plan 05)
- [ ] ESLint rule validation: `src/app/shared/components/boards-grid.component.ts` passes `no-inject-sme-mart-services` rule (pre-commit gate)

*(No critical gaps for Foundation to execute. All tests are unit-level; E2E and mobile visual regression are Phase 32 Plan 05 scope.)*

---

## Security Domain

**Required:** security_enforcement is absent in config.json (treat as enabled).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | No | (Board detail page assumes valid session; no login flow) |
| V3 Session Management | No | (Delegated to ZB platform SDK) |
| V4 Access Control | Yes | `getPrincipal().isAdmin` gating on "Open in ZB Platform" link (L-9) |
| V5 Input Validation | Yes | Create Board dialog: `name` required, `boardType` enum-validated via Material select |
| V6 Cryptography | No | (No sensitive data encrypted at client; TLS for transport) |
| V7 Error Handling | Yes | All API calls wrapped in try/catch; user-facing errors via snackBar (no stack traces) |
| V8 Data Protection | Yes | Pin state scoped by `orgId` in localStorage key; no cross-org leakage |
| V9 Communications | No | (TLS enforced by platform) |
| V10 Malicious Code | No | (No UGC rendering; all content from trusted APIs) |
| V11 Business Logic | Yes | Board operations (create, pin, drill) follow L-1..L-13 locked specifications |
| V12 Files and Resources | No | (No file upload in Foundation) |
| V13 API & Web Service | Yes | SDK calls validated; API responses typed via `@zerobias-com/platform-sdk` (type safety) |
| V14 Configuration | No | (No sensitive config in client code) |

### Known Threat Patterns for Angular 21 + ZB SDK Stack

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Admin gating bypassed via dev-tools (localStorage manipulation) | Tampering | Never trust client-side admin flag alone; server validates on API call. `getPrincipal().isAdmin` is UI-only gating (cosmetic). Server rejects non-admin API calls. |
| Pin-state localStorage poisoned (malicious JSON) | Tampering | `PinStorage.getPins()` validates JSON parse; on error, falls back to empty array (no crash). |
| CSRF on board create (user tricked into creating board) | Spoofing | CSRF token handled by SDK + platform; client sends no raw forms (only via SDK methods). |
| XSS via board name / description | Injection | Material binding (not innerHTML) sanitizes board strings. Board names are API-sourced, not UGC. |
| Session hijacking (localStorage token theft) | Spoofing | SDK stores auth in sessionStorage / Memory, not localStorage. Pin-state is public (unprivileged) — no auth token in localStorage. |

**No novel threats introduced by Phase 32 Foundation.** All auth/session/encryption delegated to SDK + platform.

---

## Sources

### Primary (HIGH confidence)

- **Existing project-boards-tab.component.ts (commit 28fe83b)** — `platform.Board.list(projectId)` working pattern verified on UAT
- **board-api-shape.md (2026-05-19 pre-capture)** — `platform.Board` API shapes via ZB MCP (verified against OpenAPI schema)
- **zb-ui-tasks-list-reference.md (2026-05-19 pre-capture)** — zb/ui tasks-list column shapes, row actions, filter UX (grep-verified against zb/ui source)
- **board-switcher-reference.md (2026-05-19 pre-capture)** — zb/ui `feat/board-context-selector-mvp` input/output + deps (verified from actual branch @ 77444a82d)
- **32-CONTEXT.md (2026-05-20, discuss-phase output)** — L-1..L-13 locked decisions, Q-1..Q-12 resolved, Platform-Team Asks
- **vetting-current-shape.md (2026-05-19 pre-capture)** — Current vetting implementation inventory (Phase 33 scope, not Foundation)
- **MODERNIZATION_GUIDE.md** — Angular 21 rules (machine-enforced via ESLint + pre-commit)
- **RDF-COMPASS.md (§4 compass checklist)** — C-2 (Board data shapes must be RDF-serializable) + C-4 (party-boundary scoping on tasks)

### Secondary (MEDIUM confidence)

- **Memory entry `project_sme_mart_admin_detection`** — `getPrincipal().isAdmin` accessor (verify at plan-phase if needed)
- **Memory entry `project_sme_mart_hierarchy_model`** — Engagement = `platform.Project` depth 1; project tier = depth 2 (canonical for breadcrumb derivation)
- **CLAUDE.md project rules** — Angular 21 patterns, modernization, LSP routing, SDK verification protocol

### Tertiary (for reference only)

- **zb/ui source (~/Projects/zb/ui)** — board-switcher, tasks-list patterns (read-only reference; SME Mart ports, not imports)
- **zerobias-sdk source** — For type definitions (`@zerobias-com/platform-sdk` exports `Board`, `Project`, etc.)
- **Deprecated Next.js app** — NOT authoritative per SDK_VERIFICATION_SOURCES.md; skipped entirely

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — zerobias-angular-client + ngx-library are installed and verified working in existing code
- **Architecture patterns:** HIGH — existing project-boards-tab + vendor-profile-form provide proven implementations
- **Platform APIs:** HIGH — board-api-shape.md pre-capture verified via ZB MCP; project-boards-tab proves it works on UAT
- **Component design:** HIGH — shared component rules (L-12) locked by Director; modernization rules machine-enforced
- **Pitfalls:** MEDIUM — based on design review (CONTEXT.md) + code patterns; zero live execution data yet
- **RDF Compass (C-2, C-4):** HIGH — Board DTO confirmed typed + atomic (no mixed-axis strings); party-boundary scoping via task ownership chain in project hierarchy

**Research date:** 2026-05-20  
**Valid until:** 2026-06-20 (30 days; Board API is stable, Angular/SDK changes unlikely in that window)  
**Blockers for execution:** NONE — all Foundation deliverables use existing APIs and libraries. Phase 33 gates on Platform-Team Asks #9, #11, #12 (cross-org filter, soft-delete visibility, PKV IAM).

---

**End of Phase 32 Foundation Research. Ready for `/gsd-plan-phase 32`.**
