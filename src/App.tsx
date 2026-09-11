import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { TranslationItem, RowStatus } from '@/types';
import { getInitialTranslations } from '@/data/sampleData';
import { Toolbar } from '@/components/Toolbar';
import { SpreadsheetTable } from '@/components/SpreadsheetTable';
import { AddKeyDialog } from '@/components/AddKeyDialog';
import { AddLanguageDialog } from '@/components/AddLanguageDialog';
import { ImportModal } from '@/components/ImportModal';
import { ExportModal } from '@/components/ExportModal';
import { ExitConfirmDialog } from '@/components/ExitConfirmDialog';
import { SaveProjectModal } from '@/components/SaveProjectModal';
import { AiTranslateModal } from '@/components/AiTranslateModal';
import { FindReplaceModal } from '@/components/FindReplaceModal';
import { ScorecardModal } from '@/components/ScorecardModal';
import { GlossaryModal } from '@/components/GlossaryModal';
import { LinterModal } from '@/components/LinterModal';
import { DocsPage } from '@/components/DocsPage';
import { CommandPalette, CommandItem } from '@/components/CommandPalette';
import { DiffMergeModal, DiffResult } from '@/components/DiffMergeModal';
import { ConfirmDialog, ConfirmDialogConfig } from '@/components/ConfirmDialog';
import { AboutPage } from '@/components/AboutPage';
import { NotFoundPage } from '@/components/NotFoundPage';
import { Logo } from '@/components/Logo';
import { runLocalizationLinter } from '@/lib/linter';
import { isEffectivelyMissing } from '@/lib/variables';
import {
  parseJsonFile,
  parseSpreadsheet,
  parseAndroidXml,
  parseIosStrings,
  parseYamlFile,
  parseArbFile,
  mergeTranslations,
} from '@/lib/parser';
import { generatePseudoLocaleRecords } from '@/lib/pseudoloc';
import { loadLocalDraft, saveLocalDraft, clearLocalDraft, parseProjectFile } from '@/lib/project';
import { useHistory } from '@/hooks/useHistory';
import {
  Moon,
  Sun,
  Sparkles,
  UploadCloud,
  Upload,
  Download,
  FileSpreadsheet,
  FileCode,
  Plus,
  AlertCircle,
  Key,
  Globe,
  CheckCircle2,
  Heart,
  Undo2,
  Redo2,
  Save,
  Pencil,
  Replace,
  Activity,
  BookOpen,
  FlaskConical,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function App() {
  // Check for auto-saved draft in browser localStorage on initial mount
  const initialDraft = useMemo(() => loadLocalDraft(), []);

  // Use history hook for complete Undo / Redo support (Ctrl+Z / Ctrl+Y)
  const {
    items,
    setWithHistory: setItems,
    setWithoutHistory: setItemsWithoutHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory(initialDraft && Array.isArray(initialDraft.items) ? initialDraft.items : []);

  const [languages, setLanguages] = useState<string[]>(
    initialDraft && Array.isArray(initialDraft.languages) && initialDraft.languages.length > 0
      ? initialDraft.languages
      : ['en', 'my']
  );
  const [projectName, setProjectName] = useState<string>(
    initialDraft && initialDraft.name ? initialDraft.name : 'translations'
  );
  const [isEditingProjectName, setIsEditingProjectName] = useState<boolean>(false);
  const projectNameInputRef = useRef<HTMLInputElement>(null);

  // Auto-save draft to localStorage whenever spreadsheet data changes
  useEffect(() => {
    if (items.length > 0) {
      saveLocalDraft(projectName, items, languages);
    } else {
      clearLocalDraft();
    }
  }, [items, languages, projectName]);

  // Warn before accidental page reload or tab close when translation data exists
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (items.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [items.length]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'missing'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'needs-review' | 'draft' | 'approved'>('all');
  const [filterMissingLang, setFilterMissingLang] = useState<string | null>(null);

  // Modal dialog states
  const [isAddKeyOpen, setIsAddKeyOpen] = useState(false);
  const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isSaveProjectOpen, setIsSaveProjectOpen] = useState(false);

  // New Feature Modals
  const [isAiTranslateOpen, setIsAiTranslateOpen] = useState(false);
  const [aiTargetLang, setAiTargetLang] = useState<string | undefined>(undefined);
  const [aiTargetKey, setAiTargetKey] = useState<string | undefined>(undefined);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isDiffMergeOpen, setIsDiffMergeOpen] = useState(false);
  const [pendingDiff, setPendingDiff] = useState<DiffResult | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogConfig | null>(null);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isLinterOpen, setIsLinterOpen] = useState(false);

  // Debounced linter issue count (300ms) to avoid CPU spikes during fast typing.
  // After the debounce elapses the scan is pushed into idle time when available,
  // so typing remains smooth even mid-scan.
  const [lintIssueCount, setLintIssueCount] = useState<number>(0);
  useEffect(() => {
    if (items.length === 0) {
      setLintIssueCount(0);
      return;
    }
    let idleHandle: number | null = null;
    const timer = setTimeout(() => {
      const compute = () => {
        const report = runLocalizationLinter(items, languages);
        setLintIssueCount(report.totalIssues);
      };
      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        idleHandle = window.requestIdleCallback(compute, { timeout: 1000 });
      } else {
        compute();
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      if (idleHandle !== null) {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, [items, languages]);

  // Drag and drop state on hero empty area
  const [isHeroDragOver, setIsHeroDragOver] = useState(false);
  const mainFileInputRef = useRef<HTMLInputElement>(null);

  // Theme toggle state with persistent localStorage storage
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('json_link_theme');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
    } catch {
      return false;
    }
  });

  // Keep document element class and localStorage in sync
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('json_link_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('json_link_theme', 'light');
      }
    } catch (e) {
      console.warn('Failed to save theme to localStorage', e);
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // Simple path-based routing: /about, /docs render dedicated pages (SPA fallback served by host)
  const [route, setRoute] = useState<'app' | 'about' | 'docs' | 'not-found'>(() => {
    const path = window.location.pathname.replace(/\/+$/, '');
    if (path === '/about') return 'about';
    if (path === '/docs') return 'docs';
    if (path === '' || path === '/') return 'app';
    // Any unrecognised path → 404
    return 'not-found';
  });

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname.replace(/\/+$/, '');
      if (path === '/about') setRoute('about');
      else if (path === '/docs') setRoute('docs');
      else if (path === '' || path === '/') setRoute('app');
      else setRoute('not-found');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openAbout = () => {
    if (window.location.pathname !== '/about') {
      window.history.pushState({}, '', '/about');
    }
    setRoute('about');
  };

  const closeAbout = () => {
    if (window.location.pathname === '/about') {
      window.history.pushState({}, '', '/');
    }
    setRoute('app');
  };

  const openDocs = () => {
    if (window.location.pathname !== '/docs') {
      window.history.pushState({}, '', '/docs');
    }
    setRoute('docs');
  };

  const closeDocs = () => {
    if (window.location.pathname === '/docs') {
      window.history.pushState({}, '', '/');
    }
    setRoute('app');
  };

  const closeNotFound = () => {
    window.history.pushState({}, '', '/');
    setRoute('app');
  };

  const isAnyModalOpen =
    isAddKeyOpen ||
    isAddLanguageOpen ||
    isImportOpen ||
    isExportOpen ||
    isExitConfirmOpen ||
    isSaveProjectOpen ||
    isAiTranslateOpen ||
    isCommandPaletteOpen ||
    isDiffMergeOpen ||
    Boolean(confirmDialog?.isOpen) ||
    isFindReplaceOpen ||
    isScorecardOpen ||
    isGlossaryOpen ||
    isLinterOpen;

  // Keyboard shortcuts: Cmd+K / Ctrl+K for Command Palette, Ctrl+Z / Ctrl+Y for Undo / Redo, Cmd+H for Find & Replace
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If any modal or dialog is open, do not execute global grid shortcuts
      if (isAnyModalOpen) return;

      // Command Palette: Ctrl+K or Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // Find & Replace: Ctrl+F, Cmd+F, Ctrl+H, or Cmd+H
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'h')) {
        e.preventDefault();
        setIsFindReplaceOpen(prev => !prev);
        return;
      }

      // Check if user is typing in an input or textarea
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea';
      if (isTyping) return;

      // Undo: Cmd+Z or Ctrl+Z (without shift)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd+Shift+Z or Ctrl+Y or Ctrl+Shift+Z
      if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && e.shiftKey) ||
        (e.ctrlKey && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [undo, redo, isAnyModalOpen]);

  // When clicking logo, if user has data in table, prompt to save as .jsonlink
  const handleLogoClick = () => {
    if (items.length > 0) {
      setIsExitConfirmOpen(true);
    }
  };

  // Reset to empty home screen when exit confirmed
  const handleConfirmExit = () => {
    clearLocalDraft();
    setItemsWithoutHistory([]);
    setLanguages(['en', 'my']);
    setProjectName('translations');
    setSearchQuery('');
    setSelectedNamespace('all');
    setActiveFilter('all');
    setStatusFilter('all');
    setFilterMissingLang(null);
  };

  // Helper to compute Diff between current items and incoming items
  const computeDiffResult = useCallback(
    (incomingItems: TranslationItem[], incomingLangs: string[]): DiffResult => {
      const currentMap = new Map<string, TranslationItem>();
      items.forEach(i => currentMap.set(i.key, i));

      const newKeys: TranslationItem[] = [];
      const modifiedKeys: {
        key: string;
        oldItem: TranslationItem;
        newItem: TranslationItem;
        changedLangs: string[];
      }[] = [];
      let unchangedCount = 0;

      const mergedLangs = Array.from(new Set([...languages, ...incomingLangs]));

      incomingItems.forEach(incItem => {
        if (!currentMap.has(incItem.key)) {
          newKeys.push(incItem);
        } else {
          const oldItem = currentMap.get(incItem.key)!;
          const changedLangs: string[] = [];

          for (const l of incomingLangs) {
            const incVal = (incItem[l] || '').trim();
            const oldVal = (oldItem[l] || '').trim();
            if (incVal && incVal !== oldVal) {
              changedLangs.push(l);
            }
          }

          const incDesc = (incItem.description || '').trim();
          const oldDesc = (oldItem.description || '').trim();
          if (incDesc !== '' && incDesc !== oldDesc) {
            changedLangs.push('description');
          }

          if (changedLangs.length > 0) {
            modifiedKeys.push({
              key: incItem.key,
              oldItem,
              newItem: incItem,
              changedLangs,
            });
          } else {
            unchangedCount++;
          }
        }
      });

      return {
        newKeys,
        modifiedKeys,
        unchangedCount,
        allIncomingLanguages: mergedLangs,
        incomingItems,
      };
    },
    [items, languages]
  );

  // Apply diff merge decision
  const handleConfirmMerge = (mode: 'merge' | 'add-only' | 'replace') => {
    if (!pendingDiff) return;

    if (mode === 'replace') {
      setItems(pendingDiff.incomingItems);
      setLanguages(pendingDiff.allIncomingLanguages);
    } else if (mode === 'add-only') {
      const combined = [...items, ...pendingDiff.newKeys];
      setItems(combined);
      setLanguages(pendingDiff.allIncomingLanguages);
    } else {
      // Merge & Update
      const map = new Map<string, TranslationItem>();
      items.forEach(it => map.set(it.key, { ...it }));

      pendingDiff.incomingItems.forEach(incoming => {
        if (!map.has(incoming.key)) {
          map.set(incoming.key, { ...incoming });
        } else {
          const current = map.get(incoming.key)!;
          for (const l of pendingDiff.allIncomingLanguages) {
            if (incoming[l] !== undefined && incoming[l] !== '') {
              current[l] = incoming[l];
            }
          }
          if (incoming.description && incoming.description.trim()) {
            current.description = incoming.description;
          }
          if (incoming.status) {
            current.status = incoming.status;
          }
        }
      });

      setItems(Array.from(map.values()));
      setLanguages(pendingDiff.allIncomingLanguages);
    }

    setIsDiffMergeOpen(false);
    setPendingDiff(null);
  };

  // Direct file drop handler on hero area
  const handleDirectFiles = async (fileList: FileList | File[]) => {
    let incomingItems: TranslationItem[] = [];
    let incomingLanguages: string[] = [];

    try {
      if (fileList.length > 0) {
        const firstFile = fileList[0];
        const baseName = firstFile.name.replace(/\.[^/.]+$/, '');
        if (baseName) {
          setProjectName(baseName);
        }
      }

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'jsonlink') {
          const text = await file.text();
          try {
            const project = parseProjectFile(text);
            if (project.items && project.items.length > 0) {
              if (incomingItems.length === 0) {
                incomingItems = project.items;
                incomingLanguages = project.languages || ['en', 'my'];
                if (project.name) setProjectName(project.name);
                continue;
              } else {
                for (const l of (project.languages || [])) {
                  if (!incomingLanguages.includes(l)) incomingLanguages.push(l);
                }
                const existingMap = new Map(incomingItems.map(it => [it.key, it]));
                for (const projItem of project.items) {
                  if (existingMap.has(projItem.key)) {
                    const existing = existingMap.get(projItem.key)!;
                    Object.assign(existing, projItem);
                  } else {
                    incomingItems.push({ ...projItem });
                    existingMap.set(projItem.key, projItem);
                  }
                }
                continue;
              }
            }
          } catch { }
          const parsed = parseJsonFile(text, file.name);
          const res = mergeTranslations(incomingItems, incomingLanguages, parsed);
          incomingItems = res.items;
          incomingLanguages = res.languages;
        } else if (ext === 'json') {
          const text = await file.text();
          if (text.includes('"format"') && text.includes('"jsonlink"')) {
            try {
              const project = parseProjectFile(text);
              if (project.items && project.items.length > 0) {
                if (incomingItems.length === 0) {
                  incomingItems = project.items;
                  incomingLanguages = project.languages || ['en', 'my'];
                  if (project.name) setProjectName(project.name);
                  continue;
                } else {
                  for (const l of (project.languages || [])) {
                    if (!incomingLanguages.includes(l)) incomingLanguages.push(l);
                  }
                  const existingMap = new Map(incomingItems.map(it => [it.key, it]));
                  for (const projItem of project.items) {
                    if (existingMap.has(projItem.key)) {
                      const existing = existingMap.get(projItem.key)!;
                      Object.assign(existing, projItem);
                    } else {
                      incomingItems.push({ ...projItem });
                      existingMap.set(projItem.key, projItem);
                    }
                  }
                  continue;
                }
              }
            } catch { }
          }
          const parsed = parseJsonFile(text, file.name);
          const res = mergeTranslations(incomingItems, incomingLanguages, parsed);
          incomingItems = res.items;
          incomingLanguages = res.languages;
        } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
          const buffer = await file.arrayBuffer();
          const parsed = parseSpreadsheet(buffer);
          if (incomingItems.length === 0) {
            incomingItems = parsed.items;
            incomingLanguages = parsed.languages;
          } else {
            for (const l of parsed.languages) {
              if (!incomingLanguages.includes(l)) incomingLanguages.push(l);
            }
            const existingMap = new Map(incomingItems.map(it => [it.key, it]));
            for (const item of parsed.items) {
              if (!existingMap.has(item.key)) {
                incomingItems.push({ ...item });
                existingMap.set(item.key, item);
              } else {
                const target = existingMap.get(item.key)!;
                for (const l of parsed.languages) {
                  if (item[l] !== undefined && item[l] !== '') {
                    target[l] = item[l];
                  }
                }
                if (item.description && !target.description) {
                  target.description = item.description;
                }
              }
            }
          }
        } else if (ext === 'xml') {
          const text = await file.text();
          const parsed = parseAndroidXml(text, file.name);
          const res = mergeTranslations(incomingItems, incomingLanguages, parsed);
          incomingItems = res.items;
          incomingLanguages = res.languages;
        } else if (ext === 'strings') {
          const text = await file.text();
          const parsed = parseIosStrings(text, file.name);
          const res = mergeTranslations(incomingItems, incomingLanguages, parsed);
          incomingItems = res.items;
          incomingLanguages = res.languages;
        } else if (ext === 'yaml' || ext === 'yml') {
          const text = await file.text();
          const parsed = parseYamlFile(text, file.name);
          const res = mergeTranslations(incomingItems, incomingLanguages, parsed);
          incomingItems = res.items;
          incomingLanguages = res.languages;
        } else if (ext === 'arb') {
          const text = await file.text();
          const parsed = parseArbFile(text, file.name);
          if (incomingItems.length === 0) {
            incomingItems = parsed.items;
            incomingLanguages = parsed.languages;
          } else {
            for (const l of parsed.languages) {
              if (!incomingLanguages.includes(l)) incomingLanguages.push(l);
            }
            const existingMap = new Map(incomingItems.map(it => [it.key, it]));
            for (const item of parsed.items) {
              if (!existingMap.has(item.key)) {
                incomingItems.push({ ...item });
                existingMap.set(item.key, item);
              } else {
                const target = existingMap.get(item.key)!;
                for (const l of parsed.languages) {
                  if (item[l] !== undefined && item[l] !== '') {
                    target[l] = item[l];
                  }
                }
                if (item.description && !target.description) {
                  target.description = item.description;
                }
              }
            }
          }
        }
      }

      if (items.length === 0) {
        // Direct initial load
        setItems(incomingItems);
        setLanguages(incomingLanguages);
      } else {
        // Show Diff & Merge preview modal
        const diff = computeDiffResult(incomingItems, incomingLanguages);
        setPendingDiff(diff);
        setIsDiffMergeOpen(true);
      }
    } catch (err: any) {
      setConfirmDialog({
        isOpen: true,
        title: 'File Import Error',
        description: err?.message || 'Error parsing uploaded files. Please check the file format and try again.',
        variant: 'destructive',
        isAlert: true,
        confirmLabel: 'OK',
        onConfirm: () => { },
      });
    }
  };

  // Extract namespace list from keys
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

  // Filtered items based on search, namespace, missing filter, status filter, and column missing filter
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return items.filter(item => {
      // Global Missing filter — blank OR placeholder-only (AI-variable-only) counts as missing
      if (activeFilter === 'missing') {
        const hasMissing = languages.some(lang => isEffectivelyMissing(item[lang]));
        if (!hasMissing) return false;
      }

      // Specific Column Missing filter (from column header badge)
      if (filterMissingLang) {
        const isMissingInLang = isEffectivelyMissing(item[filterMissingLang]);
        if (!isMissingInLang) return false;
      }

      // Review status filter
      if (statusFilter !== 'all') {
        const itemStatus = item.status || 'draft';
        if (itemStatus !== statusFilter) return false;
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
  }, [items, languages, searchQuery, selectedNamespace, activeFilter, statusFilter, filterMissingLang]);

  // Handlers for cell editing and status
  const handleUpdateCell = (key: string, lang: string, value: string) => {
    setItems(
      items.map(item => (item.key === key ? { ...item, [lang]: value } : item))
    );
  };

  const handleUpdateRowStatus = (key: string, status: RowStatus) => {
    setItems(
      items.map(item => (item.key === key ? { ...item, status } : item))
    );
  };

  const handleUpdateKey = (oldKey: string, newKey: string) => {
    const trimmed = newKey.trim();
    if (!trimmed || trimmed === oldKey) return;
    if (items.some(item => item.key === trimmed)) {
      setConfirmDialog({
        isOpen: true,
        title: 'Duplicate Key',
        description: `A translation key named "${trimmed}" already exists. Please use a unique key.`,
        variant: 'warning',
        isAlert: true,
        confirmLabel: 'OK',
        onConfirm: () => { },
      });
      return;
    }
    setItems(
      items.map(item => (item.key === oldKey ? { ...item, key: trimmed } : item))
    );
  };

  const handleDeleteRow = (key: string) => {
    setItems(items.filter(item => item.key !== key));
  };

  const handleDuplicateRow = (item: TranslationItem) => {
    let copyIndex = 1;
    let newKey = `${item.key}_copy`;
    while (items.some(i => i.key === newKey)) {
      copyIndex++;
      newKey = `${item.key}_copy_${copyIndex}`;
    }
    const duplicated: TranslationItem = { ...item, key: newKey };
    setItems([duplicated, ...items]);
  };

  const handleBatchUpdate = (updatedSubset: TranslationItem[]) => {
    const updatedMap = new Map(updatedSubset.map(i => [i.key, i]));
    setItems(items.map(item => updatedMap.get(item.key) || item));
  };

  const handleDeleteLanguage = (langToDelete: string) => {
    if (languages.length <= 1) {
      setConfirmDialog({
        isOpen: true,
        title: 'Cannot Delete Column',
        description: 'You must have at least one language column in your spreadsheet.',
        variant: 'warning',
        isAlert: true,
        confirmLabel: 'Understood',
        onConfirm: () => { },
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Language Column',
      description: (
        <span>
          Are you sure you want to delete the column <strong className="font-mono text-foreground font-semibold">"{langToDelete.toUpperCase()}"</strong>? All translations in this column will be permanently removed.
        </span>
      ),
      confirmLabel: 'Delete Column',
      cancelLabel: 'Cancel',
      variant: 'destructive',
      onConfirm: () => {
        setLanguages(prev => prev.filter(l => l !== langToDelete));
        setItems(
          items.map(item => {
            const updated = { ...item };
            delete updated[langToDelete];
            return updated;
          })
        );
      },
    });
  };

  const handleRenameLanguage = (oldLang: string, newLang: string) => {
    const trimmedNew = newLang.trim().toLowerCase();
    if (!trimmedNew || trimmedNew === oldLang.toLowerCase()) return;
    if (languages.includes(trimmedNew)) {
      setConfirmDialog({
        isOpen: true,
        title: 'Language Already Exists',
        description: `Language column "${trimmedNew.toUpperCase()}" already exists in the spreadsheet.`,
        variant: 'warning',
        isAlert: true,
        confirmLabel: 'OK',
        onConfirm: () => { },
      });
      return;
    }
    setLanguages(prev => prev.map(l => (l === oldLang ? trimmedNew : l)));
    setItems(
      items.map(item => {
        const updated = { ...item };
        if (oldLang in updated) {
          updated[trimmedNew] = updated[oldLang];
          delete updated[oldLang];
        }
        return updated;
      })
    );
  };

  const handleAddKey = (newKey: string, values: Record<string, string>, description?: string) => {
    const newItem: TranslationItem = { key: newKey };
    for (const lang of languages) {
      newItem[lang] = values[lang] || '';
    }
    if (description?.trim()) {
      newItem.description = description.trim();
    }
    setItems([newItem, ...items]);
  };

  const handleAddLanguage = (langCode: string) => {
    if (!languages.includes(langCode)) {
      setLanguages(prev => [...prev, langCode]);
      setItems(
        items.map(item => ({
          ...item,
          [langCode]: item[langCode] || '',
        }))
      );
    }
  };

  const handleImportComplete = (newItems: TranslationItem[], newLanguages: string[]) => {
    if (items.length === 0) {
      setItems(newItems);
      setLanguages(newLanguages);
    } else {
      const diff = computeDiffResult(newItems, newLanguages);
      setPendingDiff(diff);
      setIsDiffMergeOpen(true);
    }
  };

  const handleResetToSample = () => {
    const sample = getInitialTranslations();
    setItemsWithoutHistory(sample.items);
    setLanguages(sample.languages);
    setProjectName('sample-app');
    setSearchQuery('');
    setSelectedNamespace('all');
    setActiveFilter('all');
    setStatusFilter('all');
    setFilterMissingLang(null);
  };

  const handleClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Clear All Translation Keys',
      description: 'Are you sure you want to clear all translation keys? All rows in the spreadsheet will be removed. You can undo this action with Cmd+Z.',
      confirmLabel: 'Clear All Keys',
      cancelLabel: 'Keep Editing',
      variant: 'destructive',
      onConfirm: () => {
        setItems([]);
      },
    });
  };

  const handleOpenAiTranslate = (targetLang?: string, targetKey?: string) => {
    setAiTargetLang(targetLang);
    setAiTargetKey(targetKey);
    setIsAiTranslateOpen(true);
  };

  // Clear every search / namespace / status / missing-column filter at once
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedNamespace('all');
    setActiveFilter('all');
    setStatusFilter('all');
    setFilterMissingLang(null);
  };

  const handleGeneratePseudoLocale = () => {
    const sourceLang = languages.includes('en') ? 'en' : languages[0];
    const pseudoRecords = generatePseudoLocaleRecords(items, sourceLang);
    const pseudoCode = 'qps-ploc';
    if (!languages.includes(pseudoCode)) {
      setLanguages([...languages, pseudoCode]);
    }
    const updated = items.map(item => ({
      ...item,
      [pseudoCode]: pseudoRecords[item.key] || '',
    }));
    setItems(updated);
  };

  // Quick stats summary
  const totalKeys = items.length;
  const totalMissing = useMemo(() => {
    return items.filter(item => languages.some(l => !(item[l] || '').trim())).length;
  }, [items, languages]);

  // Command palette command definitions
  const paletteCommands: CommandItem[] = useMemo(
    () => [
      {
        id: 'find-replace',
        category: 'Spreadsheet',
        title: 'Find & Replace Across Languages',
        description: 'Search and replace across keys, translations, and context with Regex',
        shortcut: 'Cmd+F',
        icon: <Replace className="size-3.5" />,
        action: () => setIsFindReplaceOpen(true),
      },
      {
        id: 'linter',
        category: 'Spreadsheet',
        title: 'Localization QA & Consistency Linter',
        description: 'Scan and auto-fix whitespace, variable mismatches, duplicates, and expansion',
        shortcut: 'Lint',
        icon: <Sparkles className="size-3.5" />,
        action: () => setIsLinterOpen(true),
      },
      {
        id: 'scorecard',
        category: 'View',
        title: 'Localization Health & Completion Scorecard',
        description: 'Track progress %, missing translations, and variable integrity',
        icon: <Activity className="size-3.5" />,
        action: () => setIsScorecardOpen(true),
      },
      {
        id: 'glossary',
        category: 'AI',
        title: 'AI Translation Glossary & Termbase',
        description: 'Manage brand name and term translation rules',
        icon: <BookOpen className="size-3.5" />,
        action: () => setIsGlossaryOpen(true),
      },
      {
        id: 'pseudoloc',
        category: 'Spreadsheet',
        title: 'Generate Pseudolocale (qps-ploc)',
        description: 'Accent expansion test column for UI layout stress-testing',
        icon: <FlaskConical className="size-3.5" />,
        action: handleGeneratePseudoLocale,
      },
      {
        id: 'ai-translate',
        category: 'AI',
        title: 'Auto-Translate Missing Keys (OpenRouter)',
        description: 'Batch translate untranslated keys with variable protection',
        shortcut: 'AI',
        icon: <Sparkles className="size-3.5" />,
        action: () => handleOpenAiTranslate(),
      },
      {
        id: 'add-key',
        category: 'Spreadsheet',
        title: 'Add New Translation Key',
        description: 'Create a new translation entry with namespace',
        shortcut: '↵',
        icon: <Plus className="size-3.5" />,
        action: () => setIsAddKeyOpen(true),
      },
      {
        id: 'add-language',
        category: 'Spreadsheet',
        title: 'Add Language Column',
        description: 'Add a new target language column (e.g. ja, zh, th, fr)',
        icon: <Globe className="size-3.5" />,
        action: () => setIsAddLanguageOpen(true),
      },
      {
        id: 'filter-missing',
        category: 'View',
        title: 'Filter: Show Only Missing Keys',
        description: 'Focus only on keys needing translations',
        icon: <AlertCircle className="size-3.5" />,
        action: () => setActiveFilter('missing'),
      },
      {
        id: 'filter-all',
        category: 'View',
        title: 'Filter: Show All Translations',
        description: 'Clear missing filter',
        icon: <CheckCircle2 className="size-3.5" />,
        action: () => setActiveFilter('all'),
      },
      {
        id: 'undo',
        category: 'History',
        title: 'Undo Last Action',
        shortcut: 'Ctrl+Z',
        icon: <Undo2 className="size-3.5" />,
        action: () => undo(),
      },
      {
        id: 'redo',
        category: 'History',
        title: 'Redo Last Action',
        shortcut: 'Ctrl+Y',
        icon: <Redo2 className="size-3.5" />,
        action: () => redo(),
      },
      {
        id: 'save-project',
        category: 'Export',
        title: 'Save Project (.jsonlink)',
        description: 'Save complete spreadsheet file for later restoration',
        shortcut: 'Ctrl+S',
        icon: <Save className="size-3.5" />,
        action: () => setIsSaveProjectOpen(true),
      },
      {
        id: 'export-dialog',
        category: 'Export',
        title: 'Export Translations (Excel, CSV, JSON, Flutter ARB, YAML, Android, iOS, TypeScript)',
        description: 'Choose export format and download',
        icon: <FileSpreadsheet className="size-3.5" />,
        action: () => setIsExportOpen(true),
      },
      {
        id: 'user-guide',
        category: 'Help',
        title: 'User Guide & Documentation',
        description: 'Comprehensive guides, formats, shortcuts, and spreadsheet features',
        shortcut: 'Docs',
        icon: <BookOpen className="size-3.5" />,
        action: openDocs,
      },
      {
        id: 'about',
        category: 'Help',
        title: 'About JSON Link',
        description: 'Learn about the project, privacy, and tech stack',
        icon: <Info className="size-3.5" />,
        action: openAbout,
      },
      {
        id: 'toggle-theme',
        category: 'View',
        title: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        icon: isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />,
        action: toggleTheme,
      },
    ],
    [isDark, undo, redo]
  );

  // Dedicated About page route (/about)
  if (route === 'about') {
    return <AboutPage onBack={closeAbout} isDark={isDark} onToggleTheme={toggleTheme} onOpenDocs={openDocs} />;
  }

  // Dedicated Documentation page route (/docs)
  if (route === 'docs') {
    return <DocsPage onBack={closeDocs} isDark={isDark} onToggleTheme={toggleTheme} />;
  }

  // 404 Not Found for any unrecognised URL path
  if (route === 'not-found') {
    return (
      <NotFoundPage
        onBack={closeNotFound}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenDocs={openDocs}
        onOpenAbout={openAbout}
      />
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground ${isDark ? 'dark' : ''}`}>
      {/* Top MS Excel Ribbon Header: Edge-to-edge */}
      <header className="border-b border-border bg-card px-3 sm:px-4 h-12 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity text-left outline-none shrink-0"
            title={items.length > 0 ? "Return to Home (with Save prompt)" : "JSON Link"}
          >
            <Logo size="md" />
          </button>

          {/* Editable Project Name or Subtitle */}
          {items.length > 0 ? (
            <div className="flex items-center gap-1.5 ml-1 pl-2.5 border-l border-border">
              {isEditingProjectName ? (
                <input
                  ref={projectNameInputRef}
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  onBlur={() => setIsEditingProjectName(false)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      setIsEditingProjectName(false);
                    }
                  }}
                  className="h-6 px-2 text-xs font-semibold bg-background border border-primary rounded outline-none w-32 sm:w-44 text-foreground shadow-sm"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setIsEditingProjectName(true)}
                  className="group flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-muted/80 text-xs font-semibold text-foreground transition-colors cursor-pointer"
                  title="Click to rename project"
                >
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">{projectName}</span>
                  <Pencil className="size-3 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground hidden lg:inline">
              — i18n Localization Spreadsheet
            </span>
          )}

          {/* Header Stats Badges — lg+ only on the ribbon; narrower screens get the
              same numbers from the table footer / StatsBar instead of an overflow */}
          {totalKeys > 0 && (
            <div className="hidden lg:flex items-center gap-2 ml-3 pl-3 border-l border-border text-xs text-muted-foreground min-w-0">
              <span className="flex items-center gap-1 font-medium text-foreground whitespace-nowrap shrink-0">
                <Key className="size-3 text-primary shrink-0" /> {totalKeys.toLocaleString()} keys
              </span>
              <span className="shrink-0">•</span>
              <button
                onClick={() => setIsAddLanguageOpen(true)}
                className="flex items-center gap-1 min-w-0 hover:text-foreground hover:bg-muted/70 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                title={`Languages: ${languages.join(', ')} — click to add or manage`}
              >
                <Globe className="size-3 text-emerald-600 shrink-0" />
                <span className="whitespace-nowrap truncate max-w-[90px] sm:max-w-[110px] lg:max-w-[120px] xl:max-w-[220px]">
                  {languages.slice(0, 3).map(l => l.toUpperCase()).join(', ')}
                  {languages.length > 3 ? ` +${languages.length - 3}` : ''}
                </span>
                <Plus className="size-2.5 ml-0.5 text-muted-foreground shrink-0" />
              </button>
              {totalMissing > 0 ? (
                <>
                  <span>•</span>
                  <button
                    onClick={() => setActiveFilter(activeFilter === 'missing' ? 'all' : 'missing')}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer font-medium transition-colors ${activeFilter === 'missing'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30'
                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                      }`}
                    title={activeFilter === 'missing' ? 'Showing missing keys only. Click to show all.' : 'Click to filter missing translations'}
                  >
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{totalMissing} missing</span>
                    {activeFilter === 'missing' && <span className="text-[10px] bg-amber-500/20 px-1 rounded">Filtered</span>}
                  </button>
                </>
              ) : (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="size-3 shrink-0" /> 100% translated
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {items.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFindReplaceOpen(true)}
                className="h-7 px-2 text-xs gap-1.5 hidden md:flex cursor-pointer"
                title="Find & Replace Across Languages (Cmd+F / Cmd+H)"
              >
                <Replace className="size-3.5 text-blue-500" />
                <span>Find / Replace</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsScorecardOpen(true)}
                className="h-7 px-2 text-xs gap-1.5 hidden md:flex cursor-pointer"
                title="Localization Health & Scorecard"
              >
                <Activity className="size-3.5 text-emerald-500" />
                <span>Scorecard</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLinterOpen(true)}
                className="h-7 px-2 text-xs gap-1.5 hidden lg:flex cursor-pointer"
                title="Localization QA & Consistency Linter"
              >
                <Sparkles className="size-3.5 text-amber-500" />
                <span>Linter</span>
                {lintIssueCount > 0 && (
                  <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded-full font-medium leading-tight">
                    {lintIssueCount}
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGlossaryOpen(true)}
                className="h-7 px-2 text-xs gap-1.5 hidden xl:flex cursor-pointer"
                title="AI Translation Glossary & Termbase"
              >
                <BookOpen className="size-3.5 text-purple-500" />
                <span>Glossary</span>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={openDocs}
            className="h-7 px-2 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/60"
            title="User Guide & Documentation"
          >
            <BookOpen className="size-3.5" />
            <span className="hidden sm:inline font-medium">Docs</span>
          </Button>

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
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="max-w-2xl md:max-w-3xl w-full flex flex-col gap-4 sm:gap-5 my-auto">
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
              className={`border-2 border-dashed rounded-xl md:rounded-2xl p-5 sm:p-8 md:p-9 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 sm:gap-4 bg-card/60 ${isHeroDragOver
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
                accept=".json,.jsonlink,.xlsx,.xls,.csv,.yaml,.yml,.xml,.strings,.arb"
                className="hidden"
              />

              <div className="mb-1 sm:mb-2 shrink-0">
                <Logo size="sm" showText={false} className="md:hidden" />
                <Logo size="lg" showText={false} className="hidden md:block" />
              </div>

              <div>
                <h2 className="text-[15px] sm:text-base md:text-lg font-bold tracking-tight text-foreground leading-snug">
                  Drop translation files here to open spreadsheet
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 max-w-xs sm:max-w-sm md:max-w-md leading-relaxed mx-auto">
                  Upload multiple JSON files (e.g. <span className="font-mono text-primary font-semibold">en.json</span> & <span className="font-mono text-primary font-semibold">my.json</span>), Flutter ARB (<span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">.arb</span>
                  ), <span className="font-mono text-emerald-600 font-semibold">.jsonlink</span> project, or import Excel, CSV, YAML, Android XML & iOS Strings.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 mt-1 w-full sm:w-auto">
                <Button size="sm" className="gap-2 font-semibold shadow-xs h-9 sm:h-8 w-full sm:w-auto">
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
                  className="gap-1.5 h-9 sm:h-8 w-full sm:w-auto"
                >
                  <Plus className="size-4" />
                  Start Empty Sheet
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 sm:gap-x-4 sm:gap-y-2 text-[10px] sm:text-[11px] md:text-xs pt-3 sm:pt-3.5 border-t border-border/60">
                <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  <FileCode className="size-3 sm:size-3.5" /> Project (.jsonlink)
                </span>
                <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  <FileCode className="size-3 sm:size-3.5" /> JSON (.json)
                </span>
                <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  <FileSpreadsheet className="size-3 sm:size-3.5" /> Excel (.xlsx)
                </span>
                <span className="flex items-center gap-1 font-medium text-sky-600 dark:text-sky-400 whitespace-nowrap">
                  <FileSpreadsheet className="size-3 sm:size-3.5" /> CSV (.csv)
                </span>
                <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
                  <FileCode className="size-3 sm:size-3.5" /> YAML (.yaml)
                </span>
                <span className="flex items-center gap-1 font-medium text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                  <FileCode className="size-3 sm:size-3.5" /> Flutter ARB (.arb)
                </span>
                <span className="flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400 whitespace-nowrap">
                  <FileCode className="size-3 sm:size-3.5" /> Android (.xml)
                </span>
                <span className="flex items-center gap-1 font-medium text-pink-600 dark:text-pink-400 whitespace-nowrap">
                  <FileCode className="size-3 sm:size-3.5" /> iOS (.strings)
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
          <footer className="py-3 text-center text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-1.5 border-t border-border/40 w-full mt-auto">
            <span>Developed with</span>
            <Heart className="size-3 text-rose-500 fill-rose-500 inline" />
            <span>by</span>
            <span className="font-semibold text-foreground">Pyae Phyo Maung</span>
            <span className="px-1">·</span>
            <button
              onClick={openAbout}
              className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer underline underline-offset-4"
            >
              <Info className="size-3" />
              About JSON Link
            </button>
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
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onOpenAddKey={() => setIsAddKeyOpen(true)}
            onOpenAddLanguage={() => setIsAddLanguageOpen(true)}
            onOpenImport={() => setIsImportOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
            onOpenSaveProject={() => setIsSaveProjectOpen(true)}
            onResetToSample={handleResetToSample}
            onClearAll={handleClearAll}
            hasItems={items.length > 0}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onOpenAiTranslate={() => handleOpenAiTranslate()}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenFindReplace={() => setIsFindReplaceOpen(true)}
            onOpenScorecard={() => setIsScorecardOpen(true)}
            onOpenLinter={() => setIsLinterOpen(true)}
            onOpenGlossary={() => setIsGlossaryOpen(true)}
          />

          {/* Full-bleed Edge-to-Edge Spreadsheet */}
          <SpreadsheetTable
            items={filteredItems}
            languages={languages}
            onUpdateCell={handleUpdateCell}
            onUpdateKey={handleUpdateKey}
            onDeleteRow={handleDeleteRow}
            onDuplicateRow={handleDuplicateRow}
            onDeleteLanguage={handleDeleteLanguage}
            onRenameLanguage={handleRenameLanguage}
            onAddRow={() => setIsAddKeyOpen(true)}
            onOpenImport={() => setIsImportOpen(true)}
            onBatchUpdate={handleBatchUpdate}
            onOpenAiTranslate={handleOpenAiTranslate}
            onUpdateRowStatus={handleUpdateRowStatus}
            filterMissingLang={filterMissingLang}
            totalItemCount={items.length}
            onClearFilters={handleClearFilters}
            onToggleFilterMissingLang={(lang) => {
              setFilterMissingLang(prev => (prev === lang ? null : lang));
            }}
          />

            {/* Primary actions always within reach on narrow viewports
                (complements the ⋯ overflow menu; hidden ≥ sm) */}
            {items.length > 0 && (
              <div className="sm:hidden shrink-0 grid grid-cols-3 gap-px bg-border border-t border-border">
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="flex items-center justify-center gap-1.5 h-11 bg-card text-xs font-medium text-foreground active:bg-muted cursor-pointer"
                >
                  <Upload className="size-3.5" /> Import
                </button>
                <button
                  onClick={() => setIsExportOpen(true)}
                  className="flex items-center justify-center gap-1.5 h-11 bg-primary text-xs font-semibold text-primary-foreground active:bg-primary/90 cursor-pointer"
                >
                  <Download className="size-3.5" /> Export
                </button>
                <button
                  onClick={() => setIsSaveProjectOpen(true)}
                  className="flex items-center justify-center gap-1.5 h-11 bg-emerald-600 text-xs font-semibold text-white active:bg-emerald-700 cursor-pointer"
                >
                  <Save className="size-3.5" /> Save
                </button>
              </div>
            )}
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
        defaultFilename={projectName}
      />

      <ExitConfirmDialog
        open={isExitConfirmOpen}
        onOpenChange={setIsExitConfirmOpen}
        items={items}
        languages={languages}
        onConfirmExit={handleConfirmExit}
        defaultProjectName={projectName}
      />

      <SaveProjectModal
        open={isSaveProjectOpen}
        onOpenChange={setIsSaveProjectOpen}
        items={items}
        languages={languages}
        defaultProjectName={projectName}
      />

      {/* AI Auto-Translation Modal */}
      <AiTranslateModal
        isOpen={isAiTranslateOpen}
        onClose={() => {
          setIsAiTranslateOpen(false);
          setAiTargetLang(undefined);
          setAiTargetKey(undefined);
        }}
        items={items}
        languages={languages}
        onApplyTranslations={setItems}
        preselectedTargetLang={aiTargetLang}
        targetKey={aiTargetKey}
      />

      {/* Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={paletteCommands}
      />

      {/* Diff & Merge Modal on Import */}
      <DiffMergeModal
        isOpen={isDiffMergeOpen}
        onClose={() => {
          setIsDiffMergeOpen(false);
          setPendingDiff(null);
        }}
        diff={pendingDiff}
        onConfirmMerge={handleConfirmMerge}
      />

      {/* Reusable Custom Modal Confirmation / Alert Dialog */}
      <ConfirmDialog
        config={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />

      {/* Find & Replace Across Languages (Cmd+H / Ctrl+H) */}
      <FindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        items={items}
        languages={languages}
        onApplyReplace={(updatedItems) => {
          setItems(updatedItems);
        }}
      />

      {/* Localization Health & Completion Scorecard */}
      <ScorecardModal
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        items={items}
        languages={languages}
        sourceLanguage={languages.includes('en') ? 'en' : languages[0]}
        onTranslateMissing={(targetLang) => {
          handleOpenAiTranslate(targetLang);
        }}
      />

      {/* Standalone AI Translation Glossary & Termbase */}
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      {/* Localization QA & Consistency Linter */}
      <LinterModal
        isOpen={isLinterOpen}
        onClose={() => setIsLinterOpen(false)}
        items={items}
        languages={languages}
        onApplyItems={setItems}
        onJumpToCell={(key) => {
          setSearchQuery(key);
        }}
      />
    </div>
  );
}

export default App;
