import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Search, X } from 'lucide-react';

export interface CommandItem {
  id: string;
  category: 'AI' | 'Spreadsheet' | 'History' | 'Export' | 'View' | 'Help';
  title: string;
  description?: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      itemRefs.current = [];
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = commands.filter(cmd => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.description && cmd.description.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
    itemRefs.current = [];
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [query]);

  // Auto-scroll selected item into view on keyboard navigation
  useEffect(() => {
    const container = listRef.current;
    const item = itemRefs.current[selectedIndex];
    if (!container || !item) return;

    if (typeof item.scrollIntoView === 'function') {
      item.scrollIntoView({ block: 'nearest' });
    }

    if (container.clientHeight > 0) {
      const itemTop = item.offsetTop;
      const itemBottom = itemTop + item.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;

      if (itemTop < containerTop) {
        container.scrollTop = Math.max(0, itemTop - 4);
      } else if (itemBottom > containerBottom) {
        container.scrollTop = itemBottom - container.clientHeight + 4;
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    }
  };

  const handleItemMouseMove = (idx: number, e: React.MouseEvent) => {
    if (e.clientX !== lastMousePos.current.x || e.clientY !== lastMousePos.current.y) {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      if (selectedIndex !== idx) {
        setSelectedIndex(idx);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent hideCloseButton className="max-w-xl p-0 sm:p-0 gap-0 sm:gap-0 overflow-hidden border border-border shadow-2xl bg-card">
        {/* Search Input */}
        <div className="flex items-center px-3.5 py-3 border-b border-border bg-background gap-2">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search action..."
            className="w-full bg-transparent border-none text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex items-center gap-2 shrink-0">
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border select-none">
              ESC
            </kbd>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="relative max-h-80 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={cmd.id}
                  ref={el => {
                    itemRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseMove={e => handleItemMouseMove(idx, e)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all text-xs select-none ${
                    isSelected
                      ? 'bg-primary/10 dark:bg-primary/15 text-foreground font-medium ring-1 ring-primary/25'
                      : 'text-foreground/90 hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`size-6.5 rounded-md flex items-center justify-center shrink-0 transition-colors [&>svg]:size-3.5 ${
                        isSelected
                          ? 'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-foreground shadow-2xs'
                          : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                      }`}
                    >
                      {cmd.icon}
                    </span>
                    <div className="truncate">
                      <div className="truncate">{cmd.title}</div>
                      {cmd.description && (
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-muted-foreground font-normal' : 'text-muted-foreground'
                          }`}
                        >
                          {cmd.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span
                      className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded transition-colors ${
                        isSelected
                          ? 'bg-primary/15 text-primary font-semibold'
                          : 'bg-muted/70 text-muted-foreground'
                      }`}
                    >
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <kbd
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                          isSelected
                            ? 'border-primary/30 text-foreground bg-background font-medium shadow-2xs'
                            : 'border-border text-muted-foreground bg-muted'
                        }`}
                      >
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-3.5 py-2 bg-muted/30 border-t border-border flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground select-none">
          <span className="sm:hidden text-[10px] text-muted-foreground">Tap an action to select</span>
          <span className="hidden sm:flex items-center gap-2">
            <span>Use <kbd className="font-mono bg-muted px-1 rounded text-[10px]">↑</kbd> <kbd className="font-mono bg-muted px-1 rounded text-[10px]">↓</kbd> to navigate</span>
            <span>•</span>
            <span><kbd className="font-mono bg-muted px-1 rounded text-[10px]">Enter</kbd> to select</span>
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/70 shrink-0">Command Palette</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
