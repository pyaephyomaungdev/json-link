/**
 * OpenRouter AI Client for Localization Translations (BYOK)
 */

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export const POPULAR_MODELS: OpenRouterModel[] = [
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Recommended)',
    description: 'Ultra-fast, highly accurate multilingual translations and economical.',
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'High-reasoning model for nuanced, complex context translations.',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    description: 'Exceptional linguistic capability and very cost-effective.',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and reliable localization across common languages.',
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    description: 'High speed and natural tone for UI text.',
  },
];

import { encryptSecret, decryptSecret } from './crypto';

const SESSION_KEY_API_KEY = 'jsonlink_openrouter_api_key_session';
const LOCAL_KEY_API_KEY_ENC = 'jsonlink_openrouter_api_key_enc';
const LOCAL_KEY_REMEMBER = 'jsonlink_openrouter_remember_key';
const LEGACY_STORAGE_KEY_API_KEY = 'jsonlink_openrouter_api_key';
const STORAGE_KEY_MODEL = 'jsonlink_openrouter_model';

/**
 * Checks whether the user has opted to remember the API key on this device.
 */
export function isKeyRemembered(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(LOCAL_KEY_REMEMBER) === 'true';
  } catch {
    return false;
  }
}

let inMemoryApiKey = '';

/**
 * Synchronously retrieves the API key from active session memory (if present).
 */
export function getStoredApiKeySync(): string {
  return inMemoryApiKey;
}

/**
 * Retrieves the stored API key.
 * 1. Checks in-memory cache first, then decrypts from sessionStorage.
 * 2. If remembered on device, decrypts AES-GCM encrypted key from localStorage.
 * 3. Migrates any legacy plain-text key into the encrypted vault automatically.
 */
export async function getStoredApiKey(): Promise<string> {
  if (inMemoryApiKey) return inMemoryApiKey;

  try {
    // 1. Check in-session storage first (AES-GCM encrypted)
    if (typeof sessionStorage !== 'undefined') {
      const sessionCipher = sessionStorage.getItem(SESSION_KEY_API_KEY);
      if (sessionCipher) {
        const decrypted = await decryptSecret(sessionCipher);
        if (decrypted) {
          inMemoryApiKey = decrypted;
          return decrypted;
        }
      }
    }

    // 2. If user opted to remember on this device, load and decrypt from localStorage
    if (typeof localStorage !== 'undefined' && isKeyRemembered()) {
      const encKey = localStorage.getItem(LOCAL_KEY_API_KEY_ENC);
      if (encKey) {
        const decrypted = await decryptSecret(encKey);
        if (decrypted) {
          inMemoryApiKey = decrypted;
          return decrypted;
        }
      }

      // 3. Migrate legacy plain-text key to encrypted vault and remove plaintext
      const legacyKey = localStorage.getItem(LEGACY_STORAGE_KEY_API_KEY);
      if (legacyKey) {
        inMemoryApiKey = legacyKey;
        try {
          localStorage.removeItem(LEGACY_STORAGE_KEY_API_KEY);
          const encLegacy = await encryptSecret(legacyKey);
          if (encLegacy) {
            localStorage.setItem(LOCAL_KEY_API_KEY_ENC, encLegacy);
          }
        } catch {}
        return legacyKey;
      }
    }
  } catch (e) {
    console.warn('Failed to retrieve stored API key:', e);
  }
  return '';
}

/**
 * Stores API key securely:
 * - Always stored encrypted in sessionStorage for current tab session (auto-wiped when tab closes).
 * - Only persisted to localStorage if `remember = true`, where it is AES-GCM encrypted.
 */
export async function setStoredApiKey(key: string, remember = false): Promise<void> {
  const clean = key.trim();
  if (!clean) {
    clearStoredApiKey();
    return;
  }

  inMemoryApiKey = clean;

  try {
    const cipher = await encryptSecret(clean);

    // Save encrypted payload to current tab session
    if (typeof sessionStorage !== 'undefined' && cipher) {
      sessionStorage.setItem(SESSION_KEY_API_KEY, cipher);
    }

    // Handle persistent storage
    if (typeof localStorage !== 'undefined') {
      if (remember) {
        localStorage.setItem(LOCAL_KEY_REMEMBER, 'true');
        if (cipher) {
          localStorage.setItem(LOCAL_KEY_API_KEY_ENC, cipher);
        }
        localStorage.removeItem(LEGACY_STORAGE_KEY_API_KEY);
      } else {
        localStorage.removeItem(LOCAL_KEY_REMEMBER);
        localStorage.removeItem(LOCAL_KEY_API_KEY_ENC);
        localStorage.removeItem(LEGACY_STORAGE_KEY_API_KEY);
      }
    }
  } catch (e) {
    console.error('Failed to set stored API key:', e);
  }
}

