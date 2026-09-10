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

const STORAGE_KEY_API_KEY = 'jsonlink_openrouter_api_key';
const STORAGE_KEY_MODEL = 'jsonlink_openrouter_model';

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_API_KEY);
    }
  } catch (e) {
    console.error('Failed to save API key to localStorage', e);
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

export interface TranslationRequestItem {
  key: string;
  sourceText: string;
}

export interface TranslateBatchOptions {
  apiKey: string;
  model: string;
  sourceLang: string;
  targetLang: string;
  items: TranslationRequestItem[];
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
}: TranslateBatchOptions): Promise<Record<string, string>> {
  if (!apiKey.trim()) {
    throw new Error('Please provide an OpenRouter API key.');
  }

  if (items.length === 0) {
    return {};
  }

  const srcName = getLanguageDisplayName(sourceLang);
  const tgtName = getLanguageDisplayName(targetLang);

  const systemPrompt = `You are an expert localization and internationalization (i18n) translator specializing in software UI strings.
Your mission is to translate software UI strings from ${srcName} (${sourceLang}) to natural, professional ${tgtName} (${targetLang}).

CRITICAL RULES:
1. PRESERVE VARIABLES EXACTLY:
   - Interpolation placeholders like {name}, {count}, {{username}}, %s, %d, %1$s, {0}, $1 MUST NEVER be translated, modified, or omitted.
   - Example in Myanmar: "Welcome, {name}!" -> "ကြိုဆိုပါသည်၊ {name}!" (DO NOT write {နာမည်} or remove {name}).
2. MAINTAIN TONE:
   - UI strings should sound modern, concise, polite, and natural for software applications.
   - For Myanmar (my), use modern standard Unicode typography (Pyidaungsu / Noto Sans Myanmar).
3. RETURN STRICT JSON:
   - You must output ONLY a valid JSON object where keys are the translation keys provided and values are the translated strings.
   - Do NOT wrap in markdown code fences (\`\`\`json). Output pure raw JSON only.`;

  const userPayload = {
    task: `Translate the following ${items.length} strings from ${srcName} to ${tgtName}:`,
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    strings: items.reduce((acc, item) => {
      acc[item.key] = item.sourceText;
      return acc;
    }, {} as Record<string, string>),
  };

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

  // Parse JSON response safely (handling accidental markdown wrappers if any)
  let cleanJson = rawContent.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  try {
    const parsed = JSON.parse(cleanJson);
    const result: Record<string, string> = {};

    // In case the model nested the result in a property like "strings" or returned flat object
    const map = parsed.strings && typeof parsed.strings === 'object' ? parsed.strings : parsed;

    for (const item of items) {
      if (typeof map[item.key] === 'string') {
        result[item.key] = map[item.key].trim();
      }
    }

    return result;
  } catch (err: any) {
    console.error('Failed to parse AI translation JSON:', cleanJson);
    throw new Error('Failed to parse translation response from AI. Please retry.');
  }
}
