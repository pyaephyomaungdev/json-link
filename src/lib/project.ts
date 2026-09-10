import { JsonLinkProject, TranslationItem } from '@/types';
import { downloadBlob } from './exporter';

const LOCAL_STORAGE_KEY = 'jsonlink_current_project';

/**
 * Downloads current translation project as a .jsonlink file
 */
export function exportProjectFile(
  projectName: string,
  items: TranslationItem[],
  languages: string[]
): void {
  const cleanName = projectName.trim() || 'my-project';
  const project: JsonLinkProject = {
    format: 'jsonlink',
    version: '1.0.0',
    name: cleanName,
    updatedAt: new Date().toISOString(),
    languages,
    items,
  };

  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const filename = cleanName.endsWith('.jsonlink') ? cleanName : `${cleanName}.jsonlink`;

  downloadBlob(blob, filename);
}

/**
 * Parses and validates a .jsonlink file content
 */
export function parseProjectFile(content: string): JsonLinkProject {
  const parsed = JSON.parse(content);

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
  } catch (e) {
    console.warn('Failed to save draft to localStorage', e);
  }
}

/**
 * Loads auto-saved project from browser localStorage
 */
export function loadLocalDraft(): JsonLinkProject | null {
  try {
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
 * Clears auto-saved project from browser localStorage
 */
export function clearLocalDraft(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear draft from localStorage', e);
  }
}
