import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  GitPullRequest,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  Check,
  FileCode2,
  Download,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';
import { TranslationItem } from '@/types';
import {
  validateRepoString,
  fetchRepositoryInfo,
  fetchRepositoryBranches,
  discoverLocalesFiles,
  fetchLocalesFileContent,
  createPullRequestWithLocales,
  commitLocalesDirectly,
  generateTranslationBranchName,
  buildDefaultPrBody,
  isAllowedLocalesPath,
  GitHubLocalesFile,
  GitHubBranch,
  GitHubPrResult,
} from '@/lib/github';
import {
  parseJsonFile,
  parseAndroidXml,
  parseIosStrings,
  parseYamlFile,
  parseArbFile,
  mergeTranslations,
} from '@/lib/parser';
import {
  generateLanguageJsonData,
  generateAndroidXml,
  generateIosStrings,
  generateArbData,
  objectToYaml,
} from '@/lib/exporter';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TranslationItem[];
  languages: string[];
  onImportTranslations: (items: TranslationItem[], languages: string[]) => void;
}

export function GitHubSyncModal({
  isOpen,
  onClose,
  items,
  languages,
  onImportTranslations,
}: GitHubSyncModalProps) {
  const [activeTab, setActiveTab] = useState<'connect' | 'pull' | 'pr'>('connect');

  // Authentication & Repo state (persisted locally)
  const [token, setToken] = useState<string>(() => localStorage.getItem('jsonlink_github_token') || '');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [repoInput, setRepoInput] = useState<string>(() => localStorage.getItem('jsonlink_github_repo') || '');
  const [repoDetails, setRepoDetails] = useState<{ defaultBranch: string; isPrivate: boolean } | null>(null);

  // Branches & selected branch
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // Pull / Import state
  const [discoveredFiles, setDiscoveredFiles] = useState<GitHubLocalesFile[]>([]);
  const [selectedFilePaths, setSelectedFilePaths] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);

  // Push / PR state
  const [targetFolder, setTargetFolder] = useState<string>('locales/');
  const [targetFormat, setTargetFormat] = useState<'json-nested' | 'json-flat' | 'arb' | 'yaml' | 'xml' | 'strings'>('json-nested');
  const [newBranchName, setNewBranchName] = useState<string>('');
  const [prTitle, setPrTitle] = useState<string>('i18n: update translations via JSON Link');
  const [prBody, setPrBody] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState<string>('i18n: sync translation updates');
  const [commitMode, setCommitMode] = useState<'pr' | 'direct'>('pr');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [prResult, setPrResult] = useState<GitHubPrResult | null>(null);
  const [copiedPrUrl, setCopiedPrUrl] = useState<boolean>(false);

  // Status & error messages
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial branch generation and informative PR body
  useEffect(() => {
    if (isOpen) {
      setNewBranchName(prev => prev || generateTranslationBranchName());
      setPrBody(
        buildDefaultPrBody({
          languages,
          itemsCount: items.length,
          targetFolder,
          targetFormat,
        })
      );
    }
  }, [isOpen, languages, items.length, targetFolder, targetFormat]);

  const handleSaveCredentials = (newToken: string, newRepo: string) => {
    if (newToken) localStorage.setItem('jsonlink_github_token', newToken);
    if (newRepo) localStorage.setItem('jsonlink_github_repo', newRepo);
  };

  const handleClearCredentials = () => {
    localStorage.removeItem('jsonlink_github_token');
    localStorage.removeItem('jsonlink_github_repo');
    setToken('');
    setRepoInput('');
    setRepoDetails(null);
    setBranches([]);
    setDiscoveredFiles([]);
    setSelectedFilePaths(new Set());
    setPrResult(null);
    setStatusMessage('Disconnected GitHub credentials.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Connect & Verify Repository
  const handleConnectRepo = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    const repoRef = validateRepoString(repoInput);
    if (!repoRef) {
      setErrorMessage('Please enter a valid repository format like "owner/repo" or GitHub URL.');
      return;
    }

    if (!token.trim()) {
      setErrorMessage('Please enter a GitHub Personal Access Token (PAT).');
      return;
    }

    setIsScanning(true);
    try {
      handleSaveCredentials(token, repoInput);
      const info = await fetchRepositoryInfo(token, repoRef.owner, repoRef.repo);
      setRepoDetails(info);

      const branchList = await fetchRepositoryBranches(token, repoRef.owner, repoRef.repo);
      setBranches(branchList);
      const activeBranch = selectedBranch || info.defaultBranch;
      setSelectedBranch(activeBranch);

      // Auto-scan locales files in default branch
      const files = await discoverLocalesFiles(token, repoRef.owner, repoRef.repo, activeBranch);
      setDiscoveredFiles(files);
      setSelectedFilePaths(new Set(files.map(f => f.path)));

      // Auto-detect target folder if files found
      if (files.length > 0) {
        const firstPath = files[0].path;
        const lastSlash = firstPath.lastIndexOf('/');
        if (lastSlash !== -1) {
          setTargetFolder(firstPath.slice(0, lastSlash + 1));
        }
      }

      setStatusMessage(`Connected to ${repoRef.owner}/${repoRef.repo}! Found ${files.length} localization files.`);
      setActiveTab('pull');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect to GitHub.');
    } finally {
      setIsScanning(false);
    }
  };

  // Switch Branch & Rescan
  const handleBranchChange = async (newBranch: string) => {
    setSelectedBranch(newBranch);
    const repoRef = validateRepoString(repoInput);
    if (!repoRef || !token) return;

    setIsScanning(true);
    setErrorMessage(null);
    try {
      const files = await discoverLocalesFiles(token, repoRef.owner, repoRef.repo, newBranch);
      setDiscoveredFiles(files);
      setSelectedFilePaths(new Set(files.map(f => f.path)));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to scan branch.');
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle file selection
  const handleToggleFile = (path: string) => {
    setSelectedFilePaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelectAllFiles = () => {
    setSelectedFilePaths(new Set(discoveredFiles.map(f => f.path)));
  };

  const handleDeselectAllFiles = () => {
    setSelectedFilePaths(new Set());
  };

  // Pull & Load into Spreadsheet
  const handlePullSelectedFiles = async () => {
    const repoRef = validateRepoString(repoInput);
    if (!repoRef || !token || !selectedBranch) {
      setErrorMessage('Missing repository or branch connection.');
      return;
    }

    const filesToFetch = discoveredFiles.filter(f => selectedFilePaths.has(f.path));
    if (filesToFetch.length === 0) {
      setErrorMessage('Please select at least one localization file to load.');
      return;
    }

    setIsPulling(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      let accumulatedItems: TranslationItem[] = [];
      let accumulatedLanguages: string[] = [];

      for (const file of filesToFetch) {
        // Enforce strict security policy check
        if (!isAllowedLocalesPath(file.path)) {
          throw new Error(`Security Exception: "${file.path}" violates locales safety policy.`);
        }

        const rawContent = await fetchLocalesFileContent(
          token,
          repoRef.owner,
          repoRef.repo,
          file.path,
          selectedBranch
        );

        let langData: { [langCode: string]: Record<string, string> } = {};
        const ext = file.extension.toLowerCase();

        if (ext === '.json') {
          langData = parseJsonFile(rawContent, file.name);
        } else if (ext === '.arb') {
          const arb = parseArbFile(rawContent, file.name);
          for (const l of arb.languages) {
            langData[l] = {};
            for (const item of arb.items) {
              langData[l][item.key] = item[l] || '';
            }
          }
        } else if (ext === '.yaml' || ext === '.yml') {
          langData = parseYamlFile(rawContent, file.name);
        } else if (ext === '.xml') {
          langData = parseAndroidXml(rawContent, file.name);
        } else if (ext === '.strings') {
          langData = parseIosStrings(rawContent, file.name);
        } else {
          langData = parseJsonFile(rawContent, file.name);
        }

        if (Object.keys(langData).length > 0) {
          const merged = mergeTranslations(accumulatedItems, accumulatedLanguages, langData);
          accumulatedItems = merged.items;
          accumulatedLanguages = merged.languages;
        }
      }

      if (accumulatedItems.length === 0) {
        throw new Error('No valid translation keys found in the selected files.');
      }

      onImportTranslations(accumulatedItems, accumulatedLanguages);
      setStatusMessage(`Successfully pulled ${filesToFetch.length} files (${accumulatedItems.length} keys) into workspace!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to pull localization files.');
    } finally {
      setIsPulling(false);
    }
  };

  // Generate serialized file payloads for Push / PR
  const prepareFilesForCommit = (): Array<{ path: string; content: string }> => {
    const folder = targetFolder.trim().replace(/^\/+/, '');
    const cleanFolder = folder.endsWith('/') ? folder : `${folder}/`;
    const files: Array<{ path: string; content: string }> = [];

    for (const lang of languages) {
      let fileName = `${lang}.json`;
      let content = '';

      if (targetFormat === 'json-nested') {
        fileName = `${lang}.json`;
        const data = generateLanguageJsonData(items, lang, true);
        content = JSON.stringify(data, null, 2);
      } else if (targetFormat === 'json-flat') {
        fileName = `${lang}.json`;
        const data = generateLanguageJsonData(items, lang, false);
        content = JSON.stringify(data, null, 2);
      } else if (targetFormat === 'arb') {
        fileName = `app_${lang}.arb`;
        const data = generateArbData(items, lang);
        content = JSON.stringify(data, null, 2);
      } else if (targetFormat === 'yaml') {
        fileName = `${lang}.yaml`;
        const data = generateLanguageJsonData(items, lang, true);
        content = objectToYaml(data);
      } else if (targetFormat === 'xml') {
        fileName = `strings_${lang}.xml`;
        content = generateAndroidXml(items, lang);
      } else if (targetFormat === 'strings') {
        fileName = `${lang}.strings`;
        content = generateIosStrings(items, lang);
      }

      const filePath = `${cleanFolder}${fileName}`;

      // Strict Security Verification
      if (!isAllowedLocalesPath(filePath)) {
        throw new Error(`Security Policy Violation: Target path "${filePath}" is not an authorized localization file.`);
      }

      files.push({ path: filePath, content });
    }

    return files;
  };

  // Create Pull Request or Direct Commit
  const handleSubmitPush = async () => {
    const repoRef = validateRepoString(repoInput);
    if (!repoRef || !token || !selectedBranch) {
      setErrorMessage('Please connect to a repository and select a branch first.');
      return;
    }

    if (items.length === 0 || languages.length === 0) {
      setErrorMessage('Spreadsheet is empty. Nothing to commit.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);
    setPrResult(null);

    try {
      const filesToCommit = prepareFilesForCommit();

      if (commitMode === 'pr') {
        const result = await createPullRequestWithLocales({
          token,
          owner: repoRef.owner,
          repo: repoRef.repo,
          baseBranch: selectedBranch,
          newBranchName: newBranchName.trim(),
          prTitle: prTitle.trim(),
          prBody: prBody.trim(),
          commitMessage: commitMessage.trim(),
          files: filesToCommit,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to open Pull Request.');
        }

        setPrResult(result);
        setStatusMessage(`Pull Request #${result.pullRequestNumber} opened successfully!`);
      } else {
        const result = await commitLocalesDirectly({
          token,
          owner: repoRef.owner,
          repo: repoRef.repo,
          branch: selectedBranch,
          commitMessage: commitMessage.trim(),
          files: filesToCommit,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to commit directly.');
        }

        setStatusMessage(`Committed ${filesToCommit.length} localization files directly to "${selectedBranch}"!`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPrUrl = () => {
    if (prResult?.pullRequestUrl) {
      navigator.clipboard.writeText(prResult.pullRequestUrl);
      setCopiedPrUrl(true);
      setTimeout(() => setCopiedPrUrl(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <span>GitHub Localization Sync &amp; PR</span>
            <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 py-0 h-4.5">
              <ShieldCheck className="size-3" />
              Locales-Only Lock
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Pull existing translation files from GitHub, edit in spreadsheet, and open Pull Requests directly from your browser.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 text-xs overflow-x-hidden">
          {/* Locales-Only Security Shield Callout */}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-[11px] leading-relaxed">
              <strong>Strict Locales-Only Safety Guard:</strong> JSON Link enforces a strict client-side path filter that only accesses authorized translation files (<code className="font-mono text-xs">.json</code>, <code className="font-mono text-xs">.arb</code>, <code className="font-mono text-xs">.yaml</code>, <code className="font-mono text-xs">.xml</code>, <code className="font-mono text-xs">.strings</code>). Non-localization files (source code, configs, CI workflows, secrets) are permanently blocked by the app filter from being read or written.
            </div>
          </div>

          {/* Feedback & Error alerts */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2 text-xs">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-start gap-2 text-xs">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Underline Tabs Navigation */}
          <div className="grid grid-cols-3 border-b border-border w-full">
            <button
              type="button"
              onClick={() => setActiveTab('connect')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer text-center min-w-0 ${
                activeTab === 'connect'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="truncate">1. Connect Repo</span>
            </button>
            <button
              type="button"
              onClick={() => repoDetails && setActiveTab('pull')}
              disabled={!repoDetails}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer text-center min-w-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === 'pull'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="truncate">2. Pull Locales</span>
              {discoveredFiles.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-mono shrink-0 hidden sm:inline">
                  {discoveredFiles.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => repoDetails && setActiveTab('pr')}
              disabled={!repoDetails}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer text-center min-w-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === 'pr'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="truncate">3. Push &amp; Open PR</span>
            </button>
          </div>

          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="w-full">

            {/* TAB 1: CONNECT */}
            <TabsContent value="connect" className="flex flex-col gap-4 pt-3.5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    GitHub Personal Access Token (PAT)
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=JSON+Link+Translation+Sync"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-normal cursor-pointer"
                  >
                    Generate token
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
                <div className="relative">
                  <Input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxx..."
                    className="pr-9 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {/* Token Scope & Privacy Guidance Note */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border/60 text-[11px] text-muted-foreground leading-relaxed flex flex-col gap-2 mt-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Lightbulb className="size-3.5 text-primary shrink-0" />
                    <span>PAT Scope vs. App Filter</span>
                  </div>
                  <p>
                    GitHub tokens require <code className="font-mono text-[10px] px-1 py-0.5 rounded bg-background border border-border/50 text-foreground font-semibold">repo</code> scope (classic) or a fine-grained PAT with <code className="font-mono text-[10px] px-1 py-0.5 rounded bg-background border border-border/50 text-foreground">Contents</code> &amp; <code className="font-mono text-[10px] px-1 py-0.5 rounded bg-background border border-border/50 text-foreground">Pull requests</code> (read/write). While the token grant technically gives repository-level access on GitHub, <strong>JSON Link's client-side app filter strictly restricts all operations to translation files only</strong>.
                  </p>
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] leading-relaxed flex items-start gap-1.5">
                    <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Local Storage Notice:</strong> Your token is stored in your browser's <code className="font-mono text-[10px]">localStorage</code> for convenience and communicated directly with GitHub's REST API (zero intermediary servers). We recommend using a fine-grained PAT with minimal repository scope and short expiration. Click "Disconnect Token" when finished or on shared computers.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">Target Repository</label>
                <Input
                  type="text"
                  value={repoInput}
                  onChange={e => setRepoInput(e.target.value)}
                  placeholder="owner/repo (e.g. facebook/react or https://github.com/...)"
                  className="font-mono text-xs"
                />
              </div>

              {branches.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <GitBranch className="size-3.5 text-muted-foreground" />
                    Target Branch
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={e => handleBranchChange(e.target.value)}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {branches.map(b => (
                      <option key={b.name} value={b.name}>
                        {b.name} {b.name === repoDetails?.defaultBranch ? '(default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {token && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCredentials}
                    className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    Disconnect Token
                  </Button>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleConnectRepo}
                    disabled={isScanning || !token || !repoInput}
                    className="gap-2 text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        Scanning Locales...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        Connect &amp; Scan Locales
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: PULL / IMPORT */}
            <TabsContent value="pull" className="space-y-4 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Discovered Localization Files</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Select the files you want to import into your spreadsheet workspace.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllFiles}
                    className="h-7 text-[11px] cursor-pointer"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllFiles}
                    className="h-7 text-[11px] cursor-pointer"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              {discoveredFiles.length === 0 ? (
                <div className="p-8 text-center rounded-lg border border-dashed border-border text-muted-foreground">
                  <FileCode2 className="size-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-xs">No localization files found in branch "{selectedBranch}".</p>
                  <p className="text-[11px] mt-1">
                    Try switching branch or make sure your translation files are located in <code className="font-mono">locales/</code>, <code className="font-mono">i18n/</code>, or named like <code className="font-mono">en.json</code>.
                  </p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg divide-y divide-border/60 bg-card/50">
                  {discoveredFiles.map(file => {
                    const isSelected = selectedFilePaths.has(file.path);
                    return (
                      <label
                        key={file.path}
                        className={`flex items-center justify-between p-2.5 hover:bg-muted/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleFile(file.path)}
                          />
                          <div className="min-w-0">
                            <p className="font-mono text-xs font-semibold text-foreground truncate">{file.path}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        {file.suggestedLanguage && (
                          <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                            {file.suggestedLanguage}
                          </Badge>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  {selectedFilePaths.size} of {discoveredFiles.length} files selected
                </span>
                <Button
                  type="button"
                  onClick={handlePullSelectedFiles}
                  disabled={isPulling || selectedFilePaths.size === 0}
                  className="gap-2 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {isPulling ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      Pulling &amp; Merging...
                    </>
                  ) : (
                    <>
                      <Download className="size-3.5" />
                      Load Selected into Spreadsheet
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* TAB 3: PUSH & OPEN PR */}
            <TabsContent value="pr" className="flex flex-col gap-4 pt-3.5">
              {/* Success Card if PR Opened */}
              {prResult && prResult.success && prResult.pullRequestUrl && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="size-5" />
                    <span>Pull Request Created Successfully!</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your translations have been committed to branch <code className="font-mono font-semibold text-foreground">{prResult.branchName}</code> and Pull Request <strong>#{prResult.pullRequestNumber}</strong> is ready on GitHub.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={prResult.pullRequestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded-md shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="size-3.5" />
                      View Pull Request on GitHub
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPrUrl}
                      className="h-8 gap-1.5 text-xs cursor-pointer"
                    >
                      {copiedPrUrl ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                      {copiedPrUrl ? 'Copied Link' : 'Copy PR URL'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Target Directory in Repo</label>
                  <Input
                    type="text"
                    value={targetFolder}
                    onChange={e => setTargetFolder(e.target.value)}
                    placeholder="locales/ or assets/i18n/"
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">File Format</label>
                  <select
                    value={targetFormat}
                    onChange={e => setTargetFormat(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="json-nested">Nested JSON ({'{ "app": { "title": "" } }'})</option>
                    <option value="json-flat">Flat JSON ({'{ "app.title": "" }'})</option>
                    <option value="arb">Flutter ARB (app_en.arb)</option>
                    <option value="yaml">YAML (en.yaml)</option>
                    <option value="xml">Android XML (strings_en.xml)</option>
                    <option value="strings">iOS Strings (en.strings)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Commit Mode</span>
                  <span className="text-[10px] text-muted-foreground">Base: {selectedBranch}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCommitMode('pr')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      commitMode === 'pr'
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <GitPullRequest className="size-3.5 text-primary" />
                      Create Pull Request (Recommended)
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Pushes to a new feature branch and opens a PR for review.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommitMode('direct')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      commitMode === 'direct'
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <GitBranch className="size-3.5 text-amber-500" />
                      Direct Commit
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Directly commits to "{selectedBranch}" (Repo maintainers).
                    </p>
                  </button>
                </div>
              </div>

              {commitMode === 'pr' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">New Feature Branch Name</label>
                    <Input
                      type="text"
                      value={newBranchName}
                      onChange={e => setNewBranchName(e.target.value)}
                      placeholder="jsonlink/translations-2026..."
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Pull Request Title</label>
                    <Input
                      type="text"
                      value={prTitle}
                      onChange={e => setPrTitle(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">Pull Request Description</label>
                      <button
                        type="button"
                        onClick={() =>
                          setPrBody(
                            buildDefaultPrBody({
                              languages,
                              itemsCount: items.length,
                              targetFolder,
                              targetFormat,
                            })
                          )
                        }
                        className="text-[10px] text-primary hover:underline cursor-pointer"
                      >
                        Reset Template
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={prBody}
                      onChange={e => setPrBody(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-y"
                      placeholder="Summary of changes..."
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Automatically summarizes modified keys, files, security guarantees, and Co-worked by JSON Link badge.
                    </p>
                  </div>
                </>
              )}

              {commitMode === 'direct' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Commit Message</label>
                  <Input
                    type="text"
                    value={commitMessage}
                    onChange={e => setCommitMessage(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}

              <div className="p-3 bg-muted/40 rounded-lg border border-border/80 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-foreground">Ready to Export:</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    {languages.length} languages ({languages.join(', ')}) · {items.length} translation keys
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {languages.length} Files
                </Badge>
              </div>

              <div className="flex items-center justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleSubmitPush}
                  disabled={isSubmitting || items.length === 0}
                  className="gap-2 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      {commitMode === 'pr' ? 'Creating Pull Request...' : 'Committing Files...'}
                    </>
                  ) : commitMode === 'pr' ? (
                    <>
                      <GitPullRequest className="size-3.5" />
                      Open Pull Request
                    </>
                  ) : (
                    <>
                      <GitBranch className="size-3.5" />
                      Commit to Branch
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogBody>

        <DialogFooter className="border-t border-border pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs cursor-pointer">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
