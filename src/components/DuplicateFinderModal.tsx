import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Copy, Search, CheckCircle2, ArrowRight } from 'lucide-react';
import { TranslationItem } from '@/types';
import { findDuplicateValues } from '@/lib/duplicateFinder';

interface DuplicateFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TranslationItem[];
  languages: string[];
  onSelectKey?: (key: string) => void;
}

export function DuplicateFinderModal({
  isOpen,
  onClose,
  items,
  languages,
  onSelectKey,
}: DuplicateFinderModalProps) {
  const [selectedLang, setSelectedLang] = useState<string>(languages[0] || 'en');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [search, setSearch] = useState('');

  const duplicates = useMemo(() => {
    return findDuplicateValues(items, selectedLang, caseSensitive);
  }, [items, selectedLang, caseSensitive]);

  const filteredDuplicates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return duplicates;
    return duplicates.filter(
      d => d.value.toLowerCase().includes(q) || d.keys.some(k => k.toLowerCase().includes(q))
    );
  }, [duplicates, search]);

  const totalDuplicateKeys = useMemo(() => {
    return duplicates.reduce((sum, d) => sum + d.keys.length, 0);
  }, [duplicates]);

  const handleKeyClick = (key: string) => {
    onSelectKey?.(key);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Copy className="size-4 text-amber-500" />
            <span>Duplicate Value Finder</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Identify keys that share identical translation values so you can consolidate redundant keys and keep translations consistent.
          </DialogDescription>
        </DialogHeader>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-border bg-card shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Target Language:</span>
            <select
              value={selectedLang}
              onChange={e => setSelectedLang(e.target.value)}
              className="px-2.5 py-1 text-xs bg-muted/40 border border-border rounded-lg outline-none cursor-pointer font-medium"
            >
              {languages.map(l => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={e => setCaseSensitive(e.target.checked)}
                className="size-3.5 rounded accent-primary cursor-pointer"
              />
              <span>Case-sensitive</span>
            </label>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search duplicated values or keys..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/40 border border-border rounded-lg outline-none focus:border-primary/80 transition-colors"
          />
        </div>

        {/* Summary Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Found <strong className="text-foreground">{duplicates.length}</strong> duplicated phrase{duplicates.length === 1 ? '' : 's'} across <strong className="text-foreground">{totalDuplicateKeys}</strong> keys.
          </span>
        </div>

        {/* Duplicate Groups List */}
        <div className="rounded-xl border border-border bg-card overflow-hidden max-h-72 overflow-y-auto divide-y divide-border/60">
          {filteredDuplicates.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
              <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-foreground">No Duplicate Values Found</p>
              <p className="text-[11px]">All translation values in {selectedLang.toUpperCase()} are unique!</p>
            </div>
          ) : (
            filteredDuplicates.map((group, idx) => (
              <div key={idx} className="p-3.5 hover:bg-muted/20 transition-colors space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground">
                    &ldquo;{group.value}&rdquo;
                  </span>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-mono">
                    {group.count} keys share this
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {group.keys.map(key => (
                    <button
                      key={key}
                      onClick={() => handleKeyClick(key)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary border border-border/80 transition-colors cursor-pointer group"
                      title="Jump to this row in spreadsheet"
                    >
                      <span>{key}</span>
                      <ArrowRight className="size-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
