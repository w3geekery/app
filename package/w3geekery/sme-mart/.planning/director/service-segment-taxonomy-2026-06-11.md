# ServiceSegment Taxonomy — Catalog-Shadow Design (SME Mart interim, Content-absorbable)

**Author:** Director Parks · **Date:** 2026-06-11 · **Status:** DESIGN — ready to author
**Decision owner:** Clark (2026-06-11) · **Eventual owner:** Content team (Daniel Rojas)
**Related:** `profile-migration-mapping-2026-06-08.md` §7.1 (the ServiceSegment build-breaker this resolves), D-54, the SecurityCredential/UserCredential/OrgCredential precedent.

---

## Decision

The platform Catalog has no professional-services taxonomy — its `Service` segment type holds **2** dev-infra entries (`s_phs` Package Hosting Service, `s_des` Development Environment Service), neither relevant to SME Mart's managed-service lines. The 9 service lines SME Mart uses today are hand-rolled `hydra` tags (`tagType: service-segment`) — a workaround we will **not** cement into the new GQL schema.

**We build the service-line taxonomy ourselves, in the SME Mart schema, as a typed class (`ServiceSegment`) — but shaped as a faithful shadow of a Catalog Service-type Segment, so the Content team can absorb it into the platform Catalog later with near-zero rework.** Same pattern as credentialing (we own `SecurityCredential`/`UserCredential`/`OrgCredential` until the platform does).

**Why ours, not the Catalog, now:** it *should* be Content-owned, but Daniel's queue is long. Rather than block on the platform, we shadow it — and design to-spec so the eventual lift is a content migration, not a redesign.

---

## Design principle: build it as if it were already in the Catalog

Every `ServiceSegment` field mirrors a real Catalog `Segment` field (same name, same meaning). We carry the **content** fields and deliberately drop the **publishing machinery** (versioning, artifact/packageCode, compliance-feature/product cross-links, taskId) — that's platform infrastructure we can't and shouldn't replicate. The result: when Content creates these as real Catalog segments, the mapping is field-for-field.

### Field correspondence (our `ServiceSegment` <-> Catalog `Segment`)

| Catalog `Segment` field | our `ServiceSegment` field | carry? | note |
|---|---|---|---|
| `name` | `name` (Object-inherited) | YES | display name, e.g. "Security Operations Center (SOC)" |
| `description` | `description` (Object-inherited) | YES | long description |
| `code` | `code` | YES | `s_`-prefixed, e.g. `s_soc` — mirrors Catalog convention (`s_phs`/`s_des`) |
| `externalId` | `externalId` | YES | Catalog sets = name; we mirror |
| `segmentType.code` (= "service") | `segmentTypeCode` | YES | fixed `"service"` — the Catalog discriminator |
| `isService` | `isService` | YES | fixed `true` (derivable from segmentTypeCode) |
| `aliases[]` | `aliases` (multi) | YES | alternate names + the OLD hydra tag code (preserves lookup) |
| `parentIds[]`/`parents[]` | `parentIds` (multi) | YES | **points at REAL Catalog Domain segment UUIDs** — pre-wires the hierarchy |
| `imageUrl` | `imageUrl` | YES | optional icon |
| `status` | `status` | YES | `"published"`/`"draft"` (mirrors CatalogPublishStatusEnum as string) |
| (display order) | `rank` | YES | integer sort order |
| `ownerId` | `ownerId` | optional | System for our seed; mirrors Catalog (System-owned segments) |
| `id` | `id` (Object-inherited) | YES | our UUID interim -> swapped for Catalog UUID on absorption |
| `latestVersionId`/`versionSemver`/… | — | DROP | platform versioning machinery |
| `artifactId`/`packageCode`/`publishedArtifactName` | — | DROP | npm publishing machinery |
| `complianceFeatureIds`/`productIds` | — | DROP | Catalog cross-links we don't own |
| `taskId`/`boundaryId` | — | DROP | platform internals |

