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
const DB_NAME = 'jsonlink_storage';
const STORE_NAME = 'translation_memory';
const DB_VERSION = 2;

// In-memory synchronous cache for O(1) reads and zero-latency UI interactions
let inMemoryTM: TranslationMemoryEntry[] | null = null;
let isHydrating = false;

/** Open or create the IndexedDB database */
function openTmDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('recent_projects')) {
          db.createObjectStore('recent_projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('project_draft')) {
          db.createObjectStore('project_draft', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('IndexedDB open error, falling back to in-memory/localStorage');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/** Load all entries from IndexedDB */
export async function loadFromIndexedDb(): Promise<TranslationMemoryEntry[] | null> {
  const db = await openTmDb();
  if (!db) return null;

  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        resolve(Array.isArray(req.result) ? (req.result as TranslationMemoryEntry[]) : []);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Persist all entries to IndexedDB asynchronously */
export async function persistToIndexedDb(entries: TranslationMemoryEntry[]): Promise<boolean> {
  const db = await openTmDb();
  if (!db) return false;

  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();

      for (const entry of entries) {
        store.put(entry);
      }

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/** Clear all entries from IndexedDB */
export async function clearIndexedDb(): Promise<boolean> {
  const db = await openTmDb();
  if (!db) return false;

  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/** Calculate Levenshtein similarity ratio between 0 and 1 */
export function calculateSimilarity(s1: string, s2: string): number {
  const str1 = s1.trim().toLowerCase();
  const str2 = s2.trim().toLowerCase();
  if (str1 === str2) return 1.0;
  if (!str1.length || !str2.length) return 0.0;

  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0));

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

/** Hydrate memory from IndexedDB asynchronously with localStorage migration fallback */
export async function hydrateTranslationMemoryAsync(): Promise<TranslationMemoryEntry[]> {
  if (inMemoryTM && inMemoryTM.length > 0) return inMemoryTM;

  try {
    const idbEntries = await loadFromIndexedDb();
    if (idbEntries && idbEntries.length > 0) {
      inMemoryTM = idbEntries;
      return inMemoryTM;
    }

    // If IDB is empty, check localStorage and migrate
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(TM_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryTM = parsed;
          persistToIndexedDb(parsed).catch(() => {});
          return inMemoryTM;
        }
      }
    }
  } catch (err) {
    console.warn('Hydration error:', err);
  }

  inMemoryTM = inMemoryTM || [];
  return inMemoryTM;
}

/** Load translation memory from in-memory cache or browser storage */
export function loadTranslationMemory(): TranslationMemoryEntry[] {
  if (inMemoryTM !== null) {
    return inMemoryTM;
  }

  if (typeof window === 'undefined') return [];

  // Synchronous read from localStorage for immediate availability
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(TM_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryTM = parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load from localStorage:', err);
  }

  if (inMemoryTM === null) {
    inMemoryTM = [];
  }

  // Trigger non-blocking async hydration from IndexedDB if not already running
  if (!isHydrating && typeof indexedDB !== 'undefined') {
    isHydrating = true;
    hydrateTranslationMemoryAsync().finally(() => {
      isHydrating = false;
    });
  }

  return inMemoryTM;
}

/** Save translation memory to cache, IndexedDB, and localStorage */
export function saveTranslationMemory(entries: TranslationMemoryEntry[]): void {
  inMemoryTM = entries;

  if (typeof window === 'undefined') return;

  // 1. Asynchronously persist to IndexedDB (no 5MB storage quota restriction)
  persistToIndexedDb(entries).catch(() => {});

  // 2. Synchronous mirror to localStorage if within safe quota limits
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TM_STORAGE_KEY, JSON.stringify(entries));
    }
  } catch {
    // If quota exceeded or disabled in private mode, safely ignore since IndexedDB handles persistence
  }
}

function generateTmId(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    return `tm_${Date.now()}_${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}`;
  }
  return `tm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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

  const memory = [...loadTranslationMemory()];
  const existing = memory.find(
    e => e.sourceLang === sourceLang && e.sourceText.toLowerCase() === cleanSource.toLowerCase()
  );

  const now = new Date().toISOString();

  if (existing) {
    existing.translations = { ...existing.translations, [targetLang]: cleanTarget };
    existing.usageCount = (existing.usageCount || 1) + 1;
    existing.updatedAt = now;
  } else {
    memory.push({
      id: generateTmId(),
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
  const memory = [...loadTranslationMemory()];
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
        id: generateTmId(),
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

/** Clear all translation memory across memory, IndexedDB, and localStorage */
export function clearTranslationMemory(): void {
  inMemoryTM = [];
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(TM_STORAGE_KEY);
    } catch {}
  }
  clearIndexedDb().catch(() => {});
}
