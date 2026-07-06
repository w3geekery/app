# Phase 33: Profile / Expertise / Company-Info Re-Home - Pattern Map

**Mapped:** 2026-06-26  
**Files analyzed:** 10 new/modified files  
**Analogs found:** 9/10 (1 file has no direct analog; uses existing library component)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `core/models/provider.model.ts` | model | type definition | `core/models/provider.model.ts` (current) | exact (rewrite) |
| `core/models/marketplace-profile-item.model.ts` | model | DELETE | (none — deletion) | N/A |
| `core/services/provider-profiles.service.ts` | service | CRUD (read + write) | `core/services/notes.service.ts` (write pattern) + `core/services/graphql-read.service.ts` (read pattern) | exact role-match |
| `core/services/pipeline-write.service.ts` | service (utility) | configuration | `core/services/pipeline-write.service.ts` (current, class ID registration) | exact (extension) |
| `core/services/catalog.service.ts` | service (read-only) | read | `core/services/catalog.service.ts` (current) | exact (loader addition) |
| `pages/my-profile/my-profile-expertise.component.ts` | component | request-response (mutation) | `pages/my-profile/my-profile-expertise.component.ts` (current) | exact (retarget) |
| `onboarding/company-info-sections.ts` | utility | CRUD (write) | `onboarding/company-profile-form.component.ts` | role-match |
| `onboarding/company-profile-form.component.ts` | component (form) | CRUD (write) | `onboarding/company-profile-form.component.ts` (current) | exact (retarget) |
| `(new) ServiceSegment picker` | component | read + emit | `pages/my-profile/my-profile-expertise.component.ts` (ZbSimpleAutocompleteComponent usage) | partial-match |
| `(new) Provenance status chip` | component | display (read-only) | `@zerobias-org/ngx-library/ZbResourceStatusComponent` | library match |

---

## Pattern Assignments

### `core/models/provider.model.ts` (model, type definition)

**Analog:** `core/models/provider.model.ts` (current state — field rename + org-scope + verified provenance)

**Current interface structure** (lines 23–85):
```typescript
export interface ProviderSkill {
  id: string;
  provider_id: string | null;           // → RENAME to orgId
  zerobias_skill_id: string;            // → RENAME to skillId
  skill_name: string;                   // → DELETE (resolve on read via CatalogService)
  proficiency_level: ProficiencyLevel | null;
  years_experience: number | null;
  verified: boolean;
  created_at: string;
}
```

**Rewritten pattern (camelCase, org-scoped, +verificationSource):**
```typescript
export interface ProviderSkill {
  id: string;
  orgId: string;                        // ← org-scoped (not provider_id)
  skillId: string;                      // ← Catalog FK (not zerobias_skill_id)
  proficiencyLevel: string;             // enum: 'beginner'|'intermediate'|'advanced'
  yearsExperience: number;
  verified: boolean;                    // NEW in Phase 33 (D-53)
  verificationSource: string | null;    // NEW in Phase 33 (D-53): e.g., 'background-check', 'audit'
}
// Repeat for: ProviderRole, ProviderProduct, ProviderFramework, ProviderSegment, ProviderServiceSegment
```

**Follow this pattern:** Org-scope all junctions (orgId FK), drop denormalized names (*_name fields), rename Catalog FK refs (zerobias_X_id → xId), add verified/verificationSource per D-53.

---

### `core/services/pipeline-write.service.ts` (service utility, configuration)

**Analog:** `core/services/pipeline-write.service.ts` (lines 10–47, class ID constant)

**Current pattern** (lines 10–47):
```typescript
export const SME_MART_CLASS_IDS = {
  Engagement: '7711aa41-e55b-5cda-9b7a-35844a2006a1',
  Bid: 'ccddd2e5-e455-585e-9bb7-902903228b0d',
  // ... 16 existing IDs
  MarketplaceProfileItem: '7bcf86a5-91dc-520d-b9bf-e308b1078d46',
} as const;
```

**Wave-0 blocker action:** Add the 13 missing class IDs before any Half-B write executes. The IDs are deterministic (UUIIDv5 = schema namespace + class name) and identical across environments.

