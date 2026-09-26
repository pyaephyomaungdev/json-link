import { JsonLinkProject, TranslationItem } from '@/types';
import { downloadBlob } from './exporter';
import { bytesToBase64Url, base64UrlToBytes, deriveKeyFromPassword } from './shareUrl';

const LOCAL_STORAGE_KEY = 'jsonlink_current_project';

export interface EncryptedProjectContainer {
  format: 'jsonlink';
  version: '1.0.0';
  name: string;
  updatedAt: string;
  encrypted: true;
  cipher: 'aes-gcm-256';
  enc?: 'aes-256-gcm';
  kdf: 'pbkdf2-sha256-100k';
  salt: string;
  iv: string;
  ciphertext: string;
}

/**
 * Builds the string content of a project file (plain or encrypted)
 */
export async function buildProjectFileContent(
  projectName: string,
  items: TranslationItem[],
  languages: string[],
  password?: string
): Promise<string> {
  const cleanName = projectName.trim() || 'my-project';

  if (password && password.trim()) {
    const rawPayload = JSON.stringify({ languages, items });
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKeyFromPassword(password.trim(), salt, ['encrypt']);

    const encryptedBuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(rawPayload)
    );

    const container: EncryptedProjectContainer = {
      format: 'jsonlink',
      version: '1.0.0',
      name: cleanName,
      updatedAt: new Date().toISOString(),
      encrypted: true,
      cipher: 'aes-gcm-256',
      enc: 'aes-256-gcm',
      kdf: 'pbkdf2-sha256-100k',
      salt: bytesToBase64Url(salt),
      iv: bytesToBase64Url(iv),
      ciphertext: bytesToBase64Url(new Uint8Array(encryptedBuf)),
    };
    return JSON.stringify(container, null, 2);
  }

  const project: JsonLinkProject = {
    format: 'jsonlink',
    version: '1.0.0',
    name: cleanName,
    updatedAt: new Date().toISOString(),
    languages,
    items,
  };

  return JSON.stringify(project, null, 2);
}

/**
 * Downloads current translation project as a .jsonlink file (supports optional password)
 */
export async function exportProjectFile(
  projectName: string,
  items: TranslationItem[],
  languages: string[],
  password?: string
): Promise<void> {
  const cleanName = projectName.trim() || 'my-project';
  const jsonStr = await buildProjectFileContent(cleanName, items, languages, password);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const filename = cleanName.endsWith('.jsonlink') ? cleanName : `${cleanName}.jsonlink`;

  downloadBlob(blob, filename);
}

/**
 * Checks if a project file string is encrypted
 */
export function isProjectFileEncrypted(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return Boolean(
      parsed &&
      typeof parsed === 'object' &&
      parsed.format === 'jsonlink' &&
      parsed.encrypted === true &&
      parsed.ciphertext &&
      parsed.salt &&
      parsed.iv
    );
  } catch {
    return false;
  }
}

/**
 * Decrypts an encrypted .jsonlink file content with password
 */
export async function decryptProjectFile(content: string, password: string): Promise<JsonLinkProject> {
  const parsed = JSON.parse(content);
  if (!parsed || parsed.encrypted !== true || !parsed.salt || !parsed.iv || !parsed.ciphertext) {
    throw new Error('Not an encrypted .jsonlink project file.');
  }

  if (!password || !password.trim()) {
    throw new Error('PASSWORD_REQUIRED');
  }

  try {
    const salt = base64UrlToBytes(parsed.salt);
    const iv = base64UrlToBytes(parsed.iv);
    const ciphertext = base64UrlToBytes(parsed.ciphertext);
    const key = await deriveKeyFromPassword(password.trim(), salt, ['decrypt']);

    const decryptedBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const decodedText = new TextDecoder().decode(decryptedBuf);
    const inner = JSON.parse(decodedText);
    if (!inner || !Array.isArray(inner.items) || !Array.isArray(inner.languages)) {
      throw new Error('Invalid project structure inside encrypted payload.');
    }

    return {
      format: 'jsonlink',
      version: parsed.version || '1.0.0',
      name: parsed.name || 'imported-project',
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      languages: inner.languages,
      items: inner.items,
    };
  } catch (err: any) {
    if (err?.name === 'OperationError' || err?.message === 'OperationError') {
      throw new Error('INCORRECT_PASSWORD');
    }
    throw err;
  }
}

