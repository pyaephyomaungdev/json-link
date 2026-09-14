/**
 * Translation Quality & AST Engine (Deep Module)
 *
 * Consolidates AST interpolation tokenization, ICU MessageFormat evaluation,
 * cache management, and QA consistency auditing behind a high-leverage interface.
 *
 * Implemented per the codebase-design principles:
 * - Small interface, deep implementation
 * - In-process pure computation with bounded LRU/FIFO memory caches
 * - Eliminates duplicate token extraction logic
 */

import { TranslationItem } from '@/types';

// ==========================================
// 1. Types & Interfaces
// ==========================================

export interface TokenPart {
  text: string;
  isVariable: boolean;
}

export interface VariableValidationResult {
  isValid: boolean;
  missingVariables: string[];
  extraVariables: string[];
}

export type LintSeverity = 'error' | 'warning' | 'info';

export type LintCategory =
  | 'whitespace'
  | 'variable-mismatch'
  | 'untranslated'
  | 'length-expansion'
  | 'duplicate'
  | 'empty';

export interface LintIssue {
  id: string;
  key: string;
  lang?: string;
  category: LintCategory;
  severity: LintSeverity;
  message: string;
  details?: string;
  canAutoFix?: boolean;
}

export interface LintReport {
  totalIssues: number;
  errorsCount: number;
  warningsCount: number;
  suggestionsCount: number;
  issues: LintIssue[];
}

export interface IcuEvaluationResult {
  formattedText: string;
  isPlural: boolean;
  pluralVarName?: string;
  detectedVariables: string[];
}

export interface InspectionOptions {
  locale?: string;
  maxExpansionRatio?: number;
}

export interface TranslationInspection {
  readonly tokens: readonly TokenPart[];
  readonly effectiveState: 'valid' | 'missing' | 'placeholder_only';
  readonly validation: VariableValidationResult;
  readonly issues: readonly LintIssue[];
  readonly canAutoFix: boolean;
  fix(): string;
}

// ==========================================
// 2. Hidden Implementation (Behind the Seam)
// ==========================================

// Comprehensive regex covering ICU, Mustache, Printf, and Positional tokens
const VARIABLE_REGEX = /(?:\{\{[a-zA-Z0-9_.-]+\}\}|\{[a-zA-Z0-9_.-]+(?:,\s*(?:number|date|time)(?:,\s*[^}]+)?)?\}|%[0-9]*\$?[a-zA-Z]|%\([a-zA-Z0-9_.-]+\)[a-zA-Z]|\$[0-9]+)/g;