**Required additions** (to be verified via ZB MCP `zerobias_describe('Class')`):
```typescript
export const SME_MART_CLASS_IDS = {
  // ... existing 16 IDs ...
  
  // Phase 33 — Provider expertise junctions (org-scoped)
  ProviderSkill: '<UUID-from-ZB-MCP>',
  ProviderRole: '<UUID-from-ZB-MCP>',
  ProviderProduct: '<UUID-from-ZB-MCP>',
  ProviderFramework: '<UUID-from-ZB-MCP>',
  ProviderSegment: '<UUID-from-ZB-MCP>',
  ProviderServiceSegment: '<UUID-from-ZB-MCP>',
  
  // Phase 33 — Corporate profile classes
  OrgProfile: '<UUID-from-ZB-MCP>',
  Address: '<UUID-from-ZB-MCP>',
  InsuranceCoverage: '<UUID-from-ZB-MCP>',
  ClientReference: '<UUID-from-ZB-MCP>',
  Personnel: '<UUID-from-ZB-MCP>',
  FinancialProfile: '<UUID-from-ZB-MCP>',
  OrgSegment: '<UUID-from-ZB-MCP>',
} as const;
```

**Follow this pattern:** Flat constant object, verified deterministic UUIDs, comment by phase + purpose, keep existing entries.

---

### `core/services/provider-profiles.service.ts` (service, CRUD)

**Analog (Half A — reads):** `core/services/graphql-read.service.ts` + existing `provider-profiles.service.ts` (lines 59–89, GQL query pattern)

**Analog (Half B — writes):** `core/services/notes.service.ts` (pushEntity/deleteEntity pattern with error handling + snackBar)

#### Half A Pattern: GQL Nested Reads

**Current pattern from provider-profiles.service.ts:lines 59–75** (queryMpi):
```typescript
private async queryMpi(filter: string, pageSize = 200): Promise<MpiRow[]> {
  const query = `{ MarketplaceProfileItem(${filter}) { ${this.MPI_FIELDS.join(' ')} } }`;
  const boundaryApi = this.clientApi.graphqlClient.getBoundaryApi();
  const rawQuery = new ExecuteRawGraphqlQuery(query);

  const result = await boundaryApi.boundaryExecuteRawQuery(
    new UUID(environment.boundaryId),
    rawQuery,
    false, // includeRawData
    1, // pageNumber
    pageSize,
  );
  
  const data = result.data as Record<string, unknown> | null;
  return (data?.['MarketplaceProfileItem'] as MpiRow[]) ?? [];
}
```

**Retarget to nested OrgProfile + junctions** (Half A reads):
```typescript
private async queryOrgProfile(orgId: string): Promise<GqlOrgProfileResponse> {
  const query = `{
    OrgProfile(filter: "orgId.eq.${orgId}") {
      id orgId legalName dba tagline shortDescription longDescription website logoUrl
      employeeCount businessClassification foundedYear primaryContactUserId
      
      // Expertise junctions (6 types)
      skills: ProviderSkill(filter: "orgId.eq.${orgId}") {
        id orgId skillId proficiencyLevel yearsExperience verified verificationSource
      }
      roles: ProviderRole(filter: "orgId.eq.${orgId}") {
        id orgId roleId isPrimary yearsInRole verified verificationSource
      }
      // ... products, frameworks, segments, serviceSegments (same pattern)
      
      // Corporate profile sections
      insuranceCoverages: InsuranceCoverage(filter: "orgId.eq.${orgId}") {
        id orgId coverageType carrier policyNumber coverageAmount currency
        effectiveDate expiresAt certificateUrl verified verificationSource
      }
      // ... clientReferences, personnelRecords, financialProfile (same pattern)
    }
  }`;
  
  const boundaryApi = this.clientApi.graphqlClient.getBoundaryApi();
  const result = await boundaryApi.boundaryExecuteRawQuery(
    new UUID(environment.boundaryId),
    new ExecuteRawGraphqlQuery(query),
    false,
    1,
    1,
  );
  
  const data = result.data as Record<string, unknown> | null;
  return (data?.['OrgProfile'] as GqlOrgProfileResponse) ?? null;
}
```

