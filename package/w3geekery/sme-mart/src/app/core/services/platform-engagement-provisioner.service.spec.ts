import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApi, ZerobiasClientSessionId } from '@zerobias-com/zerobias-client';
import { PlatformEngagementProvisioner } from './platform-engagement-provisioner.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PlatformEngagementProvisioner', () => {
  let service: PlatformEngagementProvisioner;
  let snackBarMock: { open: ReturnType<typeof vi.fn> };
  type ApiMock = ReturnType<typeof vi.fn>;
  let clientApiMock: {
    toUUID: ApiMock;
    hydraClient: {
      getTagApi: () => { searchTags: ApiMock; createTag: ApiMock };
    };
    platformClient: {
      getProjectApi: () => { list: ApiMock; create: ApiMock; addMember: ApiMock };
      getBoardApi: () => { create: ApiMock; list: ApiMock };
    };
  };

  const testOrgId = 'org-123';
  const testOrgName = 'Test Org Inc.';
  const testOrgSlug = 'testorginc';
  const testAdminPrincipalId = 'admin-principal-123';
  const testTagId = 'tag-123';
  const testEngagementProjectId = 'engagement-project-123';
  const testWorkspaceProjectId = 'workspace-project-123';
  const testBoardId = 'board-123';

  const validInput = () => ({
    currentOrgId: testOrgId,
    currentOrgName: testOrgName,
    currentOrgSlug: testOrgSlug,
    adminPrincipalId: testAdminPrincipalId,
  });

  beforeEach(() => {
    snackBarMock = { open: vi.fn() };

    // Build a minimal mock of ZerobiasClientApi for 5-step recipe
    clientApiMock = {
      toUUID: vi.fn((id: string) => id), // Identity function for test
      hydraClient: {
        getTagApi: vi.fn().mockReturnValue({
          searchTags: vi.fn(),
          createTag: vi.fn(),
        }),
      },
      platformClient: {
        getProjectApi: vi.fn().mockReturnValue({
          list: vi.fn(),
          create: vi.fn(),
          addMember: vi.fn(),
        }),
        getBoardApi: vi.fn().mockReturnValue({
          create: vi.fn(),
          list: vi.fn(),
        }),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        PlatformEngagementProvisioner,
        { provide: ZerobiasClientApi, useValue: clientApiMock },
        { provide: ZerobiasClientSessionId, useValue: { getCurrentSessionId: () => null } },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    });

    service = TestBed.inject(PlatformEngagementProvisioner);
  });

  describe('ensurePlatformEngagement (5-step recipe)', () => {
    it('Happy path: all 5 steps succeed → returns created: true with all IDs', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const projectApi = clientApiMock.platformClient.getProjectApi();
      const boardApi = clientApiMock.platformClient.getBoardApi();

      // Step A: Tag probe and create
      tagApi.searchTags.mockResolvedValue({ items: [] });
      tagApi.createTag.mockResolvedValue({ id: testTagId });

      // Step C: Engagement Project probe and create
      projectApi.list.mockResolvedValueOnce({ items: [] });
      projectApi.create.mockResolvedValueOnce({ id: testEngagementProjectId });

      // Step D: Workspace Project probe and create
      projectApi.list.mockResolvedValueOnce({ items: [] });
      projectApi.create.mockResolvedValueOnce({ id: testWorkspaceProjectId });

      // Step F: Default Board probe and create
      boardApi.list.mockResolvedValue({ items: [] });
      boardApi.create.mockResolvedValue({ id: testBoardId });

      // Step G: Add member
      projectApi.addMember.mockResolvedValue(undefined);

      // Execute
      const result = await service.ensurePlatformEngagement(validInput());

      // Assert all steps executed
      expect(tagApi.searchTags).toHaveBeenCalled();
      expect(tagApi.createTag).toHaveBeenCalled();
      expect(projectApi.list).toHaveBeenCalledTimes(2); // Steps C and D both probe
      expect(projectApi.create).toHaveBeenCalledTimes(2); // Steps C and D both create
      expect(boardApi.create).toHaveBeenCalled();
      expect(projectApi.addMember).toHaveBeenCalled();

      // Assert result shape
      expect(result.created).toBe(true);
      expect(result.engagementProjectId).toBe(testEngagementProjectId);
      expect(result.workspaceProjectId).toBe(testWorkspaceProjectId);
      expect(result.boardId).toBe(testBoardId);
    });

    it('Idempotency: org already provisioned → returns created: false with empty IDs', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();

      // isOrgProvisioned probe: tag exists
      tagApi.searchTags.mockResolvedValue({ items: [{ id: testTagId }] });

      // Execute
      const result = await service.ensurePlatformEngagement(validInput());

      // Assert recipe was not executed (only probe ran)
      expect(tagApi.searchTags).toHaveBeenCalled(); // isOrgProvisioned probe
      expect(tagApi.createTag).not.toHaveBeenCalled(); // Step A create skipped
      expect(clientApiMock.platformClient.getProjectApi().list).not.toHaveBeenCalled();

      // Assert result
      expect(result.created).toBe(false);
      expect(result.engagementProjectId).toBe('');
      expect(result.workspaceProjectId).toBe('');
      expect(result.boardId).toBe('');
    });

    it('Step C idempotency: engagement project exists → probe returns it, skip create', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const projectApi = clientApiMock.platformClient.getProjectApi();
      const boardApi = clientApiMock.platformClient.getBoardApi();

      // isOrgProvisioned: tag doesn't exist yet
      tagApi.searchTags.mockResolvedValueOnce({ items: [] });
      // Step A: Create tag
      tagApi.createTag.mockResolvedValue({ id: testTagId });

      // Step C: Engagement project exists via probe
      projectApi.list.mockResolvedValueOnce({ items: [{ id: testEngagementProjectId }] });
      // Step C create should NOT be called

      // Step D: Workspace project probe and create
      projectApi.list.mockResolvedValueOnce({ items: [] });
      projectApi.create.mockResolvedValueOnce({ id: testWorkspaceProjectId });

      // Step F: Board probe and create
      boardApi.list.mockResolvedValue({ items: [] });
      boardApi.create.mockResolvedValue({ id: testBoardId });

      // Step G: Add member
      projectApi.addMember.mockResolvedValue(undefined);

      // Execute
      const result = await service.ensurePlatformEngagement(validInput());

      // Assert Step C probe fired but create did not
      expect(projectApi.list).toHaveBeenCalledTimes(2); // C probe + D probe
      expect(projectApi.create).toHaveBeenCalledTimes(1); // D create only

      // Assert other steps fired
      expect(boardApi.create).toHaveBeenCalled();
      expect(projectApi.addMember).toHaveBeenCalled();

      // Assert result
      expect(result.created).toBe(true);
      expect(result.engagementProjectId).toBe(testEngagementProjectId);
      expect(result.workspaceProjectId).toBe(testWorkspaceProjectId);
    });

    it('Step A error: tag create fails → console.warn + snackbar + re-throw', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const testError = new Error('Tag creation failed');

      // isOrgProvisioned: tag doesn't exist
      tagApi.searchTags.mockResolvedValueOnce({ items: [] });
      // Step A: create fails
      tagApi.createTag.mockRejectedValue(testError);

      const warnSpy = vi.spyOn(console, 'warn');

      // Execute and expect rejection
      let caught = false;
      try {
        await service.ensurePlatformEngagement(validInput());
      } catch (err) {
        caught = true;
        expect(err).toBe(testError);
      }

      expect(caught).toBe(true);

      // Assert snackbar and warning
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Setup in progress — please retry in a moment.',
        'Dismiss',
        { duration: 5000 },
      );

      expect(warnSpy).toHaveBeenCalledWith(
        '[PLATFORM_ENGAGEMENT_FAILURE]',
        expect.objectContaining({
          step: 'A',
          callSiteTag: 'platform-engagement:ensure-tag',
        }),
      );

      warnSpy.mockRestore();
    });

    it('Step C error: project create fails → console.warn + snackbar + re-throw', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const projectApi = clientApiMock.platformClient.getProjectApi();
      const testError = new Error('Project creation failed');

      // isOrgProvisioned: tag doesn't exist
      tagApi.searchTags.mockResolvedValue({ items: [] });
      // Step A: create tag
      tagApi.createTag.mockResolvedValue({ id: testTagId });
      // Step C: project create fails
      projectApi.list.mockResolvedValueOnce({ items: [] });
      projectApi.create.mockRejectedValue(testError);

      const warnSpy = vi.spyOn(console, 'warn');

      // Execute and expect rejection
      let caught = false;
      try {
        await service.ensurePlatformEngagement(validInput());
      } catch (err) {
        caught = true;
        expect(err).toBe(testError);
      }

      expect(caught).toBe(true);

      // Assert snackbar and warning
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Setup in progress — please retry in a moment.',
        'Dismiss',
        { duration: 5000 },
      );

      expect(warnSpy).toHaveBeenCalledWith(
        '[PLATFORM_ENGAGEMENT_FAILURE]',
        expect.objectContaining({
          step: 'C',
          callSiteTag: 'platform-engagement:ensure-engagement-project',
        }),
      );

      warnSpy.mockRestore();
    });
  });

  describe('5-step recipe parameter validation', () => {
    beforeEach(() => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const projectApi = clientApiMock.platformClient.getProjectApi();
      const boardApi = clientApiMock.platformClient.getBoardApi();

      // Default successful path
      tagApi.searchTags.mockResolvedValue({ items: [] });
      tagApi.createTag.mockResolvedValue({ id: testTagId });
      projectApi.list.mockResolvedValue({ items: [] });
      // Use mockResolvedValueOnce to return different values for each create call
      projectApi.create.mockResolvedValueOnce({ id: testEngagementProjectId });
      projectApi.create.mockResolvedValueOnce({ id: testWorkspaceProjectId });
      boardApi.list.mockResolvedValue({ items: [] });
      boardApi.create.mockResolvedValue({ id: testBoardId });
      projectApi.addMember.mockResolvedValue(undefined);
    });

    it('Step C: creates engagement project with locked verbiage (D-32, D-33)', async () => {
      const projectApi = clientApiMock.platformClient.getProjectApi();

      await service.ensurePlatformEngagement(validInput());

      // Find the Step C create call (first call to create after list probe)
      const createCalls = projectApi.create.mock.calls;
      expect(createCalls.length).toBeGreaterThanOrEqual(1);

      // First create is engagement project (Step C)
      const engagementProjectCall = createCalls[0][0];
      expect(engagementProjectCall.name).toBe(`${testOrgName} <- ZeroBias`); // D-32
      expect(engagementProjectCall.description).toContain('Platform Services Engagement: ZeroBias ➡️'); // D-33
      expect(engagementProjectCall.status).toBe('active'); // D-29
      expect(engagementProjectCall.visibility).toBe('internal'); // D-29
      expect(engagementProjectCall.membershipPolicy).toBe('private'); // D-29
      expect(engagementProjectCall.parentId).toBeNull(); // D-04
      expect(engagementProjectCall.tagId).toBe(testTagId); // D-01
    });

    it('Step D: creates workspace project with locked verbiage (D-34, D-35), tagless (D-02)', async () => {
      const projectApi = clientApiMock.platformClient.getProjectApi();

      await service.ensurePlatformEngagement(validInput());

      const createCalls = projectApi.create.mock.calls;
      // Second create is workspace project (Step D)
      const workspaceProjectCall = createCalls[1][0];
      expect(workspaceProjectCall.name).toBe('ZeroBias Platform'); // D-34
      expect(workspaceProjectCall.description).toContain(`${testOrgName}'s gateway into ZeroBias`); // D-35
      expect(workspaceProjectCall.parentId).toBe(testEngagementProjectId); // D-01
      expect(workspaceProjectCall.tagId).toBeUndefined(); // D-02 (tagless)
    });

    it('Step F: creates default kanban board with locked verbiage (D-06, D-30)', async () => {
      const boardApi = clientApiMock.platformClient.getBoardApi();

      await service.ensurePlatformEngagement(validInput());

      expect(boardApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: testWorkspaceProjectId,
          name: 'ZeroBias Platform', // D-06, D-34 locked name
          status: 'active', // D-30
          boardType: 'kanban', // D-30
          isDefault: true, // D-30
        }),
      );
    });

    it('Step G: adds admin principal as project member with admin role', async () => {
      const projectApi = clientApiMock.platformClient.getProjectApi();

      await service.ensurePlatformEngagement(validInput());

      // addMember is called with (projectId, newProjectMember) as separate args
      expect(projectApi.addMember).toHaveBeenCalledWith(
        testEngagementProjectId,
        expect.objectContaining({
          principalId: testAdminPrincipalId,
          role: 'admin',
        }),
      );
    });
  });

  describe('Tag naming: slug source', () => {
    beforeEach(() => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      const projectApi = clientApiMock.platformClient.getProjectApi();
      const boardApi = clientApiMock.platformClient.getBoardApi();

      tagApi.searchTags.mockResolvedValue({ items: [] });
      tagApi.createTag.mockResolvedValue({ id: testTagId });
      projectApi.list.mockResolvedValue({ items: [] });
      projectApi.create.mockResolvedValue({ id: testEngagementProjectId });
      boardApi.list.mockResolvedValue({ items: [] });
      boardApi.create.mockResolvedValue({ id: testBoardId });
      projectApi.addMember.mockResolvedValue(undefined);
    });

    it('Tag name uses platform-canonical orgSlug when provided', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      await service.ensurePlatformEngagement({
        currentOrgId: testOrgId,
        currentOrgName: 'Brian Hierholzer Inc.',
        currentOrgSlug: 'brianhierholzer',
        adminPrincipalId: testAdminPrincipalId,
      });
      const createBody = tagApi.createTag.mock.calls[0][0];
      expect(createBody.name).toBe('sme-mart.eng.zerobias-to-brianhierholzer');
    });

    it('Tag name falls back to slugify(orgName) when orgSlug missing', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      await service.ensurePlatformEngagement({
        currentOrgId: testOrgId,
        currentOrgName: 'Brian Hierholzer Inc.',
        currentOrgSlug: undefined,
        adminPrincipalId: testAdminPrincipalId,
      });
      const createBody = tagApi.createTag.mock.calls[0][0];
      // slugify("Brian Hierholzer Inc.") -> "brian-hierholzer-inc"
      expect(createBody.name).toBe('sme-mart.eng.zerobias-to-brian-hierholzer-inc');
    });

    it('Tag ownerId is the marketplace operator org (W3Geekery), not the target customer org', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      await service.ensurePlatformEngagement({
        currentOrgId: 'd6810036-fbc1-54c2-b01d-1496fc14ed32', // target customer
        currentOrgName: 'Brian Hierholzer Inc.',
        currentOrgSlug: 'brianhierholzer',
        adminPrincipalId: testAdminPrincipalId,
      });
      const createBody = tagApi.createTag.mock.calls[0][0];
      expect(createBody.ownerId).toBe('cd7105df-523d-5392-9f9a-3f83d3f30107'); // W3Geekery
      expect(createBody.ownerId).not.toBe('d6810036-fbc1-54c2-b01d-1496fc14ed32');
    });
  });

  describe('isOrgProvisioned (idempotency probe)', () => {
    it('Returns true when tag exists', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      tagApi.searchTags.mockResolvedValue({ items: [{ id: testTagId }] });

      const result = await service.isOrgProvisioned(testOrgId, testOrgName, testOrgSlug);

      expect(result).toBe(true);
      expect(tagApi.searchTags).toHaveBeenCalled();
    });

    it('Returns false when tag does not exist', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      tagApi.searchTags.mockResolvedValue({ items: [] });

      const result = await service.isOrgProvisioned(testOrgId, testOrgName, testOrgSlug);

      expect(result).toBe(false);
    });

    it('Uses provided orgSlug in tag name', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      tagApi.searchTags.mockResolvedValue({ items: [] });

      await service.isOrgProvisioned(testOrgId, 'Some Org Name', 'customslug');

      const searchBody = tagApi.searchTags.mock.calls[0][3];
      expect(searchBody.name).toBe('sme-mart.eng.zerobias-to-customslug');
    });

    it('Falls back to slugify(orgName) when orgSlug missing', async () => {
      const tagApi = clientApiMock.hydraClient.getTagApi();
      tagApi.searchTags.mockResolvedValue({ items: [] });

      await service.isOrgProvisioned(testOrgId, 'Some Org Name');

      const searchBody = tagApi.searchTags.mock.calls[0][3];
      expect(searchBody.name).toBe('sme-mart.eng.zerobias-to-some-org-name');
    });
  });
});
