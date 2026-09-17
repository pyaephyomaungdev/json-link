import fs from 'node:fs';
import path from 'node:path';
import { TranslationRecord } from './types.js';

/**
 * Flattens a nested object into dotted keys: { a: { b: "c" } } -> { "a.b": "c" }
 */
export function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = value !== undefined && value !== null ? String(value) : '';
    }
  }

  return result;
}

/**
 * Unflattens dotted keys into a nested object: { "a.b": "c" } -> { a: { b: "c" } }
 */
export function unflattenObject(flat: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [fullKey, value] of Object.entries(flat)) {
    const parts = fullKey.split('.');

    // Guard against Prototype Pollution (CWE-1321)
    if (parts.some(p => p === '__proto__' || p === 'constructor' || p === 'prototype')) {
      continue;
    }

    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  return result;
}

/**
 * Reads all translation JSON files in the specified directory.
 */
export function readLocalesFromDisk(resolvedDir: string, _nested = false): { languages: string[]; records: TranslationRecord[] } {
  if (!fs.existsSync(resolvedDir)) {
    return { languages: [], records: [] };
  }

  const files = fs.readdirSync(resolvedDir);
  const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('.'));
  const languages = jsonFiles.map(f => path.basename(f, '.json'));

  const keyMap = new Map<string, TranslationRecord>();

  for (const lang of languages) {
    const filePath = path.join(resolvedDir, `${lang}.json`);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      const flat = flattenObject(parsed);

      for (const [key, val] of Object.entries(flat)) {
        if (!keyMap.has(key)) {
          keyMap.set(key, { key });
        }
        keyMap.get(key)![lang] = val;
      }
    } catch {
      // Ignore unparseable files
    }
  }

  const records: TranslationRecord[] = Array.from(keyMap.values());
  return { languages, records };
}

/**
 * Generates translations.d.ts type definitions from existing keys and languages.
 */
export function generateTranslationsDts(keys: string[], languages: string[]): string {
  const langUnion = languages.length > 0
    ? languages.map(l => JSON.stringify(l)).join(' | ')
    : 'string';

  const keyUnion = keys.length > 0
    ? keys.map(k => `  | ${JSON.stringify(k)}`).join('\n')
    : '  | string';

  return `export type SupportedLanguage = ${langUnion};

export type TranslationKey =
${keyUnion};

export interface TranslationDictionary {
  [key: string]: string;
}
`;
}

/**
 * Generates reactive i18n.ts client loader for the given languages.
 */
export function generateI18nTs(languages: string[]): string {
  const sanitizeIdentifier = (lang: string) => {
    const cleaned = lang.replace(/[^a-zA-Z0-9_$]/g, '_');
    return /^[0-9]/.test(cleaned) ? `_${cleaned}` : cleaned;
  };

  const imports = languages
    .map(l => `import ${sanitizeIdentifier(l)} from './${l}.json';`)
    .join('\n');

  const langArray = languages.map(l => `'${l}'`).join(', ');

  const resourceEntries = languages
    .map(l => `  '${l}': ${sanitizeIdentifier(l)},`)
    .join('\n');

  const defaultLang = languages.includes('en') ? 'en' : (languages[0] || 'en');

  return `import { useSyncExternalStore } from 'react';
import type { SupportedLanguage, TranslationKey } from './translations';
${imports}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [${langArray}];

export const resources: Record<SupportedLanguage, Record<string, any>> = {
${resourceEntries}
};

let currentLanguage: SupportedLanguage = '${defaultLang}';
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function setLanguage(lang: SupportedLanguage): void {
  if (resources[lang]) {
    currentLanguage = lang;
    notify();
  }
}

export function getLanguage(): SupportedLanguage {
  return currentLanguage;
}

export function updateTranslation(key: string, value: string, lang?: SupportedLanguage): void {
  const targetLang = lang || currentLanguage;
  if (!resources[targetLang]) return;
  resources[targetLang][key] = value;
  notify();
}

function resolveValue(obj: Record<string, any>, key: string): string | undefined {
  if (!obj) return undefined;
  if (obj[key] !== undefined) return String(obj[key]);
  const parts = key.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export function t(
  key: TranslationKey | (string & {}),
  params?: Record<string, string | number>,
  lang?: SupportedLanguage
): string {
  const activeLang = lang || currentLanguage;
  const dict = resources[activeLang] || resources['${defaultLang}'] || {};
  let text = resolveValue(dict, key);

  if (text === undefined) {
    text = resolveValue(resources['${defaultLang}'] || {}, key) ?? key;
  }

  if (params && typeof text === 'string') {
    return text.replace(/\\{([a-zA-Z0-9_]+)\\}/g, (_, varName) => {
      return params[varName] !== undefined ? String(params[varName]) : \`{\${varName}}\`;
    });
  }

  return text;
}

export function useTranslation() {
  const lang = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => currentLanguage
  );

  return {
    t,
    language: lang,
    setLanguage,
    languages: SUPPORTED_LANGUAGES,
  };
}

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) notify();
  });
}
`;
}

/**
 * Writes translation records back to each [lang].json file on disk,
 * cleans up removed language files, and auto-syncs translations.d.ts and i18n.ts.
 */
export function writeLocalesToDisk(
  resolvedDir: string,
  records: TranslationRecord[],
  languages: string[],
  nested = false,
  indent = 2
): { updatedFiles: string[] } {
  if (!fs.existsSync(resolvedDir)) {
    fs.mkdirSync(resolvedDir, { recursive: true });
  }

  const updatedFiles: string[] = [];

  // 1. Clean up deleted language json files on disk
  if (fs.existsSync(resolvedDir)) {
    const existingFiles = fs.readdirSync(resolvedDir);
    for (const file of existingFiles) {
      if (file.endsWith('.json') && !file.startsWith('.')) {
        const langName = path.basename(file, '.json');
        if (!languages.includes(langName)) {
          const removedPath = path.join(resolvedDir, file);
          try {
            fs.unlinkSync(removedPath);
          } catch { }
        }
      }
    }
  }

  // 2. Write each language JSON
  for (const lang of languages) {
    const flatDict: Record<string, string> = {};
    for (const item of records) {
      if (item.key) {
        flatDict[item.key] = item[lang] ?? '';
      }
    }

    const outputData = nested ? unflattenObject(flatDict) : flatDict;
    const filePath = path.join(resolvedDir, `${lang}.json`);
    fs.writeFileSync(filePath, JSON.stringify(outputData, null, indent) + '\n', 'utf-8');
    updatedFiles.push(filePath);
  }

  // 3. Extract sorted unique non-empty keys
  const keys = Array.from(
    new Set(records.map(r => r.key?.trim()).filter((k): k is string => Boolean(k)))
  );

  // 4. Auto-sync translations.d.ts (always generate or update)
  const dtsPath = path.join(resolvedDir, 'translations.d.ts');
  const dtsContent = generateTranslationsDts(keys, languages);
  fs.writeFileSync(dtsPath, dtsContent, 'utf-8');
  updatedFiles.push(dtsPath);

  // 5. Auto-sync i18n.ts if it exists in the directory
  const i18nPath = path.join(resolvedDir, 'i18n.ts');
  if (fs.existsSync(i18nPath)) {
    const i18nContent = generateI18nTs(languages);
    fs.writeFileSync(i18nPath, i18nContent, 'utf-8');
    updatedFiles.push(i18nPath);
  }

  return { updatedFiles };
}
