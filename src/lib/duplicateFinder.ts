import { TranslationItem } from '@/types';

export interface DuplicateGroup {
  value: string;
  lang: string;
  keys: string[];
  count: number;
}

/**
 * Scan translation items for duplicate values in a given language.
 */
export function findDuplicateValues(
  items: TranslationItem[],
  lang = 'en',
  caseSensitive = false
): DuplicateGroup[] {
  const map = new Map<string, { displayValue: string; keys: string[] }>();

  for (const item of items) {
    const rawVal = item[lang];
    if (typeof rawVal !== 'string') continue;
    const clean = rawVal.trim();
    if (!clean) continue;

    const keyLookup = caseSensitive ? clean : clean.toLowerCase();
    const existing = map.get(keyLookup);

    if (existing) {
      existing.keys.push(item.key);
    } else {
      map.set(keyLookup, {
        displayValue: clean,
        keys: [item.key],
      });
    }
  }

  const groups: DuplicateGroup[] = [];
  for (const { displayValue, keys } of map.values()) {
    if (keys.length > 1) {
      groups.push({
        value: displayValue,
        lang,
        keys,
        count: keys.length,
      });
    }
  }

  // Sort by highest count of duplicates first
  return groups.sort((a, b) => b.count - a.count);
}
