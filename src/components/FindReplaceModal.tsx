import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Replace, X, ArrowRight } from 'lucide-react';
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2 text-white font-medium">
            <div className="p-1.5 rounded-md bg-blue-500/20 text-blue-400">
              <Replace className="w-4 h-4" />
            </div>
            <span>Find & Replace Across Languages</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-sm">
          {/* Find input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-400" />
              Find
            </label>
            <div className="relative">
              <input
                ref={queryInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search term or regex..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-mono"
              />
            </div>
          </div>

          {/* Replace input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Replace className="w-3.5 h-3.5 text-emerald-400" />
              Replace With
            </label>
            <input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder="Replacement text..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-mono"
            />
          </div>

          {/* Scope selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Search In / Scope
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
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
          <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500/20"
              />
              <span>Match case (Aa)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500/20"
              />
              <span>Whole word</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRegex}
                onChange={(e) => setIsRegex(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500/20"
              />
              <span>Use Regex (.*)</span>
            </label>
          </div>

          {/* Match counter banner */}
          <div className="rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Occurrences:</span>
            {query.trim() ? (
              matchStats.totalMatches > 0 ? (
                <span className="text-blue-400 font-medium">
                  {matchStats.totalMatches} match{matchStats.totalMatches > 1 ? 'es' : ''} in{' '}
                  {matchStats.affectedRows} row{matchStats.affectedRows > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-slate-500 italic">No matches found</span>
              )
            ) : (
              <span className="text-slate-500 italic">Enter search term</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!query.trim() || matchStats.totalMatches === 0}
            onClick={handleReplaceAll}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <span>Replace All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
