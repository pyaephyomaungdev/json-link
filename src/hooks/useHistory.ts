import { useState, useCallback } from 'react';
import { TranslationItem } from '@/types';

export type HistoryPatch =
  | {
      type: 'cell_change';
      id: string; // key of translation item
      field: string; // 'key' | 'description' | language code
      prevValue: string;
      nextValue: string;
    }
  | {
      type: 'row_add';
      index: number;
      item: TranslationItem;
    }
  | {
      type: 'row_delete';
      index: number;
      item: TranslationItem;
    }
  | {
      type: 'row_move';
      fromIndex: number;
      toIndex: number;
    }
  | {
      type: 'batch';
      patches: HistoryPatch[];
      description?: string;
    }
  | {
      type: 'snapshot';
      prevItems: TranslationItem[];
      nextItems: TranslationItem[];
    };

interface HistoryState {
  past: HistoryPatch[];
  present: TranslationItem[];
  future: HistoryPatch[];
}

const MAX_HISTORY_LENGTH = 50;

/**
 * Computes a fine-grained delta patch between two translation item arrays.
 * Preserves O(Δ) memory footprint instead of cloning entire 5,000-item arrays.
 */
export function computeDeltaPatch(
  prev: TranslationItem[],
  next: TranslationItem[]
): HistoryPatch | null {
  if (prev === next) return null;

  // 1. Single row addition
  if (next.length === prev.length + 1) {
    let diffIndex = -1;
    for (let i = 0; i < prev.length; i++) {
      if (prev[i].key !== next[i].key) {
        diffIndex = i;
        break;
      }
    }
    const insertIndex = diffIndex === -1 ? prev.length : diffIndex;
    return {
      type: 'row_add',
      index: insertIndex,
      item: next[insertIndex],
    };
  }

  // 2. Single row deletion
  if (next.length === prev.length - 1) {
    let diffIndex = -1;
    for (let i = 0; i < next.length; i++) {
      if (prev[i].key !== next[i].key) {
        diffIndex = i;
        break;
      }
    }
    const deleteIndex = diffIndex === -1 ? prev.length - 1 : diffIndex;
    return {
      type: 'row_delete',
      index: deleteIndex,
      item: prev[deleteIndex],
    };
  }

  // 3. Same length: identify modified rows and cells
  if (prev.length === next.length) {
    const patches: HistoryPatch[] = [];

    for (let i = 0; i < prev.length; i++) {
      const p = prev[i];
      const n = next[i];
      if (p === n) continue;

      if (p.key !== n.key) {
        patches.push({
          type: 'cell_change',
          id: p.key,
          field: 'key',
          prevValue: p.key,
          nextValue: n.key,
        });
      }

      if (p.description !== n.description) {
        patches.push({
          type: 'cell_change',
          id: n.key,
          field: 'description',
          prevValue: p.description || '',
          nextValue: n.description || '',
        });
      }

      // Check language fields directly on item
      const allProps = new Set([
        ...Object.keys(p),
        ...Object.keys(n),
      ]);

      for (const prop of allProps) {
        if (prop === 'key' || prop === 'description' || prop === 'status') continue;
        const prevVal = (p[prop] as string) ?? '';
        const nextVal = (n[prop] as string) ?? '';
        if (prevVal !== nextVal) {
          patches.push({
            type: 'cell_change',
            id: n.key,
            field: prop,
            prevValue: prevVal,
            nextValue: nextVal,
          });
        }
      }
    }

    if (patches.length === 0) return null;
    if (patches.length === 1) return patches[0];
    if (patches.length <= 100) {
      return { type: 'batch', patches };
    }
  }

  // Fallback for massive bulk re-ordering or bulk imports > 100 changes
  return {
    type: 'snapshot',
    prevItems: prev,
    nextItems: next,
  };
}

function matchesCellPatch(
  item: TranslationItem,
  patch: Extract<HistoryPatch, { type: 'cell_change' }>,
  direction: 'forward' | 'invert'
): boolean {
  if (patch.field === 'key') {
    const lookup = direction === 'forward' ? patch.prevValue : patch.nextValue;
    return item.key === lookup || item.key === patch.id;
  }
  return item.key === patch.id;
}

/**
 * Reverses a patch to restore previous state
 */
export function applyInvertedPatch(items: TranslationItem[], patch: HistoryPatch): TranslationItem[] {
  switch (patch.type) {
    case 'cell_change': {
      return items.map(item => {
        if (!matchesCellPatch(item, patch, 'invert')) return item;
        return {
          ...item,
          [patch.field]: patch.prevValue,
        };
      });
    }
    case 'row_add': {
      const next = [...items];
      next.splice(patch.index, 1);
      return next;
    }
    case 'row_delete': {
      const next = [...items];
      next.splice(patch.index, 0, patch.item);
      return next;
    }
    case 'row_move': {
      const next = [...items];
      const [moved] = next.splice(patch.toIndex, 1);
      if (moved) {
        next.splice(patch.fromIndex, 0, moved);
      }
      return next;
    }
    case 'batch': {
      let current = items;
      for (let i = patch.patches.length - 1; i >= 0; i--) {
        current = applyInvertedPatch(current, patch.patches[i]);
      }
      return current;
    }
    case 'snapshot': {
      return patch.prevItems;
    }
  }
}

/**
 * Applies a forward patch to re-apply undone state
 */
export function applyForwardPatch(items: TranslationItem[], patch: HistoryPatch): TranslationItem[] {
  switch (patch.type) {
    case 'cell_change': {
      return items.map(item => {
        if (!matchesCellPatch(item, patch, 'forward')) return item;
        return {
          ...item,
          [patch.field]: patch.nextValue,
        };
      });
    }
    case 'row_add': {
      const next = [...items];
      next.splice(patch.index, 0, patch.item);
      return next;
    }
    case 'row_delete': {
      const next = [...items];
      next.splice(patch.index, 1);
      return next;
    }
    case 'row_move': {
      const next = [...items];
      const [moved] = next.splice(patch.fromIndex, 1);
      if (moved) {
        next.splice(patch.toIndex, 0, moved);
      }
      return next;
    }
    case 'batch': {
      let current = items;
      for (const p of patch.patches) {
        current = applyForwardPatch(current, p);
      }
      return current;
    }
    case 'snapshot': {
      return patch.nextItems;
    }
  }
}

export function useHistory(initialPresent: TranslationItem[]) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialPresent,
    future: [],
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  /**
   * Set new state and record delta patch in history stack
   */
  const setWithHistory = useCallback((newPresent: TranslationItem[]) => {
    setHistory(curr => {
      if (curr.present === newPresent) return curr;

      const patch = computeDeltaPatch(curr.present, newPresent);
      if (!patch) {
        return {
          ...curr,
          present: newPresent,
        };
      }

      const newPast = [...curr.past, patch];
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

      const patch = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, curr.past.length - 1);
      const restoredItems = applyInvertedPatch(curr.present, patch);
      restored = restoredItems;

      return {
        past: newPast,
        present: restoredItems,
        future: [patch, ...curr.future],
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

      const patch = curr.future[0];
      const newFuture = curr.future.slice(1);
      const restoredItems = applyForwardPatch(curr.present, patch);
      restored = restoredItems;

      return {
        past: [...curr.past, patch],
        present: restoredItems,
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
