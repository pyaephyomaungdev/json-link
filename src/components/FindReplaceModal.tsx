import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { Search, Replace, ArrowRight } from 'lucide-react';
import { TranslationItem } from '@/types';
import { countMatches, executeFindReplace, FindReplaceOptions } from '@/lib/findReplace';
import { SUPPORTED_LANGUAGES } from '@/data/languages';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TranslationItem[];
  languages: string[];
  onApplyReplace: (updatedItems: TranslationItem[], count: number) => void;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  items,
  languages,
  onApplyReplace,
}) => {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [scope, setScope] = useState('all');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [isRegex, setIsRegex] = useState(false);

  const queryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => queryInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const options: FindReplaceOptions = useMemo(
    () => ({
      query,
      replacement,
      scope,
      matchCase,
      wholeWord,
      isRegex,
      languages,
    }),
    [query, replacement, scope, matchCase, wholeWord, isRegex, languages]
  );

  const matchStats = useMemo(() => {
    if (!query.trim()) return { totalMatches: 0, affectedRows: 0 };
    return countMatches(items, options);
  }, [items, options, query]);

  const handleReplaceAll = () => {
    if (!query) return;
    const { updatedItems, count } = executeFindReplace(items, options);
    if (count > 0) {
      onApplyReplace(updatedItems, count);
      onClose();
    }
  };

  const getLanguageLabel = (code: string) => {
    const meta = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    return meta ? `${meta.name} (${code})` : code.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            Find & Replace Across Languages
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Search and replace text across translation keys, descriptions, or specific language columns.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1 text-xs">
          {/* Find input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Search className="size-3.5 text-primary" />
              Find
            </label>
            <Input
              ref={queryInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search term or regex..."
              className="h-8 text-xs font-mono"
            />
          </div>

          {/* Replace input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Replace className="size-3.5 text-primary" />
              Replace With
            </label>
            <Input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder="Replacement text..."
              className="h-8 text-xs font-mono"
            />
          </div>

          {/* Scope selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Search In / Scope
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
            >
              <option value="all">All Languages & Fields (Entire Project)</option>
              <option value="key">Translation Keys Only (key)</option>
              <option value="description">Developer Context Only (description)</option>
              <optgroup label="Specific Language">
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {getLanguageLabel(lang)}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Options row */}
          <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted-foreground">
            <label className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="size-3.5 rounded border-input text-primary focus:ring-primary/20 cursor-pointer"
              />
              <span>Match case (Aa)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
                className="size-3.5 rounded border-input text-primary focus:ring-primary/20 cursor-pointer"
              />
              <span>Whole word</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground">
              <input
                type="checkbox"
                checked={isRegex}
                onChange={(e) => setIsRegex(e.target.checked)}
                className="size-3.5 rounded border-input text-primary focus:ring-primary/20 cursor-pointer"
              />
              <span>Use Regex (.*)</span>
            </label>
          </div>

          {/* Match counter banner */}
          <div className="rounded-lg bg-muted/40 border border-border px-3.5 py-2.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Occurrences:</span>
            {query.trim() ? (
              matchStats.totalMatches > 0 ? (
                <span className="text-primary font-medium">
                  {matchStats.totalMatches} match{matchStats.totalMatches > 1 ? 'es' : ''} in{' '}
                  {matchStats.affectedRows} row{matchStats.affectedRows > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-muted-foreground italic">No matches found</span>
              )
            ) : (
              <span className="text-muted-foreground italic">Enter search term</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!query.trim() || matchStats.totalMatches === 0}
            onClick={handleReplaceAll}
            className="h-8 text-xs font-semibold cursor-pointer gap-1.5"
          >
            <span>Replace All</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
