import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { CreateTagBody, TagSearchBody } from '@zerobias-com/hydra-sdk';
import { Nmtoken } from '@zerobias-org/types-core-js';
import { slugify } from '../utils/slug';

// Step A: engagement-tag values (D-25, D-26, D-27)
const TAG_TYPE = 'marketplace';
const PLATFORM_SUPPLY_SLUG = 'zerobias';
const MARKETPLACE_OPERATOR_ORG_ID = 'cd7105df-523d-5392-9f9a-3f83d3f30107'; // W3Geekery; TODO: externalize to env

// Tier-identity tag bootstrap UUIDs (created once per env; cached as constants).
// UAT values validated empirically 2026-05-12. ci/prod: TBD — see BACKLOG TIER-TAG-ENV-BOOTSTRAP-1.
// Per D-50 canonical tier mapping: depth 2 = Project tier (FIXED), tag = sme-mart.tier.project.
// sme-mart.tier.workspace UUID (UAT 2d7e6b6d-62e1-4691-958c-41cd1b8de043) is reserved for renameable
// depth-3+ middle tiers but NOT instantiated by v1.4 — intentionally not declared as a constant
// until a consumer exists.
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
 *   A. Create hydra marketplace Tag for the engagement identity
 *   C. Create platform.Project (Engagement, depth 1; FIXED tier per D-50)
 *      — auto-creates default Board (named "{name} Board"); auto-assigns creator as Lead
 *   D. Create child platform.Project (Project tier, depth 2; FIXED tier per D-50)
 *      — tagged with SME_MART_TIER_PROJECT_TAG_ID so the tier is queryable
 *      — auto-creates default Board; auto-assigns creator as Lead
 *      — D-48 Project Lead cascade inherits down the parentId chain
 *
 * Steps F (explicit Board creation) and G (explicit member add) were dropped post-Plan-02
 * once UAT validation 2026-05-12 confirmed platform.Project.create's auto-Board + auto-Lead
 * behaviors obviate them. See DEVIATION-29.5-02-V3 in 29.5-WAVE-2-CLOSE.md.
 *
 * Depth-3+ middle tiers (Workspace/Aperture/Thread per Brian's canonical sketch) are
 * RENAMEABLE and NOT instantiated by v1.4. SME_MART_TIER_WORKSPACE_TAG_ID is reserved
 * for future use; v1.4 does not create depth-3 children.
 *
 * Each step has an idempotency probe to detect and skip already-created resources,
 * enabling failure-resumable provisioning on retry.
 *
 * Per Phase 29.5 CONTEXT.md (D-29..D-37, D-46, D-48, D-50).
 */
@Injectable({ providedIn: 'root' })
export class PlatformEngagementProvisioner {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Read-only: returns true iff the org has a provisioned platform engagement.
   *
   * Authoritative signal is the hydra marketplace Tag named
   * `sme-mart.eng.zerobias-to-{orgSlug}` (per DECISIONS.md 2026-05-07 identity-tag
   * convention: `{supply}-to-{demand}`). Tag is owned by the marketplace operator
   * org (today W3Geekery) so probes from any operator-admin session resolve
   * correctly. Hydra is independent of AuditgraphDB, so this probe is decoupled
   * from GQL boundary failures.
   *
   * Slug source (in order): platform-canonical `orgSlug` from `Org.slug`, or
   * `slugify(orgName)` fallback. Platform slug is preferred because it's
   * lowercased nmtoken with no whitespace/punctuation surprises (e.g.
   * "Brian Hierholzer Inc." -> platform=`brianhierholzer`, fallback=`brian-hierholzer-inc`).
   *
   * Returns `false` on probe error — caller treats "no tag found" and "probe
   * failed" the same: route the user to the holding page; do not auto-create.
   *
   * Used by `onboardingGuard` to decide whether the user can use the app.
   * NEVER triggers any create — pure read.
   */
  async isOrgProvisioned(orgId: string, orgName: string, orgSlug?: string): Promise<boolean> {
    if (!orgId || !orgName) return false;
    const slug = orgSlug || slugify(orgName);
    const tagName = `sme-mart.eng.${PLATFORM_SUPPLY_SLUG}-to-${slug}`;
    try {
      const body = new TagSearchBody();
      body.name = tagName;
      const result = await this.clientApi.hydraClient
        .getTagApi()
        .searchTags(1, 1, undefined, body);
      return !!(result && result.items && result.items.length > 0);
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

    // Idempotency probe: check if platform engagement already exists via tag search
    const orgSlug = currentOrgSlug || slugify(currentOrgName);
    const isProvisioned = await this.isOrgProvisioned(currentOrgId, currentOrgName, orgSlug);

    if (isProvisioned) {
      return { engagementProjectId: '', projectTierProjectId: '', created: false };
    }

    // Step A: Create hydra tag (identity)
    const tagId = await this.ensureTag(orgSlug, currentOrgId, currentOrgName);

    // Step C: Create Engagement Project (depth 1; FIXED tier; auto-Board + auto-Lead)
    const engagementProjectId = await this.ensureEngagementProject(
      currentOrgName,
      currentOrgId,
      tagId,
    );

    // Step D: Create Project-tier Project (depth 2; FIXED tier per D-50; auto-Board + auto-Lead)
    const projectTierProjectId = await this.ensureProjectTier(
      currentOrgName,
      currentOrgId,
      engagementProjectId,
    );

    return { engagementProjectId, projectTierProjectId, created: true };
  }

  /**
   * Step A: Create or reuse a hydra Tag for the engagement.
   *
   * Tag name follows the {supply}-to-{demand} identity convention (DECISIONS.md
   * 2026-05-07). Tag ownerId is the marketplace operator org (W3Geekery today)
   * so that probes from any operator-admin session resolve correctly — the prior
   * scheme owned tags by the customer org, which made cross-customer probes blind.
   */
  private async ensureTag(orgSlug: string, _orgId: string, orgName: string): Promise<string> {
    const tagName = `sme-mart.eng.${PLATFORM_SUPPLY_SLUG}-to-${orgSlug}`;
    try {
      // Probe: does tag already exist?
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
   * Idempotent: probe returns existing project ID if already created.
   */
  private async ensureEngagementProject(
    orgName: string,
    buyerOrgId: string,
    tagId: string,
  ): Promise<string> {
    try {
      // Probe: does engagement project already exist?
      const existing = await this.clientApi.platformClient
        .getProjectApi()
        .list({
          ownerId: buyerOrgId as never,
          tagId: tagId as never,
          pageSize: 1,
        } as never);

      if (existing && existing.items && existing.items.length > 0) {
        return String(existing.items[0].id);
      }

      // Create — boundaryId omitted (org-level; ENGAGEMENT-BOUNDARY-SCOPE-REVISIT-1).
      const created = await this.clientApi.platformClient
        .getProjectApi()
        .create({
          name: ENGAGEMENT_PROJECT_NAME_TEMPLATE(orgName),
          description: ENGAGEMENT_PROJECT_DESCRIPTION_TEMPLATE(orgName),
          status: PROJECT_STATUS as never,
          visibility: PROJECT_VISIBILITY as never,
          membershipPolicy: PROJECT_MEMBERSHIP_POLICY as never,
          ownerId: buyerOrgId as never,
          parentId: null as never,
          tagId: tagId as never,
        } as never);

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
   * Idempotent: probe returns existing project ID if already created.
   */
  private async ensureProjectTier(
    orgName: string,
    buyerOrgId: string,
    engagementProjectId: string,
  ): Promise<string> {
    try {
      // Probe: does the project-tier child already exist?
      const existing = await this.clientApi.platformClient
        .getProjectApi()
        .list({
          parentId: engagementProjectId as never,
          pageSize: 1,
        } as never);

      if (existing && existing.items && existing.items.length > 0) {
        return String(existing.items[0].id);
      }

      // Create — depth-2 Project tier, tagged for queryability.
      const created = await this.clientApi.platformClient
        .getProjectApi()
        .create({
          name: PROJECT_TIER_NAME,
          description: PROJECT_TIER_DESCRIPTION_TEMPLATE(orgName),
          status: PROJECT_STATUS as never,
          visibility: PROJECT_VISIBILITY as never,
          membershipPolicy: PROJECT_MEMBERSHIP_POLICY as never,
          ownerId: buyerOrgId as never,
          parentId: engagementProjectId as never,
          tagId: SME_MART_TIER_PROJECT_TAG_ID as never,
        } as never);

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
