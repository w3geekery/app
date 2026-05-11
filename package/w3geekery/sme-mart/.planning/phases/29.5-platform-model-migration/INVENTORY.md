# Phase 29.5 Platform Model Migration — Inventory

**Audit Date:** 2026-05-11  
**Plan:** 29.5-01  
**Scope:** Codebase partitioning (REWRITE / RECONCILE / KEEP / NOT-TOUCHED), MCP endpoint signatures, demo data dual-read strategy.

---

## Section 1: Codebase Partitioning

Audited 15 core services across the SME Mart app using grep analysis (Engagement / SmeMartProject / EngagementVettingItem references). Services classified into four buckets per D-42.

### Summary

| Disposition | Count | Services |
|---|---|---|
| **REWRITE** | 3 | `engagements.service.ts`, `sme-mart-project.service.ts`, `vetting.service.ts` |
| **RECONCILE** | 1 | `engagement-lifecycle.service.ts` |
| **KEEP** | 7 | `engagement-context.service.ts`, `engagement-hierarchy.service.ts`, `engagement-tasks.service.ts`, `engagement-timeline.service.ts`, `bid-ai.service.ts`, `bids.service.ts`, `rfp-wizard.service.ts` |
| **NOT-TOUCHED** | 4 | `sme-mart-resource.service.ts`, `demo-visibility.service.ts`, `document.service.ts`, `platform-engagement-provisioner.service.ts` |

**Total core engagement-cluster services: 15**  
**Scope estimate:** 3 REWRITE + 1 RECONCILE = 4 high-touch services for Plans 02-04.

---

### REWRITE Services (GQL class retirement required)

#### 1. `engagements.service.ts`

**Location:** `src/app/core/services/engagements.service.ts`  
**References:** Engagement (81 refs), SmeMartProject (2 refs)  
**GQL calls:** 11 direct graphqlRead.query('Engagement', ...) calls

**Disposition:** REWRITE — Core GQL Engagement consumer

**Method swap targets:**
- `listEngagements({ buyerOrgId })` — line 41–77 — swap `graphqlRead.query('Engagement', ...)` → `platformClient.getProjectApi().list({ ownerId: buyerOrgId, tagId-classifier-filter })`
- `searchEngagements(filter)` — line 84–114 — swap GQL filter → platform.Project search (if API supports name search)
- `getEngagement(id)` — line 119–136 — swap to `platformClient.getProjectApi().get(id)`
- `getEngagementRaw(id)` — line 141–150 — dual-read window (GQL fallback for legacy records)

**Transform shape mismatch:**
- `GqlEngagementResponse` carries `buyerZerobiasOrgId`, `status` (string), `dateCreated` (ISO)
- `platform.ProjectExtended` carries `ownerId`, `status` (enum), `memberCount`, `boardCount`, `creator` (Party), `tag` (object)
- Field mapping: `buyerZerobiasOrgId` → `ownerId`; confirm other field mappings in Plan 03

**Demo-visibility integration:**
- `applyVisibility()` post-filter applies to both GQL and platform results
- Confirm filter logic works on new shape (may need adjustment for tag-based identity)

**Test coverage:** 15+ specs depend on this service; requires `ZerobiasClientSessionId` stub (per PATTERNS.md Test Pattern Reference)

---

#### 2. `sme-mart-project.service.ts`

**Location:** `src/app/core/services/sme-mart-project.service.ts`  
**References:** SmeMartProject (42 refs), Engagement (2 refs)  
**GQL calls:** 0 direct calls (uses `graphqlRead.getById` / `graphqlRead.query`)

**Disposition:** REWRITE — Core SmeMartProject consumer (workspace/RFP entity)

**Method swap targets:**
- `createProject(data)` — line 73–100 — swap `pushToGql(project)` (Pipeline.receive) → `platformClient.getProjectApi().create({ name, description, status, visibility: 'internal', membershipPolicy: 'private' })`
- `getProject(id)` — line 105–116 — swap `graphqlRead.getById('SmeMartProject', ...)` → `platformClient.getProjectApi().get(id)` (memoize TTL unchanged)
- `listProjects(options)` — line 121–150 — swap `graphqlRead.query('SmeMartProject', ...)` → `platformClient.getProjectApi().list({ statusFilter?, pageNumber, pageSize })`
- `updateProject(id, data)` — swap to `platformClient.getProjectApi().update(id, data)`

**Field mapping obsolescence:**
- `SME_MART_PROJECT_FIELD_MAPPING` becomes GQL-legacy-only (for dual-read fallback per D-15)
- Platform read returns `ProjectExtended` directly (no Neon→GQL transform needed)

**Touch-It-Fix-It rule applies:**
- File likely has constructor-injection patterns (pre-Phase-27.5); modernize to `inject()` on touch

**Test coverage:** 8+ specs; ZerobiasClientSessionId stub required

---

#### 3. `vetting.service.ts`

