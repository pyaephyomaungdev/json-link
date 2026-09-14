import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { isZawgyi, zawgyiToUnicode } from '@/lib/myanmarFont';
import { cn } from '@/lib/utils';

export interface ZawgyiCandidateRow {
  key: string;
  before: string;
  after: string;
}

export interface ZawgyiConvertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: string;
  items: { key: string; [key: string]: any }[];
  onConfirm: (conversions: ZawgyiCandidateRow[]) => void;
}

export function ZawgyiConvertModal({
  open,
  onOpenChange,
  lang,
  items,
  onConfirm,
}: ZawgyiConvertModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all rows where lang contains detected Zawgyi text
  const candidates: ZawgyiCandidateRow[] = useMemo(() => {
    if (!lang || !items) return [];
    const results: ZawgyiCandidateRow[] = [];
    for (const item of items) {
      const val = item[lang];
      if (typeof val === 'string' && isZawgyi(val)) {
        results.push({
          key: item.key,
          before: val,
          after: zawgyiToUnicode(val),
        });
      }
    }
    return results;
  }, [items, lang]);

  // Reset selection to all candidates when opening modal or when candidates change
  useEffect(() => {
    if (open) {
      setSelectedKeys(new Set(candidates.map(c => c.key)));
      setSearchQuery('');
    }
  }, [open, candidates]);

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates;
    const q = searchQuery.toLowerCase().trim();
    return candidates.filter(
      c =>
        c.key.toLowerCase().includes(q) ||
        c.before.toLowerCase().includes(q) ||
        c.after.toLowerCase().includes(q)
    );
  }, [candidates, searchQuery]);

  const isAllSelected = candidates.length > 0 && selectedKeys.size === candidates.length;
  const isPartiallySelected = selectedKeys.size > 0 && selectedKeys.size < candidates.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(candidates.map(c => c.key)));
    }
  };

  const handleToggleKey = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const toConvert = candidates.filter(c => selectedKeys.has(c.key));
    if (toConvert.length > 0) {
      onConfirm(toConvert);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-base font-semibold text-foreground">
            Convert Zawgyi → Unicode
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Found {candidates.length} detected Zawgyi {candidates.length === 1 ? 'row' : 'rows'} in the{' '}
            <strong className="text-foreground">{lang.toUpperCase()}</strong> column. Review the Before &amp; After preview below before confirming conversion.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3.5 text-xs py-3">
          {/* Controls Bar: Select All + Search */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={isAllSelected ? true : isPartiallySelected ? 'indeterminate' : false}
                  onCheckedChange={handleToggleAll}
                />
                <span className="text-xs font-medium text-foreground">
                  Select All ({candidates.length})
                </span>
              </label>
              <span className="text-muted-foreground">·</span>
              <span className="text-[11px] text-muted-foreground">
                <strong className="text-foreground font-semibold">{selectedKeys.size}</strong> selected
              </span>
            </div>

            {candidates.length > 3 && (
              <div className="relative w-44 sm:w-56">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter keys or text..."
                  className="h-7.5 pl-8 text-xs bg-muted/30"
                />
              </div>
            )}
          </div>

          {/* Rows List */}
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1 [scrollbar-width:thin]">
            {candidates.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-xs font-medium">
                No Zawgyi encoded text detected in this column.
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
                No matching rows found for &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredCandidates.map((c, idx) => {
                const isSelected = selectedKeys.has(c.key);
                return (
                  <div
                    key={c.key}
                    className={cn(
                      'p-3 rounded-lg border transition-all text-xs',
                      isSelected
                        ? 'bg-card border-border shadow-2xs'
                        : 'bg-muted/15 border-border/40 opacity-60'
                    )}
                  >
                    {/* Header: Checkbox + Key + index */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40 mb-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleKey(c.key)}
                        />
                        <code className="font-mono text-xs font-semibold text-primary truncate">
                          {c.key}
                        </code>
                      </label>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Before / After Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Before (Zawgyi) */}
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="text-[11px] font-semibold text-muted-foreground">
                          Before (Zawgyi)
                        </div>
                        <div className="p-2 rounded-md bg-muted/40 border border-border text-foreground font-myanmar text-xs break-words whitespace-pre-wrap leading-relaxed min-h-[38px] select-text">
                          {c.before}
                        </div>
                      </div>

                      {/* After (Unicode) */}
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="text-[11px] font-semibold text-muted-foreground">
                          After (Unicode)
                        </div>
                        <div className="p-2 rounded-md bg-muted/20 border border-border text-foreground font-myanmar text-xs break-words whitespace-pre-wrap leading-relaxed min-h-[38px] select-text">
                          {c.after}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogBody>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
          <div className="text-[11px] text-muted-foreground">
            {selectedKeys.size} of {candidates.length} selected for conversion
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={selectedKeys.size === 0}
              className="h-8 text-xs font-semibold cursor-pointer shadow-2xs disabled:opacity-50"
            >
              Convert {selectedKeys.size} {selectedKeys.size === 1 ? 'Row' : 'Rows'} to Unicode
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
