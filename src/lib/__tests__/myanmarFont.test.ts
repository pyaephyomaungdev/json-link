import { describe, it, expect } from 'vitest';
import {
  isZawgyi,
  detectZawgyiInItems,
  zawgyiToUnicode,
  unicodeToZawgyi,
} from '../myanmarFont';

describe('myanmarFont.ts', () => {
  describe('isZawgyi', () => {
    it('correctly identifies Zawgyi encoded text with pre-posed e-vowel', () => {
      // \u1031 (e) before \u1019 (ma)
      const zg = '\u1031\u1019\u102c\u1004\u103a'; // မောင် in zawgyi order
      expect(isZawgyi(zg)).toBe(true);
    });

    it('identifies standard Unicode text as non-Zawgyi', () => {
      const uni = 'မင်္ဂလာပါ'; // Mingalaba in standard Unicode
      expect(isZawgyi(uni)).toBe(false);

      const uni2 = 'မြန်မာနိုင်ငံ'; // Myanmar Naing Ngan
      expect(isZawgyi(uni2)).toBe(false);
    });

    it('returns false for plain English or empty text', () => {
      expect(isZawgyi('Hello world')).toBe(false);
      expect(isZawgyi('')).toBe(false);
    });
  });

  describe('zawgyiToUnicode and unicodeToZawgyi', () => {
    it('converts pre-posed e-vowels to standard post-posed Unicode order', () => {
      const zg = '\u1031\u101e\u102c\u103a'; // သော် in zawgyi
      const uni = zawgyiToUnicode(zg);
      expect(uni).toContain('\u101e\u1031'); // Consonant followed by e-vowel in Unicode
    });

    it('converts Unicode to Zawgyi with pre-posed vowel', () => {
      const uni = 'စေတနာ';
      const zg = unicodeToZawgyi(uni);
      expect(zg.startsWith('\u1031')).toBe(true);
    });
  });

  describe('detectZawgyiInItems', () => {
    it('detects Zawgyi count in items array', () => {
      const items = [
        { key: 'title', my: 'မင်္ဂလာပါ' }, // Unicode
        { key: 'desc', my: '\u1031\u1019\u102c\u1004\u103a' }, // Zawgyi
      ];
      const result = detectZawgyiInItems(items, 'my');
      expect(result.hasZawgyi).toBe(true);
      expect(result.count).toBe(1);
    });

    it('returns false when all items are Unicode', () => {
      const items = [
        { key: 'title', my: 'မင်္ဂလာပါ' },
        { key: 'btn', my: 'သိမ်းဆည်းပါ' },
      ];
      const result = detectZawgyiInItems(items, 'my');
      expect(result.hasZawgyi).toBe(false);
      expect(result.count).toBe(0);
    });
  });
});
