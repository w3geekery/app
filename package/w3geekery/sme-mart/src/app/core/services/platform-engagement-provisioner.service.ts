import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { CreateTagBody, TagSearchBody } from '@zerobias-com/hydra-sdk';
import { NewProject } from '@zerobias-com/platform-sdk';
import { Nmtoken } from '@zerobias-org/types-core-js';
import { slugify } from '../utils/slug';

// Step A: engagement-tag values (D-25, D-26, D-27)
const TAG_TYPE = 'marketplace';
const PLATFORM_SUPPLY_SLUG = 'zerobias';
const MARKETPLACE_OPERATOR_ORG_ID = 'cd7105df-523d-5392-9f9a-3f83d3f30107'; // W3Geekery; TODO: externalize to env

// D-49 namespace migration (errata 030 + 036): probes scan BOTH namespaces;
// creation uses NEW exclusively going forward. Legacy tags coexist per D-43 (d)
// (no UUID-churn renames).
const ENGAGEMENT_TAG_NAMESPACE_NEW = 'sme-mart.engagement.';
const ENGAGEMENT_TAG_NAMESPACE_LEGACY = 'sme-mart.eng.';
const buildEngagementTagName = (namespace: string, slug: string): string =>
  `${namespace}${PLATFORM_SUPPLY_SLUG}-to-${slug}`;

// Project.list() probe page-size. Covers single-engagement orgs (v1.4 norm).
// When D-46 multi-engagement future state lands, switch to pagination loop —
// see BACKLOG PROVISIONER-PROBE-PAGINATION-1.
const PROBE_PAGE_SIZE = 100;

// Tier-identity tag bootstrap UUIDs (created once per env; cached as constants).
// UAT values validated empirically 2026-05-12. ci/prod: TBD — see BACKLOG TIER-TAG-ENV-BOOTSTRAP-1.
// Per D-50 canonical tier mapping: depth 2 = Project tier (FIXED), tag = sme-mart.tier.project.
const SME_MART_TIER_PROJECT_TAG_ID = '420b0753-e72c-4b81-8929-70508a119bf0'; // UAT

// Step C: engagement-project values (D-32, D-33)
const ENGAGEMENT_PROJECT_NAME_TEMPLATE = (orgName: string) => `${orgName} <- ZeroBias`; // D-32
const ENGAGEMENT_PROJECT_DESCRIPTION_TEMPLATE = (orgName: string) =>
  `Platform Services Engagement: ZeroBias ➡️ ${orgName}`; // D-33 (no trailing period)

// Step D: project-tier values (depth 2; FIXED per D-50; locked verbiage D-34/D-35)
const PROJECT_TIER_NAME = 'ZeroBias Platform'; // D-34
const PROJECT_TIER_DESCRIPTION_TEMPLATE = (orgName: string) =>
  `${orgName}'s gateway into ZeroBias — tasks, notes, and communication tied to the ZeroBias ➡️ ${orgName} platform engagement live here.`; // D-35

// Enum values (locked per MCP describe D-29, INVENTORY.md confirms)
const PROJECT_STATUS = 'active'; // D-29
const PROJECT_VISIBILITY = 'internal'; // D-29 (org-members only)
const PROJECT_MEMBERSHIP_POLICY = 'private'; // D-29 (no auto-join; admin-curated)

