import fs from 'node:fs';
import path from 'node:path';

export interface StarterOptions {
  targetDir: string;
  projectName: string;
}

export function scaffoldStarterProject(options: StarterOptions): { success: boolean; message?: string } {
  const { targetDir, projectName } = options;

  if (fs.existsSync(targetDir)) {
    const files = fs.readdirSync(targetDir);
    if (files.length > 0) {
      return {
        success: false,
        message: `Target directory "${projectName}" is not empty. Please use an empty directory or existing Vite project.`,
      };
    }
  } else {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. package.json
  const packageJson = {
    name: projectName,
    private: true,
    version: "0.1.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc -b && vite build",
      preview: "vite preview"
    },
    dependencies: {
      react: "^19.0.0",
      "react-dom": "^19.0.0",
      "lucide-react": "^1.16.0"
    },
    devDependencies: {
      "@jsonlink/vite-plugin": "^1.0.0",
      "@types/react": "^19.0.10",
      "@types/react-dom": "^19.0.4",
      "@vitejs/plugin-react": "^4.3.4",
      typescript: "~5.7.2",
      vite: "^6.2.0"
    }
  };
  fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');

  // 2. vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { jsonLink } from '@jsonlink/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    jsonLink({
      localesDir: './src/locales',
      route: '/__jsonlink',
    }),
  ],
});
`;
  fs.writeFileSync(path.join(targetDir, 'vite.config.ts'), viteConfig);

  // 3. tsconfig.json, tsconfig.app.json, tsconfig.node.json
  const tsconfig = {
    files: [],
    references: [
      { path: "./tsconfig.app.json" },
      { path: "./tsconfig.node.json" }
    ]
  };
  fs.writeFileSync(path.join(targetDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2) + '\n');

  const tsconfigApp = {
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: false,
      isolatedModules: true,
      moduleDetection: "force",
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true
    },
    include: ["src"]
  };
  fs.writeFileSync(path.join(targetDir, 'tsconfig.app.json'), JSON.stringify(tsconfigApp, null, 2) + '\n');

  const tsconfigNode = {
    compilerOptions: {
      target: "ES2022",
      lib: ["ES2023"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      isolatedModules: true,
      moduleDetection: "force",
      noEmit: true,
      strict: true
    },
    include: ["vite.config.ts"]
  };
  fs.writeFileSync(path.join(targetDir, 'tsconfig.node.json'), JSON.stringify(tsconfigNode, null, 2) + '\n');

  // 4. index.html
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Myanmar:wght@400;500;600;700&display=swap" rel="stylesheet">
    <title>JSON Link App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  fs.writeFileSync(path.join(targetDir, 'index.html'), indexHtml);

  // 5. src directory
  const srcDir = path.join(targetDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  // 6. src/index.css
  const indexCss = `:root {
  font-family: 'Inter', 'Noto Sans Myanmar', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: dark light;
  color: rgba(255, 255, 255, 0.87);
  background-color: #0f172a;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
`;
  fs.writeFileSync(path.join(srcDir, 'index.css'), indexCss);

  // 7. src/App.css
  const appCss = `.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  padding: 0.35rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  color: #38bdf8;
}

.title {
  font-size: 2.75rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.15rem;
  color: #94a3b8;
  margin: 0;
  max-width: 600px;
}

.lang-picker {
  display: inline-flex;
  background: #1e293b;
  padding: 0.25rem;
  border-radius: 0.75rem;
  border: 1px solid #334155;
  gap: 0.25rem;
}

.lang-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.lang-btn.active {
  background: #3b82f6;
  color: #ffffff;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 1rem;
  padding: 1.75rem;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #f8fafc;
}

.card p {
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.6;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #2563eb;
  color: #ffffff;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.2s;
}

.btn-action:hover {
  background: #1d4ed8;
}

.btn-outline {
  background: transparent;
  border: 1px solid #475569;
  color: #f8fafc;
}

.btn-outline:hover {
  background: #334155;
}
`;
  fs.writeFileSync(path.join(srcDir, 'App.css'), appCss);

  // 8. src/main.tsx
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
  fs.writeFileSync(path.join(srcDir, 'main.tsx'), mainTsx);

  // 9. src/App.tsx
  const appTsx = `import { useState } from 'react';
import { useTranslation, SupportedLanguage } from './locales/i18n';
import './App.css';

