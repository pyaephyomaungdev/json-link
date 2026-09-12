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

/**
 * Saves project to browser localStorage as an auto-saved draft
 */
export function saveLocalDraft(
  projectName: string,
  items: TranslationItem[],
  languages: string[]
): void {
  try {
    const project: JsonLinkProject = {
      format: 'jsonlink',
      version: '1.0.0',
      name: projectName || 'my-project',
      updatedAt: new Date().toISOString(),
      languages,
      items,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('jsonlink_user_discarded');
    }
  } catch (e) {
    console.warn('Failed to save draft to localStorage', e);
  }
}

/**
 * Loads auto-saved project from browser localStorage
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
 * Clears auto-saved project from browser localStorage and sessionStorage
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
}

