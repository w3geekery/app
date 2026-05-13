---
id: "036"
severity: medium
phase: 29.5
found: 2026-05-13
status: fixed
---

# Errata 036 — `provisioner.service.ts` `as never` Cast Pattern Hides Three SDK-Shape Bugs

**Date:** 2026-05-13 (surfaced during D-49-NAMESPACE-MIGRATE-1 design pass)
**Severity:** Medium (latent; not biting today; bites Phase 31 + future D-46 multi-engagement state)
**Type:** Implementation drift — `as never` casts bypass TypeScript checking, masking three distinct shape mismatches against the actual `platform-sdk` typings.
**Phase:** 29.5 (filed); fixed together with D-49-NAMESPACE-MIGRATE-1 in same commit.

## Background

Per `feedback_sdk_shape_verify_source_provenance` (filed parkit-9), authoritative SDK shape comes from the installed package's `.d.ts` — not workspace `node_modules` symlinks, not stale source clones. Reading
`node_modules/@zerobias-com/platform-sdk/dist/api/ProjectApi.d.ts` (installed 1.1.17) and `dist/model/NewProject.d.ts` revealed three distinct issues in `src/app/core/services/platform-engagement-provisioner.service.ts` that the `as never` cast pattern was hiding.

## The three bugs

### (a) `Project.list({...})` probes silently ignore tagId / parentId filters

**SDK shape:**
```ts
list(
  pageNumber?: number,
  pageSize?: number,
  boundaryId?: UUID,
  ownerId?: UUID,
  status?: ProjectStatusDef,
  visibility?: ProjectVisibilityDef,
  sort?: SortObject,
  pageToken?: string,
): Promise<PagedResults<Project>>
```

All positional. No `tagId`, no `parentId`, no `name`.

**Existing code** (lines 222-228, 285-290):
```ts
.list({
  ownerId: buyerOrgId as never,
  tagId: tagId as never,
  pageSize: 1,
} as never)
```

The object goes in the `pageNumber` slot — coerced to NaN — and every named field after it is silently dropped. The probe is effectively `list()` with all defaults, returning the org's first page of platform Projects regardless of `tagId` or `parentId`.

**Why it hasn't bitten yet:** new orgs have 0 prior platform Projects → returns empty → falls through to create (correct outcome by accident). Already-provisioned single-engagement orgs return the engagement Project as their only result (correct outcome by accident). Specs stub the return values directly, hiding the shape mismatch.

**Where it breaks:** the moment an org has more than one platform Project — which is the explicit D-46 future state (an org with multiple marketplace engagements). Probe could return the wrong Project, satisfying idempotency against the wrong target.

### (b) `Project.create` payload's `ownerId` is silently dropped

**SDK shape:**
```ts
class NewProject {
  name: string;
  status: ProjectStatusDef;
  visibility: ProjectVisibilityDef;
  membershipPolicy: MembershipPolicyDef;
  description?: string | null;
  boundaryId?: UUID | null;
  parentId?: UUID | null;
  tagId?: UUID | null;
}
```

No `ownerId`.

**Existing code** (lines 237-246, 299-308):
```ts
.create({
  name: ...,
  status: PROJECT_STATUS as never,
  ...
  ownerId: buyerOrgId as never,   // ← silently dropped
  parentId: null as never,
  tagId: tagId as never,
} as never)
```

The intent — "make `buyerOrgId` the owner of this Project" — is dropped on the floor. Server derives `ownerId` from session context (the `Dana-Org-Id` header, populated from `sessionStorage['zb-current-dana-org-id']`).

**Why it hasn't bitten yet:** for W3Geekery dogfooding (and Brian's-Org dogfooding), the user IS logged into their own org session, so session-derived `ownerId` happens to equal `buyerOrgId`. The buyer-org-owner intent works accidentally.

**Where it breaks:** Phase 31 admin-tab re-provisioning. If a marketplace operator (W3Geekery user) re-provisions Brian's-Org from their operator session, the new Engagement Project would be owned by W3Geekery, not Brian's-Org. Mitigation requires either: (i) switching the session org to the target before calling provisioner, or (ii) a different SDK mechanism for cross-org provisioning (does not appear to exist in 1.1.17).

### (c) `Project.create` uses object-literal-with-cast instead of `new NewProject(...)`

The TypeScript class has an attribute name-mapping table (`NewProject.attributeTypeMap`, lines 15-20 of NewProject.d.ts). Calling the constructor runs that mapping (potentially camelCase → API field renames, type conversion via `Nmtoken`/`UUID` brand types). Passing a plain object via `.create({...} as never)` bypasses the mapping entirely.

**Why it hasn't bitten yet:** field names happen to match the wire format for the fields we set. UUID-typed fields accept raw strings at runtime. If the platform team ever adds an attribute rename to the mapping table, the existing code breaks silently.

**Why hygiene matters anyway:** the codebase has a precedent of using SDK constructors correctly — `new CreateTagBody(...)` on line 177, `new TagSearchBody()` on lines 94/166. Project create stuck out as inconsistent. Consistency makes the next reader trust the codebase.

## Common root cause

All three bugs hide behind the same `as never` cast applied at call sites. `as never` is TypeScript's universal escape hatch — it satisfies any expected type without checking the value. It's appropriate at clear type-system-vs-runtime boundaries (e.g., converting branded UUID types) but inappropriate when applied to entire arguments, where it silently masks shape mismatches against the actual SDK contract.

## Fix prescription

Fixed alongside D-49-NAMESPACE-MIGRATE-1 in the same commit. Summary of changes to `provisioner.service.ts`:

1. **Probe sites** (`isOrgProvisioned`, `ensureEngagementProject`, `ensureProjectTier`) use the positional `list()` signature: `list(undefined, 100, undefined, buyerOrgId as never)` — server-filters by `ownerId`, client-filters the result by `parentId` + `tagId`. Page-size of 100 covers single-engagement orgs today; a follow-up BACKLOG item tracks pagination for D-46 multi-engagement future state.

2. **Create sites** use `new NewProject(...)` constructor with positional args + field assignment for optional fields. `ownerId` line removed (was silently dropped anyway); replaced with a code comment documenting that `ownerId` is session-derived.

3. **D-49 namespace migration**: probe both `sme-mart.engagement.*` (new) and `sme-mart.eng.*` (legacy) tag namespaces; create new tags in `sme-mart.engagement.*` exclusively. Legacy tags coexist harmlessly per D-43 (d).

## Disposition

- Filed and fixed in the same parkit-9 follow-up sequence (Phase 30 fully closed; PRECOMMIT-TSC-GATE-1 just landed at `5e9e1b4`, now hook-enforced).
- BACKLOG entry `D-49-NAMESPACE-MIGRATE-1` marked DONE in the same commit.
- New BACKLOG entry filed for pagination in `Project.list` probes when D-46 multi-engagement future state lands.

## Related

- D-49 (engagement namespace, `sme-mart.engagement.*` full word; supersedes `sme-mart.eng.*` for NEW tags).
- D-43 (engagement tag namespace + classifier pattern; anti-pattern (d) forbids UUID-churn renames of legacy tags).
- D-46 (future state: multiple platform engagements per org via tags-not-nesting; defines when the page-size assumption breaks).
- Errata 030 (D-49 namespace drift; the original errata that surfaced this file; this errata expands the surface).
- `feedback_sdk_shape_verify_source_provenance` (SDK shape verification methodology — read installed `.d.ts`, not workspace symlinks).
- BACKLOG: `D-49-NAMESPACE-MIGRATE-1` (marked DONE same commit).
