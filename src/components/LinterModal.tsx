import React, { useState, useMemo } from 'react';
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
import { HorizontalScrollContainer } from '@/components/ui/horizontal-scroll-container';
import {
  runLocalizationLinter,
  fixAllWhitespaceIssues,
  LintCategory,
  LintSeverity,
  LintIssue,
} from '@/lib/linter';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Wand2,
  ArrowRight,
  Check,
} from 'lucide-react';

interface LinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TranslationItem[];
  languages: string[];
  onApplyItems: (updatedItems: TranslationItem[]) => void;
  onJumpToCell?: (key: string, field: string) => void;
}

export const LinterModal: React.FC<LinterModalProps> = ({
  isOpen,
  onClose,
  items,
  languages,
  onApplyItems,
  onJumpToCell,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<LintCategory | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<LintSeverity | 'all'>('all');
  const [fixedNotice, setFixedNotice] = useState<string | null>(null);

  const report = useMemo(() => {
    const sourceLang = languages.includes('en') ? 'en' : languages[0] || 'en';
    return runLocalizationLinter(items, languages, sourceLang);
  }, [items, languages]);

  const filteredIssues = useMemo(() => {
    return report.issues.filter(issue => {
      if (selectedCategory !== 'all' && issue.category !== selectedCategory) return false;
      if (selectedSeverity !== 'all' && issue.severity !== selectedSeverity) return false;
      return true;
    });
  }, [report, selectedCategory, selectedSeverity]);

  const whitespaceCount = useMemo(() => {
    return report.issues.filter(i => i.category === 'whitespace').length;
  }, [report]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: report.issues.length,
      whitespace: 0,
      'variable-mismatch': 0,
      'length-expansion': 0,
      duplicate: 0,
      untranslated: 0,
      empty: 0,
    };
    for (const issue of report.issues) {
      if (counts[issue.category] !== undefined) {
        counts[issue.category]++;
      }
    }
    return counts;
  }, [report.issues]);

  const categories = [
    { id: 'all' as const, label: 'All Issues' },
    { id: 'whitespace' as const, label: 'Whitespace' },
    { id: 'variable-mismatch' as const, label: 'Variables' },
    { id: 'length-expansion' as const, label: 'Expansion' },
    { id: 'duplicate' as const, label: 'Duplicates' },
    { id: 'untranslated' as const, label: 'Untranslated' },
    { id: 'empty' as const, label: 'Missing' },
  ];

  const handleFixAllWhitespace = () => {
    const { updatedItems, fixedCount } = fixAllWhitespaceIssues(items, languages);
    if (fixedCount > 0) {
      onApplyItems(updatedItems);
      setFixedNotice(`Cleaned whitespace in ${fixedCount} key${fixedCount > 1 ? 's' : ''}!`);
    } else {
      setFixedNotice('No whitespace issues to fix.');
    }
    setTimeout(() => setFixedNotice(null), 2500);
  };

  const handleFixSingleWhitespace = (issue: LintIssue) => {
    const updated = items.map(item => {
      if (item.key === issue.key) {
        const clean: TranslationItem = { ...item };
        if (issue.lang) {
          if (clean[issue.lang]) {
            clean[issue.lang] = clean[issue.lang]!.trim();
          }
        } else {
          clean.key = clean.key.trim();
        }
        return clean;
      }
      return item;
    });
    onApplyItems(updated);
  };

  const handleJump = (key: string, lang?: string) => {
    if (onJumpToCell) {
      onJumpToCell(key, lang || 'key');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            Localization QA & Consistency Linter
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Automated scan for whitespace, missing variables, duplicates, and text expansion.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 text-xs">
          {/* Quick Notice Banner */}
          {fixedNotice && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg font-medium animate-in fade-in">
              <Check className="size-3.5 shrink-0" />
              <span>{fixedNotice}</span>
            </div>
          )}

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-muted/30 border border-border rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedSeverity('all')}
              className={`p-2.5 bg-card border rounded-lg text-left transition-all cursor-pointer ${
                selectedSeverity === 'all'
                  ? 'border-primary ring-1 ring-primary/30 shadow-2xs'
                  : 'border-border/80 hover:border-border hover:bg-muted/30'
              }`}
            >
              <div className="text-[11px] text-muted-foreground font-medium">Total Issues</div>
              <div className="text-xl font-bold text-foreground mt-0.5">{report.totalIssues}</div>
              <div className="text-[10px] text-muted-foreground mt-1">All categories</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSeverity(selectedSeverity === 'error' ? 'all' : 'error')}
              className={`p-2.5 bg-card border rounded-lg text-left transition-all cursor-pointer ${
                selectedSeverity === 'error'
                  ? 'border-rose-500 ring-1 ring-rose-500/30 shadow-2xs bg-rose-500/5'
                  : 'border-border/80 hover:border-border hover:bg-muted/30'
              }`}
            >
              <div className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                <AlertTriangle className="size-3" /> Errors
              </div>
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {report.errorsCount}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">Missing vars & keys</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSeverity(selectedSeverity === 'warning' ? 'all' : 'warning')}
              className={`p-2.5 bg-card border rounded-lg text-left transition-all cursor-pointer ${
                selectedSeverity === 'warning'
                  ? 'border-amber-500 ring-1 ring-amber-500/30 shadow-2xs bg-amber-500/5'
                  : 'border-border/80 hover:border-border hover:bg-muted/30'
              }`}
            >
              <div className="text-[11px] text-amber-500 font-medium flex items-center gap-1">
                <AlertTriangle className="size-3" /> Warnings
              </div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {report.warningsCount}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">Missing & whitespace</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSeverity(selectedSeverity === 'info' ? 'all' : 'info')}
              className={`p-2.5 bg-card border rounded-lg text-left transition-all cursor-pointer ${
                selectedSeverity === 'info'
                  ? 'border-blue-500 ring-1 ring-blue-500/30 shadow-2xs bg-blue-500/5'
                  : 'border-border/80 hover:border-border hover:bg-muted/30'
              }`}
            >
              <div className="text-[11px] text-blue-500 font-medium flex items-center gap-1">
                <Info className="size-3" /> Suggestions
              </div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {report.suggestionsCount}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">Expansion & duplicates</div>
            </button>
          </div>

          {/* Tabs */}
          <HorizontalScrollContainer
            wrapperClassName="border-b border-border pt-1"
            className="gap-1 sm:gap-2 px-0.5"
          >
            {categories.map(cat => {
              const count = categoryCounts[cat.id] ?? 0;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`pb-2 px-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[11px] font-normal ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </HorizontalScrollContainer>

          {/* Issue list */}
          <div className="space-y-2">
            {report.totalIssues === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
                  <CheckCircle2 className="size-6" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">Localization Clean</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  No linting issues found! All variables match, whitespace is trimmed, and translations are consistent.
                </p>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                No issues match the selected category or severity filters.
              </div>
            ) : (
              filteredIssues.map(issue => (
                <div
                  key={issue.id}
                  className="p-3 bg-card border border-border/80 rounded-xl hover:border-primary/40 transition-colors flex items-start justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          issue.severity === 'error'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : issue.severity === 'warning'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="font-mono text-xs font-semibold text-foreground truncate">
                        {issue.key}
                      </span>
                      {issue.lang && (
                        <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border">
                          {issue.lang.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-foreground font-medium">{issue.message}</p>
                    {issue.details && (
                      <p className="text-[11px] text-muted-foreground font-mono truncate">
                        {issue.details}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-center">
                    {issue.canAutoFix && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFixSingleWhitespace(issue)}
                        className="h-7 px-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer shadow-2xs"
                      >
                        <Wand2 className="size-3 mr-1" />
                        Fix
                      </Button>
                    )}

                    {onJumpToCell && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleJump(issue.key, issue.lang)}
                        className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                        title="Jump to cell in spreadsheet"
                      >
                        <span>Jump</span>
                        <ArrowRight className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogBody>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
          <div className="text-xs text-muted-foreground">
            Showing <strong className="font-semibold text-foreground">{filteredIssues.length}</strong> of {report.totalIssues} issues
          </div>
          <div className="flex items-center gap-2">
            {whitespaceCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleFixAllWhitespace}
                className="gap-1.5 h-8 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer shadow-2xs"
              >
                <Wand2 className="size-3.5" />
                <span>Fix All Whitespace ({whitespaceCount})</span>
              </Button>
            )}
            <Button size="sm" onClick={onClose} className="h-8">
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
