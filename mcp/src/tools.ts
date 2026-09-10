// Rabbit Zawgyi <-> Unicode converter engine
const zg2uniRules: [RegExp, string][] = [
  [/ဃျ/g, 'ဃျ'],
  [/ေျ/g, 'ျေ'],
  [/ျြ/g, 'ြျ'],
  [/ြွ/g, 'ွြ'],
  [/ှြ/g, 'ြှ'],
  [/ှွ/g, 'ွှ'],
  [/ျွ/g, 'ွျ'],
  [/ွျ/g, 'ျွ'],
  [/ွြ/g, 'ြွ'],
  [/ြှ/g, 'ှြ'],
  [/ျှ/g, 'ှျ'],
  [/ှျ/g, 'ျှ'],
  [/ေ([က-အ])/g, '$1ေ'],
  [/([က-အ])([ျ-ှ]*)([ါ-ှ]+)ေ/g, 'ေ$1$2$3'],
  [/([က-အ])([ျ-ှ]*)ေ/g, 'ေ$1$2'],
  [/ဉ/g, 'ဉ'],
  [/ည/g, 'ည'],
  [/၎င်း/g, '၎င်း'],
  [/ဩ/g, 'ဩ'],
  [/ဪ/g, 'ဪ'],
  [/၌/g, '၌'],
  [/၍/g, '၍'],
  [/၏/g, '၏'],
  [/([က-အ])([ျ-ှ]*)ာ/g, '$1$2ာ'],
  [/([က-အ])([ျ-ှ]*)ါ/g, '$1$2ါ'],
  [/([က-အ])([ျ-ှ]*)ိ/g, '$1$2ိ'],
  [/([က-အ])([ျ-ှ]*)ီ/g, '$1$2ီ'],
  [/([က-အ])([ျ-ှ]*)ု/g, '$1$2ု'],
  [/([က-အ])([ျ-ှ]*)ူ/g, '$1$2ူ'],
  [/([က-အ])([ျ-ှ]*)ေ/g, 'ေ$1$2'],
  [/([က-အ])([ျ-ှ]*)ဲ/g, '$1$2ဲ'],
  [/([က-အ])([ျ-ှ]*)ံ/g, '$1$2ံ'],
  [/([က-အ])([ျ-ှ]*)့/g, '$1$2့'],
  [/([က-အ])([ျ-ှ]*)း/g, '$1$2း'],
  [/([က-အ])([ျ-ှ]*)်/g, '$1$2်'],
  [/([က-အ])([ျ-ှ]*)ျ/g, '$1$2ျ'],
  [/([က-အ])([ျ-ှ]*)ြ/g, '$1$2ြ'],
  [/([က-အ])([ျ-ှ]*)ွ/g, '$1$2ွ'],
  [/([က-အ])([ျ-ှ]*)ှ/g, '$1$2ှ'],
  [/([က-အ])်([က-အ])/g, '$1်$2'],
  [/([က-အ])်([ျ-ှ])/g, '$1်$2'],
  [/(\u103B|\u107E|\u107F|\u1080|\u1081|\u1082|\u1083|\u1084)/g, 'ျ'],
  [/(\u103C|\u107D|\u1085)/g, 'ြ'],
  [/(\u103D|\u1082)/g, 'ွ'],
  [/(\u103E|\u1083|\u1084)/g, 'ှ'],
  [/(\u1064)/g, 'ဒ်'],
  [/(\u106B)/g, 'ရှ'],
  [/(\u1090)/g, 'ရ'],
  [/(\u1071|\u1072)/g, 'ို'],
  [/(\u1087)/g, 'န့'],
  [/(\u1088)/g, 'ရ့'],
  [/(\u1089)/g, 'တ့'],
  [/(\u108A)/g, 'မှ'],
  [/(\u108B)/g, 'ပ့'],
  [/(\u108C)/g, 'မ့'],
  [/(\u108D)/g, 'လ့'],
  [/(\u108E)/g, 'ဝ့'],
  [/(\u108F)/g, 'သ့'],
];

