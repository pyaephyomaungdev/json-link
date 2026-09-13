import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  injectVitePlugin,
  findViteConfig,
  detectPackageManager,
  scaffoldLocales,
  runInit,
} from '../init.js';

describe('Vite Plugin Init & CLI', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonlink-init-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('detectPackageManager', () => {
    it('detects pnpm when pnpm-lock.yaml is present', () => {
      fs.writeFileSync(path.join(tempDir, 'pnpm-lock.yaml'), '');
      expect(detectPackageManager(tempDir)).toBe('pnpm');
    });

    it('detects bun when bun.lockb is present', () => {
      fs.writeFileSync(path.join(tempDir, 'bun.lockb'), '');
      expect(detectPackageManager(tempDir)).toBe('bun');
    });

    it('detects yarn when yarn.lock is present', () => {
      fs.writeFileSync(path.join(tempDir, 'yarn.lock'), '');
      expect(detectPackageManager(tempDir)).toBe('yarn');
    });

    it('defaults to npm when no lockfile is present', () => {
      expect(detectPackageManager(tempDir)).toBe('npm');
    });
  });

  describe('findViteConfig', () => {
    it('finds vite.config.ts if present', () => {
      const configPath = path.join(tempDir, 'vite.config.ts');
      fs.writeFileSync(configPath, 'export default {}');
      expect(findViteConfig(tempDir)).toBe(configPath);
    });

    it('returns null if no vite config is present', () => {
      expect(findViteConfig(tempDir)).toBeNull();
    });
  });

  describe('injectVitePlugin', () => {
    it('injects import and jsonLink() into existing plugins array', () => {
      const original = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`;

      const result = injectVitePlugin(original);
      expect(result.changed).toBe(true);
      expect(result.content).toContain("import { jsonLink } from '@jsonlink/vite-plugin';");
      expect(result.content).toContain('plugins: [\n    jsonLink(),');
      expect(result.content).toContain('react()');
    });

    it('does not re-inject if already present', () => {
      const alreadyInjected = `import { jsonLink } from '@jsonlink/vite-plugin';
export default defineConfig({
  plugins: [jsonLink(), react()],
});`;

      const result = injectVitePlugin(alreadyInjected);
      expect(result.changed).toBe(false);
      expect(result.content).toBe(alreadyInjected);
    });
  });

  describe('scaffoldLocales', () => {
    it('creates src/locales with en.json, my.json, translations.d.ts, and i18n.ts', () => {
      const created = scaffoldLocales(tempDir);
      expect(created).toBe(true);

      const localesDir = path.join(tempDir, 'src', 'locales');
      expect(fs.existsSync(path.join(localesDir, 'en.json'))).toBe(true);
      expect(fs.existsSync(path.join(localesDir, 'my.json'))).toBe(true);
      expect(fs.existsSync(path.join(localesDir, 'translations.d.ts'))).toBe(true);
      expect(fs.existsSync(path.join(localesDir, 'i18n.ts'))).toBe(true);

      const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf-8'));
      expect(en['app.title']).toBeDefined();

      const my = JSON.parse(fs.readFileSync(path.join(localesDir, 'my.json'), 'utf-8'));
      expect(my['app.title']).toBe('ကျွန်ုပ်၏အက်ပ်');
    });

    it('does not overwrite existing src/locales', () => {
      const localesDir = path.join(tempDir, 'src', 'locales');
      fs.mkdirSync(localesDir, { recursive: true });
      fs.writeFileSync(path.join(localesDir, 'custom.json'), '{"hello": "world"}');

      const created = scaffoldLocales(tempDir);
      expect(created).toBe(false);
      expect(fs.existsSync(path.join(localesDir, 'custom.json'))).toBe(true);
      expect(fs.existsSync(path.join(localesDir, 'en.json'))).toBe(false);
    });
  });

  describe('runInit end-to-end', () => {
    it('initializes a Vite project completely', () => {
      const configPath = path.join(tempDir, 'vite.config.ts');
      fs.writeFileSync(configPath, `import { defineConfig } from 'vite';
export default defineConfig({
  plugins: [],
});`);

      const result = runInit(tempDir);
      expect(result.success).toBe(true);
      expect(result.viteConfigFile).toBe('vite.config.ts');
      expect(result.localesCreated).toBe(true);

      const updatedConfig = fs.readFileSync(configPath, 'utf-8');
      expect(updatedConfig).toContain('@jsonlink/vite-plugin');
    });

    it('fails gracefully when no vite config is found', () => {
      const result = runInit(tempDir);
      expect(result.success).toBe(false);
      expect(result.message).toContain('No Vite configuration found');
    });
  });
});