**No `verified`/`verificationSource`** — this is a taxonomy node, not a claim. Verification provenance (D-53) lives on the **junction** (`ProviderServiceSegment`), not here. **No `orgId`** — it's a global reference set, like Catalog segments (not org-scoped, unlike the Provider* junctions).

---

## Drafted class — `ServiceSegment.yml` (modeled on the existing `OrgSegment`/`Address` class style)

```yaml
description: "Interim SME Mart shadow of a Catalog Service-type Segment: a professional/managed service line a provider can offer (SOC, pentesting, compliance, etc.). The platform Catalog has no professional-services taxonomy (its Service type holds 2 dev-infra entries), so SME Mart owns this until Content absorbs it. Shaped field-for-field like a Catalog Segment (code/name/aliases/parentIds/segmentTypeCode) so absorption is a content lift, not a redesign. Global reference set (no orgId); not a claim (verification lives on ProviderServiceSegment). parentIds point at real Catalog Domain segment UUIDs to pre-wire the hierarchy."
extends:
  - Object
properties:
  - code:
    field: serviceSegment.code
  - externalId:
    field: serviceSegment.externalId
  - segmentTypeCode:
    field: serviceSegment.segmentTypeCode
  - isService:
    field: serviceSegment.isService
  - aliases:
    field: serviceSegment.aliases
  - parentIds:
    field: serviceSegment.parentIds
  - imageUrl:
    field: serviceSegment.imageUrl
  - status:
    field: serviceSegment.status
  - rank:
    field: serviceSegment.rank
  - ownerId:
    field: serviceSegment.ownerId
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Code":
    jsonata: code
    sort: code
  "Status":
    jsonata: status
    sort: status
```

`aliases` and `parentIds` are marked **multi** in their field YAMLs (the `mark as multi` pattern — cf. `SmeMartProject.boundaryIds`). All field types are schema-valid (string/boolean/integer; no `datetime`). `name`/`description`/`id`/`created`/`updated` are Object-inherited.

---

## Seed data — the 9 service lines as `ServiceSegment` rows

Pulled live from the existing hydra tags (2026-06-11), re-expressed in Catalog shape. **Codes, and especially `parentIds`, are PROPOSED — Daniel finalizes on absorption.** `aliases` preserve the old hydra tag name so any lookup still resolves.

| `code` | `name` | `description` | proposed `parentIds` (Catalog Domain) | `aliases` |
|---|---|---|---|---|
| `s_soc` | Security Operations Center (SOC) | Security monitoring / operations center | Cybersecurity `da9f392a-…` | soc, SOC |
| `s_noc` | Network Operations Center (NOC) | Network monitoring / operations center | IT Management `a7859b10-…` | noc, NOC |
| `s_pentest` | Penetration Testing | Offensive security testing engagements | Cybersecurity `da9f392a-…` | pentesting, pentest |
| `s_risk` | Risk Assessment | Security/compliance risk assessment services | Cybersecurity `da9f392a-…` | risk |
| `s_compliance` | Compliance Monitoring | Ongoing compliance monitoring services | Cybersecurity `da9f392a-…` | compliance |
| `s_bdr` | Backup and Disaster Recovery | Backup + DR managed services | IT Management `a7859b10-…` | bdr, BDR |
| `s_it` | Information Technology (IT) | Managed IT services | IT Management `a7859b10-…` | it, IT |
| `s_comms` | Telco / Communications | Telecommunications / managed comms | IT Management `a7859b10-…` | comms |
| `s_training` | Training | Security awareness / technical training | Cybersecurity `da9f392a-…` | training |

Real Catalog Domain UUIDs (verified live, CI): Cybersecurity `da9f392a-de06-4d6c-a607-22a941dd3a19` · IT Management `a7859b10-03f4-4b12-b65f-102545747fdd` (others available: Software Development `61cbad35-…`, Business Applications `87d10f57-…`).

This is a STARTER set (the 9 in use). The class is the taxonomy; rows can grow. A fuller MSSP/MSP service-line list is a content exercise for whoever owns it.

