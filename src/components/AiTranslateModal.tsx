import React, { useState, useEffect, useRef } from 'react';
import { TranslationItem } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Settings2,
} from 'lucide-react';
import {
  POPULAR_MODELS,
  getStoredApiKey,
  setStoredApiKey,
  getStoredModel,
  setStoredModel,
  testOpenRouterKey,
  translateBatchWithOpenRouter,
  getLanguageDisplayName,
} from '@/lib/openrouter';

interface AiTranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TranslationItem[];
  languages: string[];
  onApplyTranslations: (updatedItems: TranslationItem[]) => void;
  preselectedTargetLang?: string;
}

export const AiTranslateModal: React.FC<AiTranslateModalProps> = ({
  isOpen,
  onClose,
  items,
  languages,
  onApplyTranslations,
  preselectedTargetLang,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('my');
  const [scope, setScope] = useState<'missing' | 'all'>('missing');

  // Key verification state
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'untested' | 'valid' | 'invalid'>('untested');
  const [keyError, setKeyError] = useState('');

  // Batch Translation running state
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [translationError, setTranslationError] = useState('');
  const isAbortedRef = useRef(false);

  // Load stored settings on mount or open
  useEffect(() => {
    if (isOpen) {
      const storedKey = getStoredApiKey();
      setApiKey(storedKey);
      if (storedKey) setKeyStatus('valid');

      const storedM = getStoredModel();
      setSelectedModel(storedM);

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
    }
  }, [isOpen, languages, preselectedTargetLang]);

  // Keys that qualify for translation
  const eligibleItems = items.filter(item => {
    const hasSource = !!(item[sourceLang] || '').trim();
    if (!hasSource) return false;

    if (scope === 'missing') {
      const targetVal = (item[targetLang] || '').trim();
      return !targetVal;
    }

    return true;
  });

  const handleSaveKey = (newKey: string) => {
    setApiKey(newKey);
    setStoredApiKey(newKey);
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
      setStoredApiKey(apiKey);
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

    if (eligibleItems.length === 0) {
      alert('No eligible keys found to translate for the selected scope.');
      return;
    }

    setIsTranslating(true);
    setTranslationError('');
    isAbortedRef.current = false;
    setProgress({ current: 0, total: eligibleItems.length });

    // Save key
    setStoredApiKey(apiKey);
    setStoredModel(selectedModel);

    const BATCH_SIZE = 8;
    const workingItems = [...items];
    const keyToItemIndex = new Map<string, number>();
    workingItems.forEach((item, idx) => keyToItemIndex.set(item.key, idx));

    let completedCount = 0;

    try {
      for (let i = 0; i < eligibleItems.length; i += BATCH_SIZE) {
        if (isAbortedRef.current) break;

        const chunk = eligibleItems.slice(i, i + BATCH_SIZE);
        const reqItems = chunk.map(it => ({
          key: it.key,
          sourceText: it[sourceLang] || '',
        }));

        const translationsMap = await translateBatchWithOpenRouter({
          apiKey,
          model: selectedModel,
          sourceLang,
          targetLang,
          items: reqItems,
        });

        // Apply translations
        for (const [k, translatedText] of Object.entries(translationsMap)) {
          const idx = keyToItemIndex.get(k);
          if (idx !== undefined) {
            workingItems[idx] = {
              ...workingItems[idx],
              [targetLang]: translatedText,
            };
          }
        }

        completedCount += chunk.length;
        setProgress({
          current: Math.min(completedCount, eligibleItems.length),
          total: eligibleItems.length,
        });
      }

      if (!isAbortedRef.current) {
        onApplyTranslations(workingItems);
        onClose();
      }
    } catch (err: any) {
      console.error('Translation error:', err);
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
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>AI Auto-Translate</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                  OpenRouter BYOK
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Translate missing keys automatically with variable protection ({'{name}'}, %s).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* OpenRouter API Key Input */}
          <div className="space-y-1.5 bg-muted/40 p-3 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Key className="size-3.5 text-primary" />
                OpenRouter API Key
              </label>
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
                className="h-8 px-2.5 text-xs"
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

            {keyStatus === 'valid' && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Key verified and saved in local storage.
              </p>
            )}

            {keyError && (
              <p className="text-[11px] text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" /> {keyError}
              </p>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Cpu className="size-3.5 text-muted-foreground" />
              Translation Model
            </label>
            <select
              value={selectedModel}
              onChange={e => handleModelChange(e.target.value)}
              disabled={isTranslating}
              className="w-full h-8 px-2.5 bg-background border border-border rounded text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              {POPULAR_MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id})
                </option>
              ))}
            </select>
          </div>

          {/* Languages Configuration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Globe className="size-3 text-muted-foreground" />
                Source Language
              </label>
              <select
                value={sourceLang}
                onChange={e => setSourceLang(e.target.value)}
                disabled={isTranslating}
                className="w-full h-8 px-2 bg-background border border-border rounded text-xs text-foreground outline-none"
              >
                {languages.map(l => (
                  <option key={l} value={l}>
                    {l.toUpperCase()} — {getLanguageDisplayName(l)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Globe className="size-3 text-primary" />
                Target Language
              </label>
              <select
                value={targetLang}
                onChange={e => setTargetLang(e.target.value)}
                disabled={isTranslating}
                className="w-full h-8 px-2 bg-background border border-border rounded text-xs text-foreground outline-none"
              >
                {languages
                  .filter(l => l !== sourceLang)
                  .map(l => (
                    <option key={l} value={l}>
                      {l.toUpperCase()} — {getLanguageDisplayName(l)}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Translation Scope */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Settings2 className="size-3.5 text-muted-foreground" />
              Translation Scope
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('missing')}
                disabled={isTranslating}
                className={`p-2 rounded-md border text-left cursor-pointer transition-colors ${
                  scope === 'missing'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:bg-accent text-muted-foreground'
                }`}
              >
                <div className="text-xs">Only Missing Keys</div>
                <div className="text-[10px] opacity-80 mt-0.5">
                  Translate {items.filter(i => (i[sourceLang] || '').trim() && !(i[targetLang] || '').trim()).length} empty cells
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('all')}
                disabled={isTranslating}
                className={`p-2 rounded-md border text-left cursor-pointer transition-colors ${
                  scope === 'all'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:bg-accent text-muted-foreground'
                }`}
              >
                <div className="text-xs">All Keys (Overwrite)</div>
                <div className="text-[10px] opacity-80 mt-0.5">
                  Translate all {items.filter(i => (i[sourceLang] || '').trim()).length} keys
                </div>
              </button>
            </div>
          </div>

          {/* Live Progress Bar */}
          {isTranslating && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="flex items-center gap-1.5 text-primary">
                  <Loader2 className="size-3 animate-spin" />
                  Translating with {selectedModel.split('/')[1] || selectedModel}...
                </span>
                <span>
                  {progress.current} / {progress.total} keys
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
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isTranslating ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-xs"
            >
              Cancel Translation
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleStartTranslation}
                disabled={eligibleItems.length === 0 || !apiKey.trim()}
                className="gap-1.5 font-semibold text-xs shadow-xs"
              >
                <Sparkles className="size-3.5" />
                Translate {eligibleItems.length} Keys
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
