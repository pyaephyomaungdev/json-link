import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { TranslationItem, ExportOptions } from '@/types';
import { unflattenObject } from './parser';
import { VITE_STARTER_AI_SKILL_MD } from './skillTemplate';

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

    // Escape backslashes first, then XML characters and Android special symbols
    val = val
      .replace(/\\/g, '\\\\')
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
    const key = item.key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const val = (item[lang] || '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');

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
 * Generates Flutter ARB JSON object for a specific language
 */
export function generateArbData(
  items: TranslationItem[],
  lang: string
): Record<string, any> {
  const result: Record<string, any> = {
    '@@locale': lang,
  };

  for (const item of items) {
    result[item.key] = item[lang] || '';
    if (item.description && item.description.trim()) {
      result[`@${item.key}`] = {
        description: item.description.trim(),
      };
    }
  }

  return result;
}

/**
 * Export Flutter ARB files bundled in a ZIP archive
 */
export async function exportToArbZip(
  items: TranslationItem[],
  languages: string[],
  zipFilename = 'flutter_arb.zip'
) {
  const zip = new JSZip();

  for (const lang of languages) {
    const data = generateArbData(items, lang);
    const cleanLang = lang.replace('-', '_');
    zip.file(`app_${cleanLang}.arb`, JSON.stringify(data, null, 2));
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`);
}

/**
 * Export a single language Flutter ARB file directly (app_<lang>.arb)
 */
export function exportSingleLanguageArb(
  items: TranslationItem[],
  lang: string
) {
  const data = generateArbData(items, lang);
  const cleanLang = lang.replace('-', '_');
  const arbStr = JSON.stringify(data, null, 2);
  const blob = new Blob([arbStr], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `app_${cleanLang}.arb`);
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

/**
 * Phase 1: Static React + Vite i18n Starter Kit ZIP Export
 * Bundles:
 * - Ready-to-run package.json, vite.config.ts, tsconfig.json, index.html
 * - src/locales/ containing all exported JSONs, translations.d.ts, and reactive i18n.ts loader
 * - src/App.tsx demo showcase with instant language toggle and drop-in integration instructions
 * - README.md documentation
 */
export async function exportToViteStarterZip(
  items: TranslationItem[],
  languages: string[],
  options: Partial<ExportOptions> = {},
  zipFilename = 'vite_i18n_starter.zip'
) {
  const zip = new JSZip();
  const nested = options.nested ?? false;
  const indent = options.indent ?? 2;
  const firstLang = languages[0] || 'en';

  // 1. package.json
  const packageJson = {
    name: 'jsonlink-vite-i18n-starter',
    private: true,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc -b && vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },
    devDependencies: {
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@vitejs/plugin-react': '^4.3.4',
      typescript: '^5.7.2',
      vite: '^6.0.0',
    },
  };
  zip.file('package.json', JSON.stringify(packageJson, null, 2));

  // 2. vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
});
`;
  zip.file('vite.config.ts', viteConfig);

  // 3. tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: false,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      types: ['vite/client'],
    },
    include: ['src'],
  };
  zip.file('tsconfig.json', JSON.stringify(tsConfig, null, 2));

  // src/vite-env.d.ts
  zip.file('src/vite-env.d.ts', '/// <reference types="vite/client" />\n');

  // 4. index.html
  const indexHtml = `<!doctype html>
<html lang="${firstLang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JSON Link — Vite i18n Starter</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  zip.file('index.html', indexHtml);

  // 5. README.md
  const readmeMd = `# JSON Link — Vite React i18n Starter Kit

