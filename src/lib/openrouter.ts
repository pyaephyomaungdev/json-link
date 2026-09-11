/**
 * OpenRouter AI Client for Localization Translations (BYOK)
 */

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
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

/**
 * Synchronously retrieves the API key from active session storage (if present).
 */
export function getStoredApiKeySync(): string {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(SESSION_KEY_API_KEY) || '';
    }
  } catch {}
  return '';
}

/**
 * Retrieves the stored API key.
 * 1. Checks sessionStorage (tab/session lifetime).
 * 2. If remembered on device, decrypts AES-GCM encrypted key from localStorage.
 * 3. Migrates any legacy plain-text key into the encrypted vault automatically.
 */
export async function getStoredApiKey(): Promise<string> {
  try {
    // 1. Check in-session storage first (ultra-fast & secure)
    if (typeof sessionStorage !== 'undefined') {
      const sessionKey = sessionStorage.getItem(SESSION_KEY_API_KEY);
      if (sessionKey) return sessionKey;
    }

    // 2. If user opted to remember on this device, load and decrypt from localStorage
    if (typeof localStorage !== 'undefined' && isKeyRemembered()) {
      const encKey = localStorage.getItem(LOCAL_KEY_API_KEY_ENC);
      if (encKey) {
        const decrypted = await decryptSecret(encKey);
        if (decrypted) {
          // Cache in session storage for current tab
          try {
            sessionStorage.setItem(SESSION_KEY_API_KEY, decrypted);
          } catch {}
          return decrypted;
        }
      }

      // 3. Migrate legacy plain-text key to session only and remove from localStorage
      const legacyKey = localStorage.getItem(LEGACY_STORAGE_KEY_API_KEY);
      if (legacyKey) {
        try {
          sessionStorage.setItem(SESSION_KEY_API_KEY, legacyKey);
          localStorage.removeItem(LEGACY_STORAGE_KEY_API_KEY);
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
 * - Always stored in sessionStorage for current tab session (auto-wiped when tab closes).
 * - Only persisted to localStorage if `remember = true`, where it is AES-GCM encrypted.
 */
export async function setStoredApiKey(key: string, remember = false): Promise<void> {
  const clean = key.trim();
  if (!clean) {
    clearStoredApiKey();
    return;
  }

  try {
    // Save to current tab session
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY_API_KEY, clean);
    }

    // Handle persistent storage
    if (typeof localStorage !== 'undefined') {
      if (remember) {
        localStorage.setItem(LOCAL_KEY_REMEMBER, 'true');
        const cipher = await encryptSecret(clean);
        localStorage.setItem(LOCAL_KEY_API_KEY_ENC, cipher);
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
 * Completely clears and revokes the API key from both session and persistent storage.
 */
export function clearStoredApiKey(): void {
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

import { GlossaryEntry, formatGlossaryForPrompt, getStoredGlossary } from './glossary';

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

/**
 * Translates a batch of localization strings while strictly preserving ICU parameters.
 */
export async function translateBatchWithOpenRouter({
  apiKey,
  model,
  sourceLang,
  targetLang,
  items,
  glossary,
}: TranslateBatchOptions): Promise<Record<string, string>> {
  if (!apiKey.trim()) {
    throw new Error('Please provide an OpenRouter API key.');
  }

  if (items.length === 0) {
    return {};
  }

  const srcName = getLanguageDisplayName(sourceLang);
  const tgtName = getLanguageDisplayName(targetLang);

  const activeGlossary = glossary !== undefined ? glossary : getStoredGlossary();
  const glossaryInstructions = formatGlossaryForPrompt(activeGlossary);

  const systemPrompt = `You are an expert localization and internationalization (i18n) translator specializing in software UI strings.
Your mission is to translate software UI strings from ${srcName} (${sourceLang}) to natural, professional ${tgtName} (${targetLang}).

CRITICAL RULES:
1. PRESERVE VARIABLES EXACTLY:
   - Interpolation placeholders like {name}, {count}, {{username}}, %s, %d, %1$s, {0}, $1 MUST NEVER be translated, modified, or omitted.
   - Example in Myanmar: "Welcome, {name}!" -> "ကြိုဆိုပါသည်၊ {name}!" (DO NOT write {နာမည်} or remove {name}).
2. MAINTAIN TONE & CONTEXT:
   - UI strings should sound modern, concise, polite, and natural for software applications.
   - For Myanmar (my), use modern standard Unicode typography (Pyidaungsu / Noto Sans Myanmar).
   - If a description or context is provided for a string, use it to disambiguate the translation accurately.
3. RETURN STRICT JSON:
   - You must output ONLY a valid JSON object where keys are the translation keys provided and values are the translated strings.
   - Do NOT wrap in markdown code fences (\`\`\`json). Output pure raw JSON only.${glossaryInstructions}`;

  const userPayload: any = {
    task: `Translate the following ${items.length} strings from ${srcName} to ${tgtName}:`,
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    strings: items.reduce((acc, item) => {
      acc[item.key] = item.sourceText;
      return acc;
    }, {} as Record<string, string>),
  };

  // Attach context descriptions if any items have them
  const hasDescriptions = items.some(it => !!it.description?.trim());
  if (hasDescriptions) {
    userPayload.contexts = items.reduce((acc, item) => {
      if (item.description?.trim()) {
        acc[item.key] = item.description.trim();
      }
      return acc;
    }, {} as Record<string, string>);
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
      'HTTP-Referer': window.location.origin || 'https://jsonlink.dev',
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
