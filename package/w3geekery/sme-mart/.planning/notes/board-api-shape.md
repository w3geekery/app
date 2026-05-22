# platform.Board API Shape — captured for Phase 32

**Captured:** 2026-05-19 (Phase 32 discuss-phase pre-capture)
**Source:** ZB MCP `zerobias_describe` against UAT platform
**Authority:** Primary (ZB MCP) per SDK_VERIFICATION_SOURCES.md

## Operations available

| Operation | HTTP | Path | Notes |
|---|---|---|---|
| `list` | GET | `/app/boards` | Query all boards with filters |
| `get` | GET | `/app/boards/{boardId}` | Single board fetch + expanded owner/org/boundary/project/user refs |
| `create` | POST | `/app/boards` | Create new board (no `Board.search` operation exists) |
| `update` | PUT | `/app/boards/{boardId}` | Update board metadata |
| `delete` | DELETE | `/app/boards/{boardId}` | Delete board |
| `listTasks` | GET | `/app/boards/{boardId}/tasks` | List tasks on a board |

**Board.search:** Does not exist — `Board.list` is the only query endpoint.

---

## Board.list — full shape

**Signature:** `list(pageNumber?: number, pageSize?: number, ownerId?: UUID, orgId?: UUID, boundaryId?: UUID, projectId?: UUID, userId?: UUID, status?: BoardStatusDef, boardType?: BoardTypeDef, isDefault?: boolean, sort?: SortObject, pageToken?: string): Promise<PagedResults<Board>>`

**HTTP:** `GET /app/boards`

**Query Parameters (all optional):**

| Param | Type | Default | Description |
|---|---|---|---|
| `pageNumber` | int32 | 1 | 1-indexed page number |
| `pageSize` | int32 | 50 | Items per page |
| `ownerId` | UUID | — | Filter by owner ID (principal) |
| `orgId` | UUID | — | Filter by org-parented boards |
| `boundaryId` | UUID | — | Filter by boundary ID |
| `projectId` | UUID | — | Filter by project ID |
| `userId` | UUID | — | Filter by user ID (user-personal boards) |
| `status` | string | — | Filter by status: `active`, `archived`, `deleted` |
| `boardType` | string | — | Filter by board type: `kanban`, `list`, `timeline`, `calendar` |
| `isDefault` | boolean | — | Filter by default board flag |
| `sort` | string | — | Sort object (OpenAPI shape: not detailed) |

**Response:** `PagedResults<Board>` — array of Board objects with pagination metadata

**Example call:**
```typescript
// Get all boards in an org
const boards = await boardApi.list(1, 50, undefined, orgId);

// Get user's personal boards
const personalBoards = await boardApi.list(1, 50, undefined, undefined, undefined, undefined, userId);

// Get project-level boards
const projectBoards = await boardApi.list(1, 50, undefined, undefined, undefined, projectId);
```

---

## Board.get — full shape

**Signature:** `get(boardId: UUID): Promise<BoardExtended>`

**HTTP:** `GET /app/boards/{boardId}`

**Path Parameter:**
- `boardId` (UUID, required)

**Response:** `BoardExtended` — Board DTO + populated owner/org/boundary/project/user refs

**Returns expanded ownership refs** (see DTO below).

---

## Filter capability matrix (Phase 32 critical)

| Filter | List support | Search support | Mutually exclusive | Notes |
|---|---|---|---|---|
| `orgId` | ✅ Yes | N/A | Yes (vs boundaryId, projectId, userId) | Filter by org-parented boards |
| `projectId` | ✅ Yes | N/A | Yes | Filter by project-level boards |
| `boundaryId` | ✅ Yes | N/A | Yes | Filter by boundary-level boards |
| `userId` | ✅ Yes | N/A | Yes | Filter by user-personal boards (org-visible) |
| `ownerId` | ✅ Yes | N/A | Yes (alternative) | Direct owner principal ID filter |
| `status` | ✅ Yes | N/A | No | active / archived / deleted |
| `boardType` | ✅ Yes | N/A | No | kanban / list / timeline / calendar |
| `isDefault` | ✅ Yes | N/A | No | Boolean flag |

**CRITICAL INSIGHT:** The `orgId`, `boundaryId`, `projectId`, `userId` filters are **mutually exclusive** by design — a board has exactly one owner. The API enforces the invariant: "At most one default exists per parent (per-org, per-boundary, per-project, or per-user)."

---

## Board DTO (fields returned on list & get)

### Board (minimal, returned from list)

| Field | Type | Optional | Notes |
|---|---|---|---|
| `id` | UUID | No | Unique identifier |
| `name` | string | No | Short name |
| `type` | string (nmtoken) | No | Resource type (always `"board"` or similar) |
| `description` | string | Yes | Long description |
| `ownerId` | UUID | No | Principal ID of owner |
| `parentId` | UUID | Yes | Parent resource ID (if any) |
| `created` | ISO 8601 | No | Creation timestamp |
| `updated` | ISO 8601 | No | Last update timestamp |
| `deleted` | ISO 8601 | Yes | Soft-delete timestamp |
| `imageUrl` | URL | Yes | Board image/icon |
| `url` | URL | Yes | External URL |
| `aliases` | string[] | Yes | Alternate names |
| `boundaryId` | UUID | Yes | If boundary-owned |
| `orgId` | UUID | Yes | If org-owned |
| `projectId` | UUID | Yes | If project-owned |
| `userId` | UUID | Yes | If user-personal |
| `status` | enum | No | `active` / `archived` / `deleted` |
| `boardType` | enum | No | `kanban` / `list` / `timeline` / `calendar` |
| `isDefault` | boolean | No | Is default for parent |

