import path from 'node:path';
import { initExistingProject, findViteConfig, detectPackageManager } from './initExisting.js';
import { scaffoldStarterProject } from './scaffoldStarter.js';

export { initExistingProject, scaffoldStarterProject, detectPackageManager, findViteConfig };

export function runCli(argv = process.argv.slice(2)): void {
  const args = argv.filter(a => !a.startsWith('-'));
  const flags = new Set(argv.filter(a => a.startsWith('-')));

  if (flags.has('--help') || flags.has('-h')) {
    console.log(`
\x1b[36m⚡ create-jsonlink\x1b[0m — Instant local-first localization for React + Vite

\x1b[1mUsage:\x1b[0m
  npm create jsonlink [project-name]
  npx create-jsonlink [project-name]

\x1b[1mModes:\x1b[0m
  1. \x1b[32mNew Project Mode:\x1b[0m
     npx create-jsonlink my-i18n-app
     Scaffolds a complete React + TypeScript + Vite project preconfigured with JSON Link.

  2. \x1b[32mExisting Project Mode:\x1b[0m
     npx create-jsonlink
     (Run inside an existing Vite project root to inject plugin and scaffold locales)
`);
    process.exit(0);
  }

  const projectName = args[0];
  const cwd = process.cwd();

  // Mode 1: Project name provided -> Scaffold new starter app
  if (projectName) {
    const targetDir = path.resolve(cwd, projectName);
    console.log(`\n\x1b[36m⚡ Creating a new JSON Link localized project in\x1b[0m \x1b[1m${targetDir}\x1b[0m...\n`);

    const result = scaffoldStarterProject({ targetDir, projectName });
    if (!result.success) {
      console.error(`\x1b[31m✖ ${result.message}\x1b[0m\n`);
      process.exit(1);
    }

    console.log(`\x1b[32m✔\x1b[0m Project created successfully!`);
    console.log(`\x1b[32m✔\x1b[0m React 19 + TypeScript + Vite configured`);
    console.log(`\x1b[32m✔\x1b[0m JSON Link plugin and reactive i18n client scaffolded\n`);

    console.log(`\x1b[1mNext steps:\x1b[0m`);
    console.log(`  cd \x1b[36m${projectName}\x1b[0m`);
    console.log(`  \x1b[36mnpm install\x1b[0m`);
    console.log(`  \x1b[36mnpm run dev\x1b[0m\n`);

    console.log(`Open in browser:`);
    console.log(`  App:            \x1b[36mhttp://localhost:5173\x1b[0m`);
    console.log(`  Live Devtool:   \x1b[36mhttp://localhost:5173/__jsonlink\x1b[0m\n`);
    return;
  }

  // Mode 2: No argument provided -> Check if current folder is a Vite project
  const existingViteConfig = findViteConfig(cwd);
  if (existingViteConfig) {
    console.log(`\n\x1b[36m⚡ Existing Vite project detected. Initializing JSON Link...\x1b[0m\n`);
    const pm = detectPackageManager(cwd);
    const result = initExistingProject(cwd);

    if (!result.success) {
      console.error(`\x1b[31m✖ ${result.message}\x1b[0m\n`);
      process.exit(1);
    }

    console.log(`\x1b[32m✔\x1b[0m Injected JSON Link plugin into \x1b[1m${result.viteConfigFile}\x1b[0m`);
    if (result.localesCreated) {
      console.log(`\x1b[32m✔\x1b[0m Created \x1b[1msrc/locales/\x1b[0m (en.json, my.json, translations.d.ts, i18n.ts)`);
    } else {
      console.log(`\x1b[33mℹ\x1b[0m Existing \x1b[1msrc/locales/\x1b[0m preserved`);
    }

    if (result.packageUpdated) {
      console.log(`\x1b[32m✔\x1b[0m Added \x1b[1m@jsonlink/vite-plugin\x1b[0m to devDependencies in package.json`);
    }

    console.log(`\n\x1b[32m\x1b[1m🎉 JSON Link Dev Dashboard is ready!\x1b[0m\n`);
    console.log(`Run your dev server:`);
    console.log(`  \x1b[36m${pm === 'npm' ? 'npm run dev' : `${pm} dev`}\x1b[0m\n`);
    console.log(`Open translation workspace:`);
    console.log(`  👉 \x1b[36mhttp://localhost:5173/__jsonlink\x1b[0m\n`);
    return;
  }

  // Mode 3: Neither project name nor Vite config in current dir -> Default starter in ./jsonlink-app
  const defaultDir = 'jsonlink-app';
  const targetDir = path.resolve(cwd, defaultDir);
  console.log(`\n\x1b[36m⚡ No Vite project detected in current directory.\x1b[0m`);
  console.log(`Scaffolding a new starter app in \x1b[1m./${defaultDir}\x1b[0m...\n`);

  const result = scaffoldStarterProject({ targetDir, projectName: defaultDir });
  if (!result.success) {
    console.error(`\x1b[31m✖ ${result.message}\x1b[0m\n`);
    process.exit(1);
  }

  console.log(`\x1b[32m✔\x1b[0m Project created successfully!`);
  console.log(`\n\x1b[1mNext steps:\x1b[0m`);
  console.log(`  cd \x1b[36m${defaultDir}\x1b[0m`);
  console.log(`  \x1b[36mnpm install\x1b[0m`);
  console.log(`  \x1b[36mnpm run dev\x1b[0m\n`);
}
