import { describe, it, expect } from 'vitest';
import {
  ISO_LANGUAGES,
  getLanguageByCode,
  formatLanguageLabel,
} from '../languages';

describe('languages.ts', () => {
  it('contains essential languages in the ISO_LANGUAGES list', () => {
    expect(ISO_LANGUAGES.length).toBeGreaterThan(30);

    const codes = ISO_LANGUAGES.map(l => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('my');
    expect(codes).toContain('th');
    expect(codes).toContain('ja');
    expect(codes).toContain('zh');
    expect(codes).toContain('ko');
    expect(codes).toContain('es');
    expect(codes).toContain('fr');
    expect(codes).toContain('de');
  });

  describe('getLanguageByCode', () => {
    it('finds language case-insensitively', () => {
      const my = getLanguageByCode('MY');
      expect(my).toBeDefined();
      expect(my?.name).toBe('Myanmar (Burmese)');
      expect(my?.nativeName).toBe('မြန်မာ');

      const en = getLanguageByCode(' en ');
      expect(en).toBeDefined();
      expect(en?.name).toBe('English');
    });

    it('finds regional variants like pt-br and zh-tw', () => {
      expect(getLanguageByCode('pt-br')?.name).toBe('Portuguese (Brazil)');
      expect(getLanguageByCode('zh-tw')?.name).toBe('Chinese (Traditional)');
    });

    it('returns undefined for nonexistent code', () => {
      expect(getLanguageByCode('xyz_fake')).toBeUndefined();
    });
  });

  describe('formatLanguageLabel', () => {
    it('formats known language into Name (NativeName)', () => {
      expect(formatLanguageLabel('my')).toBe('Myanmar (Burmese) (မြန်မာ)');
      expect(formatLanguageLabel('ja')).toBe('Japanese (日本語)');
      expect(formatLanguageLabel('en')).toBe('English (English)');
    });

    it('falls back to uppercase code for unknown code', () => {
      expect(formatLanguageLabel('custom-code')).toBe('CUSTOM-CODE');
    });
  });
});
