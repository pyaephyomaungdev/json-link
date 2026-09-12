import { useState, useMemo } from 'react';
import { TranslationItem, RowStatus } from '@/types';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Key,
  Search,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TreeNode {
  name: string;
  fullPath: string;
  isLeaf: boolean;
  children: Map<string, TreeNode>;
  item?: TranslationItem;
}

interface TreeViewProps {
  items: TranslationItem[];
  languages: string[];
  onUpdateCell: (key: string, lang: string, val: string) => void;
  onUpdateStatus?: (key: string, status: RowStatus) => void;
  onUpdateDescription?: (key: string, desc: string) => void;
}

export function TreeView({
  items,
  languages,
  onUpdateCell,
  onUpdateStatus,
  onUpdateDescription,
}: TreeViewProps) {
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(() => items[0]?.key || null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Auto-expand first level namespaces
    items.forEach(i => {
      const parts = i.key.split('.');
      if (parts.length > 1) initial.add(parts[0]);
    });
    return initial;
  });

  // Build tree from items
  const rootNode = useMemo(() => {
    const root: TreeNode = {
      name: 'root',
      fullPath: '',
      isLeaf: false,
      children: new Map(),
    };

    for (const item of items) {
      const parts = item.key.split('.');
      let current = root;
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}.${part}` : part;
        const isLeaf = i === parts.length - 1;

        if (!current.children.has(part)) {
          current.children.set(part, {
            name: part,
            fullPath: currentPath,
            isLeaf,
            children: new Map(),
            item: isLeaf ? item : undefined,
          });
        }
        current = current.children.get(part)!;
      }
    }

    return root;
  }, [items]);

  const selectedItem = useMemo(() => {
    return items.find(i => i.key === selectedKey) || null;
  }, [items, selectedKey]);

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    items.forEach(item => {
      const parts = item.key.split('.');
      let p = '';
      for (let i = 0; i < parts.length - 1; i++) {
        p = p ? `${p}.${parts[i]}` : parts[i];
        all.add(p);
      }
    });
    setExpandedPaths(all);
  };

  const collapseAll = () => {
    setExpandedPaths(new Set());
  };

  // Render recursive tree node
  const renderNode = (node: TreeNode, depth = 0) => {
    const hasChildren = node.children.size > 0;
    const isExpanded = expandedPaths.has(node.fullPath);
    const isSelected = selectedKey === node.fullPath;

    // Filter check
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchesSelf = node.fullPath.toLowerCase().includes(q);
      const matchesDescendant = Array.from(node.children.values()).some(c =>
        c.fullPath.toLowerCase().includes(q)
      );
      if (!matchesSelf && !matchesDescendant && !node.item) return null;
    }

    return (
      <div key={node.fullPath} className="select-none">
        <div
          onClick={() => {
            if (hasChildren) {
              toggleExpand(node.fullPath);
            }
            if (node.isLeaf) {
              setSelectedKey(node.fullPath);
            }
          }}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors text-xs ${
            isSelected
              ? 'bg-primary text-primary-foreground font-semibold'
              : 'hover:bg-muted/50 text-foreground'
          }`}
        >
          {hasChildren ? (
            <span className="size-4 flex items-center justify-center text-muted-foreground">
              {isExpanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
            </span>
          ) : (
            <span className="size-4 flex items-center justify-center text-muted-foreground/60">
              <Key className="size-3" />
            </span>
          )}

          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="size-3.5 text-amber-500 shrink-0" />
            ) : (
              <Folder className="size-3.5 text-amber-500 shrink-0" />
            )
          ) : null}

          <span className="truncate flex-1 font-mono text-[11px]">{node.name}</span>

          {hasChildren && (
            <span className="text-[10px] font-mono opacity-60 bg-muted/60 px-1 rounded">
              {node.children.size}
            </span>
          )}

          {node.item && (
            <span className="size-2 rounded-full shrink-0">
              {node.item.status === 'approved' && (
                <span className="size-1.5 rounded-full bg-emerald-500 block" />
              )}
              {node.item.status === 'needs-review' && (
                <span className="size-1.5 rounded-full bg-amber-500 block" />
              )}
              {(!node.item.status || node.item.status === 'draft') && (
                <span className="size-1.5 rounded-full bg-muted-foreground/40 block" />
              )}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {Array.from(node.children.values()).map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col sm:flex-row overflow-hidden border border-border rounded-xl bg-card shadow-xs min-h-[500px]">
      {/* Left Sidebar: Tree Navigation */}
      <div className="w-full sm:w-72 md:w-80 border-b sm:border-b-0 sm:border-r border-border flex flex-col shrink-0 bg-muted/10">
        {/* Search & Collapse Controls */}
        <div className="p-2.5 border-b border-border/80 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search keys in tree..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-muted/40 border border-border rounded-md outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
            <span>{items.length} total keys</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={expandAll}
                className="hover:text-foreground cursor-pointer transition-colors"
              >
                Expand
              </button>
              <span>•</span>
              <button
                onClick={collapseAll}
                className="hover:text-foreground cursor-pointer transition-colors"
              >
                Collapse
              </button>
            </div>
          </div>
        </div>

        {/* Tree Nodes List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 max-h-[260px] sm:max-h-none">
          {Array.from(rootNode.children.values()).map(child => renderNode(child, 0))}
        </div>
      </div>

      {/* Right Pane: Translation Details Editor */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 bg-background space-y-5">
        {selectedItem ? (
          <div className="max-w-2xl space-y-4">
            {/* Header info */}
            <div className="p-3 rounded-lg border border-border bg-card shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-foreground break-all">
                  {selectedItem.key}
                </span>

                {/* Status Switcher */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onUpdateStatus?.(selectedItem.key, 'approved')}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 cursor-pointer transition-colors ${
                      selectedItem.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-muted/40 text-muted-foreground border-transparent hover:border-border'
                    }`}
                  >
                    <CheckCircle2 className="size-2.5" />
                    <span>Approved</span>
                  </button>

                  <button
                    onClick={() => onUpdateStatus?.(selectedItem.key, 'needs-review')}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 cursor-pointer transition-colors ${
                      selectedItem.status === 'needs-review'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                        : 'bg-muted/40 text-muted-foreground border-transparent hover:border-border'
                    }`}
                  >
                    <Clock className="size-2.5" />
                    <span>Needs Review</span>
                  </button>
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Context / Developer Notes:
                </span>
                <input
                  type="text"
                  value={selectedItem.description || ''}
                  onChange={e => onUpdateDescription?.(selectedItem.key, e.target.value)}
                  placeholder="Add note for translators..."
                  className="w-full px-2.5 py-1 text-xs bg-muted/20 border border-border rounded outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Language Inputs */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Translations Across Languages
              </h3>

              {languages.map(lang => {
                const val = selectedItem[lang] || '';
                return (
                  <div key={lang} className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-xs uppercase">
                        {lang}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {val.length} chars
                      </span>
                    </div>

                    <textarea
                      rows={2}
                      value={val}
                      onChange={e => onUpdateCell(selectedItem.key, lang, e.target.value)}
                      placeholder={`Enter translation in [${lang}]...`}
                      className="w-full p-2 text-xs bg-muted/20 border border-border rounded-md outline-none focus:border-primary resize-y font-sans leading-relaxed"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-2">
            <Layers className="size-8 text-muted-foreground/50 mb-1" />
            <p className="text-xs font-semibold text-foreground">Select a Key</p>
            <p className="text-[11px] max-w-xs">
              Click any key in the left tree hierarchy to edit its translations and review status.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
