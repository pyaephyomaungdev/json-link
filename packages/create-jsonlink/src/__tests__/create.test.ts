import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scaffoldStarterProject } from '../scaffoldStarter';
import { initExistingProject } from '../initExisting';

describe('create-jsonlink', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-jsonlink-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('scaffolds a complete starter project', () => {
    const projectDir = path.join(tmpDir, 'test-app');
    const result = scaffoldStarterProject({ targetDir: projectDir, projectName: 'test-app' });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'vite.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'App.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'locales', 'en.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'locales', 'my.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'locales', 'i18n.ts'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'locales', 'translations.d.ts'))).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'));
    expect(pkg.name).toBe('test-app');
    expect(pkg.devDependencies['@jsonlink/vite-plugin']).toBe('^1.0.0');
  });

  it('initializes into an existing Vite project', () => {
    // Setup existing fake vite project
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'existing-app' }));
    fs.writeFileSync(path.join(tmpDir, 'vite.config.ts'), `import { defineConfig } from 'vite';\nexport default defineConfig({ plugins: [] });`);

    const result = initExistingProject(tmpDir);

    expect(result.success).toBe(true);
    expect(result.viteConfigFile).toBe('vite.config.ts');
    expect(result.localesCreated).toBe(true);

    const config = fs.readFileSync(path.join(tmpDir, 'vite.config.ts'), 'utf-8');
    expect(config).toContain("import { jsonLink } from '@jsonlink/vite-plugin';");
    expect(config).toContain('jsonLink()');

    const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8'));
    expect(pkg.devDependencies['@jsonlink/vite-plugin']).toBe('^1.0.0');
  });
});
