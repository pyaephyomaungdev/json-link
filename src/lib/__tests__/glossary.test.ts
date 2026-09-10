import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatGlossaryForPrompt, getStoredGlossary, saveStoredGlossary, GlossaryEntry } from '../glossary';

describe('glossary.ts', () => {
  // ─── formatGlossaryForPrompt ──────────────────────────────────────────────
  it('formats doNotTranslate terms with explicit keep rules', () => {
    const glossary: GlossaryEntry[] = [
      { id: '1', term: 'KBZPay', target: '', doNotTranslate: true },
    ];
    const prompt = formatGlossaryForPrompt(glossary);
    expect(prompt).toContain('STRICT GLOSSARY ENFORCEMENT:');
    expect(prompt).toContain('"KBZPay" -> KEEP EXACTLY AS "KBZPay" (DO NOT translate');
  });

  it('formats custom target translation terms with notes', () => {
    const glossary: GlossaryEntry[] = [
      { id: '2', term: 'Sign In', target: 'အကောင့်ဝင်ပါ', doNotTranslate: false, note: 'Auth button' },
    ];
    const prompt = formatGlossaryForPrompt(glossary);
    expect(prompt).toContain('"Sign In" -> MUST BE TRANSLATED AS "အကောင့်ဝင်ပါ" (Context: Auth button)');
  });

  it('formats custom target term without note — no (Context:) parentheses', () => {
    const glossary: GlossaryEntry[] = [
      { id: '3', term: 'Dashboard', target: 'ထိန်းချုပ်မှုဘောက်', doNotTranslate: false },
    ];
    const prompt = formatGlossaryForPrompt(glossary);
    expect(prompt).toContain('"Dashboard" -> MUST BE TRANSLATED AS "ထိန်းချုပ်မှုဘောက်"');
    expect(prompt).not.toContain('Context:');
  });

  it('handles mixed doNotTranslate + custom target entries in one prompt', () => {
    const glossary: GlossaryEntry[] = [
      { id: '1', term: 'JSON Link', target: '', doNotTranslate: true },
      { id: '2', term: 'Sign Up', target: 'အကောင့်ဖွင့်ပါ', doNotTranslate: false },
    ];
    const prompt = formatGlossaryForPrompt(glossary);
    expect(prompt).toContain('KEEP EXACTLY AS "JSON Link"');
    expect(prompt).toContain('MUST BE TRANSLATED AS "အကောင့်ဖွင့်ပါ"');
  });

  it('returns empty string when glossary is empty', () => {
    expect(formatGlossaryForPrompt([])).toBe('');
  });

  it('filters out entries with blank/whitespace-only terms', () => {
    const glossary: GlossaryEntry[] = [
      { id: '1', term: '   ', target: '', doNotTranslate: true }, // blank term
      { id: '2', term: 'App', target: '', doNotTranslate: true },
    ];
    const prompt = formatGlossaryForPrompt(glossary);
    // Only 'App' should appear
    expect(prompt).toContain('"App"');
    // The blank entry should not produce a line
    expect((prompt.match(/KEEP EXACTLY AS/g) || []).length).toBe(1);
  });

  // ─── localStorage round-trip ──────────────────────────────────────────────
  describe('localStorage persistence', () => {
    const mockStorage: Record<string, string> = {};

    beforeEach(() => {
      for (const key in mockStorage) delete mockStorage[key];
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => mockStorage[key] ?? null),
        setItem: vi.fn((key: string, val: string) => { mockStorage[key] = val; }),
        removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
      });
    });

    it('saves and loads glossary via localStorage round-trip', () => {
      const entries: GlossaryEntry[] = [
        { id: '1', term: 'KBZPay', target: '', doNotTranslate: true },
      ];
      saveStoredGlossary(entries);
      const loaded = getStoredGlossary();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].term).toBe('KBZPay');
    });

    it('returns empty array when localStorage has no glossary key', () => {
      const result = getStoredGlossary();
      expect(result).toEqual([]);
    });
  });
});
