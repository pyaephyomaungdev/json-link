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
      expect(updatedFiles.length).toBe(2);
      expect(fs.existsSync(path.join(localesDir, 'en.json'))).toBe(true);
      expect(fs.existsSync(path.join(localesDir, 'my.json'))).toBe(true);

      const readBack = readLocalesFromDisk(localesDir, false);
      expect(readBack.languages.sort()).toEqual(['en', 'my'].sort());
      expect(readBack.records.length).toBe(2);

      const titleRecord = readBack.records.find(r => r.key === 'app.title');
      expect(titleRecord?.en).toBe('App');
      expect(titleRecord?.my).toBe('အက်ပ်');
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
