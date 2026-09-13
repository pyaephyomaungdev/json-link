import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isAllowedLocalesPath,
  validateRepoString,
  guessLanguageCodeFromPath,
  utf8ToBase64,
  base64ToUtf8,
  fetchRepositoryInfo,
  fetchRepositoryBranches,
  discoverLocalesFiles,
  fetchLocalesFileContent,
  createPullRequestWithLocales,
  commitLocalesDirectly,
  buildDefaultPrBody,
} from '../github';

describe('GitHub Locales Security Guardrails', () => {
  describe('isAllowedLocalesPath', () => {
    it('allows standard translation files in locales/ directories', () => {
      expect(isAllowedLocalesPath('locales/en.json')).toBe(true);
      expect(isAllowedLocalesPath('locales/my.json')).toBe(true);
      expect(isAllowedLocalesPath('src/locales/zh-CN.json')).toBe(true);
      expect(isAllowedLocalesPath('public/locales/de.yaml')).toBe(true);
      expect(isAllowedLocalesPath('assets/i18n/fr.json')).toBe(true);
      expect(isAllowedLocalesPath('lib/l10n/app_en.arb')).toBe(true);
      expect(isAllowedLocalesPath('android/app/src/main/res/values-my/strings.xml')).toBe(true);
      expect(isAllowedLocalesPath('ios/Runner/en.lproj/Localizable.strings')).toBe(true);
    });

    it('allows root-level language code files', () => {
      expect(isAllowedLocalesPath('en.json')).toBe(true);
      expect(isAllowedLocalesPath('my.json')).toBe(true);
      expect(isAllowedLocalesPath('ja.yaml')).toBe(true);
      expect(isAllowedLocalesPath('strings.xml')).toBe(true);
      expect(isAllowedLocalesPath('app_en.arb')).toBe(true);
    });

    it('STRICTLY BLOCKS package.json, configs, and lockfiles', () => {
      expect(isAllowedLocalesPath('package.json')).toBe(false);
      expect(isAllowedLocalesPath('package-lock.json')).toBe(false);
      expect(isAllowedLocalesPath('pnpm-lock.yaml')).toBe(false);
      expect(isAllowedLocalesPath('yarn.lock')).toBe(false);
      expect(isAllowedLocalesPath('tsconfig.json')).toBe(false);
      expect(isAllowedLocalesPath('tsconfig.app.json')).toBe(false);
      expect(isAllowedLocalesPath('components.json')).toBe(false);
      expect(isAllowedLocalesPath('manifest.json')).toBe(false);
      expect(isAllowedLocalesPath('vite.config.ts')).toBe(false);
      expect(isAllowedLocalesPath('next.config.js')).toBe(false);
      expect(isAllowedLocalesPath('tailwind.config.js')).toBe(false);
    });

    it('STRICTLY BLOCKS all source code files', () => {
      expect(isAllowedLocalesPath('src/App.tsx')).toBe(false);
      expect(isAllowedLocalesPath('src/index.ts')).toBe(false);
      expect(isAllowedLocalesPath('main.py')).toBe(false);
      expect(isAllowedLocalesPath('server.go')).toBe(false);
      expect(isAllowedLocalesPath('lib/main.dart')).toBe(false);
      expect(isAllowedLocalesPath('utils.js')).toBe(false);
      expect(isAllowedLocalesPath('script.sh')).toBe(false);
    });

    it('STRICTLY BLOCKS CI/CD workflows, dotfiles, and secrets', () => {
      expect(isAllowedLocalesPath('.github/workflows/deploy.yml')).toBe(false);
      expect(isAllowedLocalesPath('.github/workflows/ci.json')).toBe(false);
      expect(isAllowedLocalesPath('.env')).toBe(false);
      expect(isAllowedLocalesPath('.env.production')).toBe(false);
      expect(isAllowedLocalesPath('secret.key')).toBe(false);
      expect(isAllowedLocalesPath('cert.pem')).toBe(false);
      expect(isAllowedLocalesPath('.git/config')).toBe(false);
      expect(isAllowedLocalesPath('.vscode/settings.json')).toBe(false);
    });

    it('STRICTLY BLOCKS directory traversal attempts', () => {
      expect(isAllowedLocalesPath('../package.json')).toBe(false);
      expect(isAllowedLocalesPath('locales/../../package.json')).toBe(false);
      expect(isAllowedLocalesPath('locales/../../../etc/passwd')).toBe(false);
    });
  });

  describe('validateRepoString', () => {
    it('parses valid owner/repo strings', () => {
      expect(validateRepoString('facebook/react')).toEqual({ owner: 'facebook', repo: 'react' });
      expect(validateRepoString('pyaephyomaungdev/json-link')).toEqual({
        owner: 'pyaephyomaungdev',
        repo: 'json-link',
      });
    });

    it('parses full GitHub URLs', () => {
      expect(validateRepoString('https://github.com/facebook/react')).toEqual({
        owner: 'facebook',
        repo: 'react',
      });
      expect(validateRepoString('http://github.com/user/app.git')).toEqual({
        owner: 'user',
        repo: 'app',
      });
    });

    it('returns null for invalid inputs', () => {
      expect(validateRepoString('')).toBeNull();
      expect(validateRepoString('invalid')).toBeNull();
      expect(validateRepoString('too/many/parts/here')).toBeNull();
    });
  });

  describe('guessLanguageCodeFromPath', () => {
    it('correctly extracts language codes from paths', () => {
      expect(guessLanguageCodeFromPath('locales/en.json')).toBe('en');
      expect(guessLanguageCodeFromPath('locales/my.json')).toBe('my');
      expect(guessLanguageCodeFromPath('translations/zh_CN.json')).toBe('zh-cn');
      expect(guessLanguageCodeFromPath('lib/l10n/app_en.arb')).toBe('en');
      expect(guessLanguageCodeFromPath('res/values-my/strings.xml')).toBe('my');
    });
  });

  describe('Unicode Base64 conversions', () => {
    it('preserves Myanmar characters and emojis without corruption', () => {
      const myanmarText = 'မင်္ဂလာပါ ကမ္ဘာလောက! 🚀 ပြန်လည်ကြိုဆိုပါသည်';
      const encoded = utf8ToBase64(myanmarText);
      const decoded = base64ToUtf8(encoded);
      expect(decoded).toBe(myanmarText);
    });
  });

  describe('API Methods Mocking', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('fetchRepositoryInfo retrieves repo metadata', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ default_branch: 'main', private: false, description: 'Test repo' }),
      });

      const info = await fetchRepositoryInfo('ghp_test', 'owner', 'repo');
      expect(info.defaultBranch).toBe('main');
      expect(info.isPrivate).toBe(false);
    });

    it('fetchRepositoryBranches lists branches', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { name: 'main', commit: { sha: 'sha1' } },
          { name: 'dev', commit: { sha: 'sha2' } },
        ],
      });

      const branches = await fetchRepositoryBranches('ghp_test', 'owner', 'repo');
      expect(branches).toHaveLength(2);
      expect(branches[0].name).toBe('main');
    });

    it('discoverLocalesFiles filters out blocked files from tree', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tree: [
            { type: 'blob', path: 'package.json', size: 100, sha: 'sha_pkg' },
            { type: 'blob', path: 'src/App.tsx', size: 200, sha: 'sha_app' },
            { type: 'blob', path: '.github/workflows/ci.yml', size: 300, sha: 'sha_ci' },
            { type: 'blob', path: 'locales/en.json', size: 400, sha: 'sha_en' },
            { type: 'blob', path: 'locales/my.json', size: 500, sha: 'sha_my' },
          ],
        }),
      });

      const locales = await discoverLocalesFiles('ghp_test', 'owner', 'repo', 'main');
      expect(locales).toHaveLength(2);
      expect(locales.map(l => l.path)).toEqual(['locales/en.json', 'locales/my.json']);
    });

    it('fetchLocalesFileContent throws if non-locales path is requested', async () => {
      await expect(
        fetchLocalesFileContent('ghp_test', 'owner', 'repo', 'package.json', 'main')
      ).rejects.toThrow(/Security Policy/);
    });

    it('createPullRequestWithLocales rejects non-locales files', async () => {
      const res = await createPullRequestWithLocales({
        token: 'ghp_test',
        owner: 'owner',
        repo: 'repo',
        baseBranch: 'main',
        newBranchName: 'translations',
        prTitle: 'Translations',
        prBody: 'Desc',
        commitMessage: 'Commit',
        files: [{ path: 'package.json', content: '{}' }],
      }).catch(e => ({ success: false, error: e.message }));

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Security Policy/);
    });

    it('commitLocalesDirectly rejects non-locales files', async () => {
      const res = await commitLocalesDirectly({
        token: 'ghp_test',
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        commitMessage: 'Commit',
        files: [{ path: 'src/App.tsx', content: 'console.log()' }],
      }).catch(e => ({ success: false, error: e.message }));

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Security Policy/);
    });
  });

  describe('buildDefaultPrBody', () => {
    it('generates rich PR description with changes, security note, and JSON Link branding', () => {
      const body = buildDefaultPrBody({
        languages: ['en', 'my'],
        itemsCount: 35,
        targetFolder: 'locales/',
        targetFormat: 'json-nested',
        files: [{ path: 'locales/en.json' }, { path: 'locales/my.json' }],
      });

      expect(body).toContain('Localization Updates');
      expect(body).toContain('`en`, `my`');
      expect(body).toContain('35 keys');
      expect(body).toContain('Nested JSON');
      expect(body).toContain('- `locales/en.json`');
      expect(body).toContain('- `locales/my.json`');
      expect(body).toContain('Locales-Only Safety Guard');
      expect(body).toContain('Co-worked & Powered by [JSON Link]');
      expect(body).toContain('https://json-link.pages.dev');
    });
  });
});
