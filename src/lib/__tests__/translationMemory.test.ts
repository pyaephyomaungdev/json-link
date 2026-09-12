// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSimilarity,
  upsertMemoryEntry,
  seedMemoryFromItems,
  findExactMemoryMatch,
  findFuzzyMemoryMatches,
  clearTranslationMemory,
} from '../translationMemory';
import { TranslationItem } from '@/types';

describe('translationMemory.ts', () => {
  beforeEach(() => {
    clearTranslationMemory();
  });

  it('calculates string similarity accurately', () => {
    expect(calculateSimilarity('Save', 'Save')).toBe(1.0);
    expect(calculateSimilarity('Save', 'save')).toBe(1.0);
    expect(calculateSimilarity('Save Changes', 'Save Change')).toBeGreaterThan(0.85);
    expect(calculateSimilarity('Cancel', 'Confirm')).toBeLessThan(0.4);
  });

  it('upserts and retrieves exact memory matches', () => {
    upsertMemoryEntry('Save', 'en', 'my', 'သိမ်းဆည်းပါ');
    upsertMemoryEntry('Save', 'en', 'ja', '保存');

    const exactMy = findExactMemoryMatch('Save', 'en', 'my');
    expect(exactMy).toBe('သိမ်းဆည်းပါ');

    const exactJa = findExactMemoryMatch('save', 'en', 'ja');
    expect(exactJa).toBe('保存');

    const nonExistent = findExactMemoryMatch('Unknown word', 'en', 'my');
    expect(nonExistent).toBeNull();
  });

  it('finds fuzzy memory matches above threshold', () => {
    upsertMemoryEntry('Save your changes', 'en', 'my', 'အပြောင်းအလဲများကို သိမ်းပါ');
    upsertMemoryEntry('Delete this file', 'en', 'my', 'ဖိုင်ကို ဖျက်ပါ');

    const matches = findFuzzyMemoryMatches('Save your change', 'en', 'my', 0.8);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].translation).toBe('အပြောင်းအလဲများကို သိမ်းပါ');
    expect(matches[0].similarity).toBeGreaterThan(0.85);
  });

  it('seeds memory from current project items', () => {
    const items: TranslationItem[] = [
      { key: 'btn.ok', en: 'OK', my: 'ကောင်းပြီ' },
      { key: 'btn.cancel', en: 'Cancel', my: 'ပယ်ဖျက်မည်' },
    ];

    const added = seedMemoryFromItems(items, 'en');
    expect(added).toBe(2);

    const match = findExactMemoryMatch('OK', 'en', 'my');
    expect(match).toBe('ကောင်းပြီ');
  });
});