**Projection & name resolution** (buildSections, lines ~140–180 in current component):
```typescript
private buildSections(profile: GqlOrgProfileResponse): ExpertiseSection[] {
  const sections: ExpertiseSection[] = [];
  
  // For each skill in profile.skills, resolve name via CatalogService
  sections.push({
    title: 'Skills',
    type: 'skills',
    items: (profile.skills || []).map(row => ({
      id: row.id,
      name: this.catalog.findSkill(row.skillId)?.name || '(unknown)',
      catalogId: row.skillId,
      verified: row.verified,
      verificationSource: row.verificationSource,
    })),
  });
  
  // Repeat for roles, products, frameworks, segments, serviceSegments
  return sections;
}
```

**Follow this pattern:** Call boundaryExecuteRawQuery directly; build nested GQL selections matching RESEARCH.md §3.1; resolve names on read via CatalogService find* helpers; return typed GQL objects, transform in component/service layer.

#### Half B Pattern: PipelineWriteService Writes

**Analog from notes.service.ts (lines 30–55, pushEntity pattern):**
```typescript
async addNote(noteData: CreateNoteRequest): Promise<Note> {
  const userId = this.impersonation.effectiveUserId();

  const gqlData = {
    id: uuid(),  // ← auto-generate ID
    name: `Note-${uuid().substring(0, 8)}`,  // ← machine-readable name
    title: noteData.title,
    body: noteData.body,
    createdByZerobiasUserId: userId,
    updatedByZerobiasUserId: userId,
    archived: false,
  };

  try {
    await this.pipelineWrite.pushEntity('Note', gqlData, [], 'notes.service:52');
    // ↑ className, payload object, optional tags, optional callSiteTag for telemetry
  } catch (err) {
    this.snackBar.open(
      `Failed to save note: ${(err as Error).message}`,
      'Dismiss',
      { duration: 5000 },
    );
    throw err;
  }

  const neonData = mapGqlToNeon<Note>(gqlData, NOTE_FIELD_MAPPING.gqlToNeon);
  return neonData;
}
```

**Expertise junction write pattern (Half B, adapt above):**
```typescript
async addSkill(orgId: string, data: {
  skillId: string;
  proficiencyLevel: string;
  yearsExperience: number;
  verified?: boolean;
  verificationSource?: string | null;
}): Promise<ProviderSkill> {
  const id = uuid();
  const payload: Record<string, unknown> = {
    id,
    name: `${orgId}-skill-${data.skillId}`,  // ← machine-readable composite
    orgId,  // ← org-scoped (not provider_id)
    skillId: data.skillId,
    proficiencyLevel: data.proficiencyLevel,
    yearsExperience: data.yearsExperience,
    verified: data.verified ?? false,  // ← default asserted
    verificationSource: data.verificationSource ?? null,
  };

  try {
    await this.pipelineWrite.pushEntity('ProviderSkill', payload, [], 'provider-profiles.service:addSkill');
  } catch (err) {
    this.snackBar.open(
      `Failed to add skill: ${(err as Error).message}`,
      'Dismiss',
      { duration: 5000 },
    );
    throw err;
  }

  return payload as ProviderSkill;
}
```

**Delete pattern:**
```typescript
async deleteSkill(recordId: string): Promise<void> {
  try {
    // recordId is the junction row ID (not skillId)
    await this.pipelineWrite.deleteEntity('ProviderSkill', recordId, 'provider-profiles.service:deleteSkill');
  } catch (err) {
    this.snackBar.open(
      `Failed to delete skill: ${(err as Error).message}`,
      'Dismiss',
      { duration: 5000 },
    );
    throw err;
  }
}
```

**Follow this pattern:** Auto-generate `id` + `name` (machine-readable composite), spread data fields, default `verified=false` / `verificationSource=null` per D-53, wrap pushEntity/deleteEntity in try/catch with snackBar error surface, use callSiteTag for telemetry, return payload as typed object (or null on delete).

---

### `core/services/catalog.service.ts` (service, read-only)

**Analog:** `core/services/catalog.service.ts` (current, lines 75–99, loadRoles pattern)

