import React, { useState, useMemo } from 'react';
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
  Package,
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
  exportToArbZip,
  exportToTypeScriptDts,
  exportAllAsProjectBundle,
  generateLanguageJsonData,
  generateArbData,
  objectToYaml,
} from '@/lib/exporter';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: TranslationItem[];
  languages: string[];
  defaultFilename?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onOpenChange,
  items,
  languages,
  defaultFilename,
}) => {
  const [activeTab, setActiveTab] = useState<ExportFormat>('excel');
  const [nested, setNested] = useState(false);
  const [indent, setIndent] = useState(2);
  const [filename, setFilename] = useState(defaultFilename || 'translations');
  const [previewLang, setPreviewLang] = useState(languages[0] || 'en');
  const [copied, setCopied] = useState(false);

  // Sync defaultFilename when changed or modal opened
  React.useEffect(() => {
    if (defaultFilename) {
      setFilename(defaultFilename);
    }
  }, [defaultFilename, open]);

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

    if (activeTab === 'arb-zip') {
      const arbData = generateArbData(sampleItems, previewLang);
      return JSON.stringify(arbData, null, indent);
    }

    if (activeTab === 'typescript-dts') {
      const keysUnion = sampleItems.map(i => `  | ${JSON.stringify(i.key)}`).join('\n');
      return `export type TranslationKey =\n${keysUnion}\n  | ...;\n\nexport type SupportedLanguage = ${languages.map(l => JSON.stringify(l)).join(' | ')};`;
    }

    if (activeTab === 'project-bundle') {
      return `📦 Complete Multi-Framework Bundle:\n\n` +
        `├── web-locales/ (${languages.map(l => `${l}.json`).join(', ')})\n` +
        `├── flutter-l10n/ (${languages.map(l => `app_${l}.arb`).join(', ')})\n` +
        `├── ios-strings/ (${languages.map(l => `${l}.lproj/Localizable.strings`).join(', ')})\n` +
        `├── android-res/ (${languages.map(l => l === 'en' ? 'values/strings.xml' : `values-${l}/strings.xml`).join(', ')})\n` +
        `└── translations.d.ts (TypeScript definitions)`;
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

    if (activeTab === 'project-bundle') {
      await exportAllAsProjectBundle(items, languages, options, 'all-in-one', `${filename}_all_locales_bundle.zip`);
    } else if (activeTab === 'excel') {
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
    } else if (activeTab === 'arb-zip') {
      await exportToArbZip(items, languages, `${filename}_flutter_arb.zip`);
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
    { id: 'project-bundle' as ExportFormat, label: 'Full Bundle (ZIP)', shortLabel: 'Full Bundle', icon: <Package className="size-3.5 text-indigo-500 shrink-0" /> },
    { id: 'excel' as ExportFormat, label: 'Excel (.xlsx)', shortLabel: 'Excel (.xlsx)', icon: <FileSpreadsheet className="size-3.5 text-emerald-600 shrink-0" /> },
    { id: 'csv' as ExportFormat, label: 'CSV (.csv)', shortLabel: 'CSV (.csv)', icon: <FileText className="size-3.5 text-blue-500 shrink-0" /> },
    { id: 'json-zip' as ExportFormat, label: 'JSON (ZIP)', shortLabel: 'JSON (ZIP)', icon: <Archive className="size-3.5 text-amber-500 shrink-0" /> },
    { id: 'json-combined' as ExportFormat, label: 'Single JSON', shortLabel: 'Single JSON', icon: <FileText className="size-3.5 text-purple-500 shrink-0" /> },
    { id: 'yaml-zip' as ExportFormat, label: 'YAML (.yaml)', shortLabel: 'YAML (.yaml)', icon: <Layers className="size-3.5 text-rose-500 shrink-0" /> },
    { id: 'android-xml' as ExportFormat, label: 'Android (strings.xml)', shortLabel: 'Android XML', icon: <Smartphone className="size-3.5 text-emerald-500 shrink-0" /> },
    { id: 'ios-strings' as ExportFormat, label: 'iOS (.strings)', shortLabel: 'iOS Strings', icon: <Smartphone className="size-3.5 text-sky-500 shrink-0" /> },
    { id: 'arb-zip' as ExportFormat, label: 'Flutter ARB (.arb)', shortLabel: 'Flutter ARB', icon: <Code2 className="size-3.5 text-cyan-500 shrink-0" /> },
    { id: 'typescript-dts' as ExportFormat, label: 'TypeScript (.d.ts)', shortLabel: 'TypeScript', icon: <Code2 className="size-3.5 text-blue-600 shrink-0" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Export Translations</DialogTitle>
          <DialogDescription className="text-xs">
            Export across Web, Mobile (Android/iOS), Flutter, Rails, and Developer types.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 text-xs">
          {/* Format Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 my-1.5 sm:my-2">
          {formatButtons.map(fmt => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => setActiveTab(fmt.id)}
              className={`flex items-center gap-1.5 sm:gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all text-left ${
                activeTab === fmt.id
                  ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                  : 'border-border hover:bg-muted/50 text-foreground'
              }`}
            >
              {fmt.icon}
              <span className="truncate hidden sm:inline">{fmt.label}</span>
              <span className="truncate sm:hidden text-[11px]">{fmt.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Description Banner per Format */}
        <div className="p-2.5 sm:p-3 rounded-lg bg-muted/40 border border-border text-xs">
          {activeTab === 'project-bundle' && (
            <p className="text-muted-foreground">
              ⚡ <strong>One-Click Project Bundle</strong>: Generates an organized <code className="font-mono">.zip</code> containing pre-structured directories for Web (<code className="font-mono">web-locales/</code>), Flutter (<code className="font-mono">flutter-l10n/</code>), iOS (<code className="font-mono">ios-strings/</code>), Android (<code className="font-mono">android-res/</code>), and TypeScript declarations.
            </p>
          )}
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
          {activeTab === 'arb-zip' && (
            <p className="text-muted-foreground">
              Flutter Application Resource Bundle (<code className="font-mono">app_en.arb</code>, <code className="font-mono">app_my.arb</code>) with <code className="font-mono">@@locale</code> and <code className="font-mono">@key</code> descriptions.
            </p>
          )}
          {activeTab === 'typescript-dts' && (
            <p className="text-muted-foreground">
              Generates strongly-typed TypeScript definitions (<code className="font-mono">translations.d.ts</code>) for full compile-time autocomplete of all translation keys.
            </p>
          )}
        </div>

        {/* Options & Filename */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 border-t border-border pt-3 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-foreground">File Name:</label>
            <Input
              value={filename}
              onChange={e => setFilename(e.target.value)}
              placeholder="translations"
              className="text-xs h-8"
            />
          </div>

          {(activeTab === 'json-zip' || activeTab === 'json-combined' || activeTab === 'yaml-zip' || activeTab === 'arb-zip') && (
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
                {(activeTab === 'json-zip' || activeTab === 'yaml-zip' || activeTab === 'android-xml' || activeTab === 'ios-strings' || activeTab === 'arb-zip') && (
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

            <pre className="p-2 sm:p-2.5 bg-muted/60 border border-border rounded-lg text-[10.5px] sm:text-[11px] font-mono max-h-24 sm:max-h-32 overflow-y-auto leading-tight text-foreground select-all">
              {previewText}
            </pre>
          </div>
        )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none text-xs h-8 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            className="flex-1 sm:flex-none gap-1.5 text-xs h-8 shadow-xs font-semibold cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>Download {activeTab === 'typescript-dts' ? 'TYPESCRIPT' : activeTab.replace('-', ' ').toUpperCase()}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
