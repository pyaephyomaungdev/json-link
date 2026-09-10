export interface GlossaryEntry {
  id: string;
  term: string;
  target: string;
  doNotTranslate: boolean;
  note?: string;
}

const STORAGE_KEY_GLOSSARY = 'jsonlink_ai_glossary';

/**
 * Retrieves the stored glossary from localStorage.
 */
export function getStoredGlossary(): GlossaryEntry[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEY_GLOSSARY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load glossary from localStorage:', e);
  }
  return [];
}

/**
 * Persists the glossary to localStorage.
 */
export function saveStoredGlossary(glossary: GlossaryEntry[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_GLOSSARY, JSON.stringify(glossary));
    }
  } catch (e) {
    console.error('Failed to save glossary to localStorage:', e);
  }
}

/**
 * Formats glossary entries into system prompt instructions for OpenRouter AI models.
 */
export function formatGlossaryForPrompt(glossary: GlossaryEntry[]): string {
  if (!glossary || glossary.length === 0) return '';

  const activeRules = glossary.filter(g => g.term.trim());
  if (activeRules.length === 0) return '';

  const lines = activeRules.map(g => {
    const term = g.term.trim();
    if (g.doNotTranslate) {
      return `   - "${term}" -> KEEP EXACTLY AS "${term}" (DO NOT translate, transliterate, or modify).`;
    }
    const target = g.target.trim();
    const note = g.note ? ` (Context: ${g.note})` : '';
    return `   - "${term}" -> MUST BE TRANSLATED AS "${target}"${note}.`;
  });

  return `\nSTRICT GLOSSARY ENFORCEMENT:
You MUST strictly adhere to the following project terminology rules:
${lines.join('\n')}\n`;
}
