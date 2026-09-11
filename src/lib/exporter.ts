import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { TranslationItem, ExportOptions } from '@/types';
import { unflattenObject } from './parser';

/**
 * Downloads a Blob directly in the browser
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Defer revocation: revoking synchronously can cancel the download
  // before the browser flushes the blob to disk in some browsers
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Export to Excel (.xlsx) file
 */
export function exportToExcel(
  items: TranslationItem[],
  languages: string[],
  filename = 'translations.xlsx'
) {
  const hasDescriptions = items.some(i => i.description && i.description.trim() !== '');
  const headers = hasDescriptions ? ['Key', ...languages, 'Description'] : ['Key', ...languages];
  
  // Build data rows
  const data = items.map(item => {
    const row: Record<string, string> = { Key: item.key };
    for (const lang of languages) {
      row[lang] = item[lang] || '';
    }
    if (hasDescriptions) {
      row['Description'] = item.description || '';
    }
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });

  // Calculate dynamic column widths
  const colWidths = headers.map(header => {
    let maxLength = header.length;
    for (const item of items) {
      const val = header === 'Key' ? item.key : header === 'Description' ? (item.description || '') : (item[header] || '');
      if (val && val.length > maxLength) {
        maxLength = Math.min(val.length, 60); // Cap at 60 for readability
      }
    }
    return { wch: Math.max(maxLength + 4, 12) };
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Translations');

  // Generate binary XLSX buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  downloadBlob(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Export to CSV with UTF-8 BOM so Excel opens it with perfect Unicode rendering
 */
export function exportToCsv(
  items: TranslationItem[],
  languages: string[],
  filename = 'translations.csv'
) {
  const hasDescriptions = items.some(i => i.description && i.description.trim() !== '');
  const headers = hasDescriptions ? ['Key', ...languages, 'Description'] : ['Key', ...languages];

  const escapeCsvValue = (val: string): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const csvRows: string[] = [];
  // Header
  csvRows.push(headers.map(escapeCsvValue).join(','));

  // Rows
  for (const item of items) {
    const rowValues = [
      escapeCsvValue(item.key),
      ...languages.map(lang => escapeCsvValue(item[lang] || '')),
    ];
    if (hasDescriptions) {
      rowValues.push(escapeCsvValue(item.description || ''));
    }
    csvRows.push(rowValues.join(','));
  }

  // Add UTF-8 BOM (\uFEFF) at the beginning so Excel correctly recognizes UTF-8 (especially Myanmar Unicode)
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Generate JSON objects per language
 */
export function generateLanguageJsonData(
  items: TranslationItem[],
  lang: string,
  nested: boolean
): any {
  const flatDict: Record<string, string> = {};
  for (const item of items) {
    flatDict[item.key] = item[lang] || '';
  }

  return nested ? unflattenObject(flatDict) : flatDict;
}

/**
 * Export all languages as individual JSON files bundled in a ZIP
 */
export async function exportToJsonZip(
  items: TranslationItem[],
  languages: string[],
  options: ExportOptions,
  zipFilename = 'translations_json.zip'
) {
  const zip = new JSZip();

  for (const lang of languages) {
    const jsonData = generateLanguageJsonData(items, lang, options.nested);
    const jsonStr = JSON.stringify(jsonData, null, options.indent);
    zip.file(`${lang}.json`, jsonStr);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(content, zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`);
}

/**
 * Export single combined JSON file
 */
export function exportToCombinedJson(
  items: TranslationItem[],
  languages: string[],
  options: ExportOptions,
  filename = 'translations_combined.json'
) {
  const combined: Record<string, any> = {};

  for (const lang of languages) {
    combined[lang] = generateLanguageJsonData(items, lang, options.nested);
  }

  const jsonStr = JSON.stringify(combined, null, options.indent);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
}

/**
 * Export single language JSON file directly
 */
export function exportSingleLanguageJson(
  items: TranslationItem[],
  lang: string,
  options: ExportOptions
) {
  const data = generateLanguageJsonData(items, lang, options.nested);
  const jsonStr = JSON.stringify(data, null, options.indent);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `${lang}.json`);
}

/**
 * Converts a JavaScript object or flat map to clean YAML string
 */
export function objectToYaml(obj: Record<string, any>, indentLevel = 0): string {
  const indent = '  '.repeat(indentLevel);
  let yaml = '';

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      yaml += `${indent}${key}:\n${objectToYaml(value, indentLevel + 1)}`;
    } else {
      const strVal = String(value ?? '');
      // Escape multiline or special characters in YAML
      if (strVal.includes('\n')) {
        yaml += `${indent}${key}: |-\n`;
        for (const line of strVal.split('\n')) {
          yaml += `${indent}  ${line}\n`;
        }
      } else if (
        strVal.includes(':') ||
        strVal.includes('#') ||
        strVal.includes('{') ||
        strVal.includes('}') ||
        strVal.includes('[') ||
        strVal.includes(']') ||
        strVal.startsWith('@') ||
        strVal.startsWith('`') ||
        strVal.startsWith('"') ||
        strVal.startsWith("'")
      ) {
        yaml += `${indent}${key}: "${strVal.replace(/"/g, '\\"')}"\n`;
      } else {
        yaml += `${indent}${key}: ${strVal}\n`;
      }
    }
  }

  return yaml;
}

/**
 * Export all languages as YAML (.yaml) files bundled in a ZIP
 */
export async function exportToYamlZip(
  items: TranslationItem[],
  languages: string[],
  options: ExportOptions,
  zipFilename = 'translations_yaml.zip'
) {
  const zip = new JSZip();

  for (const lang of languages) {
    const data = generateLanguageJsonData(items, lang, options.nested);
    const yamlStr = objectToYaml(data);
    zip.file(`${lang}.yaml`, yamlStr);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(content, zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`);
}

/**
 * Generate Android strings.xml content for a language
 */
export function generateAndroidXml(items: TranslationItem[], lang: string): string {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n<!-- Generated by JSON Link -->\n<resources>\n`;

  for (const item of items) {
    // Android resource keys must be alphanumeric + underscores
    const safeKey = item.key.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    let val = item[lang] || '';

    // Escape XML characters and Android special symbols
    val = val
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');

    if (item.description && item.description.trim()) {
      const cleanDesc = item.description.replace(/-->/g, '--');
      xml += `    <!-- ${cleanDesc} -->\n`;
    }
    xml += `    <string name="${safeKey}">${val}</string>\n`;
  }

  xml += `</resources>\n`;
  return xml;
}

/**
 * Export Android XML (res/values/strings.xml, res/values-<lang>/strings.xml)
 */
export async function exportToAndroidXmlZip(
  items: TranslationItem[],
  languages: string[],
  zipFilename = 'android_strings_xml.zip'
) {
  const zip = new JSZip();

  for (const lang of languages) {
    // Android folder naming: default language (e.g. en) goes to "values", others go to "values-<lang>"
    const folderName = lang.toLowerCase() === 'en' ? 'values' : `values-${lang.toLowerCase()}`;
    const xml = generateAndroidXml(items, lang);
    zip.file(`${folderName}/strings.xml`, xml);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(content, zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`);
}

/**
 * Generate iOS Localizable.strings content for a language
 */
export function generateIosStrings(items: TranslationItem[], lang: string): string {
  let content = `/* Localizable.strings (${lang}) - Generated by JSON Link */\n\n`;

  for (const item of items) {
    const key = item.key.replace(/"/g, '\\"');
    const val = (item[lang] || '').replace(/"/g, '\\"').replace(/\n/g, '\\n');

    if (item.description && item.description.trim()) {
      const cleanDesc = item.description.replace(/\*\//g, '* /');
      content += `/* ${cleanDesc} */\n`;
    }
    content += `"${key}" = "${val}";\n`;
  }

  return content;
}

/**
 * Export iOS Localizable.strings (<lang>.lproj/Localizable.strings)
 */
export async function exportToIosStringsZip(
  items: TranslationItem[],
  languages: string[],
  zipFilename = 'ios_strings.zip'
) {
  const zip = new JSZip();

  for (const lang of languages) {
    const folderName = `${lang.toLowerCase()}.lproj`;
    const content = generateIosStrings(items, lang);
    zip.file(`${folderName}/Localizable.strings`, content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`);
}

/**
 * Export TypeScript Type Definitions (translations.d.ts)
 */
export function exportToTypeScriptDts(
  items: TranslationItem[],
  languages: string[],
  filename = 'translations.d.ts'
) {
  const keysUnion = items.map(i => `  | ${JSON.stringify(i.key)}`).join('\n');
  const langsUnion = languages.map(l => `  | ${JSON.stringify(l)}`).join('\n');

  const content = `/**
 * Autogenerated Translation Types
 * Generated by JSON Link (https://github.com/pyaephyomaungdev/json-link)
 * Total Keys: ${items.length}
 * Total Languages: ${languages.length} (${languages.join(', ')})
 */

export type SupportedLanguage =
${langsUnion};

export type TranslationKey =
${keysUnion || "  never"};

export interface TranslationDictionary {
  [key: TranslationKey]: string;
}

export type I18nResources = {
  [lang in SupportedLanguage]: Record<TranslationKey, string>;
};
`;

  const blob = new Blob([content], { type: 'text/typescript;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.d.ts') ? filename : `${filename}.d.ts`);
}

export type ProjectBundlePreset = 'all-in-one' | 'web-json' | 'flutter-arb' | 'mobile-native';

/**
 * One-Click Project Bundle ZIP Export:
 * Generates an all-in-one organized ZIP bundle with ready-to-drop folders for Web, Flutter, iOS, and Android.
 */
export async function exportAllAsProjectBundle(
  items: TranslationItem[],
  languages: string[],
  options: Partial<ExportOptions> = {},
  preset: ProjectBundlePreset = 'all-in-one',
  zipFilename = 'jsonlink_project_bundle.zip'
) {
  const zip = new JSZip();
  const nested = options.nested ?? false;
  const indent = options.indent ?? 2;

  // 1. Web JSON Bundle
  if (preset === 'all-in-one' || preset === 'web-json') {
    const webFolder = zip.folder('web-locales');
    for (const lang of languages) {
      const data = generateLanguageJsonData(items, lang, nested);
      webFolder?.file(`${lang}.json`, JSON.stringify(data, null, indent));
    }
  }

  // 2. Flutter ARB Bundle
  if (preset === 'all-in-one' || preset === 'flutter-arb') {
    const flutterFolder = zip.folder('flutter-l10n');
    for (const lang of languages) {
      const arb: Record<string, any> = {
        '@@locale': lang,
      };
      for (const item of items) {
        arb[item.key] = item[lang] || '';
        if (item.description) {
          arb[`@${item.key}`] = { description: item.description };
        }
      }
      flutterFolder?.file(`app_${lang}.arb`, JSON.stringify(arb, null, 2));
    }
  }

  // 3. iOS & Android Mobile Native Bundle
  if (preset === 'all-in-one' || preset === 'mobile-native') {
    const iosFolder = zip.folder('ios-strings');
    for (const lang of languages) {
      const content = generateIosStrings(items, lang);
      iosFolder?.file(`${lang}.lproj/Localizable.strings`, content);
    }

    const androidFolder = zip.folder('android-res');
    for (const lang of languages) {
      const xml = generateAndroidXml(items, lang);
      const folderName = lang.toLowerCase() === 'en' ? 'values' : `values-${lang.toLowerCase()}`;
      androidFolder?.file(`${folderName}/strings.xml`, xml);
    }
  }

  // 4. Autogenerated TypeScript Type Definitions
  if (preset === 'all-in-one' || preset === 'web-json') {
    const keysUnion = items.map(i => `  | ${JSON.stringify(i.key)}`).join('\n');
    const langsUnion = languages.map(l => `  | ${JSON.stringify(l)}`).join('\n');
    const dtsContent = `/**
 * Autogenerated Translation Types
 * Generated by JSON Link (https://json-link.pages.dev)
 */
export type SupportedLanguage =
${langsUnion};

export type TranslationKey =
${keysUnion || '  never'};

export type I18nResources = {
  [lang in SupportedLanguage]: Record<TranslationKey, string>;
};
`;
    zip.file('translations.d.ts', dtsContent);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`);
}