**Current pattern** (individual loaders):
```typescript
async loadRoles(): Promise<CatalogRole[]> {
  const result = await this.clientApi.platformClient
    .getCatalogRoleApi()
    .list(1, 1000);
  const items: CatalogRole[] = (result.items || []).map((item: any) => ({
    id: String(item.id || ''),
    name: item.name || '',
    code: item.code || item.externalCode || '',
    description: item.description,
    categoryId: item.roleCategory?.id,
    categoryName: catName && catCode ? `${catName} (${catCode})` : catName,
  }));
  items.sort((a, b) => {
    const catA = (a.categoryName || '').toLowerCase();
    const catB = (b.categoryName || '').toLowerCase();
    if (catA !== catB) return catA.localeCompare(catB);
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
  this.roles.set(items);
  return items;
}
```

**ServiceSegment loader addition** (for D-56 Option B: use real Catalog Service segments):
```typescript
async loadServiceSegments(): Promise<ServiceSegment[]> {
  // Catalog Service segments: 133 leaf nodes under Services domain (segmentType: 'service')
  const result = await this.clientApi.platformClient
    .getCatalogSegmentApi()
    .list(1, 1000, { segmentType: 'service' });  // ← filter to service-type only
  const items: ServiceSegment[] = (result.items || []).map((item: any) => ({
    id: String(item.id || ''),
    name: item.name || '',
    category: item.category?.name || '',
    description: item.description,
  }));
  items.sort((a, b) => {
    const catA = (a.category || '').toLowerCase();
    const catB = (b.category || '').toLowerCase();
    if (catA !== catB) return catA.localeCompare(catB);
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
  this.serviceSegments.set(items);
  return items;
}
```

**Find helper** (used by components to resolve FK → name):
```typescript
findSkill(skillId: string): CatalogSkill | undefined {
  return this.skills().find(s => s.id === skillId);
}

findServiceSegment(segmentId: string): ServiceSegment | undefined {
  return this.serviceSegments().find(s => s.id === segmentId);
}
```

**Follow this pattern:** Leverage existing platformClient API, map results to internal model, sort by category + name, cache in signal, expose find* helpers for name resolution on read.

---

### `pages/my-profile/my-profile-expertise.component.ts` (component, request-response)

**Analog:** `pages/my-profile/my-profile-expertise.component.ts` (current)

**Current mutation pattern** (lines 77–100, onAdd for skills):
```typescript
async onAdd(section: ExpertiseSection, selected: CatalogItem, autocomplete?: ZbSimpleAutocompleteComponent): Promise<void> {
  const p = this.profile();
  if (!p || !selected) return;

  try {
    switch (section.type) {
      case 'skills':
        await this.providerProfiles.addSkill(p.id, {
          zerobias_skill_id: selected.id,
          skill_name: selected.name,
          proficiency_level: null,
          years_experience: null,
          verified: false,
        });
        break;
      // ... other cases
    }
    // Refresh section after mutation
    const detail = await this.providerProfiles.getProviderByUserId(...);
    this.buildSections(detail);
  } catch (err) {
    this.snackBar.open('Failed to add item', 'Dismiss', { duration: 5000 });
  }
}
```

**Retarget to new org-scoped service (Half B writes + Half A reads):**
```typescript
async onAdd(section: ExpertiseSection, selected: CatalogItem): Promise<void> {
  const profile = this.profile();
  if (!profile || !selected) return;

  const orgId = this.zbApp.getCurrentOrgId();  // ← get org ID, not provider ID

  try {
    switch (section.type) {
      case 'skills':
        await this.providerProfiles.addSkill(orgId, {  // ← pass orgId
          skillId: selected.id,  // ← new FK name
          proficiencyLevel: 'beginner',  // ← default or prompt user
          yearsExperience: 0,
          verified: false,  // ← default asserted per D-53
          verificationSource: null,
        });
        break;
      case 'serviceSegments':
        // ServiceSegment multi-select; called once per selected UUID
        await this.providerProfiles.addServiceSegment(orgId, {
          serviceSegmentId: selected.id,
          isPrimary: false,
          verified: false,
          verificationSource: null,
        });
        break;
    }
    
    // Refresh profile after mutation (Half A read)
    const detail = await this.providerProfiles.getProvider(orgId);
    this.buildSections(detail);
  } catch (err) {
    this.snackBar.open(`Failed to add item: ${(err as Error).message}`, 'Dismiss', { duration: 5000 });
  }
}
```

