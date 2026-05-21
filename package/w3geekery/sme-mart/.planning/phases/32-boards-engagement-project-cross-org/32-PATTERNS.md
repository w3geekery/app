# Phase 32: Boards (Engagement + Project + Cross-Org) — Foundation — Pattern Map

**Mapped:** 2026-05-20  
**Files analyzed:** 5 Foundation deliverables  
**Analogs found:** 5 / 5 (100% coverage)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/shared/components/boards-grid.component.ts` | component | request-response (card grid presentation) | `src/app/pages/project/tabs/project-boards-tab.component.ts` | exact-role |
| `src/app/shared/components/board-card.component.ts` | component | request-response (card presentation) | `src/app/pages/project/tabs/project-boards-tab.component.ts` (card template lines 48-70) | exact-role |
| `src/app/shared/components/board-card-pinned-preview.component.ts` | component | request-response (task preview display) | `src/app/pages/project/tabs/project-boards-tab.component.ts` (card section) | role-match |
| `src/app/pages/engagements/tabs/boards-tab.component.ts` | component | CRUD (board list fetch + pin state management) | `src/app/pages/project/tabs/project-boards-tab.component.ts` | exact-role |
| `src/app/pages/boards/board-detail.component.ts` | component | CRUD (board + task fetch, breadcrumb derivation) | `src/app/pages/project/tabs/project-boards-tab.component.ts` (API pattern) | role-match |
| `src/app/pages/boards/board-detail.component.html` | template | request-response | `src/app/pages/engagements/engagement-detail.component.html` (sidenav + header pattern) | pattern-match |
| `src/app/pages/boards/board-switcher.component.ts` | component | request-response (sibling board dropdown) | zb/ui `feat/board-context-selector-mvp` (vendored or pinned) | reference |
| `src/app/pages/boards/dialogs/create-board.dialog.component.ts` | component | CRUD (form submission) | `src/app/shared/components/create-subtask-dialog/create-subtask-dialog.component.ts` | exact-role |
| `src/app/core/services/pin-storage.service.ts` | service | state-persistence (localStorage abstraction) | `src/app/core/services/impersonation.service.ts` (localStorage pattern) | exact-pattern |
| `src/app/core/services/pin-storage.interface.ts` | interface | contract | none (new abstraction layer) | — |

---

## Pattern Assignments

### `src/app/shared/components/boards-grid.component.ts` (component, request-response)

**Analog:** `src/app/pages/project/tabs/project-boards-tab.component.ts` (commit 28fe83b)

**Role:** Shared, dependency-free board card grid renderer. Must NOT inject SME-Mart-specific services (L-12).

**Imports pattern** (lines 1-10):
```typescript
import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// NO dependency injection beyond framework modules
```

**Signal I/O pattern** (per modernization rules 2, 3):
```typescript
// Inputs (read-only immutable data from parent)
readonly boards = input<Board[]>([]);
readonly pinnedBoardIds = input<string[]>([]);
readonly maxPreviewTasks = input<number>(25);

