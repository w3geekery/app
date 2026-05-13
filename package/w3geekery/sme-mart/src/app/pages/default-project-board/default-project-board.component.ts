import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { EngagementsService } from '../../core/services/engagements.service';
import type { ProjectExtended } from '@zerobias-com/platform-sdk';

@Component({
  selector: 'sme-mart-default-project-board',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule, MatButtonModule],
  templateUrl: './default-project-board.component.html',
  styleUrls: ['./default-project-board.component.scss'],
})
export class DefaultProjectBoardComponent implements OnInit {
  private readonly app = inject(ZerobiasClientApp);
  private readonly engagements = inject(EngagementsService);

  // Reactive state
  readonly loading = signal(false);
  readonly engagement = signal<ProjectExtended | null>(null);
  readonly projectTier = signal<ProjectExtended | null>(null);
  readonly error = signal<string | null>(null);

  readonly hasEngagement = computed(() => this.engagement() !== null);
  readonly hasProjectTier = computed(() => this.projectTier() !== null);
  readonly hasError = computed(() => this.error() !== null);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Current org accessor — delegates to ZerobiasClientApp (canonical pattern;
      // sourced from sessionStorage `zb-current-dana-org-id` via the SDK's org-selection layer).
      // Reference: impersonation.service.ts:69, sme-mart-tag.service.ts:59.
      const orgId = this.app.getCurrentOrgId();

      if (!orgId) {
        this.error.set('Unable to determine your organization. Please contact support.');
        return;
      }

      // Step 1: Load default engagement (depth-1)
      const engagement = await this.engagements.getDefaultEngagement(orgId);
      if (!engagement) {
        this.error.set('No default engagement found. Please contact support.');
        return;
      }
      this.engagement.set(engagement);

      // Step 2: Load project-tier child (depth-2)
      // Defensive branch per G5: gracefully handle missing project tier
      const projectTier = await this.engagements.getProjectTierProject(String(engagement.id));
      if (!projectTier) {
        this.error.set('Project tier not yet provisioned. Please contact support.');
        return;
      }
      this.projectTier.set(projectTier);
    } catch (err) {
      console.error('[DEFAULT_PROJECT_BOARD:INIT_ERROR]', (err as Error).message);
      this.error.set('Failed to load your project board. Please refresh the page.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Retry handler bound to the template's retry button. */
  retry(): void {
    window.location.reload();
  }
}
