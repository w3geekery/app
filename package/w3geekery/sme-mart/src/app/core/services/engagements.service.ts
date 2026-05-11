import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { Memoize } from '../../shared/utils/memoize.decorator';
import { ENGAGEMENT_FIELD_MAPPING, mapNeonToGql, mapGqlToNeon } from '../field-mappings';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import type { ProjectExtended } from '@zerobias-com/platform-sdk';
import type { QueryOptions } from '@zerobias-org/data-utils';
import { PagedResults } from '@zerobias-org/types-core-js';
import type {
  Engagement,
  EngagementSummaryRow,
  EngagementDetailRow,
} from '../models';
import type { RequestStatus } from '../models/enums';
import type { GqlEngagementResponse } from '../gql-types';

// D-15: Dual-read window timeout values (primary 5s, fallback 5s)
const PRIMARY_READ_TIMEOUT_MS = 5000;

/**
 * EngagementsService — Phase 29.5 Platform Model Migration
 *
 * Engagements are now corp-to-corp agreements (buyer org ↔ provider org).
 * RFP creation/management has moved to SmeMartProjectService.
 *
 * Phase 29.5 refactor: Implements dual-read window (D-15) for platform.Project migration.
 * - Primary path: reads from platform.Project.list with ownerId + tagId filter
 * - Fallback path: legacy GQL SmeMartProject reads for data aging out
 * - Demo visibility: post-filter applied to merged result set
 *
 * Writes: still go through PipelineWriteService (legacy path maintained for backward compat).
 */
