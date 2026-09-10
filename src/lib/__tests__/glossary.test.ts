import { describe, it, expect } from 'vitest';
import { formatGlossaryForPrompt, GlossaryEntry } from '../glossary';

describe('glossary.ts', () => {
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

  it('returns empty string when glossary is empty', () => {
    expect(formatGlossaryForPrompt([])).toBe('');
  });
});
