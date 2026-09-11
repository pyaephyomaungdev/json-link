import { TranslationItem } from '@/types';

export interface FindReplaceOptions {
  query: string;
  replacement: string;
  /** 'all' | 'key' | 'description' | specific language code */
  scope: string;
  matchCase: boolean;
  wholeWord: boolean;
  isRegex: boolean;
  languages: string[];
}

export interface MatchOccurrence {
  rowIndex: number;
  key: string;
  field: string;
  matchCount: number;
}

/**
 * Builds a safe RegExp based on user options
 */
export function buildSearchRegex(options: FindReplaceOptions): RegExp | null {
  const { query, matchCase, wholeWord, isRegex } = options;
  if (!query) return null;

  try {
    let pattern = isRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
    const flags = matchCase ? 'g' : 'gi';
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

/**
 * Determines which fields of an item should be inspected based on scope
 */
export function getTargetFields(scope: string, languages: string[]): string[] {
  if (scope === 'key') return ['key'];
  if (scope === 'description') return ['description'];
  if (scope === 'all') {
    return ['key', ...languages, 'description'];
  }
  // Specific language
  return [scope];
}

/**
 * Scan items to count how many matches exist across rows and fields
 */
export function countMatches(
  items: TranslationItem[],
  options: FindReplaceOptions
): { totalMatches: number; affectedRows: number; occurrences: MatchOccurrence[] } {
  const regex = buildSearchRegex(options);
  if (!regex) {
    return { totalMatches: 0, affectedRows: 0, occurrences: [] };
  }

  const fields = getTargetFields(options.scope, options.languages);
  let totalMatches = 0;
  const affectedRowSet = new Set<number>();
  const occurrences: MatchOccurrence[] = [];

  for (let r = 0; r < items.length; r++) {
    const item = items[r];
    for (const field of fields) {
      const val = item[field];
      if (typeof val === 'string' && val.length > 0) {
        // Reset regex state for global flag
        regex.lastIndex = 0;
        const matches = val.match(regex);
        if (matches && matches.length > 0) {
          totalMatches += matches.length;
          affectedRowSet.add(r);
          occurrences.push({
            rowIndex: r,
            key: item.key,
            field,
            matchCount: matches.length,
          });
        }
      }
    }
  }

  return {
    totalMatches,
    affectedRows: affectedRowSet.size,
    occurrences,
  };
}

/**
 * Execute replace across all matching fields and return new updated items
 */
export function executeFindReplace(
  items: TranslationItem[],
  options: FindReplaceOptions
): { updatedItems: TranslationItem[]; count: number } {
  const regex = buildSearchRegex(options);
  if (!regex) {
    return { updatedItems: items, count: 0 };
  }

  const fields = getTargetFields(options.scope, options.languages);
  let count = 0;

  const updatedItems = items.map((item) => {
    let itemChanged = false;
    const newItem: TranslationItem = { ...item };

    for (const field of fields) {
      const val = newItem[field];
      if (typeof val === 'string' && val.length > 0) {
        regex.lastIndex = 0;
        if (regex.test(val)) {
          regex.lastIndex = 0;
          const matchInstances = val.match(regex);
          if (matchInstances) {
            count += matchInstances.length;
          }
          regex.lastIndex = 0;
          const replacedVal = val.replace(regex, options.replacement);
          if (field === 'key') {
            const cleanKey = replacedVal.trim();
            if (cleanKey) {
              newItem.key = cleanKey;
              itemChanged = true;
            }
          } else {
            newItem[field] = replacedVal;
            itemChanged = true;
          }
        }
      }
    }

    return itemChanged ? newItem : item;
  });

  return { updatedItems, count };
}