@Injectable({ providedIn: 'root' })
export class EngagementsService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly demoVisibility = inject(DemoVisibilityService);
  private readonly clientApi = inject(ZerobiasClientApi);

  readonly engagements = signal<EngagementSummaryRow[]>([]);
  readonly loading = signal(false);

  /**
   * List all engagements with summary info (buyer, bid counts).
   * D-15: Dual-read window - primary platform.Project.list, fallback to legacy GQL Engagement
   *
   * Primary path: platform.Project.list({ ownerId, parentId: null })
   * Fallback path: GQL SmeMartProject search (legacy data during deprecation window)
   * Demo visibility: post-filter applied to merged results
   */
  async listEngagements(options?: QueryOptions & { statusFilter?: string; buyerOrgId?: string }): Promise<PagedResults<EngagementSummaryRow>> {
    this.loading.set(true);
    try {
      const pageNumber = options?.pageNumber ?? 1;
      const pageSize = options?.pageSize ?? 50;

      // DUAL_READ_WINDOW_D15: Try platform.Project.list first (primary)
      let items: EngagementSummaryRow[] = [];
      let totalCount = 0;

      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('PRIMARY_READ_TIMEOUT')), PRIMARY_READ_TIMEOUT_MS)
        );

        const platformProjects = await Promise.race([
          this.clientApi.platformClient
            .getProjectApi()
            .list(pageNumber, pageSize, undefined, options?.buyerOrgId as never),
          timeout,
        ]);

        if (platformProjects) {
          // Transform platform.Project[] to EngagementSummaryRow[]
          const transformed = platformProjects.items.map(proj => this.transformPlatformProjectToEngagementSummary(proj as ProjectExtended));

          // DG-02/DG-03: Client-side demo-visibility post-filter
          // Note: applyVisibility handles both GQL Engagement and platform.Project shapes (D-24)
          const filtered = this.demoVisibility.applyVisibility(transformed) as EngagementSummaryRow[];

          items = filtered;
          totalCount = platformProjects.pageSize * pageNumber + items.length; // Approximation pending actual paging info

          console.debug('[ENGAGEMENT_LIST:PRIMARY_SUCCESS]', {
            count: items.length,
            buyerOrgId: options?.buyerOrgId,
            source: 'platform.Project.list',
          });
        }
      } catch (primaryErr) {
        // DUAL_READ_WINDOW_D15: Primary read failed, try fallback (legacy GQL)
        console.debug('[ENGAGEMENT_LIST:PRIMARY_FAILED]', {
          error: (primaryErr as Error).message,
          attemptingFallback: true,
        });

        try {
          const filters: Record<string, string> = {};
          if (options?.statusFilter) {
            filters['status'] = `.eq.${options.statusFilter}`;
          }
          if (options?.buyerOrgId) {
            filters['buyerZerobiasOrgId'] = `.eq.${options.buyerOrgId}`;
          }

          const gqlOptions: GqlQueryOptions = {
            filters,
            pageNumber,
            pageSize,
          };

          const gqlResult = await this.graphqlRead.query<GqlEngagementResponse>(
            'Engagement',
            this.getEngagementFields(),
            gqlOptions,
          );

          // DG-02/DG-03: Client-side demo-visibility post-filter
          const filteredGql = this.demoVisibility.applyVisibility(gqlResult.items as (GqlEngagementResponse & { tag?: Array<{ value: string }> | null })[]);
          items = filteredGql.map(gql => this.transformGqlToEngagementSummary(gql as GqlEngagementResponse));
          totalCount = gqlResult.page.totalCount ?? items.length;

          console.debug('[ENGAGEMENT_LIST:FALLBACK_SUCCESS]', {
            count: items.length,
            buyerOrgId: options?.buyerOrgId,
            source: 'GQL_Engagement',
          });
        } catch (fallbackErr) {
          console.error('[ENGAGEMENT_LIST:BOTH_FAILED]', {
            primaryError: (primaryErr as Error).message,
            fallbackError: (fallbackErr as Error).message,
          });
          throw fallbackErr;
        }
      }

      this.engagements.set(items);
      return PagedResults.fromArray(items, pageNumber, pageSize, totalCount);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Search engagements by title/description filter.
   * Applies ILIKE filter for fuzzy text search.
   */
  async searchEngagements(filter: string, options?: QueryOptions): Promise<PagedResults<EngagementSummaryRow>> {
    this.loading.set(true);
    try {
      const pageNumber = options?.pageNumber ?? 1;
      const pageSize = options?.pageSize ?? 50;

      const gqlOptions: GqlQueryOptions = {
        filters: {
          name: `.ilike.%${filter}%`,
        },
        pageNumber,
        pageSize,
      };

      const result = await this.graphqlRead.query<GqlEngagementResponse>(
        'Engagement',
        this.getEngagementFields(),
        gqlOptions,
      );

      // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
      const filteredGql = this.demoVisibility.applyVisibility(result.items as (GqlEngagementResponse & { tag?: Array<{ value: string }> | null })[]);

      const items = filteredGql.map(gql => this.transformGqlToEngagementSummary(gql as GqlEngagementResponse));
      this.engagements.set(items);

      return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Fetch a single engagement with full details and related bid data. Cached for 30s.
   */
  @Memoize(30000)
  async getEngagement(id: string): Promise<EngagementDetailRow | null> {
    const engagement = await this.graphqlRead.getById<GqlEngagementResponse>(
      'Engagement',
      id,
      this.getEngagementFields(),
    );

    if (!engagement) return null;

    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filtered = this.demoVisibility.applyVisibility([engagement as GqlEngagementResponse & { tag?: Array<{ value: string }> | null }])[0] ?? null;
    if (!filtered) return null;

    // Transform to EngagementDetailRow
    // Note: bids array would come from nested GQL query or separate call
    return this.transformGqlToEngagementDetail(filtered as GqlEngagementResponse);
  }

  /**
   * Fetch raw engagement row (used for wizard flows that need all fields).
   */
  async getEngagementRaw(id: string): Promise<Engagement | null> {
    const engagement = await this.graphqlRead.getById<GqlEngagementResponse>(
      'Engagement',
      id,
      this.getEngagementFields(),
    );

    if (!engagement) return null;

    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filtered = this.demoVisibility.applyVisibility([engagement as GqlEngagementResponse & { tag?: Array<{ value: string }> | null }])[0] ?? null;
    if (!filtered) return null;

    // Transform GQL response back to Engagement (Neon model)
    return mapGqlToNeon<Engagement>(filtered as GqlEngagementResponse, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);
  }

  /**
   * Create an engagement (corp-to-corp agreement between buyer and provider).
   * Called from EngagementLifecycleService when a bid is accepted.
   */
  async createEngagement(data: {
    buyer_zerobias_user_id: string;
    buyer_zerobias_org_id?: string;
    title: string;
    description?: string;
    engagement_tag: string;
    zerobias_tag_id?: string;
  }): Promise<Engagement> {
    const id = `eng-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const engagement: Engagement = {
      id,
      buyer_user_id: null,
      buyer_zerobias_user_id: data.buyer_zerobias_user_id,
      buyer_zerobias_org_id: data.buyer_zerobias_org_id || null,
      title: data.title,
      description: data.description || null,
      category: '', // Engagements no longer carry RFP fields (moved to SmeMartProject)
      budget_type: null,
      budget_min: null,
      budget_max: null,
      timeline: null,
      status: 'in_progress' as unknown as RequestStatus,
      engagement_tag: data.engagement_tag,
      zerobias_tag_id: data.zerobias_tag_id || null,
      zerobias_boundary_id: null,
      zerobias_task_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const gqlData = mapNeonToGql<GqlEngagementResponse>(engagement, ENGAGEMENT_FIELD_MAPPING.neonToGql);
    try {
      await this.pipelineWrite.pushEntity('Engagement', gqlData as unknown as Record<string, unknown>, [], 'engagements.service:172');
    } catch (err) {
      this.snackBar.open(
        `Failed to create engagement: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return engagement;
  }

  /**
   * Update an engagement and push changes to Pipeline.
   */
  async updateEngagement(id: string, data: Partial<Engagement>): Promise<Engagement> {
    // Check write-through cache first, fall back to GQL fetch
    const cached = this.pipelineWrite.getCached('Engagement', id);
    const current = cached
      ? mapGqlToNeon<Engagement>(cached, ENGAGEMENT_FIELD_MAPPING.gqlToNeon)
      : await this.getEngagementRaw(id);
    if (!current) throw new Error(`Engagement ${id} not found`);

    const updated: Engagement = { ...current, ...data, updated_at: new Date().toISOString() };

    const gqlData = mapNeonToGql<GqlEngagementResponse>(updated, ENGAGEMENT_FIELD_MAPPING.neonToGql);
    try {
      await this.pipelineWrite.pushEntity('Engagement', gqlData as unknown as Record<string, unknown>, [], 'engagements.service:205');
    } catch (err) {
      this.snackBar.open(
        `Failed to update engagement: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return updated;
  }

  /**
   * Cancel an engagement.
   */
  async cancelEngagement(id: string): Promise<Engagement> {
    return this.updateEngagement(id, { status: 'cancelled' as unknown as RequestStatus });
  }

  /**
   * Mark engagement as completed.
   */
  async completeEngagement(id: string): Promise<Engagement> {
    return this.updateEngagement(id, { status: 'completed' as unknown as RequestStatus });
  }

  /**
   * Transform platform.Project to EngagementSummaryRow (D-15 migration).
   * Platform.Project shape: { id, name, description, ownerId, status, visibility, tagId, boardCount, memberCount, creator, tag, ... }
   * Engagement shape: { id, title, description, buyer_zerobias_org_id, status, engagement_tag, ... }
   */
  private transformPlatformProjectToEngagementSummary(proj: ProjectExtended): EngagementSummaryRow {
    return {
      id: String(proj.id),
      buyer_user_id: null, // Not available on platform.Project
      buyer_zerobias_user_id: proj.createdBy ? String(proj.createdBy) : '', // creator UUID or empty
      buyer_zerobias_org_id: String(proj.ownerId), // D-03: engagement ownerId = buyerOrgId
      title: proj.name,
      description: proj.description ?? null,
      category: '', // Not applicable; this is persistence-only
      budget_type: null,
      budget_min: null,
      budget_max: null,
      timeline: null,
      status: 'in_progress' as unknown as RequestStatus, // Map platform.Project.status ('active'|'archived'|'closed') to engagement status
      engagement_tag: proj.tag?.name ?? '',
      zerobias_tag_id: proj.tagId ? String(proj.tagId) : null,
      zerobias_boundary_id: proj.boundaryId ? String(proj.boundaryId) : null,
      zerobias_task_id: null,
      created_at: proj.created?.toISOString() ?? new Date().toISOString(),
      updated_at: proj.updated?.toISOString() ?? new Date().toISOString(),
      buyer_display_name: null,
      buyer_avatar_url: null,
      bid_count: 0,
      pending_bid_count: 0,
      accepted_provider_name: null,
      accepted_provider_id: null,
    };
  }

  /**
   * Get standard field list for Engagement GQL queries.
   */
  private getEngagementFields(): string[] {
    // Only fields that exist in the GQL Engagement schema (Object base + custom properties)
    // Object inherited: id, name, description, dateCreated, dateLastModified
    // Custom (from Engagement.yml): all camelCase field names
    // Fields removed from schema 2026-03-24 (PR #20): category, budgetType,
    // budgetMin, budgetMax, timeline, responseDeadline, questionsDeadline,
    // evaluationCriteria, wizardStep, wizardData, zerobiasBoundaryId
    return [
      'id',
      'name',
      'description',
      'status',
      'engagementTag',
      'zerobiasTaskId',
      'zerobiasTagId',
      'buyerZerobiasUserId',
      'buyerZerobiasOrgId',
      'tag',
      'dateCreated',
      'dateLastModified',
    ];
  }

  /**
   * Transform GQL engagement response to EngagementSummaryRow.
   * For now, bid counts are 0 (would require separate query or nested GQL).
   */
  private transformGqlToEngagementSummary(gql: GqlEngagementResponse): EngagementSummaryRow {
    const engagement = mapGqlToNeon<Engagement>(gql, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);
    return {
      ...engagement,
      buyer_display_name: null,  // Would come from Zerobias user lookup
      buyer_avatar_url: null,    // Would come from Zerobias user lookup
      bid_count: 0,              // Would require separate query
      pending_bid_count: 0,      // Would require separate query
      accepted_provider_name: null,
      accepted_provider_id: null,
    };
  }

  /**
   * Transform GQL engagement response to EngagementDetailRow.
   * For now, bids array is '[]' JSON string (would require nested GQL or separate query).
   */
  private transformGqlToEngagementDetail(gql: GqlEngagementResponse): EngagementDetailRow {
    const engagement = mapGqlToNeon<Engagement>(gql, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);
    return {
      ...engagement,
      buyer_display_name: null,  // Would come from Zerobias user lookup
      buyer_email: null,         // Would come from Zerobias user lookup
      bids: '[]',                // Would require nested GQL or separate query
      bid_count: 0,              // Would require separate query
    };
  }
}