Exported from [JSON Link](https://json-link.pages.dev) on ${new Date().toISOString().split('T')[0]}.

Tested Golden Stack: **React 19.0.0** • **Vite 6.0.0** • **TypeScript 5.7.2**

This starter kit includes your exported translations, strongly-typed TypeScript definitions (\`translations.d.ts\`), an ultra-lightweight client loader (\`src/locales/i18n.ts\`, ~120 lines, zero external dependencies) with native Vite HMR, and the embedded live Devtools drawer (\`<JsonLinkDevtools />\`).

---

## Quick Start (Standalone Demo)

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
\`\`\`

Open your browser at \`http://localhost:5173\` to see real-time language switching, live copy tweaking via Devtools, and HMR updates.

---

## Drop Into an Existing Project (Recommended)

You don't need to clone or adopt this whole repository. You only need the \`src/locales\` directory:

### Step 1: Copy \`src/locales/\`
Copy the \`src/locales/\` folder from this starter into your project's \`src/\` directory:
\`\`\`bash
cp -r src/locales/ /path-to-your-project/src/
\`\`\`

### Step 2: Use in any React Component (3 Lines)
\`\`\`tsx
import { useTranslation } from './locales/i18n';

export function Header() {
  const { t, language, setLanguage, languages } = useTranslation();

  return (
    <div>
      <h1>{t('${items[0]?.key || 'app.title'}')}</h1>
      <select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
        {languages.map((lang) => (
          <option key={lang} value={lang}>{lang.toUpperCase()}</option>
        ))}
      </select>
    </div>
  );
}
\`\`\`

### Step 3: Fast HMR on Locale Edits
Whenever you update any file in \`src/locales/*.json\`, Vite's native HMR will instantly update the text in your browser without reloading the page!

### Step 4: Live In-App Copy Tweaking with Devtools Drawer
Mount \`<JsonLinkDevtools />\` in your root component during local development:
\`\`\`tsx
import { JsonLinkDevtools } from './locales/devtools';

export function App() {
  return (
    <div>
      <YourContent />
      {import.meta.env.DEV && <JsonLinkDevtools />}
    </div>
  );
}
\`\`\`
Click the floating **⚡ JSON Link Devtools** pill in the bottom corner to search keys, live-tweak copy strings directly inside the running browser tab, and 1-click download or copy updated JSON dictionaries!

### Step 5: Official AI Skill Bundled
This starter kit includes \`.agents/skills/jsonlink-vite-i18n/SKILL.md\` directly in the archive. AI coding tools (Cursor, Claude Desktop, Antigravity) will automatically discover it to help you add new keys, wire up translations, or configure persistence with zero prompt setup.
`;
  zip.file('README.md', readmeMd);

  // 6. src/locales/
  const localesFolder = zip.folder('src/locales');

  // Locale JSONs
  for (const lang of languages) {
    const data = generateLanguageJsonData(items, lang, nested);
    localesFolder?.file(`${lang}.json`, JSON.stringify(data, null, indent));
  }

  // translations.d.ts
  const keysUnion = items.map(i => `  | ${JSON.stringify(i.key)}`).join('\n');
  const langsUnion = languages.map(l => `  | ${JSON.stringify(l)}`).join('\n');
  const dtsContent = `/**
 * Autogenerated Translation Types
 * Generated by JSON Link (https://json-link.pages.dev)
 */

export type SupportedLanguage =
${langsUnion};

export type TranslationKey =
${keysUnion || '  string'};

export interface TranslationDictionary {
  [key: TranslationKey]: string;
}

export type I18nResources = {
  [lang in SupportedLanguage]: Record<TranslationKey, string>;
};
`;
  localesFolder?.file('translations.d.ts', dtsContent);

  // i18n.ts (Client Loader with React Hook & HMR)
  const importLines = languages
    .map(l => `import ${l.replace(/[^a-zA-Z0-9_]/g, '_')} from './${l}.json';`)
    .join('\n');

  const resourceEntries = languages
    .map(l => `  ${JSON.stringify(l)}: ${l.replace(/[^a-zA-Z0-9_]/g, '_')},`)
    .join('\n');

  const i18nContent = `import { useState, useEffect, useCallback } from 'react';
import type { SupportedLanguage, TranslationKey } from './translations';
export type { SupportedLanguage, TranslationKey } from './translations';

${importLines}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [${languages.map(l => JSON.stringify(l)).join(', ')}];
export const DEFAULT_LANGUAGE: SupportedLanguage = ${JSON.stringify(firstLang)};

export const resources: Record<SupportedLanguage, Record<string, any>> = {
${resourceEntries}
};

let currentLang: SupportedLanguage = DEFAULT_LANGUAGE;
const listeners = new Set<() => void>();

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj) return undefined;
  if (path in obj) return obj[path];
  const parts = path.split('.');
  let cur = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

/**
 * Pure translation function: looks up key in active dictionary with fallback
 */
export function t(
  key: TranslationKey,
  params?: Record<string, string | number>,
  lang: SupportedLanguage = currentLang
): string {
  const dict = resources[lang] || resources[DEFAULT_LANGUAGE];
  let text = getNestedValue(dict, key) ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.split('{' + k + '}').join(String(v));
    }
  }
  return text;
}

/**
 * In-memory copy update (powers Devtools drawer live copy preview)
 */
export function updateTranslation(
  key: TranslationKey,
  value: string,
  lang: SupportedLanguage = currentLang
) {
  if (!resources[lang]) return;
  const parts = (key as string).split('.');
  if (parts.length === 1) {
    resources[lang][key] = value;
  } else {
    let cur = resources[lang];
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') {
        cur[parts[i]] = {};
      }
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }
  listeners.forEach((fn) => fn());
}

/**
 * Switch global active language
 */
export function setLanguage(lang: SupportedLanguage) {
  if (currentLang !== lang && SUPPORTED_LANGUAGES.includes(lang)) {
    currentLang = lang;
    listeners.forEach((fn) => fn());
  }
}

/**
 * Get current global language
 */
export function getLanguage(): SupportedLanguage {
  return currentLang;
}

/**
 * React hook for components needing reactive localization updates
 */
export function useTranslation() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((v) => v + 1);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const translate = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      return t(key, params, currentLang);
    },
    []
  );

  return {
    t: translate,
    language: currentLang,
    setLanguage,
    languages: SUPPORTED_LANGUAGES,
  };
}

// Vite Native HMR Support
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    listeners.forEach((fn) => fn());
  });
}
`;
  localesFolder?.file('i18n.ts', i18nContent);

  // devtools.tsx (In-App Live Translation Drawer)
  const devtoolsContent = `import { useState, useMemo, useEffect } from 'react';
import { resources, updateTranslation, SUPPORTED_LANGUAGES, useTranslation, setLanguage } from './i18n';
import type { SupportedLanguage, TranslationKey } from './translations';

function getFlattenedEntries(obj: Record<string, any>, prefix = ''): { key: string; value: string }[] {
  let entries: { key: string; value: string }[] = [];
  if (!obj || typeof obj !== 'object') return entries;
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? \`\${prefix}.\${k}\` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      entries = entries.concat(getFlattenedEntries(v, fullKey));
    } else {
      entries.push({ key: fullKey, value: String(v ?? '') });
    }
  }
  return entries;
}

interface KeyEditorRowProps {
  itemKey: string;
  initialValue: string;
  activeLang: SupportedLanguage;
  onUpdate: (key: string, val: string) => void;
}

function KeyEditorRow({ itemKey, initialValue, activeLang, onUpdate }: KeyEditorRowProps) {
  const [val, setVal] = useState(initialValue);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue, activeLang]);

  return (
    <div
      style={{
        backgroundColor: 'hsl(var(--muted) / 0.4)',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'hsl(var(--primary))',
            fontWeight: 600,
            wordBreak: 'break-all',
          }}
        >
          {itemKey}
        </span>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(itemKey)}
          title="Copy key path"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '11px',
            color: 'hsl(var(--muted-foreground))',
            padding: '2px 4px',
            borderRadius: '4px',
          }}
        >
          📋
        </button>
      </div>
      <textarea
        value={val}
        rows={2}
        onChange={(e) => {
          const newVal = e.target.value;
          setVal(newVal);
          onUpdate(itemKey, newVal);
        }}
        placeholder="Empty string..."
        style={{
          width: '100%',
          backgroundColor: 'hsl(var(--background))',
          border: '1px solid hsl(var(--input))',
          borderRadius: '6px',
          padding: '6px 8px',
          color: 'hsl(var(--foreground))',
          fontSize: '12px',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1.5,
          resize: 'vertical',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />
    </div>
  );
}

export interface JsonLinkDevtoolsProps {
  defaultOpen?: boolean;
}

export function JsonLinkDevtools({ defaultOpen = false }: JsonLinkDevtoolsProps) {
  const { language: currentAppLang } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [inspectLang, setInspectLang] = useState<SupportedLanguage>(currentAppLang);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [modifiedCount, setModifiedCount] = useState(0);

  // Sync inspect language with app language changes if user switches app language
  useEffect(() => {
    setInspectLang(currentAppLang);
  }, [currentAppLang]);

  const activeDict = resources[inspectLang] || {};
  const allEntries = useMemo(() => getFlattenedEntries(activeDict), [activeDict]);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allEntries;
    return allEntries.filter(
      (e) => e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q)
    );
  }, [allEntries, query]);

  const handleUpdate = (key: string, val: string) => {
    updateTranslation(key as TranslationKey, val, inspectLang);
    setModifiedCount((prev) => prev + 1);
  };

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(resources[inspectLang], null, 2);
    navigator.clipboard?.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(resources[inspectLang], null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`\${inspectLang}.json\`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 99999, fontFamily: 'var(--font-sans)' }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '9999px',
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.15s ease',
            fontFamily: 'var(--font-sans)',
          }}
          title="Open JSON Link Devtools"
        >
          <span style={{ color: 'hsl(var(--primary))' }}>⚡</span>
          <span>JSON Link Devtools</span>
          <span
            style={{
              backgroundColor: 'hsl(var(--muted))',
              border: '1px solid hsl(var(--border))',
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'hsl(var(--foreground))',
              textTransform: 'uppercase',
            }}
          >
            {inspectLang}
          </span>
          {modifiedCount > 0 && (
            <span
              style={{
                backgroundColor: 'hsl(var(--destructive))',
                color: 'hsl(var(--destructive-foreground))',
                borderRadius: '9999px',
                padding: '1px 6px',
                fontSize: '10px',
                fontWeight: 800,
              }}
            >
              {modifiedCount}
            </span>
          )}
        </button>
      )}

      {/* Slide-over / Modal Drawer */}
      {isOpen && (
        <div
          style={{
            width: '420px',
            maxWidth: 'calc(100vw - 32px)',
            height: '580px',
            maxHeight: 'calc(100vh - 48px)',
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
            color: 'hsl(var(--foreground))',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid hsl(var(--border))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'hsl(var(--card))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'hsl(var(--primary))', fontSize: '14px', fontWeight: 800 }}>⚡</span>
              <span style={{ color: 'hsl(var(--foreground))', fontSize: '13px', fontWeight: 700 }}>
                JSON Link Devtools
              </span>
              <span
                style={{
                  backgroundColor: 'hsl(var(--primary) / 0.12)',
                  color: 'hsl(var(--primary))',
                  border: '1px solid hsl(var(--primary) / 0.25)',
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                LIVE
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'hsl(var(--muted-foreground))',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
                lineHeight: 1,
              }}
              title="Close drawer"
            >
              ✕
            </button>
          </div>

          {/* Subheader: Languages & Search */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Language Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', fontWeight: 600, marginRight: '4px' }}>
                Locale:
              </span>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = inspectLang === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setInspectLang(lang);
                      setLanguage(lang);
                    }}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '5px',
                      border: '1px solid ' + (isSelected ? 'transparent' : 'hsl(var(--border))'),
                      fontSize: '11px',
                      fontWeight: isSelected ? 700 : 500,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      backgroundColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                      color: isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                      boxShadow: isSelected ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none',
                    }}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>

            {/* Filter Search Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter keys or text content..."
              style={{
                width: '100%',
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--input))',
                borderRadius: '8px',
                padding: '7px 12px',
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Key Rows List (Scrollable) */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {filteredEntries.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '12px', padding: '32px 0' }}>
                No translation keys match &ldquo;{query}&rdquo;
              </div>
            ) : (
              filteredEntries.map((item) => (
                <KeyEditorRow
                  key={item.key}
                  itemKey={item.key}
                  initialValue={item.value}
                  activeLang={inspectLang}
                  onUpdate={handleUpdate}
                />
              ))
            )}
          </div>

          {/* Footer Toolbar */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--card))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-mono)' }}>
              {filteredEntries.length} key{filteredEntries.length === 1 ? '' : 's'}
              {modifiedCount > 0 && \` • \${modifiedCount} edit\${modifiedCount === 1 ? '' : 's'}\`}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleCopyJson}
                style={{
                  backgroundColor: 'hsl(var(--secondary))',
                  color: 'hsl(var(--secondary-foreground))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {copied ? '✓ Copied' : '📋 Copy JSON'}
              </button>
              <button
                type="button"
                onClick={handleDownloadJson}
                style={{
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                💾 Download JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;
  localesFolder?.file('devtools.tsx', devtoolsContent);

  // 7. src/index.css
  const indexCss = `*, *::before, *::after {
  box-sizing: border-box;
}

:root {
  --background: 210 40% 98%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
  --primary: 221 83% 53%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 221 83% 53%;
  --radius: 0.5rem;

  --font-sans: 'Inter', 'Noto Sans Myanmar', 'Pyidaungsu', 'Myanmar Text', 'Myanmar Sangam MN', 'Myanmar MN', 'Padauk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Noto Sans Myanmar', 'Pyidaungsu', 'Myanmar Text', 'Myanmar Sangam MN', 'Myanmar MN', 'Padauk', monospace;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: 222 47% 7%;
    --foreground: 210 40% 98%;
    --card: 222 47% 10%;
    --card-foreground: 210 40% 98%;
    --popover: 222 47% 10%;
    --popover-foreground: 210 40% 98%;
    --primary: 217 91% 60%;
    --primary-foreground: 222 47% 11%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --accent: 217 33% 17%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 210 40% 98%;
    --border: 217 33% 20%;
    --input: 217 33% 20%;
    --ring: 224 76% 48%;
  }
}

body {
  margin: 0;
  font-family: var(--font-sans);
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

code {
  font-family: var(--font-mono);
}
`;
  zip.file('src/index.css', indexCss);

  // 8. src/App.tsx
  const sampleKey = items[0]?.key || 'app.title';
  const sampleKey2 = items[1]?.key || items[0]?.key || 'app.description';

  const appTsx = `import { useTranslation } from './locales/i18n';
import { JsonLinkDevtools } from './locales/devtools';

export default function App() {
  const { t, language, setLanguage, languages } = useTranslation();

  return (
    <div style={{ maxWidth: '640px', width: '100%', margin: '0 auto', position: 'relative' }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #0d9488 50%, #4f46e5 100%)',
            padding: '1.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'hsl(var(--card))',
              borderRadius: '8.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg viewBox="0 0 32 32" fill="none" style={{ width: '22px', height: '22px' }}>
                <path d="M11 7C9.34 7 8 8.34 8 10V13C8 14.66 6.66 16 5 16C6.66 16 8 17.34 8 19V22C8 23.66 9.34 25 11 25" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 7C22.66 7 24 8.34 24 10V13C24 14.66 25.34 16 27 16C25.34 16 24 17.34 24 19V22C24 23.66 22.66 25 21 25" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 16H20" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="1 2.5" />
                <circle cx="12" cy="16" r="2" fill="#34d399" />
                <circle cx="20" cy="16" r="2" fill="#38bdf8" />
              </svg>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.025em', color: 'hsl(var(--foreground))' }}>JSON</span>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.025em', background: 'linear-gradient(to right, #10b981, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Link</span>
            <span style={{ marginLeft: '6px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.2)' }}>Vite Starter</span>
          </div>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.025em', color: 'hsl(var(--foreground))' }}>
          Real-Time Translation Demo
        </h1>
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px', margin: 0, lineHeight: 1.5, textAlign: 'center' }}>
          Language switching with zero reload, live Devtools drawer, and native Vite HMR.
        </p>
      </div>

      {/* Language Switcher Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        backgroundColor: 'hsl(var(--muted))',
        padding: '4px',
        borderRadius: '10px',
        border: '1px solid hsl(var(--border))',
        marginBottom: '24px',
        width: 'fit-content',
        margin: '0 auto 24px auto',
      }}>
        <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', fontWeight: 600, padding: '0 8px' }}>
          Select Language:
        </span>
        {languages.map((lang) => {
          const isActive = language === lang;
          return (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              style={{
                padding: '5px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                transition: 'all 0.15s ease',
                backgroundColor: isActive ? 'hsl(var(--card))' : 'transparent',
                color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
              }}
            >
              {lang}
            </button>
          );
        })}
      </div>

      {/* Live Preview Card */}
      <div style={{
        backgroundColor: 'hsl(var(--card))',
        borderRadius: '14px',
        border: '1px solid hsl(var(--border))',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: 'hsl(var(--primary))',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '10px',
        }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary))' }} />
          Live Render ({language.toUpperCase()})
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: '8px', lineHeight: 1.35, fontFamily: 'var(--font-sans)' }}>
          {t('${sampleKey}')}
        </div>
        <div style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
          {t('${sampleKey2}')}
        </div>
      </div>

      {/* Drop-in Integration Box */}
      <div style={{
        backgroundColor: 'hsl(var(--muted) / 0.35)',
        borderRadius: '12px',
        border: '1px dashed hsl(var(--border))',
        padding: '18px 20px',
        marginBottom: '20px',
      }}>
        <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🚀</span>
          <span>Drop into your existing React / Vite project:</span>
        </div>
        <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8, fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
          <li>Copy <code style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', padding: '1px 5px', borderRadius: '4px', color: 'hsl(var(--foreground))' }}>src/locales/</code> into your project.</li>
          <li>Import: <code style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', padding: '1px 5px', borderRadius: '4px', color: 'hsl(var(--primary))' }}>import &#123; useTranslation &#125; from './locales/i18n';</code></li>
          <li>Use: <code style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', padding: '1px 5px', borderRadius: '4px', color: 'hsl(var(--foreground))' }}>const &#123; t &#125; = useTranslation();</code></li>
        </ol>
      </div>

      {/* Devtools Prompt (DEV mode only) */}
      {import.meta.env.DEV && (
        <div style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'hsl(var(--muted-foreground))',
          backgroundColor: 'hsl(var(--primary) / 0.06)',
          border: '1px solid hsl(var(--primary) / 0.15)',
          borderRadius: '8px',
          padding: '10px 14px',
        }}>
          💡 In local dev mode (<code>import.meta.env.DEV</code>), click the <strong style={{ color: 'hsl(var(--primary))' }}>⚡ JSON Link Devtools</strong> button in the bottom-right corner to live-tweak any copy in this app.
        </div>
      )}

      {/* Embedded In-App Devtools Drawer (Gated via import.meta.env.DEV) */}
      {import.meta.env.DEV && <JsonLinkDevtools />}
    </div>
  );
}
`;
  zip.file('src/App.tsx', appTsx);

  // 9. src/main.tsx
  const mainTsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
  zip.file('src/main.tsx', mainTsx);

  // 10. .agents/skills/jsonlink-vite-i18n/SKILL.md (Official AI Agent Skill)
  zip.file('.agents/skills/jsonlink-vite-i18n/SKILL.md', VITE_STARTER_AI_SKILL_MD);

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`);
}



