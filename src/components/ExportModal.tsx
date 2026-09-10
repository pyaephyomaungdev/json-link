import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  FileSpreadsheet,
  FileText,
  Archive,
  Download,
  Check,
  Copy,
} from 'lucide-react';
import { TranslationItem, ExportOptions } from '@/types';
import {
  exportToExcel,
  exportToCsv,
  exportToJsonZip,
  exportToCombinedJson,
  generateLanguageJsonData,
} from '@/lib/exporter';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: TranslationItem[];
  languages: string[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onOpenChange,
  items,
  languages,
}) => {
  const [activeTab, setActiveTab] = useState<'excel' | 'csv' | 'json-zip' | 'json-combined'>('excel');
  const [nested, setNested] = useState(false);
  const [indent, setIndent] = useState(2);
  const [filename, setFilename] = useState('translations');
  const [previewLang, setPreviewLang] = useState(languages[0] || 'en');
  const [copied, setCopied] = useState(false);

  // Live preview for JSON
  const previewJson = useMemo(() => {
    if (activeTab === 'json-combined') {
      const combined: Record<string, any> = {};
      for (const lang of languages) {
        combined[lang] = generateLanguageJsonData(items.slice(0, 10), lang, nested);
      }
      return JSON.stringify(combined, null, indent);
    } else {
      const langData = generateLanguageJsonData(items.slice(0, 10), previewLang, nested);
      return JSON.stringify(langData, null, indent);
    }
  }, [items, previewLang, nested, indent, activeTab, languages]);

  const handleExport = async () => {
    const options: ExportOptions = {
      format: activeTab,
      nested,
      indent,
      includeMissing: true,
      filename,
    };

    if (activeTab === 'excel') {
      exportToExcel(items, languages, `${filename}.xlsx`);
    } else if (activeTab === 'csv') {
      exportToCsv(items, languages, `${filename}.csv`);
    } else if (activeTab === 'json-zip') {
      await exportToJsonZip(items, languages, options, `${filename}_json.zip`);
    } else if (activeTab === 'json-combined') {
      exportToCombinedJson(items, languages, options, `${filename}.json`);
    }

    onOpenChange(false);
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(previewJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Translations</DialogTitle>
          <DialogDescription>
            Download your translations into Excel, CSV, or formatted JSON files.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as any)}
          className="w-full mt-2"
        >
          <TabsList className="grid grid-cols-4 w-full h-11">
            <TabsTrigger value="excel" className="gap-1.5 text-xs">
              <FileSpreadsheet className="size-3.5 text-emerald-600" />
              Excel (.xlsx)
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-1.5 text-xs">
              <FileText className="size-3.5 text-blue-500" />
              CSV (.csv)
            </TabsTrigger>
            <TabsTrigger value="json-zip" className="gap-1.5 text-xs">
              <Archive className="size-3.5 text-amber-500" />
              JSON Files (ZIP)
            </TabsTrigger>
            <TabsTrigger value="json-combined" className="gap-1.5 text-xs">
              <FileText className="size-3.5 text-purple-500" />
              Single JSON
            </TabsTrigger>
          </TabsList>

          {/* Excel Tab */}
          <TabsContent value="excel" className="pt-3 space-y-4">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-foreground">
              <p className="font-semibold text-emerald-800 dark:text-emerald-400">
                Microsoft Excel Workbook (.xlsx)
              </p>
              <p className="text-muted-foreground mt-1">
                Generates a multi-column spreadsheet with columns for Key and each language ({languages.join(', ')}). Formatted with styled header and auto column width.
              </p>
            </div>
          </TabsContent>

          {/* CSV Tab */}
          <TabsContent value="csv" className="pt-3 space-y-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-foreground">
              <p className="font-semibold text-blue-800 dark:text-blue-400">
                Comma Separated Values (UTF-8 with BOM)
              </p>
              <p className="text-muted-foreground mt-1">
                Compatible with Excel, Google Sheets, LibreOffice, and data pipelines. Embedded with UTF-8 BOM so Myanmar Unicode never turns into question marks or garbled text!
              </p>
            </div>
          </TabsContent>

          {/* JSON ZIP Tab */}
          <TabsContent value="json-zip" className="pt-3 space-y-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-foreground">
              <p className="font-semibold text-amber-800 dark:text-amber-400">
                Separate JSON Files in ZIP Archive
              </p>
              <p className="text-muted-foreground mt-1">
                Creates a <code className="font-mono">.zip</code> containing individual files: {languages.map(l => `${l}.json`).join(', ')}.
              </p>
            </div>
          </TabsContent>

          {/* Single JSON Tab */}
          <TabsContent value="json-combined" className="pt-3 space-y-4">
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-foreground">
              <p className="font-semibold text-purple-800 dark:text-purple-400">
                Single Unified JSON File
              </p>
              <p className="text-muted-foreground mt-1">
                Combines all languages into a single JSON object (e.g. <code className="font-mono">{`{ "en": {...}, "my": {...} }`}</code>).
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Options & Filename */}
        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-foreground">File Name:</label>
            <Input
              value={filename}
              onChange={e => setFilename(e.target.value)}
              placeholder="translations"
              className="text-xs h-8"
            />
          </div>

          {(activeTab === 'json-zip' || activeTab === 'json-combined') && (
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-foreground">JSON Structure & Indent:</label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNested(false)}
                  className={`px-2.5 py-1 rounded border text-xs cursor-pointer transition-colors ${
                    !nested ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'
                  }`}
                >
                  Flat Keys
                </button>
                <button
                  type="button"
                  onClick={() => setNested(true)}
                  className={`px-2.5 py-1 rounded border text-xs cursor-pointer transition-colors ${
                    nested ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'
                  }`}
                >
                  Nested
                </button>
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-muted-foreground">Indent:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="bg-muted border border-border rounded px-2 py-0.5 text-xs cursor-pointer flex items-center gap-1 hover:bg-accent">
                        {indent} spaces
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-28">
                      <DropdownMenuItem onClick={() => setIndent(2)} className="text-xs cursor-pointer">
                        2 spaces
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIndent(4)} className="text-xs cursor-pointer">
                        4 spaces
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live JSON Preview */}
        {(activeTab === 'json-zip' || activeTab === 'json-combined') && (
          <div className="flex flex-col gap-1.5 border-t border-border pt-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">JSON Preview</span>
                {activeTab === 'json-zip' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="bg-muted border border-border rounded px-2 py-0.5 text-xs font-mono uppercase cursor-pointer flex items-center gap-1 hover:bg-accent">
                        {previewLang}.json
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-32">
                      {languages.map(l => (
                        <DropdownMenuItem
                          key={l}
                          onClick={() => setPreviewLang(l)}
                          className="text-xs font-mono uppercase cursor-pointer"
                        >
                          {l}.json
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <span className="text-[10px] text-muted-foreground">(Showing first 10 entries)</span>
              </div>

              <button
                type="button"
                onClick={handleCopyPreview}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="size-3 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 bg-muted/60 border border-border rounded-lg text-[11px] font-mono max-h-36 overflow-y-auto leading-tight text-foreground select-all">
              {previewJson}
            </pre>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-1.5">
            <Download className="size-4" />
            Download {activeTab.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
