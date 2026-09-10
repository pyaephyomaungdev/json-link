import React, { useState, useMemo } from 'react';
import {
  Activity,
  X,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Localization Health & Scorecard</h2>
              <p className="text-xs text-slate-400">
                Track completion progress, missing keys, and variable integrity across languages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview metric cards */}
        <div className="grid grid-cols-3 gap-3 p-6 pb-4 bg-slate-950/40 border-b border-slate-800/80">
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400 font-medium">Overall Completion</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white">{overallPercentage}%</span>
              <span className="text-xs text-slate-400">avg across {languages.length} langs</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
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

          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400 font-medium">Missing Translations</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-2xl font-bold ${
                  totalMissingKeys === 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {totalMissingKeys}
              </span>
              <span className="text-xs text-slate-400">keys empty</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>Across {items.length} total rows</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400 font-medium">Variable Integrity</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-2xl font-bold ${
                  allIssues.length === 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {allIssues.length}
              </span>
              <span className="text-xs text-slate-400">mismatches</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>ICU, %s, curly braces</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/60">
          <button
            onClick={() => setActiveTab('completion')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'completion'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Language Completion ({languages.length})
          </button>
          <button
            onClick={() => setActiveTab('variables')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'variables'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Variable Warnings ({allIssues.length})
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {activeTab === 'completion' && (
            <div className="space-y-3">
              {langStats.map((stat) => (
                <div
                  key={stat.lang}
                  className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-200">{stat.label}</span>
                      {stat.lang === sourceLanguage && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                          Source
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-300">
                        {stat.percentage}%
                      </span>
                      <span className="text-xs text-slate-500">
                        ({stat.translated}/{stat.total})
                      </span>
                      {stat.missing > 0 && onTranslateMissing && (
                        <button
                          onClick={() => {
                            onClose();
                            onTranslateMissing(stat.lang);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-colors ml-2"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Translate Missing ({stat.missing})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
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
            <div className="space-y-3">
              {allIssues.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                  <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
                  <p className="text-sm font-medium text-slate-300">All Variables Intact</p>
                  <p className="text-xs text-slate-500 mt-1">
                    No missing curly braces, sprintf tags (%s), or parameters detected in translations.
                  </p>
                </div>
              ) : (
                allIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/60 border border-rose-900/40 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-300 font-medium">{issue.key}</span>
                      <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                        {issue.lang}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                          Source ({sourceLanguage})
                        </span>
                        <span className="text-slate-200">{issue.sourceText}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                          Translation ({issue.lang})
                        </span>
                        <span className="text-slate-200">{issue.targetText}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-rose-400 text-[11px]">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Missing parameter(s):</span>
                      {issue.missingVars.map((v, vIdx) => (
                        <code
                          key={vIdx}
                          className="bg-rose-950/80 text-rose-200 px-1 py-0.5 rounded font-mono text-[10px] border border-rose-800/60"
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

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-800 bg-slate-950/70">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
