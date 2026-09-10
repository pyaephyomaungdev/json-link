import { describe, it, expect } from 'vitest';
import { countMatches, executeFindReplace, buildSearchRegex } from '../findReplace';
import { TranslationItem } from '@/types';

describe('findReplace.ts', () => {
  const sampleItems: TranslationItem[] = [
    {
      key: 'auth.login.title',
      en: 'Log in to your account',
      my: 'အကောင့်ဝင်ရန်',
      description: 'Login page header',
    },
    {
      key: 'auth.login.btn',
      en: 'Log in',
      my: 'ဝင်ရောက်မည်',
      description: 'Submit button',
    },
    {
      key: 'settings.account',
      en: 'Account Settings',
      my: 'အကောင့်ဆက်တင်များ',
      description: 'Account navigation tab',
    },
  ];

  const languages = ['en', 'my'];

  describe('buildSearchRegex', () => {
    it('handles case-insensitive and case-sensitive queries', () => {
      const regInsensitive = buildSearchRegex({
        query: 'account',
        replacement: '',
        scope: 'all',
        matchCase: false,
        wholeWord: false,
        isRegex: false,
        languages,
      });
      expect(regInsensitive?.flags).toContain('i');

      const regSensitive = buildSearchRegex({
        query: 'Account',
        replacement: '',
        scope: 'all',
        matchCase: true,
        wholeWord: false,
        isRegex: false,
        languages,
      });
      expect(regSensitive?.flags).not.toContain('i');
    });

    it('handles whole word search', () => {
      const reg = buildSearchRegex({
        query: 'log',
        replacement: '',
        scope: 'all',
        matchCase: false,
        wholeWord: true,
        isRegex: false,
        languages,
      });
      expect(reg?.source).toBe('\\blog\\b');
    });

    it('returns null for empty query string', () => {
      const reg = buildSearchRegex({
        query: '',
        replacement: '',
        scope: 'all',
        matchCase: false,
        wholeWord: false,
        isRegex: false,
        languages,
      });
      expect(reg).toBeNull();
    });
  });

  describe('countMatches', () => {
    it('counts matches across all fields in scope "all"', () => {
      const result = countMatches(sampleItems, {
        query: 'account',
        replacement: '',
        scope: 'all',
        matchCase: false,
        wholeWord: false,
        isRegex: false,
        languages,
      });

      expect(result.totalMatches).toBe(4);
      expect(result.affectedRows).toBe(2);
    });

    it('counts matches specifically in a selected language scope', () => {
      const result = countMatches(sampleItems, {
        query: 'Log in',
        replacement: '',
        scope: 'en',
        matchCase: true,
        wholeWord: false,
        isRegex: false,
        languages,
      });

      expect(result.totalMatches).toBe(2);
      expect(result.affectedRows).toBe(2);
    });

    it('counts matches in keys only', () => {
      const result = countMatches(sampleItems, {
        query: 'login',
        replacement: '',
        scope: 'key',
        matchCase: false,
        wholeWord: false,
        isRegex: false,
        languages,
      });

      expect(result.totalMatches).toBe(2);
      expect(result.affectedRows).toBe(2);
    });

    it('counts matches in description scope only', () => {
      const result = countMatches(sampleItems, {
        query: 'Account',
        replacement: '',
        scope: 'description',
        matchCase: false,
        wholeWord: false,
        isRegex: false,
        languages,
      });
      // 'Account' in descriptions: 'Account navigation tab'
      expect(result.totalMatches).toBeGreaterThanOrEqual(1);
    });

    it('returns 0 matches when query does not exist', () => {
      const result = countMatches(sampleItems, {
        query: 'zzznomatch999',
        replacement: '',
        scope: 'all',
        matchCase: false,
        wholeWord: false,
        isRegex: false,
        languages,
      });
      expect(result.totalMatches).toBe(0);
      expect(result.affectedRows).toBe(0);
    });

    it('returns 0 matches for empty query', () => {
      const result = countMatches(sampleItems, {
        query: '',
        replacement: '',
        scope: 'all',
        matchCase: false,
        wholeWord: false,
        isRegex: false,
        languages,
      });
      expect(result.totalMatches).toBe(0);
    });
  });

  describe('executeFindReplace', () => {
    it('replaces all occurrences matching the criteria across languages', () => {
      const { updatedItems, count } = executeFindReplace(sampleItems, {
        query: 'Log in',
        replacement: 'Sign In',
        scope: 'en',
        matchCase: true,
        wholeWord: false,
        isRegex: false,
        languages,
      });

      expect(count).toBe(2);
      expect(updatedItems[0].en).toBe('Sign In to your account');
      expect(updatedItems[1].en).toBe('Sign In');
      // Myanmar strings untouched
      expect(updatedItems[0].my).toBe('အကောင့်ဝင်ရန်');
    });

    it('supports regex replacement with capture groups', () => {
      const { updatedItems, count } = executeFindReplace(sampleItems, {
        query: 'auth\\.(login)\\.(\\w+)',
        replacement: 'authentication.$1_$2',
        scope: 'key',
        matchCase: false,
        wholeWord: false,
        isRegex: true,
        languages,
      });

      expect(count).toBe(2);
      expect(updatedItems[0].key).toBe('authentication.login_title');
      expect(updatedItems[1].key).toBe('authentication.login_btn');
    });

    it('returns count 0 and unchanged items when no matches', () => {
      const { updatedItems, count } = executeFindReplace(sampleItems, {
        query: 'zzznomatch999',
        replacement: 'replacement',
        scope: 'all',
        matchCase: false,
        wholeWord: false,
        isRegex: false,
        languages,
      });
      expect(count).toBe(0);
      expect(updatedItems[0].en).toBe(sampleItems[0].en);
    });

    it('replaces with empty string (effectively deletes matched text)', () => {
      const { updatedItems, count } = executeFindReplace(sampleItems, {
        query: ' Settings',
        replacement: '',
        scope: 'en',
        matchCase: true,
        wholeWord: false,
        isRegex: false,
        languages,
      });
      expect(count).toBe(1);
      expect(updatedItems[2].en).toBe('Account');
    });
  });
});
