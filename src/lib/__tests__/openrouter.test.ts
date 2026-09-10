import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  POPULAR_MODELS,
  getLanguageDisplayName,
  getStoredApiKey,
  setStoredApiKey,
  isKeyRemembered,
  clearStoredApiKey,
  getStoredModel,
  setStoredModel,
  getCachedOpenRouterModels,
  testOpenRouterKey,
  translateBatchWithOpenRouter,
} from '../openrouter';

describe('openrouter.ts', () => {
  const mockLocalStorage: Record<string, string> = {};
  const mockSessionStorage: Record<string, string> = {};

  beforeEach(() => {
    for (const k in mockLocalStorage) delete mockLocalStorage[k];
    for (const k in mockSessionStorage) delete mockSessionStorage[k];

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        mockLocalStorage[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
    });

    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        mockSessionStorage[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockSessionStorage[key];
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
    it('saves in sessionStorage only by default (remember = false)', async () => {
      expect(await getStoredApiKey()).toBe('');
      await setStoredApiKey('sk-or-v1-session-key', false);

      expect(isKeyRemembered()).toBe(false);
      expect(await getStoredApiKey()).toBe('sk-or-v1-session-key');
      expect(mockSessionStorage['jsonlink_openrouter_api_key_session']).toBe('sk-or-v1-session-key');
      expect(mockLocalStorage['jsonlink_openrouter_api_key_enc']).toBeUndefined();
    });

    it('encrypts in localStorage when remember = true', async () => {
      await setStoredApiKey('sk-or-v1-secret', true);
      expect(isKeyRemembered()).toBe(true);
      expect(mockLocalStorage['jsonlink_openrouter_remember_key']).toBe('true');

      // Check that localStorage does NOT contain the raw plain-text key
      const storedEnc = mockLocalStorage['jsonlink_openrouter_api_key_enc'];
      expect(storedEnc).toBeDefined();
      expect(storedEnc).not.toContain('sk-or-v1-secret');

      // Clear session storage to simulate reopening browser
      delete mockSessionStorage['jsonlink_openrouter_api_key_session'];

      // Successfully decrypts back
      const retrieved = await getStoredApiKey();
      expect(retrieved).toBe('sk-or-v1-secret');
    });

    it('clears stored API key completely', async () => {
      await setStoredApiKey('sk-or-v1-temp', true);
      clearStoredApiKey();

      expect(isKeyRemembered()).toBe(false);
      expect(await getStoredApiKey()).toBe('');
      expect(mockSessionStorage['jsonlink_openrouter_api_key_session']).toBeUndefined();
      expect(mockLocalStorage['jsonlink_openrouter_api_key_enc']).toBeUndefined();
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