/**
 * Completely clears and revokes the API key from memory, session and persistent storage.
 */
export function clearStoredApiKey(): void {
  inMemoryApiKey = '';
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY_API_KEY);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCAL_KEY_REMEMBER);
      localStorage.removeItem(LOCAL_KEY_API_KEY_ENC);
      localStorage.removeItem(LEGACY_STORAGE_KEY_API_KEY);
    }
  } catch (e) {
    console.error('Failed to clear stored API key:', e);
  }
}

export function getStoredModel(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_MODEL) || 'google/gemini-2.5-flash';
  } catch {
    return 'google/gemini-2.5-flash';
  }
}

export function setStoredModel(model: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_MODEL, model);
  } catch (e) {
    console.error('Failed to save model to localStorage', e);
  }
}

const STORAGE_KEY_MODELS_CACHE = 'jsonlink_openrouter_models_cache';

/**
 * Fetches all available models directly from OpenRouter API
 */
export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    if (!res.ok) throw new Error('Failed to fetch OpenRouter models');
    const json = await res.json();
    if (Array.isArray(json?.data)) {
      const models: OpenRouterModel[] = json.data.map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description || '',
        pricing: m.pricing
          ? {
              prompt: String(m.pricing.prompt || '0'),
              completion: String(m.pricing.completion || '0'),
            }
          : undefined,
      }));

      // Sort alphabetically by name
      models.sort((a, b) => a.name.localeCompare(b.name));

      try {
        localStorage.setItem(STORAGE_KEY_MODELS_CACHE, JSON.stringify(models));
      } catch {}

      return models;
    }
  } catch (err) {
    console.warn('OpenRouter models fetch failed, using cached/popular models:', err);
    try {
      const cached = localStorage.getItem(STORAGE_KEY_MODELS_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return POPULAR_MODELS;
}

export function getCachedOpenRouterModels(): OpenRouterModel[] {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_MODELS_CACHE);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return POPULAR_MODELS;
}

import { GlossaryEntry } from './glossary';

export interface TranslationRequestItem {
  key: string;
  sourceText: string;
  description?: string;
}

export interface TranslateBatchOptions {
  apiKey: string;
  model: string;
  sourceLang: string;
  targetLang: string;
  items: TranslationRequestItem[];
  glossary?: GlossaryEntry[];
}

/**
 * Validates OpenRouter API Key by making a lightweight request
 */
export async function testOpenRouterKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey.trim()) {
    return { valid: false, error: 'API key cannot be empty.' };
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    });

    if (res.ok) {
      return { valid: true };
    }

    const data = await res.json().catch(() => ({}));
    return {
      valid: false,
      error: data?.error?.message || `HTTP ${res.status}: Unauthorized or Invalid API key.`,
    };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Network connection failed.' };
  }
}

/**
 * Language full names mapping for prompt context
 */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  my: 'Myanmar (Burmese Unicode)',
  ja: 'Japanese',
  zh: 'Chinese (Simplified)',
  'zh-tw': 'Chinese (Traditional)',
  th: 'Thai',
  ko: 'Korean',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  pt: 'Portuguese',
  it: 'Italian',
  ru: 'Russian',
  vi: 'Vietnamese',
  id: 'Indonesian',
  hi: 'Hindi',
  ar: 'Arabic',
};

export function getLanguageDisplayName(code: string): string {
  return LANGUAGE_NAMES[code.toLowerCase()] || code.toUpperCase();
}

export const BATCH_CHUNK_SIZE = 25;

/**
 * Exponential backoff fetcher for handling transient HTTP 429 rate limits and 503 gateway errors
 */
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    const response = await fetch(url, options);
    if (response.ok) return response;

    // Retry only on 429 (rate limit) or 502/503/504 (transient gateway errors)
    if ((response.status === 429 || response.status >= 502) && attempt < maxRetries) {
      attempt++;
      const baseDelay = Math.pow(2, attempt - 1) * 1000;
      const jitter = Math.floor(Math.random() * 400);
      await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
      continue;
    }

    return response;
  }
  throw new Error('Network request failed after maximum retries');
}

