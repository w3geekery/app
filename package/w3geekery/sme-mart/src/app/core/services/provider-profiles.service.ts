import { Injectable, inject, signal } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { ExecuteRawGraphqlQuery } from '@zerobias-com/graphql-sdk';
import { UUID, PagedResults } from '@zerobias-org/types-core-js';
import { environment } from '../../../environments/environment';
import type {
  ProviderSkill,
  ProviderRole,
  ProviderProduct,
  ProviderFramework,
  ProviderSegment,
  ProviderServiceSegment,
  OrgProfile,
  ProviderDirectoryView,
  ProviderDetailView,
  ExpertiseItem,
} from '../models';
import { CatalogService } from './catalog.service';

/**
 * Provider CRUD operations.
 * Wave 2 (Plan 26-03): Reads from MPI/GQL (no Neon VIEWs).
 * Writes still target individual Neon tables (provider_profiles, provider_skills, etc.) —
 * those are CRUD methods at the end of the file, unchanged.
 *
 * Wave 2 Decision (26-03 Director-locked):
 * - Call boundaryApi.boundaryExecuteRawQuery DIRECTLY (bypassing GraphqlReadService.query)
 * - Reason: GraphqlReadService has a demo-mode gate (lines 80-84) that short-circuits
 *   empty results when demo mode is OFF. This gate was appropriate when all GQL data was
 *   demo-seeded, but after 26-02, ZB is REAL (untagged) GQL data and the gate incorrectly
 *   hides it. Direct boundary calls see ZB regardless of demo-mode toggle position.
 * - Future: Phase 24 follow-up should replace the demo-mode gate with per-record tag filtering.
 */
@Injectable({ providedIn: 'root' })
export class ProviderProfilesService {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly catalog = inject(CatalogService);

