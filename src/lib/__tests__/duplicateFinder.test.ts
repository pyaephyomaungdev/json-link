import { describe, it, expect } from 'vitest';
import { findDuplicateValues } from '../duplicateFinder';
import { TranslationItem } from '@/types';

describe('duplicateFinder.ts', () => {
  const items: TranslationItem[] = [
    { key: 'btn.save', en: 'Save', my: 'သိမ်းဆည်းပါ' },
    { key: 'btn.confirm_save', en: 'Save', my: 'သိမ်းဆည်းပါ' },
    { key: 'btn.cancel', en: 'Cancel', my: 'ပယ်ဖျက်ပါ' },
    { key: 'dialog.abort', en: 'Cancel', my: 'မလုပ်တော့ပါ' },
    { key: 'page.title', en: 'Dashboard', my: 'ပင်မစာမျက်နှာ' },
  ];

  it('detects duplicate values for English language', () => {
    const dups = findDuplicateValues(items, 'en');
    expect(dups.length).toBe(2);

    const saveGroup = dups.find(d => d.value === 'Save');
    expect(saveGroup).toBeDefined();
    expect(saveGroup?.count).toBe(2);
    expect(saveGroup?.keys).toContain('btn.save');
    expect(saveGroup?.keys).toContain('btn.confirm_save');

    const cancelGroup = dups.find(d => d.value === 'Cancel');
    expect(cancelGroup).toBeDefined();
    expect(cancelGroup?.count).toBe(2);
  });

  it('detects duplicate values for Myanmar language', () => {
    const dups = findDuplicateValues(items, 'my');
    expect(dups.length).toBe(1);
    expect(dups[0].value).toBe('သိမ်းဆည်းပါ');
    expect(dups[0].count).toBe(2);
  });

  it('returns empty array when no duplicates exist', () => {
    const uniqueItems: TranslationItem[] = [
      { key: 'k1', en: 'A' },
      { key: 'k2', en: 'B' },
    ];
    expect(findDuplicateValues(uniqueItems, 'en')).toEqual([]);
  });
});
