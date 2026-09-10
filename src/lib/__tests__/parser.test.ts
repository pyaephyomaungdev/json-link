import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  flattenObject,
  unflattenObject,
  inferLanguageFromFilename,
  parseJsonFile,
  mergeTranslations,
  parseAndroidXml,
  parseIosStrings,
  parseYamlFile,
  parseSpreadsheet,
} from '../parser';
import { TranslationItem } from '@/types';

describe('parser.ts', () => {
  describe('flattenObject', () => {
    it('flattens deeply nested objects with dot notation', () => {
      const input = {
        app: {
          nav: {
            home: 'Home',
            about: 'About Us',
          },
          version: 1,
        },
      };
      const result = flattenObject(input);
      expect(result).toEqual({
        'app.nav.home': 'Home',
        'app.nav.about': 'About Us',
        'app.version': '1',
      });
    });

    it('stringifies array values', () => {
      const input = {
        tags: ['react', 'vite', 'i18n'],
      };
      const result = flattenObject(input);
      expect(result).toEqual({
        tags: JSON.stringify(['react', 'vite', 'i18n']),
      });
    });

    it('handles null and undefined values gracefully', () => {
      const input = {
        nullKey: null,
        undefKey: undefined,
        validKey: 'ok',
      };
      const result = flattenObject(input);
      expect(result).toEqual({
        nullKey: '',
        undefKey: '',
        validKey: 'ok',
      });
    });

    it('returns already flat object as-is', () => {
      const input = { a: '1', b: '2' };
      expect(flattenObject(input)).toEqual({ a: '1', b: '2' });
    });
  });

  describe('unflattenObject', () => {
    it('reconstructs nested objects from dot notation', () => {
      const flat = {
        'auth.login.title': 'Login',
        'auth.login.btn': 'Sign In',
        'auth.logout': 'Sign Out',
      };
      const nested = unflattenObject(flat);
      expect(nested).toEqual({
        auth: {
          login: {
            title: 'Login',
            btn: 'Sign In',
          },
          logout: 'Sign Out',
        },
      });
    });

    it('handles single level keys without nesting', () => {
      const flat = { title: 'Welcome', submit: 'Send' };
      expect(unflattenObject(flat)).toEqual({ title: 'Welcome', submit: 'Send' });
    });
  });

  describe('inferLanguageFromFilename', () => {
    it('detects common language codes and aliases', () => {
      expect(inferLanguageFromFilename('en.json')).toBe('en');
      expect(inferLanguageFromFilename('my.json')).toBe('my');
      expect(inferLanguageFromFilename('burmese_translations.json')).toBe('my');
      expect(inferLanguageFromFilename('app-english.json')).toBe('en');
      expect(inferLanguageFromFilename('strings_thai.json')).toBe('th');
      expect(inferLanguageFromFilename('strings-japan.json')).toBe('ja');
      expect(inferLanguageFromFilename('chinese.json')).toBe('zh');
    });

    it('detects region codes like zh-CN or pt-BR', () => {
      expect(inferLanguageFromFilename('messages_pt_br.json')).toBe('pt-br');
      expect(inferLanguageFromFilename('locale-zh-cn.json')).toBe('zh-cn');
    });

    it('falls back to basename for unrecognized patterns', () => {
      expect(inferLanguageFromFilename('custom_dictionary.json')).toBe('custom_dictionary');
    });
  });

  describe('parseJsonFile', () => {
    it('parses single language flat JSON', () => {
      const json = JSON.stringify({ hello: 'Hello', world: 'World' });
      const res = parseJsonFile(json, 'en.json');
      expect(res).toEqual({
        en: { hello: 'Hello', world: 'World' },
      });
    });

    it('parses single language nested JSON', () => {
      const json = JSON.stringify({ common: { ok: 'OK', cancel: 'Cancel' } });
      const res = parseJsonFile(json, 'my.json');
      expect(res).toEqual({
        my: { 'common.ok': 'OK', 'common.cancel': 'Cancel' },
      });
    });

    it('parses multi-language root JSON object', () => {
      const json = JSON.stringify({
        en: { greeting: 'Hello' },
        my: { greeting: 'မင်္ဂလာပါ' },
      });
      const res = parseJsonFile(json, 'translations.json');
      expect(res).toEqual({
        en: { greeting: 'Hello' },
        my: { greeting: 'မင်္ဂလာပါ' },
      });
    });

    it('parses .jsonlink project export file', () => {
      const project = {
        format: 'jsonlink',
        languages: ['en', 'my'],
        items: [
          { key: 'app.title', en: 'App Title', my: 'အက်ပ်ခေါင်းစဉ်' },
          { key: 'app.desc', en: 'Description', my: 'ဖော်ပြချက်' },
        ],
      };
      const res = parseJsonFile(JSON.stringify(project), 'my-project.jsonlink');
      expect(res).toEqual({
        en: { 'app.title': 'App Title', 'app.desc': 'Description' },
        my: { 'app.title': 'အက်ပ်ခေါင်းစဉ်', 'app.desc': 'ဖော်ပြချက်' },
      });
    });

    it('throws error for invalid JSON string or non-object root', () => {
      expect(() => parseJsonFile('invalid json', 'test.json')).toThrow();
      expect(() => parseJsonFile('123', 'test.json')).toThrow(
        'Invalid JSON structure: Root must be an object.'
      );
      expect(() => parseJsonFile('null', 'test.json')).toThrow(
        'Invalid JSON structure: Root must be an object.'
      );
    });
  });

  describe('mergeTranslations', () => {
    it('merges new languages into existing items without losing existing translations', () => {
      const existingItems: TranslationItem[] = [
        { key: 'btn.save', en: 'Save' },
        { key: 'btn.cancel', en: 'Cancel' },
      ];
      const existingLangs = ['en'];
      const newLangData = {
        my: {
          'btn.save': 'သိမ်းဆည်းပါ',
          'btn.cancel': 'ပယ်ဖျက်ပါ',
          'btn.retry': 'ပြန်စမ်းပါ',
        },
      };

      const result = mergeTranslations(existingItems, existingLangs, newLangData);
      expect(result.languages).toContain('en');
      expect(result.languages).toContain('my');
      expect(result.items).toHaveLength(3);

      const saveItem = result.items.find(i => i.key === 'btn.save');
      expect(saveItem).toEqual({ key: 'btn.save', en: 'Save', my: 'သိမ်းဆည်းပါ' });

      const retryItem = result.items.find(i => i.key === 'btn.retry');
      expect(retryItem).toEqual({ key: 'btn.retry', en: '', my: 'ပြန်စမ်းပါ' });
    });
  });

  describe('parseAndroidXml', () => {
    it('extracts strings and unescapes Android XML entities', () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">JSON &amp; Link</string>
    <string name="welcome_msg">Hello &lt;b&gt;User&lt;/b&gt;!\\nWelcome back.</string>
    <string name="quote_test">It\\'s a \\"great\\" day</string>
</resources>`;

      const res = parseAndroidXml(xml, 'values-en.xml');
      expect(res.en).toBeDefined();
      expect(res.en['app_name']).toBe('JSON & Link');
      expect(res.en['welcome_msg']).toBe('Hello <b>User</b>!\nWelcome back.');
      expect(res.en['quote_test']).toBe("It's a \"great\" day");
    });
  });

  describe('parseIosStrings', () => {
    it('extracts key-value pairs and strips comments', () => {
      const stringsContent = `/* Header comment */
// Single line comment
"welcome.title" = "Welcome to App";
"welcome.desc" = "Enjoy your \\"stay\\"!\\nLine 2";
`;
      const res = parseIosStrings(stringsContent, 'en.lproj');
      expect(res.en).toBeDefined();
      expect(res.en['welcome.title']).toBe('Welcome to App');
      expect(res.en['welcome.desc']).toBe('Enjoy your "stay"!\nLine 2');
    });
  });

  describe('parseYamlFile', () => {
    it('parses nested YAML and strips top-level language prefix', () => {
      const yaml = `
en:
  nav:
    home: "Home"
    settings: 'Settings'
  footer:
    copyright: All rights reserved
`;
      const res = parseYamlFile(yaml, 'en.yaml');
      expect(res.en).toBeDefined();
      expect(res.en['nav.home']).toBe('Home');
      expect(res.en['nav.settings']).toBe('Settings');
      expect(res.en['footer.copyright']).toBe('All rights reserved');
    });

    it('parses flat YAML without language prefix', () => {
      const yaml = `
# Comment line
title: App Name
subtitle: Easy localization
`;
      const res = parseYamlFile(yaml, 'my.yaml');
      expect(res.my).toBeDefined();
      expect(res.my['title']).toBe('App Name');
      expect(res.my['subtitle']).toBe('Easy localization');
    });
  });

  describe('parseSpreadsheet', () => {
    it('parses Excel workbook binary buffer correctly', () => {
      const workbook = XLSX.utils.book_new();
      const sheetData = [
        ['Key', 'en', 'my'],
        ['app.title', 'JSON Link', 'ဂျေဆန် လင့်ခ်'],
        ['app.btn', 'Submit', 'တင်သွင်းပါ'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

      const result = parseSpreadsheet(buffer);
      expect(result.languages).toEqual(['en', 'my']);
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual({
        key: 'app.title',
        en: 'JSON Link',
        my: 'ဂျေဆန် လင့်ခ်',
      });
      expect(result.items[1]).toEqual({
        key: 'app.btn',
        en: 'Submit',
        my: 'တင်သွင်းပါ',
      });
    });

    it('throws error when spreadsheet has fewer than 2 rows', () => {
      const workbook = XLSX.utils.book_new();
      const sheetData = [['Key', 'en']];
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

      expect(() => parseSpreadsheet(buffer)).toThrow(
        'Spreadsheet must contain at least a header row and one data row.'
      );
    });
  });
});
