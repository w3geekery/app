import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DefaultProjectBoardComponent } from './default-project-board.component';
import { EngagementsService } from '../../core/services/engagements.service';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import type { ProjectExtended } from '@zerobias-com/platform-sdk';

describe('DefaultProjectBoardComponent', () => {
  let component: DefaultProjectBoardComponent;
  let fixture: ComponentFixture<DefaultProjectBoardComponent>;
  let engagementsService: jasmine.SpyObj<EngagementsService>;
  let app: jasmine.SpyObj<ZerobiasClientApp>;

  const mockEngagement = {
    id: 'eng-uuid-1',
    name: 'Acme Corp <- ZeroBias',
    description: 'Platform Services Engagement: ZeroBias ➡️ Acme Corp',
    parentId: null,
    tagId: 'some-uuid',
    ownerId: 'org-uuid',
    status: 'active',
    created: new Date(),
    updated: new Date(),
  } as ProjectExtended;

  const mockProjectTier = {
    id: 'proj-uuid-1',
    name: 'ZeroBias Platform',
    description: "Acme Corp's gateway into ZeroBias — tasks, notes, and communication tied to the ZeroBias ➡️ Acme Corp platform engagement live here.",
    parentId: 'eng-uuid-1',
    tagId: '420b0753-e72c-4b81-8929-70508a119bf0',
    ownerId: 'org-uuid',
    status: 'active',
    created: new Date(),
    updated: new Date(),
  } as ProjectExtended;

  beforeEach(async () => {
    const mockEngagementsService = jasmine.createSpyObj<EngagementsService>('EngagementsService', [
      'getDefaultEngagement',
      'getProjectTierProject',
    ]);
    const mockApp = jasmine.createSpyObj<ZerobiasClientApp>('ZerobiasClientApp', ['getCurrentOrgId']);
    mockApp.getCurrentOrgId.and.returnValue('org-uuid');

    await TestBed.configureTestingModule({
      imports: [DefaultProjectBoardComponent],
      providers: [
        { provide: EngagementsService, useValue: mockEngagementsService },
        { provide: ZerobiasClientApp, useValue: mockApp },
      ],
    }).compileComponents();

    engagementsService = TestBed.inject(EngagementsService) as jasmine.SpyObj<EngagementsService>;
    app = TestBed.inject(ZerobiasClientApp) as jasmine.SpyObj<ZerobiasClientApp>;
    fixture = TestBed.createComponent(DefaultProjectBoardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load engagement and project tier on init', async () => {
    engagementsService.getDefaultEngagement.and.returnValue(Promise.resolve(mockEngagement));
    engagementsService.getProjectTierProject.and.returnValue(Promise.resolve(mockProjectTier));

    await component.ngOnInit();

    expect(app.getCurrentOrgId).toHaveBeenCalled();
    expect(engagementsService.getDefaultEngagement).toHaveBeenCalledWith('org-uuid');
    expect(engagementsService.getProjectTierProject).toHaveBeenCalledWith('eng-uuid-1');
    expect(component.engagement()).toEqual(mockEngagement);
    expect(component.projectTier()).toEqual(mockProjectTier);
    expect(component.error()).toBeNull();
  });

  it('should set error when current org is unavailable', async () => {
    app.getCurrentOrgId.and.returnValue('');

    await component.ngOnInit();

    expect(component.error()).toContain('Unable to determine your organization');
    expect(engagementsService.getDefaultEngagement).not.toHaveBeenCalled();
  });

  it('should set error when default engagement is missing', async () => {
    engagementsService.getDefaultEngagement.and.returnValue(Promise.resolve(null));

    await component.ngOnInit();

    expect(component.engagement()).toBeNull();
    expect(component.error()).toContain('No default engagement found');
  });

  it('should set error when project tier is missing', async () => {
    engagementsService.getDefaultEngagement.and.returnValue(Promise.resolve(mockEngagement));
    engagementsService.getProjectTierProject.and.returnValue(Promise.resolve(null));

    await component.ngOnInit();

    expect(component.engagement()).toEqual(mockEngagement);
    expect(component.projectTier()).toBeNull();
    expect(component.error()).toContain('Project tier not yet provisioned');
  });

  it('should render success state when both engagement and project tier are loaded', async () => {
    engagementsService.getDefaultEngagement.and.returnValue(Promise.resolve(mockEngagement));
    engagementsService.getProjectTierProject.and.returnValue(Promise.resolve(mockProjectTier));

    await component.ngOnInit();
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('mat-card');
    expect(cards.length).toBe(2);

    const titles = fixture.nativeElement.querySelectorAll('mat-card-title');
    expect(titles[0]?.textContent).toContain('Acme Corp <- ZeroBias');
    expect(titles[1]?.textContent).toContain('ZeroBias Platform');
  });

  it('should expose retry() that calls window.location.reload()', () => {
    const reloadSpy = spyOn(window.location, 'reload');
    component.retry();
    expect(reloadSpy).toHaveBeenCalled();
  });
});
