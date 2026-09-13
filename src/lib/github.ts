/**
 * GitHub Client & Locales Safety Guardrails
 * 100% Client-Side Direct Integration with GitHub REST API
 * Strictly enforces that ONLY localization files (.json, .arb, .yaml, .xml, .strings)
 * can ever be read, committed, or opened in a Pull Request.
 */

export interface GitHubRepoRef {
  owner: string;
  repo: string;
}

export interface GitHubBranch {
  name: string;
  commitSha: string;
  isDefault: boolean;
}

export interface GitHubLocalesFile {
  path: string;
  name: string;
  size: number;
  sha: string;
  extension: string;
  suggestedLanguage?: string;
}

export interface CreatePrOptions {
  token: string;
  owner: string;
  repo: string;
  baseBranch: string;
  newBranchName: string;
  prTitle: string;
  prBody: string;
  commitMessage: string;
  files: Array<{
    path: string;
    content: string;
  }>;
}

export interface DirectCommitOptions {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  commitMessage: string;
  files: Array<{
    path: string;
    content: string;
  }>;
}

export interface GitHubPrResult {
  success: boolean;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
  branchName?: string;
  error?: string;
}

export interface GitHubCommitResult {
  success: boolean;
  commitSha?: string;
  branch?: string;
  error?: string;
}

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Hardcoded deny-list of sensitive or project configuration files.
 * These files are NEVER allowed to be read or modified.
 */
const BLOCKED_FILENAMES = new Set([
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'jsconfig.json',
  'vite.config.ts',
  'vite.config.js',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'webpack.config.js',
  'tailwind.config.js',
  'tailwind.config.ts',
  'postcss.config.js',
  'components.json',
  'manifest.json',
  'index.html',
  'dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
]);

const BLOCKED_PATH_PATTERNS = [
  /^\.github\//i,
  /^\.git\//i,
  /^\.gitlab\//i,
  /^\.vscode\//i,
  /^\.idea\//i,
  /node_modules\//i,
  /\.env(\.|$)/i,
  /\.(pem|key|crt|cert|p12|pfx|gpg)$/i,
  /\.(ts|tsx|js|jsx|py|go|rs|rb|php|java|c|cpp|h|cs|swift|kt|dart)$/i,
  /\.(sh|bash|zsh|bat|cmd|ps1)$/i,
];

const ALLOWED_EXTENSIONS = new Set([
  '.json',
  '.arb',
  '.yaml',
  '.yml',
  '.xml',
  '.strings',
  '.xlsx',
  '.csv',
]);

const LOCALES_DIR_PATTERNS = [
  /locales\//i,
  /translations\//i,
  /i18n\//i,
  /l10n\//i,
  /values(-[a-zA-Z0-9_-]+)?\//i,
  /lang\//i,
  /\.lproj\//i,
];

/**
 * Unicode-safe base64 encoding (supports Myanmar, Japanese, emojis)
 */
export function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Unicode-safe base64 decoding (supports Myanmar, Japanese, emojis)
 */
export function base64ToUtf8(base64: string): string {
  const binary = atob(base64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Evaluates whether a repository file path is an allowed localization file.
 * Strictly blocks source code, dependencies, workflows, secrets, and config.
 */
export function isAllowedLocalesPath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') return false;

  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.includes('..')) return false;

  const parts = normalized.split('/');
  const fileName = parts[parts.length - 1].toLowerCase();

  // 1. Blocked filenames check
  if (BLOCKED_FILENAMES.has(fileName)) return false;
  if (fileName.startsWith('tsconfig.') || fileName.startsWith('.env')) return false;

  // 2. Blocked pattern checks
  for (const pattern of BLOCKED_PATH_PATTERNS) {
    if (pattern.test(normalized)) return false;
  }

  // 3. Extension check
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) return false;
  const ext = fileName.slice(dotIndex).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;

  // 4. Locales directory check
  const isInLocalesDir = LOCALES_DIR_PATTERNS.some(p => p.test(normalized));
  if (isInLocalesDir) return true;

  // Android strings.xml check
  if (fileName === 'strings.xml') return true;

  // Flutter arb file
  if (ext === '.arb') return true;

  // Language code filename check (e.g. en.json, my.json, zh-CN.yaml)
  const baseName = fileName.slice(0, dotIndex);
  if (/^[a-z]{2,3}([-_][a-zA-Z0-9]{2,4})?$/i.test(baseName)) {
    return true;
  }

  // Common translation filename prefix
  if (/^(translations|messages|strings|labels|common|app|intl)[-_.]/i.test(baseName)) {
    return true;
  }

  return false;
}