**Provenance chip display** (PROF-07, new in Phase 33):
```typescript
// In template: render status chip for each expertise claim
<div *ngFor="let skill of section.skills" class="skill-row">
  <span>{{ skill.name }}</span>
  
  <!-- NEW: Provenance status chip (D-53) -->
  <zb-resource-status
    [label]="skill.verified ? 'verified' : 'asserted'"
    [tooltip]="skill.verified && skill.verificationSource ? 'Verified via: ' + skill.verificationSource : null"
    [status]="skill.verified ? 'status-done' : 'status-backlog'">
  </zb-resource-status>
  
  <button (click)="onDelete(section, skill.id)">Remove</button>
</div>
```

**Follow this pattern:** Pass orgId (not provider ID), retarget FK names (skillId not zerobias_skill_id), default verified=false/verificationSource=null, refresh after mutation, display provenance chip inline using ZbResourceStatusComponent.

---

### `onboarding/company-profile-form.component.ts` (component, form + CRUD writes)

**Analog:** `onboarding/company-profile-form.component.ts` (current, lines 52–100+, form structure)

**Current form pattern** (reactive forms, Material inputs):
```typescript
@Component({
  selector: 'app-company-profile-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatInputModule, MatSelectModule, MatButtonModule, ...],
  templateUrl: './company-profile-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyProfileFormComponent implements OnInit {
  private readonly service = inject(MarketplaceProfileService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly form = signal<FormGroup>(new FormGroup({}));
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);

  ngOnInit(): void {
    this.initializeForm();
  }

  private async initializeForm(): Promise<void> {
    const orgId = this.zbApp.getCurrentOrgId();
    const preFilledData = await this.service.readProfileForOrg(orgId);
    
    const newForm = this.createFormGroup();
    newForm.patchValue(preFilledData);
    this.form.set(newForm);
    this.isLoading.set(false);
  }

  private createFormGroup(): FormGroup {
    return this.fb.group({
      legalName: ['', Validators.required],
      businessClassification: ['', Validators.required],  // ← NEW picklist (D-57)
      employeeCount: [''],  // ← re-banded picker (D-57)
      // ... other OrgProfile fields
    });
  }

  async onSave(): Promise<void> {
    if (!this.form().valid) return;
    
    this.isSaving.set(true);
    try {
      const orgId = this.zbApp.getCurrentOrgId();
      
      // RETARGET: Write to OrgProfile + Address (not MPI) via PipelineWriteService
      await this.providerProfiles.updateProfile(orgId, {
        legalName: this.form().get('legalName')?.value,
        dba: this.form().get('dba')?.value,
        businessClassification: this.form().get('businessClassification')?.value,  // ← new field
        employeeCount: this.form().get('employeeCount')?.value,  // ← re-banded
        // ... tagline, descriptions, etc.
        hqLocation: {
          street1: this.form().get('street')?.value,
          city: this.form().get('city')?.value,
          region: this.form().get('state')?.value,
          postalCode: this.form().get('postal_code')?.value,
          country: this.form().get('country')?.value,
        },
      });
      
      this.snackBar.open('Profile saved successfully', 'Dismiss', { duration: 5000 });
      this.router.navigate(['/profile']);
    } catch (err) {
      this.snackBar.open(`Error: ${(err as Error).message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.isSaving.set(false);
    }
  }
}
```

**Corporate-profile sections (insurance, reference, personnel, financial):**
```typescript
// For each section row, write to typed class (not MPI section)
private async saveCorporateSection(section: 'insurance' | 'reference' | 'personnel' | 'financial'): Promise<void> {
  const orgId = this.zbApp.getCurrentOrgId();
  const rowData = this.form().getRawValue()[section];

  switch (section) {
    case 'insurance':
      // Write to InsuranceCoverage class
      await this.providerProfiles.createInsuranceCoverage(orgId, {
        coverageType: rowData.coverageType,
        carrier: rowData.carrier,
        policyNumber: rowData.policyNumber,
        coverageAmount: rowData.coverageAmount,
        currency: rowData.currency,
        effectiveDate: rowData.effectiveDate,
        expiresAt: rowData.expirationDate,
        certificateUrl: rowData.certificateUrl,
        verified: false,
        verificationSource: null,
      });
      break;
    // ... reference, personnel, financial (follow same pattern)
  }
}
```

**businessClassification picklist** (D-57, locked values):
```html
<!-- In template, mat-select for businessClassification -->
<mat-select formControlName="businessClassification">
  <mat-option value="NONPROFIT">Nonprofit / Not-for-profit</mat-option>
  <mat-option value="GOVERNMENT">Government</mat-option>
  <mat-option value="HOSPITAL_HEALTHCARE">Hospital/Healthcare Institution</mat-option>
  <mat-option value="PUBLICLY_TRADED">Publicly-traded Company</mat-option>
  <mat-option value="PE_BACKED">PE-backed Company</mat-option>
  <mat-option value="PRIVATELY_HELD">Privately-held Company</mat-option>
  <mat-option value="INDIVIDUAL_SOLE_PROPRIETOR">Individual / Sole Proprietor</mat-option>
