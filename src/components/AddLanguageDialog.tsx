import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Globe,
  Search,
  ChevronDown,
  Check,
  Sparkles,
  X,
  Plus,
} from 'lucide-react';
import { ISO_LANGUAGES, LanguageDefinition } from '@/data/languages';

interface AddLanguageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingLanguages: string[];
  onAddLanguage: (langCode: string) => void;
}

const POPULAR_QUICK_LANGUAGES = [
  { code: 'th', label: 'Thai (ภาษาไทย)' },
  { code: 'ja', label: 'Japanese (日本語)' },
  { code: 'zh', label: 'Chinese (中文)' },
  { code: 'ko', label: 'Korean (한국어)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'vi', label: 'Vietnamese (Tiếng Việt)' },
  { code: 'id', label: 'Indonesian (Bahasa Indonesia)' },
  { code: 'my', label: 'Myanmar (မြန်မာ)' },
];

export const AddLanguageDialog: React.FC<AddLanguageDialogProps> = ({
  open,
  onOpenChange,
  existingLanguages,
  onAddLanguage,
}) => {
  const [selectedLang, setSelectedLang] = useState<LanguageDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedLang(null);
      setSearchQuery('');
      setCustomCode('');
      setError(null);
      setIsCustomMode(false);
      setIsDropdownOpen(false);
    }
  }, [open]);

  // Filter languages by English name, native name, or ISO code
  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ISO_LANGUAGES;
    return ISO_LANGUAGES.filter(
      l =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        (l.region && l.region.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const handleSubmit = (code: string) => {
    const clean = code.trim().toLowerCase();
    if (!clean) {
      setError('Please select or enter a language code.');
      return;
    }

    if (existingLanguages.includes(clean)) {
      setError(`Language "${clean.toUpperCase()}" is already added to your spreadsheet.`);
      return;
    }

    onAddLanguage(clean);
    setSelectedLang(null);
    setCustomCode('');
    setError(null);
    onOpenChange(false);
  };

  const handleAddSelected = () => {
    if (isCustomMode) {
      handleSubmit(customCode);
    } else if (selectedLang) {
      handleSubmit(selectedLang.code);
    } else {
      setError('Please choose a language from the dropdown.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Globe className="size-5" />
            </div>
            <DialogTitle className="text-base text-foreground">
              Add New Language Column
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Choose from standard world languages with native scripts, or search by language name.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1 text-xs">
          {/* Main Language Picker: Searchable Dropdown or Custom Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="size-3.5 text-primary" />
                Select Language
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomMode(!isCustomMode);
                  setError(null);
                }}
                className="text-[11px] text-primary hover:underline cursor-pointer flex items-center gap-1 font-medium"
              >
                <Sparkles className="size-3" />
                {isCustomMode ? 'Use Language Dropdown' : 'Enter Custom Code'}
              </button>
            </div>

            {isCustomMode ? (
              <div className="flex gap-2">
                <Input
                  value={customCode}
                  onChange={e => {
                    setCustomCode(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit(customCode);
                    }
                  }}
                  placeholder="e.g. th, ja, ko, fr, de, my..."
                  className="h-8 text-xs font-mono uppercase"
                  autoFocus
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSubmit(customCode)}
                  className="h-8 px-4 text-xs font-semibold"
                >
                  Add
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                {/* Searchable Dropdown Action Menu */}
                <div className="flex-1 min-w-0">
                  <DropdownMenu
                    open={isDropdownOpen}
                    onOpenChange={open => {
                      setIsDropdownOpen(open);
                      if (!open) setSearchQuery('');
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex-1 h-8 px-2.5 bg-background border border-border rounded-md text-xs text-foreground flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors shadow-2xs w-full"
                      >
                        {selectedLang ? (
                          <span className="flex items-center gap-2 truncate">
                            <strong className="font-mono text-primary font-bold">
                              {selectedLang.code.toUpperCase()}
                            </strong>
                            <span className="text-foreground">{selectedLang.name}</span>
                            <span className="text-muted-foreground font-normal">
                              ({selectedLang.nativeName})
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center gap-2 truncate">
                            Search and select language...
                          </span>
                        )}
                        <ChevronDown className="size-3.5 text-muted-foreground shrink-0 ml-2" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[280px] sm:min-w-[340px] max-w-[calc(100vw-2rem)] max-h-80 overflow-hidden flex flex-col p-0"
                    >
                      {/* Search Header inside Dropdown Menu */}
                      <div
                        className="p-2 border-b border-border bg-popover sticky top-0 z-10 shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="relative flex items-center">
                          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.stopPropagation()}
                            placeholder="Type language name, native script or code..."
                            className="w-full h-7 pl-8 pr-7 bg-background border border-border rounded text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                            autoFocus
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                            >
                              <X className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Scrollable Language Items */}
                      <div className="overflow-y-auto max-h-64 p-1 divide-y divide-border/20">
                        {/* Custom code option if typed code doesn't exist */}
                        {searchQuery.trim() &&
                          !ISO_LANGUAGES.some(
                            l => l.code.toLowerCase() === searchQuery.trim().toLowerCase()
                          ) && (
                            <DropdownMenuItem
                              onClick={() => {
                                handleSubmit(searchQuery.trim());
                              }}
                              className="flex items-center gap-2 p-2 cursor-pointer text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded mb-1 border border-dashed border-primary/40"
                            >
                              <Sparkles className="size-3.5 text-primary shrink-0" />
                              <div className="truncate min-w-0">
                                <span className="text-[11px] text-muted-foreground">Add custom code:</span>{' '}
                                <span className="font-mono font-bold text-primary underline uppercase">
                                  {searchQuery.trim()}
                                </span>
                              </div>
                            </DropdownMenuItem>
                          )}

                        {filteredLanguages.length === 0 ? (
                          <div className="py-6 text-center text-xs text-muted-foreground">
                            No languages matching "{searchQuery}".
                          </div>
                        ) : (
                          filteredLanguages.map(l => {
                            const isExisting = existingLanguages.includes(l.code.toLowerCase());
                            const isSelected = selectedLang?.code.toLowerCase() === l.code.toLowerCase();

                            return (
                              <DropdownMenuItem
                                key={l.code}
                                disabled={isExisting}
                                onClick={() => {
                                  if (!isExisting) {
                                    setSelectedLang(l);
                                    setIsDropdownOpen(false);
                                    setError(null);
                                  }
                                }}
                                className={`flex items-center justify-between gap-2 p-2 text-xs rounded transition-colors ${
                                  isExisting
                                    ? 'opacity-40 cursor-not-allowed bg-muted/20'
                                    : 'cursor-pointer hover:bg-accent'
                                } ${isSelected ? 'bg-primary/10 font-medium' : ''}`}
                              >
                                <div className="min-w-0 flex-1 flex items-baseline gap-2">
                                  <span className="font-medium text-foreground">{l.name}</span>
                                  <span className="text-muted-foreground text-[11px] truncate">
                                    ({l.nativeName})
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="font-mono text-[10px] uppercase bg-muted text-muted-foreground font-bold px-1.5 py-0.5 rounded border border-border/50">
                                    {l.code}
                                  </span>
                                  {isExisting && (
                                    <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      Added
                                    </span>
                                  )}
                                  {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                                </div>
                              </DropdownMenuItem>
                            );
                          })
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Button
                  onClick={handleAddSelected}
                  disabled={!selectedLang}
                  className="h-9 px-4 gap-1.5 shadow-xs font-semibold shrink-0 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </div>
            )}

            {error && <span className="text-xs text-destructive font-medium mt-0.5">{error}</span>}
          </div>

          {/* Quick 1-Click Popular Languages */}
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <div className="text-[11px] font-semibold text-muted-foreground">
              Or quick-add popular languages:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_QUICK_LANGUAGES.map(l => {
                const isExisting = existingLanguages.includes(l.code);

                return (
                  <button
                    key={l.code}
                    type="button"
                    disabled={isExisting}
                    onClick={() => handleSubmit(l.code)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-left text-xs transition-colors ${
                      isExisting
                        ? 'border-border/40 bg-muted/20 opacity-50 cursor-not-allowed text-muted-foreground'
                        : 'border-border hover:bg-accent hover:border-primary/40 cursor-pointer text-foreground'
                    }`}
                  >
                    <span className="font-medium truncate">{l.label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded shrink-0 ml-1.5 font-bold">
                      {isExisting ? '✓' : l.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
