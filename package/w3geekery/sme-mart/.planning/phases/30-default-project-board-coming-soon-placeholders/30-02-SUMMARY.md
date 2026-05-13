---
phase: 30
plan: 02
type: summary
subsystem: engagements-discovery
tags: [project-hierarchy, dual-read-window, defensive-nulls]
dependencies:
  requires: [30-01]
  provides: [G5-empty-state, DefaultProjectBoardComponent-hydration]
  affects: [DefaultProjectBoardComponent, ProjectListComponent]
tech_stack:
  added: []
  patterns: [Promise.race-timeout, defensive-null-checks, console.warn-logging]
key_files:
  created: []
  modified:
    - src/app/core/services/engagements.service.ts
    - src/app/core/services/engagements.service.spec.ts
decisions:
  - "Dual-read window: platform.Project.list primary, 5s timeout, no fallback (per D-15)"
  - "Both methods return null on error/missing data — no exceptions thrown (defensive nulls for G5)"
  - "SME_MART_TIER_PROJECT_TAG_ID imported from tier-tags.ts, not re-exported (single source of truth)"
  - "console.warn logging with bracketed prefixes ([ENGAGEMENTS:*]) for operational visibility"
metrics:
  duration: "5 minutes"
  completed: "2026-05-13T00:24:30Z"
  tasks_completed: 2
  files_modified: 2
  test_cases_added: 6
---

# Phase 30 Plan 02: Default Project Board Discovery Helpers — Summary

**Status:** ✅ COMPLETE

**Objective:** Add two discovery helper methods to EngagementsService to retrieve the user's default engagement (depth-1 platform.Project) and its Project-tier child (depth-2), enabling DefaultProjectBoardComponent to hydrate without traversing the hierarchy manually.

## What Was Built

### Task 1: getDefaultEngagement() Method
- **File:** `src/app/core/services/engagements.service.ts`
- **Signature:** `async getDefaultEngagement(orgId: string): Promise<ProjectExtended | null>`
- **Behavior:**
  - Queries platform.Project.list with 1-100 pagination, no filters except buyerOrgId
  - Applies Promise.race with PRIMARY_READ_TIMEOUT_MS (5s) for dual-read window (D-15)
  - Finds the first project where parentId is null (depth-1 = root engagement)
  - Returns null if no root project found or on timeout/error
  - Logs with `[ENGAGEMENTS:GET_DEFAULT_ENGAGEMENT]` and `[ENGAGEMENTS:GET_DEFAULT_ENGAGEMENT_ERROR]` prefixes

### Task 2: getProjectTierProject() Method
- **File:** `src/app/core/services/engagements.service.ts`
- **Signature:** `async getProjectTierProject(engagementId: string): Promise<ProjectExtended | null>`
- **Behavior:**
  - Queries platform.Project.list with 1-100 pagination, no org filter (all accessible orgs)
  - Applies Promise.race with PRIMARY_READ_TIMEOUT_MS (5s) for dual-read window (D-15)
  - Finds project where parentId === engagementId AND tagId === SME_MART_TIER_PROJECT_TAG_ID
  - Returns null if no match found or on timeout/error
  - Logs with `[ENGAGEMENTS:GET_PROJECT_TIER_PROJECT]` and `[ENGAGEMENTS:GET_PROJECT_TIER_PROJECT_ERROR]` prefixes

### Task 3: Unit Tests
- **File:** `src/app/core/services/engagements.service.spec.ts`
- **Coverage:**
  - getDefaultEngagement: 3 test cases (happy path, null-return, timeout)
  - getProjectTierProject: 3 test cases (happy path, null-return, timeout)
  - All new tests use vitest + mocked platformClient.getProjectApi().list()
  - Mock shapes cast to unknown first to satisfy strict TypeScript (ProjectExtended interface width)

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| getDefaultEngagement method count | grep -c "async getDefaultEngagement" | ✅ 1 |
| getProjectTierProject method count | grep -c "async getProjectTierProject" | ✅ 1 |
| Constant import source | grep "SME_MART_TIER_PROJECT_TAG_ID" | ✅ from '../constants/tier-tags' |
| getDefaultEngagement test suite | grep -c "describe('getDefaultEngagement'" | ✅ 1 |
| getProjectTierProject test suite | grep -c "describe('getProjectTierProject'" | ✅ 1 |
| TypeScript (tsconfig.app.json) | npx tsc -p tsconfig.app.json --noEmit | ✅ PASS |
| TypeScript (tsconfig.spec.json) | npx tsc -p tsconfig.spec.json --noEmit | ✅ PASS |
| ESLint check | npx eslint *.ts --max-warnings=0 | ✅ PASS |
| Unit tests (npm test) | npm test -- --include="engagements.service.spec.ts" | ✅ 21 tests, 21 passed |

## Key Implementation Details

### Import Structure
```typescript
import { SME_MART_TIER_PROJECT_TAG_ID } from '../constants/tier-tags';
```
The constant is imported directly from tier-tags.ts (not from a provisioner re-export), ensuring a single source of truth per D-15 intent.

### Dual-Read Window Pattern (D-15)
Both methods use the same timeout pattern as listEngagements():
```typescript
const timeout = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('PRIMARY_READ_TIMEOUT')), PRIMARY_READ_TIMEOUT_MS)
);
const projects = await Promise.race([
  this.clientApi.platformClient.getProjectApi().list(...),
  timeout,
]);
```
This ensures a 5-second timeout with no fallback (G2 locks these methods to platform.Project.list only).

### Defensive Null Returns
Both methods return `null` on:
- No projects found in API response
- No matching project (root or project-tier)
- Timeout (caught as PRIMARY_READ_TIMEOUT error)
- Any other exception during list() call

This enables G5 empty-state UX in DefaultProjectBoardComponent without catching exceptions in the component.

### Error Logging
Uses console.warn with bracketed prefixes for operational context:
- `[ENGAGEMENTS:GET_DEFAULT_ENGAGEMENT]` — normal path, no projects found or no root
- `[ENGAGEMENTS:GET_DEFAULT_ENGAGEMENT_ERROR]` — exception during list()
- `[ENGAGEMENTS:GET_PROJECT_TIER_PROJECT]` — normal path, no projects found or no match
- `[ENGAGEMENTS:GET_PROJECT_TIER_PROJECT_ERROR]` — exception during list()

Each log includes orgId/engagementId for correlation, reason code, and error message.

## Commits

| Commit | Message |
|--------|---------|
| 5a8f2c0 | feat(30-02): add getDefaultEngagement() method to EngagementsService |
| f80a981 | test(30-02): add unit tests for getDefaultEngagement() and getProjectTierProject() |

## Deviation Notes

None. Plan executed exactly as written. No modernization violations found. Pre-commit hook and linter passed on all changes.

## Next Steps

These methods are now available for DefaultProjectBoardComponent to:
1. Load the default engagement (buyer org + breadcrumb)
2. Load the project-tier child (board section)
3. Handle null returns gracefully (G5 empty-state pattern)

Plan 30-03 (DefaultProjectBoardComponent implementation) can now depend on these helpers.
