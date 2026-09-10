import React, { useState, useRef, useEffect } from 'react';
import { TranslationItem } from '@/types';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { exportSingleLanguageJson } from '@/lib/exporter';

interface SpreadsheetTableProps {
  items: TranslationItem[];
  languages: string[];
  onUpdateCell: (key: string, lang: string, value: string) => void;
  onUpdateKey: (oldKey: string, newKey: string) => void;
  onDeleteRow: (key: string) => void;
  onAddRow: () => void;
  onOpenImport: () => void;
  onDeleteLanguage?: (lang: string) => void;
  onDuplicateRow?: (item: TranslationItem) => void;
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

// Convert column index to Excel column letters (0 -> A, 1 -> B, etc.)
function getColumnLetter(colIndex: number): string {
  let letter = '';
  while (colIndex >= 0) {
    letter = String.fromCharCode((colIndex % 26) + 65) + letter;
    colIndex = Math.floor(colIndex / 26) - 1;
  }
  return letter;
}

export const SpreadsheetTable: React.FC<SpreadsheetTableProps> = ({
  items,
  languages,
  onUpdateCell,
  onUpdateKey,
  onDeleteRow,
  onAddRow,
  onOpenImport,
  onDeleteLanguage,
  onDuplicateRow,
}) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(() => {
    if (items.length > 0) {
      return { key: items[0].key, field: 'key', colIndex: 0, rowIndex: 0 };
    }
    return null;
  });
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  // Frozen columns state: 0 = unfreeze all, 1 = freeze Key (default), 2+ = freeze up to language idx + 2
  const [frozenCount, setFrozenCount] = useState<number>(1);
  const safeFrozenCount = Math.min(frozenCount, languages.length + 1);

  const isKeyFrozen = safeFrozenCount >= 1;
  const isKeyLastFrozen = safeFrozenCount === 1;

