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
export function readLocalesFromDisk(resolvedDir: string, nested = false): { languages: string[]; records: TranslationRecord[] } {
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
 * Writes translation records back to each [lang].json file on disk.
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

  return { updatedFiles };
}
