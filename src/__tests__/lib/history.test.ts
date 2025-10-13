import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHistory } from '@/hooks/use-history';
import { HistoryState, ChangeAction, EntityType } from '@/lib/history-types';

vi.mock('@github/spark/hooks', () => ({
  useKV: vi.fn((key: string, defaultValue: any) => {
    let value = defaultValue;
    const setValue = vi.fn((updater: any) => {
      if (typeof updater === 'function') {
        value = updater(value);
      } else {
        value = updater;
      }
    });
    return [value, setValue];
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('History Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useHistory hook', () => {
    it('should initialize with empty history state', () => {
      const { result } = renderHook(() => useHistory());

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should add history entry', () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-1',
          'Created test step',
          null,
          { id: 'step-1', name: 'Test Step' }
        );
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should handle multiple history entries', () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-1',
          'Created step 1',
          null,
          { id: 'step-1', name: 'Step 1' }
        );
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-2',
          'Created step 2',
          null,
          { id: 'step-2', name: 'Step 2' }
        );
        result.current.addHistoryEntry(
          'update',
          'catalog-step',
          'step-1',
          'Updated step 1',
          { id: 'step-1', name: 'Step 1' },
          { id: 'step-1', name: 'Step 1 Updated' }
        );
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should clear redo stack when adding new entry after undo', () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-1',
          'Created step 1',
          null,
          { id: 'step-1' }
        );
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-2',
          'Created step 2',
          null,
          { id: 'step-2' }
        );
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-3',
          'Created step 3',
          null,
          { id: 'step-3' }
        );
      });

      expect(result.current.canRedo).toBe(false);
    });

    it('should respect max history size', () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        for (let i = 0; i < 105; i++) {
          result.current.addHistoryEntry(
            'create',
            'catalog-step',
            `step-${i}`,
            `Created step ${i}`,
            null,
            { id: `step-${i}` }
          );
        }
      });

      expect(result.current.historyState?.entries.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Undo functionality', () => {
    it('should undo last action', async () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-1',
          'Created test step',
          null,
          { id: 'step-1', name: 'Test Step' }
        );
      });

      let undoneEntry;
      await act(async () => {
        undoneEntry = await result.current.undo();
      });

      expect(undoneEntry).toBeDefined();
      expect(undoneEntry?.description).toBe('Created test step');
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('should return null when nothing to undo', async () => {
      const { result } = renderHook(() => useHistory());

      let undoneEntry;
      await act(async () => {
        undoneEntry = await result.current.undo();
      });

      expect(undoneEntry).toBeNull();
    });

    it('should undo multiple actions in sequence', async () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-1',
          'Created step 1',
          null,
          { id: 'step-1' }
        );
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-2',
          'Created step 2',
          null,
          { id: 'step-2' }
        );
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-3',
          'Created step 3',
          null,
          { id: 'step-3' }
        );
      });

      let entry1, entry2, entry3;
      await act(async () => {
        entry3 = await result.current.undo();
        entry2 = await result.current.undo();
        entry1 = await result.current.undo();
      });

      expect(entry3?.description).toBe('Created step 3');
      expect(entry2?.description).toBe('Created step 2');
      expect(entry1?.description).toBe('Created step 1');
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });
  });

  describe('Redo functionality', () => {
    it('should redo previously undone action', async () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-1',
          'Created test step',
          null,
          { id: 'step-1', name: 'Test Step' }
        );
      });

      await act(async () => {
        await result.current.undo();
      });

      let redoneEntry;
      await act(async () => {
        redoneEntry = await result.current.redo();
      });

      expect(redoneEntry).toBeDefined();
      expect(redoneEntry?.description).toBe('Created test step');
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should return null when nothing to redo', async () => {
      const { result } = renderHook(() => useHistory());

      let redoneEntry;
      await act(async () => {
        redoneEntry = await result.current.redo();
      });

      expect(redoneEntry).toBeNull();
    });

    it('should redo multiple actions in sequence', async () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-1',
          'Created step 1',
          null,
          { id: 'step-1' }
        );
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-2',
          'Created step 2',
          null,
          { id: 'step-2' }
        );
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-3',
          'Created step 3',
          null,
          { id: 'step-3' }
        );
      });

      await act(async () => {
        await result.current.undo();
        await result.current.undo();
        await result.current.undo();
      });

      let entry1, entry2, entry3;
      await act(async () => {
        entry1 = await result.current.redo();
        entry2 = await result.current.redo();
        entry3 = await result.current.redo();
      });

      expect(entry1?.description).toBe('Created step 1');
      expect(entry2?.description).toBe('Created step 2');
      expect(entry3?.description).toBe('Created step 3');
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('Jump to entry', () => {
    it('should jump to specific history entry', () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-1',
          'Created step 1',
          null,
          { id: 'step-1' }
        );
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-2',
          'Created step 2',
          null,
          { id: 'step-2' }
        );
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-3',
          'Created step 3',
          null,
          { id: 'step-3' }
        );
      });

      act(() => {
        result.current.jumpToEntry(0);
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);
    });

    it('should handle invalid jump index', () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-1',
          'Created step 1',
          null,
          { id: 'step-1' }
        );
      });

      act(() => {
        result.current.jumpToEntry(999);
      });

      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('Clear history', () => {
    it('should clear all history entries', () => {
      const { result } = renderHook(() => useHistory());

      act(() => {
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-1',
          'Created step 1',
          null,
          { id: 'step-1' }
        );
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-2',
          'Created step 2',
          null,
          { id: 'step-2' }
        );
      });

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('Add comment', () => {
    it('should add comment to history entry', () => {
      const { result } = renderHook(() => useHistory());

      let entryId: string;
      act(() => {
        result.current.addHistoryEntry(
          'create',
          'catalog-step',
          'step-1',
          'Created test step',
          null,
          { id: 'step-1' }
        );
        entryId = result.current.historyState?.entries[0]?.id || '';
      });

      act(() => {
        result.current.addComment(entryId, 'This is a test comment');
      });

      const entry = result.current.historyState?.entries.find(e => e.id === entryId);
      expect(entry?.comment).toBe('This is a test comment');
    });
  });

  describe('History entry structure', () => {
    it('should create entry with all required fields', () => {
      const { result } = renderHook(() => useHistory());

      const previousState = { id: 'step-1', name: 'Original' };
      const newState = { id: 'step-1', name: 'Updated' };

      act(() => {
        result.current.addHistoryEntry(
          'update',
          'catalog-step',
          'step-1',
          'Updated test step',
          previousState,
          newState,
          'Custom comment',
          'Test Step Name'
        );
      });

      const entry = result.current.historyState?.entries[0];
      expect(entry).toBeDefined();
      expect(entry?.action).toBe('update');
      expect(entry?.entityType).toBe('catalog-step');
      expect(entry?.entityId).toBe('step-1');
      expect(entry?.entityName).toBe('Test Step Name');
      expect(entry?.description).toBe('Updated test step');
      expect(entry?.comment).toBe('Custom comment');
      expect(entry?.previousState).toEqual(previousState);
      expect(entry?.newState).toEqual(newState);
      expect(entry?.timestamp).toBeInstanceOf(Date);
    });

    it('should support different action types', () => {
      const { result } = renderHook(() => useHistory());

      const actions: ChangeAction[] = ['create', 'update', 'delete', 'reorder'];

      actions.forEach((action, index) => {
        act(() => {
          result.current.addHistoryEntry(
            action,
            'catalog-step',
            `step-${index}`,
            `Action: ${action}`,
            null,
            { id: `step-${index}` }
          );
        });
      });

      const entries = result.current.historyState?.entries || [];
      expect(entries).toHaveLength(4);
      actions.forEach((action, index) => {
        expect(entries[index]?.action).toBe(action);
      });
    });

    it('should support different entity types', () => {
      const { result } = renderHook(() => useHistory());

      const entityTypes: EntityType[] = ['catalog-step', 'test-case', 'test-membership'];

      entityTypes.forEach((entityType, index) => {
        act(() => {
          result.current.addHistoryEntry(
            'create',
            entityType,
            `entity-${index}`,
            `Created ${entityType}`,
            null,
            { id: `entity-${index}` }
          );
        });
      });

      const entries = result.current.historyState?.entries || [];
      expect(entries).toHaveLength(3);
      entityTypes.forEach((entityType, index) => {
        expect(entries[index]?.entityType).toBe(entityType);
      });
    });
  });
});
