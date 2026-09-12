import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HorizontalScrollContainer } from '@/components/ui/horizontal-scroll-container';
import {
  Search,
  X,
  Plus,
  Globe,
  Upload,
  Download,
  Filter,
  RotateCcw,
  MoreVertical,
  Trash,
  Sparkles,
  ChevronDown,
  Save,
  Undo2,
  Redo2,
  Command,
  Replace,
  Activity,
  BookOpen,
  FolderSync,
  Brain,
  Copy,
  Sliders,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedNamespace: string;
  onNamespaceChange: (ns: string) => void;
  namespaces: string[];
  activeFilter: 'all' | 'missing';
  onFilterChange: (f: 'all' | 'missing') => void;
  statusFilter?: 'all' | 'needs-review' | 'draft' | 'approved';
  onStatusFilterChange?: (status: 'all' | 'needs-review' | 'draft' | 'approved') => void;
  onOpenAddKey: () => void;
  onOpenAddLanguage: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onOpenSaveProject?: () => void;
  onResetToSample: () => void;
  onClearAll: () => void;
  hasItems: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onOpenAiTranslate?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenFindReplace?: () => void;
  onOpenScorecard?: () => void;
  onOpenLinter?: () => void;
  onOpenGlossary?: () => void;
  linkedFolderName?: string | null;
  onOpenFolderSync?: () => void;
  onOpenTranslationMemory?: () => void;
  onOpenDuplicateFinder?: () => void;
  onOpenIcuTester?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedNamespace,
  onNamespaceChange,
  namespaces,
  activeFilter,
  onFilterChange,
  statusFilter,
  onStatusFilterChange,
  onOpenAddKey,
  onOpenAddLanguage,
  onOpenImport,
  onOpenExport,
  onOpenSaveProject,
  onResetToSample,
  onClearAll,
  hasItems,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenAiTranslate,
  onOpenCommandPalette,
  onOpenFindReplace,
  onOpenScorecard,
  onOpenLinter,
  onOpenGlossary,
  linkedFolderName,
  onOpenFolderSync,
  onOpenTranslationMemory,
  onOpenDuplicateFinder,
  onOpenIcuTester,
}) => {
  // Local search query for zero-latency keystrokes + 150ms debounce to parent
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Clear any pending debounce on unmount so onSearchChange never fires on a dead component
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  const handleSearchInputChange = (val: string) => {
    setLocalSearch(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(val);
    }, 150);
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalSearch('');
    onSearchChange('');
  };

  return (
    <HorizontalScrollContainer
      gradientFrom="from-card"
      wrapperClassName="bg-card border-b border-border text-xs select-none shrink-0 h-9 min-h-[36px] max-h-[36px]"
      className="justify-between gap-1.5 sm:gap-2 px-2 sm:px-3 h-full min-w-full"
    >
      {/* Left: Search & Filter Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Compact Search Input with Zero-Latency Local State */}
        <div className="relative w-32 sm:w-44 lg:w-56 shrink-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          <Input
            value={localSearch}
            onChange={e => handleSearchInputChange(e.target.value)}
            placeholder="Search keys..."
            className="pl-7 pr-6 h-7 text-xs bg-background"
            disabled={!hasItems}
          />
          {localSearch && (
            <button
              onClick={handleClearSearch}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
            >
              <X className="size-2.5" />
            </button>
          )}
        </div>

        {/* Namespace Dropdown */}
        {hasItems && namespaces.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-1.5 sm:px-2 gap-1 text-[11px] font-normal shrink-0"
                title={`Filter by namespace — showing ${selectedNamespace === 'all' ? 'All Namespaces' : selectedNamespace}`}
              >
                <Filter className="size-3 text-muted-foreground" />
                <span className="max-w-[65px] sm:max-w-[85px] truncate">
                  {selectedNamespace === 'all' ? 'All Namespaces' : selectedNamespace}
                </span>
                <ChevronDown className="size-2.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 max-h-64 overflow-y-auto">
              <DropdownMenuLabel className="text-[11px]">Filter by Namespace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={selectedNamespace}
                onValueChange={onNamespaceChange}
              >
                <DropdownMenuRadioItem value="all" className="text-xs cursor-pointer">
                  All Namespaces
                </DropdownMenuRadioItem>
                {namespaces.map(ns => (
                  <DropdownMenuRadioItem
                    key={ns}
                    value={ns}
                    className="text-xs font-mono cursor-pointer"
                  >
                    {ns}.*
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Compact Filter Segmented Group */}
        {hasItems && (
          <div className="flex items-center rounded-md border border-border/80 p-0.5 bg-muted/60 h-7 shrink-0 shadow-2xs">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onFilterChange('missing')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                activeFilter === 'missing'
                  ? 'bg-amber-500 text-white dark:bg-amber-600 dark:text-amber-50 font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Missing
            </button>
          </div>
        )}

        {/* Review Status Filter */}
        {hasItems && onStatusFilterChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-1.5 sm:px-2 gap-1 text-[11px] font-normal shrink-0"
                title="Filter by review status"
              >
                <span className="hidden sm:inline text-muted-foreground">Status:</span>
                <span className="font-semibold text-foreground capitalize">
                  {statusFilter === 'needs-review' ? 'Review' : statusFilter || 'All'}
                </span>
                <ChevronDown className="size-2.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuLabel className="text-[11px]">Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={statusFilter || 'all'}
                onValueChange={v => onStatusFilterChange(v as any)}
              >
                <DropdownMenuRadioItem value="all" className="text-xs cursor-pointer">
                  All Statuses
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="needs-review"
                  className="text-xs cursor-pointer text-amber-600 dark:text-amber-400 font-medium"
                >
                  Needs Review
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="approved"
                  className="text-xs cursor-pointer text-emerald-600 dark:text-emerald-400 font-medium"
                >
                  Approved
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="draft" className="text-xs cursor-pointer">
                  Draft
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Right: Compact Action Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Undo & Redo */}
        <div className="flex items-center border-r border-border pr-1 mr-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="size-3" />
          </Button>
        </div>

        {/* AI Translate */}
        {onOpenAiTranslate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAiTranslate}
            disabled={!hasItems}
            className="gap-1 text-[11px] h-7 px-2 text-primary border-primary/30 hover:bg-primary/10 shadow-2xs font-semibold shrink-0"
            title="Auto-translate missing keys with AI (OpenRouter BYOK)"
          >
            <Sparkles className="size-3 text-primary" />
            <span className="hidden sm:inline">AI Translate</span>
            <span className="sm:hidden">AI</span>
          </Button>
        )}

        {/* Command Palette button - matching exact h-7 height */}
        {onOpenCommandPalette && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-1.5 h-7 px-2 text-[11px] font-normal text-muted-foreground hover:text-foreground shrink-0 shadow-2xs"
            title="Command Palette (Ctrl+K / Cmd+K)"
          >
            <Command className="size-3 text-muted-foreground" />
            <kbd className="font-mono text-[9px] bg-muted px-1 py-0.5 rounded border border-border">⌘K</kbd>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAddKey}
          className="gap-1 text-[11px] h-7 px-2 shrink-0"
        >
          <Plus className="size-3" />
          <span>Key</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAddLanguage}
          className="gap-1 text-[11px] h-7 px-2 shrink-0"
          disabled={!hasItems}
        >
          <Globe className="size-3" />
          <span className="hidden sm:inline">Lang</span>
        </Button>



        {onOpenFolderSync && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFolderSync}
            className={`gap-1 text-[11px] h-7 px-2 font-medium shrink-0 ${
              linkedFolderName
                ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15'
                : 'text-foreground'
            }`}
            title={linkedFolderName ? `Connected folder: ${linkedFolderName}` : 'Sync with local project folder'}
          >
            <FolderSync className={`size-3 ${linkedFolderName ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
            <span className="hidden sm:inline">
              {linkedFolderName ? `📁 ${linkedFolderName}` : 'Folder Sync'}
            </span>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenImport}
          className="gap-1 text-[11px] h-7 px-2 font-medium text-primary border-primary/30 hover:bg-primary/10 shrink-0"
        >
          <Upload className="size-3" />
          <span className="hidden sm:inline">Import</span>
        </Button>

        {onOpenSaveProject && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSaveProject}
            disabled={!hasItems}
            className="hidden md:flex gap-1 text-[11px] h-7 px-2 font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 shrink-0"
            title="Save complete project as .jsonlink"
          >
            <Save className="size-3" />
            <span>.jsonlink</span>
          </Button>
        )}

        <Button
          variant="default"
          size="sm"
          onClick={onOpenExport}
          disabled={!hasItems}
          className="gap-1 text-[11px] h-7 px-2 sm:px-2.5 font-semibold shadow-xs shrink-0"
        >
          <Download className="size-3" />
          <span>Export</span>
        </Button>

        {/* More Actions Custom Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 shrink-0">
              <MoreVertical className="size-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* Mobile shortcuts */}
            {onOpenCommandPalette && (
              <DropdownMenuItem onClick={onOpenCommandPalette} className="gap-2 cursor-pointer text-xs lg:hidden">
                <Command className="size-3.5 text-muted-foreground" />
                <span>Command Palette</span>
                <kbd className="ml-auto font-mono text-[9px] bg-muted px-1 py-0.5 rounded border border-border">⌘K</kbd>
              </DropdownMenuItem>
            )}
            {onOpenFindReplace && hasItems && (
              <DropdownMenuItem onClick={onOpenFindReplace} className="gap-2 cursor-pointer text-xs lg:hidden">
                <Replace className="size-3.5 text-blue-500" />
                <span>Find &amp; Replace</span>
                <kbd className="ml-auto font-mono text-[9px] bg-muted px-1 py-0.5 rounded border border-border">⌘H</kbd>
              </DropdownMenuItem>
            )}
            {onOpenScorecard && hasItems && (
              <DropdownMenuItem onClick={onOpenScorecard} className="gap-2 cursor-pointer text-xs lg:hidden">
                <Activity className="size-3.5 text-emerald-500" />
                <span>Localization Scorecard</span>
              </DropdownMenuItem>
            )}
            {onOpenLinter && hasItems && (
              <DropdownMenuItem onClick={onOpenLinter} className="gap-2 cursor-pointer text-xs lg:hidden">
                <Sparkles className="size-3.5 text-amber-500" />
                <span>QA Linter</span>
              </DropdownMenuItem>
            )}
            {onOpenGlossary && hasItems && (
              <DropdownMenuItem onClick={onOpenGlossary} className="gap-2 cursor-pointer text-xs xl:hidden">
                <BookOpen className="size-3.5 text-purple-500" />
                <span>Glossary &amp; Termbase</span>
              </DropdownMenuItem>
            )}
            {onOpenTranslationMemory && (
              <DropdownMenuItem onClick={onOpenTranslationMemory} className="gap-2 cursor-pointer text-xs">
                <Brain className="size-3.5 text-purple-500" />
                <span>Translation Memory (TM)</span>
              </DropdownMenuItem>
            )}
            {onOpenDuplicateFinder && hasItems && (
              <DropdownMenuItem onClick={onOpenDuplicateFinder} className="gap-2 cursor-pointer text-xs">
                <Copy className="size-3.5 text-amber-500" />
                <span>Duplicate Value Finder</span>
              </DropdownMenuItem>
            )}
            {onOpenIcuTester && (
              <DropdownMenuItem onClick={onOpenIcuTester} className="gap-2 cursor-pointer text-xs">
                <Sliders className="size-3.5 text-cyan-500" />
                <span>ICU Plural &amp; Variable Tester</span>
              </DropdownMenuItem>
            )}
            {onOpenSaveProject && (
              <DropdownMenuItem
                onClick={onOpenSaveProject}
                disabled={!hasItems}
                className="gap-2 cursor-pointer text-xs lg:hidden text-emerald-600 dark:text-emerald-400 focus:text-emerald-600"
              >
                <Save className="size-3.5" />
                <span>Save Project (.jsonlink)</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onOpenAddLanguage} disabled={!hasItems} className="gap-2 cursor-pointer text-xs lg:hidden">
              <Globe className="size-3.5" />
              <span>Add Language Column</span>
            </DropdownMenuItem>
            {((onOpenCommandPalette) || (onOpenSaveProject) || hasItems) && (
              <DropdownMenuSeparator className="lg:hidden" />
            )}

            <DropdownMenuLabel className="text-[11px]">Data Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={onResetToSample} className="gap-2 cursor-pointer text-xs">
              <Sparkles className="size-3.5" />
              Load Sample Data (32 keys)
            </DropdownMenuItem>
            {hasItems && (
              <>
                <DropdownMenuItem onClick={onResetToSample} className="gap-2 cursor-pointer text-xs">
                  <RotateCcw className="size-3.5" />
                  Reset to Sample
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onClearAll}
                  className="gap-2 text-destructive focus:text-destructive cursor-pointer text-xs"
                >
                  <Trash className="size-3.5" />
                  Clear All Rows
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </HorizontalScrollContainer>
  );
};
