import React, { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Keyboard, Search } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'General' | 'Grid & Editing' | 'History' | 'Collaboration';
}

const SHORTCUTS: ShortcutItem[] = [
  // General
  { keys: ['⌘/Ctrl', 'K'], description: 'Open Command Palette', category: 'General' },
  { keys: ['⌘/Ctrl', 'F'], description: 'Find in translations', category: 'General' },
  { keys: ['⌘/Ctrl', 'H'], description: 'Find & Replace text', category: 'General' },
  { keys: ['⌘/Ctrl', 'S'], description: 'Save project (.jsonlink)', category: 'General' },
  { keys: ['?'], description: 'Show keyboard shortcuts cheat sheet', category: 'General' },
  { keys: ['⌘/Ctrl', '/'], description: 'Show keyboard shortcuts cheat sheet', category: 'General' },
  { keys: ['Esc'], description: 'Close modals / Cancel editing / Deselect rows', category: 'General' },

  // Grid & Editing
  { keys: ['↑', '↓', '←', '→'], description: 'Navigate active cell in spreadsheet', category: 'Grid & Editing' },
  { keys: ['Tab'], description: 'Move to next column cell', category: 'Grid & Editing' },
  { keys: ['Shift', 'Tab'], description: 'Move to previous column cell', category: 'Grid & Editing' },
  { keys: ['Enter'], description: 'Start editing cell / Commit and move down', category: 'Grid & Editing' },
  { keys: ['Esc'], description: 'Cancel current cell edit without saving', category: 'Grid & Editing' },
  { keys: ['⌘/Ctrl', 'C'], description: 'Copy selected cell text or key name', category: 'Grid & Editing' },
  { keys: ['⌘/Ctrl', 'V'], description: 'Paste clipboard text or multi-row TSV/CSV', category: 'Grid & Editing' },
  { keys: ['Right Click'], description: 'Open cell context menu (AI, Zawgyi, ICU)', category: 'Grid & Editing' },

  // History
  { keys: ['⌘/Ctrl', 'Z'], description: 'Undo last change', category: 'History' },
  { keys: ['⌘/Ctrl', 'Shift', 'Z'], description: 'Redo previously undone change', category: 'History' },
  { keys: ['Ctrl', 'Y'], description: 'Redo change (Windows)', category: 'History' },

  // Collaboration
  { keys: ['Click Avatar'], description: 'Follow collaborator camera in real-time', category: 'Collaboration' },
  { keys: ['Esc'], description: 'Exit follow mode / Stop camera tracking', category: 'Collaboration' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredShortcuts = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return SHORTCUTS;
    return SHORTCUTS.filter(
      s =>
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.keys.some(k => k.toLowerCase().includes(q))
    );
  }, [filterQuery]);

  const categories = ['General', 'Grid & Editing', 'History', 'Collaboration'] as const;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Keyboard className="size-4.5 text-primary" />
            <span>Keyboard Shortcuts</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Boost your productivity with spreadsheet hotkeys and navigation shortcuts.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 text-xs">
          {/* Search filter */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search shortcuts (e.g. undo, find, enter)..."
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
              autoFocus
            />
          </div>

          {/* Grouped Shortcuts List */}
          <div className="max-h-[380px] overflow-y-auto space-y-4 pr-1">
            {filteredShortcuts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
                No matching shortcuts found.
              </div>
            ) : (
              categories.map(cat => {
                const itemsInCat = filteredShortcuts.filter(s => s.category === cat);
                if (itemsInCat.length === 0) return null;

                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                      {cat}
                    </div>
                    <div className="border border-border rounded-lg divide-y divide-border bg-card/50 overflow-hidden">
                      {itemsInCat.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3 py-2 text-xs hover:bg-muted/40 transition-colors"
                        >
                          <span className="text-foreground font-medium">{item.description}</span>
                          <div className="flex items-center gap-1 shrink-0 ml-3">
                            {item.keys.map((k, kIdx) => (
                              <kbd
                                key={kIdx}
                                className="px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-muted border border-border rounded shadow-2xs text-foreground"
                              >
                                {k}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
