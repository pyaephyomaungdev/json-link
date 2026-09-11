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

    it('converts complex real-world Zawgyi text to Unicode accurately', () => {
      const zg = 'သိမ္ဆည္းမႈ ေအာင္ျမင္ပါသည္။';
      const uni = zawgyiToUnicode(zg);
      expect(uni).toBe('သိမ်ဆည်းမှု အောင်မြင်ပါသည်။');
      expect(isZawgyi(uni)).toBe(false);

      expect(zawgyiToUnicode('မလုပ္ေတာ့ပါ')).toBe('မလုပ်တော့ပါ');
      expect(zawgyiToUnicode('သို႔မဟုတ္')).toBe('သို့မဟုတ်');
      expect(zawgyiToUnicode('ျမန္မာ')).toBe('မြန်မာ');
      expect(zawgyiToUnicode('ေဒါင္းလုဒ္')).toBe('ဒေါင်းလုဒ်');
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

    it('returns false with count 0 for empty items array', () => {
      const result = detectZawgyiInItems([], 'my');
      expect(result.hasZawgyi).toBe(false);
      expect(result.count).toBe(0);
    });

    it('handles language column that does not exist in items gracefully', () => {
      const items = [
        { key: 'title', en: 'Hello' }, // no 'my' column
      ];
      const result = detectZawgyiInItems(items, 'my');
      expect(result.hasZawgyi).toBe(false);
      expect(result.count).toBe(0);
    });
  });

  describe('isZawgyi — additional edge cases', () => {
    it('detects Zawgyi when text is predominantly Myanmar Zawgyi characters', () => {
      // Pure Zawgyi syllables — no Latin prefix — so heuristic fires cleanly
      const zawgyi = '\u1031\u1019\u102c\u1004\u103a\u1031\u1019\u102c\u1004\u103a'; // repeated zawgyi
      expect(isZawgyi(zawgyi)).toBe(true);
    });

    it('does NOT flag valid Unicode medial-before-e words (ြ + ေ)', () => {
      // ဖြေ (answer), ကြောင်း — valid Unicode stores medial \u103c BEFORE e-vowel \u1031.
      // Zawgyi pre-poses the e-vowel (\u1031 before consonant), caught by another rule.
      expect(isZawgyi('\u1015\u103c\u1031')).toBe(false); // ဖြေ
      expect(isZawgyi('\u1000\u103c\u1031\u102c\u1004\u103a\u1038')).toBe(false); // ကြောင်း
      expect(isZawgyi('\u1000\u103B\u1031')).toBe(false); // ကျေ
    });

    it('still detects Zawgyi pre-posed e-vowel with medials', () => {
      expect(isZawgyi('\u1031\u1000\u103C')).toBe(true); // ေကြ — Zawgyi order
      expect(isZawgyi('\u1031\u1000\u103B')).toBe(true); // ေကျ — Zawgyi order
    });
  });
});
