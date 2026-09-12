import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TranslationItem, RowStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { HorizontalScrollContainer } from '@/components/ui/horizontal-scroll-container';
import {
  Copy,
  Check,
  Trash2,
  Plus,
  KeyRound,
  FileUp,
  MoreHorizontal,
  ChevronDown,
  Download,
  CopyCheck,
  Eraser,
  Layers,
  Heart,
  Pin,
  PinOff,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Pencil,
  FileText,
  Type,
  X,
  Undo2,
  CheckCircle2,
  SearchX,
  RotateCcw,
  ClipboardPaste,
  ClipboardCopy,
  Globe,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { exportSingleLanguageJson, exportSingleLanguageArb } from '@/lib/exporter';
import { tokenizeVariables, validateVariables, isEffectivelyMissing } from '@/lib/variables';
import { detectZawgyiInItems, zawgyiToUnicode, unicodeToZawgyi, isZawgyi } from '@/lib/myanmarFont';
import { isRtlLanguage } from '@/data/languages';

interface SpreadsheetTableProps {
  items: TranslationItem[];
  languages: string[];
  onUpdateCell: (key: string, lang: string, value: string) => void;
  onUpdateKey: (oldKey: string, newKey: string) => void;
  onDeleteRow: (key: string) => void;
  onAddRow: () => void;
  onOpenImport: () => void;
  onDeleteLanguage?: (lang: string) => void;
  onRenameLanguage?: (oldLang: string, newLang: string) => void;
  onOpenAddLanguage?: () => void;
  onDuplicateRow?: (item: TranslationItem) => void;
  onBatchUpdate?: (updatedItems: TranslationItem[]) => void;
  onOpenAiTranslate?: (targetLang?: string, targetKey?: string) => void;
  onUpdateRowStatus?: (key: string, status: RowStatus) => void;
  filterMissingLang?: string | null;
  onToggleFilterMissingLang?: (lang: string) => void;
  totalItemCount?: number;
  onClearFilters?: () => void;
  activeFilter?: 'all' | 'missing';
  searchQuery?: string;
}

interface EditingCell {
  key: string;
  field: string; // 'key' or language code
  value: string;
}

interface SelectedCell {
  key: string;
  field: string;
  colIndex: number;
  rowIndex: number;
}

interface ContextMenuState {
  x: number;
  y: number;
  key: string;
  field: string;
  rowIndex: number;
  colIndex: number;
}

// Convert column index to Excel column letters (0 -> A, 1 -> B, etc.)
function getColumnLetter(colIndex: number): string {
  let letter = '';
  while (colIndex >= 0) {
    letter = String.fromCharCode((colIndex % 26) + 65) + letter;
    colIndex = Math.floor(colIndex / 26) - 1;
  }
  return letter;
}

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  key: 280,
  description: 220,
};