### BoardExtended (returned from get, includes expanded refs)

All fields from Board, plus:

| Field | Type | Required | Notes |
|---|---|---|---|
| `owner` | Principal summary | No | `{ id, name, description?, imageUrl? }` — only if ownerId is a principal (not null) |
| `org` | OrgSummary | Conditional | `{ id, name, description?, imageUrl? }` — populated if `orgId` is set |
| `boundary` | BoundarySummary | Conditional | `{ id, name, description?, imageUrl? }` — populated if `boundaryId` is set |
| `project` | ProjectSummary | Conditional | `{ id, name, description?, imageUrl? }` — populated if `projectId` is set |
| `user` | UserSummary | Conditional | `{ id, name, description?, imageUrl? }` — populated if `userId` is set |
| `taskCount` | int32 | No | Number of tasks on this board |

---

## CRUD Operations Detail

### Board.create

**Request body (`NewBoard`):**

Required fields: `name`, `status`, `boardType`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Board name |
| `description` | string | No | Long description |
| `boundaryId` | UUID | No | If boundary-level board |
| `projectId` | UUID | No | If project-level board |
| `userId` | UUID | No | If user-personal board (principal ID of intended user) |
| `status` | enum | Yes | `active` / `archived` / `deleted` |
| `boardType` | enum | Yes | `kanban` / `list` / `timeline` / `calendar` |
| `isDefault` | boolean | No | Mark as default for parent |

**Response:** `BoardExtended` (same as `get`)

**Note:** Omit `orgId` — the API infers it from the authenticated user's org context. One of `{boundaryId, projectId, userId}` should be provided; omit all three for org-level board (infer `orgId`).

### Board.update

**Request body (`UpdateBoard`):**

All fields optional:

| Field | Type | Notes |
|---|---|---|
| `name` | string | New name |
| `description` | string | New description |
| `status` | enum | New status |
| `boardType` | enum | New board type |
| `isDefault` | boolean | Update default flag |

**Response:** `BoardExtended`

**Note:** Cannot change ownership (`boundaryId`, `projectId`, `userId`) via update — ownership is immutable after creation.

### Board.delete

**HTTP:** `DELETE /app/boards/{boardId}`

**No body.** Returns 200 on success or 404 if already deleted.

**Note:** Soft-delete (sets `deleted` timestamp). Archived/deleted boards remain queryable via `status` filter.

---

## Phase 32 Implications

### Q-2: Cross-org list page (`orgIds` array filter)

**Requirement:** Fetch boards from multiple orgs in a single call.

**VERDICT:** ⚠️ **NOT SUPPORTED** — API accepts `orgId` (singular UUID), not `orgIds` (array).

**Workaround:** N+1 queries: call `list(orgId=org1)`, then `list(orgId=org2)`, etc., or:
- Fetch user's org list via `dana.Me.getCurrentOrg()` + `getPrincipal().orgs`, then loop per-org.
- **Escalate to Kevin:** Request `orgIds` array filter on `Board.list` for Q-2 list-page performance.

### Q-3: User/Private boards discovery

**Requirement:** Query boards intended for a specific user (user-personal boards visible to the org).

**VERDICT:** ✅ **SUPPORTED** — `list(userId=userUUID)` filters boards where `userId` = target user.

**Usage:**
```typescript
// Get all boards assigned to user X (visible to their org)
const userBoards = await boardApi.list(1, 50, undefined, orgId, undefined, undefined, userId);
```

### L-10: Vetting Board specialization via tag

**Requirement:** Tag a Board with `sme-mart.board.vetting` to mark it as a Vetting Board.

**VERDICT:** ✅ **VIABLE** — Board is a standard `Resource`, so it supports `hydra.Resource.linkResources` tagging.

**Usage:**
```typescript
// Create Vetting Board
const vettingBoard = await boardApi.create({
  name: "SME Vetting Board",
  projectId: projectId,
  boardType: "kanban",
  status: "active",
});

// Tag it
await hydraClient.getResourceApi().linkResources({
  resourceId: vettingBoard.id,
  resourceLinks: [
    {
      linkedResourceId: vettingBoardTagId,  // UUID of sme-mart.board.vetting tag
      linkTypeId: tagLinkTypeId,            // Typically "tag-type-id"
      direction: "forward"
    }
  ]
});
```

**Next step:** Verify tag creation path (`hydra.Tag.createTag` for `sme-mart.board.vetting` with `tagType: "marketplace"`).

---

## Gaps to escalate to platform team

1. **Q-2 orgIds array filter**
   - **To:** Kevin (platform infra)
   - **Need:** `orgIds?: UUID[]` parameter on `Board.list` to avoid N+1 queries on cross-org list page.
   - **Workaround:** Loop per-org or paginate separately.

2. **Documentation on boardType enum values**
   - **To:** Nic or API docs
   - **Need:** Confirm enum values are `["kanban", "list", "timeline", "calendar"]` (no others planned?). Any runtime validation on UI?
   - **Clarify:** Can users create `timeline` and `calendar` boards today, or are they future/reserved?

3. **Soft-delete visibility**
   - **To:** Kevin
   - **Need:** When a board is deleted (`status: "deleted"`), does `Board.listTasks` return 400/404 or an empty array?
   - **Clarify:** Archive flow vs. delete flow UX.

---

## Sources & References

- ZB MCP `zerobias_describe("platform.Board.*")` — primary source, called 2026-05-19 against UAT
- No deprecated Next.js app references (per SDK_VERIFICATION_SOURCES.md)
- No local schema repo reference (Board is a ZB platform native, not a custom schema entity)

---

**End of Phase 32 pre-capture. Ready for discuss-phase with Director + Clark.**