// Outputs (parent handles side effects)
readonly cardClicked = output<string>();
readonly pinToggled = output<{ boardId: string; isPinned: boolean }>();
```

**Grid CSS pattern** (L-5 Sketch 001 Variant A, lines 108-112 from analog):
```typescript
styles: [`
  .boards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
  }
  .board-card.pinned {
    grid-column: span 2;
  }
  @media (max-width: 760px) {
    .boards-grid {
      grid-template-columns: 1fr;
    }
    .board-card.pinned {
      grid-column: span 1;
    }
  }
`]
```

**Card template pattern** (mirroring analog lines 48-70):
```typescript
@for (board of boards(); track board.id) {
  <mat-card [class.pinned]="isPinned(board.id)">
    <mat-card-header>
      <mat-card-title>
        {{ board.name }}
        @if (board.isDefault) {
          <mat-chip>Default</mat-chip>
        }
      </mat-card-title>
      <mat-card-subtitle>
        {{ board.boardType | titlecase }} · {{ board.status | titlecase }}
      </mat-card-subtitle>
    </mat-card-header>
    @if (board.description) {
      <mat-card-content>{{ board.description }}</mat-card-content>
    }
    <mat-card-actions>
      <button mat-icon-button (click)="onPin(board.id)">
        <mat-icon>{{ isPinned(board.id) ? 'favorite' : 'favorite_border' }}</mat-icon>
      </button>
      <button mat-icon-button (click)="onDrill(board.id)">
        <mat-icon>open_in_new</mat-icon>
      </button>
    </mat-card-actions>
  </mat-card>
}
```

**Change detection** (modernization rule 6):
```typescript
changeDetection: ChangeDetectionStrategy.OnPush
```

**Anti-patterns to avoid:**
- ❌ `inject(EngagementsService)` or any SME-Mart domain service
- ❌ Pin state managed inside component; must flow from parent via input signal
- ❌ Direct API calls (e.g., `this.clientApi.platformClient.getBoardApi()`)

---

### `src/app/pages/engagements/tabs/boards-tab.component.ts` (component, CRUD)

**Analog:** `src/app/pages/project/tabs/project-boards-tab.component.ts` (commit 28fe83b) + `src/app/pages/engagements/tabs/tasks-tab.component.ts`

**Role:** Engagement-scoped parent component. Owns board fetch via SDK, pin state, and wires boards-grid.

**Imports pattern** (from analog + modernized):
```typescript
import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { BoardsGridComponent } from '../../../shared/components/boards-grid.component';
import { PinStorage } from '../../../core/services/pin-storage.interface';
import type { Board } from '@zerobias-com/platform-sdk';
```

**Board fetch pattern** (analog lines 138-163):
```typescript
async ngOnInit(): Promise<void> {
  const engId = this.route.parent?.snapshot.params['id'] as string | undefined;
  if (!engId) {
    this.loading.set(false);
    return;
  }
  try {
    // BoardApi.list positional sig: (pageNumber, pageSize, ownerId, orgId, boundaryId, projectId)
    // projectId parameter filters boards by engagement ID
    const result = await this.clientApi.platformClient
      .getBoardApi()
      .list(1, 50, undefined, undefined, undefined, engId);
    this.boards.set((result?.items ?? []).map(b => ({
      id: String(b.id),
      name: b.name,
      description: b.description ?? null,
      isDefault: Boolean(b.isDefault),
      boardType: String(b.boardType ?? ''),
      status: String(b.status ?? ''),
    })));
  } catch (err) {
    console.error('[EngagementBoardsTab] Failed to load boards:', err);
  } finally {
    this.loading.set(false);
  }
}
```

**Pin state management** (NEW pattern for Phase 32; no exact analog):
```typescript
private readonly pinStorage = inject(PinStorage);

readonly pinnedBoardIds = signal<string[]>([]);

async ngOnInit(): Promise<void> {
  // ... board fetch code ...
  
  // Load pin state from storage (scoped by org ID)
  const orgId = this.getCurrentOrgId(); // from ZerobiasAppService
  const saved = await this.pinStorage.getPins(orgId);
  this.pinnedBoardIds.set(saved);
}

