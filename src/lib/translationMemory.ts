import { TranslationItem } from '@/types';

export interface TranslationMemoryEntry {
  id: string;
  sourceText: string;
  sourceLang: string;
  translations: Record<string, string>; // targetLang -> translated text
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const TM_STORAGE_KEY = 'jsonlink_translation_memory';

/** Calculate Levenshtein similarity ratio between 0 and 1 */
export function calculateSimilarity(s1: string, s2: string): number {
  const str1 = s1.trim().toLowerCase();
  const str2 = s2.trim().toLowerCase();
  if (str1 === str2) return 1.0;
  if (!str1.length || !str2.length) return 0.0;

  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = dp[m][n];
  const maxLen = Math.max(m, n);
  return Math.max(0, 1 - distance / maxLen);
}

/** Load translation memory from browser storage */
export function loadTranslationMemory(): TranslationMemoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load translation memory:', err);
    return [];
  }
}

/** Save translation memory to browser storage */
export function saveTranslationMemory(entries: TranslationMemoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TM_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to save translation memory:', err);
  }
}

/** Record or update a single translation entry in memory */
export function upsertMemoryEntry(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  targetText: string
): void {
  const cleanSource = sourceText.trim();
  const cleanTarget = targetText.trim();
  if (!cleanSource || !cleanTarget || sourceLang === targetLang) return;

  const memory = loadTranslationMemory();
  const existing = memory.find(
    e => e.sourceLang === sourceLang && e.sourceText.toLowerCase() === cleanSource.toLowerCase()
  );

  const now = new Date().toISOString();

  if (existing) {
    existing.translations[targetLang] = cleanTarget;
    existing.usageCount = (existing.usageCount || 1) + 1;
    existing.updatedAt = now;
  } else {
    memory.push({
      id: `tm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sourceText: cleanSource,
      sourceLang,
      translations: { [targetLang]: cleanTarget },
      usageCount: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  saveTranslationMemory(memory);
}

/** Bulk seed memory from current project items */
export function seedMemoryFromItems(
  items: TranslationItem[],
  sourceLang = 'en',
  targetLangs?: string[]
): number {
  const memory = loadTranslationMemory();
  const memoryMap = new Map<string, TranslationMemoryEntry>();

  for (const entry of memory) {
    if (entry.sourceLang === sourceLang) {
      memoryMap.set(entry.sourceText.toLowerCase(), entry);
    }
  }

  let addedCount = 0;
  const now = new Date().toISOString();

  for (const item of items) {
    const src = (item[sourceLang] || '').trim();
    if (!src) continue;

    const key = src.toLowerCase();
    let entry = memoryMap.get(key);

    if (!entry) {
      entry = {
        id: `tm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sourceText: src,
        sourceLang,
        translations: {},
        usageCount: 1,
        createdAt: now,
        updatedAt: now,
      };
      memory.push(entry);
      memoryMap.set(key, entry);
      addedCount++;
    }

    // Capture translations for each language
    for (const [prop, val] of Object.entries(item)) {
      if (
        prop !== 'key' &&
        prop !== 'description' &&
        prop !== 'status' &&
        prop !== sourceLang &&
        typeof val === 'string' &&
        val.trim() !== ''
      ) {
        if (!targetLangs || targetLangs.includes(prop)) {
          entry.translations[prop] = val.trim();
        }
      }
    }
  }

  saveTranslationMemory(memory);
  return addedCount;
}

/** Find exact match from translation memory */
export function findExactMemoryMatch(
  sourceText: string,
  sourceLang: string,
  targetLang: string
): string | null {
  const clean = sourceText.trim().toLowerCase();
  if (!clean) return null;

  const memory = loadTranslationMemory();
  const found = memory.find(
    e => e.sourceLang === sourceLang && e.sourceText.toLowerCase() === clean
  );

  return found?.translations[targetLang] || null;
}

export interface FuzzyMatchResult {
  sourceMatch: string;
  translation: string;
  similarity: number; // 0.0 to 1.0
  usageCount: number;
}

/** Find fuzzy (approximate) matches above threshold */
export function findFuzzyMemoryMatches(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  minThreshold = 0.65,
  limit = 5
): FuzzyMatchResult[] {
  const clean = sourceText.trim();
  if (!clean) return [];

  const memory = loadTranslationMemory();
  const results: FuzzyMatchResult[] = [];

  for (const entry of memory) {
    if (entry.sourceLang !== sourceLang) continue;
    const trans = entry.translations[targetLang];
    if (!trans) continue;

    const sim = calculateSimilarity(clean, entry.sourceText);
    if (sim >= minThreshold) {
      results.push({
        sourceMatch: entry.sourceText,
        translation: trans,
        similarity: sim,
        usageCount: entry.usageCount || 1,
      });
    }
  }

  // Sort by highest similarity first, then usage count
  return results
    .sort((a, b) => b.similarity - a.similarity || b.usageCount - a.usageCount)
    .slice(0, limit);
}

/** Clear all translation memory */
export function clearTranslationMemory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TM_STORAGE_KEY);
  }
}