/**
 * PlatformEngagementProvisioner provisions the org's "platform engagement" — the
 * (org <-> ZeroBias) engagement for platform services, distinct from the org's
 * vendor engagements with marketplace providers.
 *
 * v3 recipe (3 SDK calls per provisioning; validated empirically on UAT 2026-05-12):
 *   A. Create hydra marketplace Tag for the engagement identity (NEW namespace).
 *   C. Create platform.Project (Engagement, depth 1; FIXED tier per D-50)
 *      — auto-creates default Board; auto-assigns creator as Lead
 *   D. Create child platform.Project (Project tier, depth 2; FIXED tier per D-50)
 *      — tagged with SME_MART_TIER_PROJECT_TAG_ID so the tier is queryable
 *      — auto-creates default Board; auto-assigns creator as Lead (D-48 cascade)
 *
 * Steps F (explicit Board creation) and G (explicit member add) were dropped post-Plan-02
 * once UAT validation 2026-05-12 confirmed platform.Project.create's auto-Board + auto-Lead
 * behaviors obviate them. See DEVIATION-29.5-02-V3 in 29.5-WAVE-2-CLOSE.md.
 *
 * Depth-3+ middle tiers (Workspace/Aperture/Thread per Brian's canonical sketch) are
 * RENAMEABLE and NOT instantiated by v1.4.
 *
 * Each step has an idempotency probe to detect and skip already-created resources,
 * enabling failure-resumable provisioning on retry. All probes use the positional
 * SDK.list() signature + client-side filter — see errata 036 (a) for why object-form
 * .list({tagId, parentId}) was silently ignored by previous versions.
 *
 * NOTE on ownership: the platform-sdk NewProject DTO does NOT accept ownerId
 * (errata 036 (b)). Server derives ownerId from session context (Dana-Org-Id header).
 * The caller's session must be on the buyer org BEFORE calling this method — Phase 31
 * admin-tab work must handle session-switching for cross-org operator provisioning.
 *
 * Per Phase 29.5 CONTEXT.md (D-29..D-37, D-46, D-48, D-49, D-50).
 */
@Injectable({ providedIn: 'root' })
export class PlatformEngagementProvisioner {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Read-only: returns true iff the org has a provisioned platform engagement.
   *
   * Authoritative signal is the existence of an Engagement Project (depth 1,
   * parentId==null) whose tagId resolves to a hydra marketplace Tag in either
   * the NEW namespace (`sme-mart.engagement.`) or LEGACY namespace
   * (`sme-mart.eng.`). Probes both namespaces; verifies the Engagement Project
   * actually exists (defends against orphan-tag false-positive: the Brian's-Org
   * case where the tag survived after the Project was deleted).
   *
   * Slug source (in order): platform-canonical `orgSlug` from `Org.slug`, or
   * `slugify(orgName)` fallback. Platform slug is preferred because it's
   * lowercased nmtoken with no whitespace/punctuation surprises (e.g.
   * "Brian Hierholzer Inc." -> platform=`brianhierholzer`, fallback=`brian-hierholzer-inc`).
   *
   * Returns `false` on probe error — caller treats "no tag/project found" and
   * "probe failed" the same: route the user to the holding page; do not auto-create.
   *
   * Used by `onboardingGuard` to decide whether the user can use the app.
   * NEVER triggers any create — pure read.
   */
  async isOrgProvisioned(orgId: string, orgName: string, orgSlug?: string): Promise<boolean> {
    if (!orgId || !orgName) return false;
    const slug = orgSlug || slugify(orgName);
    const candidateTagNames = [
      buildEngagementTagName(ENGAGEMENT_TAG_NAMESPACE_NEW, slug),
      buildEngagementTagName(ENGAGEMENT_TAG_NAMESPACE_LEGACY, slug),
    ];
    try {
      // Step 1: find candidate tag IDs across both namespaces (sequential; NEW first).
      const tagIds: string[] = [];
      for (const tagName of candidateTagNames) {
        const body = new TagSearchBody();
        body.name = tagName;
        const result = await this.clientApi.hydraClient
          .getTagApi()
          .searchTags(1, 1, undefined, body);
        if (result && result.items && result.items.length > 0) {
          tagIds.push(String(result.items[0].id));
        }
      }
      if (tagIds.length === 0) return false;

      // Step 2: server-filter Projects by ownerId; client-filter by parentId+tagId.
      // SDK 1.1.17 list() doesn't expose tagId/parentId server filters (errata 036 (a)).
      const projects = await this.clientApi.platformClient
        .getProjectApi()
        .list(undefined, PROBE_PAGE_SIZE, undefined, orgId as never);
      const engagementProject = projects?.items?.find(
        (p) => p.parentId == null && p.tagId != null && tagIds.includes(String(p.tagId)),
      );
      return !!engagementProject;
    } catch (err) {
      console.warn('[PLATFORM_ENGAGEMENT_PROBE_FAILED]', { orgId, error: err });
      return false;
    }
  }

