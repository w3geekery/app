# Phase 30 Plan 01: Hoist SME_MART_TIER_PROJECT_TAG_ID to Shared Constants — Summary

**Plan:** phase-30-plan-01
**Status:** COMPLETE
**Duration:** 6 min
**Tasks:** 2/2 (both executed)
**Commits:** 2 task commits + 1 summary commit = 3 total

---

## Objective

Hoist the `SME_MART_TIER_PROJECT_TAG_ID` constant from `src/app/core/services/platform-engagement-provisioner.service.ts` (line 19) to a new shared constants module at `src/app/core/constants/tier-tags.ts`. Establish re-export stability so existing callers of the provisioner continue to resolve the constant unchanged, while Phase 30 and Phase 31 consumers can import from the shared module directly.

**Locked decision:** D-50 canonical tier mapping (depth 2 = Project tier, FIXED). Re-export pattern maintains backward compatibility.

---

## Tasks Executed

### Task 1: Create tier-tags.ts constants module ✓

**Commit:** a82a221 `feat(phase-30): create tier-tags constants module with Project-tier UUID (D-50)`

**File created:** `src/app/core/constants/tier-tags.ts`

**Contents:**
- D-50 header comment block (verbatim from PATTERNS.md line 227–233)
  - Explains canonical tier mapping: depth 2 = Project tier (FIXED)
  - Documents reserved `sme-mart.tier.workspace` UUID (2d7e6b6d-62e1-4691-958c-41cd1b8de043) for future Hierarchy Editor
  - Notes that v1.4 does NOT instantiate depth-3+ tiers
- Exported constant: `SME_MART_TIER_PROJECT_TAG_ID = '420b0753-e72c-4b81-8929-70508a119bf0'` (UAT UUID)
- Co-located with existing `demo-tags.ts` in `src/app/core/constants/` directory

**Pattern analog:** `src/app/core/constants/demo-tags.ts` (existing constants file with header comment + export)

**Anti-patterns avoided:**
- No environment-specific variants (TIER-TAG-ENV-BOOTSTRAP-1 is Phase 31+ backlog)
- No generic "this is a constant" comment; instead explains D-50 design decision
- No inline hardcoding without the export

---

### Task 2: Add re-export to platform-engagement-provisioner.service.ts ✓

**Commit:** b10ac9f `feat(phase-30): add re-export of SME_MART_TIER_PROJECT_TAG_ID for backward compatibility`

**File modified:** `src/app/core/services/platform-engagement-provisioner.service.ts`

**Change:**
- Added re-export line at end of file (after closing brace of the class):
  ```typescript
  // Re-export SME_MART_TIER_PROJECT_TAG_ID from new constants file for caller stability
  // (engagements.service and feature-coming-soon need this constant)
  export { SME_MART_TIER_PROJECT_TAG_ID } from '../constants/tier-tags';
  ```

**Stability guarantee:**
- Existing `import { SME_MART_TIER_PROJECT_TAG_ID } from './platform-engagement-provisioner.service'` calls continue to work unchanged
- File-local constant on line 19 remains in place for the provisioner's own usage (no removal)
- New Phase 30+ consumers (engagements.service helpers, feature-coming-soon component) can import from the constants module directly

**Pattern:** One-liner re-export for public API stability + code organization

**Anti-patterns avoided:**
- Did NOT remove the file-local constant from line 19 (provisioner still uses it internally)
- Did NOT move ALL constants to the new tier-tags.ts (only hoisted the shared one per D-50 + Phase 30 scope)
- Did NOT create duplicate constants

---

## Verification Results

### 1. File Existence ✓
```
✓ test -f src/app/core/constants/tier-tags.ts
  Result: File exists
```

### 2. Constant Count in tier-tags.ts ✓
```
✓ grep -c "SME_MART_TIER_PROJECT_TAG_ID" src/app/core/constants/tier-tags.ts
  Count: 1 (expected 1)
```

### 3. Export Declaration ✓
```
✓ grep "export const SME_MART_TIER_PROJECT_TAG_ID" src/app/core/constants/tier-tags.ts
  Result: export const SME_MART_TIER_PROJECT_TAG_ID = '420b0753-e72c-4b81-8929-70508a119bf0'; // UAT
```

### 4. Re-export in Provisioner ✓
```
✓ grep -n "export.*SME_MART_TIER_PROJECT_TAG_ID.*tier-tags" src/app/core/services/platform-engagement-provisioner.service.ts
  Result: 327:export { SME_MART_TIER_PROJECT_TAG_ID } from '../constants/tier-tags';
```

### 5. TypeScript Check (tsconfig.app.json) ✓
```
✓ npx tsc -p tsconfig.app.json --noEmit
  Result: No errors
```

### 6. TypeScript Check (tsconfig.spec.json) ✓
```
✓ npx tsc -p tsconfig.spec.json --noEmit
  Result: No errors
```

### 7. ESLint (touched files) ✓
```
✓ npx eslint src/app/core/constants/tier-tags.ts src/app/core/services/platform-engagement-provisioner.service.ts --max-warnings=0
  Result: No violations
  (eslint.config.js MODULE_TYPELESS_PACKAGE_JSON warning is pre-existing, unrelated)
```

---

## Success Criteria Met

- ✓ New `tier-tags.ts` file created in `src/app/core/constants/` directory
- ✓ File exports `SME_MART_TIER_PROJECT_TAG_ID` with UAT UUID value (420b0753-e72c-4b81-8929-70508a119bf0)
- ✓ D-50 canonical comment block present with exact verbiage from PATTERNS.md
- ✓ Platform-engagement-provisioner re-exports the constant from tier-tags.ts on a single line
- ✓ Both files pass `tsc --noEmit` type-checking with zero errors
- ✓ Both files pass lint with `--max-warnings=0` (diff-based pre-commit scope)
- ✓ Constant value is NOT changed; it's only moved and re-exported (zero runtime change)
- ✓ File-local constant in provisioner remains in place for provisioner's own usage
- ✓ Backward compatibility maintained via re-export
- ✓ Two tasks committed atomically with conventional-commit format

---

## Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| New constants module | `src/app/core/constants/tier-tags.ts` | Created, 9 lines |
| Provisioner re-export | `src/app/core/services/platform-engagement-provisioner.service.ts` | Modified, 4 new lines at EOF |

---

## Deviations from Plan

None. Plan executed exactly as specified.

---

## Next Phase Dependencies

- **Phase 30 Plan 02** — `engagements.service` discovery helpers will import `SME_MART_TIER_PROJECT_TAG_ID` from the new constants module
- **Phase 30 Plan 04+** — `feature-coming-soon` component and `default-project-board` component will import the constant as needed
- **Phase 31** — `auto-reprovision` and namespace migration (errata 030) will continue to use the re-exported constant from the provisioner OR import directly from constants

---

## Commit History

```
b10ac9f feat(phase-30): add re-export of SME_MART_TIER_PROJECT_TAG_ID for backward compatibility
a82a221 feat(phase-30): create tier-tags constants module with Project-tier UUID (D-50)
```

Both commits passed pre-commit hooks (ESLint, TypeScript, linting) without violations.

---

**Plan Complete. Ready for Phase 30 execution wave advancement.**
