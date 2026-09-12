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
});
