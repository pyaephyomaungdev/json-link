import { useState, useMemo, useRef, useEffect } from 'react';
import { TranslationItem } from '@/types';
import { getInitialTranslations } from '@/data/sampleData';
import { Toolbar } from '@/components/Toolbar';
import { SpreadsheetTable } from '@/components/SpreadsheetTable';
import { AddKeyDialog } from '@/components/AddKeyDialog';
import { AddLanguageDialog } from '@/components/AddLanguageDialog';
import { ImportModal } from '@/components/ImportModal';
import { ExportModal } from '@/components/ExportModal';
import { ExitConfirmDialog } from '@/components/ExitConfirmDialog';
import { SaveProjectModal } from '@/components/SaveProjectModal';
import { Logo } from '@/components/Logo';
import { parseJsonFile, parseSpreadsheet, mergeTranslations } from '@/lib/parser';
import {
  Moon,
  Sun,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
  FileCode,
  Plus,
  AlertCircle,
  Key,
  Globe,
  CheckCircle2,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function App() {
  // Start with empty items by default as requested by user
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [languages, setLanguages] = useState<string[]>(['en', 'my']);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'missing'>('all');

  // Modal dialog states
  const [isAddKeyOpen, setIsAddKeyOpen] = useState(false);
  const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isSaveProjectOpen, setIsSaveProjectOpen] = useState(false);

  // Drag and drop state on hero empty area
  const [isHeroDragOver, setIsHeroDragOver] = useState(false);
  const mainFileInputRef = useRef<HTMLInputElement>(null);

  // Theme toggle state
  const [isDark, setIsDark] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Keep document element class in sync for class-based dark mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // When clicking logo, if user has data in table, prompt to save as .jsonlink
  const handleLogoClick = () => {
    if (items.length > 0) {
      setIsExitConfirmOpen(true);
    }
  };

  // Reset to empty home screen when exit confirmed
  const handleConfirmExit = () => {
    setItems([]);
    setSearchQuery('');
    setSelectedNamespace('all');
    setActiveFilter('all');
  };

  // Direct file drop handler on hero area
  const handleDirectFiles = async (fileList: FileList | File[]) => {
    let currentBaseItems = [...items];
    let currentBaseLanguages = [...languages];

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'json' || ext === 'jsonlink') {
          const text = await file.text();
          const parsed = parseJsonFile(text, file.name);
          const res = mergeTranslations(currentBaseItems, currentBaseLanguages, parsed);
          currentBaseItems = res.items;
          currentBaseLanguages = res.languages;
        } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
          const buffer = await file.arrayBuffer();
          const parsed = parseSpreadsheet(buffer);
          const res = mergeTranslations(
            currentBaseItems,
            currentBaseLanguages,
            parsed.languages.reduce((acc, lang) => {
              acc[lang] = {};
              for (const it of parsed.items) {
                acc[lang][it.key] = it[lang] || '';
              }
              return acc;
            }, {} as Record<string, Record<string, string>>)
          );
          currentBaseItems = res.items;
          currentBaseLanguages = res.languages;
        }
      }

      setItems(currentBaseItems);
      setLanguages(currentBaseLanguages);
    } catch (err: any) {
      alert(err?.message || 'Error parsing files');
    }
  };

  // Extract namespace list from keys (e.g., "auth", "home", "action", "site", "register")
  const namespaces = useMemo(() => {
    const nsSet = new Set<string>();
    for (const item of items) {
      if (item.key.includes('.')) {
        nsSet.add(item.key.split('.')[0]);
      } else {
        const match = item.key.match(/^([a-z]+)[A-Z]/);
        if (match && match[1].length >= 3) {
          nsSet.add(match[1]);
        }
      }
    }
    return Array.from(nsSet).sort();
  }, [items]);

  // Filtered items based on search, namespace, and missing filter
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return items.filter(item => {
      // Missing filter
      if (activeFilter === 'missing') {
        const hasMissing = languages.some(lang => !(item[lang] || '').trim());
        if (!hasMissing) return false;
      }

      // Namespace filter
      if (selectedNamespace !== 'all') {
        const matchesNamespace =
          item.key.startsWith(`${selectedNamespace}.`) ||
          item.key.startsWith(selectedNamespace);
        if (!matchesNamespace) return false;
      }

      // Search query across key and all language texts
      if (query) {
        const keyMatch = item.key.toLowerCase().includes(query);
        const valueMatch = languages.some(lang =>
          (item[lang] || '').toLowerCase().includes(query)
        );
        if (!keyMatch && !valueMatch) return false;
      }

      return true;
    });
  }, [items, languages, searchQuery, selectedNamespace, activeFilter]);

  // Handlers for cell editing
  const handleUpdateCell = (key: string, lang: string, value: string) => {
    setItems(prev =>
      prev.map(item => (item.key === key ? { ...item, [lang]: value } : item))
    );
  };

  const handleUpdateKey = (oldKey: string, newKey: string) => {
    setItems(prev =>
      prev.map(item => (item.key === oldKey ? { ...item, key: newKey } : item))
    );
  };

  const handleDeleteRow = (key: string) => {
    setItems(prev => prev.filter(item => item.key !== key));
  };

  const handleDuplicateRow = (item: TranslationItem) => {
    const newKey = `${item.key}_copy`;
    const duplicated: TranslationItem = { ...item, key: newKey };
    setItems(prev => [duplicated, ...prev]);
  };

  const handleDeleteLanguage = (langToDelete: string) => {
    if (languages.length <= 1) {
      alert('You must have at least one language column.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the column "${langToDelete.toUpperCase()}"?`)) {
      setLanguages(prev => prev.filter(l => l !== langToDelete));
      setItems(prev =>
        prev.map(item => {
          const updated = { ...item };
          delete updated[langToDelete];
          return updated;
        })
      );
    }
  };

  const handleAddKey = (newKey: string, values: Record<string, string>) => {
    const newItem: TranslationItem = { key: newKey };
    for (const lang of languages) {
      newItem[lang] = values[lang] || '';
    }
    setItems(prev => [newItem, ...prev]);
  };

  const handleAddLanguage = (langCode: string) => {
    if (!languages.includes(langCode)) {
      setLanguages(prev => [...prev, langCode]);
      setItems(prev =>
        prev.map(item => ({
          ...item,
          [langCode]: item[langCode] || '',
        }))
      );
    }
  };

  const handleImportComplete = (newItems: TranslationItem[], newLanguages: string[]) => {
    setItems(newItems);
    setLanguages(newLanguages);
  };

  const handleResetToSample = () => {
    const sample = getInitialTranslations();
    setItems(sample.items);
    setLanguages(sample.languages);
    setSearchQuery('');
    setSelectedNamespace('all');
    setActiveFilter('all');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all translation keys?')) {
      setItems([]);
    }
  };

  // Quick stats summary
  const totalKeys = items.length;
  const totalMissing = useMemo(() => {
    return items.filter(item => languages.some(l => !(item[l] || '').trim())).length;
  }, [items, languages]);

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground ${isDark ? 'dark' : ''}`}>
      {/* Top MS Excel Ribbon Header: Edge-to-edge */}
      <header className="border-b border-border bg-card px-4 h-12 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity text-left outline-none"
            title={items.length > 0 ? "Return to Home (with Save prompt)" : "JSON Link"}
          >
            <Logo size="md" />
            <span className="text-[10px] text-muted-foreground hidden lg:inline">
              — i18n Localization Spreadsheet
            </span>
          </button>

          {totalKeys > 0 && (
            <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-border text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Key className="size-3 text-primary" /> {totalKeys.toLocaleString()} keys
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Globe className="size-3 text-emerald-600" /> {languages.map(l => l.toUpperCase()).join(', ')}
              </span>
              {totalMissing > 0 ? (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <AlertCircle className="size-3" /> {totalMissing} missing
                  </span>
                </>
              ) : (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="size-3" /> 100% translated
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="size-7 rounded cursor-pointer"
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      {items.length === 0 ? (
        // Empty Upload View
        <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-xl w-full flex flex-col gap-5 my-auto">
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsHeroDragOver(true);
              }}
              onDragLeave={() => setIsHeroDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setIsHeroDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleDirectFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => mainFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 bg-card/60 ${
                isHeroDragOver
                  ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30 shadow-xs'
              }`}
            >
              <input
                type="file"
                ref={mainFileInputRef}
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleDirectFiles(e.target.files);
                  }
                }}
                multiple
                accept=".json,.jsonlink,.xlsx,.xls,.csv"
                className="hidden"
              />

              <div className="mb-2">
                <Logo size="lg" showText={false} />
              </div>

              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  Drop translation files here to open spreadsheet
                </h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
                  Upload multiple JSON files (e.g. <span className="font-mono text-primary font-semibold">en.json</span> & <span className="font-mono text-primary font-semibold">my.json</span>), <span className="font-mono text-emerald-600 font-semibold">.jsonlink</span> project, or an Excel file.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                <Button size="sm" className="gap-2 font-semibold shadow-xs">
                  <UploadCloud className="size-4" />
                  Browse Files
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    setIsAddKeyOpen(true);
                  }}
                  className="gap-1.5"
                >
                  <Plus className="size-4" />
                  Start Empty Sheet
                </Button>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border/60">
                <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <FileCode className="size-3.5" /> Project (.jsonlink)
                </span>
                <span className="flex items-center gap-1">
                  <FileCode className="size-3.5 text-primary" /> JSON (.json)
                </span>
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="size-3.5 text-emerald-600" /> Excel (.xlsx)
                </span>
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="size-3.5 text-blue-500" /> CSV (.csv)
                </span>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleResetToSample}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer underline underline-offset-4"
              >
                <Sparkles className="size-3 text-primary" />
                Or test with sample data (30 example keys)
              </button>
            </div>
          </div>

          {/* Footer with credit */}
          <footer className="py-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5 border-t border-border/40 w-full mt-auto">
            <span>Developed with</span>
            <Heart className="size-3 text-rose-500 fill-rose-500 inline" />
            <span>by</span>
            <span className="font-semibold text-foreground">Pyae Phyo Maung</span>
          </footer>
        </main>
      ) : (
        // Full-bleed MS Excel View: Zero outer padding, edge-to-edge spreadsheet!
        <div className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden">
          {/* Ribbon Toolbar: Flush edge-to-edge */}
          <Toolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedNamespace={selectedNamespace}
            onNamespaceChange={setSelectedNamespace}
            namespaces={namespaces}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onOpenAddKey={() => setIsAddKeyOpen(true)}
            onOpenAddLanguage={() => setIsAddLanguageOpen(true)}
            onOpenImport={() => setIsImportOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
            onOpenSaveProject={() => setIsSaveProjectOpen(true)}
            onResetToSample={handleResetToSample}
            onClearAll={handleClearAll}
            hasItems={items.length > 0}
          />

          {/* Full-bleed Edge-to-Edge Spreadsheet (Zero side paddings, full screen grid) */}
          <SpreadsheetTable
            items={filteredItems}
            languages={languages}
            onUpdateCell={handleUpdateCell}
            onUpdateKey={handleUpdateKey}
            onDeleteRow={handleDeleteRow}
            onDuplicateRow={handleDuplicateRow}
            onDeleteLanguage={handleDeleteLanguage}
            onAddRow={() => setIsAddKeyOpen(true)}
            onOpenImport={() => setIsImportOpen(true)}
          />
        </div>
      )}

      {/* Modals & Dialogs */}
      <AddKeyDialog
        open={isAddKeyOpen}
        onOpenChange={setIsAddKeyOpen}
        languages={languages}
        onAddKey={handleAddKey}
        existingKeys={items.map(i => i.key)}
      />

      <AddLanguageDialog
        open={isAddLanguageOpen}
        onOpenChange={setIsAddLanguageOpen}
        existingLanguages={languages}
        onAddLanguage={handleAddLanguage}
      />

      <ImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        currentItems={items}
        currentLanguages={languages}
        onImportComplete={handleImportComplete}
      />

      <ExportModal
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        items={items}
        languages={languages}
      />

      <ExitConfirmDialog
        open={isExitConfirmOpen}
        onOpenChange={setIsExitConfirmOpen}
        items={items}
        languages={languages}
        onConfirmExit={handleConfirmExit}
      />

      <SaveProjectModal
        open={isSaveProjectOpen}
        onOpenChange={setIsSaveProjectOpen}
        items={items}
        languages={languages}
      />
    </div>
  );
}

export default App;
