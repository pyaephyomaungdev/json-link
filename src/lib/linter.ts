import { TranslationItem } from '@/types';
import { validateVariables, isPlaceholderOnly } from './variables';

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

/**
 * Runs comprehensive lint checks on the localization dataset.
 */
export function runLocalizationLinter(
  items: TranslationItem[],
  languages: string[],
  sourceLang = 'en'
): LintReport {
  const issues: LintIssue[] = [];

  const effectiveSource = languages.includes(sourceLang) ? sourceLang : languages[0] || 'en';

  for (const item of items) {
    // 1. Key check: leading/trailing whitespace
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

      // 2. Missing/Empty check
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

      // 2b. Placeholder-only check: an AI-filled target consisting solely of
      // interpolation tokens (e.g. "{user}") counts as not translated, even
      // though the cell is non-empty — otherwise "missing" filters/stats hide it.
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

      // 3. Value whitespace check
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

      // 4. Variable mismatch check (compared to source language)
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

      // 5. Length expansion check (> 2.5x source length and source length > 4)
      if (lang !== effectiveSource && sourceVal && sourceVal.length >= 5 && val.length > sourceVal.length * 2.5) {
        issues.push({
          id: `expansion-${item.key}-${lang}`,
          key: item.key,
          lang,
          category: 'length-expansion',
          severity: 'info',
          message: `Text expanded by ${Math.round((val.length / sourceVal.length) * 100)}% (${sourceVal.length} → ${val.length} chars)`,
          details: 'Potential risk of text clipping on small buttons or mobile screens.',
        });
      }

      // 6. Same as source (untranslated check for non-English target languages)
      if (lang !== effectiveSource && sourceVal && val.trim().toLowerCase() === sourceVal.trim().toLowerCase() && sourceVal.length > 5) {
        // Only flag if characters are Latin and lang is not English/Spanish/etc
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

  // 7. Duplicate values check per language
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