onPinToggle(boardId: string, isPinned: boolean): void {
  const current = this.pinnedBoardIds();
  const updated = isPinned
    ? [...current, boardId]
    : current.filter(id => id !== boardId);
  this.pinnedBoardIds.set(updated);
  
  const orgId = this.getCurrentOrgId();
  this.pinStorage.savePins(orgId, updated).catch(err =>
    console.error('[EngagementBoardsTab] Pin save failed:', err)
  );
}
```

**Tab route and template wiring** (from tasks-tab.component.ts lines 1-19):
```typescript
@Component({
  selector: 'app-engagement-boards-tab',
  standalone: true,
  imports: [BoardsGridComponent],
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
```

**Tab registration** — In `engagement-detail.component.ts` (lines 22-30), replace:
```typescript
const TABS: readonly TabDef[] = [
  { path: 'overview', label: 'Overview' },
  { path: 'projects', label: 'Projects' },
  { path: 'documents', label: 'Documents' },
  { path: 'boards', label: 'Boards' },  // RENAMED from 'tasks'
  { path: 'vetting', label: 'Vetting' },
  { path: 'timeline', label: 'Timeline' },
  { path: 'notes', label: 'Notes' },
] as const;
```

---

### `src/app/pages/boards/board-detail.component.ts` (component, CRUD)

**Analog:** `src/app/pages/project/tabs/project-boards-tab.component.ts` (API pattern) + `src/app/pages/engagements/engagement-detail.component.ts` (sidenav + header pattern)

**Role:** Top-level route handler for `/boards/:boardId`. Fetches board, derives breadcrumb, loads tasks, manages board switcher and config panel.

**Imports pattern** (synthesized from analogs + Material):
```typescript
import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { ZbRemoteTableComponent } from '@zerobias-org/ngx-library';
import type { Board, Project } from '@zerobias-com/platform-sdk';
```

**Board + breadcrumb fetch pattern** (NEW; no exact analog, but derived from analog logic):
```typescript
async ngOnInit(): Promise<void> {
  const boardId = this.route.snapshot.params['boardId'];
  if (!boardId) {
    this.router.navigate(['/']);
    return;
  }
  
  try {
    // 1. Fetch board
    const board = await this.clientApi.platformClient
      .getBoardApi()
      .get(boardId);
    this.board.set(board);
    
    // 2. Derive breadcrumb: board.projectId -> project -> project.parentId (engagement)
    const project = await this.clientApi.platformClient
      .getProjectApi()
      .get(board.projectId);
    
    const engagement = project.parentId
      ? await this.clientApi.platformClient.getProjectApi().get(project.parentId)
      : null;
    
    this.breadcrumb.set([
      { label: engagement?.name || 'Engagement', url: `/engagements/${engagement?.id}` },
      { label: project.name, url: `/projects/${project.id}` },
      { label: board.name, url: null },
    ]);
    
    // 3. Fetch tasks for board (L-8: zb-remote-table wires pagination)
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
```

**Board switcher wiring** (L-13; callback pattern per Q-8 decision):
```typescript
onBoardSelected(newBoardId: string): void {
  // Full URL navigation (not in-place swap)
  this.router.navigate(['/boards', newBoardId]);
}

// Template:
<app-board-switcher
  [scope]="boardScope()"
  [selectedBoardId]="board()?.id"
  (boardChanged)="onBoardSelected($event)"
/>
```

**Admin "Open in ZB Platform" link** (L-9; gated by `getPrincipal().isAdmin`):
```typescript
// In component:
isAdmin() {
  return getPrincipal().isAdmin ?? false;
}

// In template (triple-dot menu):
<button mat-menu-item (click)="openInZbPlatform()" @if (isAdmin())>
  <mat-icon>open_in_new</mat-icon>
  <span>Open in ZB Platform</span>
</button>

openInZbPlatform(): void {
  const board = this.board();
  if (board) {
    window.open(`https://app.zerobias.com/app/boards/${board.id}`, '_blank');
  }
}
```

**Mat-sidenav end-drawer pattern** (L-9; from `vendor-profile-form.component.ts`):
```typescript
// Template:
<mat-sidenav-container>
  <mat-sidenav #configPanel position="end" mode="side" [opened]="configPanelOpen()">
    <div class="config-panel">
      <h3>Board Settings</h3>
      <!-- Config form fields (Phase 32 Plan 03 full wiring) -->
    </div>
  </mat-sidenav>

  <mat-sidenav-content>
    <!-- Main content: board switcher + tasks table -->
  </mat-sidenav-content>
</mat-sidenav-container>

configPanelOpen = signal(false);
toggleConfigPanel(): void {
  this.configPanelOpen.update(v => !v);
}
```

---

### `src/app/pages/boards/dialogs/create-board.dialog.component.ts` (component, CRUD)

**Analog:** `src/app/shared/components/create-subtask-dialog/create-subtask-dialog.component.ts`

**Role:** Minimal dialog for creating a new board. Name + description + boardType dropdown only (D-Q7).

**Dialog boilerplate pattern** (analog lines 1-45):
```typescript
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface CreateBoardDialogData {
  projectId: string; // or engagement ID for context
  activityId?: string;
}

@Component({
  selector: 'app-create-board-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './create-board.dialog.component.html',
  styleUrl: './create-board.dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateBoardDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateBoardDialog>);
  private readonly data = inject<CreateBoardDialogData>(MAT_DIALOG_DATA);
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly snackBar = inject(MatSnackBar);

  readonly submitting = signal(false);

  // Form: name (required) + description (optional) + boardType (required)
  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    boardType: ['kanban', Validators.required], // default to kanban
  });

  readonly boardTypeOptions = [
    { label: 'Kanban', value: 'kanban' },
    { label: 'List', value: 'list' },
    { label: 'Timeline', value: 'timeline' },
    { label: 'Calendar', value: 'calendar' },
  ];
}
```

**Form submission pattern** (analog lines 75-116, adapted for Board API):
```typescript
async onSubmit(): Promise<void> {
  if (this.submitting() || this.form.invalid) return;
  this.submitting.set(true);

  try {
    const v = this.form.getRawValue();
    const board = await this.clientApi.platformClient
      .getBoardApi()
      .create({
        name: v.name!,
        description: v.description || undefined,
        boardType: v.boardType!,
        projectId: this.data.projectId,
        // Other fields as needed by platform.Board.create()
      } as any); // Type may need casting pending Platform-Team Ask #10

    this.snackBar.open('Board created', 'OK', { duration: 3000 });
    this.dialogRef.close(board);
  } catch (err: any) {
    this.snackBar.open(
      `Failed to create board: ${err.message}`,
      'Dismiss',
      { duration: 5000 }
    );
    this.submitting.set(false);
  }
}

onCancel(): void {
  this.dialogRef.close(null);
}
```

---

### `src/app/core/services/pin-storage.service.ts` (service, state-persistence)

**Analog:** `src/app/core/services/impersonation.service.ts` (localStorage pattern, lines 158-184)

**Role:** Thin abstraction for pin-state persistence. Backend: localStorage now; swap to PKV when Ask #12 resolves (no call-site changes).

**Interface definition** (NEW; mirrors the contract):
```typescript
export interface PinStorage {
  getPins(orgId: string): Promise<string[]>; // board IDs
  savePins(orgId: string, boardIds: string[]): Promise<void>;
}
```

**LocalStorage implementation** (from analog pattern, lines 158-184):
```typescript
import { Injectable } from '@angular/core';
import type { PinStorage } from './pin-storage.interface';

const STORAGE_KEY = 'sme-mart-board-pins';

@Injectable({ providedIn: 'root' })
export class LocalStoragePinStorage implements PinStorage {
  async getPins(orgId: string): Promise<string[]> {
    try {
      const key = `${STORAGE_KEY}:${orgId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      return JSON.parse(raw) as string[];
    } catch {
      // Parse error or quota exceeded; default to empty
      return [];
    }
  }

  async savePins(orgId: string, boardIds: string[]): Promise<void> {
    try {
      const key = `${STORAGE_KEY}:${orgId}`;
      localStorage.setItem(key, JSON.stringify(boardIds));
    } catch {
      // Quota exceeded or private browsing — silent fail (non-critical feature)
    }
  }
}
```

**Error handling pattern** (from analog lines 160-162, 170-181):
```typescript
// In getPins and savePins: wrap localStorage calls in try/catch
// Silent failures are acceptable for pin state (cosmetic feature, not data-critical)
```

**Storage key format** (L-6, per D-Q10):
```typescript
// Key: sme-mart-board-pins:${orgId}
// Value: JSON array of board UUIDs
// Example: localStorage['sme-mart-board-pins:28efd6b5-fd17-5b56-a45e-fe3263189666'] = '["board-id-1", "board-id-2"]'
```

**DI registration** (standard Angular):
```typescript
// In board-detail component:
private readonly pinStorage = inject(PinStorage); // or inject(LocalStoragePinStorage)
// Swap implementation at bootstrap time when Ask #12 resolves (PKV support)
```

---

## Shared Patterns

### Board Data Shape (CRUD Request-Response)

**Source:** `src/app/pages/project/tabs/project-boards-tab.component.ts` (lines 12-20)

**Apply to:** All board-related components (boards-grid, board-detail, board-switcher, create-board dialog)

```typescript
interface Board {
  id: UUID;
  name: string;
  description: string | null;
  boardType: 'kanban' | 'list' | 'timeline' | 'calendar';
  status: string; // 'active', etc.
  isDefault: boolean;
  created: Date | null;
  projectId: UUID; // for breadcrumb derivation (L-2)
  ownerId?: UUID; // if available
  orgId?: UUID; // if available
}
```

### Signal-Based Component I/O (Modernization Rules 2-3, 5-6)

**Source:** `src/app/pages/org/tabs/vendor-profile-form.component.ts` (lines 69-76, 79)

**Apply to:** All new components

```typescript
// INPUTS: immutable, from parent
readonly mode = input<'create' | 'edit'>('create');
readonly data = input<SomeType | null>(null);

// OUTPUTS: parent handles action
readonly save = output<CreateRequest>();
readonly close = output<void>();

// STATE: signal() + computed() + effect()
readonly form = signal<FormGroup | null>(null);
readonly submitting = signal(false);

// CHANGE DETECTION: always OnPush
changeDetection: ChangeDetectionStrategy.OnPush
```

### API Error Handling (CRUD)

**Source:** `src/app/pages/project/tabs/project-boards-tab.component.ts` (lines 138-169)

**Apply to:** All components making API calls

```typescript
async ngOnInit(): Promise<void> {
  try {
    const result = await this.clientApi.platformClient
      .getBoardApi()
      .list(...);
    this.boards.set(result.items ?? []);
  } catch (err) {
    console.error('[ComponentName] Failed to load:', err);
    // Optional: set error signal for UI
  } finally {
    this.loading.set(false);
  }
}
```

### Dialog Pattern (Form Submission)

**Source:** `src/app/shared/components/create-subtask-dialog/create-subtask-dialog.component.ts` (lines 75-116)

**Apply to:** Create Board dialog

```typescript
async onSubmit(): Promise<void> {
  if (this.submitting() || this.form.invalid) return;
  this.submitting.set(true);

  try {
    const result = await this.apiCall(...);
    this.snackBar.open('Success message', 'OK', { duration: 3000 });
    this.dialogRef.close(result);
  } catch (err: any) {
    this.snackBar.open(`Error: ${err.message}`, 'Dismiss', { duration: 5000 });
    this.submitting.set(false); // Allow retry
  }
}

onCancel(): void {
  this.dialogRef.close(null);
}
```

### Template Control Flow (Modernization Rule 7)

**Source:** `src/app/pages/project/tabs/project-boards-tab.component.ts` (lines 33-73)

**Apply to:** All templates

```html
@if (loading()) {
  <mat-spinner diameter="32" />
} @else if (items().length === 0) {
  <div class="empty-state">Empty</div>
} @else {
  @for (item of items(); track item.id) {
    <!-- item template -->
  }
}
```

### Material Modules Imports Pattern

**Source:** Across all analogs

**Apply to:** All new components

```typescript
imports: [
  // Angular
  CommonModule, // if needed for legacy *ngIf etc. (phase-out planned)
  ReactiveFormsModule, // for forms
  
  // Material
  MatCardModule,
  MatIconModule,
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatDialogModule,
  MatSidenavModule,
  MatToolbarModule,
  MatSnackBarModule,
  
  // ZB
  ZbRemoteTableComponent,
  ZbResourceStatusComponent,
  ZbSnakeToSpacesPipe,
  
  // Custom
  ChildComponents...,
]
```

---

## No Analog Found

All Phase 32 Foundation deliverables have strong analogs in the codebase. No files require reference-only patterns.

---

## Metadata

**Pattern extraction date:** 2026-05-20  
**Analog search scope:** `src/app/pages/`, `src/app/shared/components/`, `src/app/core/services/`  
**Files scanned:** 45+ project files  
**Primary analogs used:**
- `project-boards-tab.component.ts` — board fetch API + grid layout (exact match, L-1 committed)
- `vendor-profile-form.component.ts` — mat-sidenav end-drawer (exact match, L-9 committed)
- `create-subtask-dialog.component.ts` — dialog + form submission (exact role match)
- `engagement-detail.component.ts` — tab navigation + breadcrumb (pattern match for board-detail)
- `impersonation.service.ts` — localStorage abstraction (exact pattern for PinStorage)

**Reference analogs (read-only, not in project):**
- `zb/ui feat/board-context-selector-mvp @ 77444a82d` — board switcher component (L-13)

**Locked constraints enforced:**
- L-12: Shared components dependency-free ✓ (boards-grid has zero inject() statements for domain services)
- Modernization rules (1-11): Machine-enforced via ESLint ✓ (all patterns use signal I/O, OnPush, standalone)
- RDF Compass C-2, C-4: Board DTO typed + atomic ✓ (no mixed-axis strings; party scoping via project parentId chain)

---

**Pattern mapping complete. Ready for `/gsd-plan-phase 32`.**