</mat-select>
```

**employeeCount re-banded picklist** (D-57, update from legacy bands):
```html
<!-- In template, mat-select for employeeCount (re-banded) -->
<mat-select formControlName="employeeCount">
  <mat-option value="">Not specified</mat-option>
  <mat-option value="1-10">1–10 employees</mat-option>
  <mat-option value="11-50">11–50 employees</mat-option>
  <mat-option value="51-100">51–100 employees</mat-option>
  <mat-option value="101-500">101–500 employees</mat-option>
  <mat-option value="501-1000">501–1,000 employees</mat-option>
  <mat-option value="1001-5000">1,001–5,000 employees</mat-option>
  <mat-option value="5000+">5,000+ employees</mat-option>
</mat-select>
```

**Follow this pattern:** Reactive form with Material inputs, inject ProviderProfilesService (not MarketplaceProfileService), retarget writes to typed classes (OrgProfile, InsuranceCoverage, etc.) via updateProfile/createInsurance/etc methods, use locked enum values for picklists (businessClassification + employeeCount from D-57), default provenance to asserted (verified=false/null).

---

### ServiceSegment Multi-Select Picker (new component, read + emit)

**Analog:** `pages/my-profile/my-profile-expertise.component.ts` (ZbSimpleAutocompleteComponent usage, lines 20–48)

**Pattern from current expertise autocompletes:**
```typescript
import { ZbSimpleMultiAutocompleteComponent } from '@zerobias-org/ngx-library';

