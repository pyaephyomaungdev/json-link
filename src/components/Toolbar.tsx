import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  onOpenAddKey: () => void;
  onOpenAddLanguage: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onOpenSaveProject?: () => void;
  onResetToSample: () => void;
  onClearAll: () => void;
  hasItems: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedNamespace,
  onNamespaceChange,
  namespaces,
  activeFilter,
  onFilterChange,
  onOpenAddKey,
  onOpenAddLanguage,
  onOpenImport,
  onOpenExport,
  onOpenSaveProject,
  onResetToSample,
  onClearAll,
  hasItems,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-card border-b border-border text-xs select-none">
      {/* Search & Custom Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search keys, English, or မြန်မာ..."
            className="pl-8 pr-7 h-8 text-xs bg-background"
            disabled={!hasItems}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Custom Namespace Dropdown Menu (No Native Select) */}
        {hasItems && namespaces.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-normal"
              >
                <Filter className="size-3.5 text-muted-foreground" />
                <span>
                  {selectedNamespace === 'all'
                    ? 'All Namespaces'
                    : `Namespace: ${selectedNamespace}`}
                </span>
                <ChevronDown className="size-3 text-muted-foreground ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-72 overflow-y-auto">
              <DropdownMenuLabel>Filter by Namespace</DropdownMenuLabel>
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

        {/* Custom Filter Toggle Group */}
        {hasItems && (
          <div className="flex items-center rounded-md border border-border p-0.5 bg-muted/40">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Keys
            </button>
            <button
              onClick={() => onFilterChange('missing')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'missing'
                  ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Missing Only
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAddKey}
          className="gap-1.5 text-xs h-8"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Add</span> Key
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAddLanguage}
          className="gap-1.5 text-xs h-8"
          disabled={!hasItems}
        >
          <Globe className="size-3.5" />
          <span className="hidden sm:inline">Add</span> Language
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenImport}
          className="gap-1.5 text-xs h-8 font-medium text-primary border-primary/30 hover:bg-primary/10"
        >
          <Upload className="size-3.5" />
          Import
        </Button>

        {onOpenSaveProject && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSaveProject}
            disabled={!hasItems}
            className="gap-1.5 text-xs h-8 font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            title="Save complete project as .jsonlink"
          >
            <Save className="size-3.5" />
            <span className="hidden sm:inline">Save</span> .jsonlink
          </Button>
        )}

        <Button
          variant="default"
          size="sm"
          onClick={onOpenExport}
          disabled={!hasItems}
          className="gap-1.5 text-xs h-8 font-semibold shadow-xs"
        >
          <Download className="size-3.5" />
          Export
        </Button>

        {/* More Actions Custom Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVertical className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Data Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={onResetToSample} className="gap-2 cursor-pointer">
              <Sparkles className="size-3.5 text-primary" />
              Load Sample Data (30 keys)
            </DropdownMenuItem>
            {hasItems && (
              <>
                <DropdownMenuItem onClick={onResetToSample} className="gap-2 cursor-pointer">
                  <RotateCcw className="size-3.5 text-muted-foreground" />
                  Reset to Sample
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onClearAll}
                  className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash className="size-3.5" />
                  Clear All Rows
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
