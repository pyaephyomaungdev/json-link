import fs from 'node:fs';
import path from 'node:path';
import { generateTranslationsDts, generateI18nTs } from './fsUtils.js';

export interface InitResult {
  success: boolean;
  viteConfigFile?: string;
  localesCreated?: boolean;
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
  // Check if already configured
  if (configContent.includes('jsonLink(') || configContent.includes('@jsonlink/vite-plugin')) {
    return { content: configContent, changed: false };
  }

  let updated = configContent;

  // 1. Add import statement at the top
  const importStatement = "import { jsonLink } from '@jsonlink/vite-plugin';\n";
  updated = importStatement + updated;

  // 2. Inject jsonLink() into plugins array: plugins: [ ... ]
  const pluginsRegex = /plugins\s*:\s*\[/;
  if (pluginsRegex.test(updated)) {
    updated = updated.replace(pluginsRegex, 'plugins: [\n    jsonLink(),');
  } else {
    // If no plugins array found, inject into defineConfig({ ... })
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
    return false; // Already exists, do not overwrite
  }

  fs.mkdirSync(localesDir, { recursive: true });

  // 1. en.json
  const enData = {
    "app.title": "My Awesome App",
    "app.description": "A modern localized application built with JSON Link and React.",
    "auth.welcome": "Welcome back, {username}!",
    "common.save": "Save Changes",
    "common.cancel": "Cancel"
  };
  fs.writeFileSync(path.join(localesDir, 'en.json'), JSON.stringify(enData, null, 2) + '\n');

  // 2. my.json (Myanmar translation)
  const myData = {
    "app.title": "ကျွန်ုပ်၏အက်ပ်",
    "app.description": "JSON Link နှင့် React ဖြင့် တည်ဆောက်ထားသော ဘာသာစကားစုံသုံး အက်ပ်။",
    "auth.welcome": "ကြိုဆိုပါတယ် {username}!",
    "common.save": "သိမ်းဆည်းမည်",
    "common.cancel": "မလုပ်တော့ပါ"
  };
  fs.writeFileSync(path.join(localesDir, 'my.json'), JSON.stringify(myData, null, 2) + '\n');

  // 3. translations.d.ts
  const defaultKeys = Object.keys(enData);
  const defaultLangs = ['en', 'my'];
  const dtsContent = generateTranslationsDts(defaultKeys, defaultLangs);
  fs.writeFileSync(path.join(localesDir, 'translations.d.ts'), dtsContent);

  // 4. i18n.ts (Reactive client loader)
  const i18nContent = generateI18nTs(defaultLangs);
  fs.writeFileSync(path.join(localesDir, 'i18n.ts'), i18nContent);

  return true;
}

export function runInit(targetDir = process.cwd()): InitResult {
  const configPath = findViteConfig(targetDir);
  if (!configPath) {
    return {
      success: false,
      message: 'No Vite configuration found (vite.config.ts/js). Please run npx json-link init inside a Vite project root.',
    };
  }

  const rawConfig = fs.readFileSync(configPath, 'utf-8');
  const { content: updatedConfig, changed } = injectVitePlugin(rawConfig);
  if (changed) {
    fs.writeFileSync(configPath, updatedConfig, 'utf-8');
  }

  const localesCreated = scaffoldLocales(targetDir);
  return {
    success: true,
    viteConfigFile: path.basename(configPath),
    localesCreated,
  };
}
