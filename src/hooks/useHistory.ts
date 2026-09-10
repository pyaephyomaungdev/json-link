import { useState, useCallback, useRef } from 'react';
import { TranslationItem } from '@/types';

interface HistoryState {
  past: TranslationItem[][];
  present: TranslationItem[];
  future: TranslationItem[][];
}

const MAX_HISTORY_LENGTH = 40;

export function useHistory(initialPresent: TranslationItem[]) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialPresent,
    future: [],
  });

  const presentRef = useRef(initialPresent);
  presentRef.current = history.present;

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  /**
   * Set new state and record in history stack
   */
  const setWithHistory = useCallback((newPresent: TranslationItem[]) => {
    setHistory(curr => {
      if (curr.present === newPresent) return curr;

      const newPast = [...curr.past, curr.present];
      if (newPast.length > MAX_HISTORY_LENGTH) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: newPresent,
        future: [],
      };
    });
  }, []);

  /**
   * Replace state without recording in history (e.g. initial load or reset)
   */
  const setWithoutHistory = useCallback((newPresent: TranslationItem[]) => {
    setHistory({
      past: [],
      present: newPresent,
      future: [],
    });
  }, []);

  /**
   * Perform Undo
   */
  const undo = useCallback((): TranslationItem[] | null => {
    let restored: TranslationItem[] | null = null;
    setHistory(curr => {
      if (curr.past.length === 0) return curr;

      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, curr.past.length - 1);
      restored = previous;

      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future],
      };
    });
    return restored;
  }, []);

  /**
   * Perform Redo
   */
  const redo = useCallback((): TranslationItem[] | null => {
    let restored: TranslationItem[] | null = null;
    setHistory(curr => {
      if (curr.future.length === 0) return curr;

      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      restored = next;

      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture,
      };
    });
    return restored;
  }, []);

  return {
    items: history.present,
    setWithHistory,
    setWithoutHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.past.length,
  };
}