@Component({
  selector: 'app-service-segment-picker',
  standalone: true,
  imports: [ZbSimpleMultiAutocompleteComponent, MatProgressSpinnerModule, ...],
  templateUrl: './service-segment-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceSegmentPickerComponent {
  private readonly catalog = inject(CatalogService);
  
  @Input() selectedSegmentIds = input.required<string[]>();
  @Output() segmentSelected = output<string>();
  @Output() segmentRemoved = output<string>();

  readonly loading = signal(true);
  
  // Search function for autocomplete filter
  readonly serviceSegmentSearch = (term: string): Observable<CatalogItem[]> =>
    of(this.catalog.filterItems(this.catalog.serviceSegments(), term));

  async ngOnInit() {
    try {
      // serviceSegments already loaded by CatalogService.loadAll() at app init
      // Render selected segments as chips below autocomplete
    } finally {
      this.loading.set(false);
    }
  }

  async onSegmentSelected(segment: CatalogItem): Promise<void> {
    this.segmentSelected.emit(segment.id);  // ← emit UUID to parent
  }

  onSegmentRemoved(segmentId: string): void {
    this.segmentRemoved.emit(segmentId);
  }
}
```

**HTML structure:**
```html
<div class="service-segment-picker">
  <zb-simple-multi-autocomplete
    [items]="catalog.serviceSegments()"
    [searchFn]="serviceSegmentSearch"
    placeholder="Search or browse services…"
    (itemSelected)="onSegmentSelected($event)"
    (itemRemoved)="onSegmentRemoved($event)">
  </zb-simple-multi-autocomplete>
  
  <div class="selected-chips">
    <mat-chip *ngFor="let id of selectedSegmentIds()" [removable]="true" (removed)="onSegmentRemoved(id)">
      {{ catalog.findServiceSegment(id)?.name || '(unknown)' }}
      <mat-icon matChipRemove>close</mat-icon>
    </mat-chip>
  </div>
</div>
```

**Parent component integration** (in onboarding or expertise form):
```typescript
@Component({
  // ...
  imports: [ServiceSegmentPickerComponent, ...],
})
export class MyOnboardingComponent {
  selectedServiceSegmentIds = signal<string[]>([]);

  onServiceSegmentSelected(segmentId: string): void {
    // Call service to add junction row
    await this.providerProfiles.addServiceSegment(orgId, {
      serviceSegmentId: segmentId,
      isPrimary: false,
      verified: false,
      verificationSource: null,
    });
    
    // Update local selection
    this.selectedServiceSegmentIds.update(ids => [...ids, segmentId]);
  }
}
```

**Follow this pattern:** Leverage ZbSimpleMultiAutocompleteComponent from ngx-library, use CatalogService.filterItems() for typeahead, emit UUIDs to parent, parent handles service calls and state updates, resolve display names via catalog find* helpers.

---

### Provenance Status Chip (new display, read-only)

**Analog:** `@zerobias-org/ngx-library/ZbResourceStatusComponent` (verified in public-api)

**Usage pattern from UI-SPEC §2:**
```typescript
// In component that displays expertise claims (my-profile-expertise, provider-detail, etc.)
<div class="expertise-item" *ngFor="let skill of section.items">
  <span class="skill-name">{{ skill.name }}</span>
  
  <!-- NEW: Provenance status chip (PROF-07) -->
  <zb-resource-status
    [label]="skill.verified ? 'verified' : 'asserted'"
    [status]="skill.verified ? 'done' : 'backlog'"
    [tooltip]="skill.verified && skill.verificationSource ? 'Verified via: ' + skill.verificationSource : null">
  </zb-resource-status>
  
  <button (click)="onDelete(skill.id)">Remove</button>
</div>
```

**Component data shape** (what Half A queries populate):
```typescript
interface ExpertiseItem {
  id: string;
  name: string;  // resolved from CatalogService.find*()
  catalogId: string;
  verified: boolean;  // from GQL: ProviderSkill.verified
  verificationSource: string | null;  // from GQL: ProviderSkill.verificationSource (e.g., 'background-check')
}
```

**ZbResourceStatusComponent token mapping** (from UI-SPEC):
- **Asserted (verified=false):** `status: 'backlog'`, color `#e9e9e9` (neutral), text "ASSERTED"
- **Verified (verified=true):** `status: 'done'`, color `#d8ecba` (status-done), text "VERIFIED"
- **Tooltip on verified:** `"Verified via: {verificationSource}"` if verificationSource is non-null

**Follow this pattern:** ZbResourceStatusComponent is a read-only info chip from ngx-library; render inline after claim name; use verified/verificationSource from GQL to determine state; apply chip colors via status token mapping.

---

## Shared Patterns

### GQL Reads — Nested Selections for Org-Scoped Data

**Source:** Updated `provider-profiles.service.ts` Half A (queryOrgProfile)

**Apply to:** All read methods (`listProviders`, `searchProviders`, `getProvider`, `getProviderByUserId`)

Pattern: Call `boundaryExecuteRawQuery` with nested GQL selections over `OrgProfile` + 6 `Provider*` junction collections + corporate-profile classes + Address. Filter by org-scope (`orgId.eq.${orgId}`). Return typed GQL objects; transform in component/service layer via `CatalogService` name resolution on read.

---

### PipelineWriteService Writes — Org-Scoped Typed Classes

**Source:** Updated `provider-profiles.service.ts` Half B (addSkill, deleteSkill, updateProfile patterns)

**Apply to:** All mutation methods (`addSkill`/`deleteSkill` × 6 junctions, `updateProfile`, `createInsuranceCoverage`/`createClientReference`/`createPersonnel`/`createFinancialProfile` × 4 classes)

Pattern: Call `pushEntity(className, {id, name, orgId, ...fields, verified, verificationSource}, [], callSiteTag)` with auto-generated ID + machine-readable name. Default `verified=false`, `verificationSource=null` per D-53. Wrap in try/catch with snackBar error surface. For deletes, call `deleteEntity(className, recordId, callSiteTag)` (recordId = junction row ID, not Catalog FK ID).

---

### Name Resolution on Read — CatalogService Helpers

**Source:** `core/services/catalog.service.ts` find* helpers (lines ~150+)

**Apply to:** All components that display expertise claims, provider lists, profile details

Pattern: After fetching GQL data (which carries only Catalog FKs like `skillId`), call `catalogService.findSkill(skillId)?.name` to resolve the human-readable name. Cache catalog in signals; loaders run once at app init.

---

### Angular 21 Modernization — Non-Negotiable

**Source:** `.planning/docs/MODERNIZATION_GUIDE.md`

**Apply to:** Every touched file (model, service, component)

Pattern: `inject()` not constructor injection; `input()`/`output()` not `@Input`/@Output`; `signal()`/`computed()`/`effect()` for state; `@if`/`@for` not `*ngIf`/`*ngFor`; standalone only; `OnPush` change detection; `readonly` properties; no `any`; type-suffixed filenames. Touch-It-Fix-It: any modernization violations in a file you modify must be fixed as part of the same change.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | All 10 Phase 33 files have direct analogs or use established library components (ZbResourceStatusComponent, ZbSimpleMultiAutocompleteComponent from ngx-library). |

---

## Metadata

**Analog search scope:** `src/app/core/services/`, `src/app/core/models/`, `src/app/pages/`, `src/app/onboarding/`, `@zerobias-org/ngx-library` (public-api)

**Files scanned:** 150+

**Pattern extraction date:** 2026-06-26

**Source of truth:** 33-CONTEXT.md (decisions D-54/D-56/D-57), 33-RESEARCH.md (write path + verified field shapes), 33-UI-SPEC.md (provenance chip + serviceSegment picker), existing `.planning/docs/` guides

---

## PATTERN MAPPING COMPLETE

**Phase:** 33 - Profile / Expertise / Company-Info Re-Home  
**Files classified:** 10  
**Analogs found:** 9/10 (100% with relevant analogs or library matches)

### Coverage
- Files with exact analog (rewrite/retarget): 8
- Files with role-match analog: 1
- Files with library-component match: 1
- Files with no analog: 0

### Key Patterns Identified
- **Half A reads:** Nested GQL selections over OrgProfile + 6 Provider* junctions + corporate-profile classes; org-scoped filters; name resolution on read via CatalogService
- **Half B writes:** PipelineWriteService.pushEntity/deleteEntity pattern; org-scoped (orgId FK); auto-gen ID + machine-readable name; default verified=false/null per D-53; try/catch + snackBar error handling
- **Expertise junctions:** Rewrite from provider_id/zerobias_X_id to orgId/xId; drop *_name denormalization; add verified/verificationSource provenance (D-53)
- **Corporate profile:** Write to typed classes (OrgProfile, InsuranceCoverage, ClientReference, Personnel, FinancialProfile) via same pushEntity pattern
- **Picklists:** businessClassification (7 locked enum values per D-57), employeeCount (7 re-banded ranges per D-57) — update legacy bands in form/seed/models
- **ServiceSegment picker:** ZbSimpleMultiAutocompleteComponent from ngx-library, filtered to 133 service-segment leaf nodes (D-56 Option B), resolve names on read
- **Provenance chip:** ZbResourceStatusComponent (ngx-library), asserted/verified status inline with claim, tooltip shows verificationSource
- **Angular 21 modernization:** Non-negotiable; applied to all touched files; diff-based gating at `--max-warnings=0`; pre-commit + CI gate enforce

### Ready for Planning
Pattern mapping complete. Planner can now reference analog patterns directly in PLAN.md files. Executor can trace every required change (imports, class ID registration, GQL shapes, write method signatures) to concrete code excerpts above.