/**
 * Parses user input into owner and repo (e.g. "facebook/react" or "https://github.com/facebook/react")
 */
export function validateRepoString(repoStr: string): GitHubRepoRef | null {
  if (!repoStr || typeof repoStr !== 'string') return null;
  const cleaned = repoStr.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/^\/+|\/+$/g, '');
  const parts = cleaned.split('/');
  if (parts.length === 2 && parts[0].length > 0 && parts[1].length > 0) {
    return { owner: parts[0], repo: parts[1] };
  }
  return null;
}

/**
 * Helper to generate a default feature branch name for translations PR
 */
export function generateTranslationBranchName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `jsonlink/translations-${year}${month}${day}-${time}`;
}

/**
 * Helper to construct an informative and transparent Pull Request body
 */
export function buildDefaultPrBody(options: {
  languages: string[];
  itemsCount: number;
  targetFolder?: string;
  targetFormat?: string;
  files?: Array<{ path: string }>;
}): string {
  const fileLines = options.files && options.files.length > 0
    ? options.files.map(f => `- \`${f.path}\``).join('\n')
    : options.languages.map(l => `- \`${(options.targetFolder || 'locales/').replace(/\/+$/, '')}/${l}.json\``).join('\n');

  const formatLabels: Record<string, string> = {
    'json-nested': 'Nested JSON',
    'json-flat': 'Flat JSON',
    'arb': 'Flutter ARB',
    'yaml': 'YAML',
    'xml': 'Android XML',
    'strings': 'iOS Strings',
  };
  const formatLabel = options.targetFormat ? (formatLabels[options.targetFormat] || options.targetFormat) : 'JSON';

  return [
    `### 🌐 Localization Updates`,
    ``,
    `This Pull Request synchronizes translations edited in **[JSON Link](https://json-link.pages.dev)**.`,
    ``,
    `#### 📊 Summary of Changes`,
    `- **Languages Updated**: ${options.languages.map(l => `\`${l}\``).join(', ')}`,
    `- **Total Translation Keys**: ${options.itemsCount} keys`,
    options.targetFolder ? `- **Target Directory**: \`${options.targetFolder}\`` : null,
    `- **File Format**: ${formatLabel}`,
    `- **Modified Localization Files**:`,
    fileLines,
    `- **Timestamp**: ${new Date().toUTCString()}`,
    ``,
    `#### 🛡️ Security & Integrity Guarantee`,
    `- Verified by **Locales-Only Safety Guard** (strictly restricted to authorized i18n translation files; source code, configs, dependencies, and workflows are permanently blocked).`,
    `- 100% Client-Side export generated directly in browser memory without intermediate servers.`,
    ``,
    `---`,
    `> 🚀 *Co-worked & Powered by [JSON Link](https://json-link.pages.dev) — The local-first developer & translator spreadsheet workspace.*`,
  ]
    .filter(line => line !== null)
    .join('\n');
}

/**
 * Guess language code from file path (e.g. "locales/my.json" -> "my", "values-my/strings.xml" -> "my")
 */
export function guessLanguageCodeFromPath(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/');
  const fileName = parts[parts.length - 1];
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? fileName.slice(0, dotIndex) : fileName;

  // iOS en.lproj/Localizable.strings -> en
  for (const part of parts) {
    const lprojMatch = part.match(/^([a-z]{2,3}(?:[-_][a-zA-Z0-9]{2,4})?)\.lproj$/i);
    if (lprojMatch) {
      return lprojMatch[1].toLowerCase().replace('_', '-');
    }
  }

  // Flutter arb: app_en.arb -> en, intl_en.arb -> en, messages_en.arb -> en
  const arbMatch = baseName.match(/^(?:app|intl|messages|strings)_([a-z]{2,3}(?:[-_][a-zA-Z0-9]{2,4})?)$/i);
  if (arbMatch) {
    return arbMatch[1].toLowerCase().replace('_', '-');
  }

  // Check if filename itself is a language code (e.g. "en.json", "my.json", "zh_CN.json")
  if (/^[a-z]{2,3}([-_][a-zA-Z0-9]{2,4})?$/i.test(baseName)) {
    return baseName.toLowerCase().replace('_', '-');
  }

  // Android values-my/strings.xml -> my
  for (const part of parts) {
    const androidMatch = part.match(/^values-([a-z]{2,3}([-_][a-zA-Z0-9]{2,4})?)$/i);
    if (androidMatch) {
      return androidMatch[1].toLowerCase().replace('_', '-');
    }
  }

  return 'en';
}

