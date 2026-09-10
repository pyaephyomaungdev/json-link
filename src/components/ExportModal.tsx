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
  Code2,
  Smartphone,
  Layers,
} from 'lucide-react';
import { TranslationItem, ExportOptions, ExportFormat } from '@/types';
import {
  exportToExcel,
  exportToCsv,
  exportToJsonZip,
  exportToCombinedJson,
  exportToYamlZip,
  exportToAndroidXmlZip,
  exportToIosStringsZip,
  exportToTypeScriptDts,
  generateLanguageJsonData,
  objectToYaml,
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
  const [activeTab, setActiveTab] = useState<ExportFormat>('excel');
  const [nested, setNested] = useState(false);
  const [indent, setIndent] = useState(2);
  const [filename, setFilename] = useState('translations');
  const [previewLang, setPreviewLang] = useState(languages[0] || 'en');
  const [copied, setCopied] = useState(false);

  // Live preview text for code-based formats
  const previewText = useMemo(() => {
    const sampleItems = items.slice(0, 10);

    if (activeTab === 'json-combined') {
      const combined: Record<string, any> = {};
      for (const lang of languages) {
        combined[lang] = generateLanguageJsonData(sampleItems, lang, nested);
      }
      return JSON.stringify(combined, null, indent);
    }

    if (activeTab === 'json-zip') {
      const langData = generateLanguageJsonData(sampleItems, previewLang, nested);
      return JSON.stringify(langData, null, indent);
    }

    if (activeTab === 'yaml-zip') {
      const data = generateLanguageJsonData(sampleItems, previewLang, nested);
      return objectToYaml(data);
    }

    if (activeTab === 'android-xml') {
      const safeKey = sampleItems[0]?.key.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() || 'example_key';
      const safeVal = (sampleItems[0]?.[previewLang] || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
      return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="${safeKey}">${safeVal}</string>\n    <!-- ... -->\n</resources>`;
    }

    if (activeTab === 'ios-strings') {
      const k = sampleItems[0]?.key || 'example.key';
      const v = sampleItems[0]?.[previewLang] || '';
      return `/* Localizable.strings (${previewLang}) */\n"${k}" = "${v}";\n/* ... */`;
    }

    if (activeTab === 'typescript-dts') {
      const keysUnion = sampleItems.map(i => `  | ${JSON.stringify(i.key)}`).join('\n');
      return `export type TranslationKey =\n${keysUnion}\n  | ...;\n\nexport type SupportedLanguage = ${languages.map(l => JSON.stringify(l)).join(' | ')};`;
    }

    return '';
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
    } else if (activeTab === 'yaml-zip') {
      await exportToYamlZip(items, languages, options, `${filename}_yaml.zip`);
    } else if (activeTab === 'android-xml') {
      await exportToAndroidXmlZip(items, languages, `${filename}_android.zip`);
    } else if (activeTab === 'ios-strings') {
      await exportToIosStringsZip(items, languages, `${filename}_ios.zip`);
    } else if (activeTab === 'typescript-dts') {
      exportToTypeScriptDts(items, languages, `${filename}.d.ts`);
    }

    onOpenChange(false);
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatButtons = [
    { id: 'excel' as ExportFormat, label: 'Excel (.xlsx)', icon: <FileSpreadsheet className="size-3.5 text-emerald-600" /> },
    { id: 'csv' as ExportFormat, label: 'CSV (.csv)', icon: <FileText className="size-3.5 text-blue-500" /> },
    { id: 'json-zip' as ExportFormat, label: 'JSON (ZIP)', icon: <Archive className="size-3.5 text-amber-500" /> },
    { id: 'json-combined' as ExportFormat, label: 'Single JSON', icon: <FileText className="size-3.5 text-purple-500" /> },
    { id: 'yaml-zip' as ExportFormat, label: 'YAML (.yaml)', icon: <Layers className="size-3.5 text-rose-500" /> },
    { id: 'android-xml' as ExportFormat, label: 'Android (strings.xml)', icon: <Smartphone className="size-3.5 text-emerald-500" /> },
    { id: 'ios-strings' as ExportFormat, label: 'iOS (.strings)', icon: <Smartphone className="size-3.5 text-sky-500" /> },
    { id: 'typescript-dts' as ExportFormat, label: 'TypeScript (.d.ts)', icon: <Code2 className="size-3.5 text-blue-600" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Export Translations</DialogTitle>
          <DialogDescription className="text-xs">
            Export across Web, Mobile (Android/iOS), Flutter, Rails, and Developer types.
          </DialogDescription>
        </DialogHeader>

        {/* Format Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 my-2">
          {formatButtons.map(fmt => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => setActiveTab(fmt.id)}
              className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors text-left ${
                activeTab === fmt.id
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border hover:bg-muted/50 text-foreground'
              }`}
            >
              {fmt.icon}
              <span className="truncate">{fmt.label}</span>
            </button>
          ))}
        </div>

        {/* Description Banner per Format */}
        <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs">
          {activeTab === 'excel' && (
            <p className="text-muted-foreground">
              Multi-column spreadsheet with columns for Key and languages ({languages.join(', ')}). Formatted with styled header and auto column width.
            </p>
          )}
          {activeTab === 'csv' && (
            <p className="text-muted-foreground">
              Comma-Separated Values embedded with UTF-8 BOM so Myanmar Unicode never turns into question marks in Excel or Google Sheets.
            </p>
          )}
          {activeTab === 'json-zip' && (
            <p className="text-muted-foreground">
              Creates a <code className="font-mono">.zip</code> containing individual JSON files: {languages.map(l => `${l}.json`).join(', ')}.
            </p>
          )}
          {activeTab === 'json-combined' && (
            <p className="text-muted-foreground">
              Combines all languages into a single unified JSON object (e.g. <code className="font-mono">{`{ "en": {...}, "my": {...} }`}</code>).
            </p>
          )}
          {activeTab === 'yaml-zip' && (
            <p className="text-muted-foreground">
              Export YAML files (<code className="font-mono">en.yaml</code>, <code className="font-mono">my.yaml</code>) for Flutter, Ruby on Rails, or Symfony.
            </p>
          )}
          {activeTab === 'android-xml' && (
            <p className="text-muted-foreground">
              Creates Android-ready folder structure (<code className="font-mono">res/values/strings.xml</code>, <code className="font-mono">res/values-my/strings.xml</code>) with XML-escaped entities.
            </p>
          )}
          {activeTab === 'ios-strings' && (
            <p className="text-muted-foreground">
              Creates Apple Xcode localization folders (<code className="font-mono">en.lproj/Localizable.strings</code>, <code className="font-mono">my.lproj/Localizable.strings</code>).
            </p>
          )}
          {activeTab === 'typescript-dts' && (
            <p className="text-muted-foreground">
              Generates strongly-typed TypeScript definitions (<code className="font-mono">translations.d.ts</code>) for full compile-time autocomplete of all translation keys.
            </p>
          )}
        </div>

        {/* Options & Filename */}
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-foreground">File Name:</label>
            <Input
              value={filename}
              onChange={e => setFilename(e.target.value)}
              placeholder="translations"
              className="text-xs h-8"
            />
          </div>

          {(activeTab === 'json-zip' || activeTab === 'json-combined' || activeTab === 'yaml-zip') && (
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-foreground">Structure & Indent:</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNested(false)}
                  className={`px-2 py-1 rounded border text-xs cursor-pointer transition-colors ${
                    !nested ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'
                  }`}
                >
                  Flat
                </button>
                <button
                  type="button"
                  onClick={() => setNested(true)}
                  className={`px-2 py-1 rounded border text-xs cursor-pointer transition-colors ${
                    nested ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'
                  }`}
                >
                  Nested
                </button>
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-muted-foreground text-[11px]">Indent:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="bg-muted border border-border rounded px-2 py-0.5 text-xs cursor-pointer flex items-center gap-1 hover:bg-accent">
                        {indent} sp
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-24">
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

        {/* Live Code Preview */}
        {previewText && (
          <div className="flex flex-col gap-1 border-t border-border pt-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Preview</span>
                {(activeTab === 'json-zip' || activeTab === 'yaml-zip' || activeTab === 'android-xml' || activeTab === 'ios-strings') && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="bg-muted border border-border rounded px-2 py-0.5 text-xs font-mono uppercase cursor-pointer flex items-center gap-1 hover:bg-accent">
                        {previewLang}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-28">
                      {languages.map(l => (
                        <DropdownMenuItem
                          key={l}
                          onClick={() => setPreviewLang(l)}
                          className="text-xs font-mono uppercase cursor-pointer"
                        >
                          {l}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <span className="text-[10px] text-muted-foreground">(Sample)</span>
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

            <pre className="p-2.5 bg-muted/60 border border-border rounded-lg text-[11px] font-mono max-h-32 overflow-y-auto leading-tight text-foreground select-all">
              {previewText}
            </pre>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleExport} className="gap-1.5 text-xs shadow-xs">
            <Download className="size-3.5" />
            Download {activeTab.replace('-', ' ').toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
