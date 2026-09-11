import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, FileSpreadsheet, X } from 'lucide-react';
import {
  parseJsonFile,
  parseSpreadsheet,
  parseAndroidXml,
  parseIosStrings,
  parseYamlFile,
  mergeTranslations,
} from '@/lib/parser';
import { TranslationItem } from '@/types';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentItems: TranslationItem[];
  currentLanguages: string[];
  onImportComplete: (items: TranslationItem[], languages: string[]) => void;
}

interface LoadedFile {
  name: string;
  size: number;
  type: 'json' | 'excel' | 'csv' | 'yaml' | 'xml' | 'strings';
  data: { [lang: string]: Record<string, string> } | { items: TranslationItem[]; languages: string[] };
}

export const ImportModal: React.FC<ImportModalProps> = ({
  open,
  onOpenChange,
  currentItems,
  currentLanguages,
  onImportComplete,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setLoadedFiles([]);
    setError(null);
    setIsProcessing(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  const processFiles = async (files: FileList | File[]) => {
    setError(null);
    setIsProcessing(true);

    const newLoadedFiles: LoadedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'json' || ext === 'jsonlink') {
          const text = await file.text();
          const parsed = parseJsonFile(text, file.name);
          newLoadedFiles.push({
            name: file.name,
            size: file.size,
            type: 'json',
            data: parsed,
          });
        } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
          const buffer = await file.arrayBuffer();
          const parsed = parseSpreadsheet(buffer);
          newLoadedFiles.push({
            name: file.name,
            size: file.size,
            type: ext === 'csv' ? 'csv' : 'excel',
            data: parsed,
          });
        } else if (ext === 'xml') {
          const text = await file.text();
          const parsed = parseAndroidXml(text, file.name);
          newLoadedFiles.push({
            name: file.name,
            size: file.size,
            type: 'xml',
            data: parsed,
          });
        } else if (ext === 'strings') {
          const text = await file.text();
          const parsed = parseIosStrings(text, file.name);
          newLoadedFiles.push({
            name: file.name,
            size: file.size,
            type: 'strings',
            data: parsed,
          });
        } else if (ext === 'yaml' || ext === 'yml') {
          const text = await file.text();
          const parsed = parseYamlFile(text, file.name);
          newLoadedFiles.push({
            name: file.name,
            size: file.size,
            type: 'yaml',
            data: parsed,
          });
        } else {
          setError(`File format not supported: ${file.name}. Please upload .json, .jsonlink, .xlsx, .csv, .yaml, .xml, or .strings`);
        }
      }

      setLoadedFiles(prev => [...prev, ...newLoadedFiles]);
    } catch (err: any) {
      setError(err?.message || 'Failed to parse file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setLoadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    if (loadedFiles.length === 0) return;

    let baseItems = importMode === 'replace' ? [] : [...currentItems];
    let baseLanguages = importMode === 'replace' ? [] : [...currentLanguages];

    for (const file of loadedFiles) {
      if (
        file.type === 'json' ||
        file.type === 'yaml' ||
        file.type === 'xml' ||
        file.type === 'strings'
      ) {
        const jsonData = file.data as { [lang: string]: Record<string, string> };
        const res = mergeTranslations(baseItems, baseLanguages, jsonData);
        baseItems = res.items;
        baseLanguages = res.languages;
      } else {
        const spreadsheetData = file.data as { items: TranslationItem[]; languages: string[] };
        const res = mergeTranslations(
          baseItems,
          baseLanguages,
          spreadsheetData.languages.reduce((acc, lang) => {
            acc[lang] = {};
            for (const item of spreadsheetData.items) {
              acc[lang][item.key] = item[lang] || '';
            }
            return acc;
          }, {} as Record<string, Record<string, string>>)
        );
        baseItems = res.items;
        baseLanguages = res.languages;
        // Preserve developer context / descriptions from spreadsheet items
        const baseMap = new Map(baseItems.map(b => [b.key, b]));
        for (const item of spreadsheetData.items) {
          if (item.description && baseMap.has(item.key)) {
            const target = baseMap.get(item.key)!;
            if (!target.description) {
              target.description = item.description;
            }
          }
        }
      }
    }

    onImportComplete(baseItems, baseLanguages);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Translations</DialogTitle>
          <DialogDescription>
            Upload your language JSON files (e.g. <code className="text-primary font-mono text-xs">en.json</code> and <code className="text-primary font-mono text-xs">my.json</code>) or an Excel (.xlsx) / CSV file.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 text-xs">
          {/* Dropzone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".json,.jsonlink,.xlsx,.xls,.csv,.yaml,.yml,.xml,.strings"
              className="hidden"
            />
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <UploadCloud className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Click to browse or drop your translation files here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports <span className="font-mono text-emerald-600 font-semibold">.jsonlink</span>, <span className="font-mono text-primary font-semibold">JSON</span>, Excel, CSV, YAML, Android XML, or iOS Strings
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Staged files list */}
          {loadedFiles.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Ready to Import ({loadedFiles.length} files)</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {loadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg border border-border bg-card text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {file.type === 'json' ? (
                        <FileText className="size-4 text-primary shrink-0" />
                      ) : (
                        <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
                      )}
                      <span className="font-semibold truncate">{file.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="p-1 hover:bg-muted text-muted-foreground hover:text-destructive rounded cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Import Options */}
              <div className="flex flex-col gap-2 border-t border-border pt-3 mt-1">
                <div className="text-xs font-semibold">Import Mode:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      importMode === 'merge'
                        ? 'border-primary bg-primary/10 font-semibold'
                        : 'border-border hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    <div className="text-foreground font-semibold">Merge with Current Data</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Adds new keys and updates translations
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      importMode === 'replace'
                        ? 'border-destructive bg-destructive/10 font-semibold'
                        : 'border-border hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    <div className="text-destructive font-semibold">Replace All Data</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Clears current table and loads fresh
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)} className="flex-1 sm:flex-none text-xs h-8">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={loadedFiles.length === 0 || isProcessing}
            variant={loadedFiles.length === 0 || isProcessing ? 'outline' : 'default'}
            className={`flex-1 sm:flex-none gap-1.5 text-xs h-8 ${
              loadedFiles.length === 0 || isProcessing
                ? 'font-medium text-muted-foreground border-dashed'
                : 'font-semibold shadow-xs'
            }`}
          >
            <CheckCircle2 className="size-3.5" />
            <span>Apply Import</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