export const SpreadsheetTable: React.FC<SpreadsheetTableProps> = ({
  items,
  languages,
  onUpdateCell,
  onUpdateKey,
  onDeleteRow,
  onAddRow,
  onOpenImport,
  onDeleteLanguage,
  onRenameLanguage,
  onOpenAddLanguage,
  onDuplicateRow,
  onBatchUpdate,
  onOpenAiTranslate,
  onUpdateRowStatus,
  filterMissingLang,
  onToggleFilterMissingLang,
  totalItemCount,
  onClearFilters,
  activeFilter,
  searchQuery,
}) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(() => {
    if (items.length > 0) {
      return { key: items[0].key, field: 'key', colIndex: 0, rowIndex: 0 };
    }
    return null;
  });

  // Keep selectedCell synchronized with visible items (handles filter, delete, reorder)
  useEffect(() => {
    if (!selectedCell) return;
    const actualRowIdx = items.findIndex(i => i.key === selectedCell.key);
    if (actualRowIdx !== -1 && actualRowIdx !== selectedCell.rowIndex) {
      setSelectedCell(prev => prev ? { ...prev, rowIndex: actualRowIdx } : null);
    } else if (actualRowIdx === -1 && items.length > 0) {
      const clampedRow = Math.min(Math.max(0, selectedCell.rowIndex), items.length - 1);
      setSelectedCell(prev => prev ? {
        ...prev,
        key: items[clampedRow].key,
        rowIndex: clampedRow,
      } : null);
    } else if (items.length === 0) {
      setSelectedCell(null);
    }
  }, [items]);

  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renameLangTarget, setRenameLangTarget] = useState<string | null>(null);
  const [renameLangValue, setRenameLangValue] = useState<string>('');

  const handleStartRenameLanguage = (lang: string) => {
    setRenameLangTarget(lang);
    setRenameLangValue(lang);
  };

  const handleCellContextMenu = (
    e: React.MouseEvent,
    key: string,
    field: string,
    rowIndex: number,
    colIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCell({ key, field, rowIndex, colIndex });
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      key,
      field,
      rowIndex,
      colIndex,
    });
  };

  // Column widths state persisted to localStorage
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('jsonlink_column_widths');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_COLUMN_WIDTHS;
  });

  const getColWidth = (id: string, fallback = 280): number => {
    return columnWidths[id] ?? fallback;
  };

  const ROW_NUM_WIDTH = 54;
  const KEY_COL_WIDTH = getColWidth('key', 280);
  const DESC_COL_WIDTH = getColWidth('description', 220);
  const getLangColWidth = (lang: string) => getColWidth(lang, 280);
  const MENU_COL_WIDTH = 56;

  // Translation history diff/revert state: previousValues[key][lang] = oldVal
  const [previousValues, setPreviousValues] = useState<Record<string, Record<string, string>>>({});

  // Frozen columns state: 0 = unfreeze all, 1 = freeze Key (default), 2+ = freeze up to language idx + 2
  const [frozenCount, setFrozenCount] = useState<number>(1);
  const safeFrozenCount = Math.min(frozenCount, languages.length + 1);

  const isKeyFrozen = safeFrozenCount >= 1;
  const isKeyLastFrozen = safeFrozenCount === 1;

  const [showDescription, setShowDescription] = useState<boolean>(() => {
    return items.some(i => i.description && i.description.trim() !== '');
  });

  // Clamp selectedCell column index when columns change (e.g. description toggled off)
  useEffect(() => {
    if (!selectedCell) return;
    const totalCols = 1 + (showDescription ? 1 : 0) + languages.length;
    if (selectedCell.colIndex >= totalCols) {
      const newCol = Math.max(0, totalCols - 1);
      let newField = 'key';
      if (showDescription && newCol === 1) newField = 'description';
      else if (newCol > 0) {
        const langIdx = showDescription ? newCol - 2 : newCol - 1;
        newField = languages[langIdx] || 'key';
      }
      setSelectedCell(prev => prev ? { ...prev, colIndex: newCol, field: newField } : null);
    }
  }, [showDescription, languages]);

  // Track resizing divider drag
  const resizingColRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);

  const handleStartResize = (colId: string, currentWidth: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingColRef.current = {
      colId,
      startX: e.clientX,
      startWidth: currentWidth,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      const resize = resizingColRef.current;
      if (!resize) return;
      const delta = ev.clientX - resize.startX;
      const newW = Math.max(120, Math.min(900, resize.startWidth + delta));
      const targetColId = resize.colId;
      setColumnWidths(prev => ({
        ...prev,
        [targetColId]: newW,
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (resizingColRef.current) {
        setColumnWidths(latest => {
          try {
            localStorage.setItem('jsonlink_column_widths', JSON.stringify(latest));
          } catch {}
          return latest;
        });
        resizingColRef.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResetColumnWidths = () => {
    setColumnWidths(DEFAULT_COLUMN_WIDTHS);
    try {
      localStorage.removeItem('jsonlink_column_widths');
    } catch {}
    setCopiedNotification('Reset column widths to default');
    setTimeout(() => setCopiedNotification(null), 1500);
  };

  const zawgyiStats = useMemo(() => {
    const stats: Record<string, ReturnType<typeof detectZawgyiInItems>> = {};
    for (const lang of languages) {
      // Pre-check: skip the heavier ZG scan for languages with no Myanmar characters at all.
      // Must scan ALL items — sampling a subset would miss Zawgyi rows deeper in the data.
      if (lang === 'my') {
        stats[lang] = detectZawgyiInItems(items, lang);
      } else {
        const mightHaveBurmese = items.some(
          i => typeof i[lang] === 'string' && /[\u1000-\u109f]/.test(i[lang])
        );
        stats[lang] = mightHaveBurmese
          ? detectZawgyiInItems(items, lang)
          : { hasZawgyi: false, count: 0 };
      }
    }
    return stats;
  }, [items, languages]);

  // Wrapped update cell that preserves diff for 1-click Revert
  const handleInternalUpdateCell = (key: string, lang: string, value: string) => {
    const currentItem = items.find(i => i.key === key);
    const oldVal = currentItem ? currentItem[lang] || '' : '';
    if (oldVal !== value) {
      setPreviousValues(prev => ({
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          [lang]: oldVal,
        },
      }));
    }
    onUpdateCell(key, lang, value);
  };

  const handleRevertCell = (key: string, lang: string) => {
    const prevVal = previousValues[key]?.[lang];
    if (prevVal !== undefined) {
      onUpdateCell(key, lang, prevVal);
      setPreviousValues(prev => {
        const updated = { ...prev };
        if (updated[key]) {
          delete updated[key][lang];
          if (Object.keys(updated[key]).length === 0) {
            delete updated[key];
          }
        }
        return updated;
      });
      setCopiedNotification(`Reverted to previous translation`);
      setTimeout(() => setCopiedNotification(null), 1500);
    }
  };

  const handleConvertZawgyiToUnicode = (lang: string) => {
    if (!onBatchUpdate) return;
    let count = 0;
    const prevMap: Record<string, string> = {};
    const updated = items.map(item => {
      const val = item[lang];
      if (typeof val === 'string' && isZawgyi(val)) {
        count++;
        prevMap[item.key] = val;
        return { ...item, [lang]: zawgyiToUnicode(val) };
      }
      return item;
    });
    if (count > 0) {
      setPreviousValues(prev => {
        const next = { ...prev };
        for (const [k, oldText] of Object.entries(prevMap)) {
          next[k] = { ...(next[k] || {}), [lang]: oldText };
        }
        return next;
      });
      onBatchUpdate(updated);
      setCopiedNotification(`Converted ${count} Zawgyi cell${count > 1 ? 's' : ''} to Unicode`);
    } else {
      setCopiedNotification(`No Zawgyi text detected in ${lang.toUpperCase()}`);
    }
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  const handleConvertCellZawgyiToUnicode = (key: string, lang: string) => {
    const item = items.find(i => i.key === key);
    if (!item) return;
    const val = item[lang];
    if (typeof val === 'string' && val) {
      const converted = zawgyiToUnicode(val);
      handleInternalUpdateCell(key, lang, converted);
      setCopiedNotification(`Converted cell to Unicode`);
      setTimeout(() => setCopiedNotification(null), 1500);
    }
  };

  const handleConvertUnicodeToZawgyi = (lang: string) => {
    if (!onBatchUpdate) return;
    const prevMap: Record<string, string> = {};
    const updated = items.map(item => {
      const val = item[lang];
      if (typeof val === 'string' && val) {
        prevMap[item.key] = val;
        return { ...item, [lang]: unicodeToZawgyi(val) };
      }
      return item;
    });
    setPreviousValues(prev => {
      const next = { ...prev };
      for (const [k, oldText] of Object.entries(prevMap)) {
        next[k] = { ...(next[k] || {}), [lang]: oldText };
      }
      return next;
    });
    onBatchUpdate(updated);
    setCopiedNotification(`Converted ${lang.toUpperCase()} to Zawgyi`);
    setTimeout(() => setCopiedNotification(null), 1500);
  };

  const getFreezeLineClass = (isLast: boolean) =>
    isLast
      ? 'border-r border-border shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]'
      : 'border-r border-border';

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleStartEdit = (key: string, field: string, currentValue: string) => {
    setEditingCell({ key, field, value: currentValue });
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;

    if (editingCell.field === 'key') {
      const trimmed = editingCell.value.trim();
      if (trimmed && trimmed !== editingCell.key) {
        onUpdateKey(editingCell.key, trimmed);
      }
    } else {
      handleInternalUpdateCell(editingCell.key, editingCell.field, editingCell.value);
    }

    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (!e.shiftKey || e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSaveEdit();
      // Excel-like: move down to next row on Enter
      if (selectedCell && selectedCell.rowIndex < items.length - 1) {
        const nextRow = selectedCell.rowIndex + 1;
        setSelectedCell({
          key: items[nextRow].key,
          field: selectedCell.field,
          colIndex: selectedCell.colIndex,
          rowIndex: nextRow,
        });
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Keyboard navigation across cells when NOT editing
  const handleTableKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell || !selectedCell || items.length === 0) return;

    const totalCols = 1 + (showDescription ? 1 : 0) + languages.length;
    const totalRows = items.length;

    const getColInfoFromIndex = (colIdx: number) => {
      if (colIdx === 0) return 'key';
      if (showDescription && colIdx === 1) return 'description';
      const langIdx = showDescription ? colIdx - 2 : colIdx - 1;
      return languages[langIdx] || 'key';
    };

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newRow = Math.max(0, selectedCell.rowIndex - 1);
      setSelectedCell({
        key: items[newRow].key,
        field: selectedCell.field,
        colIndex: selectedCell.colIndex,
        rowIndex: newRow,
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newRow = Math.min(totalRows - 1, selectedCell.rowIndex + 1);
      setSelectedCell({
        key: items[newRow].key,
        field: selectedCell.field,
        colIndex: selectedCell.colIndex,
        rowIndex: newRow,
      });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newCol = Math.max(0, selectedCell.colIndex - 1);
      const field = getColInfoFromIndex(newCol);
      setSelectedCell({
        key: selectedCell.key,
        field,
        colIndex: newCol,
        rowIndex: selectedCell.rowIndex,
      });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newCol = Math.min(totalCols - 1, selectedCell.colIndex + 1);
      const field = getColInfoFromIndex(newCol);
      setSelectedCell({
        key: selectedCell.key,
        field,
        colIndex: newCol,
        rowIndex: selectedCell.rowIndex,
      });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        let newCol = selectedCell.colIndex - 1;
        let newRow = selectedCell.rowIndex;
        if (newCol < 0) {
          newCol = totalCols - 1;
          newRow = Math.max(0, newRow - 1);
        }
        const field = getColInfoFromIndex(newCol);
        setSelectedCell({
          key: items[newRow].key,
          field,
          colIndex: newCol,
          rowIndex: newRow,
        });
      } else {
        let newCol = selectedCell.colIndex + 1;
        let newRow = selectedCell.rowIndex;
        if (newCol >= totalCols) {
          newCol = 0;
          newRow = Math.min(totalRows - 1, newRow + 1);
        }
        const field = getColInfoFromIndex(newCol);
        setSelectedCell({
          key: items[newRow].key,
          field,
          colIndex: newCol,
          rowIndex: newRow,
        });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const currItem = items.find(i => i.key === selectedCell.key) || items[selectedCell.rowIndex];
      if (currItem) {
        const val = selectedCell.field === 'key' ? currItem.key : currItem[selectedCell.field] || '';
        handleStartEdit(currItem.key, selectedCell.field, val);
      }
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 1500);
  };

  const handlePasteFromClipboard = async (targetKey: string, targetField: string) => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      if (targetField === 'key') {
        const trimmed = text.trim();
        if (trimmed && trimmed !== targetKey) {
          onUpdateKey(targetKey, trimmed);
          if (selectedCell?.key === targetKey) {
            setSelectedCell(prev => prev ? { ...prev, key: trimmed } : null);
          }
        }
      } else {
        handleInternalUpdateCell(targetKey, targetField, text);
      }
      setCopiedNotification('Pasted from clipboard');
      setTimeout(() => setCopiedNotification(null), 1200);
    } catch {
      setCopiedNotification('Clipboard access denied');
      setTimeout(() => setCopiedNotification(null), 1500);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (editingCell || !selectedCell || items.length === 0) return;

    const clipText = e.clipboardData.getData('text/plain');
    if (!clipText) return;

    const rawRows = clipText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (rawRows.length > 1 && rawRows[rawRows.length - 1] === '') {
      rawRows.pop();
    }

    const grid = rawRows.map(r => r.split('\t'));
    const isMultiCell = grid.length > 1 || (grid[0] && grid[0].length > 1);

    if (!isMultiCell) {
      const val = grid[0][0];
      if (selectedCell.field === 'key') {
        const trimmed = val.trim();
        if (trimmed && trimmed !== selectedCell.key) {
          onUpdateKey(selectedCell.key, trimmed);
          setSelectedCell({ ...selectedCell, key: trimmed });
        }
      } else {
        handleInternalUpdateCell(selectedCell.key, selectedCell.field, val);
      }
      setCopiedNotification('Pasted into cell');
      setTimeout(() => setCopiedNotification(null), 1200);
      return;
    }

    // Multi-cell block paste
    e.preventDefault();
    const updatedItems = items.map(item => ({ ...item }));
    const startRow = selectedCell.rowIndex;
    const startCol = selectedCell.colIndex;
    let updatedCount = 0;

    grid.forEach((rowCells, rOffset) => {
      const targetRowIdx = startRow + rOffset;
      if (targetRowIdx < updatedItems.length) {
        rowCells.forEach((cellVal, cOffset) => {
          const targetColIdx = startCol + cOffset;
          // Determine the target field accounting for showDescription
          let targetField: string | null = null;
          if (targetColIdx === 0) {
            targetField = 'key';
          } else if (showDescription && targetColIdx === 1) {
            targetField = 'description';
          } else {
            const langIdx = targetColIdx - (showDescription ? 2 : 1);
            if (langIdx >= 0 && langIdx < languages.length) {
              targetField = languages[langIdx];
            }
          }

          if (targetField === 'key') {
            const cleanKey = cellVal.trim();
            if (cleanKey) {
              updatedItems[targetRowIdx].key = cleanKey;
              updatedCount++;
            }
          } else if (targetField === 'description') {
            updatedItems[targetRowIdx].description = cellVal;
            updatedCount++;
          } else if (targetField) {
            updatedItems[targetRowIdx][targetField] = cellVal;
            updatedCount++;
          }
        });
      }
    });

    if (onBatchUpdate) {
      onBatchUpdate(updatedItems);
    }
    setCopiedNotification(`Pasted ${grid.length}×${grid[0].length} cells (${updatedCount} values)`);
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  useEffect(() => {
    const handleGlobalCopy = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && !editingCell && selectedCell) {
        const item = items.find(i => i.key === selectedCell.key);
        if (item) {
          const text = selectedCell.field === 'key' ? item.key : item[selectedCell.field] || '';
          navigator.clipboard.writeText(text);
          setCopiedNotification(`Copied`);
          setTimeout(() => setCopiedNotification(null), 1200);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalCopy);
    return () => window.removeEventListener('keydown', handleGlobalCopy);
  }, [selectedCell, editingCell, items]);

  // Find currently selected cell's value for the MS Excel Formula bar
  const selectedValue = selectedCell
    ? selectedCell.field === 'key'
      ? selectedCell.key
      : items.find(i => i.key === selectedCell.key)?.[selectedCell.field] || ''
    : '';

  // If no items in table, display empty-state CTA
  if (items.length === 0) {
    // Project is loaded but current search/filters matched nothing
    if ((totalItemCount ?? 0) > 0) {
      const isMissingOnly = (activeFilter === 'missing' || Boolean(filterMissingLang)) && !searchQuery;
      if (isMissingOnly) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none bg-background">
            <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-xs">
              <CheckCircle2 className="size-8 stroke-[1.5]" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              All translations complete! 🎉
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1.5 mb-6 leading-relaxed">
              No missing translations found across all {totalItemCount} keys. Everything is 100% translated.
            </p>
            {onClearFilters && (
              <Button onClick={onClearFilters} size="sm" className="gap-2 shadow-xs font-semibold h-8 text-xs cursor-pointer">
                <RotateCcw className="size-3.5" />
                Show All Keys
              </Button>
            )}
          </div>
        );
      }

      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none bg-background">
          <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 shadow-xs">
            <SearchX className="size-8 stroke-[1.5]" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            No keys match this filter or search
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1.5 mb-6 leading-relaxed">
            {totalItemCount} key{totalItemCount === 1 ? ' is' : 's are'} loaded in the spreadsheet, but none match the current search {searchQuery ? `("${searchQuery}")` : ''} or active filters.
          </p>
          {onClearFilters && (
            <Button onClick={onClearFilters} size="sm" className="gap-2 shadow-xs font-semibold h-8 text-xs cursor-pointer">
              <RotateCcw className="size-3.5" />
              Clear Filters &amp; Search
            </Button>
          )}
        </div>
      );
    }
  }

  return (
    <div
      className="flex-1 flex flex-col w-full h-full min-h-0 select-none bg-background outline-none"
      onPaste={handlePaste}
      onKeyDown={handleTableKeyDown}
      tabIndex={0}
    >
      {/* MS Excel Style Formula Bar (Cell Address & Content Inspector) with 100% Solid Background */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#fafafa] dark:bg-[#121214] border-b border-border text-xs shrink-0 z-25">
        {/* Name Box (e.g. A1, B12, or Key reference) */}
        <div className="flex items-center gap-1 px-2 py-1 bg-background border border-border rounded font-mono text-xs font-semibold text-foreground min-w-[90px] text-center shadow-2xs">
          <span>
            {selectedCell
              ? `${getColumnLetter(selectedCell.colIndex)}${selectedCell.rowIndex + 1}`
              : 'A1'}
          </span>
          <span className="text-[10px] font-normal text-muted-foreground ml-1">
            {selectedCell?.field ? `[${selectedCell.field}]` : ''}
          </span>
        </div>

        {/* Formula 'fx' symbol */}
        <span className="font-serif italic font-bold text-muted-foreground px-1 select-none text-sm">
          fx
        </span>

        {/* Formula Bar Input (live cell viewer & editor) */}
        <div className="flex-1 relative">
          <input
            ref={formulaInputRef}
            type="text"
            dir={selectedCell && isRtlLanguage(selectedCell.field) ? 'rtl' : 'ltr'}
            value={editingCell ? editingCell.value : selectedValue}
            onChange={e => {
              if (selectedCell) {
                if (editingCell) {
                  setEditingCell({ ...editingCell, value: e.target.value });
                } else {
                  setEditingCell({
                    key: selectedCell.key,
                    field: selectedCell.field,
                    value: e.target.value,
                  });
                }
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveEdit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setEditingCell(null);
              }
            }}
            placeholder={
              selectedCell
                ? `Edit [${selectedCell.field}] for key "${selectedCell.key}" (Press Enter to save)...`
                : 'Select a cell, double-click or press Enter to edit...'
            }
            className={`w-full px-2.5 py-1 bg-background border border-border rounded text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors ${
              selectedCell && isRtlLanguage(selectedCell.field) ? 'text-right' : 'text-left'
            }`}
          />
        </div>

        {/* Toggle Context (Description) Column */}
        <button
          type="button"
          onClick={() => setShowDescription(!showDescription)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-colors cursor-pointer shrink-0 ${
            showDescription
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-500 font-medium'
              : 'bg-background border-border text-muted-foreground hover:text-foreground'
          }`}
          title="Toggle Developer Context / Description Column"
        >
          <FileText className="size-3 text-blue-500" />
          <span>{showDescription ? 'Context (Visible)' : 'Context'}</span>
        </button>

        {/* Copy / Paste notification pill */}
        {copiedNotification && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shadow-2xs font-medium animate-in fade-in duration-200">
            <Check className="size-3" />
            <span>
              {copiedNotification.startsWith('Pasted') ||
              copiedNotification.startsWith('Converted') ||
              copiedNotification.startsWith('Reverted') ||
              copiedNotification.startsWith('Reset') ||
              copiedNotification.startsWith('No ') ||
              copiedNotification.startsWith('Copied')
                ? copiedNotification
                : `Copied ${copiedNotification}`}
            </span>
          </div>
        )}
      </div>

      {/* Active Column-specific Missing Filter Alert Banner */}
      {filterMissingLang && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/10 dark:bg-amber-950/30 border-b border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 shrink-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">
              Filtering missing keys in <strong>{filterMissingLang.toUpperCase()}</strong> ({items.length} of {totalItemCount ?? items.length} keys shown)
            </span>
          </div>
          {onToggleFilterMissingLang && (
            <button
              type="button"
              onClick={() => onToggleFilterMissingLang(filterMissingLang)}
              className="px-2.5 py-0.5 text-xs font-semibold rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 transition-colors cursor-pointer shrink-0 ml-2"
            >
              Show All Keys
            </button>
          )}
        </div>
      )}

      {/* True Excel Spreadsheet Table: Edge-to-edge, Horizontal Scroll on Overflow, Dynamic Freeze Panes */}
      <div className="flex-1 overflow-auto relative w-full h-full bg-background">
        <table className="min-w-full w-max border-separate border-spacing-0 text-left">
          {/* Column widths group to ensure columns never squish on multiple languages */}
          <colgroup>
            <col style={{ width: ROW_NUM_WIDTH, minWidth: ROW_NUM_WIDTH }} />
            <col style={{ width: KEY_COL_WIDTH, minWidth: KEY_COL_WIDTH }} />
            {showDescription && (
              <col style={{ width: DESC_COL_WIDTH, minWidth: DESC_COL_WIDTH }} />
            )}
            {languages.map(lang => (
              <col key={lang} style={{ width: getLangColWidth(lang), minWidth: getLangColWidth(lang) }} />
            ))}
            <col style={{ width: MENU_COL_WIDTH, minWidth: MENU_COL_WIDTH }} />
          </colgroup>

          {/* Top Column Headers */}
          <thead className="sticky top-0 z-40 shadow-xs">
            <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {/* Row Number Header */}
              <th
                style={{ width: ROW_NUM_WIDTH, minWidth: ROW_NUM_WIDTH, left: 0 }}
                className={`py-2.5 px-2 text-center bg-[#f4f4f5] dark:bg-[#18181b] sticky top-0 left-0 z-50 select-none border-b border-border ${getFreezeLineClass(safeFrozenCount === 0)}`}
              >
                #
              </th>

              {/* Translation Key Header with Resize Handle */}
              <th
                style={{
                  width: KEY_COL_WIDTH,
                  minWidth: KEY_COL_WIDTH,
                  left: isKeyFrozen ? ROW_NUM_WIDTH : undefined,
                }}
                className={`py-2.5 px-3 bg-[#f4f4f5] dark:bg-[#18181b] sticky top-0 ${
                  isKeyFrozen ? 'left-[54px] z-45' : 'z-40'
                } border-b border-border relative group/header ${getFreezeLineClass(isKeyLastFrozen)}`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                      A
                    </span>
                    <span className="font-bold text-foreground">Translation Key</span>
                    {isKeyFrozen && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFrozenCount(0);
                        }}
                        title="Key column is frozen. Click to unfreeze."
                        className="inline-flex items-center p-0.5 rounded hover:bg-muted text-primary cursor-pointer transition-colors"
                      >
                        <Pin className="size-3 fill-primary/30 shrink-0" />
                      </button>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-mono cursor-pointer border border-border/70 bg-background shrink-0">
                        <span>KEY</span>
                        <ChevronDown className="size-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52">
                      <DropdownMenuLabel>Column: Key (A)</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => setFrozenCount(isKeyFrozen ? 0 : 1)}
                        className="gap-2 cursor-pointer text-xs"
                      >
                        {isKeyFrozen ? (
                          <>
                            <PinOff className="size-3.5 text-muted-foreground" />
                            <span>Unfreeze Key Column</span>
                          </>
                        ) : (
                          <>
                            <Pin className="size-3.5 text-primary" />
                            <span>Freeze Key Column</span>
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowDescription(!showDescription)}
                        className="gap-2 cursor-pointer text-xs"
                      >
                        <FileText className="size-3.5 text-blue-500" />
                        <span>{showDescription ? 'Hide Context Column' : 'Show Context Column'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          const allKeys = items.map(i => i.key).join('\n');
                          handleCopyText(allKeys, 'all key names');
                        }}
                        className="gap-2 cursor-pointer text-xs"
                      >
                        <Copy className="size-3.5" />
                        <span>Copy All Key Names</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Resizable Divider Handle */}
                <div
                  onMouseDown={(e) => handleStartResize('key', KEY_COL_WIDTH, e)}
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/60 active:bg-primary z-50 transition-colors"
                  title="Drag to resize column"
                />
              </th>

              {/* Context / Description Header with Resize Handle */}
              {showDescription && (
                <th
                  style={{
                    width: DESC_COL_WIDTH,
                    minWidth: DESC_COL_WIDTH,
                  }}
                  className="py-2.5 px-3 bg-[#f4f4f5] dark:bg-[#18181b] sticky top-0 z-40 border-b border-r border-border relative group/header"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded shrink-0">
                        B
                      </span>
                      <span className="font-bold text-foreground text-xs truncate">
                        Developer Context
                      </span>
                    </div>
                    <button
                      onClick={() => setShowDescription(false)}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted cursor-pointer"
                      title="Hide Developer Context column"
                    >
                      <X className="size-3" />
                    </button>
                  </div>

                  {/* Resizable Divider Handle */}
                  <div
                    onMouseDown={(e) => handleStartResize('description', DESC_COL_WIDTH, e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/60 active:bg-primary z-50 transition-colors"
                    title="Drag to resize column"
                  />
                </th>
              )}

              {/* Language Column Headers with Resize Handle & Missing Keys Indicator */}
              {languages.map((lang, idx) => {
                const isLangFrozen = safeFrozenCount >= idx + 2;
                const isLangLastFrozen = safeFrozenCount === idx + 2;
                const descOffset = showDescription ? DESC_COL_WIDTH : 0;
                let prevLangsWidth = 0;
                for (let p = 0; p < idx; p++) {
                  prevLangsWidth += getLangColWidth(languages[p]);
                }
                const langLeft = isLangFrozen
                  ? ROW_NUM_WIDTH + (isKeyFrozen ? KEY_COL_WIDTH : 0) + descOffset + prevLangsWidth
                  : undefined;
                const colLetter = getColumnLetter(showDescription ? idx + 2 : idx + 1);
                const currentWidth = getLangColWidth(lang);

                const sourceLang = languages.includes('en') ? 'en' : languages[0];
                const missingCount = items.filter(i => isEffectivelyMissing(i[lang], i[sourceLang])).length;

                return (
                  <th
                    key={lang}
                    style={{
                      width: currentWidth,
                      minWidth: currentWidth,
                      left: langLeft,
                    }}
                    className={`py-2.5 px-3 bg-[#f4f4f5] dark:bg-[#18181b] sticky top-0 ${
                      isLangFrozen ? 'z-45' : 'z-40'
                    } border-b border-border relative group/header ${getFreezeLineClass(isLangLastFrozen)}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded shrink-0">
                          {colLetter}
                        </span>
                        <span
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (onRenameLanguage) {
                              handleStartRenameLanguage(lang);
                            }
                          }}
                          className="font-bold text-foreground tracking-wide shrink-0 cursor-pointer hover:underline"
                          title="Double-click to rename language"
                        >
                          {lang.toUpperCase()}
                        </span>
                        <span className="text-[11px] font-normal text-muted-foreground truncate">
                          {lang === 'my' ? '(မြန်မာ)' : lang === 'en' ? '(English)' : ''}
                        </span>

                        {/* Missing keys quick-filter badge */}
                        {(missingCount > 0 || filterMissingLang === lang) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onToggleFilterMissingLang) {
                                onToggleFilterMissingLang(lang);
                              }
                            }}
                            title={
                              filterMissingLang === lang
                                ? `Filtering missing keys in ${lang.toUpperCase()}. Click to clear filter.`
                                : `Click to filter ${missingCount} missing keys in ${lang.toUpperCase()}`
                            }
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer shrink-0 ${
                              filterMissingLang === lang
                                ? 'bg-amber-500 text-white font-bold shadow-2xs'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                            }`}
                          >
                            <AlertCircle className="size-2.5 shrink-0" />
                            <span>{filterMissingLang === lang ? 'Filtering' : `${missingCount} missing`}</span>
                            {filterMissingLang === lang && <X className="size-2.5 ml-0.5" />}
                          </button>
                        )}

                        {/* Zawgyi font detected badge */}
                        {zawgyiStats[lang]?.hasZawgyi && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConvertZawgyiToUnicode(lang);
                            }}
                            title={`Zawgyi font detected (${zawgyiStats[lang].count} keys)! Click to convert to Unicode.`}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer transition-colors shrink-0"
                          >
                            <AlertTriangle className="size-2.5" />
                            <span>Zawgyi ({zawgyiStats[lang].count})</span>
                          </button>
                        )}

                        {isLangFrozen && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFrozenCount(idx + 1);
                            }}
                            title={`${lang.toUpperCase()} column is frozen. Click to unfreeze.`}
                            className="inline-flex items-center p-0.5 rounded hover:bg-muted text-primary cursor-pointer transition-colors"
                          >
                            <Pin className="size-3 fill-primary/30 shrink-0" />
                          </button>
                        )}
                      </div>

                      {/* Custom Column Header Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-mono cursor-pointer border border-border/70 bg-background shrink-0">
                            <span className="uppercase font-bold">{lang}</span>
                            <ChevronDown className="size-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Column: {lang.toUpperCase()}</DropdownMenuLabel>
                          {onRenameLanguage && (
                            <DropdownMenuItem
                              onClick={() => handleStartRenameLanguage(lang)}
                              className="gap-2 cursor-pointer text-xs"
                            >
                              <Pencil className="size-3.5 text-primary" />
                              <span>Rename column ({lang.toUpperCase()})</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setFrozenCount(isLangFrozen ? idx + 1 : idx + 2)}
                            className="gap-2 cursor-pointer text-xs"
                          >
                            {isLangFrozen ? (
                              <>
                                <PinOff className="size-3.5 text-muted-foreground" />
                                <span>Unfreeze {lang.toUpperCase()} Column</span>
                              </>
                            ) : (
                              <>
                                <Pin className="size-3.5 text-primary" />
                                <span>Freeze up to {lang.toUpperCase()} Column</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          {zawgyiStats[lang]?.hasZawgyi && (
                            <DropdownMenuItem
                              onClick={() => handleConvertZawgyiToUnicode(lang)}
                              className="gap-2 cursor-pointer text-xs font-semibold text-amber-600 dark:text-amber-400 focus:text-amber-500"
                            >
                              <Sparkles className="size-3.5 text-amber-500" />
                              <span>Convert Zawgyi → Unicode ({zawgyiStats[lang].count})</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleConvertUnicodeToZawgyi(lang)}
                            className="gap-2 cursor-pointer text-xs"
                          >
                            <Type className="size-3.5 text-muted-foreground" />
                            <span>Convert Unicode → Zawgyi</span>
                          </DropdownMenuItem>
                          {onOpenAiTranslate && (
                            <DropdownMenuItem
                              onClick={() => onOpenAiTranslate(lang)}
                              className="gap-2 cursor-pointer text-xs font-medium text-primary focus:text-primary"
                            >
                              <Sparkles className="size-3.5 text-primary" />
                              <span>Auto-Translate with AI</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              exportSingleLanguageJson(items, lang, {
                                format: 'json-combined',
                                nested: false,
                                indent: 2,
                                includeMissing: true,
                              });
                            }}
                            className="gap-2 cursor-pointer text-xs"
                          >
                            <Download className="size-3.5" />
                            Download {lang}.json
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => exportSingleLanguageArb(items, lang)}
                            className="gap-2 cursor-pointer text-xs"
                          >
                            <Download className="size-3.5" />
                            Download app_{lang.replace('-', '_')}.arb
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const allVals = items.map(i => i[lang] || '').join('\n');
                              handleCopyText(allVals, `all ${lang.toUpperCase()} values`);
                            }}
                            className="gap-2 cursor-pointer text-xs"
                          >
                            <CopyCheck className="size-3.5" />
                            Copy all {lang.toUpperCase()} text
                          </DropdownMenuItem>
                          {languages.length > 1 && onDeleteLanguage && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDeleteLanguage(lang)}
                                className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                                Remove {lang.toUpperCase()} column
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Resizable Divider Handle */}
                    <div
                      onMouseDown={(e) => handleStartResize(lang, currentWidth, e)}
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/60 active:bg-primary z-50 transition-colors"
                      title="Drag to resize column"
                    />
                  </th>
                );
              })}

              {/* Action Column Header (Frozen on Right) */}
              <th
                style={{ width: MENU_COL_WIDTH, minWidth: MENU_COL_WIDTH, right: 0 }}
                className="py-2.5 px-2 text-center bg-[#f4f4f5] dark:bg-[#18181b] sticky top-0 right-0 z-50 select-none border-b border-l border-border shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.5)]"
              >
                Menu
              </th>
            </tr>
          </thead>

          {/* Full Spreadsheet Body */}
          <tbody className="text-sm font-sans">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={3 + (showDescription ? 1 : 0) + languages.length}
                  className="p-10 sm:p-14 text-center select-none bg-background/50 border-b border-border"
                >
                  <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-3">
                    <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                      <KeyRound className="size-7 stroke-[1.5]" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                        Empty Translation Grid
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        No translation keys yet. Add your first key, add target languages, or import existing files to begin.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                      <Button
                        onClick={onAddRow}
                        size="sm"
                        className="gap-1.5 font-semibold text-xs h-8 shadow-xs cursor-pointer"
                      >
                        <Plus className="size-3.5" />
                        Add First Key
                      </Button>
                      {onOpenAddLanguage && (
                        <Button
                          onClick={onOpenAddLanguage}
                          variant="outline"
                          size="sm"
                          className="gap-1.5 font-medium text-xs h-8 cursor-pointer"
                        >
                          <Globe className="size-3.5 text-primary" />
                          Add Language
                        </Button>
                      )}
                      <Button
                        onClick={onOpenImport}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 font-medium text-xs h-8 cursor-pointer"
                      >
                        <FileUp className="size-3.5 text-muted-foreground" />
                        Upload Translation Files
                      </Button>
                    </div>

                    <p className="text-[11px] text-muted-foreground/80 mt-1">
                      Tip: Press <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border">Ctrl+V</kbd> to paste tabular cells directly, or drop files anywhere.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, rowIdx) => {
              const rowNumber = rowIdx + 1;
              const isKeySelected =
                selectedCell?.key === item.key && selectedCell.field === 'key';
              const rowStatus: RowStatus = item.status || 'draft';

              return (
                <tr
                  key={item.key}
                  className="group transition-colors"
                >
                  {/* Row Number & Review Status Indicator */}
                  <td
                    style={{ width: ROW_NUM_WIDTH, minWidth: ROW_NUM_WIDTH, left: 0 }}
                    onClick={() =>
                      setSelectedCell({
                        key: item.key,
                        field: 'key',
                        colIndex: 0,
                        rowIndex: rowIdx,
                      })
                    }
                    onContextMenu={(e) => handleCellContextMenu(e, item.key, 'key', rowIdx, 0)}
                    className={`py-1 px-1.5 text-center text-xs font-mono text-muted-foreground bg-[#fafafa] dark:bg-[#121214] group-hover:bg-[#e2e8f0] dark:group-hover:bg-[#222736] group-hover:text-foreground sticky left-0 z-20 select-none cursor-pointer transition-colors border-b border-border ${getFreezeLineClass(safeFrozenCount === 0)}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{rowNumber}</span>

                      {/* Row Review Status Dropdown Indicator */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-0.5 rounded hover:bg-muted/80 cursor-pointer transition-colors inline-flex items-center justify-center"
                            title={`Review Status: ${rowStatus}. Click to change.`}
                          >
                            {rowStatus === 'approved' ? (
                              <span className="size-2 rounded-full bg-emerald-500 inline-block shadow-2xs" />
                            ) : rowStatus === 'needs-review' ? (
                              <span className="size-2 rounded-full bg-amber-500 inline-block shadow-2xs" />
                            ) : (
                              <span className="size-1.5 rounded-full bg-border group-hover:bg-muted-foreground/50 inline-block transition-colors" />
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-36">
                          <DropdownMenuLabel className="text-[10px]">Row Review Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onUpdateRowStatus?.(item.key, 'draft')}
                            className="text-xs cursor-pointer gap-1.5"
                          >
                            <span className="size-2 rounded-full bg-slate-400" />
                            <span>Draft</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onUpdateRowStatus?.(item.key, 'needs-review')}
                            className="text-xs cursor-pointer gap-1.5 text-amber-600 dark:text-amber-400"
                          >
                            <span className="size-2 rounded-full bg-amber-500" />
                            <span>Needs Review</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onUpdateRowStatus?.(item.key, 'approved')}
                            className="text-xs cursor-pointer gap-1.5 text-emerald-600 dark:text-emerald-400"
                          >
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <span>Approved</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>

                  {/* Translation Key Column */}
                  <td
                    style={{
                      width: KEY_COL_WIDTH,
                      minWidth: KEY_COL_WIDTH,
                      left: isKeyFrozen ? ROW_NUM_WIDTH : undefined,
                    }}
                    onClick={() =>
                      setSelectedCell({
                        key: item.key,
                        field: 'key',
                        colIndex: 0,
                        rowIndex: rowIdx,
                      })
                    }
                    onContextMenu={(e) => handleCellContextMenu(e, item.key, 'key', rowIdx, 0)}
                    className={`py-1.5 px-3 font-mono text-xs bg-card group-hover:bg-[#eef2f6] dark:group-hover:bg-[#1a2234] hover:!bg-[#e2e8f0] dark:hover:!bg-[#242e44] ${
                      isKeyFrozen ? 'sticky z-15' : 'relative z-0'
                    } border-b border-border transition-colors cursor-pointer ${getFreezeLineClass(isKeyLastFrozen)} ${
                      isKeySelected
                        ? `!bg-[#edf4fc] dark:!bg-[#1a263d] outline outline-2 outline-primary outline-offset-[-2px] ${
                            isKeyFrozen ? 'z-18' : 'z-10'
                          }`
                        : ''
                    }`}
                  >
                    {editingCell?.key === item.key && editingCell.field === 'key' ? (
                      <input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        type="text"
                        value={editingCell.value}
                        onChange={e =>
                          setEditingCell({ ...editingCell, value: e.target.value })
                        }
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-0.5 bg-background border border-primary rounded text-xs font-mono outline-none shadow-2xs"
                      />
                    ) : (
                      <div
                        className="group/keycell flex items-center justify-between gap-1.5 cursor-pointer"
                        onDoubleClick={() => handleStartEdit(item.key, 'key', item.key)}
                        title="Double-click to edit key name"
                      >
                        <span className="font-semibold truncate text-foreground">
                          {item.key}
                        </span>
                        <Pencil className="size-3 text-muted-foreground/40 opacity-0 group-hover/keycell:opacity-100 transition-opacity shrink-0" />
                      </div>
                    )}
                  </td>

                  {/* Context / Description Cell */}
                  {showDescription && (
                    <td
                      style={{ width: DESC_COL_WIDTH, minWidth: DESC_COL_WIDTH }}
                      onClick={() =>
                        setSelectedCell({
                          key: item.key,
                          field: 'description',
                          colIndex: 1,
                          rowIndex: rowIdx,
                        })
                      }
                      onContextMenu={(e) => handleCellContextMenu(e, item.key, 'description', rowIdx, 1)}
                      className={`py-1.5 px-3 text-xs bg-card group-hover:bg-[#eef2f6] dark:group-hover:bg-[#1a2234] hover:!bg-[#e2e8f0] dark:hover:!bg-[#242e44] border-b border-r border-border transition-colors cursor-pointer ${
                        selectedCell?.key === item.key && selectedCell.field === 'description'
                          ? '!bg-[#edf4fc] dark:!bg-[#1a263d] outline outline-2 outline-primary outline-offset-[-2px] z-10'
                          : ''
                      }`}
                    >
                      {editingCell?.key === item.key && editingCell.field === 'description' ? (
                        <input
                          ref={inputRef as React.RefObject<HTMLInputElement>}
                          type="text"
                          value={editingCell.value}
                          onChange={e =>
                            setEditingCell({ ...editingCell, value: e.target.value })
                          }
                          onBlur={handleSaveEdit}
                          onKeyDown={handleKeyDown}
                          placeholder="Context for translators..."
                          className="w-full px-2 py-0.5 bg-background border border-primary rounded text-xs outline-none shadow-2xs text-foreground"
                        />
                      ) : (
                        <div
                          className="min-h-[24px] flex items-center cursor-pointer"
                          onDoubleClick={() => handleStartEdit(item.key, 'description', item.description || '')}
                          title="Double-click to edit context"
                        >
                          <span
                            className={`truncate text-xs ${
                              item.description
                                ? 'text-muted-foreground'
                                : 'text-muted-foreground/40 italic'
                            }`}
                          >
                            {item.description || 'Add context...'}
                          </span>
                        </div>
                      )}
                    </td>
                  )}

                  {/* Language Translation Cells */}
                  {languages.map((lang, colIdx) => {
                    const val = item[lang] || '';
                    const isZawgyiCell = isZawgyi(val);
                    const isEditing =
                      editingCell?.key === item.key && editingCell.field === lang;
                    const isCellSelected =
                      selectedCell?.key === item.key && selectedCell.field === lang;
                    const isMyanmar = lang === 'my';
                    const isRtl = isRtlLanguage(lang);
                    const isLangFrozen = safeFrozenCount >= colIdx + 2;
                    const isLangLastFrozen = safeFrozenCount === colIdx + 2;
                    const descOffset = showDescription ? DESC_COL_WIDTH : 0;
                    let prevLangsWidth = 0;
                    for (let p = 0; p < colIdx; p++) {
                      prevLangsWidth += getLangColWidth(languages[p]);
                    }
                    const langLeft = isLangFrozen
                      ? ROW_NUM_WIDTH + (isKeyFrozen ? KEY_COL_WIDTH : 0) + descOffset + prevLangsWidth
                      : undefined;

                    const sourceLang = languages.includes('en') ? 'en' : languages[0];
                    const sourceVal = item[sourceLang] || '';
                    const varValidation =
                      lang !== sourceLang && val ? validateVariables(sourceVal, val) : { isValid: true, missingVariables: [] };

                    const hasPrevious =
                      previousValues[item.key]?.[lang] !== undefined &&
                      previousValues[item.key][lang] !== val;

                    return (
                      <td
                        key={lang}
                        dir={isRtl ? 'rtl' : 'ltr'}
                        style={{
                          width: getLangColWidth(lang),
                          minWidth: getLangColWidth(lang),
                          left: langLeft,
                        }}
                        onClick={() =>
                          setSelectedCell({
                            key: item.key,
                            field: lang,
                            colIndex: colIdx + (showDescription ? 2 : 1),
                            rowIndex: rowIdx,
                          })
                        }
                        onContextMenu={(e) =>
                          handleCellContextMenu(
                            e,
                            item.key,
                            lang,
                            rowIdx,
                            colIdx + (showDescription ? 2 : 1)
                          )
                        }
                        className={`py-2 px-3 border-b border-border transition-colors cursor-pointer bg-card group-hover:bg-[#eef2f6] dark:group-hover:bg-[#1a2234] hover:!bg-[#e2e8f0] dark:hover:!bg-[#242e44] ${
                          isLangFrozen ? 'sticky z-15' : 'relative z-0'
                        } ${getFreezeLineClass(isLangLastFrozen)} ${
                          !val
                            ? 'bg-[#fffdf2] dark:bg-[#1a1813] group-hover:bg-[#fef9c3] dark:group-hover:bg-[#282216]'
                            : ''
                        } ${
                          isCellSelected
                            ? `!bg-[#edf4fc] dark:!bg-[#1a263d] outline outline-2 outline-primary outline-offset-[-2px] ${
                                isLangFrozen ? 'z-18' : 'z-10'
                              }`
                            : ''
                        }`}
                      >
                        {/* Excel-style Corner Flag for Zawgyi warning */}
                        {isZawgyiCell && (
                          <div
                            className="absolute top-0 left-0 w-0 h-0 border-t-[8px] border-r-[8px] border-t-amber-500 border-r-transparent pointer-events-none z-20"
                            title="Zawgyi font detected"
                          />
                        )}

                        {isEditing ? (
                          <div className="w-full">
                            <textarea
                              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                              dir={isRtl ? 'rtl' : 'ltr'}
                              value={editingCell.value}
                              onChange={e =>
                                setEditingCell({ ...editingCell, value: e.target.value })
                              }
                              onBlur={handleSaveEdit}
                              onKeyDown={handleKeyDown}
                              rows={Math.max(2, editingCell.value.split('\n').length)}
                              className={`w-full px-2 py-1 bg-background border-2 border-primary rounded text-sm outline-none shadow-xs resize-y ${
                                isMyanmar ? 'leading-relaxed font-sans' : ''
                              } ${isRtl ? 'text-right font-sans' : 'text-left'}`}
                            />
                            {isZawgyi(editingCell.value) && (
                              <div className="mt-1 flex items-center justify-between">
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setEditingCell({
                                      ...editingCell,
                                      value: zawgyiToUnicode(editingCell.value),
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 px-1.5 py-0.5 rounded cursor-pointer font-medium transition-colors"
                                  title="Convert to Unicode"
                                >
                                  <AlertTriangle className="size-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span>Convert Zawgyi → Unicode</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            dir={isRtl ? 'rtl' : 'ltr'}
                            className="group/valcell min-h-[26px] flex items-start justify-between gap-1.5"
                            onDoubleClick={() => handleStartEdit(item.key, lang, val)}
                            title="Double-click to edit"
                          >
                            <div
                              className={`text-sm select-text whitespace-pre-wrap break-words flex-1 ${
                                isMyanmar
                                  ? 'leading-relaxed font-sans text-foreground'
                                  : 'text-foreground'
                              } ${!val ? 'text-amber-600/70 italic text-xs' : ''} ${
                                isRtl ? 'text-right' : 'text-left'
                              }`}
                            >
                              {val ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex flex-wrap items-baseline gap-x-0.5 leading-relaxed">
                                    {tokenizeVariables(val).map((tok, i) =>
                                      tok.isVariable ? (
                                        <span
                                          key={i}
                                          className="inline-block px-1 py-0.5 rounded bg-primary/10 text-primary font-mono text-[11px] font-semibold border border-primary/20 align-baseline select-text"
                                          title={`Interpolation Variable: ${tok.text}`}
                                        >
                                          {tok.text}
                                        </span>
                                      ) : (
                                        <span key={i}>{tok.text}</span>
                                      )
                                    )}
                                  </div>

                                  {/* Warning Badges & 1-Click Revert Button */}
                                  {(isZawgyiCell || !varValidation.isValid || hasPrevious) && (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                      {hasPrevious && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRevertCell(item.key, lang);
                                          }}
                                          className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-1.5 py-0.5 rounded cursor-pointer transition-colors shadow-2xs select-none"
                                          title={`Revert back to: "${previousValues[item.key][lang]}"`}
                                        >
                                          <Undo2 className="size-2.5 shrink-0" />
                                          <span>Revert</span>
                                        </button>
                                      )}
                                      {isZawgyiCell && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleConvertCellZawgyiToUnicode(item.key, lang);
                                          }}
                                          title="Zawgyi font detected in this cell! Click to convert to Unicode."
                                          className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/20 hover:bg-amber-500/35 text-amber-700 dark:text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-md cursor-pointer transition-all shadow-2xs select-none"
                                        >
                                          <AlertTriangle className="size-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                          <span>Zawgyi (!)</span>
                                        </button>
                                      )}
                                      {!varValidation.isValid && (
                                        <span
                                          className="inline-flex items-center gap-1 text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono shrink-0 select-none"
                                          title={`Warning: Missing variable(s) from ${sourceLang.toUpperCase()}: ${varValidation.missingVariables.join(', ')}`}
                                        >
                                          <AlertTriangle className="size-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                          <span>Missing {varValidation.missingVariables.join(', ')}</span>
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="flex items-center gap-1 font-sans not-italic text-amber-600 dark:text-amber-400">
                                  <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                                  Missing
                                </span>
                              )}
                            </div>
                            <Pencil className="size-3 text-muted-foreground/35 opacity-0 group-hover/valcell:opacity-100 transition-opacity shrink-0 mt-0.5" />
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Custom Row Actions Dropdown Menu (Frozen on Right) */}
                  <td
                    style={{ width: MENU_COL_WIDTH, minWidth: MENU_COL_WIDTH, right: 0 }}
                    className="py-1 px-1 text-center border-b border-l border-border bg-card group-hover:bg-[#eef2f6] dark:group-hover:bg-[#1a2234] sticky right-0 z-20 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.5)] transition-colors"
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Row actions for key ${item.key}`}
                          title={`Row actions for key ${item.key}`}
                          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="font-mono text-xs truncate">
                          {item.key}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {onUpdateRowStatus && (
                          <>
                            <DropdownMenuItem
                              onClick={() => onUpdateRowStatus(item.key, 'approved')}
                              className="gap-2 cursor-pointer text-xs font-medium text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 focus:bg-emerald-500/10"
                            >
                              <CheckCircle2 className="size-3.5" />
                              Mark as Approved
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onUpdateRowStatus(item.key, 'needs-review')}
                              className="gap-2 cursor-pointer text-xs font-medium text-amber-600 dark:text-amber-400 focus:text-amber-600 focus:bg-amber-500/10"
                            >
                              <AlertCircle className="size-3.5" />
                              Mark for Review
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {onOpenAiTranslate && (
                          <DropdownMenuItem
                            onClick={() => onOpenAiTranslate(undefined, item.key)}
                            className="gap-2 cursor-pointer text-xs"
                          >
                            <Sparkles className="size-3.5" />
                            Translate with AI
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleCopyText(item.key, 'key name')}
                          className="gap-2 cursor-pointer text-xs"
                        >
                          <Copy className="size-3.5" />
                          Copy Key Name
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const translations = languages
                              .map(l => `${l.toUpperCase()}: ${item[l] || ''}`)
                              .join('\n');
                            handleCopyText(translations, 'all translations');
                          }}
                          className="gap-2 cursor-pointer text-xs"
                        >
                          <CopyCheck className="size-3.5" />
                          Copy All Translations
                        </DropdownMenuItem>
                        {onDuplicateRow && (
                          <DropdownMenuItem
                            onClick={() => onDuplicateRow(item)}
                            className="gap-2 cursor-pointer text-xs"
                          >
                            <Layers className="size-3.5" />
                            Duplicate Row
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            for (const l of languages) {
                              handleInternalUpdateCell(item.key, l, '');
                            }
                          }}
                          className="gap-2 cursor-pointer text-xs"
                        >
                          <Eraser className="size-3.5" />
                          Clear Translations
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteRow(item.key)}
                          className="gap-2 text-destructive focus:text-destructive cursor-pointer text-xs"
                        >
                          <Trash2 className="size-3.5" />
                          Delete Row
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Cell Right-Click Context Menu (Custom DropdownMenu Component) */}
      {contextMenu && (
        <DropdownMenu
          open={!!contextMenu}
          onOpenChange={(open) => {
            if (!open) setContextMenu(null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <div
              style={{
                position: 'fixed',
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`,
                width: 1,
                height: 1,
                pointerEvents: 'none',
                visibility: 'hidden',
              }}
              tabIndex={-1}
              aria-hidden="true"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="bottom"
            sideOffset={2}
            className="w-56 shadow-2xl"
          >
            {(() => {
              const currentItem = items.find(i => i.key === contextMenu.key);
              if (!currentItem) return null;

              const isKeyField = contextMenu.field === 'key';
              const isDescField = contextMenu.field === 'description';
              const isLangField = !isKeyField && !isDescField;
              const cellValue = isKeyField
                ? currentItem.key
                : isDescField
                ? currentItem.description || ''
                : currentItem[contextMenu.field] || '';
              const hasVal = Boolean(cellValue);
              const isMyanmar = contextMenu.field === 'my';
              const isZawgyiValue = hasVal && isZawgyi(cellValue);
              const prevVal = !isKeyField && !isDescField
                ? previousValues[contextMenu.key]?.[contextMenu.field]
                : undefined;
              const hasPrevious = prevVal !== undefined && prevVal !== cellValue;

              return (
                <>
                  {/* Context Header */}
                  <DropdownMenuLabel className="font-mono text-xs flex items-center justify-between gap-2">
                    <span className="truncate">{currentItem.key}</span>
                    <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase shrink-0">
                      {contextMenu.field}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Edit Cell */}
                  <DropdownMenuItem
                    onClick={() => handleStartEdit(currentItem.key, contextMenu.field, cellValue)}
                    className="gap-2 cursor-pointer text-xs"
                  >
                    <Pencil className="size-3.5" />
                    <span>Edit Cell</span>
                  </DropdownMenuItem>

                  {/* Copy & Paste */}
                  <DropdownMenuItem
                    onClick={() => handleCopyText(cellValue, isKeyField ? 'key name' : `${contextMenu.field} value`)}
                    className="gap-2 cursor-pointer text-xs"
                    disabled={!cellValue}
                  >
                    <Copy className="size-3.5" />
                    <span>Copy Cell Value</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handlePasteFromClipboard(currentItem.key, contextMenu.field)}
                    className="gap-2 cursor-pointer text-xs"
                  >
                    <ClipboardPaste className="size-3.5" />
                    <span>Paste into Cell</span>
                  </DropdownMenuItem>

                  {/* Clear Cell (if language or description) */}
                  {!isKeyField && (
                    <DropdownMenuItem
                      onClick={() => handleInternalUpdateCell(currentItem.key, contextMenu.field, '')}
                      className="gap-2 cursor-pointer text-xs"
                      disabled={!cellValue}
                    >
                      <Eraser className="size-3.5" />
                      <span>Clear Cell</span>
                    </DropdownMenuItem>
                  )}

                  {/* 1-Click Revert (if previous value exists) */}
                  {hasPrevious && (
                    <DropdownMenuItem
                      onClick={() => handleRevertCell(currentItem.key, contextMenu.field)}
                      className="gap-2 cursor-pointer text-xs"
                    >
                      <Undo2 className="size-3.5" />
                      <span>Revert to Previous</span>
                    </DropdownMenuItem>
                  )}

                  {/* AI Translation & Myanmar Font actions for language cells */}
                  {isLangField && (
                    <>
                      <DropdownMenuSeparator />
                      {onOpenAiTranslate && (
                        <DropdownMenuItem
                          onClick={() => onOpenAiTranslate(contextMenu.field, currentItem.key)}
                          className="gap-2 cursor-pointer text-xs"
                        >
                          <Sparkles className="size-3.5" />
                          <span>Translate with AI ({contextMenu.field.toUpperCase()})</span>
                        </DropdownMenuItem>
                      )}

                      {(isMyanmar || isZawgyiValue) && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleConvertCellZawgyiToUnicode(currentItem.key, contextMenu.field)}
                            className="gap-2 cursor-pointer text-xs"
                            disabled={!cellValue}
                          >
                            <AlertTriangle className="size-3.5" />
                            <span>Convert Zawgyi → Unicode</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (cellValue) {
                                handleInternalUpdateCell(
                                  currentItem.key,
                                  contextMenu.field,
                                  unicodeToZawgyi(cellValue)
                                );
                                setCopiedNotification('Converted cell to Zawgyi');
                                setTimeout(() => setCopiedNotification(null), 1500);
                              }
                            }}
                            className="gap-2 cursor-pointer text-xs"
                            disabled={!cellValue}
                          >
                            <Type className="size-3.5" />
                            <span>Convert Unicode → Zawgyi</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}

                  {/* Row Management Separator */}
                  <DropdownMenuSeparator />

                  {/* Row Review Status */}
                  {onUpdateRowStatus && (
                    <>
                      {currentItem.status !== 'approved' && (
                        <DropdownMenuItem
                          onClick={() => onUpdateRowStatus(currentItem.key, 'approved')}
                          className="gap-2 cursor-pointer text-xs font-medium text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 focus:bg-emerald-500/10"
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>Mark Row as Approved</span>
                        </DropdownMenuItem>
                      )}
                      {currentItem.status !== 'needs-review' && (
                        <DropdownMenuItem
                          onClick={() => onUpdateRowStatus(currentItem.key, 'needs-review')}
                          className="gap-2 cursor-pointer text-xs font-medium text-amber-600 dark:text-amber-400 focus:text-amber-600 focus:bg-amber-500/10"
                        >
                          <AlertCircle className="size-3.5" />
                          <span>Mark Row for Review</span>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  {/* Row duplication and key copy */}
                  <DropdownMenuItem
                    onClick={() => handleCopyText(currentItem.key, 'key name')}
                    className="gap-2 cursor-pointer text-xs"
                  >
                    <ClipboardCopy className="size-3.5" />
                    <span>Copy Key Name</span>
                  </DropdownMenuItem>
                  {onDuplicateRow && (
                    <DropdownMenuItem
                      onClick={() => onDuplicateRow(currentItem)}
                      className="gap-2 cursor-pointer text-xs"
                    >
                      <Layers className="size-3.5" />
                      <span>Duplicate Row</span>
                    </DropdownMenuItem>
                  )}

                  {/* Delete Row */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDeleteRow(currentItem.key)}
                    className="gap-2 text-destructive focus:text-destructive cursor-pointer text-xs font-medium"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete Row</span>
                  </DropdownMenuItem>
                </>
              );
            })()}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Excel Bottom Status Bar with Reset Widths option */}
      <HorizontalScrollContainer
        gradientFrom="from-[#f4f4f5] dark:from-[#18181b]"
        wrapperClassName="bg-[#f4f4f5] dark:bg-[#18181b] text-[11px] sm:text-xs border-t border-border select-none shrink-0"
        className="justify-between gap-2 sm:gap-3 px-2.5 sm:px-4 py-1 sm:py-1.5 h-full min-w-full"
      >
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="font-medium text-foreground whitespace-nowrap">
            <span className="font-bold">{items.length.toLocaleString()}</span> keys
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground whitespace-nowrap">
            <span className="hidden sm:inline">Languages ({languages.length}): </span>
            <span className="font-semibold text-foreground">
              {languages.map(l => l.toUpperCase()).join(', ')}
            </span>
          </span>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
            <Pin className="size-3 text-primary shrink-0" />
            <span className="hidden sm:inline">Freeze:</span>
            <button
              onClick={() => setFrozenCount(safeFrozenCount > 0 ? 0 : 1)}
              className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer"
              title="Click to toggle freeze panes"
            >
              {safeFrozenCount === 0
                ? 'None'
                : safeFrozenCount === 1
                ? 'Key'
                : `Key + ${languages.slice(0, safeFrozenCount - 1).map(l => l.toUpperCase()).join(', ')}`}
            </button>
            {safeFrozenCount > 0 && (
              <button
                onClick={() => setFrozenCount(0)}
                className="text-[10px] text-muted-foreground hover:text-destructive ml-0.5 cursor-pointer"
                title="Unfreeze all columns"
              >
                (✕)
              </button>
            )}
          </div>
          <span className="text-muted-foreground">•</span>
          <button
            onClick={handleResetColumnWidths}
            className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            title="Reset custom column widths to defaults"
          >
            Reset Widths
          </button>
          <span className="text-muted-foreground hidden lg:inline">•</span>
          <span className="text-muted-foreground hidden lg:flex items-center gap-1.5 text-[11px]">
            Developed with <Heart className="size-3 text-rose-500 fill-rose-500 inline shrink-0" /> by{' '}
            <span className="font-semibold text-foreground">Pyae Phyo Maung</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
          <button
            onClick={onAddRow}
            className="flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer whitespace-nowrap text-[11px] sm:text-xs"
          >
            <Plus className="size-3" />
            <span>Add Row</span>
          </button>
          <span className="text-muted-foreground hidden md:inline">•</span>
          <span className="text-[11px] text-muted-foreground hidden md:inline whitespace-nowrap">
            Arrows to navigate • Double click or Enter to edit
          </span>
        </div>
      </HorizontalScrollContainer>

      {/* Rename Language Column Modal */}
      <Dialog
        open={Boolean(renameLangTarget)}
        onOpenChange={open => {
          if (!open) setRenameLangTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Rename Language Column
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Change the column code for <code className="font-mono text-primary font-bold">{renameLangTarget?.toUpperCase()}</code> across the active project.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={e => {
              e.preventDefault();
              const trimmed = renameLangValue.trim().toLowerCase();
              if (
                renameLangTarget &&
                trimmed &&
                trimmed !== renameLangTarget.toLowerCase()
              ) {
                onRenameLanguage?.(renameLangTarget, trimmed);
              }
              setRenameLangTarget(null);
            }}
          >
            <DialogBody className="space-y-3 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Language Code:
                </label>
                <Input
                  value={renameLangValue}
                  onChange={e => setRenameLangValue(e.target.value)}
                  placeholder="e.g. es, fr, ja, th"
                  className="h-8 text-xs font-mono"
                  autoFocus
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRenameLangTarget(null)}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  !renameLangValue.trim() ||
                  renameLangValue.trim().toLowerCase() ===
                    renameLangTarget?.toLowerCase()
                }
                className="h-8 text-xs font-semibold cursor-pointer"
              >
                Rename Column
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
