import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
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
import {
  Search,
  Replace,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  Filter,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { TranslationItem } from '@/types';
import {
  countMatches,
  executeFindReplace,
  buildSearchRegex,
  FindReplaceOptions,
} from '@/lib/findReplace';
import { SUPPORTED_LANGUAGES } from '@/data/languages';
import { cn } from '@/lib/utils';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TranslationItem[];
  languages: string[];
  onApplyReplace: (updatedItems: TranslationItem[], count: number) => void;
  initialTab?: 'find' | 'replace';
  onJumpToKey?: (key: string) => void;
  onFilterTable?: (query: string) => void;
}

function HighlightedText({
  text,
  query,
  matchCase,
  isRegex,
  wholeWord,
}: {
  text: string;
  query: string;
  matchCase: boolean;
  isRegex: boolean;
  wholeWord: boolean;
}) {
  if (!query || !text) return <span>{text}</span>;

  const regex = buildSearchRegex({
    query,
    replacement: '',
    scope: 'all',
    matchCase,
    wholeWord,
    isRegex,
    languages: [],
  });

  if (!regex) return <span>{text}</span>;

  const parts: { text: string; isMatch: boolean }[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  try {
    const activeRegex = new RegExp(regex.source, regex.flags);
    while ((m = activeRegex.exec(text)) !== null) {
      if (m.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, m.index), isMatch: false });
      }
      parts.push({ text: m[0], isMatch: true });
      lastIndex = m.index + m[0].length;
      if (m[0].length === 0) {
        activeRegex.lastIndex++;
      }
    }
  } catch {
    return <span>{text}</span>;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex), isMatch: false });
  }

  return (
    <span className="break-words">
      {parts.map((p, i) =>
        p.isMatch ? (
          <mark
            key={i}
            className="bg-amber-500/30 text-amber-950 dark:text-amber-200 font-semibold px-0.5 rounded"
          >
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </span>
  );
}

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

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  items,
  languages,
  onApplyReplace,
  initialTab = 'replace',
  onJumpToKey,
  onFilterTable,
}) => {
  const [tab, setTab] = useState<'find' | 'replace'>(initialTab);
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [scope, setScope] = useState('all');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const queryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setActiveMatchIndex(0);
      setTimeout(() => queryInputRef.current?.focus(), 50);
    }
  }, [isOpen, initialTab]);

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
    if (!query.trim()) return { totalMatches: 0, affectedRows: 0, occurrences: [] };
    return countMatches(items, options);
  }, [items, options, query]);

  useEffect(() => {
    if (matchStats.occurrences.length === 0) {
      setActiveMatchIndex(0);
    } else if (activeMatchIndex >= matchStats.occurrences.length) {
      setActiveMatchIndex(matchStats.occurrences.length - 1);
    }
  }, [matchStats.occurrences.length, activeMatchIndex]);

  const handleNextMatch = () => {
    if (matchStats.occurrences.length === 0) return;
    setActiveMatchIndex((prev) => (prev + 1) % matchStats.occurrences.length);
  };

  const handlePrevMatch = () => {
    if (matchStats.occurrences.length === 0) return;
    setActiveMatchIndex(
      (prev) => (prev - 1 + matchStats.occurrences.length) % matchStats.occurrences.length
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevMatch();
      } else {
        handleNextMatch();
      }
    }
  };

  const handleReplaceAll = () => {
    if (!query) return;
    const { updatedItems, count } = executeFindReplace(items, options);
    if (count > 0) {
      onApplyReplace(updatedItems, count);
      onClose();
    }
  };

  const handleJumpToOccurrence = (key: string) => {
    onJumpToKey?.(key);
    onClose();
  };

  const activeOcc = matchStats.occurrences[activeMatchIndex];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-base font-semibold">
            Find &amp; Replace Across Languages
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            Search and replace text across translation keys, descriptions, or specific language columns.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-3.5 text-xs py-3">
          {/* Underline Tabs */}
          <div className="flex items-center gap-4 border-b border-border w-full pb-0 -mt-1 mb-1">
            <button
              type="button"
              onClick={() => setTab('find')}
              className={`flex items-center gap-1.5 pb-2 px-1 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                tab === 'find'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Search className="size-3.5" />
              <span>Find</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('replace')}
              className={`flex items-center gap-1.5 pb-2 px-1 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                tab === 'replace'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Replace className="size-3.5" />
              <span>Replace</span>
            </button>
          </div>

          {/* Find input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="find-query-input" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Search className="size-3.5 text-primary" />
                Find
              </label>
              {matchStats.totalMatches > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span>
                    Match <strong className="text-foreground">{activeMatchIndex + 1}</strong> of{' '}
                    <strong>{matchStats.occurrences.length}</strong>
                  </span>
                  <div className="flex items-center ml-1 border border-border rounded">
                    <button
                      type="button"
                      onClick={handlePrevMatch}
                      title="Previous match (Shift+Enter)"
                      className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <ChevronUp className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMatch}
                      title="Next match (Enter)"
                      className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors border-l border-border"
                    >
                      <ChevronDown className="size-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <Input
                id="find-query-input"
                ref={queryInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search term or regex..."
                className="h-8 text-xs font-mono pr-7"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Replace input - shown only in Replace tab */}
          {tab === 'replace' && (
            <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
              <label htmlFor="find-replace-input" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Replace className="size-3.5 text-primary" />
                Replace With
              </label>
              <Input
                id="find-replace-input"
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="Replacement text..."
                className="h-8 text-xs font-mono"
              />
            </div>
          )}

          {/* Scope selection */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-foreground">Search In / Scope</span>
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
              <DropdownMenuContent
                align="start"
                className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto"
              >
                <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                  General Scope
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setScope('all')}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>All Languages &amp; Fields (Entire Project)</span>
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
                <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                  Specific Language Column
                </DropdownMenuLabel>
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

          {/* Options row */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <label htmlFor="find-match-case" className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground">
              <Checkbox
                id="find-match-case"
                checked={matchCase}
                onCheckedChange={(checked) => setMatchCase(!!checked)}
              />
              <span>Match case (Aa)</span>
            </label>

            <label htmlFor="find-whole-word" className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground">
              <Checkbox
                id="find-whole-word"
                checked={wholeWord}
                onCheckedChange={(checked) => setWholeWord(!!checked)}
              />
              <span>Whole word</span>
            </label>

            <label htmlFor="find-regex" className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground">
              <Checkbox
                id="find-regex"
                checked={isRegex}
                onCheckedChange={(checked) => setIsRegex(!!checked)}
              />
              <span>Use Regex (.*)</span>
            </label>
          </div>

          {/* Match counter banner */}
          <div className="rounded-lg bg-muted/40 border border-border px-3 py-2 flex items-center justify-between text-xs">
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

          {/* Matching Results List (Just Find / Results preview) */}
          {matchStats.occurrences.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-0.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span>Matching Entries ({matchStats.occurrences.length}):</span>
                <span className="text-[10px] font-normal italic">
                  Click a row to select or jump
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 border border-border/70 rounded-lg p-2 bg-muted/20 [scrollbar-width:thin]">
                {matchStats.occurrences.map((occ, idx) => {
                  const isActive = idx === activeMatchIndex;
                  return (
                    <div
                      key={`${occ.key}-${occ.field}-${occ.rowIndex}-${idx}`}
                      className={cn(
                        'p-2 rounded-md border text-xs transition-all flex flex-col gap-1',
                        isActive
                          ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/30 shadow-2xs'
                          : 'bg-background border-border/60 hover:border-border hover:bg-muted/30'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveMatchIndex(idx)}
                          className="flex items-center gap-1.5 min-w-0 text-left cursor-pointer flex-1"
                        >
                          <code className="font-mono text-[11px] font-semibold text-primary truncate">
                            {occ.key}
                          </code>
                          <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-muted text-muted-foreground border border-border shrink-0">
                            {occ.field}
                          </span>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Row #{occ.rowIndex + 1}
                          </span>
                          {onJumpToKey && (
                            <button
                              type="button"
                              onClick={() => handleJumpToOccurrence(occ.key)}
                              title="Jump to row in table"
                              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary hover:underline cursor-pointer"
                            >
                              <span>Jump</span>
                              <ArrowUpRight className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveMatchIndex(idx)}
                        className="text-[11px] text-muted-foreground font-myanmar break-words leading-relaxed pl-1.5 border-l-2 border-primary/30 text-left w-full cursor-pointer"
                      >
                        <HighlightedText
                          text={occ.value}
                          query={query}
                          matchCase={matchCase}
                          isRegex={isRegex}
                          wholeWord={wholeWord}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogBody>

        {/* Footer actions */}
        <DialogFooter className="justify-between sm:justify-between flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs cursor-pointer"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {tab === 'find' ? (
              <>
                {onFilterTable && matchStats.totalMatches > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onFilterTable(query);
                      onClose();
                    }}
                    className="h-8 text-xs cursor-pointer gap-1.5"
                    title="Filter table rows to matching keys"
                  >
                    <Filter className="size-3.5 text-primary" />
                    <span>Filter Table ({matchStats.affectedRows})</span>
                  </Button>
                )}
                {onJumpToKey && activeOcc && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleJumpToOccurrence(activeOcc.key)}
                    className="h-8 text-xs font-semibold cursor-pointer gap-1.5"
                  >
                    <span>Jump to Row #{activeOcc.rowIndex + 1}</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                )}
              </>
            ) : (
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
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