export interface TokenCostEstimate {
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
  estimatedTotalTokens: number;
  estimatedCostUsd: number;
}

/**
 * Estimates prompt/completion token count and total USD cost for a given batch translation
 */
export function estimateBatchTokenCost(
  items: TranslationRequestItem[],
  modelInfo?: OpenRouterModel | null
): TokenCostEstimate {
  let totalChars = 0;
  for (const item of items) {
    totalChars += (item.sourceText || '').length;
    if (item.description) totalChars += item.description.length;
  }

  // System prompt + formatting overhead ~300 tokens
  const estimatedPromptTokens = Math.max(50, Math.ceil(totalChars / 3.5) + 300);
  const estimatedCompletionTokens = Math.max(50, Math.ceil(totalChars / 3.5));
  const estimatedTotalTokens = estimatedPromptTokens + estimatedCompletionTokens;

  let estimatedCostUsd = 0;
  if (modelInfo?.pricing) {
    const promptRate = parseFloat(modelInfo.pricing.prompt || '0');
    const compRate = parseFloat(modelInfo.pricing.completion || '0');
    if (!isNaN(promptRate) && !isNaN(compRate)) {
      estimatedCostUsd =
        estimatedPromptTokens * promptRate + estimatedCompletionTokens * compRate;
    }
  }

  return {
    estimatedPromptTokens,
    estimatedCompletionTokens,
    estimatedTotalTokens,
    estimatedCostUsd,
  };
}