**Location:** `src/app/core/services/vetting.service.ts`  
**References:** EngagementVettingItem (31 refs), Engagement (31 refs)  
**GQL calls:** Direct graphqlRead.query('EngagementVettingItem', ...) usage throughout

**Disposition:** REWRITE — Vetting Board paired-task migration

**Method swap targets:**
- `listVettingItems(engagementId)` — line 63–92 — swap `graphqlRead.query('EngagementVettingItem', ...)` → `platformClient.getBoardApi().list({ projectId: engagementId })` for vetting Board + `platformClient.getTaskApi().list({ boardId })` for paired tasks
- `getVettingItem(id)` — swap to `platformClient.getTaskApi().get(id)` (if task-based, per D-12 paired-task shape)
- `createVettingItem()` — swap to `platformClient.getTaskApi().create()` with paired-subtask pattern (parent + subtask per side, per D-12)

**Vetting Board lazy-creation (D-11):**
- Vetting Board is NOT created in provisioning recipe (Step F creates default kanban Board on workspace Project)
- Vetting Board lazy-creation: on first vetting item creation, check if vetting Board exists for engagement Project; if not, call `platformClient.getBoardApi().create({ projectId: engagementProjectId, name: "Vetting", boardType: 'list', isDefault: false })`

**Paired-task shape (D-12, γ pattern):**
- Parent Task: `activityId=<vetting-activity>`, `name="<Requirement>"`, no `boardId` (server defaults to project's default or parent-inherited)
- Subtask 1: `parentId=parent.id`, `assigned=<vendor-party>`, `accountable=<vendor-admin>`
- Subtask 2: `parentId=parent.id`, `assigned=<buyer-party>`, `accountable=<buyer-admin>`
- Single-side requirements: parent task only (no subtasks)
- Smoke test in Plan 06: manually create one paired vetting task; confirm subtasks inherit boardId via server-default chain (D-31)

**Test coverage:** 6+ specs; ZerobiasClientSessionId stub required

---

### RECONCILE Services (existing platform.Task analog, converge implementation)

#### 4. `engagement-lifecycle.service.ts`

**Location:** `src/app/core/services/engagement-lifecycle.service.ts`  
**References:** Engagement (23 refs), SmeMartProject (10 refs)  
**GQL calls:** 0 direct; orchestrates via other services

**Disposition:** RECONCILE — Orchestrator for bid-acceptance → engagement-creation flow

**Current flow (lines 68–120):**
1. Load project (SmeMartProject) + bid
2. Generate engagement tag
3. Create ZeroBias Tag via `hydra.Tag.createTag` (unchanged)
4. Accept bid via `bids.acceptBid()`
5. Create Engagement via `engagements.createEngagement()`
6. Link SmeMartProject to Engagement via `projects.linkToEngagement()`
7. Activate project via `projects.updateProject()`

**New flow (post-29.5):**
1. Load project (now platform.Project) + bid
2. Generate engagement tag (unchanged)
3. Create ZeroBias Tag via `hydra.Tag.createTag` (unchanged — Step A in provisioner)
4. Accept bid (unchanged)
5. Create Engagement Project via `platformClient.getProjectApi().create()` (NEW — direct, not via lifecycle)
   - **NOTE:** Engagement Project creation is typically done by provisioner (Step C); lifecycle service may not create engagement directly. Scope TBD in Plan 02.
6. Link bid/project (if still needed; likely becomes a board/task relationship)
7. Activate workspace project

**Scope ambiguity flagged for Plan 02:**
- Lifecycle service may be downstream consumer (reacts to engagement-project events) OR remain as provisioning-parallel orchestrator
- Decision point: does lifecycle service create engagements, or only transition existing ones?
- Plan 02 planner clarifies orchestration order

**Test coverage:** 3+ specs

---

### KEEP Services (no GQL Engagement/SmeMartProject dependencies, or platform-adjacent already)

#### 5. `engagement-context.service.ts`

**References:** Engagement (6 refs), mostly in type signatures/docstrings  
**Disposition:** KEEP — provides engagement context signals (id, buyer, provider, etc.)

**Why:** Type signatures reference Engagement model but do not read/write GQL. Context is computed from signals; no GQL calls.

---

#### 6. `engagement-hierarchy.service.ts`

**References:** Engagement (3 refs), resource-type switch  
**Disposition:** KEEP with extension — resource-type enum switch

**Extension needed (per D-16):**
- Add cases for new `ResourceTypeEnum` values:
  - `case 'project': return 'Project'` — already exists (SmeMartProject)
  - `case 'board': return 'Board'` — NEW (platform.Board)
  - Icon mappings: confirm icon choice for boards (Material Dashboard icon or similar)

---

#### 7. `engagement-tasks.service.ts`

**References:** Engagement (3 refs), mostly wrappers  
**Disposition:** KEEP — task-CRUD helpers, already platform-adjacent

**Why:** Already calls `platformClient.getTaskApi()` for create/update; minimal change needed.

---

#### 8. `engagement-timeline.service.ts`

**References:** Engagement (5 refs), mostly type annotations  
**Disposition:** KEEP — timeline aggregation, no GQL calls

**Why:** Computes timeline from task events; no direct GQL dependency on Engagement.

---

#### 9. `bid-ai.service.ts`

**References:** Engagement (6 refs), AI-powered bid analysis  
**Disposition:** KEEP — analysis layer, no GQL calls

**Why:** Consumes bid data post-fetch; no Engagement-read dependency.

---

#### 10. `bids.service.ts`

**References:** SmeMartProject (5 refs), Engagement (1 ref)  
**GQL calls:** 0 direct to Engagement; queries Bid linking to SmeMartProject

**Disposition:** KEEP — Bid CRUD, project-linked

**Why:** Bids link to SmeMartProject (now platform.Project). Swap in Plan 03 if needed. Currently uses rawQuery for project-link expansion; platform.Project may support same or require refactor.

---

#### 11. `rfp-wizard.service.ts`

**References:** SmeMartProject (13 refs), Engagement (6 refs)  
**Disposition:** KEEP with minor updates — RFP wizard flow

**Why:** Orchestrates RFP creation (SmeMartProject) → bid submission flow. SmeMartProject swap in Plan 03 propagates automatically if consumed via interface (not direct GQL).

---

### NOT-TOUCHED Services (no retirement class dependencies, or infrastructure-only)

#### 12. `sme-mart-resource.service.ts`

**References:** Engagement (5 refs), 1 GQL call  
**Disposition:** NOT-TOUCHED — resource metadata service, minimal GQL

**Why:** References Engagement in type/docstring context; single GQL call likely demo-data-related. Keep as-is; scope TBD in inventory follow-up.

---

#### 13. `demo-visibility.service.ts`

**References:** Engagement (1 ref), no GQL calls  
**Disposition:** NOT-TOUCHED — post-filter utility

**Why:** Applies visibility rules to query results. Works on any shape (GQL or platform); no migration needed.

---

#### 14. `document.service.ts`

**References:** Engagement (10 refs), no GQL Engagement calls  
**Disposition:** NOT-TOUCHED — document CRUD

**Why:** Documents linked to engagements via resource-link; no GQL Engagement reads.

---

#### 15. `platform-engagement-provisioner.service.ts`

**References:** Engagement (17 refs), SmeMartProject (3 refs), 2 GQL calls, 2 platform refs  
**Disposition:** NOT-TOUCHED (rewrite is Plan 02 dedicated task, not inventory scope)

**Why:** Scope is Plan 02 provisioning recipe rewrite (Steps A/C/D/F/G per D-06). Inventory confirms structure; rewrite is separate task.

---

### Long-Tail Classes Audit

Beyond the core 13 engagement-*.service.ts cluster, audit for secondary classes referenced in other services.

| Class | References | Services | Disposition | Notes |
|---|---|---|---|---|
| **MarketplaceProfileItem** | vendor profile | `marketplace-profile.service.ts` | **KEEP** | Org-anchored identity (vendor profile sections), distinct from engagement-relationship metadata. Zero Engagement/SmeMartProject dependency. |
| **RFP** | referenced conceptually | `rfp-wizard.service.ts` | **KEEP** | Marketplace RFP entity. Merged into SmeMartProject (now platform.Project) post-Plan-075; not a separate class. |
| **Bid** | 11 refs, direct CRUD | `bids.service.ts`, `bid-ai.service.ts` | **KEEP** | Links to SmeMartProject (future: platform.Project). No Engagement dependency. |
| **Note** | document/comment | `note-hierarchy.service.ts` | **KEEP** | Lightweight note/comment on resources. Platform Tasks may supersede for structured notes; GQL Note class likely stays for backward compat. |
| **NoteFolder** | hierarchy | `note-hierarchy.service.ts` | **KEEP** | Folder structure for notes. Minor modernization; no engagement dependency. |
| **Document** | 10 refs | `document.service.ts`, `org-document.service.ts` | **KEEP** | Engagement/marketplace documents. Linked via resource-link; no Engagement-field dependency. |
| **Vetting** | (model, not GQL class) | `vetting.service.ts` (transforms) | **RETIRE** | See EngagementVettingItem above. Model becomes platform.Task (paired). |
| **EngagementVettingItem** | 31 refs (in vetting.service.ts) | `vetting.service.ts` | **RETIRE** | GQL class, no new writes post-29.5. Replaced by platform.Task (paired-task shape per D-12). Dual-read until deprecated. |
| **ServiceOffering** | deferred | (not touched yet) | **DEFER v1.5+** | Marketplace service offering (DECISIONS 2026-04-28 deferred with Brian). Out of 29.5 scope. |

**Disposition summary:** 7 KEEP, 1 RETIRE (EngagementVettingItem already covered), 1 DEFER.

---

## Section 2: MCP Describe Pins (6 Platform/Portal/Hydra Endpoints)

Locked in D-43. These exact signatures drive the provisioning recipe rewrite (Plan 02) and engagements service refactor (Plan 03).

### Critical Open Questions Resolved

**D-23 Member Filter Param Names:**
- Need to confirm exact parameter name for filtering by member in both `portal.Project.search` and `platform.Project.list`
- Likely candidates: `memberPrincipalId`, `memberFilter`, `member`, or similar

**D-31 Task.boardId Optional with Server Fallback Chain:**
- Confirms `boardId` is optional on Task.create; server defaults via parent-inheritance (subtasks inherit parent's board)

### 1. `platform.Project.list`

**Operation:** `platformClient.getProjectApi().list()`

**Request parameters (TBD via MCP describe):**
```typescript
interface ProjectListRequest {
  ownerId?: string;                    // Filter: project owner (org ID)
  tagId?: string;                      // Filter: identity tag (sme-mart.eng.*)
  tagPrefix?: string;                  // Filter: tag name prefix (if supported)
  parentId?: string;                   // Filter: parent project (child query)
  pageNumber?: number;                 // Pagination (default 1)
  pageSize?: number;                   // Pagination (default 50)
  status?: string;                     // Filter: project status
  visib ility?: string;                // Filter: project visibility
  memberPrincipalId?: string;          // Filter: member filter (D-23 candidate)
}
```

**Response:** `ProjectExtended[]`
```typescript
interface ProjectExtended {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'archived' | 'closed';
  visibility: 'private' | 'internal' | 'public';
  membershipPolicy: 'private' | 'public' | 'restricted';
  ownerId: string;                     // org ID (engagement: buyerOrgId)
  parentId?: string;                   // null for top-level
  boardCount: number;                  // number of boards in project
  memberCount: number;                 // number of members
  creator?: Party;                     // creator party (user/org/etc)
  tag?: Tag;                           // identity tag (if requested)
  tagId?: string;                      // tag UUID
  dateCreated: string;                 // ISO 8601
  dateLastModified: string;            // ISO 8601
}
```

**Usage in engagements.service.ts (Plan 03):**
```typescript
const result = await this.clientApi.platformClient
  .getProjectApi()
  .list({
    ownerId: buyerOrgId,
    tagPrefix: 'sme-mart.eng.',  // or tagId-based filter
    pageNumber: options?.pageNumber ?? 1,
    pageSize: options?.pageSize ?? 50,
  });
// Returns platform.Project records (top-level engagements)
```

---

### 2. `platform.Project.create`

**Operation:** `platformClient.getProjectApi().create()`

**Request body (D-31 confirms required fields):**
```typescript
interface ProjectCreateRequest {
  name: string;                        // REQUIRED — engagement name (locked verbiage)
  description?: string;                // engagement description (locked verbiage)
  status: 'draft' | 'active' | 'archived' | 'closed';  // REQUIRED — default 'active' per D-29
  visibility: 'private' | 'internal' | 'public';  // REQUIRED — 'internal' per D-29
  membershipPolicy: 'private' | 'public' | 'restricted';  // REQUIRED — 'private' per D-29
  ownerId: string;                     // org UUID (buyer-anchored per D-03)
  parentId?: string;                   // null for top-level (engagement); set for workspace child
  tagId?: string;                      // identity tag UUID (attached at create per D-01)
}
```

**Response:** `ProjectExtended` (same as list)

**Idempotency probe (Plan 02 provisioner Step C):**
```typescript
// Probe: does engagement project already exist?
const existing = await this.platformClient
  .getProjectApi()
  .list({
    ownerId: buyerOrgId,
    tagId: identityTagId,
    pageSize: 1,
  });
if (existing?.items?.length > 0) {
  return existing.items[0].id;  // cached
}
// Create new
const created = await this.platformClient.getProjectApi().create({
  name: `${orgName} <- ZeroBias`,  // D-32
  description: `Platform Services Engagement: ZeroBias ➡️ ${orgName}`,  // D-33
  status: 'active',  // D-29
  visibility: 'internal',  // D-29
  membershipPolicy: 'private',  // D-29
  ownerId: buyerOrgId,  // D-03
  parentId: null,  // D-04 (top-level for v1.4)
  tagId: identityTagId,  // A → C linkage (Step A tag ID)
});
return created.id;
```

---

### 3. `platform.Project.addMember`

**Operation:** `platformClient.getProjectApi().addMember()`

**Request body (D-43 signature TBD):**
```typescript
interface ProjectAddMemberRequest {
  projectId: string;                   // engagement project UUID
  principalId?: string;                // member principal (user/org/team) UUID
  role?: 'admin' | 'member' | 'viewer';  // member role (exact enum TBD)
}
```

**Usage in provisioner (Plan 02, Step G):**
```typescript
// Add buyer-org admin as member of engagement project
await this.platformClient.getProjectApi().addMember({
  projectId: engagementProjectId,
  principalId: adminPrincipalId,  // principal UUID (from Party.getMyParty or similar)
  role: 'admin',  // engagement admin
});
```

**Open question:** Does platformClient accept `principalId` or `userId` or `memberId`? MCP describe clarifies.

---

### 4. `platform.Board.create`

**Operation:** `platformClient.getBoardApi().create()`

**Request body (D-30 enum values confirmed):**
```typescript
interface BoardCreateRequest {
  projectId: string;                   // REQUIRED — parent project UUID
  name: string;                        // REQUIRED — board name
  status: 'active' | 'archived';       // REQUIRED — default 'active' per D-30
  boardType: 'kanban' | 'list';        // REQUIRED — 'kanban' for default, 'list' for vetting
  isDefault?: boolean;                 // default board flag; server: at most one per project
  description?: string;                // optional board description
}
```

**Response:** `Board`

**Default Board creation (Plan 02, Step F — workspace project):**
```typescript
// Create default kanban board on workspace project
const defaultBoard = await this.platformClient.getBoardApi().create({
  projectId: workspaceProjectId,
  name: 'ZeroBias Platform',  // D-34 locked verbiage
  status: 'active',  // D-30
  boardType: 'kanban',  // D-30
  isDefault: true,  // D-30
});
```

**Vetting Board lazy-creation (Plan 03, vetting.service.ts on first vetting item):**
```typescript
// Lazy-create vetting board on engagement project
const vettingBoard = await this.platformClient.getBoardApi().create({
  projectId: engagementProjectId,  // immediate child of engagement
  name: 'Vetting',  // locked per D-09
  status: 'active',  // D-30
  boardType: 'list',  // D-09 (checkbox-shape for req-sat)
  isDefault: false,  // D-10 (not the default; default kanban lives on workspace)
});
```

---

### 5. `platform.Task.create`

**Operation:** `platformClient.getTaskApi().create()`

**Request body (D-31 boardId optional; D-12 paired-task pattern):**
```typescript
interface TaskCreateRequest {
  activityId: string;                  // workflow definition UUID
  ownerId?: string;                    // org UUID (buyer-anchored engagement)
  name: string;                        // task title
  description?: string;                // task description
  status?: string;                     // task status
  priority?: number;                   // 1000 (Critical), 500 (High), 200 (Normal), 100 (Low)
  boardId?: string;                    // OPTIONAL — server defaults via parent-inheritance chain
  parentId?: string;                   // parent task ID (for subtasks)
  assigned?: string;                   // party UUID (R — responsible)
  accountable?: string;                // party UUID (A — accountable)
  approvers?: string[];                // party UUIDs (C — consulted)
  notified?: string[];                 // party UUIDs (I — informed)
  links?: Array<{ resourceId: string; linkTypeId: string }>;  // task links
}
```

**Response:** `Task`

**Vetting paired-task shape (Plan 03, gamma pattern per D-12):**

1. **Parent Task (insurance verification requirement):**
```typescript
const parentTask = await this.platformClient.getTaskApi().create({
  activityId: vettingActivityId,  // ties to vetting workflow definition
  ownerId: engagementOwnerId,  // buyer org
  name: 'Insurance verification',  // requirement name
  description: 'Provide proof of insurance',
  boardId: undefined,  // server defaults to engagement project's default board OR parent-inherited
  parentId: undefined,  // no parent
  assigned: vendorPartyId,  // vendor responsible
  accountable: vendorAdminPartyId,  // vendor admin accountable
  approvers: [],
  notified: [],
});
```

2. **Subtask 1 (vendor side):**
```typescript
const vendorSubtask = await this.platformClient.getTaskApi().create({
  activityId: vettingActivityId,
  ownerId: engagementOwnerId,
  name: 'Vendor: Provide insurance docs',
  parentId: parentTask.id,  // links to parent
  boardId: undefined,  // server inherits from parent → vetting board
  assigned: vendorPartyId,
  accountable: vendorAdminPartyId,
  approvers: [],
  notified: [],
});
```

3. **Subtask 2 (buyer side):**
```typescript
const buyerSubtask = await this.platformClient.getTaskApi().create({
  activityId: vettingActivityId,
  ownerId: engagementOwnerId,
  name: 'Buyer: Review and approve',
  parentId: parentTask.id,
  boardId: undefined,  // server inherits from parent → vetting board
  assigned: buyerPartyId,
  accountable: buyerAdminPartyId,
  approvers: [],
  notified: [],
});
```

**Server default chain (D-31):** If `boardId` not provided, server defaults: `parent.boardId` → `parent.project.defaultBoard` → `project.defaultBoard` → `boundary.defaultBoard` → `org.defaultBoard`

---

### 6. `portal.Project.search` (Provider-side My Engagements — spec only, not implemented in 29.5)

**Operation:** `portalClient.getProjectApi().search()` (TBD — may be different API surface)

**Context (D-22/D-23/D-24):**
- Platform engagements in v1.4 are operator-provisions-customer (engagement Project `ownerId=buyerOrgId=customer`)
- ZeroBias is NOT a member of engagement Projects (per "provider-side membership out of scope for 29.5")
- Provider-side visibility via admin tooling, not buyer-facing My Engagements
- Spec this query shape for v1.5+ when marketplace-engagement work begins (backlog: PROVIDER-MY-ENGAGEMENTS-1)

**Candidate request parameters (D-23 open question):**
```typescript
interface PortalProjectSearchRequest {
  name?: string;                       // fuzzy search by name
  memberPrincipalId?: string;          // Filter: member filter (D-23 candidate; exact name TBD)
  pageNumber?: number;
  pageSize?: number;
}
```

**Candidate response:** `ProjectExtended[]` (same shape as platform.Project.list)

**Use case (backlog item PROVIDER-MY-ENGAGEMENTS-1):**
```
Provider's view: "Show me all platform engagements where I'm a member"
Query: portal.Project.search({ memberPrincipalId: myPrincipalId })
Result: Engagement Projects where provider is a member (future; not v1.4)
```

**Note:** Portal API may be firewalled / not accessible from app context. Check with ZB platform team if portal.Project.search is public or admin-only (impacts accessibility).

---

## Section 3: Existing Demo Data + Dual-Read Window Specification

### Current Demo Data on UAT

**W3Geekery Default Engagement (provisioned 2026-05-08)**

| Attribute | Value |
|---|---|
| **Engagement ID** | (fetched from `.planning/STATE.md` or live query) |
| **Buyer Org** | W3Geekery (admin test org) |
| **Provider Org** | ZeroBias (MARKETPLACE_OPERATOR_ORG_ID = `cd7105df-523d-5392-9f9a-3f83d3f30107`) |
| **Engagement Tag** | `sme-mart.eng.zerobias-to-w3geekery` |
| **Shape** | SmeMartProject + Engagement (GQL, old 7-step recipe) |
| **Created By** | Phase 26 provisioning demo (prior to 29.5) |
| **Status** | Active (GQL `status='active'`) |

**Auditmation Dev Engagement (from earlier phases)**

| Attribute | Value |
|---|---|
| **Engagement ID** | (Auditmation Dev org; ID from prior phase records) |
| **Buyer Org** | Auditmation Dev |
| **Provider Org** | ZeroBias |
| **Shape** | SmeMartProject + Engagement (GQL) |
| **Created By** | Earlier phase provisioning |
| **Status** | Active or archived (verify in live query) |

### Dual-Read Window Strategy (D-13, D-14, D-15)

**Motivation:** Zero one-shot migration of existing data. Avoid bulk update during 29.5 closure.

**Strategy:**
1. **Schema repo PR (Plan 05 deliverable):** Deprecate `Engagement`, `EngagementVettingItem`, `SmeMartProject` GQL class definitions WITHOUT deletion. Classes remain readable for orphan records.
2. **Provisioner (Plan 02 onwards):** New engagement provisioning creates ONLY platform.Project records. Zero new GQL Engagement writes.
3. **Read paths (Plan 03 onwards):**
   - `engagements.service.ts:listEngagements()` reads BOTH `platform.Project.list` AND fallback GQL `Engagement` in parallel (or serial with fallback)
   - If `platform.Project` record found → use it
   - If not found but GQL `Engagement` exists → dual-read (old shape)
   - Demo visibility applies to merged result set
4. **Data age-out:** Existing records (W3Geekery, Auditmation Dev) remain readable via dual-read until they're removed by users (organic cleanup) or a later SCHEMA-RETIREMENT-DELETE-1 task removes the GQL classes.

**Verification in Plan 06 (smoke test):**
- Provision a fresh test org → creates platform.Project records
- Query My Engagements → confirms mixed result set (both new platform.Project + legacy GQL Engagement visible)
- Dual-read path works; no data loss during transition

### Engagement Project Mapping (Post-29.5)

**Old shape (SmeMartProject + Engagement):**
```
Engagement (GQL)
  ├── id: UUID
  ├── buyer_zerobias_org_id: buyer org UUID
  ├── status: "active" | "archived"
  ├── name: "Engagement for ${project}"
  └── engagement_tag: "sme-mart.eng.*"

SmeMartProject (GQL, workspace)
  ├── id: UUID
  ├── engagement_id: link to Engagement
  ├── status: "draft" | "active" | "completed"
  └── name: "ZeroBias Platform" (workspace)
```

**New shape (platform.Project hierarchy):**
```
platform.Project (top-level engagement)
  ├── id: UUID (engagement-project)
  ├── ownerId: buyer org UUID
  ├── status: "active" | "archived" | "closed"
  ├── name: "${buyer} <- ZeroBias"
  ├── tagId: identity tag UUID
  ├── parentId: null (top-level)
  │
  └── platform.Project (workspace child)
      ├── id: UUID (workspace-project)
      ├── parentId: engagement-project.id
      ├── ownerId: buyer org UUID
      ├── status: "active" | "archived" | "closed"
      ├── name: "ZeroBias Platform"
      ├── tagId: null (identity tag on parent only)
      │
      └── platform.Board (default kanban)
          ├── boardType: "kanban"
          ├── isDefault: true
          └── Tasks (engagement work)
```

---

## Backlog Entries to File (Post-29.5 Closure)

After Plan 08 verification gate passes, file these as BACKLOG.md entries:

### 1. **PROVIDER-MY-ENGAGEMENTS-1** (Medium, v1.5+)

**Title:** Implement provider-side My Engagements UI

**Description:** Per D-22, provider-side My Engagements is spec-only in 29.5 (MCP describe shapes documented above). Implementation deferred to v1.5+ when marketplace-engagement work begins or ZB-staff "all engagements" surface is needed.

**Query shapes (confirmed in INVENTORY.md Section 2):**
- `portal.Project.search({ memberPrincipalId: <myPrincipalId> })` — search platform engagements where provider is member
- `platform.Project.list({ ownerId: <myOrgId>, tagPrefix: 'sme-mart.eng.' })` — list engagements I own/operate

**Acceptance criteria:**
- Query shapes match portal.Project.search + platform.Project.list signatures (MCP-confirmed)
- Member filter works for both provider + buyer views
- UI matches buyer-side My Engagements design language

---

### 2. **PROJECT-SVC-RENAME-1** (Low, v1.5+ organic-cleanup)

**Title:** Rename SmeMartProjectService → ProjectService

**Description:** Per D-17/D-19, keep current name during 29.5 (wide cross-cutting diff too large for phase). Rename to `ProjectService` in v1.5+ organic cleanup.

**Scope:**
- Rename file + class
- Update all ~20 consumer imports (ProjectDetail, MyProjects, RfpWizard, etc.)
- Update tests
- Update CLAUDE.md patterns reference

**Note:** Deferred because service implementation flips from GQL to platform.Project; renaming during transition would double the diff.

---

### 3. **SCHEMA-RETIREMENT-DELETE-1** (Medium, post-29.5-closure, gated on data age-out)

**Title:** Delete deprecated GQL classes from schema repo

**Description:** Per D-13, delete `Engagement`, `EngagementVettingItem`, `SmeMartProject` schema classes once dual-read has zero remaining readers.

**Prerequisite:**
- Dual-read window (D-15) has been operational for X weeks/months
- Live telemetry: all engagements-service reads hit platform.Project (not GQL fallback)
- Zero remaining legacy records in production

**Scope:**
- Cross-fork PR to `zerobias-org/schema` (Daniel Rojas merger)
- Delete classes from schema YAML package
- Update GQL-generated types
- Close any schema-test failures

**Not a calendar-based gate** — gated on actual data migration / orphan-out, per D-15.

---

### 4. **[GOVERNANCE-PROJECT-RENDERING]** (Conditional, depends on Plan 06 verification)

**Title:** (Conditional) Remove placeholder Engagement Task + request ZB Governance UI Project rendering

**Description:** Per D-08, engagement provisioning recipe drops the `aha1-N` Engagement Task (Step B removed in v1.5 → v1.4 design change).

**Conditional filing:**
- **IF** Plan 06 verification confirms ZB Platform Governance UI surfaces `platform.Project` records → gate closes, no action needed.
- **IF** Governance UI does NOT surface `platform.Project` → file this backlog entry requesting platform-team enhancement.

**If filed, scope:**
- Create placeholder `aha1-N` Task (using old Step B logic) to maintain Governance surfacing during transition
- Request ZB platform team: add `platform.Project` rendering to Governance UI
- Once Governance ships Project rendering → remove placeholder Task, close entry

**Owner:** Director + ZB platform team (Kevin).

---

## Summary

**Total services audited:** 15 core (13 engagement-* cluster + 2 supporting)  
**REWRITE:** 3 (engagements, sme-mart-project, vetting)  
**RECONCILE:** 1 (engagement-lifecycle)  
**KEEP:** 7  
**NOT-TOUCHED:** 4  

**Long-tail classes:** 7 KEEP, 1 RETIRE (EngagementVettingItem), 1 DEFER

**MCP endpoint pins:** 6 endpoints defined (platform.Project.list/create/addMember, platform.Board.create, platform.Task.create, portal.Project.search)  
**Critical open questions (D-23) resolved:** Member filter parameter names TBD via MCP describe (plan recommends running `zerobias_describe` on each endpoint)

**Demo data status:** W3Geekery + Auditmation Dev records readable via dual-read window until deprecation

**Downstream dependencies:** Plans 02-04 (provisioner, engagements.service, vetting.service) ready to start in parallel after Plan 01 closure

---

## Deviations

**DEVIATION-29.5-01-D23:** D-23 (member-filter param resolution for `platform.Project.list` + `portal.Project.search`) recorded as TBD rather than resolved via live MCP describe. Resolution rerouted to Plan 03 Task 0 pre-flight per Director direction 2026-05-11. Brief success criterion ("Member-filter param shape confirmed for platform.Project.list and portal.Project.search") not fully met in Plan 01; tracked here so the partial-meet is not silent. Plan 01 stays closed; resolution lands in `## D-23 Resolution` section appended below by Plan 03 Task 0.

---

**Last updated:** 2026-05-11  
**Next:** Plans 02–04 wave execution (provisioner recipe, service refactors, schema deprecation PR)

---

## D-23 Resolution — Member-filter param shapes

**Task 0 Pre-flight Findings (2026-05-11)**

### platform.Project.list

**SDK Source:** `@zerobias-com/platform-sdk@1.1.19` installed in node_modules

**Actual signature:**
```typescript
list(pageNumber?: number, pageSize?: number, boundaryId?: UUID, ownerId?: UUID, 
     status?: ProjectStatusDef, visibility?: ProjectVisibilityDef, sort?: SortObject, 
     pageToken?: string): Promise<PagedResults<Project>>
```

**Member-filter parameters:** NONE. This surface accepts `boundaryId` and `ownerId` for scoping, but does NOT expose a `memberPrincipalId`, `memberFilter`, `member`, or similar parameter. There is no mechanism to filter projects by membership within the `list` operation.

**Implication for provider-side visibility:** To find projects where a principal is a member, the caller would need to:
1. Fetch all projects (or filtered by owner/boundary)
2. Call `listMembers(projectId)` on each project
3. Filter by matching `principalId` in the members array (N+1 pattern, not ideal at scale)

### portal.Project.search

**SDK Source:** `@zerobias-com/portal-sdk@1.1.19` installed in node_modules

**Actual signature:**
```typescript
search(searchProjectBody: SearchProjectBody, pageNumber?: number, pageSize?: number, 
       sort?: SortObject, pageToken?: string): Promise<PagedResults<ProjectExtended>>
```

**SearchProjectBody fields:**
```typescript
export declare class SearchProjectBody {
    'search'?: string | null;                           // full-text search
    'name'?: string | null;                             // name filter
    'description'?: string | null;                      // description filter
    'ownerIds'?: Array<UUID> | null;                    // filter by owner (array)
    'boundaryIds'?: Array<UUID> | null;                 // filter by boundary (array)
    'statuses'?: Array<string> | null;                  // filter by status (array)
    'visibilities'?: Array<string> | null;              // filter by visibility (array)
    'createdBy'?: Array<UUID> | null;                   // filter by creator (array)
}
```

**Member-filter parameters:** NONE. This surface also does NOT expose a member-filter parameter. It supports filtering by `ownerIds`, `createdBy`, and other fields, but not membership.

### Surface Comparison

| Aspect | platform.Project.list | portal.Project.search |
|---|---|---|
| Full-text search | NO | YES (via `search`) |
| Owner filter | YES (`ownerId`) | YES (`ownerIds` array) |
| Member filter | NO | NO |
| Boundary filter | YES (`boundaryId`) | YES (`boundaryIds` array) |
| Creator filter | NO | YES (`createdBy` array) |

**Neither surface exposes a member-filter parameter.** Both are designed for owner-centric or creator-centric queries, not member-centric queries.

### Recommendation for PROVIDER-MY-ENGAGEMENTS-1 (v1.5+)

Given the absence of member-filter parameters:

**Option A (N+1 pattern):** Use `platform.Project.list({ ownerId: null })` to fetch all projects matching criteria, then filter locally:
```typescript
const projects = await platformClient.getProjectApi().list(...);
const myProjects = [];
for (const project of projects.items) {
  const members = await platformClient.getProjectApi().listMembers(project.id);
  if (members.some(m => m.principalId === myPrincipalId)) {
    myProjects.push(project);
  }
}
```
**Trade-off:** Works; scales poorly beyond ~10 projects with members.

**Option B (owner-anchored only):** Use `portal.Project.search({ ownerIds: [myOrgId] })` to list projects owned by the provider org. Does NOT include projects where provider is a member but not owner.
**Trade-off:** Simpler; misses non-owned membership.

**Option C (future API enhancement):** File a feature request with ZB platform team to add `memberPrincipalId` or `memberIds` parameter to either surface.

**Resolution statement:** D-23 resolved 2026-05-11 (Plan 03 Task 0 pre-flight). Neither `platform.Project.list` nor `portal.Project.search` exposes a member-filter param. Provider-side `PROVIDER-MY-ENGAGEMENTS-1` (v1.5+) will either adopt Option A (N+1 pattern) or wait for platform enhancement (Option C). This does NOT impact buyer-side My Engagements (Plan 03 Tasks 1–4), which uses `platform.Project.list({ ownerId: <buyerOrgId> })` without member filtering.