export default function App() {
  const { t, language, setLanguage, languages } = useTranslation();
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <div className="badge">
        <span>⚡</span>
        <span>JSON Link Local-First Platform</span>
      </div>

      <h1 className="title">{t('app.title')}</h1>
      <p className="subtitle">{t('app.subtitle')}</p>

      {/* Language Switcher */}
      <div className="lang-picker">
        {languages.map((lang: SupportedLanguage) => (
          <button
            key={lang}
            className={\`lang-btn \${language === lang ? 'active' : ''}\`}
            onClick={() => setLanguage(lang)}
          >
            {lang === 'en' ? 'English' : 'မြန်မာ'}
          </button>
        ))}
      </div>

      <div className="card-grid">
        {/* Interactive Demo Card */}
        <div className="card">
          <div>
            <h3>{t('counter.label')}</h3>
            <p>{t('auth.welcome', { username: 'Developer' })}</p>
            <p>{t('counter.clicks', { count })}</p>
          </div>
          <button className="btn-action btn-outline" onClick={() => setCount((c) => c + 1)}>
            {t('counter.button')}
          </button>
        </div>

        {/* Devtool Dashboard Card */}
        <div className="card">
          <div>
            <h3>{t('dashboard.card.title')}</h3>
            <p>{t('dashboard.card.desc')}</p>
          </div>
          <a
            href="/__jsonlink"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-action"
          >
            {t('dashboard.card.button')} ↗
          </a>
        </div>
      </div>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(srcDir, 'App.tsx'), appTsx);

  // 10. src/locales/
  const localesDir = path.join(srcDir, 'locales');
  fs.mkdirSync(localesDir, { recursive: true });

  const enJson = {
    "app.title": "JSON Link Starter",
    "app.subtitle": "Instant local-first localization for modern React applications with Vite HMR.",
    "auth.welcome": "Welcome back, {username}!",
    "counter.label": "Reactive Localization Demo",
    "counter.clicks": "You have clicked {count} times.",
    "counter.button": "Increment Counter",
    "dashboard.card.title": "Live Translation Workspace",
    "dashboard.card.desc": "Inspect, edit, and organize all your translation keys side-by-side with two-way disk synchronization.",
    "dashboard.card.button": "Open Dev Dashboard",
    "common.switch_language": "Language",
    "common.english": "English",
    "common.myanmar": "မြန်မာ"
  };
  fs.writeFileSync(path.join(localesDir, 'en.json'), JSON.stringify(enJson, null, 2) + '\n');

  const myJson = {
    "app.title": "JSON Link စတင်အသုံးပြုခြင်း",
    "app.subtitle": "React အက်ပ်များအတွက် Vite HMR ဖြင့် ချက်ချင်းချိတ်ဆက်အလုပ်လုပ်သော ဘာသာစကားစုံသုံး စနစ်။",
    "auth.welcome": "ကြိုဆိုပါတယ် {username}!",
    "counter.label": "အပြန်အလှန်တုံ့ပြန်နိုင်သော ကောင်တာ",
    "counter.clicks": "သင် {count} ကြိမ် နှိပ်ခဲ့ပြီးပါပြီ။",
    "counter.button": "ကောင်တာ တိုးမည်",
    "dashboard.card.title": "တိုက်ရိုက် ဘာသာပြန် ဒက်ရှ်ဘုတ်",
    "dashboard.card.desc": "စာသားများကို စာရင်းဇယားအတိုင်း ယှဉ်တွဲပြင်ဆင်ပြီး Disk ပေါ်သို့ တိုက်ရိုက်သိမ်းဆည်းနိုင်ပါသည်။",
    "dashboard.card.button": "ဒက်ရှ်ဘုတ် ဖွင့်မည်",
    "common.switch_language": "ဘာသာစကား",
    "common.english": "English",
    "common.myanmar": "မြန်မာ"
  };
  fs.writeFileSync(path.join(localesDir, 'my.json'), JSON.stringify(myJson, null, 2) + '\n');

  const defaultKeys = Object.keys(enJson);
  const translationsDts = `export type SupportedLanguage = "en" | "my";

export type TranslationKey =
${defaultKeys.map(k => `  | ${JSON.stringify(k)}`).join('\n')};

export interface TranslationDictionary {
  [key: string]: string;
}
`;
  fs.writeFileSync(path.join(localesDir, 'translations.d.ts'), translationsDts);

  const i18nTs = `import { useSyncExternalStore } from 'react';
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
  fs.writeFileSync(path.join(localesDir, 'i18n.ts'), i18nTs);

  // 11. .gitignore
  const gitignore = `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`;
  fs.writeFileSync(path.join(targetDir, '.gitignore'), gitignore);

  // 12. README.md
  const readme = `# ${projectName}

A modern React + Vite application preconfigured with **[JSON Link](https://json-link.pages.dev)**.

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start local development server
npm run dev
\`\`\`

- App is running at: **\`http://localhost:5173\`**
- JSON Link Live Dashboard: **\`http://localhost:5173/__jsonlink\`**

## Two-Way Disk Synchronization

Changes made in the \`/__jsonlink\` web devtool are written directly to \`src/locales/*.json\` on disk with instant Vite HMR.
`;
  fs.writeFileSync(path.join(targetDir, 'README.md'), readme);

  return { success: true };
}