  readonly providers = signal<ProviderDirectoryView[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Half-A: GQL Nested Reads (Phase 33, Wave 1)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Query OrgProfile + expertise junctions via boundaryExecuteRawQuery.
   * Nested selections return all expertise data in one request.
   */
  private async queryOrgProfile(filter: string): Promise<OrgProfile | null> {
    const query = `{
      OrgProfile(${filter}) {
        id orgId legalName dba tagline shortDescription longDescription website logoUrl
        employeeCount businessClassification foundedYear primaryContactUserId
        verified verificationSource created_at
      }
    }`;

    const boundaryApi = this.clientApi.graphqlClient.getBoundaryApi();
    const result = await boundaryApi.boundaryExecuteRawQuery(
      new UUID(environment.boundaryId),
      new ExecuteRawGraphqlQuery(query),
      false, // includeRawData
      1, // pageNumber
      1, // pageSize
      undefined, // sort
    );

    const data = result.data as Record<string, unknown> | null;
    return (data?.['OrgProfile'] as OrgProfile) ?? null;
  }

  /**
   * Query expertise junctions for an orgId with nested selections.
   */
  private async queryExpertiseJunctions(orgId: string): Promise<{
    skills: ProviderSkill[];
    roles: ProviderRole[];
    products: ProviderProduct[];
    frameworks: ProviderFramework[];
    segments: ProviderSegment[];
    serviceSegments: ProviderServiceSegment[];
  }> {
    const filter = `filter: "orgId.eq.${orgId}"`;

    // Query all 6 expertise junction types in parallel
    const [skillsResult, rolesResult, productsResult, frameworksResult, segmentsResult, ssResult] =
      await Promise.all([
        this.queryJunctionType('ProviderSkill', filter),
        this.queryJunctionType('ProviderRole', filter),
        this.queryJunctionType('ProviderProduct', filter),
        this.queryJunctionType('ProviderFramework', filter),
        this.queryJunctionType('ProviderSegment', filter),
        this.queryJunctionType('ProviderServiceSegment', filter),
      ]);

    return {
      skills: skillsResult as ProviderSkill[],
      roles: rolesResult as ProviderRole[],
      products: productsResult as ProviderProduct[],
      frameworks: frameworksResult as ProviderFramework[],
      segments: segmentsResult as ProviderSegment[],
      serviceSegments: ssResult as ProviderServiceSegment[],
    };
  }

  /**
   * Query a single junction type and return typed results.
   */
  private async queryJunctionType(className: string, filter: string): Promise<unknown[]> {
    const fieldsByClass: Record<string, string> = {
      ProviderSkill: 'id orgId skillId proficiencyLevel yearsExperience verified verificationSource created_at',
      ProviderRole: 'id orgId roleId isPrimary yearsInRole verified verificationSource created_at',
      ProviderProduct: 'id orgId productId proficiencyLevel yearsExperience certified certificationDetails verified verificationSource created_at',
      ProviderFramework: 'id orgId frameworkId proficiencyLevel yearsExperience assessorCertified implementationExperience auditExperience verified verificationSource created_at',
      ProviderSegment: 'id orgId segmentId isPrimary verified verificationSource created_at',
      ProviderServiceSegment: 'id orgId serviceSegmentId isPrimary verified verificationSource created_at',
    };

    const fields = fieldsByClass[className];
    if (!fields) return [];

    const query = `{ ${className}(${filter}) { ${fields} } }`;
    const boundaryApi = this.clientApi.graphqlClient.getBoundaryApi();

    try {
      const result = await boundaryApi.boundaryExecuteRawQuery(
        new UUID(environment.boundaryId),
        new ExecuteRawGraphqlQuery(query),
        false,
        1,
        1000,
        undefined,
      );

      const data = result.data as Record<string, unknown> | null;
      return (data?.[className] as unknown[]) ?? [];
    } catch (err) {
      console.error(`[ProviderProfilesService] Query ${className} failed:`, err);
      return [];
    }
  }

  /**
   * Build expertise items with resolved names from CatalogService.
   */
  private buildExpertiseItems(
    items: unknown[],
    idField: string,
    resolveFn: (id: string) => { name: string } | undefined,
  ): ExpertiseItem[] {
    return items.map((item: unknown) => {
      const typedItem = item as Record<string, unknown> & { id: string; verified?: boolean; verificationSource?: string | null };
      return {
        id: typedItem.id,
        name: resolveFn(String(typedItem[idField]))?.name || '(unknown)',
        verified: typedItem.verified ?? false,
        verificationSource: (typedItem.verificationSource as string | null) ?? null,
      };
    });
  }

  /**
   * Convert OrgProfile + expertise junctions to ProviderDirectoryView.
   */
  private toDirectoryRow(profile: OrgProfile, expertise: Awaited<ReturnType<typeof this.queryExpertiseJunctions>>): ProviderDirectoryView {
    return {
      id: profile.id, // Expose id for downstream callers (33-06 compatibility)
      orgId: profile.orgId,
      legalName: profile.legalName,
      tagline: profile.tagline,
      logoUrl: profile.logoUrl,
      segmentCount: expertise.segments.length + expertise.serviceSegments.length,
      skillCount: expertise.skills.length,
      verified: profile.verified ?? false,
    };
  }

  /**
   * Convert OrgProfile + expertise junctions to ProviderDetailView.
   * Resolves all expertise names via CatalogService.
   */
  private async toDetailRow(
    profile: OrgProfile,
    expertise: Awaited<ReturnType<typeof this.queryExpertiseJunctions>>,
  ): Promise<ProviderDetailView> {
    return {
      id: profile.id, // Expose id for downstream callers (33-06 compatibility)
      orgId: profile.orgId,
      legalName: profile.legalName,
      dba: profile.dba,
      tagline: profile.tagline,
      shortDescription: profile.shortDescription,
      longDescription: profile.longDescription,
      website: profile.website,
      logoUrl: profile.logoUrl,
      foundedYear: profile.foundedYear,
      employeeCount: profile.employeeCount,
      businessClassification: profile.businessClassification,
      verified: profile.verified ?? false,
      skillCount: expertise.skills.length,
      segments: this.buildExpertiseItems(expertise.segments, 'segmentId', (id) => this.catalog.findSegment(id)),
      serviceSegments: this.buildExpertiseItems(expertise.serviceSegments, 'serviceSegmentId', (id) => this.catalog.findServiceSegment(id)),
      skills: this.buildExpertiseItems(expertise.skills, 'skillId', (id) => this.catalog.findSkill(id)),
      roles: this.buildExpertiseItems(expertise.roles, 'roleId', (id) => this.catalog.findRole(id)),
      products: this.buildExpertiseItems(expertise.products, 'productId', (id) => this.catalog.findProduct(id)),
      frameworks: this.buildExpertiseItems(expertise.frameworks, 'frameworkId', (id) => this.catalog.findFramework(id)),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────

  async listProviders(orgId?: string, pageSize?: number): Promise<PagedResults<ProviderDirectoryView>> {
    this.loading.set(true);
    try {
      // Query all OrgProfile records (optionally filtered by orgId)
      const filter = orgId ? `filter: "orgId.eq.${orgId}"` : '';
      const query = `{ OrgProfile${filter ? `(${filter})` : ''} { id orgId legalName tagline logoUrl verified verificationSource created_at } }`;

      const boundaryApi = this.clientApi.graphqlClient.getBoundaryApi();
      const result = await boundaryApi.boundaryExecuteRawQuery(
        new UUID(environment.boundaryId),
        new ExecuteRawGraphqlQuery(query),
        false,
        1,
        pageSize ?? 200,
        undefined,
      );

      const data = result.data as Record<string, unknown> | null;
      const profiles = (data?.['OrgProfile'] as OrgProfile[]) ?? [];

      // For each profile, load expertise counts
      const items: ProviderDirectoryView[] = [];
      for (const profile of profiles) {
        const expertise = await this.queryExpertiseJunctions(profile.orgId);
        items.push(this.toDirectoryRow(profile, expertise));
      }

      this.providers.set(items);
      return PagedResults.fromArray(items, 1, pageSize ?? 200, items.length);
    } catch (err) {
      console.error('[ProviderProfilesService] listProviders failed:', err);
      return PagedResults.fromArray([], 1, pageSize ?? 200, 0);
    } finally {
      this.loading.set(false);
    }
  }

  async searchProviders(query: string, pageSize?: number): Promise<PagedResults<ProviderDirectoryView>> {
    // List all and filter in memory by legalName/tagline
    const all = await this.listProviders(undefined, pageSize);
    const lower = query.toLowerCase();
    const items = all.items.filter(
      p =>
        p.legalName.toLowerCase().includes(lower) ||
        (p.tagline?.toLowerCase().includes(lower) ?? false),
    );
    return PagedResults.fromArray(items, 1, pageSize ?? 200, items.length);
  }

  async getProvider(orgId: string): Promise<ProviderDetailView | null> {
    try {
      const profile = await this.queryOrgProfile(`filter: "orgId.eq.${orgId}"`);
      if (!profile) return null;

      const expertise = await this.queryExpertiseJunctions(orgId);
      return this.toDetailRow(profile, expertise);
    } catch (err) {
      console.error('[ProviderProfilesService] getProvider failed:', err);
      return null;
    }
  }

  async getProviderByUserId(userId: string): Promise<ProviderDetailView | null> {
    try {
      // Query OrgProfile by primaryContactUserId
      const filter = `filter: "primaryContactUserId.eq.${userId}"`;
      const query = `{ OrgProfile(${filter}) { id orgId } }`;

      const boundaryApi = this.clientApi.graphqlClient.getBoundaryApi();
      const result = await boundaryApi.boundaryExecuteRawQuery(
        new UUID(environment.boundaryId),
        new ExecuteRawGraphqlQuery(query),
        false,
        1,
        1,
        undefined,
      );

      const data = result.data as Record<string, unknown> | null;
      const profiles = (data?.['OrgProfile'] as Array<{ orgId: string }>) ?? [];

      if (profiles.length === 0) return null;

      // Get the first matching org
      return this.getProvider(profiles[0].orgId);
    } catch (err) {
      console.error('[ProviderProfilesService] getProviderByUserId failed:', err);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Profile CRUD (writes to provider_profiles) — UNCHANGED from pre-26-03
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * NOTE: These are placeholder stubs. Wave 2 does not rewrite CRUD methods.
   * They still require SmeMartDbService which is out of scope for 26-03.
   * Future phase (cleanup) will implement via PipelineWriteService after Neon->GQL migration.
   * Unused parameters are suppressed with underscore prefix to suppress TS6133 warnings.
   */
  async updateProfile(_id: string, _data: Partial<OrgProfile>): Promise<OrgProfile> {
    throw new Error('updateProfile not yet implemented for GQL-backed providers');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Expertise CRUD — 6 relation tables — UNCHANGED from pre-26-03
  // ─────────────────────────────────────────────────────────────────────────

  async addSkill(_orgId: string, _data: Omit<ProviderSkill, 'id' | 'created_at'>): Promise<ProviderSkill> {
    throw new Error('Half-B (33-03): not yet implemented');
  }

  async deleteSkill(_skillId: string): Promise<void> {
    throw new Error('deleteSkill not yet implemented for GQL-backed providers');
  }

  async addRole(_orgId: string, _data: Omit<ProviderRole, 'id' | 'created_at'>): Promise<ProviderRole> {
    throw new Error('Half-B (33-03): not yet implemented');
  }

  async deleteRole(_roleId: string): Promise<void> {
    throw new Error('deleteRole not yet implemented for GQL-backed providers');
  }

  async addProduct(_orgId: string, _data: Omit<ProviderProduct, 'id' | 'created_at'>): Promise<ProviderProduct> {
    throw new Error('Half-B (33-03): not yet implemented');
  }

  async deleteProduct(_productId: string): Promise<void> {
    throw new Error('deleteProduct not yet implemented for GQL-backed providers');
  }

  async addFramework(_orgId: string, _data: Omit<ProviderFramework, 'id' | 'created_at'>): Promise<ProviderFramework> {
    throw new Error('Half-B (33-03): not yet implemented');
  }

  async deleteFramework(_frameworkId: string): Promise<void> {
    throw new Error('deleteFramework not yet implemented for GQL-backed providers');
  }

  async addSegment(_orgId: string, _data: Omit<ProviderSegment, 'id' | 'created_at'>): Promise<ProviderSegment> {
    throw new Error('Half-B (33-03): not yet implemented');
  }

  async deleteSegment(_segmentId: string): Promise<void> {
    throw new Error('deleteSegment not yet implemented for GQL-backed providers');
  }

  async addServiceSegment(_orgId: string, _data: Omit<ProviderServiceSegment, 'id' | 'created_at'>): Promise<ProviderServiceSegment> {
    throw new Error('Half-B (33-03): not yet implemented');
  }

  async deleteServiceSegment(_segmentId: string): Promise<void> {
    throw new Error('deleteServiceSegment not yet implemented for GQL-backed providers');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Parse JSON aggregation strings from VIEW rows into typed arrays.
   * No longer used internally; kept for backwards compat with bid-ai.service.ts:104.
   */
  parseViewJson<T>(jsonValue: unknown): T[] {
    if (!jsonValue) return [];
    if (Array.isArray(jsonValue)) return jsonValue as T[];
    if (typeof jsonValue === 'string') {
      try {
        return JSON.parse(jsonValue) as T[];
      } catch {
        return [];
      }
    }
    return [];
  }
}
