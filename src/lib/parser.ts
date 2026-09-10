import * as XLSX from 'xlsx';
import { TranslationItem } from '@/types';

/**
 * Flattens a nested JavaScript object into dot notation.
 * e.g. { auth: { signin: { title: "Hello" } } } => { "auth.signin.title": "Hello" }
 */
export function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else if (Array.isArray(value)) {
      result[newKey] = JSON.stringify(value);
    } else if (value !== undefined && value !== null) {
      result[newKey] = String(value);
    } else {
      result[newKey] = '';
    }
  }

  return result;
}

/**
 * Unflattens a dot-notation object back into nested structure.
 * e.g. { "auth.signin.title": "Hello" } => { auth: { signin: { title: "Hello" } } }
 */
export function unflattenObject(flatObj: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [flatKey, value] of Object.entries(flatObj)) {
    const keys = flatKey.split('.');
    let current = result;

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (i === keys.length - 1) {
        current[k] = value;
      } else {
        if (!current[k] || typeof current[k] !== 'object' || Array.isArray(current[k])) {
          current[k] = {};
        }
        current = current[k];
      }
    }
  }

  return result;
}

/**
 * Infer language code from filename (e.g., "my.json" -> "my", "en_US.json" -> "en", "strings-burmese.json" -> "my")
 */
export function inferLanguageFromFilename(filename: string): string {
  const baseName = filename.replace(/\.[^/.]+$/, '').toLowerCase();
  
  // Specific known language aliases
  if (baseName.includes('burmese') || baseName === 'my' || baseName.endsWith('_my') || baseName.endsWith('-my')) return 'my';
  if (baseName.includes('english') || baseName === 'en' || baseName.endsWith('_en') || baseName.endsWith('-en')) return 'en';
  if (baseName.includes('thai') || baseName === 'th' || baseName.endsWith('_th') || baseName.endsWith('-th')) return 'th';
  if (baseName.includes('japan') || baseName === 'ja' || baseName.endsWith('_ja') || baseName.endsWith('-ja')) return 'ja';
  if (baseName.includes('chinese') || baseName === 'zh' || baseName.endsWith('_zh') || baseName.endsWith('-zh')) return 'zh';

  // Common language code patterns: e.g. "en", "my", "zh-CN", "pt-BR"
  const match = baseName.match(/(?:^|[-_])([a-z]{2}(?:[-_][a-z]{2})?)$/i);
  if (match) {
    return match[1].toLowerCase().replace('_', '-');
  }

  return baseName;
}

/**
 * Parses a JSON string which might be:
 * 1. Single language flat or nested { "key": "value" }
 * 2. Multi-language root object { "en": { ... }, "my": { ... } }
 */
export function parseJsonFile(
  content: string,
  filename: string
): { [langCode: string]: Record<string, string> } {
  const parsed = JSON.parse(content);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid JSON structure: Root must be an object.');
  }

  const keys = Object.keys(parsed);

  // Check if it's a .jsonlink project export file
  if (parsed.format === 'jsonlink' && Array.isArray(parsed.items)) {
    const result: { [langCode: string]: Record<string, string> } = {};
    const langs: string[] = Array.isArray(parsed.languages) ? parsed.languages : ['en', 'my'];
    for (const lang of langs) {
      result[lang] = {};
      for (const item of parsed.items) {
        if (item && item.key) {
          result[lang][item.key] = item[lang] || '';
        }
      }
    }
    return result;
  }

  // Check if root keys are language codes like "en", "my", "fr", "es", "zh", "ja", "th"
  const potentialLangCodes = keys.filter(k => /^[a-z]{2}(-[A-Z]{2})?$/i.test(k));
  const isMultiLangRoot = potentialLangCodes.length >= 2 && potentialLangCodes.length === keys.length;

  const result: { [langCode: string]: Record<string, string> } = {};

  if (isMultiLangRoot) {
    // Multi language root
    for (const lang of keys) {
      if (typeof parsed[lang] === 'object' && parsed[lang] !== null) {
        result[lang.toLowerCase()] = flattenObject(parsed[lang]);
      }
    }
  } else {
    // Single language file
    const inferredLang = inferLanguageFromFilename(filename);
    result[inferredLang] = flattenObject(parsed);
  }

  return result;
}

/**
 * Merges new language records into the existing translation item list.
 */
export function mergeTranslations(
  existingItems: TranslationItem[],
  existingLangs: string[],
  newLangData: { [langCode: string]: Record<string, string> }
): { items: TranslationItem[]; languages: string[] } {
  const langSet = new Set<string>(existingLangs);
  const itemMap = new Map<string, TranslationItem>();

  // Index existing items by key
  for (const item of existingItems) {
    itemMap.set(item.key, { ...item });
  }

  // Merge new languages
  for (const [lang, dict] of Object.entries(newLangData)) {
    langSet.add(lang);

    for (const [key, val] of Object.entries(dict)) {
      if (!itemMap.has(key)) {
        const newItem: TranslationItem = { key };
        // fill other languages with empty string
        for (const existingLang of langSet) {
          newItem[existingLang] = '';
        }
        newItem[lang] = val;
        itemMap.set(key, newItem);
      } else {
        const item = itemMap.get(key)!;
        item[lang] = val;
      }
    }
  }

  const allLangs = Array.from(langSet);
  // Ensure every item has all language fields initialized
  const mergedItems: TranslationItem[] = [];
  for (const item of itemMap.values()) {
    for (const lang of allLangs) {
      if (item[lang] === undefined) {
        item[lang] = '';
      }
    }
    mergedItems.push(item);
  }

  return {
    items: mergedItems,
    languages: allLangs,
  };
}

/**
 * Parses Excel (.xlsx, .xls) or CSV files into TranslationItem[]
 */
export function parseSpreadsheet(data: ArrayBuffer): { items: TranslationItem[]; languages: string[] } {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Spreadsheet has no sheets.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { header: 1 });

  if (jsonData.length < 2) {
    throw new Error('Spreadsheet must contain at least a header row and one data row.');
  }

  const headerRow = (jsonData[0] as string[]).map(h => String(h || '').trim());
  if (headerRow.length === 0) {
    throw new Error('Invalid or empty header row in spreadsheet.');
  }

  // Identify Key column index
  let keyColIndex = headerRow.findIndex(h => /^(key|translation_key|id|name)$/i.test(h));
  if (keyColIndex === -1) {
    // Default to the first column if no column named "key" is found
    keyColIndex = 0;
  }

  const languages: string[] = [];
  const langIndices: { lang: string; colIdx: number }[] = [];

  for (let c = 0; c < headerRow.length; c++) {
    if (c === keyColIndex) continue;
    const colName = headerRow[c];
    if (colName) {
      const cleanLang = colName.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      languages.push(cleanLang);
      langIndices.push({ lang: cleanLang, colIdx: c });
    }
  }

  if (languages.length === 0) {
    languages.push('en');
    langIndices.push({ lang: 'en', colIdx: 1 });
  }

  const items: TranslationItem[] = [];

  for (let r = 1; r < jsonData.length; r++) {
    const row = jsonData[r] as any[];
    if (!row || row.length === 0) continue;

    const key = String(row[keyColIndex] ?? '').trim();
    if (!key) continue; // Skip empty keys

    const item: TranslationItem = { key };
    for (const { lang, colIdx } of langIndices) {
      item[lang] = String(row[colIdx] ?? '').trim();
    }

    items.push(item);
  }

  return { items, languages };
}
