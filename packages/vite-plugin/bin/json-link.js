#!/usr/bin/env node

import { runInit, detectPackageManager } from '../dist/init.js';

const args = process.argv.slice(2);
const command = args[0] || 'init';

if (command === 'init') {
  console.log('\n\x1b[36m⚡ JSON Link — Initializing Localization Platform...\x1b[0m\n');
  
  const targetDir = process.cwd();
  const pm = detectPackageManager(targetDir);
  const result = runInit(targetDir);

  if (!result.success) {
    console.error(`\x1b[31m✖ ${result.message}\x1b[0m\n`);
    process.exit(1);
  }

  console.log(`\x1b[32m✔\x1b[0m Configured Vite plugin in \x1b[1m${result.viteConfigFile}\x1b[0m`);
  if (result.localesCreated) {
    console.log(`\x1b[32m✔\x1b[0m Scaffolding \x1b[1msrc/locales/\x1b[0m (en.json, my.json, translations.d.ts, i18n.ts)`);
  } else {
    console.log(`\x1b[33mℹ\x1b[0m Existing \x1b[1msrc/locales/\x1b[0m preserved`);
  }

  console.log('\n\x1b[32m\x1b[1m🎉 JSON Link Dev Dashboard is ready!\x1b[0m');
  console.log('\nStart your development server:');
  console.log(`  \x1b[36m${pm === 'npm' ? 'npm run dev' : `${pm} dev`}\x1b[0m\n`);
  console.log('Open your translation workspace:');
  console.log('  👉 \x1b[36mhttp://localhost:5173/__jsonlink\x1b[0m\n');
  console.log('All changes write directly to disk with instant Vite HMR.\n');
} else {
  console.log('Usage: npx @jsonlink/vite-plugin init');
}
