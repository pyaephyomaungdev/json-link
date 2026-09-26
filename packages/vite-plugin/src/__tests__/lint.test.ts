import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  extractPlaceholders,
  isZawgyiDetected,
  runLint,
} from '../lint.js';

describe('Localization Linter (jsonlink lint)', () => {
  let tempDir: string;
  let localesDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonlink-lint-test-'));
    localesDir = path.join(tempDir, 'src', 'locales');
    fs.mkdirSync(localesDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('extractPlaceholders', () => {
    it('extracts simple and complex ICU placeholders', () => {
      expect(extractPlaceholders('Hello {name}, you have {count} items')).toEqual(['name', 'count']);
      expect(extractPlaceholders('{count, plural, =1 {One} other {Many}}')).toEqual(['count']);
      expect(extractPlaceholders('Plain text without variables')).toEqual([]);
    });
  });

  describe('isZawgyiDetected', () => {
    it('identifies Zawgyi legacy encoding correctly', () => {
      // Zawgyi encoding with e-vowel preceding consonant (မင်္ဂလာပါ in Zawgyi: မင္ဂလာပါ with 1064)
      const zawgyiText = '\u1019\u1064\u1002\u101c\u102c\u1018\u102c';
      expect(isZawgyiDetected(zawgyiText)).toBe(true);

      // Clean Standard Unicode: မင်္ဂလာပါ (\u1019\u1004\u103a\u1038\u1002\u101c\u102c\u1017\u102c)
      const unicodeText = 'မင်္ဂလာပါ';
      expect(isZawgyiDetected(unicodeText)).toBe(false);
    });
  });

  describe('runLint execution', () => {
    it('passes when all keys and placeholders are synchronized', () => {
      fs.writeFileSync(
        path.join(localesDir, 'en.json'),
        JSON.stringify({ 'auth.welcome': 'Welcome {user}!' })
      );
      fs.writeFileSync(
        path.join(localesDir, 'my.json'),
        JSON.stringify({ 'auth.welcome': 'ကြိုဆိုပါတယ် {user}!' })
      );

      const result = runLint(tempDir);
      expect(result.success).toBe(true);
      expect(result.errorCount).toBe(0);
      expect(result.totalKeys).toBe(1);
    });

    it('detects missing keys across target locales', () => {
      fs.writeFileSync(
        path.join(localesDir, 'en.json'),
        JSON.stringify({ 'app.title': 'Dashboard', 'app.logout': 'Sign Out' })
      );
      fs.writeFileSync(
        path.join(localesDir, 'my.json'),
        JSON.stringify({ 'app.title': 'ဒက်ရှ်ဘုတ်' })
      );

      const result = runLint(tempDir);
      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(1);
      expect(result.issues[0].type).toBe('missing_key');
      expect(result.issues[0].key).toBe('app.logout');
      expect(result.issues[0].language).toBe('my');
    });

    it('detects ICU placeholder mismatches', () => {
      fs.writeFileSync(
        path.join(localesDir, 'en.json'),
        JSON.stringify({ 'items.count': 'You have {count} items' })
      );
      fs.writeFileSync(
        path.join(localesDir, 'my.json'),
        JSON.stringify({ 'items.count': 'သင့်တွင် ပစ္စည်းများရှိပါသည်' }) // missing {count}
      );

      const result = runLint(tempDir);
      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(1);
      expect(result.issues[0].type).toBe('placeholder_mismatch');
      expect(result.issues[0].key).toBe('items.count');
    });
  });
});
