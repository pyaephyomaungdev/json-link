// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory, computeDeltaPatch } from '../useHistory';
import { TranslationItem } from '@/types';

const INITIAL_ITEMS: TranslationItem[] = [
  { key: 'hello', description: 'Greeting', en: 'Hello', my: 'မင်္ဂလာပါ' },
  { key: 'world', description: 'Planet', en: 'World', my: 'ကမ္ဘာ' },
];

describe('useHistory with Delta Patches', () => {
  it('initializes with default items and empty history stacks', () => {
    const { result } = renderHook(() => useHistory(INITIAL_ITEMS));

    expect(result.current.items).toEqual(INITIAL_ITEMS);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.historyLength).toBe(0);
  });

  it('records single cell edit and undoes/redoes correctly', () => {
    const { result } = renderHook(() => useHistory(INITIAL_ITEMS));

    const updated: TranslationItem[] = [
      { key: 'hello', description: 'Greeting', en: 'Hello there!', my: 'မင်္ဂလာပါ' },
      INITIAL_ITEMS[1],
    ];

    act(() => {
      result.current.setWithHistory(updated);
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.items[0].en).toBe('Hello there!');

    // Undo
    act(() => {
      result.current.undo();
    });

    expect(result.current.items[0].en).toBe('Hello');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    // Redo
    act(() => {
      result.current.redo();
    });

    expect(result.current.items[0].en).toBe('Hello there!');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('handles row additions and deletions via delta patches', () => {
    const { result } = renderHook(() => useHistory(INITIAL_ITEMS));

    const newRow: TranslationItem = {
      key: 'bye',
      description: 'Farewell',
      en: 'Goodbye',
      my: 'နှုတ်ဆက်ပါတယ်',
    };

    const withAddedRow = [...INITIAL_ITEMS, newRow];

    // Add row
    act(() => {
      result.current.setWithHistory(withAddedRow);
    });

    expect(result.current.items).toHaveLength(3);
    expect(result.current.canUndo).toBe(true);

    // Undo addition -> should have 2 rows
    act(() => {
      result.current.undo();
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.find(i => i.key === 'bye')).toBeUndefined();

    // Redo addition -> 3 rows again
    act(() => {
      result.current.redo();
    });

    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[2].key).toBe('bye');

    // Delete row
    const withDeletedRow = result.current.items.slice(0, 2);
    act(() => {
      result.current.setWithHistory(withDeletedRow);
    });

    expect(result.current.items).toHaveLength(2);

    // Undo deletion -> restored
    act(() => {
      result.current.undo();
    });

    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[2].key).toBe('bye');
  });

  it('resets history on setWithoutHistory', () => {
    const { result } = renderHook(() => useHistory(INITIAL_ITEMS));

    act(() => {
      result.current.setWithHistory([
        { ...INITIAL_ITEMS[0], description: 'New description' },
        INITIAL_ITEMS[1],
      ]);
    });

    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.setWithoutHistory(INITIAL_ITEMS);
    });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.historyLength).toBe(0);
  });

  it('undoes and redoes a key rename using the previous key as identity', () => {
    const { result } = renderHook(() => useHistory(INITIAL_ITEMS));

    const renamed: TranslationItem[] = [
      { key: 'hello.world', description: 'Greeting', en: 'Hello', my: 'မင်္ဂလာပါ' },
      INITIAL_ITEMS[1],
    ];

    act(() => {
      result.current.setWithHistory(renamed);
    });
    expect(result.current.items[0].key).toBe('hello.world');

    act(() => {
      result.current.undo();
    });
    expect(result.current.items[0].key).toBe('hello');
    expect(result.current.items[0].en).toBe('Hello');

    act(() => {
      result.current.redo();
    });
    expect(result.current.items[0].key).toBe('hello.world');
  });

  it('computes fine-grained batch delta patches for multi-cell updates', () => {
    const patch = computeDeltaPatch(INITIAL_ITEMS, [
      { key: 'hello', description: 'Updated Greeting', en: 'Hi', my: 'မင်္ဂလာပါ' },
      INITIAL_ITEMS[1],
    ]);

    expect(patch).not.toBeNull();
    expect(patch?.type).toBe('batch');
    if (patch?.type === 'batch') {
      expect(patch.patches).toHaveLength(2); // description + en translation
    }
  });
});