async function executeSingleChunkTranslate(
  options: TranslateBatchOptions
): Promise<Record<string, string>> {
  const { apiKey, items, targetLang, sourceLang = 'en', glossary, model } = options;

  const targetLangName = getLanguageDisplayName(targetLang);
  const sourceLangName = getLanguageDisplayName(sourceLang);

  let systemPrompt = `You are an expert native localization specialist translating UI copy and system messages from ${sourceLangName} to ${targetLangName}.
Strict Rules:
1. Translate accurately into natural, idiomatic ${targetLangName} appropriate for modern digital software UI.
2. PRESERVE ALL ICU placeholders, format strings, and interpolation variables EXACTLY AS WRITTEN:
   - ICU tokens like {name}, {count}, {amount, number, currency}, {gender, select, ...} MUST NOT be altered, translated, or removed.
   - Positional tokens like %s, %d, %1$s, $variable MUST NOT be modified.
   - HTML/XML tags like <b>, </b>, <a href="..."> MUST NOT be altered.
3. If an input text is a brand name, URL, technical identifier, or punctuation only, preserve it appropriately.
4. Output MUST be a valid JSON object where the keys match the exact input keys, and the values are the translated strings. Do NOT wrap output in markdown codeblocks. Do not include commentary.`;

  if (glossary && Object.keys(glossary).length > 0) {
    const glossaryEntries = Object.entries(glossary)
      .map(([src, trg]) => `  "${src}": "${trg}"`)
      .join('\n');
    systemPrompt += `\n\nMandatory Terminology Glossary (You MUST translate these exact terms with these exact targets):\n{\n${glossaryEntries}\n}`;
  }

  const userPayload: Record<string, any> = {
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    strings: items.reduce((acc, item) => {
      acc[item.key] = item.sourceText;
      return acc;
    }, {} as Record<string, string>),
  };

  const hasDescriptions = items.some(it => it.description && it.description.trim());
  if (hasDescriptions) {
    userPayload.contextNotes = items.reduce((acc, item) => {
      if (item.description && item.description.trim()) {
        acc[item.key] = item.description.trim();
      }
      return acc;
    }, {} as Record<string, string>);
  }

  const response = await fetchWithBackoff('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location?.origin || 'https://jsonlink.dev' : 'https://jsonlink.dev',
      'X-Title': 'JSON Link Localization Tool',
    },
    body: JSON.stringify({
      model: model || 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
      temperature: 0.2,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData?.error?.message ||
      `OpenRouter API error (HTTP ${response.status}: ${response.statusText})`;
    throw new Error(message);
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error('Received empty response from OpenRouter.');
  }

  const expectedKeys = items.map(it => it.key);
  return parseAiJsonResponse(rawContent, expectedKeys);
}

/**
 * Translates a batch of localization strings while strictly preserving ICU parameters.
 * Automatically chunks requests into batches of 25 with bounded concurrency to avoid token limit overflow.
 */
export async function translateBatchWithOpenRouter(
  options: TranslateBatchOptions
): Promise<Record<string, string>> {
  const { apiKey, items } = options;
  if (!apiKey.trim()) {
    throw new Error('Please provide an OpenRouter API key.');
  }

  if (items.length === 0) {
    return {};
  }

  if (items.length <= BATCH_CHUNK_SIZE) {
    return executeSingleChunkTranslate(options);
  }

  // Chunk items into slices of BATCH_CHUNK_SIZE
  const chunks: TranslationRequestItem[][] = [];
  for (let i = 0; i < items.length; i += BATCH_CHUNK_SIZE) {
    chunks.push(items.slice(i, i + BATCH_CHUNK_SIZE));
  }

  const results: Record<string, string> = {};
  // Process up to 2 chunks concurrently
  for (let i = 0; i < chunks.length; i += 2) {
    const pair = chunks.slice(i, i + 2);
    const pairOutputs = await Promise.all(
      pair.map(chunk => executeSingleChunkTranslate({ ...options, items: chunk }))
    );
    for (const chunkRes of pairOutputs) {
      Object.assign(results, chunkRes);
    }
  }

  return results;
}

/**
 * Safely parses AI-generated JSON with multiple fallback and auto-repair strategies:
 * 1. Direct JSON.parse
 * 2. Strip Markdown code fences (```json ... ```)
 * 3. Extract JSON object substring between first '{' and last '}'
 * 4. Auto-repair truncated JSON (closing dangling quotes and brackets)
 * 5. Regex-based key-value extraction for partial recovery of completed translated pairs
 */
export function parseAiJsonResponse(
  rawContent: string,
  expectedKeys?: string[]
): Record<string, string> {
  if (!rawContent || typeof rawContent !== 'string') {
    return {};
  }

  let cleaned = rawContent.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?\s*```$/i, '')
      .trim();
  }

  // 1. Try direct parsing
  try {
    const parsed = JSON.parse(cleaned);
    const map = parsed.strings && typeof parsed.strings === 'object' ? parsed.strings : parsed;
    const res = sanitizeResultMap(map, expectedKeys);
    if (Object.keys(res).length > 0) return res;
  } catch {}

  // 2. Extract substring between first '{' and last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(candidate);
      const map = parsed.strings && typeof parsed.strings === 'object' ? parsed.strings : parsed;
      const res = sanitizeResultMap(map, expectedKeys);
      if (Object.keys(res).length > 0) return res;
    } catch {}
  }

  // 3. Auto-repair truncated JSON (e.g. cut off mid-string or mid-object)
  if (firstBrace !== -1) {
    const truncatedSub = cleaned.slice(firstBrace);
    const repairAttempts = ['"}', '"}}', '}', '"} }', '"} } }'];
    for (const repair of repairAttempts) {
      try {
        const repaired = truncatedSub + repair;
        const parsed = JSON.parse(repaired);
        const map = parsed.strings && typeof parsed.strings === 'object' ? parsed.strings : parsed;
        const res = sanitizeResultMap(map, expectedKeys);
        if (Object.keys(res).length > 0) return res;
      } catch {}
    }
  }

  // 4. Regex key-value pair recovery fallback:
  // Extracts any complete "key"\s*:\s*"value" pairs even if the overall JSON was truncated
  const recovered: Record<string, string> = {};
  const pairRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  let match: RegExpExecArray | null;

  while ((match = pairRegex.exec(cleaned)) !== null) {
    const k = match[1];
    let v = match[2];
    try {
      v = JSON.parse(`"${v}"`);
    } catch {
      v = v.replace(/\\"/g, '"').replace(/\\n/g, '\n');
    }
    if (!expectedKeys || expectedKeys.includes(k)) {
      recovered[k] = v;
    }
  }

  if (Object.keys(recovered).length > 0) {
    return recovered;
  }

  console.error('Failed to parse AI translation JSON after all recovery attempts:', cleaned);
  throw new Error('Failed to parse translation response from AI. Please retry.');
}

function sanitizeResultMap(
  map: any,
  expectedKeys?: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!map || typeof map !== 'object') return result;

  const validKeys = expectedKeys || Object.keys(map);
  for (const k of validKeys) {
    if (typeof map[k] === 'string') {
      result[k] = map[k].trim();
    } else if (map[k] !== undefined && map[k] !== null && typeof map[k] !== 'object') {
      result[k] = String(map[k]).trim();
    }
  }
  return result;
}