/**
 * Creates standard GitHub API request headers
 */
function getHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `Bearer ${token.trim()}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/**
 * Fetches repository details and default branch
 */
export async function fetchRepositoryInfo(
  token: string,
  owner: string,
  repo: string
): Promise<{ defaultBranch: string; isPrivate: boolean; description: string }> {
  const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
    headers: getHeaders(token),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid GitHub Personal Access Token.');
    if (res.status === 404) throw new Error(`Repository "${owner}/${repo}" not found or token lacks access.`);
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `GitHub error: HTTP ${res.status}`);
  }

  const data = await res.json();
  return {
    defaultBranch: data.default_branch || 'main',
    isPrivate: Boolean(data.private),
    description: data.description || '',
  };
}

/**
 * Lists branches of the repository
 */
export async function fetchRepositoryBranches(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubBranch[]> {
  const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/branches?per_page=50`, {
    headers: getHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to fetch branches: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.map((b: any) => ({
    name: b.name,
    commitSha: b.commit?.sha || '',
    isDefault: false,
  }));
}

/**
 * Discovers all valid localization files in the repository.
 * Non-locales files are strictly filtered out and never returned.
 */
export async function discoverLocalesFiles(
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<GitHubLocalesFile[]> {
  const res = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    {
      headers: getHeaders(token),
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to read repository tree: HTTP ${res.status}`);
  }

  const data = await res.json();
  const tree = Array.isArray(data.tree) ? data.tree : [];

  const localesFiles: GitHubLocalesFile[] = [];

  for (const item of tree) {
    if (item.type !== 'blob') continue;
    const path: string = item.path;

    // Strict Security Guardrail: ONLY allow legitimate localization files
    if (isAllowedLocalesPath(path)) {
      const parts = path.split('/');
      const name = parts[parts.length - 1];
      const dotIndex = name.lastIndexOf('.');
      const extension = dotIndex !== -1 ? name.slice(dotIndex).toLowerCase() : '';

      localesFiles.push({
        path,
        name,
        size: item.size || 0,
        sha: item.sha,
        extension,
        suggestedLanguage: guessLanguageCodeFromPath(path),
      });
    }
  }

  return localesFiles.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Fetches and decodes the UTF-8 content of a specific locales file from GitHub.
 * Throws security error if the file path is not an allowed locales file.
 */
export async function fetchLocalesFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<string> {
  // Strict Safety Guardrail
  if (!isAllowedLocalesPath(path)) {
    throw new Error(`Security Policy: Access to "${path}" is blocked. Only localization files may be loaded.`);
  }

  const res = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`,
    {
      headers: getHeaders(token),
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to fetch file content: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.encoding === 'base64' && typeof data.content === 'string') {
    return base64ToUtf8(data.content);
  }

  throw new Error(`Unsupported content encoding: ${data.encoding || 'none'}`);
}

/**
 * Creates a new branch with updated locales files and opens a GitHub Pull Request.
 * Every file in the commit is verified against `isAllowedLocalesPath`.
 */
export async function createPullRequestWithLocales(
  options: CreatePrOptions
): Promise<GitHubPrResult> {
  const {
    token,
    owner,
    repo,
    baseBranch,
    newBranchName,
    prTitle,
    prBody,
    commitMessage,
    files,
  } = options;

  if (files.length === 0) {
    return { success: false, error: 'No translation files provided for Pull Request.' };
  }

  // 1. Strict Security Guardrail: Reject if ANY file fails the locales safety check
  for (const f of files) {
    if (!isAllowedLocalesPath(f.path)) {
      throw new Error(
        `Security Policy: File "${f.path}" is blocked. Pull Requests can only modify localization files.`
      );
    }
  }

  try {
    const headers = getHeaders(token);

    // 2. Get latest commit SHA of baseBranch
    const refRes = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(baseBranch)}`,
      { headers }
    );
    if (!refRes.ok) {
      const err = await refRes.json().catch(() => ({}));
      throw new Error(err.message || `Could not find branch "${baseBranch}"`);
    }
    const refData = await refRes.json();
    const baseCommitSha = refData.object.sha;

    // 3. Create the new branch
    const branchRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${newBranchName}`,
        sha: baseCommitSha,
      }),
    });

    if (!branchRes.ok) {
      const err = await branchRes.json().catch(() => ({}));
      throw new Error(err.message || `Failed to create branch "${newBranchName}"`);
    }

    // 4. Create Git Blobs for each locales file
    const treeEntries = [];
    for (const f of files) {
      const blobRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: utf8ToBase64(f.content),
          encoding: 'base64',
        }),
      });

      if (!blobRes.ok) {
        const err = await blobRes.json().catch(() => ({}));
        throw new Error(err.message || `Failed to upload blob for "${f.path}"`);
      }
      const blobData = await blobRes.json();
      treeEntries.push({
        path: f.path.replace(/^\/+/, ''),
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      });
    }

    // 5. Create new Git Tree based on parent commit tree
    const treeRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseCommitSha,
        tree: treeEntries,
      }),
    });
    if (!treeRes.ok) {
      const err = await treeRes.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create git tree');
    }
    const treeData = await treeRes.json();

    // 6. Create Git Commit
    const commitRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: treeData.sha,
        parents: [baseCommitSha],
      }),
    });
    if (!commitRes.ok) {
      const err = await commitRes.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create git commit');
    }
    const commitData = await commitRes.json();

    // 7. Update new branch ref to the new commit
    const updateRefRes = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(newBranchName)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: commitData.sha,
        }),
      }
    );
    if (!updateRefRes.ok) {
      const err = await updateRefRes.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update branch pointer');
    }

    // 8. Open the Pull Request
    const prRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: prTitle,
        head: newBranchName,
        base: baseBranch,
        body: prBody,
      }),
    });

    if (!prRes.ok) {
      const err = await prRes.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create Pull Request');
    }

    const prData = await prRes.json();
    return {
      success: true,
      pullRequestUrl: prData.html_url,
      pullRequestNumber: prData.number,
      branchName: newBranchName,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unknown error occurred while creating Pull Request.',
    };
  }
}

