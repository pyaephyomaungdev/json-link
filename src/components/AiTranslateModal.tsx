import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TranslationItem } from '@/types';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Cpu,
  Globe,
  ChevronDown,
  Check,
  Search,
  X,
  Shield,
  ShieldCheck,
  Trash2,
  BookOpen,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  POPULAR_MODELS,
  OpenRouterModel,
  fetchOpenRouterModels,
  getCachedOpenRouterModels,
  getStoredApiKey,
  setStoredApiKey,
  isKeyRemembered,
  clearStoredApiKey,
  getStoredModel,
  setStoredModel,
  testOpenRouterKey,
  translateBatchWithOpenRouter,
  getLanguageDisplayName,
} from '@/lib/openrouter';
import { GlossaryModal } from './GlossaryModal';
import { getStoredGlossary } from '@/lib/glossary';

interface AiTranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TranslationItem[];
  languages: string[];
  onApplyTranslations: (updatedItems: TranslationItem[]) => void;
  preselectedTargetLang?: string;
  targetKey?: string;
  targetKeys?: string[];
}

export const AiTranslateModal: React.FC<AiTranslateModalProps> = ({
  isOpen,
  onClose,
  items,
  languages,
  onApplyTranslations,
  preselectedTargetLang,
  targetKey,
  targetKeys,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('my');
  const [scope, setScope] = useState<'missing' | 'all'>('missing');
  const [activeTargetKey, setActiveTargetKey] = useState<string | undefined>(targetKey);
  const [activeTargetKeys, setActiveTargetKeys] = useState<string[] | undefined>(targetKeys);

  const [allModels, setAllModels] = useState<OpenRouterModel[]>(getCachedOpenRouterModels);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [isCustomModelMode, setIsCustomModelMode] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Key verification and persistence state
  const [rememberKey, setRememberKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'untested' | 'valid' | 'invalid'>('untested');
  const [keyError, setKeyError] = useState('');

  // Glossary modal state
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [glossaryCount, setGlossaryCount] = useState(() => getStoredGlossary().length);

  // Batch Translation running state
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; stage?: string }>({ current: 0, total: 0 });
  const [translationError, setTranslationError] = useState('');
  const isAbortedRef = useRef(false);

  // Load stored settings and fetch model catalog on mount or open
  useEffect(() => {
    if (isOpen) {
      setActiveTargetKey(targetKey);
      setActiveTargetKeys(targetKeys);
      setRememberKey(isKeyRemembered());
      getStoredApiKey().then(storedKey => {
        setApiKey(storedKey);
        if (storedKey) setKeyStatus('valid');
      });

      const storedM = getStoredModel();
      setSelectedModel(storedM);

      // Fetch all models in background
      setIsLoadingModels(true);
      fetchOpenRouterModels()
        .then(models => {
          if (models.length > 0) {
            setAllModels(models);
          }
        })
        .finally(() => setIsLoadingModels(false));

      // Defaults for languages
      if (languages.includes('en')) {
        setSourceLang('en');
      } else if (languages.length > 0) {
        setSourceLang(languages[0]);
      }

      if (preselectedTargetLang && languages.includes(preselectedTargetLang)) {
        setTargetLang(preselectedTargetLang);
      } else {
        const other = languages.find(l => l !== 'en') || languages[1] || languages[0];
        if (other) setTargetLang(other);
      }

      setTranslationError('');
      setIsTranslating(false);
      isAbortedRef.current = false;
      setModelSearch('');
    }
  }, [isOpen, languages, preselectedTargetLang, targetKey, targetKeys]);

  // Dynamically filter models based on modelSearch query
  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    if (!q) {
      const popularIds = new Set(POPULAR_MODELS.map(m => m.id));
      const popularList = POPULAR_MODELS;
      const otherList = allModels.filter(m => !popularIds.has(m.id));
      return [...popularList, ...otherList];
    }
    return allModels.filter(
      m => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    );
  }, [allModels, modelSearch]);

  // Single row target helpers
  const singleTargetItem = useMemo(() => {
    if (!activeTargetKey) return null;
    return items.find(i => i.key === activeTargetKey) || null;
  }, [items, activeTargetKey]);

  const singleSourceVal = singleTargetItem ? (singleTargetItem[sourceLang] || '').trim() : '';
  const singleTargetVal = singleTargetItem ? (singleTargetItem[targetLang] || '').trim() : '';

  // Target languages list (supports single language or 'all' other languages)
  const targetLangsList = useMemo(() => {
    if (targetLang === 'all') {
      return languages.filter(l => l !== sourceLang);
    }
    return [targetLang];
  }, [languages, sourceLang, targetLang]);

  // Batch translation counts
  const missingCount = useMemo(() => {
    let total = 0;
    for (const tL of targetLangsList) {
      total += items.filter(i => (i[sourceLang] || '').trim() && !(i[tL] || '').trim()).length;
    }
    return total;
  }, [items, sourceLang, targetLangsList]);

  const allWithSourceCount = useMemo(() => {
    return items.filter(i => (i[sourceLang] || '').trim()).length;
  }, [items, sourceLang]);

  // Total cells to translate across selected target languages
  const totalCellsToTranslate = useMemo(() => {
    if (activeTargetKey) {
      if (!singleTargetItem) return 0;
      const hasSource = !!(singleTargetItem[sourceLang] || '').trim();
      return hasSource ? targetLangsList.length : 0;
    }

    const targetKeySet = activeTargetKeys && activeTargetKeys.length > 0 ? new Set(activeTargetKeys) : null;

    let total = 0;
    for (const tL of targetLangsList) {
      for (const item of items) {
        if (targetKeySet && !targetKeySet.has(item.key)) continue;
        if (!(item[sourceLang] || '').trim()) continue;
        if (scope === 'missing' && (item[tL] || '').trim()) continue;
        total++;
      }
    }
    return total;
  }, [items, targetLangsList, sourceLang, scope, activeTargetKey, singleTargetItem, activeTargetKeys]);

  // Keys that qualify for translation
  const eligibleItems = useMemo(() => {
    if (activeTargetKey) {
      if (!singleTargetItem) return [];
      const hasSource = !!(singleTargetItem[sourceLang] || '').trim();
      return hasSource ? [singleTargetItem] : [];
    }

    const targetKeySet = activeTargetKeys && activeTargetKeys.length > 0 ? new Set(activeTargetKeys) : null;

    return items.filter(item => {
      if (targetKeySet && !targetKeySet.has(item.key)) return false;
      const hasSource = !!(item[sourceLang] || '').trim();
      if (!hasSource) return false;

      if (scope === 'missing') {
        return targetLangsList.some(tL => !(item[tL] || '').trim());
      }

      return true;
    });
  }, [items, activeTargetKey, singleTargetItem, sourceLang, targetLangsList, scope, activeTargetKeys]);

  const handleSaveKey = (newKey: string) => {
    setApiKey(newKey);
    setStoredApiKey(newKey, rememberKey);
    setKeyStatus('untested');
    setKeyError('');
  };

  const handleToggleRemember = (checked: boolean) => {
    setRememberKey(checked);
    if (apiKey.trim()) {
      setStoredApiKey(apiKey, checked);
    }
  };

  const handleClearKey = () => {
    clearStoredApiKey();
    setApiKey('');
    setKeyStatus('untested');
    setKeyError('');
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setStoredModel(modelId);
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) return;
    setIsTestingKey(true);
    setKeyError('');
    const res = await testOpenRouterKey(apiKey);
    setIsTestingKey(false);
    if (res.valid) {
      setKeyStatus('valid');
      setStoredApiKey(apiKey, rememberKey);
    } else {
      setKeyStatus('invalid');
      setKeyError(res.error || 'Invalid API Key');
    }
  };

  const handleStartTranslation = async () => {
    if (!apiKey.trim()) {
      setKeyError('Please provide an OpenRouter API key.');
      return;
    }

    const totalToProcess = totalCellsToTranslate || eligibleItems.length;
    if (totalToProcess === 0) {
      setTranslationError('No eligible keys found to translate for the selected scope.');
      return;
    }

    setIsTranslating(true);
    setTranslationError('');
    isAbortedRef.current = false;
    setProgress({ current: 0, total: totalToProcess });

    // Save key & model
    setStoredApiKey(apiKey, rememberKey);
    setStoredModel(selectedModel);

    const BATCH_SIZE = 6;
    const workingItems = [...items];
    const keyToItemIndex = new Map<string, number>();
    workingItems.forEach((item, idx) => keyToItemIndex.set(item.key, idx));

    let completedTotal = 0;
    let anySuccess = false;

    try {
      for (const currentTargetLang of targetLangsList) {
        if (isAbortedRef.current) break;

        const langItems = items.filter(item => {
          if (activeTargetKey && item.key !== activeTargetKey) return false;
          if (activeTargetKeys && activeTargetKeys.length > 0 && !activeTargetKeys.includes(item.key)) return false;
          const hasSource = !!(item[sourceLang] || '').trim();
          if (!hasSource) return false;
          if (scope === 'missing') {
            return !(item[currentTargetLang] || '').trim();
          }
          return true;
        });

        if (langItems.length === 0) continue;

        for (let i = 0; i < langItems.length; i += BATCH_SIZE) {
          if (isAbortedRef.current) break;

          const chunk = langItems.slice(i, i + BATCH_SIZE);
          const reqItems = chunk.map(it => ({
            key: it.key,
            sourceText: it[sourceLang] || '',
          }));

          let translationsMap: Record<string, string> = {};

          try {
            translationsMap = await translateBatchWithOpenRouter({
              apiKey,
              model: selectedModel,
              sourceLang,
              targetLang: currentTargetLang,
              items: reqItems,
            });
          } catch (batchErr: any) {
            console.warn('Batch chunk failed, falling back to item-by-item recovery...', batchErr);
            for (const singleItem of reqItems) {
              if (isAbortedRef.current) break;
              try {
                const singleResult = await translateBatchWithOpenRouter({
                  apiKey,
                  model: selectedModel,
                  sourceLang,
                  targetLang: currentTargetLang,
                  items: [singleItem],
                });
                Object.assign(translationsMap, singleResult);
              } catch (singleErr) {
                console.warn(`Failed translation for key "${singleItem.key}":`, singleErr);
              }
            }
          }

          // Apply all successfully obtained translations and set row status to 'needs-review'
          for (const [k, translatedText] of Object.entries(translationsMap)) {
            const idx = keyToItemIndex.get(k);
            if (idx !== undefined && translatedText) {
              workingItems[idx] = {
                ...workingItems[idx],
                [currentTargetLang]: translatedText,
                status: 'needs-review',
              };
              anySuccess = true;
            }
          }

          completedTotal += chunk.length;
          setProgress({
            current: Math.min(completedTotal, totalToProcess),
            total: totalToProcess,
            stage: `Translating ${getLanguageDisplayName(currentTargetLang)} (${Math.min(i + chunk.length, langItems.length)}/${langItems.length})`,
          });
        }
      }

      if (anySuccess) {
        onApplyTranslations(workingItems);
      }

      if (!isAbortedRef.current) {
        onClose();
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      if (anySuccess) {
        onApplyTranslations(workingItems);
      }
      setTranslationError(err?.message || 'Failed to complete translation');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCancel = () => {
    isAbortedRef.current = true;
    setIsTranslating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !isTranslating && !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>AI Auto-Translate (OpenRouter)</DialogTitle>
          <DialogDescription>
            {activeTargetKey
              ? `Translating row "${activeTargetKey}" into ${getLanguageDisplayName(targetLang)}.`
              : activeTargetKeys && activeTargetKeys.length > 0
                ? `Translating ${activeTargetKeys.length} selected keys into ${getLanguageDisplayName(targetLang)}.`
                : 'Translate missing keys automatically with variable preservation ({name}, %s).'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 text-xs">
          {/* Target Row Information (Single Row Mode) */}
          {activeTargetKey && (
            <div className="space-y-2.5 bg-muted/40 p-3 rounded-lg border border-border">
              {/* Header with Title and Switch Action */}
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Target Row: <code className="font-mono text-primary font-bold">{activeTargetKey}</code></span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTargetKey(undefined)}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer flex items-center gap-1"
                >
                  <span>Translate all rows instead</span>
                </button>
              </div>

              {/* Source & Target Values Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Source text field */}
                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                    <span>Source ({sourceLang.toUpperCase()}):</span>
                    <span className="text-[10px] text-muted-foreground/80 font-normal">{getLanguageDisplayName(sourceLang)}</span>
                  </div>
                  <div className="p-2 bg-background border border-border rounded-md text-xs text-foreground min-h-[34px] flex items-center">
                    {singleSourceVal ? (
                      <span className="leading-snug select-text font-normal">{singleSourceVal}</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 italic text-[11px] flex items-center gap-1">
                        <AlertTriangle className="size-3 shrink-0" />
                        Empty source cell
                      </span>
                    )}
                  </div>
                </div>

                {/* Target text field */}
                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                    <span>Target ({targetLang.toUpperCase()}):</span>
                    <span className="text-[10px] text-muted-foreground/80 font-normal">{getLanguageDisplayName(targetLang)}</span>
                  </div>
                  <div className="p-2 bg-background border border-border rounded-md text-xs min-h-[34px] flex items-center justify-between gap-2">
                    {singleTargetVal ? (
                      <>
                        <span className="leading-snug text-muted-foreground truncate select-text">{singleTargetVal}</span>
                        <span className="text-[10px] font-mono uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded shrink-0">
                          Overwrite
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground/70 italic text-[11px]">
                        Empty cell (ready to translate)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Keys Scope (Bulk Selection Mode) */}
          {activeTargetKeys && activeTargetKeys.length > 0 && !activeTargetKey && (
            <div className="space-y-2.5 bg-muted/40 p-3 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Selected Scope: <code className="font-mono text-primary font-bold">{activeTargetKeys.length} keys selected</code></span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTargetKeys(undefined)}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer flex items-center gap-1"
                >
                  <span>Translate all rows instead</span>
                </button>
              </div>
            </div>
          )}

          {/* OpenRouter API Key Input & Security Vault */}
          <div className="space-y-2 bg-muted/40 p-3 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Key className="size-3.5 text-primary" />
                OpenRouter API Key
              </label>
              <div className="flex items-center gap-2.5">
                {apiKey.trim() && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    disabled={isTranslating}
                    className="text-[11px] text-destructive hover:underline flex items-center gap-1 cursor-pointer"
                    title="Disconnect and wipe API key from browser"
                  >
                    <Trash2 className="size-3" />
                    <span>Clear</span>
                  </button>
                )}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <span>Get API key</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-or-v1-..."
                  value={apiKey}
                  onChange={e => handleSaveKey(e.target.value)}
                  disabled={isTranslating}
                  className="pr-8 h-8 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestKey}
                disabled={isTestingKey || !apiKey.trim() || isTranslating}
                className="h-8 px-2.5 text-xs shrink-0"
              >
                {isTestingKey ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : keyStatus === 'valid' ? (
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                ) : (
                  'Test'
                )}
              </Button>
            </div>

            {/* Remember Key on Device Checkbox (Secure AES-GCM) */}
            <div className="pt-0.5">
              <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] text-muted-foreground hover:text-foreground">
                <Checkbox
                  checked={rememberKey}
                  onCheckedChange={checked => handleToggleRemember(!!checked)}
                  disabled={isTranslating}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-foreground">Remember key on this device</span>{' '}
                  <span className="text-[10px] text-muted-foreground">
                    (AES-256 encrypted in localStorage)
                  </span>
                  <span className="block text-[10px] text-muted-foreground/80">
                    {rememberKey
                      ? 'Stored securely on this browser until you clear it.'
                      : 'Stored in session memory only (automatically wiped when this tab closes).'}
                  </span>
                </span>
              </label>
            </div>

            {keyStatus === 'valid' && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="size-3.5" />
                <span>
                  Key verified ({rememberKey ? 'AES-256 encrypted on device' : 'Session only — clears when tab closes'})
                </span>
              </p>
            )}

            {keyError && (
              <p className="text-[11px] text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" /> {keyError}
              </p>
            )}

            {/* Security Advisory Callout */}
            <div className="bg-background/60 border border-border/70 rounded p-2 text-[10px] text-muted-foreground flex items-start gap-1.5 leading-relaxed">
              <Shield className="size-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">BYOK Privacy:</strong> Keys and translation content never touch any proxy server — requests go directly from your browser to OpenRouter. For best security, configure a usage limit (e.g. $1.00) at{' '}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-foreground font-medium"
                >
                  openrouter.ai/keys
                </a>.
              </span>
            </div>
          </div>

          {/* Model Selection via Custom Dropdown Menu with Search & Custom Model input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Cpu className="size-3.5 text-muted-foreground" />
                Translation Model
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModelMode(!isCustomModelMode)}
                  className="text-[11px] text-primary hover:underline cursor-pointer flex items-center gap-1 font-medium"
                >
                  <Sparkles className="size-3" />
                  {isCustomModelMode ? 'Choose from list' : 'Enter Custom Model ID'}
                </button>
                <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline truncate max-w-[140px]" title={selectedModel}>
                  {selectedModel}
                </span>
              </div>
            </div>

            {isCustomModelMode ? (
              <div className="flex items-center gap-1.5">
                <Input
                  type="text"
                  placeholder="e.g. meta-llama/llama-3.3-70b-instruct:free or anthropic/claude-3-7-sonnet"
                  value={selectedModel}
                  onChange={e => handleModelChange(e.target.value)}
                  disabled={isTranslating}
                  className="h-8 text-xs font-mono"
                  autoFocus
                />
              </div>
            ) : (
              <DropdownMenu open={isModelDropdownOpen} onOpenChange={setIsModelDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={isTranslating}
                    className="w-full h-8 px-3 bg-background border border-border rounded-md text-xs text-foreground flex items-center justify-between hover:bg-muted/30 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    <span className="truncate font-medium">
                      {allModels.find(m => m.id === selectedModel)?.name || selectedModel}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {isLoadingModels && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[340px] max-h-80 overflow-hidden flex flex-col p-0"
                >
                  {/* Search Header inside Dropdown Menu */}
                  <div
                    className="p-2 border-b border-border bg-popover sticky top-0 z-10 shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="relative flex items-center">
                      <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={e => setModelSearch(e.target.value)}
                        onKeyDown={e => e.stopPropagation()}
                        placeholder={`Search ${allModels.length}+ OpenRouter models...`}
                        className="w-full h-7 pl-8 pr-7 bg-background border border-border rounded text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        autoFocus
                      />
                      {modelSearch && (
                        <button
                          type="button"
                          onClick={() => setModelSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scrollable Model Items */}
                  <div className="overflow-y-auto max-h-64 p-1 divide-y divide-border/20">
                    {/* If user typed a custom model ID that doesn't match an existing model ID */}
                    {modelSearch.trim() && !allModels.some(m => m.id.toLowerCase() === modelSearch.trim().toLowerCase()) && (
                      <DropdownMenuItem
                        onClick={() => {
                          handleModelChange(modelSearch.trim());
                          setIsModelDropdownOpen(false);
                          setModelSearch('');
                        }}
                        className="flex items-center gap-2 p-2 cursor-pointer text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded mb-1 border border-dashed border-primary/40"
                      >
                        <Sparkles className="size-3.5 text-primary shrink-0" />
                        <div className="truncate min-w-0">
                          <span className="text-[11px] text-muted-foreground">Select custom model:</span>{' '}
                          <span className="font-mono font-bold text-primary underline">{modelSearch.trim()}</span>
                        </div>
                      </DropdownMenuItem>
                    )}

                    {filteredModels.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        No models matching "{modelSearch}".
                      </div>
                    ) : (
                      filteredModels.map(m => {
                        const isSelected = m.id === selectedModel;
                        const isPopular = POPULAR_MODELS.some(p => p.id === m.id);

                        return (
                          <DropdownMenuItem
                            key={m.id}
                            onClick={() => {
                              handleModelChange(m.id);
                              setIsModelDropdownOpen(false);
                              setModelSearch('');
                            }}
                            className={`flex items-start justify-between gap-2 p-2 cursor-pointer text-xs rounded transition-colors ${
                              isSelected ? 'bg-accent font-medium' : ''
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-foreground flex items-center gap-1.5">
                                <span className="truncate">{m.name}</span>
                                {m.id === 'google/gemini-2.5-flash' && (
                                  <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.2 rounded font-mono shrink-0">
                                    Recommended
                                  </span>
                                )}
                                {isPopular && m.id !== 'google/gemini-2.5-flash' && (
                                  <span className="text-[9px] bg-muted text-muted-foreground px-1 py-0.2 rounded font-mono shrink-0">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                                {m.id}
                              </p>
                              {m.description && (
                                <p className="text-[10px] text-muted-foreground/80 line-clamp-1 mt-0.5">
                                  {m.description}
                                </p>
                              )}
                            </div>
                            {isSelected && <Check className="size-3.5 text-primary shrink-0 mt-0.5" />}
                          </DropdownMenuItem>
                        );
                      })
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Languages Configuration via Custom Dropdown Menus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {/* Source Language */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
                <Globe className="size-3 text-muted-foreground" />
                Source Language
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={isTranslating}
                    className="w-full h-8 px-2.5 bg-background border border-border rounded-md text-xs text-foreground flex items-center justify-between hover:bg-muted/30 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    <span className="truncate">
                      <strong className="uppercase">{sourceLang}</strong> — {getLanguageDisplayName(sourceLang)}
                    </span>
                    <ChevronDown className="size-3 text-muted-foreground shrink-0 ml-1.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-56 overflow-y-auto">
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground">Source Language</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {languages.map(l => (
                    <DropdownMenuItem
                      key={l}
                      onClick={() => setSourceLang(l)}
                      className="flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span>
                        <strong className="uppercase">{l}</strong> — {getLanguageDisplayName(l)}
                      </span>
                      {sourceLang === l && <Check className="size-3.5 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Target Language */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
                <Globe className="size-3 text-primary" />
                Target Language
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={isTranslating}
                    className="w-full h-8 px-2.5 bg-background border border-border rounded-md text-xs text-foreground flex items-center justify-between hover:bg-muted/30 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    <span className="truncate">
                      {targetLang === 'all' ? (
                        <span className="font-bold text-primary flex items-center gap-1">
                          <Sparkles className="size-3 text-primary inline" />
                          All Languages ({languages.filter(l => l !== sourceLang).length})
                        </span>
                      ) : (
                        <>
                          <strong className="uppercase">{targetLang}</strong> — {getLanguageDisplayName(targetLang)}
                        </>
                      )}
                    </span>
                    <ChevronDown className="size-3 text-muted-foreground shrink-0 ml-1.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60 max-h-60 overflow-y-auto">
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground">Target Language</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {languages.filter(l => l !== sourceLang).length > 1 && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setTargetLang('all')}
                        className="flex items-center justify-between text-xs cursor-pointer font-semibold text-primary"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="size-3 text-primary" />
                          <span>All Other Languages ({languages.filter(l => l !== sourceLang).map(l => l.toUpperCase()).join(', ')})</span>
                        </span>
                        {targetLang === 'all' && <Check className="size-3.5 text-primary" />}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {languages
                    .filter(l => l !== sourceLang)
                    .map(l => (
                      <DropdownMenuItem
                        key={l}
                        onClick={() => setTargetLang(l)}
                        className="flex items-center justify-between text-xs cursor-pointer"
                      >
                        <span>
                          <strong className="uppercase">{l}</strong> — {getLanguageDisplayName(l)}
                        </span>
                        {targetLang === l && <Check className="size-3.5 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Translation Scope (Only visible in Batch / All Rows Mode) */}
          {!activeTargetKey ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <SlidersHorizontal className="size-3.5 text-primary" />
                  Translation Scope
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {scope === 'missing'
                    ? `${missingCount} empty cell${missingCount !== 1 ? 's' : ''} to fill`
                    : `${allWithSourceCount} total row${allWithSourceCount !== 1 ? 's' : ''} to translate`}
                </span>
              </div>
              <div className="grid grid-cols-2 p-1 bg-muted/40 border border-border rounded-lg gap-1">
                <button
                  type="button"
                  onClick={() => setScope('missing')}
                  disabled={isTranslating}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    scope === 'missing'
                      ? 'bg-background text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  <span>Missing Keys Only</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      scope === 'missing'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {missingCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  disabled={isTranslating}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    scope === 'all'
                      ? 'bg-background text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  <span>All Rows (Overwrite)</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      scope === 'all'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {allWithSourceCount}
                  </span>
                </button>
              </div>
            </div>
          ) : null}

          {/* AI Translation Glossary / Termbase */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border/80">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-blue-500/10 text-blue-400">
                <BookOpen className="size-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">AI Translation Glossary & Termbase</div>
                <div className="text-[10px] text-muted-foreground">
                  {glossaryCount > 0
                    ? `${glossaryCount} custom term rule${glossaryCount > 1 ? 's' : ''} strictly enforced`
                    : 'Enforce brand names, product titles, and terms'}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGlossaryOpen(true)}
              className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
            >
              <span>Glossary</span>
              {glossaryCount > 0 && (
                <span className="bg-primary/20 text-primary text-[10px] font-mono px-1 rounded">
                  {glossaryCount}
                </span>
              )}
            </Button>
          </div>

          {/* Live Progress Bar */}
          {isTranslating && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="flex items-center gap-1.5 text-primary">
                  <Loader2 className="size-3 animate-spin" />
                  {progress.stage || `Translating with ${selectedModel.split('/')[1] || selectedModel}...`}
                </span>
                <span>
                  {progress.current} / {progress.total} {progress.total === 1 ? 'key' : 'keys'}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {translationError && (
            <div className="p-2.5 rounded bg-destructive/10 border border-destructive/20 text-destructive text-[11px] flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div>{translationError}</div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {isTranslating ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex-1 sm:flex-none text-xs h-8"
            >
              Cancel Translation
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex-1 sm:flex-none text-xs h-8"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleStartTranslation}
                disabled={totalCellsToTranslate === 0 || !apiKey.trim()}
                className="flex-1 sm:flex-none gap-1.5 font-semibold text-xs h-8 shadow-xs"
              >
                {activeTargetKey ? (
                  !singleSourceVal ? (
                    <span>Source Text Missing</span>
                  ) : singleTargetVal ? (
                    <>
                      <RefreshCw className="size-3.5" />
                      <span>Re-translate Row</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      <span>Translate Row</span>
                    </>
                  )
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>
                      Translate {totalCellsToTranslate} {totalCellsToTranslate === 1 ? 'Key' : 'Keys'}
                      {targetLang === 'all' ? ' (All Languages)' : ''}
                    </span>
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => {
          setIsGlossaryOpen(false);
          setGlossaryCount(getStoredGlossary().length);
        }}
      />
    </Dialog>
  );
};