---

## Junction change — `ProviderServiceSegment` re-points to `ServiceSegment`

`ProviderServiceSegment.serviceSegmentId` (scalar UUID) currently has a description claiming "Catalog Service-type Segment" (the over-assumption from the original consolidation). Re-point it:

- **Now (interim):** `serviceSegmentId` references `ServiceSegment.id` (our class). Fix the description.
- **After absorption:** `serviceSegmentId` references the Catalog `Segment.id`. Same field, swapped target.

Only the description/target changes — the junction shape (orgId + serviceSegmentId + isPrimary + verified + verificationSource) stays. Resolution-on-read: `CatalogService` resolves the name from `ServiceSegment` now, from `platform.Segment` later.

---

## Absorption path (Content lift, later)

Because we built to the Catalog shape, the lift is near-mechanical:

1. Daniel creates these as real Catalog **Service-type segments** — our `code`/`name`/`description`/`parentIds`/`aliases` ARE the spec.
2. Map our `ServiceSegment.id` -> new Catalog `Segment.id`, 1:1 by `code`.
3. Re-point existing `ProviderServiceSegment.serviceSegmentId` values to the Catalog UUIDs (small data migration).
4. `catalog.service.loadServiceSegments()` switches from our `ServiceSegment` GQL query to `platform.Segment.list` filtered to `segmentTypeCode == "service"`.
5. Retire our `ServiceSegment` class via the canonical deprecation recipe (delete files + `deprecated.yml` manifest + whitelist — NOT a flag).

---

## App-side change (`catalog.service.ts`)

`loadServiceSegments()` today: `hydraClient.getTagApi().listTags(['service-segment'])`.
- **Interim:** query our `ServiceSegment` GQL class (org-agnostic global list), same `{id, name, ...}` shape the autocomplete consumes.
- **Post-absorption:** `platform.Segment.list` filtered to Service type.

The expertise component (`my-profile-expertise.component.ts`) is unaffected beyond name-resolution wiring — it consumes a list of `{id, name}`.

---

## Sequencing & scope vs Phase 33

This adds **one new class** (`ServiceSegment`) + a **one-line description/target fix** to `ProviderServiceSegment` — a small schema follow-up PR (Clark+Director hands-on: author -> `zbb gate` green -> PR -> Daniel approve -> publish), riding the next schema publish after 2.0.5.

This **reverses the earlier "defer ProviderServiceSegment from Phase 33" recommendation** — with a real taxonomy to point at, the junction comes back INTO Phase 33 scope, wired to `ServiceSegment`. Phase 33's service-segment piece is gated on this follow-up publishing, same as the rest of the phase is gated on schema being live.

**Recommended order:**
1. Author `ServiceSegment.yml` + field YAMLs + the `ProviderServiceSegment` description fix (this doc is the spec).
2. Seed the 9 rows (post-publish, via Pipeline.receive — clean-cut, no hydra-tag backfill per the §7.4 decision).
3. `zbb gate` -> PR -> publish (rides next schema cycle).
4. Phase 33 wires `ProviderServiceSegment` + `loadServiceSegments()` to `ServiceSegment`.

---

## Open questions (for Daniel / on absorption)

1. **Code scheme** — `s_soc`/`s_noc`/… acceptable, or does Content have a naming standard for service segments?
2. **Parent assignment** — proposed Cybersecurity/IT-Management domains; Content may want a dedicated "Managed Services" domain or finer parents.
3. **Hierarchy depth** — Catalog nests Domain > Category > Tool. Do service lines warrant sub-levels (e.g. SOC > MDR), or stay flat for v1? (Flat now; `parentIds` multi supports nesting later.)
4. **`segmentTypeCode` vs `isService`** — we carry both to mirror; confirm which the Catalog treats as canonical so we don't drift.
5. **Who seeds the fuller list** — the 9 are what's in use; a complete MSSP/MSP taxonomy is a content effort. Ours or Content's, and when?
