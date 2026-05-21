import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UUID } from '@zerobias-org/types-core-js';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import type { Board } from '@zerobias-com/platform-sdk';
import { BoardsGridComponent } from '../../../shared/components/boards-grid.component';
import type { BoardCardData, BoardPinToggle } from '../../../shared/components/board-card.component';

/**
 * Engagement-scoped Boards tab (replaces the legacy Tasks tab — L-1, D-Q12).
 *
 * Owns board fetch and pin state; the shared boards-grid is a read-only consumer
 * (L-12 separation). Pin state is held in-memory here in Foundation Wave 1; durable
 * persistence behind the PinStorage interface is wired in Plan 32-05.
 *
 * Engagement -> projectId: an engagement IS a platform.Project, so the engagement
 * route `:id` is the project UUID and is passed directly as the `projectId` filter.
 * This is the correct linkage today.
 */
@Component({
  selector: 'app-engagement-boards-tab',
  standalone: true,
  imports: [MatProgressSpinnerModule, BoardsGridComponent],
  templateUrl: './boards-tab.component.html',
  styleUrl: './boards-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementBoardsTabComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientApi = inject(ZerobiasClientApi);

  readonly boards = signal<BoardCardData[]>([]);
  readonly pinnedBoardIds = signal<string[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const engId = this.route.parent?.snapshot.params['id'] as string | undefined;
    if (!engId) {
      this.loading.set(false);
      return;
    }
    try {
      // BoardApi.list positional sig: (pageNumber, pageSize, ownerId, orgId,
      // boundaryId, projectId, ...). projectId filters boards by parent project.
      const result = await this.clientApi.platformClient
        .getBoardApi()
        .list(1, 50, undefined, undefined, undefined, new UUID(engId));
      this.boards.set((result?.items ?? []).map((b) => this.toCardData(b)));
    } catch (err) {
      console.error('[EngagementBoardsTab] Failed to load boards:', err);
      this.error.set('Failed to load boards.');
    } finally {
      this.loading.set(false);
    }
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
