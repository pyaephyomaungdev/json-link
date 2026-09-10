import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateLanguageJsonData,
  objectToYaml,
  exportToTypeScriptDts,
  exportToCsv,
  exportToExcel,
  exportToJsonZip,
  exportToYamlZip,
  exportToAndroidXmlZip,
  exportToIosStringsZip,
  generateAndroidXml,
  generateIosStrings,
  exportAllAsProjectBundle,
} from '../exporter';
import { TranslationItem } from '@/types';

describe('exporter.ts', () => {
  const sampleItems: TranslationItem[] = [
    { key: 'auth.login.title', en: 'Sign In', my: 'အကောင့်ဝင်ပါ' },
    { key: 'auth.login.btn', en: 'Submit', my: 'တင်သွင်းပါ' },
    { key: 'simple', en: 'Simple "Quote" & <Tag>', my: 'ရိုးရှင်းသော' },
  ];
  const languages = ['en', 'my'];

  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        click: vi.fn(),
        href: '',
        download: '',
      })),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    });
  });

  describe('generateLanguageJsonData', () => {
    it('generates flat dictionary for flat export mode', () => {
      const flat = generateLanguageJsonData(sampleItems, 'en', false);
      expect(flat).toEqual({
        'auth.login.title': 'Sign In',
        'auth.login.btn': 'Submit',
        simple: 'Simple "Quote" & <Tag>',
      });
    });

    it('generates nested object structure for nested export mode', () => {
      const nested = generateLanguageJsonData(sampleItems, 'en', true);
      expect(nested).toEqual({
        auth: {
          login: {
            title: 'Sign In',
            btn: 'Submit',
          },
        },
        simple: 'Simple "Quote" & <Tag>',
      });
    });
  });

  describe('objectToYaml', () => {
    it('converts object to formatted YAML string', () => {
      const obj = {
        title: 'Hello',
        auth: {
          btn: 'Login',
        },
      };
      const yaml = objectToYaml(obj);
      expect(yaml).toContain('title: Hello');
      expect(yaml).toContain('auth:');
      expect(yaml).toContain('  btn: Login');
    });

    it('quotes strings with special characters or colons', () => {
      const obj = {
        special: 'Note: Please read {doc}',
      };
      const yaml = objectToYaml(obj);
      expect(yaml).toContain('special: "Note: Please read {doc}"');
    });

    it('formats multiline strings using block literal |-', () => {
      const obj = {
        multiline: 'Line 1\nLine 2',
      };
      const yaml = objectToYaml(obj);
      expect(yaml).toContain('multiline: |-');
      expect(yaml).toContain('  Line 1');
      expect(yaml).toContain('  Line 2');
    });
  });

  describe('exportToTypeScriptDts', () => {
    it('creates .d.ts with union types of keys and supported languages', () => {
      exportToTypeScriptDts(sampleItems, languages, 'translations.d.ts');
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('exportToCsv', () => {
    it('exports CSV with UTF-8 BOM and properly quoted strings', () => {
      exportToCsv(sampleItems, languages, 'test.csv');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('exportToExcel', () => {
    it('exports XLSX workbook without errors', () => {
      exportToExcel(sampleItems, languages, 'test.xlsx');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Android XML and iOS Strings generation with description', () => {
    const itemsWithDesc: TranslationItem[] = [
      {
        key: 'button.save',
        en: 'Save Changes',
        description: 'Button in user profile to save profile edits',
      },
      {
        key: 'button.cancel',
        en: 'Cancel',
      },
    ];

    it('generates Android XML with comment above key if description exists', () => {
      const xml = generateAndroidXml(itemsWithDesc, 'en');
      expect(xml).toContain('<!-- Button in user profile to save profile edits -->');
      expect(xml).toContain('<string name="button_save">Save Changes</string>');
      expect(xml).toContain('<string name="button_cancel">Cancel</string>');
    });

    it('generates iOS strings with comment above key if description exists', () => {
      const strings = generateIosStrings(itemsWithDesc, 'en');
      expect(strings).toContain('/* Button in user profile to save profile edits */');
      expect(strings).toContain('"button.save" = "Save Changes";');
      expect(strings).toContain('"button.cancel" = "Cancel";');
    });
  });

  describe('ZIP exporters', () => {
    it('bundles JSON zip files', async () => {
      await exportToJsonZip(sampleItems, languages, { format: 'json-zip', nested: false, indent: 2, includeMissing: true });
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('bundles YAML zip files', async () => {
      await exportToYamlZip(sampleItems, languages, { format: 'yaml-zip', nested: true, indent: 2, includeMissing: true });
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('bundles Android XML zip files', async () => {
      await exportToAndroidXmlZip(sampleItems, languages);
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('bundles iOS Strings zip files', async () => {
      await exportToIosStringsZip(sampleItems, languages);
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('bundles complete multi-platform Project Bundle ZIP', async () => {
      await exportAllAsProjectBundle(sampleItems, languages, {}, 'all-in-one', 'my-app.zip');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('generateLanguageJsonData — edge cases', () => {
    it('includes key with empty string when language value is missing', () => {
      const items = [
        { key: 'present', en: 'Hello', my: 'မင်္ဂလာ' },
        { key: 'missing', en: 'World' }, // no 'my' value — will be ''
      ];
      const flat = generateLanguageJsonData(items, 'my', false);
      expect(flat['present']).toBe('မင်္ဂလာ');
      // 'missing' key is exported as empty string (not omitted)
      expect(flat['missing']).toBe('');
    });
  });

  describe('generateAndroidXml — special character escaping', () => {
    it('escapes ampersand, quotes, and angle brackets in XML values', () => {
      const items = [
        { key: 'chars', en: 'AT&T "rocks" <tag>' },
      ];
      const xml = generateAndroidXml(items, 'en');
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&lt;');
    });

    it('converts dots in key names to underscores for XML name attribute', () => {
      const items = [
        { key: 'auth.login.btn', en: 'Login' },
      ];
      const xml = generateAndroidXml(items, 'en');
      expect(xml).toContain('name="auth_login_btn"');
    });
  });

  describe('objectToYaml — edge cases', () => {
    it('handles empty object without crashing', () => {
      const yaml = objectToYaml({});
      expect(typeof yaml).toBe('string');
    });
  });
});