  /**
   * Ensures the target Org has a platform engagement.
   * Idempotent: fires at most once per Org. Failure-resumable: retries detect partial state.
   *
   * Uses the v3 platform.Project recipe (Steps A/C/D, 3 SDK creates).
   * Default Board and Project Lead are auto-created by platform.Project.create.
   *
   * @param input.currentOrgId — Buyer org UUID
   * @param input.currentOrgName — Buyer org display name (for tag/project strings)
   * @param input.currentOrgSlug — Buyer org slug (preferred); falls back to slugify(orgName)
   * @returns { engagementProjectId, projectTierProjectId, created: boolean }
   * @throws Error if any step fails after snackbar
   */
  async ensurePlatformEngagement(input: {
    currentOrgId: string;
    currentOrgName: string;
    currentOrgSlug?: string;
  }): Promise<{ engagementProjectId: string; projectTierProjectId: string; created: boolean }> {
    const { currentOrgId, currentOrgName, currentOrgSlug } = input;

    // Idempotency probe: check if platform engagement already exists.
    const orgSlug = currentOrgSlug || slugify(currentOrgName);
    const isProvisioned = await this.isOrgProvisioned(currentOrgId, currentOrgName, orgSlug);

    if (isProvisioned) {
      return { engagementProjectId: '', projectTierProjectId: '', created: false };
    }

    // Step A: Create hydra tag (identity; NEW namespace per D-49).
    const tagId = await this.ensureTag(orgSlug, currentOrgId, currentOrgName);

    // Step C: Create Engagement Project (depth 1; FIXED tier; auto-Board + auto-Lead).
    const engagementProjectId = await this.ensureEngagementProject(
      currentOrgName,
      currentOrgId,
      tagId,
    );

    // Step D: Create Project-tier Project (depth 2; FIXED tier per D-50).
    const projectTierProjectId = await this.ensureProjectTier(
      currentOrgName,
      currentOrgId,
      engagementProjectId,
    );

    return { engagementProjectId, projectTierProjectId, created: true };
  }

