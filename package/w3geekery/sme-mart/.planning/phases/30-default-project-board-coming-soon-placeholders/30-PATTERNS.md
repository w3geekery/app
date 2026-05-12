# Phase 30: Default Project Board + Coming Soon Placeholders — Pattern Map

**Mapped:** 2026-05-12
**Files analyzed:** 7 new/modified
**Analogs found:** 6 / 7 (one service helper has no direct analog but reuses existing service pattern)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/default-project-board/default-project-board.component.ts` | component | request-response (dual reads) | `src/app/pages/home/home.component.ts` | role-match |
| `src/app/default-project-board/feature-coming-soon.component.ts` | component | request-response (route-data binding) | `src/app/pages/coming-soon/coming-soon.component.ts` | exact |
| `src/app/core/constants/tier-tags.ts` | constants | N/A (static export) | `src/app/core/constants/demo-tags.ts` | exact |
| `src/app/core/services/engagements.service.ts` (extend) | service | dual-read (primary + fallback) | Existing service (add 2 helpers) | role-match |
| `src/app/core/services/engagements.service.spec.ts` (extend) | spec | unit test (async helpers) | Existing spec (extend) | role-match |
| `src/app/core/services/platform-engagement-provisioner.service.ts` (re-export) | service | re-export pattern | Self (existing file) | exact |
| `src/app/app.routes.ts` (modify) | routing | route-data binding | Existing routes (modify) | role-match |

---

## Pattern Assignments

### `src/app/default-project-board/default-project-board.component.ts` (component, request-response)

**Analog:** `src/app/pages/home/home.component.ts`

**Imports pattern** (lines 1-10):
```typescript
import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { EngagementsService } from '../../core/services/engagements.service';
```

**Signal-based data flow pattern** (lines 27-34):
```typescript
export class Home implements OnInit {
  private readonly router = inject(Router);
  private readonly providerProfiles = inject(ProviderProfilesService);