/**
 * Parses and validates a .jsonlink file content
 */
export function parseProjectFile(content: string): JsonLinkProject {
  const parsed = JSON.parse(content);

  if (isProjectFileEncrypted(content)) {
    throw new Error('PROJECT_ENCRYPTED');
  }

  // Check if it's a valid jsonlink structure
  if (
    parsed &&
    typeof parsed === 'object' &&
    Array.isArray(parsed.items) &&
    Array.isArray(parsed.languages)
  ) {
    return {
      format: 'jsonlink',
      version: parsed.version || '1.0.0',
      name: parsed.name || 'imported-project',
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      languages: parsed.languages,
      items: parsed.items,
    };
  }

  throw new Error('Invalid .jsonlink project file structure.');
}

export interface RecentProject {
  id: string;
  name: string;
  updatedAt: string;
  languages: string[];
  itemCount: number;
  projectData?: JsonLinkProject;
}

const DB_NAME = 'jsonlink_storage';
const DRAFT_STORE = 'project_draft';
const RECENT_STORE = 'recent_projects';
const DB_VERSION = 2;
const MAX_RECENT_PROJECTS = 25;

function openProjectDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('translation_memory')) {
          db.createObjectStore('translation_memory', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(RECENT_STORE)) {
          db.createObjectStore(RECENT_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(DRAFT_STORE)) {
          db.createObjectStore(DRAFT_STORE, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('IndexedDB open error in project.ts, falling back to localStorage');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Persists project draft to IndexedDB (asynchronous, supports large datasets > 5MB)
 */
export async function saveDraftToIndexedDb(project: JsonLinkProject): Promise<void> {
  const db = await openProjectDb();
  if (!db) return;

  return new Promise(resolve => {
    try {
      const tx = db.transaction(DRAFT_STORE, 'readwrite');
      const store = tx.objectStore(DRAFT_STORE);
      store.put({ id: 'current_draft', project, updatedAt: new Date().toISOString() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Loads project draft from IndexedDB
 */
export async function loadDraftFromIndexedDb(): Promise<JsonLinkProject | null> {
  const db = await openProjectDb();
  if (!db) return null;

  return new Promise(resolve => {
    try {
      const tx = db.transaction(DRAFT_STORE, 'readonly');
      const store = tx.objectStore(DRAFT_STORE);
      const req = store.get('current_draft');
      req.onsuccess = () => {
        if (req.result && req.result.project) {
          resolve(req.result.project);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Clears draft from IndexedDB
 */
export async function clearDraftFromIndexedDb(): Promise<void> {
  const db = await openProjectDb();
  if (!db) return;

  return new Promise(resolve => {
    try {
      const tx = db.transaction(DRAFT_STORE, 'readwrite');
      const store = tx.objectStore(DRAFT_STORE);
      store.delete('current_draft');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Saves project to browser localStorage as an auto-saved draft, with IndexedDB backing for large datasets
 */
export function saveLocalDraft(
  projectName: string,
  items: TranslationItem[],
  languages: string[]
): void {
  const project: JsonLinkProject = {
    format: 'jsonlink',
    version: '1.0.0',
    name: projectName || 'my-project',
    updatedAt: new Date().toISOString(),
    languages,
    items,
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('jsonlink_user_discarded');
    }
  } catch (e) {
    console.warn('Failed to save draft to localStorage (quota exceeded?), saving to IndexedDB only', e);
  }

  // Non-blocking IndexedDB persist to seamlessly handle large projects
  saveDraftToIndexedDb(project).catch(() => {});
}

/**
 * Loads auto-saved project from browser localStorage (synchronous)
 */
export function loadLocalDraft(): JsonLinkProject | null {
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('jsonlink_user_discarded') === 'true') {
      return null;
    }
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return parseProjectFile(saved);
    }
  } catch (e) {
    console.warn('Failed to load draft from localStorage', e);
  }
  return null;
}

/**
 * Loads auto-saved project with IndexedDB priority, falling back to localStorage
 */
export async function loadLocalDraftAsync(): Promise<JsonLinkProject | null> {
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('jsonlink_user_discarded') === 'true') {
    return null;
  }

  try {
    const idbDraft = await loadDraftFromIndexedDb();
    if (idbDraft && Array.isArray(idbDraft.items) && idbDraft.items.length > 0) {
      return idbDraft;
    }
  } catch (e) {
    console.warn('Failed to load draft from IndexedDB, falling back to localStorage', e);
  }

  return loadLocalDraft();
}

/**
 * Clears auto-saved project from browser localStorage, sessionStorage, and IndexedDB
 */
export function clearLocalDraft(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem('json-link-draft');
      localStorage.removeItem('jsonlink_draft');
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(LOCAL_STORAGE_KEY);
      sessionStorage.removeItem('json-link-draft');
      sessionStorage.removeItem('jsonlink_draft');
    }
  } catch (e) {
    console.warn('Failed to clear draft from storage', e);
  }
  clearDraftFromIndexedDb().catch(() => {});
}

/**
 * Records or updates a project in the recent projects store
 */
export async function recordRecentProject(project: JsonLinkProject): Promise<void> {
  const db = await openProjectDb();
  if (!db) {
    try {
      const recents: RecentProject[] = JSON.parse(localStorage.getItem('jsonlink_recent_projects') || '[]');
      const filtered = recents.filter(p => p.name !== project.name);
      filtered.unshift({
        id: `recent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: project.name,
        updatedAt: project.updatedAt || new Date().toISOString(),
        languages: project.languages,
        itemCount: project.items.length,
      });
      localStorage.setItem('jsonlink_recent_projects', JSON.stringify(filtered.slice(0, MAX_RECENT_PROJECTS)));
    } catch {}
    return;
  }

  return new Promise(resolve => {
    try {
      const tx = db.transaction(RECENT_STORE, 'readwrite');
      const store = tx.objectStore(RECENT_STORE);

      const req = store.getAll();
      req.onsuccess = () => {
        const existing: RecentProject[] = req.result || [];
        const match = existing.find(p => p.name.toLowerCase() === project.name.toLowerCase());
        const id = match ? match.id : `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        const entry: RecentProject = {
          id,
          name: project.name,
          updatedAt: new Date().toISOString(),
          languages: project.languages,
          itemCount: project.items.length,
          projectData: project,
        };

        store.put(entry);

        if (existing.length >= MAX_RECENT_PROJECTS) {
          const sorted = [...existing].sort(
            (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );
          while (sorted.length >= MAX_RECENT_PROJECTS) {
            const oldest = sorted.shift();
            if (oldest && oldest.id !== id) {
              store.delete(oldest.id);
            }
          }
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Lists all recorded recent projects sorted from newest to oldest
 */
export async function listRecentProjects(): Promise<RecentProject[]> {
  const db = await openProjectDb();
  if (!db) {
    try {
      return JSON.parse(localStorage.getItem('jsonlink_recent_projects') || '[]');
    } catch {
      return [];
    }
  }

  return new Promise(resolve => {
    try {
      const tx = db.transaction(RECENT_STORE, 'readonly');
      const store = tx.objectStore(RECENT_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const list: RecentProject[] = req.result || [];
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(list);
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

/**
 * Deletes a single recent project by id
 */
export async function deleteRecentProject(id: string): Promise<void> {
  const db = await openProjectDb();
  if (!db) {
    try {
      const recents: RecentProject[] = JSON.parse(localStorage.getItem('jsonlink_recent_projects') || '[]');
      const filtered = recents.filter(p => p.id !== id);
      localStorage.setItem('jsonlink_recent_projects', JSON.stringify(filtered));
    } catch {}
    return;
  }

  return new Promise(resolve => {
    try {
      const tx = db.transaction(RECENT_STORE, 'readwrite');
      const store = tx.objectStore(RECENT_STORE);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Clears all recent projects
 */
export async function clearRecentProjects(): Promise<void> {
  const db = await openProjectDb();
  if (!db) {
    try {
      localStorage.removeItem('jsonlink_recent_projects');
    } catch {}
    return;
  }

  return new Promise(resolve => {
    try {
      const tx = db.transaction(RECENT_STORE, 'readwrite');
      const store = tx.objectStore(RECENT_STORE);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