const uni2zgRules: [RegExp, string][] = [
  [/ျေ/g, 'ေျ'],
  [/ြေ/g, 'ေြ'],
  [/ွေ/g, 'ေွ'],
  [/ှေ/g, 'ေှ'],
  [/ေ([က-အ])/g, 'ေ$1'],
  [/ေ/g, 'ေ'],
];

const ZAWGYI_SPECIFIC_REGEX =
  /[\u1060-\u1064\u106A-\u106D\u1070-\u1074\u107B-\u1085\u1087-\u1097]|\u1031[\u1000-\u1021]/;

export function isZawgyi(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return ZAWGYI_SPECIFIC_REGEX.test(text);
}

export function zawgyiToUnicode(text: string): string {
  if (!text) return '';
  let res = text;
  for (const [re, rep] of zg2uniRules) {
    res = res.replace(re, rep);
  }
  return res;
}

export function unicodeToZawgyi(text: string): string {
  if (!text) return '';
  let res = text;
  for (const [re, rep] of uni2zgRules) {
    res = res.replace(re, rep);
  }
  return res;
}

// Variable Regex Tokenizer
const VARIABLE_REGEX =
  /(\{[a-zA-Z0-9_]+\}|\{\{[a-zA-Z0-9_]+\}\}|\%[0-9]*\$?[sdif]|%[sdif]|\$[a-zA-Z0-9_]+|:[a-zA-Z0-9_]+|\{[0-9]+\})/g;

export function extractVariables(text: string): string[] {
  if (!text) return [];
  const matches = text.match(VARIABLE_REGEX);
  return matches ? Array.from(new Set(matches)) : [];
}

export function validateVariables(
  sourceText: string,
  targetText: string
): { isValid: boolean; sourceVariables: string[]; targetVariables: string[]; missingVariables: string[] } {
  const sourceVariables = extractVariables(sourceText);
  const targetVariables = extractVariables(targetText);

  const missingVariables = sourceVariables.filter(v => !targetVariables.includes(v));
  return {
    isValid: missingVariables.length === 0,
    sourceVariables,
    targetVariables,
    missingVariables,
  };
}

export interface TranslationItem {
  key: string;
  description?: string;
  status?: 'draft' | 'needs-review' | 'approved';
  [lang: string]: string | undefined;
}

