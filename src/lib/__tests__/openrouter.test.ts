import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  POPULAR_MODELS,
  getLanguageDisplayName,
  getStoredApiKey,
  setStoredApiKey,
  getStoredModel,
  setStoredModel,
  getCachedOpenRouterModels,
  testOpenRouterKey,
  translateBatchWithOpenRouter,
} from '../openrouter';

describe('openrouter.ts', () => {
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    for (const k in mockStorage) delete mockStorage[k];
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

  it('includes popular models with Gemini, DeepSeek, GPT-4o-mini', () => {
    expect(POPULAR_MODELS.length).toBeGreaterThan(3);
    const ids = POPULAR_MODELS.map(m => m.id);
    expect(ids).toContain('google/gemini-2.5-flash');
    expect(ids).toContain('deepseek/deepseek-chat');
    expect(ids).toContain('openai/gpt-4o-mini');
  });

  describe('getLanguageDisplayName', () => {
    it('returns natural language display names', () => {
      expect(getLanguageDisplayName('en')).toBe('English');
      expect(getLanguageDisplayName('my')).toBe('Myanmar (Burmese Unicode)');
      expect(getLanguageDisplayName('ja')).toBe('Japanese');
      expect(getLanguageDisplayName('xyz')).toBe('XYZ');
    });
  });

  describe('API key and Model storage', () => {
    it('persists and retrieves API key', () => {
      expect(getStoredApiKey()).toBe('');
      setStoredApiKey('sk-or-v1-testkey');
      expect(getStoredApiKey()).toBe('sk-or-v1-testkey');

      setStoredApiKey('');
      expect(getStoredApiKey()).toBe('');
    });

    it('persists and retrieves selected model', () => {
      expect(getStoredModel()).toBe('google/gemini-2.5-flash');
      setStoredModel('deepseek/deepseek-chat');
      expect(getStoredModel()).toBe('deepseek/deepseek-chat');
    });

    it('returns popular models when cache is empty', () => {
      const models = getCachedOpenRouterModels();
      expect(models).toEqual(POPULAR_MODELS);
    });
  });

  describe('validation and error handling', () => {
    it('returns error when testing empty API key', async () => {
      const res = await testOpenRouterKey('');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('API key cannot be empty.');
    });

    it('throws error when translating without API key', async () => {
      await expect(
        translateBatchWithOpenRouter({
          apiKey: '',
          model: 'google/gemini-2.5-flash',
          sourceLang: 'en',
          targetLang: 'my',
          items: [{ key: 'hello', sourceText: 'Hello' }],
        })
      ).rejects.toThrow('Please provide an OpenRouter API key.');
    });

    it('returns empty object when items list is empty', async () => {
      const res = await translateBatchWithOpenRouter({
        apiKey: 'sk-mock-key',
        model: 'google/gemini-2.5-flash',
        sourceLang: 'en',
        targetLang: 'my',
        items: [],
      });
      expect(res).toEqual({});
    });
  });
});
