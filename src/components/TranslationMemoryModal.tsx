import { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Sparkles,
  Trash2,
  Database,
  Languages,
  CheckCircle2,
} from 'lucide-react';
import { TranslationItem } from '@/types';
import {
  loadTranslationMemory,
  seedMemoryFromItems,
  clearTranslationMemory,
} from '@/lib/translationMemory';

interface TranslationMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TranslationItem[];
  languages: string[];
}

export function TranslationMemoryModal({
  isOpen,
  onClose,
  items,
  languages,
}: TranslationMemoryModalProps) {
  const [search, setSearch] = useState('');
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [version, setVersion] = useState(0); // For forcing re-render after mutation
  const [feedback, setFeedback] = useState<string | null>(null);

  // Load entries from storage
  const entries = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    version;
    return loadTranslationMemory();
  }, [version, isOpen]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter(e => {
      if (selectedLang !== 'all' && !e.translations[selectedLang]) {
        return false;
      }
      if (!q) return true;
      if (e.sourceText.toLowerCase().includes(q)) return true;
      return Object.values(e.translations).some(t => t.toLowerCase().includes(q));
    });
  }, [entries, search, selectedLang]);

  const handleSeed = () => {
    const added = seedMemoryFromItems(items, 'en');
    setVersion(v => v + 1);
    setFeedback(`Indexed ${added} segments from active workspace into Translation Memory.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all stored Translation Memory entries?')) {
      clearTranslationMemory();
      setVersion(v => v + 1);
      setFeedback('Translation Memory cleared.');
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const totalTranslations = useMemo(() => {
    return entries.reduce((sum, e) => sum + Object.keys(e.translations).length, 0);
  }, [entries]);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            Translation Memory (TM Cache)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Translation Memory stores approved translations in your browser so you can reuse identical phrases without re-translating or spending AI tokens.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 text-xs">
          {/* Stats & Actions Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-border bg-card shadow-2xs">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Database className="size-3.5 text-purple-500" />
                <span>
                  <strong className="text-foreground">{entries.length}</strong> phrases
                </span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Languages className="size-3.5 text-blue-500" />
                <span>
                  <strong className="text-foreground">{totalTranslations}</strong> translated pairs
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeed}
                className="gap-1.5 text-xs font-semibold cursor-pointer h-7"
                title="Index current project translations into memory"
              >
                <Sparkles className="size-3.5 text-amber-500" />
                <span>Index Active Workspace</span>
              </Button>

              {entries.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="size-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                  title="Clear all memory"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Feedback notification */}
          {feedback && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Search and Language Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search source or translated phrases..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-input rounded-md outline-none focus:ring-1 focus:ring-ring transition-colors shadow-2xs"
              />
            </div>

            <select
              value={selectedLang}
              onChange={e => setSelectedLang(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-background border border-input rounded-md outline-none cursor-pointer shadow-2xs font-medium"
            >
              <option value="all">All Languages</option>
              {languages.map(l => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Entries List */}
          <div className="rounded-xl border border-border bg-card overflow-hidden max-h-72 overflow-y-auto divide-y divide-border/60">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">No translation memory entries found.</p>
                <p className="text-[11px]">
                  Click &ldquo;Index Active Workspace&rdquo; to populate phrases from your spreadsheet.
                </p>
              </div>
            ) : (
              filteredEntries.map(entry => (
                <div key={entry.id} className="p-3 hover:bg-muted/20 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      &ldquo;{entry.sourceText}&rdquo;
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      used {entry.usageCount || 1}x
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {Object.entries(entry.translations).map(([lang, text]) => (
                      <Badge
                        key={lang}
                        variant="outline"
                        className="text-[11px] font-normal gap-1 bg-muted/40"
                      >
                        <span className="font-mono font-bold text-primary uppercase text-[9px]">
                          {lang}:
                        </span>
                        <span>{text}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogBody>

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
}
