import React, { useState, useMemo } from 'react';
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
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { TranslationItem } from '@/types';
import { validateVariables } from '@/lib/variables';
import { SUPPORTED_LANGUAGES } from '@/data/languages';

interface ScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TranslationItem[];
  languages: string[];
  sourceLanguage?: string;
  onTranslateMissing?: (targetLang: string) => void;
}

interface LanguageHealth {
  lang: string;
  label: string;
  total: number;
  translated: number;
  missing: number;
  percentage: number;
  variableIssues: number;
}

interface VariableIssue {
  key: string;
  lang: string;
  sourceText: string;
  targetText: string;
  missingVars: string[];
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({
  isOpen,
  onClose,
  items,
  languages,
  sourceLanguage = 'en',
  onTranslateMissing,
}) => {
  const [activeTab, setActiveTab] = useState<'completion' | 'variables'>('completion');

  // Compute language health
  const { langStats, overallPercentage, allIssues, totalMissingKeys } = useMemo(() => {
    const totalKeys = items.length;
    let sumPercentages = 0;
    let missingSum = 0;
    const issues: VariableIssue[] = [];

    const stats: LanguageHealth[] = languages.map((lang) => {
      let translated = 0;
      let varIssues = 0;

      for (const item of items) {
        const val = (item[lang] || '').trim();
        if (val) {
          translated++;

          // Check variables against source language
          if (lang !== sourceLanguage) {
            const sourceVal = (item[sourceLanguage] || '').trim();
            if (sourceVal) {
              const res = validateVariables(sourceVal, val);
              if (!res.isValid) {
                varIssues++;
                issues.push({
                  key: item.key,
                  lang,
                  sourceText: sourceVal,
                  targetText: val,
                  missingVars: res.missingVariables,
                });
              }
            }
          }
        }
      }

      const missing = totalKeys - translated;
      missingSum += missing;
      const percentage = totalKeys > 0 ? Math.round((translated / totalKeys) * 100) : 0;
      sumPercentages += percentage;

      const meta = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
      const label = meta ? `${meta.name} (${lang})` : lang.toUpperCase();

      return {
        lang,
        label,
        total: totalKeys,
        translated,
        missing,
        percentage,
        variableIssues: varIssues,
      };
    });

    const overall = languages.length > 0 ? Math.round(sumPercentages / languages.length) : 0;

    return {
      langStats: stats,
      overallPercentage: overall,
      allIssues: issues,
      totalMissingKeys: missingSum,
    };
  }, [items, languages, sourceLanguage]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            Localization Health & Scorecard
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Track completion progress, missing keys, and variable integrity across languages.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/30 border border-border rounded-xl">
          <div className="p-3 bg-card border border-border/80 rounded-lg shadow-xs">
            <div className="text-[11px] text-muted-foreground font-medium">Overall Completion</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-bold text-foreground">{overallPercentage}%</span>
              <span className="text-[11px] text-muted-foreground">avg ({languages.length} langs)</span>
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  overallPercentage >= 90
                    ? 'bg-emerald-500'
                    : overallPercentage >= 60
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-card border border-border/80 rounded-lg shadow-xs">
            <div className="text-[11px] text-muted-foreground font-medium">Missing Translations</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-xl sm:text-2xl font-bold ${
                  totalMissingKeys === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {totalMissingKeys}
              </span>
              <span className="text-[11px] text-muted-foreground">empty cells</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              <Layers className="size-3" />
              <span>Across {items.length} total keys</span>
            </div>
          </div>

          <div className="p-3 bg-card border border-border/80 rounded-lg shadow-xs">
            <div className="text-[11px] text-muted-foreground font-medium">Variable Integrity</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-xl sm:text-2xl font-bold ${
                  allIssues.length === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {allIssues.length}
              </span>
              <span className="text-[11px] text-muted-foreground">mismatches</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              <ShieldCheck className="size-3" />
              <span>ICU, %s, curly braces</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-border pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('completion')}
            className={`pb-2 px-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'completion'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle2 className="size-3.5" />
            Language Completion ({languages.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variables')}
            className={`pb-2 px-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'variables'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertTriangle className="size-3.5" />
            Variable Warnings ({allIssues.length})
          </button>
        </div>

        {/* Tab content */}
        <div className="space-y-2.5">
          {activeTab === 'completion' && (
            <div className="space-y-2.5">
              {langStats.map((stat) => (
                <div
                  key={stat.lang}
                  className="p-3 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs sm:text-sm text-foreground">{stat.label}</span>
                      {stat.lang === sourceLanguage && (
                        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-mono">
                          Source
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs font-semibold text-foreground">
                        {stat.percentage}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({stat.translated}/{stat.total})
                      </span>
                      {stat.missing > 0 && onTranslateMissing && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onClose();
                            onTranslateMissing(stat.lang);
                          }}
                          className="h-6 px-2 text-[11px] font-medium text-primary border-primary/30 hover:bg-primary/10 cursor-pointer gap-1"
                        >
                          <Sparkles className="size-3" />
                          <span>Translate ({stat.missing})</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-muted h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        stat.percentage === 100
                          ? 'bg-emerald-500'
                          : stat.percentage >= 70
                          ? 'bg-blue-500'
                          : stat.percentage >= 40
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'variables' && (
            <div className="space-y-2.5">
              {allIssues.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  <ShieldCheck className="size-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                  <p className="text-sm font-medium text-foreground">All Variables Intact</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No missing curly braces, sprintf tags (%s), or parameters detected in translations.
                  </p>
                </div>
              ) : (
                allIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-card border border-rose-500/30 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-foreground font-medium">{issue.key}</span>
                      <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-medium">
                        {issue.lang}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border">
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                          Source ({sourceLanguage})
                        </span>
                        <span className="text-foreground">{issue.sourceText}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                          Translation ({issue.lang})
                        </span>
                        <span className="text-foreground">{issue.targetText}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[11px]">
                      <AlertTriangle className="size-3" />
                      <span>Missing parameter(s):</span>
                      {issue.missingVars.map((v, vIdx) => (
                        <code
                          key={vIdx}
                          className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1 py-0.5 rounded font-mono text-[10px] border border-rose-500/20"
                        >
                          {v}
                        </code>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        </DialogBody>

        {/* Footer */}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1 sm:flex-none h-8 text-xs cursor-pointer"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