export interface LintIssue {
  id: string;
  key: string;
  lang?: string;
  category: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

export function lintTranslations(
  items: TranslationItem[],
  languages: string[],
  sourceLang = 'en'
): { totalIssues: number; errors: number; warnings: number; issues: LintIssue[] } {
  const issues: LintIssue[] = [];
  const effectiveSource = languages.includes(sourceLang) ? sourceLang : languages[0] || 'en';

  for (const item of items) {
    // 1. Whitespace in key
    if (item.key !== item.key.trim()) {
      issues.push({
        id: `key-ws-${item.key}`,
        key: item.key,
        category: 'whitespace',
        severity: 'error',
        message: 'Translation key contains leading or trailing whitespace',
        details: `"${item.key}"`,
      });
    }

    const sourceVal = item[effectiveSource] || '';

    for (const lang of languages) {
      const val = item[lang];

      // 2. Missing
      if (val === undefined || val.trim() === '') {
        issues.push({
          id: `missing-${item.key}-${lang}`,
          key: item.key,
          lang,
          category: 'missing',
          severity: 'warning',
          message: `Missing translation in ${lang.toUpperCase()}`,
        });
        continue;
      }

      // 3. Whitespace in value
      if (val !== val.trim()) {
        issues.push({
          id: `val-ws-${item.key}-${lang}`,
          key: item.key,
          lang,
          category: 'whitespace',
          severity: 'warning',
          message: `Translation in ${lang.toUpperCase()} has leading or trailing whitespace`,
          details: `"${val}"`,
        });
      }

      // 4. Zawgyi encoding detection
      if (isZawgyi(val)) {
        issues.push({
          id: `zawgyi-${item.key}-${lang}`,
          key: item.key,
          lang,
          category: 'encoding',
          severity: 'error',
          message: `Zawgyi font encoding detected in ${lang.toUpperCase()}. Standard Myanmar Unicode required.`,
          details: `"${val}"`,
        });
      }

      // 5. Variable mismatch
      if (lang !== effectiveSource && sourceVal) {
        const vCheck = validateVariables(sourceVal, val);
        if (!vCheck.isValid) {
          issues.push({
            id: `var-mismatch-${item.key}-${lang}`,
            key: item.key,
            lang,
            category: 'variable-mismatch',
            severity: 'error',
            message: `Missing variable(s) from source ${effectiveSource.toUpperCase()}: ${vCheck.missingVariables.join(', ')}`,
            details: `Source: "${sourceVal}" | Target: "${val}"`,
          });
        }
      }

      // 6. Extreme Length Expansion (> 2.5x source length)
      if (lang !== effectiveSource && sourceVal && sourceVal.length >= 6 && val.length > sourceVal.length * 2.5) {
        issues.push({
          id: `expansion-${item.key}-${lang}`,
          key: item.key,
          lang,
          category: 'length-expansion',
          severity: 'info',
          message: `Text expanded by ${Math.round((val.length / sourceVal.length) * 100)}% (${sourceVal.length} → ${val.length} chars)`,
          details: 'Risk of UI button clipping on mobile displays.',
        });
      }
    }
  }

  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;

  return {
    totalIssues: issues.length,
    errors,
    warnings,
    issues,
  };
}

export function unflattenObject(flatObj: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(flatObj)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

export function exportFormat(
  items: TranslationItem[],
  lang: string,
  format: 'json-flat' | 'json-nested' | 'flutter-arb' | 'android-xml' | 'ios-strings' | 'typescript-dts'
): string {
  const map: Record<string, string> = {};
  for (const it of items) {
    if (it[lang] !== undefined) {
      map[it.key] = it[lang] || '';
    }
  }

  switch (format) {
    case 'json-flat':
      return JSON.stringify(map, null, 2);

    case 'json-nested':
      return JSON.stringify(unflattenObject(map), null, 2);

    case 'flutter-arb': {
      const arb: Record<string, any> = { '@@locale': lang };
      for (const it of items) {
        const val = it[lang] || '';
        arb[it.key] = val;
        const vars = extractVariables(val);
        const desc = it.description || '';
        if (vars.length > 0 || desc) {
          const meta: Record<string, any> = {};
          if (desc) meta.description = desc;
          if (vars.length > 0) {
            meta.placeholders = {};
            vars.forEach(v => {
              const clean = v.replace(/[\{\}]/g, '');
              meta.placeholders[clean] = { type: 'String', example: clean };
            });
          }
          arb[`@${it.key}`] = meta;
        }
      }
      return JSON.stringify(arb, null, 2);
    }

    case 'android-xml': {
      let xml = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n';
      for (const [k, v] of Object.entries(map)) {
        const sanitized = v
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/'/g, "\\'")
          .replace(/"/g, '\\"');
        const cleanKey = k.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        xml += `  <string name="${cleanKey}">${sanitized}</string>\n`;
      }
      xml += '</resources>\n';
      return xml;
    }

    case 'ios-strings': {
      let str = `/* Localizable.strings (${lang.toUpperCase()}) - Generated by JSON Link */\n\n`;
      for (const [k, v] of Object.entries(map)) {
        const escaped = v.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        str += `"${k}" = "${escaped}";\n`;
      }
      return str;
    }

    case 'typescript-dts': {
      let dts = '/**\n * Auto-generated i18n Translation Schema\n * Generated by JSON Link\n */\n\n';
      dts += 'export interface TranslationKeys {\n';
      for (const k of Object.keys(map)) {
        dts += `  "${k}": string;\n`;
      }
      dts += '}\n\n';
      dts += 'export type TranslationKey = keyof TranslationKeys;\n';
      return dts;
    }
  }
}