/**
 * Commits updated locales files directly to the specified branch.
 * Guarded with `isAllowedLocalesPath`.
 */
export async function commitLocalesDirectly(
  options: DirectCommitOptions
): Promise<GitHubCommitResult> {
  const { token, owner, repo, branch, commitMessage, files } = options;

  if (files.length === 0) {
    return { success: false, error: 'No translation files provided to commit.' };
  }

  for (const f of files) {
    if (!isAllowedLocalesPath(f.path)) {
      throw new Error(
        `Security Policy: File "${f.path}" is blocked. Commits can only modify localization files.`
      );
    }
  }

  try {
    const headers = getHeaders(token);

    // 1. Get branch commit
    const refRes = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
      { headers }
    );
    if (!refRes.ok) {
      const err = await refRes.json().catch(() => ({}));
      throw new Error(err.message || `Branch "${branch}" not found.`);
    }
    const refData = await refRes.json();
    const parentSha = refData.object.sha;

    // 2. Create blobs
    const treeEntries = [];
    for (const f of files) {
      const blobRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: utf8ToBase64(f.content),
          encoding: 'base64',
        }),
      });

      if (!blobRes.ok) {
        const err = await blobRes.json().catch(() => ({}));
        throw new Error(err.message || `Failed to create blob for "${f.path}"`);
      }
      const blobData = await blobRes.json();
      treeEntries.push({
        path: f.path.replace(/^\/+/, ''),
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      });
    }

    // 3. Create tree
    const treeRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: parentSha,
        tree: treeEntries,
      }),
    });
    if (!treeRes.ok) {
      const err = await treeRes.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create git tree');
    }
    const treeData = await treeRes.json();

    // 4. Create commit
    const commitRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: treeData.sha,
        parents: [parentSha],
      }),
    });
    if (!commitRes.ok) {
      const err = await commitRes.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create commit');
    }
    const commitData = await commitRes.json();

    // 5. Update branch ref
    const updateRefRes = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: commitData.sha,
        }),
      }
    );
    if (!updateRefRes.ok) {
      const err = await updateRefRes.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update branch ref');
    }

    return {
      success: true,
      commitSha: commitData.sha,
      branch,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unknown error occurred while committing to branch.',
    };
  }
}
