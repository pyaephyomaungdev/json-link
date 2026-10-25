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
  parseArbFile,
  parseXliffFile,
  parsePoFile,
  applyLanguageHint,
  mergeItemSubset,
  localePathFromFile,
  translationItemsToLangMap,
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

    it('neutralizes prototype pollution attempts (__proto__, constructor, prototype)', () => {
      const malicious = {
        'normal.key': 'safe',
        '__proto__.polluted': 'evil',
        'constructor.prototype.hacked': 'evil2',
      };
      const res = unflattenObject(malicious);
      expect(res).toEqual({ normal: { key: 'safe' } });
      expect(({} as any).polluted).toBeUndefined();
      expect(({} as any).hacked).toBeUndefined();
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

    it('reads language from Android and iOS folder paths', () => {
      expect(inferLanguageFromFilename('res/values-fr/strings.xml')).toBe('fr');
      expect(inferLanguageFromFilename('res/values/strings.xml')).toBe('en');
      expect(inferLanguageFromFilename('ios/en.lproj/Localizable.strings')).toBe('en');
      expect(inferLanguageFromFilename('ios/my.lproj/Localizable.strings')).toBe('my');
      expect(inferLanguageFromFilename('strings.xml')).toBe('en');
      expect(inferLanguageFromFilename('Localizable.strings')).toBe('en');
    });
  });

  describe('applyLanguageHint', () => {
    it('remaps a generic single-language map onto the hinted code', () => {
      expect(applyLanguageHint({ strings: { hello: 'Bonjour' } }, 'fr')).toEqual({
        fr: { hello: 'Bonjour' },
      });
    });

    it('leaves a real language code alone', () => {
      expect(applyLanguageHint({ en: { hello: 'Hello' } }, 'fr')).toEqual({
        en: { hello: 'Hello' },
      });
    });
  });

  describe('mergeItemSubset', () => {
    it('applies key renames using the original source key', () => {
      const existing: TranslationItem[] = [
        { key: 'auth.login', en: 'Sign In', my: 'ဝင်ရန်' },
        { key: 'auth.logout', en: 'Sign Out', my: 'ထွက်ရန်' },
        { key: 'hidden.row', en: 'Hidden', my: 'ဖျောက်' },
      ];
      const subset: TranslationItem[] = [
        { key: 'auth.signin', en: 'Sign In', my: 'ဝင်ရန်', __sourceKey: 'auth.login' } as TranslationItem,
        { key: 'auth.logout', en: 'Sign Out', my: 'ထွက်ရန်', __sourceKey: 'auth.logout' } as TranslationItem,
      ];
      const merged = mergeItemSubset(existing, subset);
      expect(merged.map(i => i.key)).toEqual(['auth.signin', 'auth.logout', 'hidden.row']);
      expect(merged.find(i => i.key === 'auth.signin')?.en).toBe('Sign In');
      expect(merged.find(i => i.key === 'hidden.row')?.en).toBe('Hidden');
    });
  });

  describe('localePathFromFile', () => {
    it('prefers webkitRelativePath when present', () => {
      const file = new File(['<resources></resources>'], 'strings.xml');
      Object.defineProperty(file, 'webkitRelativePath', { value: 'res/values-fr/strings.xml' });
      expect(localePathFromFile(file)).toBe('res/values-fr/strings.xml');
    });
  });

  describe('translationItemsToLangMap', () => {
    it('pivots spreadsheet rows into a language map', () => {
      const map = translationItemsToLangMap(
        [{ key: 'hello', en: 'Hello', my: 'မင်္ဂလာပါ' }],
        ['en', 'my']
      );
      expect(map).toEqual({
        en: { hello: 'Hello' },
        my: { hello: 'မင်္ဂလာပါ' },
      });
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
      expect(() => parseJsonFile('invalid json', 'test.json')).toThrow(/JSON/i);
      expect(() => parseJsonFile('123', 'test.json')).toThrow(
        'Invalid JSON structure: Root must be an object.'
      );
      expect(() => parseJsonFile('null', 'test.json')).toThrow(
        'Invalid JSON structure: Root must be an object.'
      );
    });

    it('parses single language root JSON without prepending language prefix to keys', () => {
      const singleRootJson = {
        en: {
          auth: {
            login: 'Log In',
          },
        },
      };
      const res = parseJsonFile(JSON.stringify(singleRootJson), 'messages.json');
      expect(res.en).toBeDefined();
      expect(res.en['auth.login']).toBe('Log In');
      // Should NOT have 'en.auth.login'
      expect(res.en['en.auth.login']).toBeUndefined();
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

    it('matches string tags with extra attributes and reversed attribute order', () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="static_label" translatable="false">Copyright</string>
    <string formatted="false" name="version_info">Version 1.0</string>
</resources>`;

      const res = parseAndroidXml(xml, 'values-en.xml');
      expect(res.en).toBeDefined();
      expect(res.en['static_label']).toBe('Copyright');
      expect(res.en['version_info']).toBe('Version 1.0');
    });

    it('uses Android values-xx folder as the language code', () => {
      const xml = `<resources><string name="hello">Bonjour</string></resources>`;
      const res = parseAndroidXml(xml, 'android/app/src/main/res/values-fr/strings.xml');
      expect(res.fr?.hello).toBe('Bonjour');
      expect(res.strings).toBeUndefined();
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

    it('preserves URLs containing // inside quoted string values', () => {
      const stringsWithUrls = `
// Documentation link
"help.website" = "https://example.com/docs";
"api.endpoint" = "http://api.service.io/v1";
`;
      const res = parseIosStrings(stringsWithUrls, 'en.lproj');
      expect(res.en).toBeDefined();
      expect(res.en['help.website']).toBe('https://example.com/docs');
      expect(res.en['api.endpoint']).toBe('http://api.service.io/v1');
    });

    it('uses the enclosing lproj folder as the language code', () => {
      const res = parseIosStrings('"ok" = "OK";', 'ios/Runner/fr.lproj/Localizable.strings');
      expect(res.fr?.ok).toBe('OK');
      expect(res.localizable).toBeUndefined();
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

    it('parses multiline block scalar |- without dropping lines', () => {
      const yaml = `
en:
  long_text: |-
    First paragraph of text.
    Second paragraph of text.
`;
      const res = parseYamlFile(yaml, 'en.yaml');
      expect(res.en).toBeDefined();
      expect(res.en['long_text']).toBe('First paragraph of text.\nSecond paragraph of text.');
    });
  });

  describe('parseSpreadsheet', () => {
    it('parses Excel workbook binary buffer correctly', async () => {
      const workbook = XLSX.utils.book_new();
      const sheetData = [
        ['Key', 'en', 'my'],
        ['app.title', 'JSON Link', 'ဂျေဆန် လင့်ခ်'],
        ['app.btn', 'Submit', 'တင်သွင်းပါ'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

      const result = await parseSpreadsheet(buffer);
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

    it('throws error when spreadsheet has fewer than 2 rows', async () => {
      const workbook = XLSX.utils.book_new();
      const sheetData = [['Key', 'en']];
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

      await expect(parseSpreadsheet(buffer)).rejects.toThrow(
        'Spreadsheet must contain at least a header row and one data row.'
      );
    });
  });

  describe('parseArbFile', () => {
    it('parses standard Flutter ARB file with @@locale and descriptions', () => {
      const arbContent = JSON.stringify({
        '@@locale': 'en',
        '@@last_modified': '2026-09-11T12:00:00Z',
        'appTitle': 'JSON Link',
        '@appTitle': {
          'description': 'Main title of the application shown on navbar',
        },
        'btnSubmit': 'Submit Form',
        '@btnSubmit': {
          'description': 'Label for the submit button',
        },
        'welcomeUser': 'Welcome, {name}!',
      }, null, 2);

      const result = parseArbFile(arbContent, 'app_en.arb');
      expect(result.languages).toEqual(['en']);
      expect(result.items).toHaveLength(3);
      expect(result.items[0]).toEqual({
        key: 'appTitle',
        en: 'JSON Link',
        description: 'Main title of the application shown on navbar',
      });
      expect(result.items[1]).toEqual({
        key: 'btnSubmit',
        en: 'Submit Form',
        description: 'Label for the submit button',
      });
      expect(result.items[2]).toEqual({
        key: 'welcomeUser',
        en: 'Welcome, {name}!',
      });
    });

    it('infers language from filename if @@locale is absent', () => {
      const arbContent = JSON.stringify({
        'greeting': 'မင်္ဂလာပါ',
        '@greeting': {
          'description': 'Burmese standard greeting',
        },
      });

      const result = parseArbFile(arbContent, 'intl_my.arb');
      expect(result.languages).toEqual(['my']);
      expect(result.items[0]).toEqual({
        key: 'greeting',
        my: 'မင်္ဂလာပါ',
        description: 'Burmese standard greeting',
      });
    });

    it('supports @locale attribute as fallback for language code', () => {
      const arbContent = JSON.stringify({
        '@locale': 'th',
        'save': 'บันทึก',
      });

      const result = parseArbFile(arbContent, 'messages.arb');
      expect(result.languages).toEqual(['th']);
      expect(result.items[0].key).toBe('save');
      expect(result.items[0].th).toBe('บันทึก');
    });

    it('throws error for invalid JSON or non-object root', () => {
      expect(() => parseArbFile('invalid json', 'app.arb')).toThrow(/JSON/i);
      expect(() => parseArbFile('["not", "an", "object"]', 'app.arb')).toThrow(
        'Invalid ARB structure: Root must be a JSON object.'
      );
    });
  });

  describe('parseXliffFile', () => {
    it('parses XLIFF 1.2 files correctly with source and target', () => {
      const xliffContent = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" target-language="my" datatype="plaintext" original="messages">
    <body>
      <trans-unit id="app.greeting">
        <source>Hello World</source>
        <target>မင်္ဂလာပါကမ္ဘာလောက</target>
      </trans-unit>
      <trans-unit id="app.save">
        <source>Save &amp; Exit</source>
        <target>သိမ်းဆည်းပြီး ထွက်မည်</target>
      </trans-unit>
    </body>
  </file>
</xliff>`;

      const result = parseXliffFile(xliffContent, 'messages_my.xlf');
      expect(result).toHaveProperty('my');
      expect(result.my['app.greeting']).toBe('မင်္ဂလာပါကမ္ဘာလောက');
      expect(result.my['app.save']).toBe('သိမ်းဆည်းပြီး ထွက်မည်');
    });

    it('parses XLIFF 2.0 unit format', () => {
      const xliff2 = `<xliff version="2.0" xmlns="urn:oasis:names:tc:xliff:document:2.0" srcLang="en" trgLang="es">
  <file id="f1">
    <unit id="btn.ok">
      <segment>
        <source>OK</source>
        <target>Aceptar</target>
      </segment>
    </unit>
  </file>
</xliff>`;

      const result = parseXliffFile(xliff2, 'strings.xliff');
      expect(result).toHaveProperty('es');
      expect(result.es['btn.ok']).toBe('Aceptar');
    });
  });

  describe('parsePoFile', () => {
    it('parses GNU gettext .po files and preserves developer keys from #: reference comments', () => {
      const poContent = `msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\\n"
"Language: ja\\n"

#. Greeting message
#: app.welcome
msgid "Welcome to our application"
msgstr "ようこそ"

#: app.multiline
msgid "Line 1\\n"
"Line 2"
msgstr "1行目\\n"
"2行目"
`;

      const result = parsePoFile(poContent, 'ja.po');
      expect(result).toHaveProperty('ja');
      expect(result.ja['app.welcome']).toBe('ようこそ');
      expect(result.ja['app.multiline']).toBe('1行目\n2行目');
    });

    it('falls back to msgid as key when no #: reference comment exists', () => {
      const poContent = `msgid ""
msgstr ""
"Language: my\\n"

msgid "Save Project"
msgstr "ပရောဂျက်သိမ်းရန်"
`;

      const result = parsePoFile(poContent, 'my.po');
      expect(result).toHaveProperty('my');
      expect(result.my['Save Project']).toBe('ပရောဂျက်သိမ်းရန်');
    });
  });
});

