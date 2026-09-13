import { describe, it, expect, beforeEach, vi } from 'vitest';
import JSZip from 'jszip';
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
  generateArbData,
  exportAllAsProjectBundle,
  exportToViteStarterZip,
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

    it('escapes literal backslashes in Android XML and iOS strings', () => {
      const itemWithBackslash: TranslationItem[] = [
        { key: 'path.win', en: 'C:\\new\\folder' },
      ];
      const xml = generateAndroidXml(itemWithBackslash, 'en');
      expect(xml).toContain('C:\\\\new\\\\folder');

      const strings = generateIosStrings(itemWithBackslash, 'en');
      expect(strings).toContain('C:\\\\new\\\\folder');
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

  describe('generateArbData', () => {
    it('generates Flutter ARB JSON object with @@locale and @key descriptions', () => {
      const items: TranslationItem[] = [
        { key: 'appTitle', en: 'JSON Link', description: 'Application Title' },
        { key: 'btnSubmit', en: 'Submit' },
      ];
      const arb = generateArbData(items, 'en');
      expect(arb['@@locale']).toBe('en');
      expect(arb['appTitle']).toBe('JSON Link');
      expect(arb['@appTitle']).toEqual({ description: 'Application Title' });
      expect(arb['btnSubmit']).toBe('Submit');
      expect(arb['@btnSubmit']).toBeUndefined();
    });
  });

  describe('exportToViteStarterZip', () => {
    it('creates and downloads a complete Vite starter ZIP with package.json, i18n.ts, devtools.tsx, and locales', async () => {
      await exportToViteStarterZip(sampleItems, languages, { nested: false }, 'my_starter.zip');

      const mockCreateObjectURL = vi.mocked(URL.createObjectURL);
      expect(mockCreateObjectURL).toHaveBeenCalled();

      // Retrieve the generated Blob passed to downloadBlob
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blob).toBeInstanceOf(Blob);

      // Unpack the ZIP archive to verify files and content
      const unzipped = await JSZip.loadAsync(blob);
      expect(unzipped.file('package.json')).not.toBeNull();
      expect(unzipped.file('vite.config.ts')).not.toBeNull();
      expect(unzipped.file('tsconfig.json')).not.toBeNull();
      expect(unzipped.file('index.html')).not.toBeNull();
      expect(unzipped.file('src/locales/en.json')).not.toBeNull();
      expect(unzipped.file('src/locales/my.json')).not.toBeNull();
      expect(unzipped.file('src/locales/translations.d.ts')).not.toBeNull();
      expect(unzipped.file('.agents/skills/jsonlink-vite-i18n/SKILL.md')).not.toBeNull();

      // Verify i18n.ts contains updateTranslation for reactive updates
      const i18nContent = await unzipped.file('src/locales/i18n.ts')?.async('text');
      expect(i18nContent).toContain('export function updateTranslation');
      expect(i18nContent).toContain('export function useTranslation');

      // Verify devtools.tsx contains JsonLinkDevtools drawer component and Download JSON button
      const devtoolsContent = await unzipped.file('src/locales/devtools.tsx')?.async('text');
      expect(devtoolsContent).toContain('export function JsonLinkDevtools');
      expect(devtoolsContent).toContain('updateTranslation');
      expect(devtoolsContent).toContain('Download JSON');

      // Verify App.tsx mounts JsonLinkDevtools gated with import.meta.env.DEV
      const appContent = await unzipped.file('src/App.tsx')?.async('text');
      expect(appContent).toContain('import.meta.env.DEV && <JsonLinkDevtools />');
    });

    it('generates a starter kit that compiles cleanly with TypeScript tsc', async () => {
      await exportToViteStarterZip(sampleItems, languages, { nested: false }, 'tsc_test.zip');
      const mockCreateObjectURL = vi.mocked(URL.createObjectURL);
      const blob = mockCreateObjectURL.mock.calls[mockCreateObjectURL.mock.calls.length - 1][0] as Blob;
      const unzipped = await JSZip.loadAsync(blob);

      const fs = await import('fs');
      const path = await import('path');
      const { execSync } = await import('child_process');

      const tempDir = path.join(process.cwd(), 'node_modules', '.tmp_starter_tsc_' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        for (const [filename, file] of Object.entries(unzipped.files)) {
          if (file.dir) {
            fs.mkdirSync(path.join(tempDir, filename), { recursive: true });
          } else {
            const fullPath = path.join(tempDir, filename);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            const content = await file.async('nodebuffer');
            fs.writeFileSync(fullPath, content);
          }
        }

        // Link node_modules
        fs.symlinkSync(path.join(process.cwd(), 'node_modules'), path.join(tempDir, 'node_modules'), 'junction');

        // Compile with starter's own tsconfig.json
        try {
          const output = execSync('npx tsc --noEmit -p tsconfig.json', { cwd: tempDir, encoding: 'utf-8' });
          expect(output).toBe('');
        } catch (err: any) {
          console.error("TSC ERRORS:\n", err.stdout?.toString());
          throw err;
        }
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
});
