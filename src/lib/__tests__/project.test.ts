import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseProjectFile,
  saveLocalDraft,
  loadLocalDraft,
  clearLocalDraft,
} from '../project';
import { TranslationItem } from '@/types';

describe('project.ts', () => {
  describe('parseProjectFile', () => {
    it('parses valid .jsonlink project json', () => {
      const payload = {
        format: 'jsonlink',
        version: '1.0.0',
        name: 'test-app',
        updatedAt: '2026-01-01T00:00:00.000Z',
        languages: ['en', 'my'],
        items: [{ key: 'app.name', en: 'App', my: 'အက်ပ်' }],
      };

      const result = parseProjectFile(JSON.stringify(payload));
      expect(result.format).toBe('jsonlink');
      expect(result.name).toBe('test-app');
      expect(result.languages).toEqual(['en', 'my']);
      expect(result.items).toHaveLength(1);
    });

    it('throws error when format or items/languages are missing', () => {
      expect(() => parseProjectFile(JSON.stringify({}))).toThrow(
        'Invalid .jsonlink project file structure.'
      );
      expect(() =>
        parseProjectFile(JSON.stringify({ format: 'jsonlink', items: 'not-an-array' }))
      ).toThrow();
    });
  });

  describe('localStorage draft persistence', () => {
    const mockStorage: Record<string, string> = {};

    beforeEach(() => {
      for (const key in mockStorage) {
        delete mockStorage[key];
      }

      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, val: string) => {
          mockStorage[key] = val;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
      });
    });

    it('saves draft to localStorage and loads it back', () => {
      const items: TranslationItem[] = [{ key: 'hello', en: 'Hello', my: 'မင်္ဂလာပါ' }];
      const languages = ['en', 'my'];

      saveLocalDraft('my-draft', items, languages);
      expect(localStorage.setItem).toHaveBeenCalled();

      const loaded = loadLocalDraft();
      expect(loaded).not.toBeNull();
      expect(loaded?.name).toBe('my-draft');
      expect(loaded?.items).toEqual(items);
      expect(loaded?.languages).toEqual(languages);
    });

    it('clears draft from localStorage', () => {
      saveLocalDraft('temp', [{ key: 'k', en: 'v' }], ['en']);
      clearLocalDraft();
      expect(localStorage.removeItem).toHaveBeenCalled();
      expect(loadLocalDraft()).toBeNull();
    });
  });
});
