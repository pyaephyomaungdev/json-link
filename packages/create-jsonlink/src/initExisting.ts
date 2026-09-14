import fs from 'node:fs';
import path from 'node:path';

export interface InitExistingResult {
  success: boolean;
  viteConfigFile?: string;
  localesCreated?: boolean;
  packageUpdated?: boolean;
  message?: string;
}

export function detectPackageManager(targetDir: string): 'pnpm' | 'yarn' | 'bun' | 'npm' {
  if (fs.existsSync(path.join(targetDir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(targetDir, 'bun.lockb')) || fs.existsSync(path.join(targetDir, 'bun.lock'))) return 'bun';
  if (fs.existsSync(path.join(targetDir, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

export function findViteConfig(targetDir: string): string | null {
  const possibleFiles = [
    'vite.config.ts',
    'vite.config.js',
    'vite.config.mjs',
    'vite.config.mts',
  ];

  for (const file of possibleFiles) {
    const fullPath = path.join(targetDir, file);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

export function injectVitePlugin(configContent: string): { content: string; changed: boolean } {
  if (configContent.includes('jsonLink(') || configContent.includes('@jsonlink/vite-plugin')) {
    return { content: configContent, changed: false };
  }

  let updated = configContent;

  const importStatement = "import { jsonLink } from '@jsonlink/vite-plugin';\n";
  updated = importStatement + updated;

  const pluginsRegex = /plugins\s*:\s*\[/;
  if (pluginsRegex.test(updated)) {
    updated = updated.replace(pluginsRegex, 'plugins: [\n    jsonLink(),');
  } else {
    const defineRegex = /defineConfig\s*\(\s*\{/;
    if (defineRegex.test(updated)) {
      updated = updated.replace(defineRegex, 'defineConfig({\n  plugins: [jsonLink()],');
    }
  }

  return { content: updated, changed: true };
}

export function scaffoldLocales(targetDir: string): boolean {
  const localesDir = path.join(targetDir, 'src', 'locales');
  if (fs.existsSync(localesDir)) {
    return false;
  }

  fs.mkdirSync(localesDir, { recursive: true });

  const enData = {
    "app.title": "My Localized App",
    "app.description": "A modern multilingual application with JSON Link and React.",
    "auth.welcome": "Welcome back, {username}!",
    "common.save": "Save Changes",
    "common.cancel": "Cancel",
    "common.switch_language": "Language",
    "common.english": "English",
    "common.myanmar": "မြန်မာ"
  };
  fs.writeFileSync(path.join(localesDir, 'en.json'), JSON.stringify(enData, null, 2) + '\n');

  const myData = {
    "app.title": "ကျွန်ုပ်၏အက်ပ်",
    "app.description": "JSON Link နှင့် React ဖြင့် တည်ဆောက်ထားသော ဘာသာစကားစုံသုံး အက်ပ်။",
    "auth.welcome": "ကြိုဆိုပါတယ် {username}!",
    "common.save": "သိမ်းဆည်းမည်",
    "common.cancel": "မလုပ်တော့ပါ",
    "common.switch_language": "ဘာသာစကား",
    "common.english": "English",
    "common.myanmar": "မြန်မာ"
  };
  fs.writeFileSync(path.join(localesDir, 'my.json'), JSON.stringify(myData, null, 2) + '\n');

  const defaultKeys = Object.keys(enData);
  const dtsContent = `export type SupportedLanguage = "en" | "my";

export type TranslationKey =
${defaultKeys.map(k => `  | ${JSON.stringify(k)}`).join('\n')};

export interface TranslationDictionary {
  [key: string]: string;
}
`;
  fs.writeFileSync(path.join(localesDir, 'translations.d.ts'), dtsContent);

  const i18nContent = `import { useSyncExternalStore } from 'react';
import type { SupportedLanguage, TranslationKey } from './translations';
import en from './en.json';
import my from './my.json';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'my'];

export const resources: Record<SupportedLanguage, Record<string, any>> = {
  'en': en,
  'my': my,
};

let currentLanguage: SupportedLanguage = 'en';
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function setLanguage(lang: SupportedLanguage): void {
  if (resources[lang]) {
    currentLanguage = lang;
    notify();
  }
}

export function getLanguage(): SupportedLanguage {
  return currentLanguage;
}

function resolveValue(obj: Record<string, any>, key: string): string | undefined {
  if (!obj) return undefined;
  if (obj[key] !== undefined) return String(obj[key]);
  const parts = key.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export function t(
  key: TranslationKey | (string & {}),
  params?: Record<string, string | number>,
  lang?: SupportedLanguage
): string {
  const activeLang = lang || currentLanguage;
  const dict = resources[activeLang] || resources['en'] || {};
  let text = resolveValue(dict, key);

  if (text === undefined) {
    text = resolveValue(resources['en'] || {}, key) ?? key;
  }

  if (params && typeof text === 'string') {
    return text.replace(/\\{([a-zA-Z0-9_]+)\\}/g, (_, varName) => {
      return params[varName] !== undefined ? String(params[varName]) : \`{\${varName}}\`;
    });
  }

  return text;
}

export function useTranslation() {
  const lang = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => currentLanguage
  );

  return {
    t,
    language: lang,
    setLanguage,
    languages: SUPPORTED_LANGUAGES,
  };
}

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) notify();
  });
}
`;
  fs.writeFileSync(path.join(localesDir, 'i18n.ts'), i18nContent);

  return true;
}

export function ensurePluginDependency(targetDir: string): boolean {
  const pkgPath = path.join(targetDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return false;

  try {
    const raw = fs.readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw);
    pkg.devDependencies = pkg.devDependencies || {};

    if (!pkg.devDependencies['@jsonlink/vite-plugin']) {
      pkg.devDependencies['@jsonlink/vite-plugin'] = '^1.0.0';
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      return true;
    }
  } catch {
    // Ignore JSON parse errors
  }
  return false;
}

export function initExistingProject(targetDir = process.cwd()): InitExistingResult {
  const configPath = findViteConfig(targetDir);
  if (!configPath) {
    return {
      success: false,
      message: 'No Vite configuration found (vite.config.ts/js).',
    };
  }

  const rawConfig = fs.readFileSync(configPath, 'utf-8');
  const { content: updatedConfig, changed } = injectVitePlugin(rawConfig);
  if (changed) {
    fs.writeFileSync(configPath, updatedConfig, 'utf-8');
  }

  const localesCreated = scaffoldLocales(targetDir);
  const packageUpdated = ensurePluginDependency(targetDir);

  return {
    success: true,
    viteConfigFile: path.basename(configPath),
    localesCreated,
    packageUpdated,
  };
}