  /**
   * Step A: Create or reuse a hydra Tag for the engagement (NEW namespace only).
   *
   * Probe scans NEW namespace only — legacy tags coexist harmlessly per D-43 (d).
   * Re-provisioning an org with an orphan legacy tag creates a fresh NEW-namespace
   * tag; the orphan stays put with its UUID stable.
   *
   * Tag ownerId is the marketplace operator org (W3Geekery today) so that probes
   * from any operator-admin session resolve correctly across customers.
   */
  private async ensureTag(orgSlug: string, _orgId: string, orgName: string): Promise<string> {
    const tagName = buildEngagementTagName(ENGAGEMENT_TAG_NAMESPACE_NEW, orgSlug);
    try {
      // Probe: does tag already exist (NEW namespace)?
      const body = new TagSearchBody();
      body.name = tagName;
      const existing = await this.clientApi.hydraClient
        .getTagApi()
        .searchTags(1, 1, undefined, body);

      if (existing && existing.items && existing.items.length > 0) {
        return String(existing.items[0].id);
      }

      // Create — per DECISIONS.md "Marketplace tagType Is Preferred" + 2026-05-07 ownership rule.
      const createBody = new CreateTagBody(
        tagName,
        undefined, // id — auto-generated
        `Marketplace tag for the platform-services engagement: ZeroBias ➡️ ${orgName}.`,
        MARKETPLACE_OPERATOR_ORG_ID as never,
        new Nmtoken(TAG_TYPE),
      );

      const created = await this.clientApi.hydraClient.getTagApi().createTag(createBody);

      return String(created.id);
    } catch (err) {
      console.warn('[PLATFORM_ENGAGEMENT_FAILURE]', {
        step: 'A',
        callSiteTag: 'platform-engagement:ensure-tag',
        error: err,
      });
      this.snackBar.open('Setup in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

  /**
   * Step C: Create Engagement Project (depth 1; FIXED tier per D-50).
   *
   * Top-level Project, tagged with the engagement-identity tag from Step A.
   * boundaryId is intentionally omitted — Engagement is org-level scope per
   * ENGAGEMENT-BOUNDARY-SCOPE-REVISIT-1 (and D-47 boundary subset chain bug
   * means we cannot rely on boundary inheritance today).
   *
   * Auto-side-effects of platform.Project.create (verified UAT 2026-05-12):
   *   - default Board created (name "{projectName} Board"; v1.4 accepts auto-name)
   *   - creator auto-assigned as Project Lead
   *
   * Idempotent: server-filters Projects by ownerId; client-filters by parentId==null
   * + tagId==<engagement tagId>. See errata 036 (a) for why .list({tagId, parentId})
   * was previously silently ignored.
   */
  private async ensureEngagementProject(
    orgName: string,
    buyerOrgId: string,
    tagId: string,
  ): Promise<string> {
    try {
      const all = await this.clientApi.platformClient
        .getProjectApi()
        .list(undefined, PROBE_PAGE_SIZE, undefined, buyerOrgId as never);
      const existing = all?.items?.find(
        (p) => p.parentId == null && p.tagId != null && String(p.tagId) === tagId,
      );
      if (existing) {
        return String(existing.id);
      }

      // Construct via NewProject (errata 036 (c)); ownerId server-derived from
      // session (errata 036 (b) — NewProject DTO has no ownerId field).
      const newProject = new NewProject(
        ENGAGEMENT_PROJECT_NAME_TEMPLATE(orgName),
        PROJECT_STATUS as never,
        PROJECT_VISIBILITY as never,
        PROJECT_MEMBERSHIP_POLICY as never,
        ENGAGEMENT_PROJECT_DESCRIPTION_TEMPLATE(orgName),
      );
      newProject.parentId = null;
      newProject.tagId = tagId as never;

      const created = await this.clientApi.platformClient
        .getProjectApi()
        .create(newProject);

      return String(created.id);
    } catch (err) {
      console.warn('[PLATFORM_ENGAGEMENT_FAILURE]', {
        step: 'C',
        callSiteTag: 'platform-engagement:ensure-engagement-project',
        error: err,
      });
      this.snackBar.open('Setup in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

  /**
   * Step D: Create Project-tier Project (depth 2; FIXED tier per D-50).
   *
   * Child of the Engagement Project. Tagged with SME_MART_TIER_PROJECT_TAG_ID
   * so the tier is queryable via hydra. Display name is the locked constant
   * "ZeroBias Platform" (D-34); description from D-35 with ${orgName} substituted.
   *
   * Per D-50: this is the "Project" tier — NOT "Workspace". Workspace/Aperture/Thread
   * are renameable depth-3+ tiers NOT instantiated by v1.4.
   *
   * Auto-side-effects of platform.Project.create (verified UAT 2026-05-12):
   *   - default Board created (name "ZeroBias Platform Board"; v1.4 accepts auto-name)
   *   - creator auto-assigned as Project Lead (D-48 cascade inherits from parent chain)
   *
   * Idempotent: server-filters Projects by ownerId; client-filters by
   * parentId==engagementProjectId. See errata 036 (a).
   */
  private async ensureProjectTier(
    orgName: string,
    buyerOrgId: string,
    engagementProjectId: string,
  ): Promise<string> {
    try {
      const all = await this.clientApi.platformClient
        .getProjectApi()
        .list(undefined, PROBE_PAGE_SIZE, undefined, buyerOrgId as never);
      const existing = all?.items?.find(
        (p) => p.parentId != null && String(p.parentId) === engagementProjectId,
      );
      if (existing) {
        return String(existing.id);
      }

      // Construct via NewProject (errata 036 (c)); ownerId server-derived (errata 036 (b)).
      const newProject = new NewProject(
        PROJECT_TIER_NAME,
        PROJECT_STATUS as never,
        PROJECT_VISIBILITY as never,
        PROJECT_MEMBERSHIP_POLICY as never,
        PROJECT_TIER_DESCRIPTION_TEMPLATE(orgName),
      );
      newProject.parentId = engagementProjectId as never;
      newProject.tagId = SME_MART_TIER_PROJECT_TAG_ID as never;

      const created = await this.clientApi.platformClient
        .getProjectApi()
        .create(newProject);

      return String(created.id);
    } catch (err) {
      console.warn('[PLATFORM_ENGAGEMENT_FAILURE]', {
        step: 'D',
        callSiteTag: 'platform-engagement:ensure-project-tier',
        error: err,
      });
      this.snackBar.open('Setup in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }
}

// Re-export SME_MART_TIER_PROJECT_TAG_ID from new constants file for caller stability
// (engagements.service and feature-coming-soon need this constant)
export { SME_MART_TIER_PROJECT_TAG_ID } from '../constants/tier-tags';