  const ROW_NUM_WIDTH = 48;
  const KEY_COL_WIDTH = 280;
  const LANG_COL_WIDTH = 280;
  const MENU_COL_WIDTH = 56;

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
      onUpdateCell(editingCell.key, editingCell.field, editingCell.value);
    }

    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 1500);
  };

  // Find currently selected cell's value for the MS Excel Formula bar
  const selectedValue = selectedCell
    ? selectedCell.field === 'key'
      ? selectedCell.key
      : items.find(i => i.key === selectedCell.key)?.[selectedCell.field] || ''
    : '';

  // If no items in table, display empty-state CTA
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none bg-background">
        <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-xs">
          <KeyRound className="size-8 stroke-[1.5]" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          No translation spreadsheet loaded
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mt-1.5 mb-6 leading-relaxed">
          Drag and drop your JSON files (<code className="font-mono text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded">en.json</code>, <code className="font-mono text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded">my.json</code>) or an Excel (.xlsx) file to open the spreadsheet table.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onOpenImport} size="lg" className="gap-2 shadow-sm font-semibold">
            <FileUp className="size-4" />
            Upload Translation Files
          </Button>
          <Button onClick={onAddRow} variant="outline" size="lg" className="gap-2">
            <Plus className="size-4" />
            Add First Key
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full min-h-0 select-none bg-background">
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
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            placeholder="Select a cell to view or edit text..."
            className="w-full h-7 px-2.5 bg-background border border-border rounded text-xs text-foreground outline-none focus:ring-1 focus:ring-primary shadow-2xs font-sans"
          />
        </div>

        {copiedNotification && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-in fade-in">
            <Check className="size-3" />
            <span>Copied {copiedNotification}</span>
          </div>
        )}
      </div>

      {/* True Excel Spreadsheet Table: Edge-to-edge, Horizontal Scroll on Overflow, Dynamic Freeze Panes */}
      <div className="flex-1 overflow-auto relative w-full h-full bg-background">
        <table className="min-w-full w-max border-separate border-spacing-0 text-left">
          {/* Column widths group to ensure columns never squish on multiple languages */}
          <colgroup>
            <col style={{ width: ROW_NUM_WIDTH, minWidth: ROW_NUM_WIDTH }} />
            <col style={{ width: KEY_COL_WIDTH, minWidth: KEY_COL_WIDTH }} />
            {languages.map(lang => (
              <col key={lang} style={{ width: LANG_COL_WIDTH, minWidth: LANG_COL_WIDTH }} />
            ))}
            <col style={{ width: MENU_COL_WIDTH, minWidth: MENU_COL_WIDTH }} />
          </colgroup>

          {/* Top Column Headers */}
          <thead className="sticky top-0 z-30 shadow-xs">
            <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {/* Row Number Header */}
              <th
                style={{ width: ROW_NUM_WIDTH, minWidth: ROW_NUM_WIDTH, left: 0 }}
                className={`py-2.5 px-2 text-center bg-[#f4f4f5] dark:bg-[#18181b] sticky top-0 left-0 z-40 select-none border-b border-border ${getFreezeLineClass(safeFrozenCount === 0)}`}
              >
                #
              </th>

              {/* Translation Key Header */}
              <th
                style={{
                  width: KEY_COL_WIDTH,
                  minWidth: KEY_COL_WIDTH,
                  left: isKeyFrozen ? ROW_NUM_WIDTH : undefined,
                }}
                className={`py-2.5 px-3 bg-[#f4f4f5] dark:bg-[#18181b] sticky top-0 ${
                  isKeyFrozen ? 'left-12 z-40' : 'z-30'
                } border-b border-border ${getFreezeLineClass(isKeyLastFrozen)}`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                      A
                    </span>
                    <span className="font-bold text-foreground">Translation Key</span>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-mono cursor-pointer border border-border/70 bg-background shrink-0">
                        <span>KEY</span>
                        <ChevronDown className="size-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
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
                            <Pin className="size-3.5 text-muted-foreground" />
                            <span>Freeze Key Column</span>
                          </>
                        )}
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
              </th>

              {/* Language Column Headers */}
              {languages.map((lang, idx) => {
                const isLangFrozen = safeFrozenCount >= idx + 2;
                const isLangLastFrozen = safeFrozenCount === idx + 2;
                const langLeft = isLangFrozen
                  ? ROW_NUM_WIDTH + (isKeyFrozen ? KEY_COL_WIDTH : 0) + idx * LANG_COL_WIDTH
                  : undefined;

                return (
                  <th
                    key={lang}
                    style={{
                      width: LANG_COL_WIDTH,
                      minWidth: LANG_COL_WIDTH,
                      left: langLeft,
                    }}
                    className={`py-2.5 px-3 bg-[#f4f4f5] dark:bg-[#18181b] sticky top-0 ${
                      isLangFrozen ? 'z-40' : 'z-30'
                    } border-b border-border ${getFreezeLineClass(isLangLastFrozen)}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded shrink-0">
                          {getColumnLetter(idx + 1)}
                        </span>
                        <span className="font-bold text-foreground tracking-wide shrink-0">
                          {lang.toUpperCase()}
                        </span>
                        <span className="text-[11px] font-normal text-muted-foreground truncate">
                          {lang === 'my' ? '(မြန်မာ)' : lang === 'en' ? '(English)' : ''}
                        </span>
                      </div>

                      {/* Custom Column Header Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-mono cursor-pointer border border-border/70 bg-background shrink-0">
                            <span className="uppercase font-bold">{lang}</span>
                            <ChevronDown className="size-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel>Column: {lang.toUpperCase()}</DropdownMenuLabel>
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
                                <Pin className="size-3.5 text-muted-foreground" />
                                <span>Freeze up to {lang.toUpperCase()} Column</span>
                              </>
                            )}
                          </DropdownMenuItem>
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
                            className="gap-2 cursor-pointer"
                          >
                            <Download className="size-3.5" />
                            Download {lang}.json
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const allVals = items.map(i => i[lang] || '').join('\n');
                              handleCopyText(allVals, `all ${lang.toUpperCase()} values`);
                            }}
                            className="gap-2 cursor-pointer"
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
                  </th>
                );
              })}

              {/* Action Column Header (Frozen on Right) */}
              <th
                style={{ width: MENU_COL_WIDTH, minWidth: MENU_COL_WIDTH, right: 0 }}
                className="py-2.5 px-2 text-center bg-[#f4f4f5] dark:bg-[#18181b] sticky top-0 right-0 z-40 select-none border-b border-l border-border shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.5)]"
              >
                Menu
              </th>
            </tr>
          </thead>

          {/* Full Spreadsheet Body */}
          <tbody className="text-sm font-sans">
            {items.map((item, rowIdx) => {
              const rowNumber = rowIdx + 1;
              const isKeySelected =
                selectedCell?.key === item.key && selectedCell.field === 'key';

              return (
                <tr
                  key={item.key}
                  className="group transition-colors"
                >
                  {/* Row Number */}
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
                    className={`py-1.5 px-2 text-center text-xs font-mono text-muted-foreground bg-[#fafafa] dark:bg-[#121214] group-hover:bg-[#e2e8f0] dark:group-hover:bg-[#222736] group-hover:text-foreground sticky left-0 z-20 select-none cursor-pointer transition-colors border-b border-border ${getFreezeLineClass(safeFrozenCount === 0)}`}
                  >
                    {rowNumber}
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
                    className={`py-1.5 px-3 font-mono text-xs bg-card group-hover:bg-[#eef2f6] dark:group-hover:bg-[#1a2234] hover:!bg-[#e2e8f0] dark:hover:!bg-[#242e44] ${
                      isKeyFrozen ? 'sticky z-20' : 'relative z-0'
                    } border-b border-border transition-colors cursor-pointer ${getFreezeLineClass(isKeyLastFrozen)} ${
                      isKeySelected
                        ? '!bg-primary/10 dark:!bg-primary/25 outline outline-2 outline-primary outline-offset-[-2px] z-22'
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
                        className="flex items-center justify-between gap-1.5 cursor-pointer"
                        onDoubleClick={() => handleStartEdit(item.key, 'key', item.key)}
                        title="Double-click to edit key name"
                      >
                        <span className="font-semibold truncate text-foreground">
                          {item.key}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Language Translation Cells */}
                  {languages.map((lang, colIdx) => {
                    const val = item[lang] || '';
                    const isEditing =
                      editingCell?.key === item.key && editingCell.field === lang;
                    const isCellSelected =
                      selectedCell?.key === item.key && selectedCell.field === lang;
                    const isMyanmar = lang === 'my';
                    const isLangFrozen = safeFrozenCount >= colIdx + 2;
                    const isLangLastFrozen = safeFrozenCount === colIdx + 2;
                    const langLeft = isLangFrozen
                      ? ROW_NUM_WIDTH + (isKeyFrozen ? KEY_COL_WIDTH : 0) + colIdx * LANG_COL_WIDTH
                      : undefined;

                    return (
                      <td
                        key={lang}
                        style={{
                          width: LANG_COL_WIDTH,
                          minWidth: LANG_COL_WIDTH,
                          left: langLeft,
                        }}
                        onClick={() =>
                          setSelectedCell({
                            key: item.key,
                            field: lang,
                            colIndex: colIdx + 1,
                            rowIndex: rowIdx,
                          })
                        }
                        className={`py-1.5 px-3 border-b border-border transition-colors cursor-pointer bg-card group-hover:bg-[#eef2f6] dark:group-hover:bg-[#1a2234] hover:!bg-[#e2e8f0] dark:hover:!bg-[#242e44] ${
                          isLangFrozen ? 'sticky z-20' : 'relative z-0'
                        } ${getFreezeLineClass(isLangLastFrozen)} ${
                          !val
                            ? 'bg-amber-500/5 dark:bg-amber-500/10 group-hover:bg-amber-500/10 dark:group-hover:bg-amber-500/20'
                            : ''
                        } ${
                          isCellSelected
                            ? `!bg-primary/10 dark:!bg-primary/25 outline outline-2 outline-primary outline-offset-[-2px] ${isLangFrozen ? 'z-22' : 'z-10'}`
                            : ''
                        }`}
                      >
                        {isEditing ? (
                          <textarea
                            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                            value={editingCell.value}
                            onChange={e =>
                              setEditingCell({ ...editingCell, value: e.target.value })
                            }
                            onBlur={handleSaveEdit}
                            onKeyDown={handleKeyDown}
                            rows={Math.max(2, editingCell.value.split('\n').length)}
                            className={`w-full px-2 py-1 bg-background border-2 border-primary rounded text-sm outline-none shadow-xs resize-y ${
                              isMyanmar ? 'leading-relaxed font-sans' : ''
                            }`}
                          />
                        ) : (
                          <div
                            className="min-h-[26px] flex items-start justify-between gap-1"
                            onDoubleClick={() => handleStartEdit(item.key, lang, val)}
                            title="Double-click to edit"
                          >
                            <div
                              className={`text-sm select-text whitespace-pre-wrap break-words flex-1 ${
                                isMyanmar
                                  ? 'leading-relaxed font-sans text-foreground'
                                  : 'text-foreground'
                              } ${!val ? 'text-amber-600/70 italic text-xs' : ''}`}
                            >
                              {val ? (
                                val
                              ) : (
                                <span className="flex items-center gap-1 font-sans not-italic text-amber-600 dark:text-amber-400">
                                  <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                                  Missing
                                </span>
                              )}
                            </div>
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
                        <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="font-mono text-xs truncate">
                          {item.key}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
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
                              onUpdateCell(item.key, l, '');
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
            })}
          </tbody>
        </table>
      </div>

      {/* Excel Bottom Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#f4f4f5] dark:bg-[#18181b] text-xs border-t border-border select-none">
        <div className="flex items-center gap-3">
          <span className="font-medium text-foreground">
            Total: <span className="font-bold">{items.length.toLocaleString()}</span> keys
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            Languages ({languages.length}):{' '}
            <span className="font-semibold text-foreground">
              {languages.map(l => l.toUpperCase()).join(', ')}
            </span>
          </span>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Pin className="size-3 text-muted-foreground shrink-0" />
            <span>Freeze:</span>
            <button
              onClick={() => setFrozenCount(safeFrozenCount > 0 ? 0 : 1)}
              className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer"
              title="Click to toggle freeze panes"
            >
              {safeFrozenCount === 0
                ? 'None'
                : safeFrozenCount === 1
                ? 'Key (Col A)'
                : `Key + ${languages.slice(0, safeFrozenCount - 1).map(l => l.toUpperCase()).join(', ')}`}
            </button>
            {safeFrozenCount > 0 && (
              <button
                onClick={() => setFrozenCount(0)}
                className="text-[10px] text-muted-foreground hover:text-destructive ml-0.5 cursor-pointer"
                title="Unfreeze all columns"
              >
                (Unfreeze)
              </button>
            )}
          </div>
          <span className="text-muted-foreground hidden lg:inline">•</span>
          <span className="text-muted-foreground hidden lg:flex items-center gap-1.5 text-[11px]">
            Developed with <Heart className="size-3 text-rose-500 fill-rose-500 inline shrink-0" /> by{' '}
            <span className="font-semibold text-foreground">Pyae Phyo Maung</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onAddRow}
            className="flex items-center gap-1 text-primary hover:underline font-medium cursor-pointer"
          >
            <Plus className="size-3" />
            Add Row
          </button>
          <span className="text-muted-foreground">•</span>
          <span className="text-[11px] text-muted-foreground">
            Double click cell to edit • Press Enter to save
          </span>
        </div>
      </div>
    </div>
  );
};
