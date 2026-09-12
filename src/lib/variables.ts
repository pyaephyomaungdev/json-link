/**
 * Variable extraction, tokenization and validation for i18n localization
 * Supports:
 * - ICU MessageFormat / Simple braces: {name}, {count}, {0}
 * - Mustache / Handlebars: {{name}}, {{count}}
 * - C / PHP / Python sprintf format: %s, %d, %1$s, %(name)s, %.2f
 * - Positional parameters: $1, $name
 */

// Regex pattern covering common i18n interpolation variables including ICU number/date formatters
const VARIABLE_REGEX = /(?:\{\{[a-zA-Z0-9_.-]+\}\}|\{[a-zA-Z0-9_.-]+(?:,\s*(?:number|date|time)(?:,\s*[^}]+)?)?\}|%[0-9]*\$?[a-zA-Z]|%\([a-zA-Z0-9_.-]+\)[a-zA-Z]|\$[0-9]+)/g;

// Fast bounded caches (max 2,000 items) to prevent high CPU usage on large spreadsheets.
// NOTE: eviction is FIFO (oldest inserted first), not true LRU — Map iteration order never
// updates on .get(). Good enough for this workload; documented honestly on purpose.
const MAX_CACHE_SIZE = 2000;
const extractVarsCache = new Map<string, string[]>();
const tokenizeVarsCache = new Map<string, TokenPart[]>();
// validateVarsCache is nested (source → target → result) so a target containing the same
// "…::…" characters as the source cannot collide with a different (source, target) pair.
const validateVarsCache = new Map<string, Map<string, VariableValidationResult>>();

function setBoundedCache<K, V>(map: Map<K, V>, key: K, value: V) {
  if (map.size >= MAX_CACHE_SIZE) {
    // Evict oldest 20% entries (FIFO)
    const toDelete = Math.floor(MAX_CACHE_SIZE * 0.2);
    let count = 0;
    for (const k of map.keys()) {
      map.delete(k);
      count++;
      if (count >= toDelete) break;
    }
  }
  map.set(key, value);
}

/**
 * Returns true when a (target) translation contains ONLY interpolation placeholders
 * and no actual translated text. AI batch translation can produce values like
 * "{user}" alone — they look filled, but no human-readable text exists.
 * Uses the cached tokenizer so this costs O(1) on repeated values.
 */
export function isPlaceholderOnly(text: string | undefined): boolean {
  if (!text || typeof text !== 'string') return false;
  const plain = tokenizeVariables(text)
    .filter(t => !t.isVariable)
    .map(t => t.text.trim())
    .join('');
  return plain === '';
}

/**
 * True when a cell has no meaningful content: empty/whitespace OR placeholder-only.
 * Used for "missing translations" filters, stats and linter checks so that
 * machine-generated placeholder fills are not counted as completed translations.
 *
 * If `sourceText` is provided and itself consists solely of placeholders (e.g. "{label}"),
 * then the target having "{label}" is recognized as valid and NOT missing.
 */
export function isEffectivelyMissing(text: string | undefined, sourceText?: string): boolean {
  if (text === undefined || text === null) return true;
  if (typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (trimmed === '') return true;
  if (sourceText !== undefined && isPlaceholderOnly(sourceText.trim())) {
    return false;
  }
  return isPlaceholderOnly(trimmed);
}

/**
 * Extracts all unique interpolation variables from a string.
 */
export function extractVariables(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const cached = extractVarsCache.get(text);
  if (cached !== undefined) return cached;

  const results = new Set<string>();

  // Extract ICU plural / select selector variables: e.g. {count, plural, ...} => {count}
  const icuSelectorRegex = /\{([a-zA-Z0-9_.-]+)\s*,\s*(?:plural|select|selectordinal)\b/g;
  let icuMatch: RegExpExecArray | null;
  while ((icuMatch = icuSelectorRegex.exec(text)) !== null) {
    results.add(`{${icuMatch[1]}}`);
  }

  // Extract general interpolation variables
  const regex = new RegExp(VARIABLE_REGEX.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const token = match[0];
    const idx = match.index;
    // If it's a single-brace variable like {He}, ensure it is not an ICU branch body (e.g. male{He}, other{text}, =1{one})
    if (token.startsWith('{') && !token.startsWith('{{') && idx > 0) {
      const prevChar = text[idx - 1];
      if (/[a-zA-Z0-9_=-]/.test(prevChar)) {
        continue; // Skip ICU clause content like male{He} or =1{item}
      }
    }
    results.add(token);
  }

  const res = Array.from(results);
  setBoundedCache(extractVarsCache, text, res);
  return res;
}

export interface TokenPart {
  text: string;
  isVariable: boolean;
}

/**
 * Tokenizes text into plain text segments and variable segments for UI highlighting.
 */
export function tokenizeVariables(text: string): TokenPart[] {
  if (!text || typeof text !== 'string') return [{ text: '', isVariable: false }];
  const cached = tokenizeVarsCache.get(text);
  if (cached !== undefined) return cached;

  const tokens: TokenPart[] = [];
  let lastIndex = 0;
  const regex = new RegExp(VARIABLE_REGEX.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const token = match[0];
    const idx = match.index;

    // Check if it's an ICU branch body like male{He}
    if (token.startsWith('{') && !token.startsWith('{{') && idx > 0) {
      const prevChar = text[idx - 1];
      if (/[a-zA-Z0-9_=-]/.test(prevChar)) {
        continue;
      }
    }

    // Leading plain text
    if (match.index > lastIndex) {
      tokens.push({
        text: text.slice(lastIndex, match.index),
        isVariable: false,
      });
    }

    // Variable token
    tokens.push({
      text: match[0],
      isVariable: true,
    });

    lastIndex = regex.lastIndex;
  }

  // Trailing plain text
  if (lastIndex < text.length) {
    tokens.push({
      text: text.slice(lastIndex),
      isVariable: false,
    });
  }

  const res = tokens.length > 0 ? tokens : [{ text, isVariable: false }];
  setBoundedCache(tokenizeVarsCache, text, res);
  return res;
}

export interface VariableValidationResult {
  isValid: boolean;
  missingVariables: string[];
  extraVariables: string[];
}

/**
 * Compares target translation against source string for missing or corrupted variables.
 */
export function validateVariables(
  sourceText: string,
  targetText: string
): VariableValidationResult {
  // If either text is empty or blank, validation is considered pending/pass
  if (!sourceText?.trim() || !targetText?.trim()) {
    return { isValid: true, missingVariables: [], extraVariables: [] };
  }

  let targetCache = validateVarsCache.get(sourceText);
  if (targetCache === undefined) {
    targetCache = new Map<string, VariableValidationResult>();
    setBoundedCache(validateVarsCache, sourceText, targetCache);
  }
  if (targetCache.size >= 500) {
    // Evict the whole source bucket if it is saturated (keeps nesting bounded too)
    targetCache.clear();
  }

  const cached = targetCache.get(targetText);
  if (cached !== undefined) return cached;

  const sourceVars = extractVariables(sourceText);
  if (sourceVars.length === 0) {
    const passResult = { isValid: true, missingVariables: [], extraVariables: [] };
    targetCache.set(targetText, passResult);
    return passResult;
  }

  const targetVars = new Set(extractVariables(targetText));
  const missingVariables: string[] = [];

  for (const v of sourceVars) {
    if (!targetVars.has(v)) {
      missingVariables.push(v);
    }
  }

  const result: VariableValidationResult = {
    isValid: missingVariables.length === 0,
    missingVariables,
    extraVariables: [],
  };
  targetCache.set(targetText, result);
  return result;
}
