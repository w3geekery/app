import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { EngagementBoardsTabComponent } from './boards-tab.component';
import { EngagementContextService } from '../../../core/services/engagement-context.service';
import type { EngagementDetailRow } from '../../../core/models';

const BOUNDARY_ID = '0a8a5f3e-1b2c-4d5e-8f90-1a2b3c4d5e6f';

function makeBoard(id: string) {
  return { id, name: `Board ${id}`, description: null, boardType: 'kanban', status: 'active', isDefault: false };
}

function engWithBoundary(boundaryId: string | null): EngagementDetailRow {
  return { id: 'eng-row-1', zerobias_boundary_id: boundaryId, title: 'Eng' } as unknown as EngagementDetailRow;
}

describe('EngagementBoardsTabComponent', () => {
  let listSpy: ReturnType<typeof vi.fn>;
  let router: { navigate: ReturnType<typeof vi.fn> };

  function setup() {
    listSpy = vi.fn().mockResolvedValue({ items: [makeBoard('b1'), makeBoard('b2')] });
    router = { navigate: vi.fn() };
    const clientApi = { platformClient: { getBoardApi: () => ({ list: listSpy }) } };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [EngagementBoardsTabComponent],
      providers: [
        { provide: ZerobiasClientApi, useValue: clientApi },
        { provide: Router, useValue: router },
      ],
    });
    const fixture: ComponentFixture<EngagementBoardsTabComponent> =
      TestBed.createComponent(EngagementBoardsTabComponent);
    const ctx = TestBed.inject(EngagementContextService);
    return { fixture, component: fixture.componentInstance, ctx };
  }

  beforeEach(() => vi.clearAllMocks());

  it('fetches boards filtered by the engagement boundary id (positional arg 5)', async () => {
    const { fixture, component, ctx } = setup();
    ctx.setEngagement(engWithBoundary(BOUNDARY_ID));
    fixture.detectChanges(); // flush the effect
    await fixture.whenStable();

    expect(listSpy).toHaveBeenCalledTimes(1);
    expect(String(listSpy.mock.calls[0][4])).toBe(BOUNDARY_ID); // boundaryId is arg index 4
    expect(listSpy.mock.calls[0][5]).toBeUndefined(); // projectId NOT used for engagement boards
    expect(component.boards().length).toBe(2);
    expect(component.boards()[0]).toMatchObject({ id: 'b1', boardType: 'kanban', status: 'active' });
    expect(component.loading()).toBe(false);
  });

  it('skips fetch and stops loading when the engagement has no boundary', async () => {
    const { fixture, component, ctx } = setup();
    ctx.setEngagement(engWithBoundary(null));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(listSpy).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('sets an error and empties boards when the fetch throws', async () => {
    const { fixture, component, ctx } = setup();
    listSpy.mockRejectedValueOnce(new Error('boom'));
    ctx.setEngagement(engWithBoundary(BOUNDARY_ID));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error()).toBe('Failed to load boards.');
    expect(component.boards()).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  it('navigates to the board detail route on drill', () => {
    const { component } = setup();
    component.onBoardClick('b9');
    expect(router.navigate).toHaveBeenCalledWith(['/boards', 'b9']);
  });

  it('adds and removes pinned board ids on toggle', () => {
    const { component } = setup();
    component.onPinToggle({ boardId: 'b1', isPinned: true });
    expect(component.pinnedBoardIds()).toEqual(['b1']);
    component.onPinToggle({ boardId: 'b1', isPinned: false });
    expect(component.pinnedBoardIds()).toEqual([]);
  });
});