  readonly loading = signal(true);
  readonly featuredProviders = signal<ProviderDirectoryRow[]>([]);
  readonly categories = signal<Category[]>([]);
```

**Dual async-read pattern with error handling** (lines 47-60):
```typescript
async ngOnInit() {
  try {
    const [providers, cats] = await Promise.all([
      this.providerProfiles.listProviders({ pageSize: 6 }),
      this.categoriesService.loadCategories(),
    ]);
    this.featuredProviders.set(providers.items || []);
    this.categories.set(this.categoriesService.getRootCategories().slice(0, 6));
  } catch (err) {
    console.warn('[Home] Failed to load:', err);
  } finally {
    this.loading.set(false);
  }
}
```

**Template control-flow pattern** (home.component.html, lines 71-107):
```html
@if (loading()) {
  <zb-empty-state-container [loading]="true" />
} @else if (featuredProviders().length) {
  <div class="provider-grid">
    @for (provider of featuredProviders(); track provider.id) {
      <app-provider-card [provider]="provider" />
    }
  </div>
} @else {
  <zb-empty-state-container [loading]="false" emptyText="No providers yet" />
}
```

**Card grid responsive layout** (home.component.scss, lines 34-38):
```scss
.path-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}
```

**Anti-patterns (DO NOT copy):**
- Do NOT use `*ngIf` / `*ngFor` — use `@if` / `@for` instead
- Do NOT use `@Input` decorators — use `input()` signal API
- Do NOT use constructor DI with type params — use field-level `inject()`
- Do NOT hardcode hex colors in SCSS — use `var(--mat-sys-*)` or `var(--zb-*)`
- Do NOT import `CommonModule` — standalone components use primitives directly
- Do NOT use `<mat-spinner>` — use `<mat-progress-spinner></mat-progress-spinner>`

---

### `src/app/default-project-board/feature-coming-soon.component.ts` (component, request-response)

**Analog:** `src/app/pages/coming-soon/coming-soon.component.ts`

**Standalone component with inject() DI + ChangeDetectionStrategy.OnPush** (lines 1-42):
```typescript
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="coming-soon">
      <mat-icon class="coming-soon-icon">construction</mat-icon>
      <h2>{{ title }}</h2>
      <p>This feature is coming soon.</p>
    </div>
  `,
  styles: [`
    .coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      color: var(--zb-secondary-text);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComingSoon {
  private readonly route = inject(ActivatedRoute);
  readonly title = this.route.snapshot.data['title'] || 'Coming Soon';
}
```

**Enhanced version for Phase 30 should add signal inputs** (pseudo-code pattern):
```typescript
import { Component, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';

@Component({
  selector: 'app-feature-coming-soon',
  standalone: true,
  imports: [MatButtonModule, ZbEmptyStateContainerComponent],
  template: `
    <zb-empty-state-container>
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
      @if (featureKey()) {
        <button mat-raised-button color="primary" (click)="onNotifyMe()">
          Notify me when ready
        </button>
      }
      <a mat-stroked-button routerLink="/projects">← Back to projects</a>
    </zb-empty-state-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureComingSoonComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly title = input<string>('');
  readonly description = input<string>('');
  readonly featureKey = input<string | undefined>(undefined);

  onNotifyMe(): void {
    this.snackBar.open("We'll let you know when this is ready", 'Dismiss', {
      duration: 5000,
    });
  }
}
```

**Route-data binding pattern** (see app.routes.ts modification below — FeatureComingSoonComponent reads via `ActivatedRoute.snapshot.data`)

**Anti-patterns:**
- Do NOT use `@Input()` decorator — use `input()` signal API
- Do NOT use `@Output()` decorator — use `output()` for emitters (optional here, not needed for toast)
- Do NOT hardcode hex in inline styles — reference theme variables only
- Do NOT use `<mat-spinner>` — icon + text is sufficient for this placeholder
- Do NOT create a server write for notify-me — toast-only per CONTEXT.md G3 lock

---

### `src/app/core/constants/tier-tags.ts` (constants, static export)

**Analog:** `src/app/core/constants/demo-tags.ts`

**File structure and comment pattern** (lines 1-19):
```typescript
/**
 * Demo-seeded record tag UUIDs.
 *
 * Phase 24: Demo Data Visibility Gate
 * These two UUIDs are used to identify demo records during the transition period:
 * - GLOBAL_DEMO: new demo records (preferred, marketplace tagType)
 * - LEGACY_W3GEEKERY: existing demo records (legacy, 'other' tagType, retained to avoid UUID churn)
 */

export const DEMO_TAG_UUIDS = {
  GLOBAL_DEMO: '81053c14-a8e5-4939-b538-c122c7d0eb1a',
  LEGACY_W3GEEKERY: 'd618b602-21cc-40a1-a9fa-534b7bc1672c',
} as const;

/**
 * Flattened list of demo-tag UUID values for use in array filters and predicates.
 * Example: checking if a record.tag contains ANY of these UUIDs.
 */
export const DEMO_TAG_UUID_LIST: readonly string[] = Object.values(DEMO_TAG_UUIDS);
```

**Phase 30 template for tier-tags.ts** (adapt from provisioner.service.ts lines 15-19):
```typescript
/**
 * SME Mart Project-tier identity tag.
 *
 * Per D-50 canonical tier mapping: depth 2 = Project tier (FIXED), tag = sme-mart.tier.project.
 * The sme-mart.tier.workspace UUID (UAT 2d7e6b6d-62e1-4691-958c-41cd1b8de043) is reserved
 * for customer-renameable depth-3+ tiers via the future Hierarchy Editor; v1.4 does not use it.
 */
export const SME_MART_TIER_PROJECT_TAG_ID = '420b0753-e72c-4b81-8929-70508a119bf0'; // UAT
```

**Re-export pattern for provisioner.service.ts** (one-liner at top of exports):
```typescript
// Hoist tier-tag constant to shared location; re-export for backward compatibility
export { SME_MART_TIER_PROJECT_TAG_ID } from '../constants/tier-tags';
```

**Anti-patterns:**
- Do NOT comment the tag UUID with the word "constant" — state the tier mapping and Canonical source (D-50)
- Do NOT create a separate const per environment (ci, uat, prod) — that's Phase 31 scope (`TIER-TAG-ENV-BOOTSTRAP-1`)
- Do NOT export the reserved `WORKSPACE` UUID until a consumer exists

---

### `src/app/core/services/engagements.service.ts` (extend with 2 helpers)

**Analog:** Existing service — `listEngagements()` dual-read pattern (lines 55-94)

**Dual-read window pattern to reuse** (lines 55-94):
```typescript
async listEngagements(options?: QueryOptions & { statusFilter?: string; buyerOrgId?: string }): Promise<PagedResults<EngagementSummaryRow>> {
  this.loading.set(true);
  try {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    // DUAL_READ_WINDOW_D15: Try platform.Project.list first (primary)
    let items: EngagementSummaryRow[] = [];
    let totalCount = 0;

    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PRIMARY_READ_TIMEOUT')), PRIMARY_READ_TIMEOUT_MS)
      );

      const platformProjects = await Promise.race([
        this.clientApi.platformClient
          .getProjectApi()
          .list(pageNumber, pageSize, undefined, options?.buyerOrgId as never),
        timeout,
      ]);

      if (platformProjects) {
        // Transform platform.Project[] to EngagementSummaryRow[]
        const transformed = platformProjects.items.map(proj => this.transformPlatformProjectToEngagementSummary(proj as ProjectExtended));

        // DG-02/DG-03: Client-side demo-visibility post-filter
        const filtered = this.demoVisibility.applyVisibility(transformed) as EngagementSummaryRow[];

        items = filtered;
        totalCount = platformProjects.pageSize * pageNumber + items.length;

        console.debug('[ENGAGEMENT_LIST:PRIMARY_SUCCESS]', {
          count: items.length,
          buyerOrgId: options?.buyerOrgId,
          source: 'platform.Project.list',
        });
      }
    } catch (primaryErr) {
      // DUAL_READ_WINDOW_D15: Primary read failed, try fallback (legacy GQL)
      console.debug('[ENGAGEMENT_LIST:PRIMARY_FAILED]', {
        error: (primaryErr as Error).message,
        attemptingFallback: true,
      });
      // ... fallback logic ...
    }
  } finally {
    this.loading.set(false);
  }
}
```

**Helper 1: `getDefaultEngagement(orgId: UUID)` scaffold** (pseudo-code; plan author fills in tag predicate):
```typescript
async getDefaultEngagement(orgId: UUID): Promise<EngagementSummaryRow | null> {
  const results = await this.listEngagements({
    buyerOrgId: String(orgId),
    pageNumber: 1,
    pageSize: 10,
  });
  
  // Find engagement matching identity tag namespace (sme-mart.engagement.* OR legacy sme-mart.eng.*)
  // Dual-namespace handling inherited transparently from listEngagements (D-49)
  return results.items.find(e => {
    // Tag predicate: check if tag NAME matches identity tag patterns
    // Plan author implements predicate from EngagementSummaryRow.tag shape
    // (see transformPlatformProjectToEngagementSummary @ line 323)
  }) ?? results.items[0] ?? null;
}
```

**Helper 2: `getProjectTierProject(engagementId: UUID)` scaffold** (pseudo-code):
```typescript
async getProjectTierProject(engagementId: UUID): Promise<ProjectExtended | null> {
  // Verify signature of .list() — may need to check if tagId is positional or named param
  const result = await this.clientApi.platformClient
    .getProjectApi()
    .list(1, 10, undefined, undefined, String(engagementId), SME_MART_TIER_PROJECT_TAG_ID);
  
  return result.items[0] ?? null;
}
```

**DI and service setup** (existing lines 36-46):
```typescript
@Injectable({ providedIn: 'root' })
export class EngagementsService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly demoVisibility = inject(DemoVisibilityService);
  private readonly clientApi = inject(ZerobiasClientApi);

  readonly engagements = signal<EngagementSummaryRow[]>([]);
  readonly loading = signal(false);
```

**Anti-patterns:**
- Do NOT add the helpers to `engagement-hierarchy.service` (that service is tag-prefix parser, unrelated to parentId-depth resolution per CONTEXT.md G2 decision)
- Do NOT create separate read windows for each helper — reuse `listEngagements`' existing dual-read if needed
- Do NOT create a memoization cache inside the helpers — that's a Phase 31+ optimization

---

### `src/app/core/services/engagements.service.spec.ts` (extend existing)

**Analog:** Existing spec file (lines 1-83)

**TestBed setup pattern** (lines 29-49):
```typescript
beforeEach(() => {
  pipelineWrite = fakePipelineWriteService();
  graphqlRead = fakeGraphqlReadService();
  mockSnackBar = { open: vi.fn() };
  mockProjectContext = fakeProjectContextService(false); // non-admin by default
  mockClientApi = fakeClientApi();

  TestBed.configureTestingModule({
    providers: [
      EngagementsService,
      DemoVisibilityService,
      { provide: PipelineWriteService, useValue: pipelineWrite },
      { provide: GraphqlReadService, useValue: graphqlRead },
      { provide: ProjectContextService, useValue: mockProjectContext },
      { provide: MatSnackBar, useValue: mockSnackBar },
      { provide: ZerobiasClientApi, useValue: mockClientApi },
      { provide: ZerobiasClientSessionId, useValue: { getCurrentSessionId: () => null } },
    ],
  });

  service = TestBed.inject(EngagementsService);
});
```

**Async test pattern for dual-read helpers** (extend existing describe blocks):
```typescript
describe('getDefaultEngagement()', () => {
  it('should return engagement with identity tag match', async () => {
    // Setup: mock listEngagements to return 2 rows, first one has sme-mart.engagement.* tag
    const mockEngagement = makeEngagementSummaryRow({
      id: 'eng-001',
      tag: { id: 'tag-001', name: 'sme-mart.engagement.w3geekery' }
    });
    
    // Mock platformClient.getProjectApi().list() to return the engagement
    service['listEngagements'] = vi.fn().mockResolvedValue({
      items: [mockEngagement],
      pageSize: 10,
      pageNumber: 1,
    });

    const result = await service.getDefaultEngagement('org-001');

    expect(result).toEqual(mockEngagement);
  });

  it('should return null if no engagement found', async () => {
    service['listEngagements'] = vi.fn().mockResolvedValue({
      items: [],
      pageSize: 10,
      pageNumber: 1,
    });

    const result = await service.getDefaultEngagement('org-nonexistent');

    expect(result).toBeNull();
  });

  it('should recognize dual-namespace engagement tags (sme-mart.engagement.* AND sme-mart.eng.*)', async () => {
    // Verify that both tag namespaces are accepted
    const legacyEngagement = makeEngagementSummaryRow({
      id: 'eng-legacy',
      tag: { id: 'tag-legacy', name: 'sme-mart.eng.legacy-namespace' }
    });

    service['listEngagements'] = vi.fn().mockResolvedValue({
      items: [legacyEngagement],
      pageSize: 10,
      pageNumber: 1,
    });

    const result = await service.getDefaultEngagement('org-001');

    expect(result).toEqual(legacyEngagement);
  });
});

describe('getProjectTierProject()', () => {
  it('should return project tier child by parent engagement ID', async () => {
    const mockProjectTier = {
      id: 'proj-tier-001',
      name: 'ZeroBias Platform',
      parentId: 'eng-001',
      tagId: '420b0753-e72c-4b81-8929-70508a119bf0', // SME_MART_TIER_PROJECT_TAG_ID
    };

    // Mock platformClient.getProjectApi().list() with parentId + tagId filters
    (mockClientApi.platformClient.getProjectApi() as any).list.mockResolvedValue({
      items: [mockProjectTier],
      pageSize: 10,
      pageNumber: 1,
    });

    const result = await service.getProjectTierProject('eng-001');

    expect(result).toEqual(mockProjectTier);
    expect((mockClientApi.platformClient.getProjectApi() as any).list)
      .toHaveBeenCalledWith(
        1, 10, undefined, undefined, 'eng-001',
        '420b0753-e72c-4b81-8929-70508a119bf0'
      );
  });

  it('should return null if no project tier child found', async () => {
    (mockClientApi.platformClient.getProjectApi() as any).list.mockResolvedValue({
      items: [],
      pageSize: 10,
      pageNumber: 1,
    });

    const result = await service.getProjectTierProject('eng-001');

    expect(result).toBeNull();
  });
});
```

**Anti-patterns:**
- Do NOT test the tag-matching logic in isolation — the predicate lives in `getDefaultEngagement` itself, so test the service method, not the helper
- Do NOT mock `transformPlatformProjectToEngagementSummary` — use real fixtures (see `makeEngagementSummaryRow` factory)
- Do NOT skip the dual-namespace test — errata 030 makes this mandatory

---

### `src/app/core/services/platform-engagement-provisioner.service.ts` (re-export)

**Analog:** Self (existing file, lines 1-19)

**Current state** (lines 1-19):
```typescript
// Step A: engagement-tag values (D-25, D-26, D-27)
const TAG_TYPE = 'marketplace';
const PLATFORM_SUPPLY_SLUG = 'zerobias';
const MARKETPLACE_OPERATOR_ORG_ID = 'cd7105df-523d-5392-9f9a-3f83d3f30107'; // W3Geekery

// Tier-identity tag bootstrap UUIDs (created once per env; cached as constants).
// UAT values validated empirically 2026-05-12. ci/prod: TBD — see BACKLOG TIER-TAG-ENV-BOOTSTRAP-1.
// Per D-50 canonical tier mapping: depth 2 = Project tier (FIXED), tag = sme-mart.tier.project.
const SME_MART_TIER_PROJECT_TAG_ID = '420b0753-e72c-4b81-8929-70508a119bf0'; // UAT

// Step C: engagement-project values (D-32, D-33)
const ENGAGEMENT_PROJECT_NAME_TEMPLATE = (orgName: string) => `${orgName} <- ZeroBias`;
const ENGAGEMENT_PROJECT_DESCRIPTION_TEMPLATE = (orgName: string) =>
  `Platform Services Engagement: ZeroBias ➡️ ${orgName}`;

// Step D: project-tier values (depth 2; FIXED per D-50; locked verbiage D-34/D-35)
const PROJECT_TIER_NAME = 'ZeroBias Platform';
const PROJECT_TIER_DESCRIPTION_TEMPLATE = (orgName: string) =>
  `${orgName}'s gateway into ZeroBias — tasks, notes, and communication tied to the ZeroBias ➡️ ${orgName} platform engagement live here.`;
```

**Phase 30 modification (one-liner export at end of file, after all local consts)**:
```typescript
// Re-export SME_MART_TIER_PROJECT_TAG_ID from new constants file for caller stability
// (engagements.service and feature-coming-soon need this constant)
export { SME_MART_TIER_PROJECT_TAG_ID } from '../constants/tier-tags';
```

**Touch-It-Fix-It note:** When re-exporting, check if any of the lines 1-19 above violate modernization rules. If this file is touched for the re-export, fix any violations (e.g., if there are older patterns) as part of the same commit.

**Anti-patterns:**
- Do NOT rename `SME_MART_TIER_PROJECT_TAG_ID` in the provisioner — keep it as-is for caller stability
- Do NOT move ALL constants to the new `tier-tags.ts` — only hoist the one that's now shared (multi-consumer)
- Do NOT create a side-by-side duplicate constant — one source of truth only

---

### `src/app/app.routes.ts` (modify routes)

**Analog:** Existing routes file (lines 1-100)

**Current `/projects` route** (line 52):
```typescript
// Projects board placeholder (Phase 30 will replace with full board)
{ path: 'projects', component: ComingSoon, data: { title: 'Projects' } },
```

**Phase 30 change** (replace line 52):
```typescript
{ path: 'projects', component: DefaultProjectBoardComponent },
```

Or lazy-loaded variant (if board imports non-trivial sub-components):
```typescript
{
  path: 'projects',
  loadComponent: () =>
    import('./default-project-board/default-project-board.component').then(m => m.DefaultProjectBoardComponent),
},
```

**Three placeholder sibling routes** (add after `/projects`, before legacy redirects):
```typescript
{ path: 'projects', component: DefaultProjectBoardComponent },
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
// Legacy redirects (unchanged)
{ path: 'engagements', redirectTo: 'rfps', pathMatch: 'full' },
```

**Import statements** (add at top of routes file):
```typescript
import { DefaultProjectBoardComponent } from './default-project-board/default-project-board.component';
import { FeatureComingSoonComponent } from './default-project-board/feature-coming-soon.component';
```

**Anti-patterns:**
- Do NOT mount the 3 placeholder routes inside a lazy-loaded children array — keep them as top-level siblings under AppShell
- Do NOT use `routerLink` to redirect `/projects` — use route entries
- Do NOT add route guards to the placeholder routes (they inherit `onboardingGuard` from AppShell parent)

---

## Shared Patterns (Cross-Cutting)

### Angular 21 Modernization (Mandatory on All New/Modified Components)

**Source:** CLAUDE.md MODERNIZATION_GUIDE.md + linting rules in `eslint.config.js`

**Apply to:** All component files in Phase 30

**Patterns (non-negotiable):**

1. **Signal-based inputs** — use `input()` NOT `@Input()` decorator:
   ```typescript
   // ✓ CORRECT
   readonly title = input<string>('');
   
   // ✗ WRONG
   @Input() title: string = '';
   ```

2. **Field-level `inject()`** — no constructor DI:
   ```typescript
   // ✓ CORRECT
   private readonly snackBar = inject(MatSnackBar);
   
   // ✗ WRONG
   constructor(private snackBar: MatSnackBar) {}
   ```

3. **Control-flow templates** — use `@if` / `@for` / `@switch`:
   ```html
   <!-- ✓ CORRECT -->
   @if (loading()) { <mat-progress-spinner /> }
   @else { <div>{{ content() }}</div> }
   
   <!-- ✗ WRONG -->
   <mat-progress-spinner *ngIf="loading" />
   <div *ngIf="!loading">{{ content }}</div>
   ```

4. **Track expressions on `@for`** — always include `track`:
   ```html
   <!-- ✓ CORRECT -->
   @for (item of items(); track item.id) { ... }
   
   <!-- ✗ WRONG -->
   @for (item of items()) { ... }
   ```

5. **No `CommonModule`** — standalone components use built-in directives:
   ```typescript
   // ✓ CORRECT
   standalone: true,
   imports: [MatCardModule, MatIconModule, ZbEmptyStateContainerComponent],
   
   // ✗ WRONG
   standalone: true,
   imports: [CommonModule, MatCardModule],
   ```

6. **File naming** — keep type suffixes:
   ```
   ✓ default-project-board.component.ts
   ✓ feature-coming-soon.component.ts
   
   ✗ default-project-board.ts (dropped suffix)
   ```

**Verification:** Pre-commit hook runs `npm run lint` on staged files. All violations must be fixed before commit (no `--no-verify` bypass without explicit authorization).

---

### Theme Awareness (CSS Variable Binding)

**Source:** CLAUDE.md § "Theme Awareness Directive" + DESIGN.md token mappings (UI-SPEC.md lines 59–100)

**Apply to:** All SCSS files in Phase 30 components

**Mandatory rule:** Never hardcode hex values. Bind to theme variables.

**Correct patterns:**

```scss
// ✓ Color tokens via CSS variables
.engagement-header {
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
}

.project-body {
  background-color: var(--mat-sys-surface-container);
  color: var(--mat-sys-on-surface);
}

.placeholder-card {
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: 8px;
  padding: 16px;
  
  &:hover {
    background-color: var(--mat-sys-primary-container);
  }
  
  mat-icon {
    color: var(--mat-sys-primary);
  }
}

// ✓ Material elevation via CSS variable
box-shadow: var(--zb-elevation-2, 0 4px 12px rgba(0, 0, 0, 0.08));
```

**Anti-patterns:**

```scss
// ✗ Hardcoded hex literals (BLOCK AT CODE REVIEW)
.header {
  background: #f5faff;   // WRONG — must be var(--mat-sys-surface)
  color: #171c20;        // WRONG — must be var(--mat-sys-on-surface)
}

// ✗ Sass variables for theme values (defeats runtime theme switching)
$primary: #00658d;
.btn { color: $primary; }

// ✗ Inline style with hex values
<div style="color: #00658d">Text</div>

// ✗ Material component theme override (let Material's defaults apply)
mat-card {
  --mdc-theme-primary: #00658d;  // WRONG — Material auto-applies via mat.theme()
}
```

**Verification:** Code review checks for any `#[0-9a-f]{6}` patterns in component SCSS files. If hex appears, it must be either:
1. In a comment / doc string (allowed)
2. In this PATTERNS.md spec document (reference only, allowed)
3. In `DESIGN.md` canonical hex-to-token reference (allowed)

---

### Error Handling & Logging Pattern

**Source:** Home component (lines 47–60) + EngagementsService (lines 94–144)

**Apply to:** All async operations in DefaultProjectBoardComponent

**Pattern:**

```typescript
async loadData() {
  try {
    // Concurrent reads for engagement + project tier
    const [engagement, project] = await Promise.all([
      this.engagements.getDefaultEngagement(this.orgId),
      this.engagements.getProjectTierProject(engagementId), // await engagement first
    ]);
    
    this.engagement.set(engagement);
    this.projectTier.set(project);
  } catch (err) {
    // Log operational context (not full stack to console)
    console.warn('[DEFAULT_PROJECT_BOARD:LOAD_FAILURE]', {
      stage: 'engagement' | 'project-tier',
      error: (err as Error).message,
    });
    
    // Show user-friendly toast
    this.snackBar.open('Failed to load default project — please retry', 'Dismiss', {
      duration: 5000,
    });
  } finally {
    this.loading.set(false);
  }
}
```

**Defensive null-check states (G5 lock):**

```typescript
// After successful read, check for null returns (missing tier or engagement)
if (engagement === null) {
  console.warn('[DEFAULT_PROJECT_BOARD:MISSING_DEFAULT_ENGAGEMENT]', { orgId });
  this.error.set('Default engagement is missing. Please contact support.');
  return;
}

if (projectTier === null) {
  console.warn('[DEFAULT_PROJECT_BOARD:MISSING_PROJECT_TIER]', { orgId, engagementId: engagement.id });
  this.error.set('Project tier not yet provisioned. Please contact support.');
  return;
}
```

---

## No Analog Found

No files in this phase lack a pattern; all leverage existing Angular 21 conventions or hoisting patterns.

---

## Metadata

**Analog search scope:** `src/app/pages/`, `src/app/shared/components/`, `src/app/core/services/`, `src/app/core/constants/`

**Files scanned:** 180+ (components, services, specs, constants)

**Pattern extraction date:** 2026-05-12

**Modernization enforcement:** Phase 27.5 (lint gate active; all new files subject to modernization rules)

**Theme system:** Material Design 3 via `@zerobias-org/ngx-library` theme service + CSS custom properties

---

**Pattern mapping complete. Ready for planning phase.**
