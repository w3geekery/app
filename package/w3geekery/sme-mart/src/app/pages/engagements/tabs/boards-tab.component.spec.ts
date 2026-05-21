import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { EngagementBoardsTabComponent } from './boards-tab.component';

const ENG_ID = '0a8a5f3e-1b2c-4d5e-8f90-1a2b3c4d5e6f';

function makeBoard(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: `Board ${id}`,
    description: null,
    boardType: 'kanban',
    status: 'active',
    isDefault: false,
    ...overrides,
  };
}

describe('EngagementBoardsTabComponent', () => {
  let listSpy: ReturnType<typeof vi.fn>;
  let router: { navigate: ReturnType<typeof vi.fn> };

  function setup(parentId: string | null = ENG_ID) {
    listSpy = vi.fn().mockResolvedValue({ items: [makeBoard('b1'), makeBoard('b2')] });
    router = { navigate: vi.fn() };
    const clientApi = {
      platformClient: { getBoardApi: () => ({ list: listSpy }) },
    };
    const route = { parent: { snapshot: { params: parentId ? { id: parentId } : {} } } };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [EngagementBoardsTabComponent],
      providers: [
        { provide: ZerobiasClientApi, useValue: clientApi },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
      ],
    });
    return TestBed.createComponent(EngagementBoardsTabComponent).componentInstance;
  }

  beforeEach(() => vi.clearAllMocks());

  it('fetches boards filtered by the engagement id (as projectId) on init', async () => {
    const c = setup();
    await c.ngOnInit();
    expect(listSpy).toHaveBeenCalledTimes(1);
    const args = listSpy.mock.calls[0];
    expect(String(args[5])).toBe(ENG_ID); // projectId positional arg
    expect(c.boards().length).toBe(2);
    expect(c.boards()[0]).toMatchObject({ id: 'b1', boardType: 'kanban', status: 'active' });
    expect(c.loading()).toBe(false);
  });

  it('skips fetch and stops loading when there is no engagement id', async () => {
    const c = setup(null);
    await c.ngOnInit();
    expect(listSpy).not.toHaveBeenCalled();
    expect(c.loading()).toBe(false);
  });

  it('sets an error and empties boards when the fetch throws', async () => {
    const c = setup();
    listSpy.mockRejectedValueOnce(new Error('boom'));
    await c.ngOnInit();
    expect(c.error()).toBe('Failed to load boards.');
    expect(c.boards()).toEqual([]);
    expect(c.loading()).toBe(false);
  });

  it('navigates to the board detail route on drill', () => {
    const c = setup();
    c.onBoardClick('b9');
    expect(router.navigate).toHaveBeenCalledWith(['/boards', 'b9']);
  });

  it('adds and removes pinned board ids on toggle', () => {
    const c = setup();
    c.onPinToggle({ boardId: 'b1', isPinned: true });
    expect(c.pinnedBoardIds()).toEqual(['b1']);
    c.onPinToggle({ boardId: 'b1', isPinned: false });
    expect(c.pinnedBoardIds()).toEqual([]);
  });
});
