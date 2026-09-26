import fs from 'node:fs';
import path from 'node:path';
import { readLocalesFromDisk } from './fsUtils.js';

export interface LintIssue {
  type: 'missing_key' | 'empty_translation' | 'placeholder_mismatch' | 'zawgyi_encoding';
  severity: 'error' | 'warning';
  key: string;
  language: string;
  message: string;
  sourceValue?: string;
  targetValue?: string;
}

export interface LintResult {
  success: boolean;
  totalKeys: number;
  languages: string[];
  errorCount: number;
  warningCount: number;
  issues: LintIssue[];
}

/**
 * Extracts ICU placeholders like {name}, {count}, {item, plural, ...}
 */
export function extractPlaceholders(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const results = new Set<string>();

  // 1. ICU plural/select selector: {count, plural, ...} -> 'count'
  const icuSelectorRegex = /\{([a-zA-Z0-9_]+)\s*,\s*(?:plural|select|selectordinal)/gi;
  let icuMatch: RegExpExecArray | null;
  while ((icuMatch = icuSelectorRegex.exec(text)) !== null) {
    results.add(icuMatch[1]);
  }

  // 2. Standard placeholders: {name}
  const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = placeholderRegex.exec(text)) !== null) {
    const idx = match.index;
    if (idx > 0) {
      const prev = text.slice(Math.max(0, idx - 10), idx);
      // Skip branch subclauses like "=1 {" or "other {"
      if (/(?:=\d+|other|few|many|zero|one)\s*$/i.test(prev)) {
        continue;
      }
    }
    results.add(match[1]);
  }

  return Array.from(results);
}

/**
 * Detects legacy Zawgyi encoding patterns in Burmese text
 */
export function isZawgyiDetected(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  // Specific Zawgyi ordering: e-vowel preceding consonant or tall-aa misplacement
  const zawgyiPattern = /[\u1031\u103b\u107e\u107f\u1080\u1081\u1082\u1083\u1084][\u1000-\u1021]/;
  const zawgyiKinzi = /\u1064/;
  return zawgyiPattern.test(text) || zawgyiKinzi.test(text);
}

/**
 * Finds the project's localization directory automatically
 */
export function resolveLocalesDirectory(targetDir: string, explicitDir?: string): string | null {
  if (explicitDir) {
    const candidate = path.resolve(targetDir, explicitDir);
    if (fs.existsSync(candidate)) return candidate;
  }

  const commonPaths = [
    'src/locales',
    'locales',
    'src/translations',
    'translations',
    'src/i18n',
    'i18n',
  ];

  for (const rel of commonPaths) {
    const candidate = path.resolve(targetDir, rel);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }

  return null;
}

/**
 * Executes headless linting across all locale files in a directory
 */
export function runLint(targetDir = process.cwd(), explicitDir?: string): LintResult {
  const localesDir = resolveLocalesDirectory(targetDir, explicitDir);

  if (!localesDir) {
    return {
      success: false,
      totalKeys: 0,
      languages: [],
      errorCount: 1,
      warningCount: 0,
      issues: [
        {
          type: 'missing_key',
          severity: 'error',
          key: '*',
          language: '*',
          message: `Locales directory not found in ${targetDir}. Checked src/locales, locales, src/i18n.`,
        },
      ],
    };
  }

  const { languages, records } = readLocalesFromDisk(localesDir);
  const issues: LintIssue[] = [];

  if (languages.length === 0) {
    return {
      success: false,
      totalKeys: 0,
      languages: [],
      errorCount: 1,
      warningCount: 0,
      issues: [
        {
          type: 'missing_key',
          severity: 'error',
          key: '*',
          language: '*',
          message: `No language JSON files found in ${localesDir}`,
        },
      ],
    };
  }

  const baseLang = languages.includes('en') ? 'en' : languages[0];

  for (const record of records) {
    const recordMap = record as Record<string, string>;
    const baseVal = recordMap[baseLang] || '';

    // Check all languages
    for (const lang of languages) {
      const val = recordMap[lang];

      // 1. Missing Key
      if (val === undefined) {
        issues.push({
          type: 'missing_key',
          severity: 'error',
          key: record.key,
          language: lang,
          message: `Key missing in "${lang}.json" (present in base "${baseLang}")`,
          sourceValue: baseVal,
        });
        continue;
      }

      // 2. Empty Translation
      if (val.trim() === '') {
        issues.push({
          type: 'empty_translation',
          severity: 'warning',
          key: record.key,
          language: lang,
          message: `Empty translation string in "${lang}.json"`,
          sourceValue: baseVal,
        });
        continue;
      }

      // 3. Placeholder Mismatch (against base language)
      if (lang !== baseLang && baseVal) {
        const basePlaceholders = extractPlaceholders(baseVal);
        const targetPlaceholders = extractPlaceholders(val);

        const missing = basePlaceholders.filter(p => !targetPlaceholders.includes(p));
        if (missing.length > 0) {
          issues.push({
            type: 'placeholder_mismatch',
            severity: 'error',
            key: record.key,
            language: lang,
            message: `Missing placeholder variable(s): {${missing.join(', ')}}`,
            sourceValue: baseVal,
            targetValue: val,
          });
        }
      }

      // 4. Zawgyi encoding detection for Burmese locale
      if (lang === 'my' && isZawgyiDetected(val)) {
        issues.push({
          type: 'zawgyi_encoding',
          severity: 'warning',
          key: record.key,
          language: lang,
          message: `Legacy Zawgyi font encoding detected instead of Unicode`,
          targetValue: val,
        });
      }
    }
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return {
    success: errorCount === 0,
    totalKeys: records.length,
    languages,
    errorCount,
    warningCount,
    issues,
  };
}
