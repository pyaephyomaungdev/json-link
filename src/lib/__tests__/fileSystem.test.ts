import { describe, it, expect, vi } from 'vitest';
import {
  isFileSystemAccessSupported,
  readTranslationsFromDirectory,
  writeTranslationsToDirectory,
} from '../fileSystem';
import { TranslationItem } from '@/types';

describe('fileSystem.ts', () => {
  it('detects file system access support accurately', () => {
    const supported = isFileSystemAccessSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('reads translation items from mock directory handle with JSON files', async () => {
    const mockFileEn = new File(
      [JSON.stringify({ greeting: 'Hello', save: 'Save' })],
      'en.json',
      { type: 'application/json' }
    );
    const mockFileMy = new File(
      [JSON.stringify({ greeting: 'မင်္ဂလာပါ', save: 'သိမ်းဆည်းပါ' })],
      'my.json',
      { type: 'application/json' }
    );

    const mockEntries: [string, any][] = [
      [
        'en.json',
        {
          kind: 'file',
          name: 'en.json',
          getFile: vi.fn().mockResolvedValue(mockFileEn),
        },
      ],
      [
        'my.json',
        {
          kind: 'file',
          name: 'my.json',
          getFile: vi.fn().mockResolvedValue(mockFileMy),
        },
      ],
    ];

    const mockDirHandle: any = {
      name: 'locales',
      kind: 'directory',
      [Symbol.asyncIterator]: () => {
        let index = 0;
        return {
          next: async () => {
            if (index < mockEntries.length) {
              return { value: mockEntries[index++], done: false };
            }
            return { value: undefined, done: true };
          },
        };
      },
    };

    const result = await readTranslationsFromDirectory(mockDirHandle);
    expect(result.projectName).toBe('locales');
    expect(result.languages).toContain('en');
    expect(result.languages).toContain('my');
    expect(result.items.length).toBe(2);

    const greetingItem = result.items.find(i => i.key === 'greeting');
    expect(greetingItem?.en).toBe('Hello');
    expect(greetingItem?.my).toBe('မင်္ဂလာပါ');
  });

  it('skips non-locale JSON such as package.json while ingesting language files', async () => {
    const mockFileEn = new File(
      [JSON.stringify({ greeting: 'Hello' })],
      'en.json',
      { type: 'application/json' }
    );
    const mockPackage = new File(
      [JSON.stringify({ name: 'poison', dependencies: { react: '19.0.0' } })],
      'package.json',
      { type: 'application/json' }
    );

    const mockEntries: [string, any][] = [
      [
        'en.json',
        {
          kind: 'file',
          name: 'en.json',
          getFile: vi.fn().mockResolvedValue(mockFileEn),
        },
      ],
      [
        'package.json',
        {
          kind: 'file',
          name: 'package.json',
          getFile: vi.fn().mockResolvedValue(mockPackage),
        },
      ],
    ];

    const mockDirHandle: any = {
      name: 'src',
      kind: 'directory',
      [Symbol.asyncIterator]: () => {
        let index = 0;
        return {
          next: async () => {
            if (index < mockEntries.length) {
              return { value: mockEntries[index++], done: false };
            }
            return { value: undefined, done: true };
          },
        };
      },
    };

    const result = await readTranslationsFromDirectory(mockDirHandle);
    expect(result.items.find(i => i.key === 'greeting')?.en).toBe('Hello');
    expect(result.items.find(i => i.key === 'name')).toBeUndefined();
    expect(result.items.find(i => i.key === 'dependencies')).toBeUndefined();
  });

  it('writes updated translations to mock directory handle', async () => {
    const writtenFiles = new Map<string, string>();

    const mockDirHandle: any = {
      name: 'locales',
      getFileHandle: vi.fn().mockImplementation((name: string) => {
        return Promise.resolve({
          name,
          createWritable: vi.fn().mockResolvedValue({
            write: vi.fn().mockImplementation((content: string) => {
              writtenFiles.set(name, content);
              return Promise.resolve();
            }),
            close: vi.fn().mockResolvedValue(undefined),
          }),
        });
      }),
    };

    const items: TranslationItem[] = [
      {
        key: 'app.title',
        en: 'My App',
        my: 'ကျွန်ုပ်၏အက်ပ်',
        status: 'approved',
      },
    ];

    const result = await writeTranslationsToDirectory(
      mockDirHandle,
      items,
      ['en', 'my'],
      'my-project',
      { primaryFormat: 'json', saveProjectMeta: true }
    );

    expect(result.savedFiles).toContain('en.json');
    expect(result.savedFiles).toContain('my.json');
    expect(result.savedFiles).toContain('.jsonlink.meta.json');
    expect(writtenFiles.has('en.json')).toBe(true);
    expect(writtenFiles.get('en.json')).toContain('"title": "My App"');
  });

  function mockDirFromFiles(name: string, files: File[]) {
    const mockEntries: [string, any][] = files.map(file => [
      file.name,
      {
        kind: 'file',
        name: file.name,
        getFile: vi.fn().mockResolvedValue(file),
      },
    ]);
    return {
      name,
      kind: 'directory',
      [Symbol.asyncIterator]: () => {
        let index = 0;
        return {
          next: async () => {
            if (index < mockEntries.length) {
              return { value: mockEntries[index++], done: false };
            }
            return { value: undefined, done: true };
          },
        };
      },
    };
  }

  it('prefers real locale files over .jsonlink.meta.json', async () => {
    const meta = new File(
      [
        JSON.stringify({
          format: 'jsonlink',
          version: '1.0',
          name: 'stale-meta',
          languages: ['en'],
          items: [{ key: 'old.key', en: 'from meta' }],
        }),
      ],
      '.jsonlink.meta.json',
      { type: 'application/json' }
    );
    const en = new File(
      [JSON.stringify({ greeting: 'Hello' })],
      'en.json',
      { type: 'application/json' }
    );

    const result = await readTranslationsFromDirectory(mockDirFromFiles('locales', [meta, en]) as any);
    expect(result.primaryFormat).toBe('json');
    expect(result.items.find(i => i.key === 'greeting')?.en).toBe('Hello');
    expect(result.items.find(i => i.key === 'old.key')).toBeUndefined();
    expect(result.projectName).toBe('stale-meta');
  });

  it('writes ARB files when primaryFormat is arb', async () => {
    const writtenFiles = new Map<string, string>();
    const mockDirHandle: any = {
      name: 'l10n',
      getFileHandle: vi.fn().mockImplementation((name: string) => {
        return Promise.resolve({
          name,
          createWritable: vi.fn().mockResolvedValue({
            write: vi.fn().mockImplementation((content: string) => {
              writtenFiles.set(name, content);
              return Promise.resolve();
            }),
            close: vi.fn().mockResolvedValue(undefined),
          }),
        });
      }),
    };

    const result = await writeTranslationsToDirectory(
      mockDirHandle,
      [{ key: 'app.title', en: 'My App' }],
      ['en'],
      'flutter-app',
      { primaryFormat: 'arb', saveProjectMeta: false }
    );

    expect(result.savedFiles).toContain('app_en.arb');
    expect(writtenFiles.get('app_en.arb')).toContain('"app.title": "My App"');
    expect(writtenFiles.has('en.json')).toBe(false);
  });
});
