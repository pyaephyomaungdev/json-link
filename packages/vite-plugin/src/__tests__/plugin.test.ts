import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  flattenObject,
  unflattenObject,
  readLocalesFromDisk,
  writeLocalesToDisk,
} from '../fsUtils.js';
import { jsonLink } from '../plugin.js';

describe('Vite Plugin fsUtils & Middleware', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonlink-fs-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('flattenObject and unflattenObject', () => {
    it('flattens nested objects into dotted keys', () => {
      const nested = {
        auth: {
          login: {
            title: 'Sign In',
            button: 'Submit',
          },
        },
        common: 'OK',
      };
      const flat = flattenObject(nested);
      expect(flat['auth.login.title']).toBe('Sign In');
      expect(flat['auth.login.button']).toBe('Submit');
      expect(flat['common']).toBe('OK');
    });

    it('unflattens dotted keys back into a nested object', () => {
      const flat = {
        'auth.login.title': 'Sign In',
        'auth.login.button': 'Submit',
      };
      const nested = unflattenObject(flat);
      expect(nested.auth.login.title).toBe('Sign In');
      expect(nested.auth.login.button).toBe('Submit');
    });

    it('neutralizes prototype pollution keys in unflattenObject', () => {
      const malicious = {
        'safe.field': 'ok',
        '__proto__.hacked': 'danger',
        'constructor.prototype.bad': 'danger2',
      };
      const res = unflattenObject(malicious);
      expect(res).toEqual({ safe: { field: 'ok' } });
      expect(({} as any).hacked).toBeUndefined();
      expect(({} as any).bad).toBeUndefined();
    });
  });

  describe('readLocalesFromDisk and writeLocalesToDisk', () => {
    it('reads empty state if directory does not exist', () => {
      const nonExistent = path.join(tempDir, 'does-not-exist');
      const { languages, records } = readLocalesFromDisk(nonExistent);
      expect(languages).toEqual([]);
      expect(records).toEqual([]);
    });

    it('writes and reads back multiple translation files', () => {
      const localesDir = path.join(tempDir, 'locales');
      const records = [
        { key: 'app.title', en: 'App', my: 'အက်ပ်' },
        { key: 'btn.save', en: 'Save', my: 'သိမ်းမည်' },
      ];
      const languages = ['en', 'my'];

      const { updatedFiles } = writeLocalesToDisk(localesDir, records, languages, false, 2);
      expect(updatedFiles.length).toBe(3); // en.json, my.json, translations.d.ts
      expect(fs.existsSync(path.join(localesDir, 'en.json'))).toBe(true);
      expect(fs.existsSync(path.join(localesDir, 'my.json'))).toBe(true);
      expect(fs.existsSync(path.join(localesDir, 'translations.d.ts'))).toBe(true);

      const dtsContent = fs.readFileSync(path.join(localesDir, 'translations.d.ts'), 'utf-8');
      expect(dtsContent).toContain('"app.title"');
      expect(dtsContent).toContain('"btn.save"');
      expect(dtsContent).toContain('"en" | "my"');

      const readBack = readLocalesFromDisk(localesDir, false);
      expect(readBack.languages.sort()).toEqual(['en', 'my'].sort());
      expect(readBack.records.length).toBe(2);

      const titleRecord = readBack.records.find(r => r.key === 'app.title');
      expect(titleRecord?.en).toBe('App');
      expect(titleRecord?.my).toBe('အက်ပ်');
    });

    it('updates translations.d.ts when a key or language is removed/edited', () => {
      const localesDir = path.join(tempDir, 'locales-edit');
      const initialRecords = [
        { key: 'app.title', en: 'App', my: 'အက်ပ်' },
        { key: 'auth.welcome', en: 'Welcome', my: 'ကြိုဆိုပါတယ်' },
      ];
      writeLocalesToDisk(localesDir, initialRecords, ['en', 'my'], false, 2);

      // Now simulate user deleting auth.welcome and adding ja
      const updatedRecords = [
        { key: 'app.title', en: 'App Updated', ja: 'アプリ' },
      ];
      writeLocalesToDisk(localesDir, updatedRecords, ['en', 'ja'], false, 2);

      // Verify my.json was removed from disk because 'my' is no longer in languages
      expect(fs.existsSync(path.join(localesDir, 'my.json'))).toBe(false);
      expect(fs.existsSync(path.join(localesDir, 'ja.json'))).toBe(true);

      // Verify translations.d.ts has new key, removed old key, and new language union
      const dtsContent = fs.readFileSync(path.join(localesDir, 'translations.d.ts'), 'utf-8');
      expect(dtsContent).toContain('"app.title"');
      expect(dtsContent).not.toContain('"auth.welcome"');
      expect(dtsContent).toContain('"en" | "ja"');
      expect(dtsContent).not.toContain('"my"');
    });
  });

  describe('jsonLink plugin structure', () => {
    it('creates a Vite plugin with name vite-plugin-json-link and apply serve', () => {
      const plugin = jsonLink({ localesDir: './locales' });
      expect(plugin.name).toBe('vite-plugin-json-link');
      expect(plugin.apply).toBe('serve');
      expect(typeof plugin.configureServer).toBe('function');
    });
  });
});
