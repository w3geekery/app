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

// Step C: engagement-project values (D-32, D-33)
const ENGAGEMENT_PROJECT_NAME_TEMPLATE = (orgName: string) => `${orgName} <- ZeroBias`; // D-32
const ENGAGEMENT_PROJECT_DESCRIPTION_TEMPLATE = (orgName: string) =>
  `Platform Services Engagement: ZeroBias ➡️ ${orgName}`; // D-33 (no trailing period)

// Step D: workspace-project values (D-34, D-35)
const WORKSPACE_PROJECT_NAME = 'ZeroBias Platform'; // D-34
const WORKSPACE_PROJECT_DESCRIPTION_TEMPLATE = (orgName: string) =>
  `${orgName}'s gateway into ZeroBias — tasks, notes, and communication tied to the ZeroBias ➡️ ${orgName} platform engagement live here.`; // D-35

// Step F: default-board values (D-06, Step F locked name; D-30)
const DEFAULT_BOARD_NAME = 'ZeroBias Platform'; // D-06, Step F locked name
const DEFAULT_BOARD_TYPE = 'kanban'; // D-30
const DEFAULT_BOARD_IS_DEFAULT = true; // D-30

// Enum values (locked per MCP describe D-29/D-30, INVENTORY.md confirms)
const PROJECT_STATUS = 'active'; // D-29
const PROJECT_VISIBILITY = 'internal'; // D-29 (org-members only)
const PROJECT_MEMBERSHIP_POLICY = 'private'; // D-29 (no auto-join; admin-curated)
const BOARD_STATUS = 'active'; // D-30

