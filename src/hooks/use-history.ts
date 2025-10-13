import { useCallback, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { HistoryEntry, HistoryState, ChangeAction, EntityType } from '@/lib/history-types';
import { toast } from 'sonner';

const DEFAULT_MAX_HISTORY = 100;

export function useHistory() {
  const [historyState, setHistoryState] = useKV<HistoryState>('app-history', {
    entries: [],
    currentIndex: -1,
    maxHistorySize: DEFAULT_MAX_HISTORY,
  });

  const canUndo = (historyState?.currentIndex ?? -1) >= 0;
  const canRedo = (historyState?.currentIndex ?? -1) < (historyState?.entries.length ?? 0) - 1;

  const addHistoryEntry = useCallback((
    action: ChangeAction,
    entityType: EntityType,
    entityId: string,
    description: string,
    previousState: any,
    newState: any,
    comment?: string,
    entityName?: string
  ) => {
    setHistoryState((current) => {
      const state = current || { entries: [], currentIndex: -1, maxHistorySize: DEFAULT_MAX_HISTORY };
      
      const newEntry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        action,
        entityType,
        entityId,
        entityName,
        description,
        comment,
        previousState,
        newState,
      };

      const newEntries = [
        ...state.entries.slice(0, state.currentIndex + 1),
        newEntry,
      ].slice(-state.maxHistorySize);

      return {
        entries: newEntries,
        currentIndex: newEntries.length - 1,
        maxHistorySize: state.maxHistorySize,
      };
    });
  }, [setHistoryState]);

  const undo = useCallback(async (): Promise<HistoryEntry | null> => {
    if (!canUndo || !historyState) {
      toast.error('Nothing to undo');
      return null;
    }

    const entry = historyState.entries[historyState.currentIndex];
    
    setHistoryState((current) => {
      const state = current || { entries: [], currentIndex: -1, maxHistorySize: DEFAULT_MAX_HISTORY };
      return {
        entries: state.entries,
        currentIndex: state.currentIndex - 1,
        maxHistorySize: state.maxHistorySize,
      };
    });

    toast.success(`Undone: ${entry.description}`);
    return entry;
  }, [canUndo, historyState, setHistoryState]);

  const redo = useCallback(async (): Promise<HistoryEntry | null> => {
    if (!canRedo || !historyState) {
      toast.error('Nothing to redo');
      return null;
    }

    const entry = historyState.entries[historyState.currentIndex + 1];
    
    setHistoryState((current) => {
      const state = current || { entries: [], currentIndex: -1, maxHistorySize: DEFAULT_MAX_HISTORY };
      return {
        entries: state.entries,
        currentIndex: state.currentIndex + 1,
        maxHistorySize: state.maxHistorySize,
      };
    });

    toast.success(`Redone: ${entry.description}`);
    return entry;
  }, [canRedo, historyState, setHistoryState]);

  const jumpToEntry = useCallback((targetIndex: number) => {
    if (!historyState || targetIndex < -1 || targetIndex >= historyState.entries.length) {
      toast.error('Invalid history position');
      return;
    }

    setHistoryState((current) => {
      const state = current || { entries: [], currentIndex: -1, maxHistorySize: DEFAULT_MAX_HISTORY };
      return {
        entries: state.entries,
        currentIndex: targetIndex,
        maxHistorySize: state.maxHistorySize,
      };
    });

    const entry = historyState.entries[targetIndex];
    if (entry) {
      toast.success(`Jumped to: ${entry.description}`);
    }
  }, [historyState, setHistoryState]);

  const clearHistory = useCallback(() => {
    setHistoryState((current) => {
      const state = current || { entries: [], currentIndex: -1, maxHistorySize: DEFAULT_MAX_HISTORY };
      return {
        entries: [],
        currentIndex: -1,
        maxHistorySize: state.maxHistorySize,
      };
    });
    toast.success('History cleared');
  }, [setHistoryState]);

  const addComment = useCallback((entryId: string, comment: string) => {
    setHistoryState((current) => {
      const state = current || { entries: [], currentIndex: -1, maxHistorySize: DEFAULT_MAX_HISTORY };
      return {
        entries: state.entries.map(entry =>
          entry.id === entryId ? { ...entry, comment } : entry
        ),
        currentIndex: state.currentIndex,
        maxHistorySize: state.maxHistorySize,
      };
    });
  }, [setHistoryState]);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [undo, redo]);

  return {
    historyState,
    addHistoryEntry,
    undo,
    redo,
    jumpToEntry,
    clearHistory,
    addComment,
    canUndo,
    canRedo,
  };
}
