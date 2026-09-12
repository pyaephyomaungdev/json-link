import { TranslationItem } from '@/types';
import {
  parseJsonFile,
  parseArbFile,
  parseYamlFile,
  parseAndroidXml,
  parseIosStrings,
  mergeTranslations,
} from '@/lib/parser';
import {
  generateLanguageJsonData,
  generateArbData,
  objectToYaml,
  generateAndroidXml,
  generateIosStrings,
} from '@/lib/exporter';
import { parseProjectFile } from '@/lib/project';

const DB_NAME = 'json_link_fs_db';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'active_directory';

/** Check if File System Access API is supported in the current browser */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';
}

/** Open an IndexedDB connection */
function openFsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Store a directory handle in IndexedDB across reloads */
export async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openFsDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(handle, HANDLE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to store directory handle in IndexedDB:', err);
  }
}

/** Retrieve previously stored directory handle from IndexedDB */
export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openFsDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/** Clear stored directory handle */
export async function clearStoredDirectoryHandle(): Promise<void> {
  try {
    const db = await openFsDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(HANDLE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to clear directory handle:', err);
  }
}

/** Query and request permission to access the directory handle */
export async function verifyDirectoryPermission(
  handle: FileSystemDirectoryHandle,
  readWrite = true
): Promise<boolean> {
  const options = {
    mode: readWrite ? 'readwrite' : 'read',
  };
  try {
    const h = handle as any;
    // Check if permission was already granted
    if (typeof h.queryPermission === 'function' && (await h.queryPermission(options)) === 'granted') {
      return true;
    }
    // Request permission from the user gesture
    if (typeof h.requestPermission === 'function' && (await h.requestPermission(options)) === 'granted') {
      return true;
    }
  } catch (e) {
    console.warn('Error querying/requesting permission on directory handle:', e);
  }
  return false;
}

export interface ReadFolderResult {
  items: TranslationItem[];
  languages: string[];
  projectName: string;
  fileCount: number;
  filenames: string[];
  primaryFormat: 'json' | 'arb' | 'yaml' | 'xml' | 'strings' | 'jsonlink';
}

/**
 * Scan and read all supported translation files in the directory handle.
 */
export async function readTranslationsFromDirectory(
  dirHandle: FileSystemDirectoryHandle
): Promise<ReadFolderResult> {
  const filenames: string[] = [];
  const entries: { name: string; file: File }[] = [];

  // Iterate files in the directory
  for await (const [name, handle] of (dirHandle as unknown as AsyncIterable<[string, FileSystemHandle]>)) {
    if (handle.kind === 'file') {
      filenames.push(name);
      try {
        const file = await (handle as FileSystemFileHandle).getFile();
        entries.push({ name, file });
      } catch (err) {
        console.warn(`Could not read file ${name}:`, err);
      }
    }
  }

  // 1. Check if a direct .jsonlink project backup exists
  const jsonlinkEntry = entries.find(e => e.name.endsWith('.jsonlink') || e.name === '.jsonlink.meta.json');
  if (jsonlinkEntry) {
    try {
      const text = await jsonlinkEntry.file.text();
      const project = parseProjectFile(text);
      return {
        items: project.items,
        languages: project.languages,
        projectName: project.name || dirHandle.name,
        fileCount: entries.length,
        filenames,
        primaryFormat: 'jsonlink',
      };
    } catch {
      // If parsing fails, proceed to individual locale file ingestion
    }
  }

  // 2. Ingest individual locale files (.json, .arb, .yaml, .yml, .xml, .strings)
  let mergedItems: TranslationItem[] = [];
  const detectedLanguages = new Set<string>();
  let primaryFormat: 'json' | 'arb' | 'yaml' | 'xml' | 'strings' = 'json';

  for (const { name, file } of entries) {
    const lower = name.toLowerCase();

    // Flutter ARB: app_en.arb, intl_my.arb, en.arb
    if (lower.endsWith('.arb')) {
      primaryFormat = 'arb';
      const text = await file.text();
      const parsed = parseArbFile(text, name);
      if (mergedItems.length === 0) {
        mergedItems = parsed.items;
      } else {
        const existingMap = new Map(mergedItems.map(it => [it.key, it]));
        for (const arbItem of parsed.items) {
          if (existingMap.has(arbItem.key)) {
            Object.assign(existingMap.get(arbItem.key)!, arbItem);
          } else {
            mergedItems.push({ ...arbItem });
            existingMap.set(arbItem.key, arbItem);
          }
        }
      }
      parsed.languages.forEach(l => detectedLanguages.add(l));
    }
    // JSON: en.json, my.json, translations_en.json
    else if (lower.endsWith('.json') && !lower.startsWith('.')) {
      const text = await file.text();
      const parsed = parseJsonFile(text, name);
      const res = mergeTranslations(mergedItems, Array.from(detectedLanguages), parsed);
      mergedItems = res.items;
      res.languages.forEach(l => detectedLanguages.add(l));
    }
    // YAML: en.yaml, en.yml
    else if (lower.endsWith('.yaml') || lower.endsWith('.yml')) {
      primaryFormat = 'yaml';
      const text = await file.text();
      const parsed = parseYamlFile(text, name);
      const res = mergeTranslations(mergedItems, Array.from(detectedLanguages), parsed);
      mergedItems = res.items;
      res.languages.forEach(l => detectedLanguages.add(l));
    }
    // Android XML: strings.xml
    else if (lower.endsWith('.xml')) {
      primaryFormat = 'xml';
      const text = await file.text();
      const parsed = parseAndroidXml(text, name);
      const res = mergeTranslations(mergedItems, Array.from(detectedLanguages), parsed);
      mergedItems = res.items;
      res.languages.forEach(l => detectedLanguages.add(l));
    }
    // iOS: Localizable.strings
    else if (lower.endsWith('.strings')) {
      primaryFormat = 'strings';
      const text = await file.text();
      const parsed = parseIosStrings(text, name);
      const res = mergeTranslations(mergedItems, Array.from(detectedLanguages), parsed);
      mergedItems = res.items;
      res.languages.forEach(l => detectedLanguages.add(l));
    }
  }

  const languages = Array.from(detectedLanguages);
  if (languages.length === 0) {
    languages.push('en');
  }

  return {
    items: mergedItems,
    languages,
    projectName: dirHandle.name || 'translations',
    fileCount: entries.length,
    filenames,
    primaryFormat,
  };
}

export interface WriteFolderOptions {
  primaryFormat?: 'json' | 'arb' | 'yaml' | 'xml' | 'strings';
  saveProjectMeta?: boolean;
}

/**
 * Write updated translation files directly back to the directory handle on disk.
 */
export async function writeTranslationsToDirectory(
  dirHandle: FileSystemDirectoryHandle,
  items: TranslationItem[],
  languages: string[],
  projectName: string,
  options: WriteFolderOptions = {}
): Promise<{ savedFiles: string[] }> {
  const savedFiles: string[] = [];
  const format = options.primaryFormat || 'json';

  for (const lang of languages) {
    let filename = `${lang}.json`;
    let content = '';

    if (format === 'arb') {
      filename = `app_${lang}.arb`;
      content = JSON.stringify(generateArbData(items, lang), null, 2);
    } else if (format === 'yaml') {
      filename = `${lang}.yaml`;
      content = objectToYaml(generateLanguageJsonData(items, lang, true));
    } else if (format === 'xml') {
      filename = `strings_${lang}.xml`;
      content = generateAndroidXml(items, lang);
    } else if (format === 'strings') {
      filename = `${lang}.strings`;
      content = generateIosStrings(items, lang);
    } else {
      // Default: Clean Pretty JSON
      filename = `${lang}.json`;
      content = JSON.stringify(generateLanguageJsonData(items, lang, true), null, 2);
    }

    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    savedFiles.push(filename);
  }

  // Also save complete metadata draft inside the folder for lossless recovery
  if (options.saveProjectMeta !== false) {
    try {
      const metaHandle = await dirHandle.getFileHandle('.jsonlink.meta.json', { create: true });
      const metaWritable = await metaHandle.createWritable();
      const projectPayload = JSON.stringify(
        {
          format: 'jsonlink',
          version: '1.0.0',
          name: projectName || 'translations',
          updatedAt: new Date().toISOString(),
          languages,
          items,
        },
        null,
        2
      );
      await metaWritable.write(projectPayload);
      await metaWritable.close();
      savedFiles.push('.jsonlink.meta.json');
    } catch (e) {
      console.warn('Could not write .jsonlink.meta.json:', e);
    }
  }

  return { savedFiles };
}
