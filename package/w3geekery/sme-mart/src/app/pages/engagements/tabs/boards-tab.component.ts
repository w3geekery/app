import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UUID } from '@zerobias-org/types-core-js';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import type { Board } from '@zerobias-com/platform-sdk';
import { BoardsGridComponent } from '../../../shared/components/boards-grid.component';
import type { BoardCardData, BoardPinToggle } from '../../../shared/components/board-card.component';
import { EngagementContextService } from '../../../core/services/engagement-context.service';

/**
 * Engagement-scoped Boards tab (replaces the legacy Tasks tab — L-1, D-Q12).
 *
 * Owns board fetch and pin state; the shared boards-grid is a read-only consumer
 * (L-12 separation). Pin state is held in-memory here in Foundation Wave 1; durable
 * persistence behind the PinStorage interface is wired in Plan 32-05.
 *
 * Boundary linkage: engagement boards are owned by the engagement's BOUNDARY (board
 * owner filters are mutually exclusive — boundaryId, never projectId). The boundary id
 * comes from EngagementContextService — the same linkage the legacy Tasks tab used
 * (engagement().zerobias_boundary_id -> TaskListPanel.boundaryId). The parent loads the
 * engagement asynchronously, so we react to the context signal rather than reading once.
 */
@Component({
  selector: 'app-engagement-boards-tab',
  standalone: true,
  imports: [MatProgressSpinnerModule, BoardsGridComponent],
  templateUrl: './boards-tab.component.html',
  styleUrl: './boards-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementBoardsTabComponent {
  private readonly ctx = inject(EngagementContextService);
  private readonly router = inject(Router);
  private readonly clientApi = inject(ZerobiasClientApi);

  readonly boards = signal<BoardCardData[]>([]);
  readonly pinnedBoardIds = signal<string[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** Guard so the boundary-driven fetch runs at most once. */
  private requested = false;

  constructor() {
    effect(() => {
      const eng = this.ctx.engagement();
      if (!eng || this.requested) {
        return;
      }
      this.requested = true;
      const boundaryId = eng.zerobias_boundary_id;
      if (boundaryId) {
        void this.fetchBoards(boundaryId);
      } else {
        // Engagement genuinely has no boundary -> nothing to fetch (graceful empty).
        this.loading.set(false);
      }
    });
  }

  onBoardClick(boardId: string): void {
    this.router.navigate(['/boards', boardId]);
  }

  onPinToggle({ boardId, isPinned }: BoardPinToggle): void {
    // In-memory pin state for Foundation Wave 1; persistence wired in Plan 32-05.
    const current = this.pinnedBoardIds();
    this.pinnedBoardIds.set(
      isPinned ? [...current, boardId] : current.filter((id) => id !== boardId),
    );
  }

  private async fetchBoards(boundaryId: string): Promise<void> {
    try {
      // BoardApi.list positional sig: (pageNumber, pageSize, ownerId, orgId,
      // boundaryId, projectId, ...). Engagement boards are boundary-owned.
      const result = await this.clientApi.platformClient
        .getBoardApi()
        .list(1, 50, undefined, undefined, new UUID(boundaryId), undefined);
      this.boards.set((result?.items ?? []).map((b) => this.toCardData(b)));
    } catch (err) {
      console.error('[EngagementBoardsTab] Failed to load boards:', err);
      this.error.set('Failed to load boards.');
    } finally {
      this.loading.set(false);
    }
  }

  private toCardData(b: Board): BoardCardData {
    return {
      id: String(b.id),
      name: b.name,
      description: b.description ?? null,
      boardType: String(b.boardType ?? ''),
      status: String(b.status ?? ''),
      isDefault: Boolean(b.isDefault),
    };
  }
}
