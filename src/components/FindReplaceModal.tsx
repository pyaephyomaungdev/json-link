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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Search, Replace, ArrowRight, ChevronDown, Check } from 'lucide-react';
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

  const getScopeLabel = (s: string) => {
    if (s === 'all') return 'All Languages & Fields (Entire Project)';
    if (s === 'key') return 'Translation Keys Only (key)';
    if (s === 'description') return 'Developer Context Only (description)';
    return getLanguageLabel(s);
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

          {/* Scope selection - Custom Dropdown Action Menu */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Search In / Scope
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-full h-8 px-2.5 bg-background border border-input rounded-md text-xs text-foreground flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <span className="truncate">{getScopeLabel(scope)}</span>
                  <ChevronDown className="size-3.5 text-muted-foreground shrink-0 ml-2" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto">
                <DropdownMenuLabel className="text-[11px] text-muted-foreground">General Scope</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setScope('all')}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>All Languages & Fields (Entire Project)</span>
                  {scope === 'all' && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setScope('key')}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>Translation Keys Only (key)</span>
                  {scope === 'key' && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setScope('description')}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>Developer Context Only (description)</span>
                  {scope === 'description' && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[11px] text-muted-foreground">Specific Language Column</DropdownMenuLabel>
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => setScope(lang)}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span>{getLanguageLabel(lang)}</span>
                    {scope === lang && <Check className="size-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Options row - Custom Checkboxes */}
          <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted-foreground">
            <label className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground">
              <Checkbox
                checked={matchCase}
                onCheckedChange={(checked) => setMatchCase(!!checked)}
              />
              <span>Match case (Aa)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground">
              <Checkbox
                checked={wholeWord}
                onCheckedChange={(checked) => setWholeWord(!!checked)}
              />
              <span>Whole word</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground">
              <Checkbox
                checked={isRegex}
                onCheckedChange={(checked) => setIsRegex(!!checked)}
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