/**
 * PlatformEngagementProvisioner provisions the org's "platform engagement" — the
 * (org <-> ZeroBias) engagement for platform services, distinct from the org's
 * vendor engagements with marketplace providers.
 *
 * 5-step recipe (Steps A/C/D/F/G):
 *   A. Create hydra marketplace Tag for the engagement
 *   ~~B~~. ~~Create platform coordination Task~~ DROPPED per D-08 (verification gate in Plan 06)
 *   C. Create platform.Project (engagement-as-Project hierarchy per D-01)
 *   D. Create child platform.Project (workspace, tagless per D-02)
 *   ~~E~~. ~~Pipeline.receive link~~ DROPPED per D-08 (Project.tagId built-in eliminates round-trip)
 *   F. Create default kanban Board on workspace Project (D-06 locked recipe step F)
 *   G. Add admin user as member of engagement Project
 *
 * Each step has an idempotency probe to detect and skip already-created resources,
 * enabling failure-resumable provisioning on retry.
 *
 * Per Phase 29.5 CONTEXT.md (D-06 locked recipe, D-29..D-37 enum values + verbiage).
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
   * Uses the 5-step platform.Project / platform.Board recipe (Steps A/C/D/F/G per D-06).
   * Steps B and E are dropped (D-08 verification gate in Plan 06).
   *
   * @param input.currentOrgId — Buyer org UUID
   * @param input.currentOrgName — Buyer org display name (for tag/project strings)
   * @param input.currentOrgSlug — Buyer org slug (preferred); falls back to slugify(orgName)
   * @param input.adminPrincipalId — Admin user principal UUID (added as member of engagement Project, Step G)
   * @returns { engagementProjectId, workspaceProjectId, boardId, created: boolean }
   * @throws Error if any step fails after snackbar
   */
  async ensurePlatformEngagement(input: {
    currentOrgId: string;
    currentOrgName: string;
    currentOrgSlug?: string;
    adminPrincipalId: string;
  }): Promise<{ engagementProjectId: string; workspaceProjectId: string; boardId: string; created: boolean }> {
    const { currentOrgId, currentOrgName, currentOrgSlug, adminPrincipalId } = input;

    // Idempotency probe: check if platform engagement already exists via tag search
    const orgSlug = currentOrgSlug || slugify(currentOrgName);
    const isProvisioned = await this.isOrgProvisioned(currentOrgId, currentOrgName, orgSlug);

    if (isProvisioned) {
      // TODO: Plan 06 verifies Governance rendering; return cached IDs if available
      return { engagementProjectId: '', workspaceProjectId: '', boardId: '', created: false };
    }

    // Step A: Create hydra tag
    const tagId = await this.ensureTag(orgSlug, currentOrgId, currentOrgName);

    // ~~Step B: Create coordination task~~ DROPPED per D-08 (verification gate in Plan 06)
    // ~~Step E: Pipeline.receive link~~ DROPPED per D-08 (tagId built-in eliminates round-trip)

    // Step C: Create engagement Project (top-level, tagged, buyer-anchored per D-03)
    const engagementProjectId = await this.ensureEngagementProject(
      currentOrgName,
      currentOrgId,
      tagId,
    );

    // Step D: Create workspace Project (child, tagless per D-02)
    const workspaceProjectId = await this.ensureWorkspaceProject(
      currentOrgName,
      currentOrgId,
      engagementProjectId,
    );

    // Step F: Create default kanban Board on workspace Project (D-06 locked step F)
    const boardId = await this.ensureDefaultBoard(workspaceProjectId);

    // Step G: Add admin user as member of engagement Project
    await this.ensureProjectMember(engagementProjectId, adminPrincipalId);

    return { engagementProjectId, workspaceProjectId, boardId, created: true };
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

  // ~~Step B: ensureTask~~ DROPPED per D-08 Engagement Task drop (Governance verification gate in Plan 06)

  /**
   * Step C: Create engagement Project (top-level, tagged, buyer-anchored per D-03).
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

      // Create new engagement project
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
   * Step D: Create workspace Project (child of engagement, tagless per D-02).
   * Idempotent: probe returns existing workspace project ID if already created.
   */
  private async ensureWorkspaceProject(
    orgName: string,
    buyerOrgId: string,
    engagementProjectId: string,
  ): Promise<string> {
    try {
      // Probe: does workspace project already exist (check for child with null tagId)?
      const existing = await this.clientApi.platformClient
        .getProjectApi()
        .list({
          parentId: engagementProjectId as never,
          pageSize: 1,
        } as never);

      if (existing && existing.items && existing.items.length > 0) {
        return String(existing.items[0].id);
      }

      // Create new workspace project (child, tagless per D-02)
      const created = await this.clientApi.platformClient
        .getProjectApi()
        .create({
          name: WORKSPACE_PROJECT_NAME,
          description: WORKSPACE_PROJECT_DESCRIPTION_TEMPLATE(orgName),
          status: PROJECT_STATUS as never,
          visibility: PROJECT_VISIBILITY as never,
          membershipPolicy: PROJECT_MEMBERSHIP_POLICY as never,
          ownerId: buyerOrgId as never,
          parentId: engagementProjectId as never,
          tagId: undefined as never, // D-02: workspace child is tagless
        } as never);

      return String(created.id);
    } catch (err) {
      console.warn('[PLATFORM_ENGAGEMENT_FAILURE]', {
        step: 'D',
        callSiteTag: 'platform-engagement:ensure-workspace-project',
        error: err,
      });
      this.snackBar.open('Setup in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

  // ~~Step E: ensurePipelineLink~~ DROPPED per D-08 (platform.Project.tagId built-in eliminates round-trip)

  /**
   * Step F: Create default kanban Board on workspace Project (D-06 locked recipe step F).
   * Idempotent: probe returns existing board ID if already created.
   */
  private async ensureDefaultBoard(workspaceProjectId: string): Promise<string> {
    try {
      // Probe: does default board already exist on this project?
      const existing = await this.clientApi.platformClient
        .getBoardApi()
        .list({ projectId: workspaceProjectId as never } as never);

      if (existing && existing.items && existing.items.length > 0) {
        // Find the default board (should be only one per project)
        const defaultBoard = existing.items.find((b: { isDefault?: boolean }) => b.isDefault);
        if (defaultBoard) {
          return String(defaultBoard.id);
        }
      }

      // Create new default kanban board
      const created = await this.clientApi.platformClient
        .getBoardApi()
        .create({
          projectId: workspaceProjectId as never,
          name: DEFAULT_BOARD_NAME,
          status: BOARD_STATUS as never,
          boardType: DEFAULT_BOARD_TYPE as never,
          isDefault: DEFAULT_BOARD_IS_DEFAULT,
        } as never);

      return String(created.id);
    } catch (err) {
      console.warn('[PLATFORM_ENGAGEMENT_FAILURE]', {
        step: 'F',
        callSiteTag: 'platform-engagement:ensure-default-board',
        error: err,
      });
      this.snackBar.open('Setup in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

  /**
   * Step G: Add admin user as member of engagement Project.
   * Makes the buyer-side admin a project member with admin role.
   */
  private async ensureProjectMember(engagementProjectId: string, adminPrincipalId: string): Promise<void> {
    try {
      // No idempotency probe needed — addMember API is idempotent at server level
      // (adding same principal safely re-applies the role)
      await this.clientApi.platformClient
        .getProjectApi()
        .addMember(
          this.clientApi.toUUID(engagementProjectId) as never,
          {
            principalId: adminPrincipalId as never,
            role: 'admin' as never,
          } as never,
        );
    } catch (err) {
      console.warn('[PLATFORM_ENGAGEMENT_FAILURE]', {
        step: 'G',
        callSiteTag: 'platform-engagement:ensure-project-member',
        error: err,
      });
      this.snackBar.open('Setup in progress — please retry in a moment.', 'Dismiss', {
        duration: 5000,
      });
      throw err;
    }
  }

}
