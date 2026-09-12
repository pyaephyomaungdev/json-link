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
  AlertCircle,
  BookOpen,
  FolderSync,
  Brain,
  Copy,
  Sliders,
  Share2,
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
  onOpenShare?: () => void;
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
  onOpenShare,
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
        <div className="relative w-28 sm:w-44 lg:w-56 shrink-0 transition-all focus-within:w-36 sm:focus-within:w-44 lg:focus-within:w-56">
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
      {/* Right: Compact Action Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Undo & Redo (hidden on mobile to conserve space) */}
        <div className="hidden sm:flex items-center border-r border-border pr-1 mr-0.5">
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

        {/* Local Grid Actions: + Key and + Lang */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAddKey}
          className="gap-1 text-[11px] h-7 px-2 shrink-0 font-medium cursor-pointer"
          title="Add New Translation Key"
        >
          <Plus className="size-3" />
          <span>Key</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAddLanguage}
          className="hidden sm:inline-flex gap-1 text-[11px] h-7 px-2 shrink-0 font-medium cursor-pointer"
          title="Add New Language Column"
        >
          <Globe className="size-3" />
          <span className="hidden sm:inline">Lang</span>
        </Button>

        {/* 1. Translate Dropdown: Desktop (xl+) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden xl:inline-flex gap-1 text-[11px] h-7 px-2 font-medium shrink-0 shadow-2xs cursor-pointer"
            >
              <Sparkles className="size-3 text-primary" />
              <span>Translate</span>
              <ChevronDown className="size-2.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-[11px]">Translation Tools</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {onOpenAiTranslate && (
              <DropdownMenuItem
                onClick={onOpenAiTranslate}
                disabled={!hasItems}
                className="gap-2 cursor-pointer text-xs"
              >
                <Sparkles className="size-3.5 text-primary" />
                <div className="flex flex-col">
                  <span className="font-semibold">AI Auto-Translate</span>
                  <span className="text-[10px] text-muted-foreground">Translate missing keys (OpenRouter)</span>
                </div>
              </DropdownMenuItem>
            )}
            {onOpenTranslationMemory && (
              <DropdownMenuItem
                onClick={onOpenTranslationMemory}
                className="gap-2 cursor-pointer text-xs"
              >
                <Brain className="size-3.5 text-purple-500" />
                <div className="flex flex-col">
                  <span className="font-semibold">Translation Memory</span>
                  <span className="text-[10px] text-muted-foreground">Reuse cached phrases &amp; save tokens</span>
                </div>
              </DropdownMenuItem>
            )}
            {onOpenGlossary && hasItems && (
              <DropdownMenuItem
                onClick={onOpenGlossary}
                className="gap-2 cursor-pointer text-xs"
              >
                <BookOpen className="size-3.5 text-blue-500" />
                <div className="flex flex-col">
                  <span className="font-semibold">Glossary &amp; Termbase</span>
                  <span className="text-[10px] text-muted-foreground">Enforce brand terminology rules</span>
                </div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 2. File Dropdown: Desktop (xl+) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`hidden xl:inline-flex gap-1 text-[11px] h-7 px-2 font-medium shrink-0 shadow-2xs cursor-pointer ${
                linkedFolderName
                  ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                  : ''
              }`}
            >
              <Upload className="size-3 text-muted-foreground" />
              <span>{linkedFolderName ? `📁 Sync` : 'File'}</span>
              <ChevronDown className="size-2.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-[11px]">File Operations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenImport} className="gap-2 cursor-pointer text-xs">
              <Upload className="size-3.5 text-primary" />
              <div className="flex flex-col">
                <span className="font-semibold">Import Files</span>
                <span className="text-[10px] text-muted-foreground">JSON, Excel, CSV, YAML, ARB, XML...</span>
              </div>
            </DropdownMenuItem>
            {onOpenFolderSync && (
              <DropdownMenuItem onClick={onOpenFolderSync} className="gap-2 cursor-pointer text-xs">
                <FolderSync className="size-3.5 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="font-semibold">Local Folder Sync</span>
                  <span className="text-[10px] text-muted-foreground">
                    {linkedFolderName ? `Connected: ${linkedFolderName}` : 'Direct read/write with hard drive'}
                  </span>
                </div>
              </DropdownMenuItem>
            )}
            {onOpenSaveProject && (
              <DropdownMenuItem
                onClick={onOpenSaveProject}
                disabled={!hasItems}
                className="gap-2 cursor-pointer text-xs"
              >
                <Save className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <div className="flex flex-col">
                  <span className="font-semibold">Save Project (.jsonlink)</span>
                  <span className="text-[10px] text-muted-foreground">Standalone complete project backup</span>
                </div>
              </DropdownMenuItem>
            )}
            {onOpenShare && (
              <DropdownMenuItem
                onClick={onOpenShare}
                disabled={!hasItems}
                className="gap-2 cursor-pointer text-xs"
              >
                <Share2 className="size-3.5 text-blue-500" />
                <div className="flex flex-col">
                  <span className="font-semibold">Share &amp; Handoff</span>
                  <span className="text-[10px] text-muted-foreground">Instant URL link or .jsonlink package</span>
                </div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 3. Tools / Utilities Dropdown: Desktop (xl+) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden xl:inline-flex gap-1 text-[11px] h-7 px-2 font-medium shrink-0 shadow-2xs cursor-pointer"
              title="Tools &amp; Utilities"
            >
              <MoreVertical className="size-3 text-muted-foreground" />
              <span className="hidden md:inline">Tools</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-[11px]">Quality Suite</DropdownMenuLabel>
            {onOpenScorecard && (
              <DropdownMenuItem onClick={onOpenScorecard} className="gap-2 cursor-pointer text-xs">
                <Activity className="size-3.5 text-blue-500" />
                <span>Quality Scorecard</span>
              </DropdownMenuItem>
            )}
            {onOpenLinter && (
              <DropdownMenuItem onClick={onOpenLinter} className="gap-2 cursor-pointer text-xs">
                <AlertCircle className="size-3.5 text-amber-500" />
                <span>QA &amp; Consistency Linter</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px]">Tools &amp; Utilities</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {onOpenFindReplace && hasItems && (
              <DropdownMenuItem onClick={onOpenFindReplace} className="gap-2 cursor-pointer text-xs">
                <Replace className="size-3.5 text-blue-500" />
                <span>Find &amp; Replace</span>
                <kbd className="ml-auto font-mono text-[9px] bg-muted px-1 py-0.5 rounded border border-border">⌘H</kbd>
              </DropdownMenuItem>
            )}
            {onOpenIcuTester && (
              <DropdownMenuItem onClick={onOpenIcuTester} className="gap-2 cursor-pointer text-xs">
                <Sliders className="size-3.5 text-cyan-500" />
                <span>ICU Message Tester</span>
              </DropdownMenuItem>
            )}
            {onOpenDuplicateFinder && hasItems && (
              <DropdownMenuItem onClick={onOpenDuplicateFinder} className="gap-2 cursor-pointer text-xs">
                <Copy className="size-3.5 text-amber-500" />
                <span>Duplicate Value Finder</span>
              </DropdownMenuItem>
            )}
            {onOpenCommandPalette && (
              <DropdownMenuItem onClick={onOpenCommandPalette} className="gap-2 cursor-pointer text-xs">
                <Command className="size-3.5 text-muted-foreground" />
                <span>Command Palette</span>
                <kbd className="ml-auto font-mono text-[9px] bg-muted px-1 py-0.5 rounded border border-border">⌘K</kbd>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px]">Workspace</DropdownMenuLabel>
            <DropdownMenuItem onClick={onResetToSample} className="gap-2 cursor-pointer text-xs">
              <RotateCcw className="size-3.5 text-muted-foreground" />
              <span>Reset to Sample (32 keys)</span>
            </DropdownMenuItem>
            {hasItems && (
              <DropdownMenuItem
                onClick={onClearAll}
                className="gap-2 text-destructive focus:text-destructive cursor-pointer text-xs"
              >
                <Trash className="size-3.5" />
                <span>Clear All Keys</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Unified Responsive 'More' Action Menu for Tablet & Mobile (viewports < xl) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-[11px] h-7 px-2 font-medium shrink-0 shadow-2xs cursor-pointer inline-flex xl:hidden"
              title="More tools and actions"
            >
              <Sliders className="size-3 text-muted-foreground" />
              <span>More</span>
              <ChevronDown className="size-2.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 max-h-[85vh] overflow-y-auto">
            <DropdownMenuLabel className="text-[11px]">Translation &amp; AI</DropdownMenuLabel>
            {onOpenAiTranslate && (
              <DropdownMenuItem
                onClick={onOpenAiTranslate}
                disabled={!hasItems}
                className="gap-2 cursor-pointer text-xs"
              >
                <Sparkles className="size-3.5 text-primary" />
                <span>AI Auto-Translate</span>
              </DropdownMenuItem>
            )}
            {onOpenTranslationMemory && (
              <DropdownMenuItem
                onClick={onOpenTranslationMemory}
                className="gap-2 cursor-pointer text-xs"
              >
                <Brain className="size-3.5 text-purple-500" />
                <span>Translation Memory</span>
              </DropdownMenuItem>
            )}
            {onOpenGlossary && (
              <DropdownMenuItem
                onClick={onOpenGlossary}
                disabled={!hasItems}
                className="gap-2 cursor-pointer text-xs"
              >
                <BookOpen className="size-3.5 text-blue-500" />
                <span>Glossary &amp; Termbase</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px]">File &amp; Project</DropdownMenuLabel>
            <DropdownMenuItem onClick={onOpenImport} className="gap-2 cursor-pointer text-xs">
              <Upload className="size-3.5 text-primary" />
              <span>Import Files</span>
            </DropdownMenuItem>
            {onOpenFolderSync && (
              <DropdownMenuItem onClick={onOpenFolderSync} className="gap-2 cursor-pointer text-xs">
                <FolderSync className="size-3.5 text-emerald-500" />
                <span>Local Folder Sync</span>
              </DropdownMenuItem>
            )}
            {onOpenSaveProject && (
              <DropdownMenuItem
                onClick={onOpenSaveProject}
                disabled={!hasItems}
                className="gap-2 cursor-pointer text-xs"
              >
                <Save className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Save Project (.jsonlink)</span>
              </DropdownMenuItem>
            )}
            {onOpenShare && (
              <DropdownMenuItem
                onClick={onOpenShare}
                disabled={!hasItems}
                className="gap-2 cursor-pointer text-xs"
              >
                <Share2 className="size-3.5 text-blue-500" />
                <span>Share &amp; Handoff</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onOpenAddLanguage} className="gap-2 cursor-pointer text-xs sm:hidden">
              <Globe className="size-3.5 text-emerald-600" />
              <span>Add Language Column</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px]">Quality Suite &amp; Tools</DropdownMenuLabel>
            {onOpenScorecard && (
              <DropdownMenuItem onClick={onOpenScorecard} className="gap-2 cursor-pointer text-xs">
                <Activity className="size-3.5 text-blue-500" />
                <span>Quality Scorecard</span>
              </DropdownMenuItem>
            )}
            {onOpenLinter && (
              <DropdownMenuItem onClick={onOpenLinter} className="gap-2 cursor-pointer text-xs">
                <AlertCircle className="size-3.5 text-amber-500" />
                <span>QA &amp; Consistency Linter</span>
              </DropdownMenuItem>
            )}
            {onOpenFindReplace && (
              <DropdownMenuItem
                onClick={onOpenFindReplace}
                disabled={!hasItems}
                className="gap-2 cursor-pointer text-xs"
              >
                <Replace className="size-3.5 text-blue-500" />
                <span>Find &amp; Replace</span>
              </DropdownMenuItem>
            )}
            {onOpenIcuTester && (
              <DropdownMenuItem onClick={onOpenIcuTester} className="gap-2 cursor-pointer text-xs">
                <Sliders className="size-3.5 text-cyan-500" />
                <span>ICU Message Tester</span>
              </DropdownMenuItem>
            )}
            {onOpenDuplicateFinder && (
              <DropdownMenuItem
                onClick={onOpenDuplicateFinder}
                disabled={!hasItems}
                className="gap-2 cursor-pointer text-xs"
              >
                <Copy className="size-3.5 text-amber-500" />
                <span>Duplicate Finder</span>
              </DropdownMenuItem>
            )}
            {onOpenCommandPalette && (
              <DropdownMenuItem onClick={onOpenCommandPalette} className="gap-2 cursor-pointer text-xs">
                <Command className="size-3.5 text-muted-foreground" />
                <span>Command Palette</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px]">Workspace</DropdownMenuLabel>
            <DropdownMenuItem onClick={onResetToSample} className="gap-2 cursor-pointer text-xs">
              <RotateCcw className="size-3.5 text-muted-foreground" />
              <span>Reset to Sample</span>
            </DropdownMenuItem>
            {hasItems && (
              <DropdownMenuItem
                onClick={onClearAll}
                className="gap-2 text-destructive focus:text-destructive cursor-pointer text-xs"
              >
                <Trash className="size-3.5" />
                <span>Clear All Keys</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Share Button (Desktop & Tablet) */}
        {onOpenShare && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenShare}
            disabled={!hasItems}
            className="hidden sm:inline-flex gap-1.5 text-xs h-7 px-2.5 font-medium shadow-2xs shrink-0 cursor-pointer"
            title="Share & Handoff Workspace"
          >
            <Share2 className="size-3 text-muted-foreground" />
            <span>Share</span>
          </Button>
        )}

        {/* 4. Export Translations — The Single Primary CTA Button */}
        <Button
          variant="default"
          size="sm"
          onClick={onOpenExport}
          disabled={!hasItems}
          className="gap-1.5 text-xs h-7 px-3 font-semibold shadow-xs shrink-0 cursor-pointer"
        >
          <Download className="size-3.5" />
          <span>Export</span>
        </Button>
      </div>
    </HorizontalScrollContainer>
  );
};
