import { Routes } from '@angular/router';
import { AppShell } from './layout/app-shell.component';
import { Home } from './pages/home/home.component';
import { ProviderList } from './pages/providers/provider-list.component';
import { ProviderDetail } from './pages/providers/provider-detail.component';
import { ServiceCatalog } from './pages/services/service-catalog.component';
import { RfpList } from './pages/rfps/rfp-list.component';
import { RfpDetail } from './pages/rfps/rfp-detail.component';
import { EngagementDetail } from './pages/engagements/engagement-detail.component';
import { ENGAGEMENT_TAB_ROUTES } from './pages/engagements/engagement.routes';
import { RfpWizard } from './pages/rfps/rfp-wizard/rfp-wizard.component';
import { BidWizard } from './pages/rfps/bid-wizard/bid-wizard.component';
import { BidComparisonPage } from './pages/rfps/bid-comparison-page.component';
import { ComingSoon } from './pages/coming-soon/coming-soon.component';
import { CompanyProfileFormComponent } from './onboarding/company-profile-form.component';
import { onboardingGuard } from './core/guards/onboarding.guard';
import { PlatformEngagementSetupComponent } from './onboarding/platform-engagement-setup.component';
import { DefaultProjectBoardComponent } from './pages/default-project-board/default-project-board.component';
import { FeatureComingSoonComponent } from './pages/default-project-board/feature-coming-soon.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShell,
    canActivate: [onboardingGuard],
    children: [
      { path: '', component: Home },
      { path: 'providers', component: ProviderList },
      { path: 'providers/:id', component: ProviderDetail },
      { path: 'services', component: ServiceCatalog },
      { path: 'rfps', component: RfpList },
      { path: 'rfps/new', component: RfpWizard },
      { path: 'rfps/:id', component: RfpDetail },
      { path: 'rfps/:id/edit', component: RfpWizard },
      { path: 'rfps/:id/compare', component: BidComparisonPage },
      { path: 'rfps/:id/bid', component: BidWizard },
      { path: 'rfps/:id/bid/:bidId', component: BidWizard },
      { path: 'engagements/:id', component: EngagementDetail, children: ENGAGEMENT_TAB_ROUTES },
      {
        path: 'templates/:id',
        loadComponent: () =>
          import('./pages/templates/template-editor.component').then(m => m.TemplateEditorComponent),
      },
      {
        path: 'onboarding',
        children: [
          // Platform-engagement provisioning surface (no guard on this route —
          // it IS the guard's error handler and explicit setup destination)
          { path: 'platform-engagement', component: PlatformEngagementSetupComponent },
          { path: 'company-profile', component: CompanyProfileFormComponent },
        ],
      },
      // Phase 30: Default project board + honest coming-soon placeholders
      { path: 'projects', component: DefaultProjectBoardComponent },
      {
        path: 'org-documents',
        component: FeatureComingSoonComponent,
        data: {
          title: 'Org Documents — Coming Soon',
          description: 'Centralized document management and sharing for your organization is on the roadmap. Once available, you\'ll be able to upload, organize, and share documents across engagements.',
          featureKey: '046',
        },
      },
      {
        path: 'engagement-dashboard',
        component: FeatureComingSoonComponent,
        data: {
          title: 'Engagement Dashboard — Coming Soon',
          description: 'Aggregated metrics and progress views across all your engagements are coming soon. You\'ll see status, milestones, and key activity at a glance.',
          featureKey: '066',
        },
      },
      {
        path: 'message-center',
        component: FeatureComingSoonComponent,
        data: {
          title: 'Message Center — Coming Soon',
          description: 'Cross-party messaging across all your engagements is coming soon. Today, conversations live within individual engagements.',
          featureKey: '065',
        },
      },
      // Legacy redirects
      { path: 'engagements', redirectTo: 'rfps', pathMatch: 'full' },
      {
        path: 'org',
        loadChildren: () =>
          import('./pages/org/org.routes').then((m) => m.ORG_ROUTES),
      },
      {
        path: 'orgs',
        loadChildren: () =>
          import('./pages/orgs/orgs.routes').then((m) => m.ORGS_ROUTES),
      },
      {
        path: 'my/engagements',
        loadChildren: () =>
          import('./pages/my-engagements/my-engagements.routes').then((m) => m.MY_ENGAGEMENTS_ROUTES),
      },
      {
        path: 'my/projects',
        loadChildren: () =>
          import('./pages/my-projects/my-projects.routes').then((m) => m.MY_PROJECTS_ROUTES),
      },
      {
        path: 'my/invitations',
        loadChildren: () =>
          import('./pages/my-invitations/my-invitations.routes').then((m) => m.MY_INVITATIONS_ROUTES),
      },
      {
        path: 'my-profile',
        loadChildren: () =>
          import('./pages/my-profile/my-profile.routes').then((m) => m.MY_PROFILE_ROUTES),
      },
      { path: 'catalog', component: ComingSoon, data: { title: 'Browse Catalog' } },
      { path: 'request-assistance', component: ComingSoon, data: { title: 'Request Assistance' } },
      { path: 'feedback', component: ComingSoon, data: { title: 'Site Feedback' } },
      {
        path: 'admin',
        loadChildren: () =>
          import('./pages/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: 'project',
        loadChildren: () =>
          import('./pages/project/project.routes').then((m) => m.PROJECT_ROUTES),
      },
    ],
  },
];