// ICU selector pattern (e.g., {count, plural, ...} or {gender, select, ...})
const ICU_SELECTOR_REGEX = /\{([a-zA-Z0-9_.-]+)\s*,\s*(?:plural|select|selectordinal)\b/g;

// Bounded in-memory FIFO caches
const MAX_CACHE_SIZE = 2000;
const extractVarsCache = new Map<string, string[]>();
const tokenizeVarsCache = new Map<string, TokenPart[]>();
const validateVarsCache = new Map<string, Map<string, VariableValidationResult>>();

function setBoundedCache<K, V>(map: Map<K, V>, key: K, value: V): void {
  if (map.size >= MAX_CACHE_SIZE) {
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
 * Tokenize string into variable and plain text parts for UI rendering and inspection
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

    // Skip ICU branch bodies like male{He} or =1{one}
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

/**
 * Extract all unique interpolation variable identifiers
 */
export function extractVariables(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const cached = extractVarsCache.get(text);
  if (cached !== undefined) return cached;

  const results = new Set<string>();

  // 1. ICU plural / select selector variables
  const icuSelectorRegex = new RegExp(ICU_SELECTOR_REGEX.source, 'g');
  let icuMatch: RegExpExecArray | null;
  while ((icuMatch = icuSelectorRegex.exec(text)) !== null) {
    results.add(`{${icuMatch[1]}}`);
  }

  // 2. General interpolation variables
  const regex = new RegExp(VARIABLE_REGEX.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const token = match[0];
    const idx = match.index;
    if (token.startsWith('{') && !token.startsWith('{{') && idx > 0) {
      const prevChar = text[idx - 1];
      if (/[a-zA-Z0-9_=-]/.test(prevChar)) {
        continue;
      }
    }
    results.add(token);
  }

  const res = Array.from(results);
  setBoundedCache(extractVarsCache, text, res);
  return res;
}

/**
 * Extracts bare variable identifiers (e.g. 'username', 'count') stripped of enclosing braces.
 * Used for ICU parameter inputs and evaluation.
 */
export function extractVariableNames(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const vars = new Set<string>();

  // 1. Matches {variable} and {variable, plural/select...}
  const curlyRegex = /\{([a-zA-Z0-9_.-]+)(?:,\s*[a-zA-Z]+)?/g;
  let match: RegExpExecArray | null;
  while ((match = curlyRegex.exec(text)) !== null) {
    vars.add(match[1]);
  }

  // 2. Matches {{variable}}
  const doubleCurlyRegex = /\{\{([a-zA-Z0-9_.-]+)\}\}/g;
  while ((match = doubleCurlyRegex.exec(text)) !== null) {
    vars.add(match[1]);
  }

  return Array.from(vars);
}

/**
 * Check if translation consists purely of interpolation tokens without readable text
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
 * Check if string is effectively missing (empty, whitespace, or invalid placeholder-only fill)
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
 * Validate variable consistency between source and target
 */
export function validateVariables(
  sourceText: string,
  targetText: string
): VariableValidationResult {
  if (!sourceText?.trim() || !targetText?.trim()) {
    return { isValid: true, missingVariables: [], extraVariables: [] };
  }

  let targetCache = validateVarsCache.get(sourceText);
  if (targetCache === undefined) {
    targetCache = new Map<string, VariableValidationResult>();
    setBoundedCache(validateVarsCache, sourceText, targetCache);
  }
  if (targetCache.size >= 500) {
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

/**
 * Check if string contains an ICU plural expression
 */
export function isIcuPlural(message: string): boolean {
  return /\{[a-zA-Z0-9_-]+,\s*plural,/i.test(message);
}

/**
 * Evaluate ICU plural rules and variable interpolation
 */
export function evaluateIcuMessage(
  message: string,
  params: Record<string, string | number> = {},
  locale = 'en'
): IcuEvaluationResult {
  const detectedVariables = extractVariables(message).map(v => v.replace(/^\{+|\}+$/g, ''));
  let isPlural = false;
  let pluralVarName: string | undefined;

  const pluralMarker = /\{([a-zA-Z0-9_-]+),\s*plural,/i;
  const markerMatch = pluralMarker.exec(message);

  let resultText = message;

  if (markerMatch) {
    const startIndex = markerMatch.index;
    let depth = 0;
    let endIndex = -1;

    for (let i = startIndex; i < message.length; i++) {
      if (message[i] === '{') depth++;
      else if (message[i] === '}') {
        depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (endIndex !== -1) {
      isPlural = true;
      pluralVarName = markerMatch[1];
      const rawBranches = message.slice(startIndex + markerMatch[0].length, endIndex);

      const rawCount = params[pluralVarName] !== undefined ? Number(params[pluralVarName]) : 0;
      const count = isNaN(rawCount) ? 0 : rawCount;

      const branchRegex = /(=[0-9]+|[a-zA-Z]+)\s*\{([^}]*)\}/g;
      const branches: Record<string, string> = {};
      let bMatch;
      while ((bMatch = branchRegex.exec(rawBranches)) !== null) {
        branches[bMatch[1]] = bMatch[2];
      }

      let selectedBranchContent = '';
      const exactMatchKey = `=${count}`;

      if (branches[exactMatchKey] !== undefined) {
        selectedBranchContent = branches[exactMatchKey];
      } else {
        let rule = 'other';
        try {
          const pr = new Intl.PluralRules(locale);
          rule = pr.select(count);
        } catch {
          rule = count === 1 ? 'one' : 'other';
        }

        selectedBranchContent =
          branches[rule] !== undefined
            ? branches[rule]
            : branches['other'] || Object.values(branches)[0] || '';
      }

      const expandedBranch = selectedBranchContent.replace(/#/g, String(count));
      resultText = message.slice(0, startIndex) + expandedBranch + message.slice(endIndex + 1);
    }
  }

  // Replace remaining variable placeholders: {param} and {{param}}
  for (const [key, val] of Object.entries(params)) {
    const valStr = String(val);
    resultText = resultText
      .replace(new RegExp(`\\{${key}\\}`, 'g'), valStr)
      .replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), valStr);
  }

  return {
    formattedText: resultText,
    isPlural,
    pluralVarName,
    detectedVariables,
  };
}

/**
 * Workspace QA Consistency Linter
 */
export function runLocalizationLinter(
  items: TranslationItem[],
  languages: string[],
  sourceLang = 'en'
): LintReport {
  const issues: LintIssue[] = [];
  const effectiveSource = languages.includes(sourceLang) ? sourceLang : languages[0] || 'en';

  for (const item of items) {
    if (item.key !== item.key.trim()) {
      issues.push({
        id: `key-space-${item.key}`,
        key: item.key,
        category: 'whitespace',
        severity: 'error',
        message: 'Translation key has leading or trailing whitespace',
        details: `"${item.key}"`,
        canAutoFix: true,
      });
    }

    const sourceVal = item[effectiveSource] || '';

    for (const lang of languages) {
      const val = item[lang];

      if (val === undefined || val.trim() === '') {
        issues.push({
          id: `empty-${item.key}-${lang}`,
          key: item.key,
          lang,
          category: 'empty',
          severity: 'warning',
          message: `Missing translation for ${lang.toUpperCase()}`,
        });
        continue;
      }

      if (isPlaceholderOnly(val)) {
        issues.push({
          id: `empty-${item.key}-${lang}-${val.length}`,
          key: item.key,
          lang,
          category: 'empty',
          severity: 'warning',
          message: `Translation for ${lang.toUpperCase()} contains only variables — no actual text`,
          details: `"${val}"`,
          canAutoFix: false,
        });
      }

      if (val !== val.trim()) {
        issues.push({
          id: `val-space-${item.key}-${lang}`,
          key: item.key,
          lang,
          category: 'whitespace',
          severity: 'warning',
          message: `Leading or trailing whitespace in ${lang.toUpperCase()} text`,
          details: `"${val}"`,
          canAutoFix: true,
        });
      }

      if (lang !== effectiveSource && sourceVal) {
        const validation = validateVariables(sourceVal, val);
        if (!validation.isValid) {
          issues.push({
            id: `var-${item.key}-${lang}`,
            key: item.key,
            lang,
            category: 'variable-mismatch',
            severity: 'error',
            message: `Missing variable(s) from ${effectiveSource.toUpperCase()}: ${validation.missingVariables.join(', ')}`,
            details: `Source: "${sourceVal}" | Target: "${val}"`,
          });
        }
      }

      if (lang !== effectiveSource && sourceVal && sourceVal.length >= 5 && val.length > sourceVal.length * 2.5) {
        issues.push({
          id: `expansion-${item.key}-${lang}`,
          key: item.key,
          lang,
          category: 'length-expansion',
          severity: 'warning',
          message: `Text expanded by ${Math.round((val.length / sourceVal.length) * 100)}% (${sourceVal.length} → ${val.length} chars)`,
          details: 'Potential risk of text clipping on small buttons or mobile screens.',
        });
      }

      if (lang !== effectiveSource && sourceVal && val.trim().toLowerCase() === sourceVal.trim().toLowerCase() && sourceVal.length > 5) {
        if (lang === 'my' || lang === 'zh' || lang === 'ja' || lang === 'ko' || lang === 'th') {
          issues.push({
            id: `untranslated-${item.key}-${lang}`,
            key: item.key,
            lang,
            category: 'untranslated',
            severity: 'warning',
            message: `Text in ${lang.toUpperCase()} is identical to ${effectiveSource.toUpperCase()}`,
            details: `Untranslated text: "${val}"`,
          });
        }
      }
    }
  }

  for (const lang of languages) {
    const valueMap = new Map<string, string[]>();
    for (const item of items) {
      const val = (item[lang] || '').trim();
      if (val && val.length >= 6) {
        const existing = valueMap.get(val) || [];
        existing.push(item.key);
        valueMap.set(val, existing);
      }
    }

    for (const [val, keys] of valueMap.entries()) {
      if (keys.length > 1) {
        issues.push({
          id: `dup-${lang}-${keys[0]}`,
          key: keys[0],
          lang,
          category: 'duplicate',
          severity: 'info',
          message: `Identical translation used across ${keys.length} keys in ${lang.toUpperCase()}`,
          details: `Keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''} → "${val}"`,
        });
      }
    }
  }

  const errorsCount = issues.filter(i => i.severity === 'error').length;
  const warningsCount = issues.filter(i => i.severity === 'warning').length;
  const suggestionsCount = issues.filter(i => i.severity === 'info').length;

  return {
    totalIssues: issues.length,
    errorsCount,
    warningsCount,
    suggestionsCount,
    issues,
  };
}

/**
 * 1-Click Fix All Whitespace Issues
 */
export function fixAllWhitespaceIssues(
  items: TranslationItem[],
  languages: string[]
): { updatedItems: TranslationItem[]; fixedCount: number } {
  let fixedCount = 0;
  const existingKeys = new Set(items.map(i => i.key));

  const updatedItems = items.map(item => {
    let changed = false;
    const cleanItem: TranslationItem = { ...item };

    const trimmedKey = cleanItem.key.trim();
    if (cleanItem.key !== trimmedKey) {
      if (!existingKeys.has(trimmedKey) || trimmedKey === cleanItem.key) {
        existingKeys.delete(cleanItem.key);
        existingKeys.add(trimmedKey);
        cleanItem.key = trimmedKey;
        changed = true;
      }
    }

    for (const lang of languages) {
      const val = cleanItem[lang];
      if (typeof val === 'string' && val !== val.trim()) {
        cleanItem[lang] = val.trim();
        changed = true;
      }
    }

    if (changed) fixedCount++;
    return cleanItem;
  });

  return { updatedItems, fixedCount };
}

// ==========================================
// 3. High-Leverage Unified Inspection Interface
// ==========================================

/**
 * Deep Module Entry Point: Inspects a source/target pair in one call.
 * Returns tokens, effective translation status, variable consistency,
 * and an auto-fix method.
 */
export function inspectTranslation(
  source: string,
  target?: string,
  options?: InspectionOptions
): TranslationInspection {
  const targetText = target ?? '';
  const tokens = tokenizeVariables(targetText);
  const validation = validateVariables(source, targetText);

  let effectiveState: 'valid' | 'missing' | 'placeholder_only' = 'valid';
  if (isEffectivelyMissing(targetText, source)) {
    effectiveState = isPlaceholderOnly(targetText) ? 'placeholder_only' : 'missing';
  }

  const issues: LintIssue[] = [];
  if (targetText && targetText !== targetText.trim()) {
    issues.push({
      id: 'whitespace-target',
      key: '',
      category: 'whitespace',
      severity: 'warning',
      message: 'Leading or trailing whitespace in translation',
      canAutoFix: true,
    });
  }

  if (!validation.isValid) {
    issues.push({
      id: 'variable-mismatch',
      key: '',
      category: 'variable-mismatch',
      severity: 'error',
      message: `Missing variable(s): ${validation.missingVariables.join(', ')}`,
      canAutoFix: false,
    });
  }

  const maxRatio = options?.maxExpansionRatio ?? 2.5;
  if (source.length >= 5 && targetText.length > source.length * maxRatio) {
    issues.push({
      id: 'length-expansion',
      key: '',
      category: 'length-expansion',
      severity: 'warning',
      message: `Text expansion exceeds threshold (${Math.round((targetText.length / source.length) * 100)}%)`,
    });
  }

  return {
    tokens,
    effectiveState,
    validation,
    issues,
    canAutoFix: issues.some(i => i.canAutoFix),
    fix(): string {
      return targetText.trim();
    },
  };
}

// ==========================================
// 4. Translation Engine Facade / Class
// ==========================================

export class TranslationEngineModule {
  inspect(source: string, target?: string, options?: InspectionOptions): TranslationInspection {
    return inspectTranslation(source, target, options);
  }

  tokenize(text: string): TokenPart[] {
    return tokenizeVariables(text);
  }

  extract(text: string): string[] {
    return extractVariables(text);
  }

  validate(source: string, target: string): VariableValidationResult {
    return validateVariables(source, target);
  }

  isPlaceholderOnly(text: string | undefined): boolean {
    return isPlaceholderOnly(text);
  }

  isEffectivelyMissing(text: string | undefined, sourceText?: string): boolean {
    return isEffectivelyMissing(text, sourceText);
  }

  evaluateIcu(message: string, params?: Record<string, string | number>, locale?: string): IcuEvaluationResult {
    return evaluateIcuMessage(message, params, locale);
  }

  isIcuPlural(message: string): boolean {
    return isIcuPlural(message);
  }

  auditWorkspace(items: TranslationItem[], languages: string[], sourceLang?: string): LintReport {
    return runLocalizationLinter(items, languages, sourceLang);
  }

  fixAllWhitespace(items: TranslationItem[], languages: string[]): { updatedItems: TranslationItem[]; fixedCount: number } {
    return fixAllWhitespaceIssues(items, languages);
  }
}

export const translationEngine = new TranslationEngineModule();
