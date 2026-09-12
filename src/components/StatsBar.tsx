import React from 'react';
import { TranslationItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { isEffectivelyMissing } from '@/lib/variables';
import { CheckCircle2, AlertCircle, Globe, Key } from 'lucide-react';

interface StatsBarProps {
  items: TranslationItem[];
  languages: string[];
  activeFilter: 'all' | 'missing';
  onFilterChange: (filter: 'all' | 'missing') => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  items,
  languages,
  activeFilter,
  onFilterChange,
}) => {
  const totalKeys = items.length;

  if (totalKeys === 0) {
    return null;
  }

  const sourceLang = languages.includes('en') ? 'en' : languages[0];

  // Calculate completeness for each language (placeholder-only = not filled unless source is placeholder-only)
  const stats = languages.map(lang => {
    const filledCount = items.filter(item => !isEffectivelyMissing(item[lang], item[sourceLang])).length;
    const missingCount = totalKeys - filledCount;
    const percentage = totalKeys > 0 ? Math.round((filledCount / totalKeys) * 100) : 0;

    return {
      lang,
      filledCount,
      missingCount,
      percentage,
    };
  });

  const totalMissingAcrossAll = items.filter(item => {
    const sourceText = item[sourceLang];
    return languages.some(lang => isEffectivelyMissing(item[lang], sourceText));
  }).length;

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Overall stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Key className="size-4" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Total Keys</div>
              <div className="text-lg font-bold tracking-tight">{totalKeys.toLocaleString()}</div>
            </div>
          </div>

          <div className="h-8 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Globe className="size-4" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Active Languages</div>
              <div className="text-lg font-bold tracking-tight flex items-center gap-1.5">
                {languages.length}
                <span className="text-xs font-normal text-muted-foreground">
                  ({languages.map(l => l.toUpperCase()).join(', ')})
                </span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-border hidden sm:block" />

          {/* Missing Keys Quick Filter Button */}
          <button
            onClick={() => onFilterChange(activeFilter === 'missing' ? 'all' : 'missing')}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              activeFilter === 'missing'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/30'
                : 'border-border hover:bg-accent text-foreground'
            }`}
          >
            <div className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-3.5" />
            </div>
            <div className="text-left">
              <div className="text-xs text-muted-foreground font-medium">Missing Translations</div>
              <div className="text-sm font-semibold flex items-center gap-1.5">
                {totalMissingAcrossAll} keys
                {totalMissingAcrossAll > 0 && (
                  <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                    {activeFilter === 'missing' ? 'Filtering' : 'Click to filter'}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Right: Language completion indicators */}
        <div className="flex flex-wrap items-center gap-3">
          {stats.map(s => (
            <div
              key={s.lang}
              className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 border border-border/60 text-xs"
            >
              <span className="font-bold uppercase tracking-wider text-muted-foreground">
                {s.lang}:
              </span>
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    s.percentage === 100
                      ? 'bg-emerald-500'
                      : s.percentage > 75
                      ? 'bg-primary'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${s.percentage}%` }}
                />
              </div>
              <span className="font-semibold">{s.percentage}%</span>
              {s.missingCount > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 text-[11px]">
                  ({s.missingCount} missing)
                </span>
              ) : (
                <CheckCircle2 className="size-3 text-emerald-500" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
