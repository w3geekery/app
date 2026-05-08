# Quick reference — models (Projects / Boards / Subtasks)

Models added or modified by the `task-projects-boards` work, exposed through the
generated SDK packages (`@zerobias-com/platform-sdk`, `@zerobias-com/portal-sdk`,
`@zerobias-com/hydra-sdk`).

## Board domain (new)

| Model | Shape | Used for |
|-------|-------|----------|
| `Board` | extends `Resource` + `{ orgId?, boundaryId?, projectId?, userId?, status, boardType, isDefault }` (exactly one parent axis non-null) | Persisted board entity |
| `BoardExtended` | `Board` + `{ owner, org?, boundary?, project?, user?, taskCount }` (`owner` + `taskCount` always present) | Read responses with resolved parent info |
| `NewBoard` | `{ name, description?, status, boardType, boundaryId?, projectId?, userId?, isDefault? }` | Create request body (no `ownerId` — server fills from session org) |
| `UpdateBoard` | `{ name?, description?, status?, boardType?, isDefault? }` | Partial update body |
| `BoardStatus` | enum: `active` \| `archived` \| `deleted` | Status filter |
| `BoardType` | enum: `kanban` \| `list` \| `timeline` \| `calendar` | View type |
| `BoardSortColumns` | enum: `name` \| `created` \| `updated` \| `status` \| `boardType` | Sort key |
| `BoardFilters` | `{ statuses, boardTypes, orgs, boundaries, projects, users, owners }` | Search-options response (filter chips) |

## Project domain (new)

| Model | Shape | Used for |
|-------|-------|----------|
| `Project` | extends `Resource` + `{ status, visibility, membershipPolicy, tagId?, createdBy, boundaryId?, parentId? }` | Persisted project entity |
| `ProjectExtended` | `Project` + `{ owner, creator, boardCount, memberCount, boundary?, tag? }` | Read responses |
| `NewProject` | `{ name, description?, status, visibility, membershipPolicy, boundaryId?, parentId?, tagId? }` | Create body |
| `UpdateProject` | `{ name?, description?, status?, visibility?, membershipPolicy?, tagId?, parentId? }` | Partial update |
| `NewProjectMember` | `{ principalId, roleId }` | Add-member body |
| `ProjectMember` / `ProjectMemberExtended` | membership row + resolved principal info | Member read |
| `ProjectStatus` | enum: `draft` \| `active` \| `archived` \| `closed` | Status filter |
| `ProjectVisibility` | enum: `private` \| `internal` \| `public` | Visibility filter |
| `ProjectSortColumns` | enum: `name` \| `created` \| `updated` \| `status` \| `visibility` | Sort key |
| `ProjectFilters` | `{ statuses, visibilities, boundaries, owners, creators }` | Search-options response |

## Task domain (changes)

| Model | Change | Notes |
|-------|--------|-------|
| `Task` | **+ `boardId` (required)**, **+ `projectId?`**, **+ `parentId?`** | Every task has a board; subtasks reference parent |
| `TaskExtended` | **+ `board` (required)**, **+ `project?`**, **+ `parentTask?`** | Resolved info for UI |
| `TaskFilters` | **+ `boards`**, **+ `projects`** | More filter chips |
| `BoardTaskFilters` | **(new)** subset of `TaskFilters` minus `boards` / `projects` (pinned by board path) | `taskSearchOptions(boardId)` response |
| `ProjectTaskFilters` | **(new)** subset minus `projects` only (boards kept) | `taskSearchOptions(projectId)` response |
| `NewTask` | **+ `boardId?`**, **+ `projectId?`**, **+ `parentId?`** | All optional — server resolves the chain |
| `SearchTaskBody` (portal) | **+ `boardIds?`**, **+ `projectIds?`** | Cross-org task search filters |

## Security / RBAC (changes — multi-scope role assignments)

| Model | Change | Notes |
|-------|--------|-------|
| `ScopeType` | **(new)** enum: `org` \| `boundary` \| `project` | Scope discriminator |
| `RoleScope` | **(new)** `{ id, rolePrincipalId, scopeType, scopeId, ownerId, boundaryId?, projectId? }` | One row per scope on a role assignment |
| `RoleMembershipScope` | **(new)** `{ scopeType, scopeId }` | Scope summary embedded in `RoleMembership` |
| `RoleMembership` | **+ `id` (required)**, **+ `scopes` array**; `boundaryId` semantics: **NULL for project- and org-scoped** | Returns role assignments with all scopes |
| `AddRoleMember` | **+ `scopeType?`, `scopeId?`** (`boundaryId` kept as legacy shorthand) | Pass `scopeType: project, scopeId: <projectId>` for project assignments |

## Resource type enum (additive)

| Change | Detail |
|--------|--------|
| `ResourceTypeEnum` | **+ `board`**, **+ `project`** | Strict-enum clients: heads-up if you parse generic resource lists |
