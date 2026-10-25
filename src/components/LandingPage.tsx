import React, { useRef, useState } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UploadCloud,
  Plus,
  ShieldCheck,
  Heart,
  Star,
  ChevronDown,
  Copy,
  Check,
  Leaf,
  Table2,
} from 'lucide-react';

// Official ecosystem format logos
const FlutterLogo = ({ className = 'size-12' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="M14.314 0L2.3 12 6 15.7 21.684 0h-7.37z" fill="#02569B" />
    <path d="M14.314 11.215L7.857 17.672l3.7 3.7 2.757-2.757 7.37-7.4h-7.37z" fill="#0175C2" />
    <path d="M11.557 21.372l2.757 2.628h7.37l-6.428-6.328-3.7 3.7z" fill="#29B6F6" />
  </svg>
);

const AndroidLogo = ({ className = 'size-12' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#3DDC84">
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9996.4482.9996.9993.0001.5511-.4485.9997-.9996.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.997-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2433 13.8533 7.8508 12 7.8508s-3.5902.3925-5.1365 1.0998L4.8412 5.4477a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.997 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396" />
  </svg>
);

const AppleLogo = ({ className = 'size-12' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);

const ExcelLogo = ({ className = 'size-12' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <rect x="2" y="2" width="28" height="28" rx="7" fill="#107C41" />
    <rect x="4.5" y="5.5" width="14" height="21" rx="3" fill="#0D5E31" opacity="0.4" />
    <path d="M10 9.5l4.5 6.5-4.5 6.5h3.5l2.6-4.2 2.6 4.2h3.5l-4.5-6.5 4.5-6.5h-3.5L16 13.8l-2.6-4.3H10z" fill="#FFFFFF" />
  </svg>
);

const JsonLogo = ({ className = 'size-12' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <rect x="2" y="2" width="28" height="28" rx="7" fill="#F59E0B" />
    {/* Prominent curly braces { } */}
    <path
      d="M6.5 9.5c-.9 0-1.6.5-1.6 1.4v3.1c0 .8-.5 1.4-1.2 1.8.7.4 1.2 1 1.2 1.8v3.1c0 .9.7 1.4 1.6 1.4M25.5 9.5c.9 0 1.6.5 1.6 1.4v3.1c0 .8.5 1.4 1.2 1.8-.7.4-1.2 1-1.2 1.8v3.1c0 .9-.7 1.4-1.6 1.4"
      stroke="#FFFFFF"
      strokeWidth="1.6"
      strokeLinecap="round"
      fill="none"
      opacity="0.8"
    />
    <text
      x="16"
      y="18.0"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="5.0"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="0.2px"
    >
      JSON
    </text>
  </svg>
);

const CsvLogo = ({ className = 'size-12' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <rect x="2" y="2" width="28" height="28" rx="7" fill="#0284C7" />
    <rect x="5.5" y="5.5" width="21" height="21" rx="4.5" stroke="#BAE6FD" strokeWidth="1.3" strokeDasharray="2 2" fill="none" opacity="0.85" />
    <text
      x="16"
      y="18.8"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="6.6"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="0.4px"
    >
      CSV
    </text>
  </svg>
);

const YamlLogo = ({ className = 'size-12' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <rect x="2" y="2" width="28" height="28" rx="7" fill="#DC2626" />
    <path d="M8.5 8.5l4.6 7.2v7.8h4v-7.8l4.6-7.2h-4l-2.6 4.8-2.6-4.8H8.5z" fill="#FFFFFF" opacity="0.3" />
    <text x="16" y="20.5" textAnchor="middle" fill="#FFFFFF" fontSize="7.5" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.2px">YAML</text>
  </svg>
);

const JsonLinkLogo = ({ className = 'size-12' }: { className?: string }) => (
  <div className={`${className} relative rounded-xl bg-primary p-[2px] shadow-sm shrink-0 flex items-center justify-center`}>
    <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center relative overflow-hidden">
      <svg viewBox="0 0 32 32" fill="none" className="w-3/4 h-3/4 relative z-10">
        <path d="M11 7C9.34315 7 8 8.34315 8 10V13C8 14.6569 6.65685 16 5 16C6.65685 16 8 17.3431 8 19V22C8 23.6569 9.34315 25 11 25" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 7C22.6569 7 24 8.34315 24 10V13C24 14.6569 25.3431 16 27 16C25.3431 16 24 17.3431 24 19V22C24 23.6569 22.6569 25 21 25" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 16H20" stroke="#5eead4" strokeDasharray="1 2.5" strokeLinecap="round" strokeWidth="2.2" />
      </svg>
    </div>
  </div>
);

interface FormatConfig {
  name: string;
  description: string;
  glow: string;
  renderLogo: (className?: string) => React.ReactNode;
}

const leftFormats: FormatConfig[] = [
  {
    name: 'Flutter ARB (.arb)',
    description: 'Metadata, types & placeholders',
    glow: 'bg-sky-500/35 dark:bg-sky-400/30',
    renderLogo: (cls?: string) => <FlutterLogo className={cls} />,
  },
  {
    name: 'Android XML (.xml)',
    description: 'Standard strings.xml resource tags',
    glow: 'bg-emerald-500/35 dark:bg-emerald-400/30',
    renderLogo: (cls?: string) => <AndroidLogo className={cls} />,
  },
  {
    name: 'iOS Strings (.strings)',
    description: 'Apple Cocoa & Swift localization',
    glow: 'bg-slate-400/35 dark:bg-zinc-200/30',
    renderLogo: (cls?: string) => <AppleLogo className={cls} />,
  },
  {
    name: 'Project (.jsonlink)',
    description: 'Portable encrypted workspace snapshot',
    glow: 'bg-teal-500/35 dark:bg-teal-400/30',
    renderLogo: (cls?: string) => <JsonLinkLogo className={cls} />,
  },
];

const rightFormats: FormatConfig[] = [
  {
    name: 'JSON (.json)',
    description: 'Nested or flat key-value pairs',
    glow: 'bg-amber-500/35 dark:bg-amber-400/30',
    renderLogo: (cls?: string) => <JsonLogo className={cls} />,
  },
  {
    name: 'Excel (.xlsx)',
    description: 'Multi-column translator spreadsheets',
    glow: 'bg-emerald-600/35 dark:bg-emerald-500/30',
    renderLogo: (cls?: string) => <ExcelLogo className={cls} />,
  },
  {
    name: 'CSV (.csv)',
    description: 'Universal delimiter spreadsheet export',
    glow: 'bg-sky-600/35 dark:bg-sky-500/30',
    renderLogo: (cls?: string) => <CsvLogo className={cls} />,
  },
  {
    name: 'YAML (.yaml)',
    description: 'Clean syntax for Rails & Flutter',
    glow: 'bg-rose-500/35 dark:bg-rose-400/30',
    renderLogo: (cls?: string) => <YamlLogo className={cls} />,
  },
];

interface LandingPageProps {
  onStartEmptySheet: () => void;
  onResetToSample: () => void;
  onDirectFiles: (files: FileList | File[]) => void;
  onOpenAbout: () => void;
  onOpenDocs: () => void;
  onOpenLegal?: (tab: 'privacy' | 'terms' | 'cookies') => void;
  isDark: boolean;
  onToggleTheme?: () => void;
}

const GITHUB_URL = 'https://github.com/pyaephyomaungdev/json-link';
const PRODUCT_HUNT_URL =
  'https://www.producthunt.com/products/json-link-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-json-link-2';

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartEmptySheet,
  onResetToSample,
  onDirectFiles,
  onOpenAbout,
  onOpenDocs,
  onOpenLegal,
  isDark,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [sheetChooserOpen, setSheetChooserOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyCmd = () => {
    navigator.clipboard?.writeText('npx create-jsonlink');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDirectFiles(e.dataTransfer.files);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(prev => (prev === index ? null : index));
  };

  return (
    <main className="flex-1 w-full max-w-full h-full overflow-y-auto overflow-x-hidden bg-background text-foreground selection:bg-primary/20 scroll-smooth relative">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            onDirectFiles(e.target.files);
          }
        }}
        multiple
        accept=".json,.jsonlink,.xlsx,.xls,.csv,.yaml,.yml,.xml,.strings,.arb"
        className="hidden"
      />

      {/* 2. Hero Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto pt-8 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 flex flex-col items-center">
        <div className="w-full max-w-full min-w-0 flex items-center justify-center">
          <div className="flex-1 flex flex-col items-center text-center max-w-2xl xl:max-w-3xl mx-auto w-full min-w-0 px-2 sm:px-0">
            {/* Product Hunt Featured Badge */}
            <div className="mb-5 flex items-center justify-center">
              <a
                href={PRODUCT_HUNT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-95 transition-transform hover:scale-[1.02] inline-block shadow-2xs rounded-lg"
              >
                <img
                  alt="JSON Link - Local-first open-source i18n spreadsheet & MCP server | Product Hunt"
                  width={240}
                  height={52}
                  src={`https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1248495&theme=${isDark ? 'dark' : 'light'}&t=1789232030595`}
                />
              </a>
            </div>

            {/* Hero Title with Gradient */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight max-w-3xl text-balance text-foreground pb-1">
              The Local-First Translation Spreadsheet for Developer Teams
            </h1>

            {/* Hero Subtitle */}
            <p className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl text-pretty leading-relaxed">
              Link, edit, and batch translate JSON, Flutter ARB, Excel, CSV, YAML, Android XML and iOS Strings.
              100% client-side privacy, zero databases, and zero vendor lock-in.
            </p>

            {!sheetChooserOpen ? (
              <div className="mt-7 w-full sm:w-auto">
                <Button
                  size="lg"
                  onClick={() => setSheetChooserOpen(true)}
                  className="h-10 sm:h-11 px-6 font-semibold text-sm gap-2 w-full sm:w-auto cursor-pointer shadow-md"
                >
                  <Table2 className="size-4" />
                  Open spreadsheet
                </Button>
              </div>
            ) : (
              <div
                className="mt-7 w-full flex flex-col items-center"
                role="region"
                aria-label="How to start"
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                  <Button
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 sm:h-11 px-6 font-semibold text-sm gap-2 w-full sm:w-auto cursor-pointer shadow-md"
                  >
                    <UploadCloud className="size-4" />
                    Browse Files
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={onStartEmptySheet}
                    className="h-10 sm:h-11 px-5 text-sm gap-2 w-full sm:w-auto cursor-pointer bg-background hover:bg-muted"
                  >
                    <Plus className="size-4" />
                    Start Empty Sheet
                  </Button>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={onResetToSample}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer underline underline-offset-4"
                  >
                    Try sample data (32 example keys)
                  </button>
                </div>

                <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/80 text-xs font-mono text-muted-foreground shadow-2xs hover:border-primary/40 transition-colors">
                  <span className="text-primary font-bold select-none">$</span>
                  <span className="text-foreground font-semibold select-all">npx create-jsonlink</span>
                  <button
                    type="button"
                    onClick={handleCopyCmd}
                    title={copiedCmd ? 'Copied to clipboard' : 'Copy command'}
                    className="p-1 -mr-1 rounded text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all cursor-pointer inline-flex items-center justify-center"
                  >
                    {copiedCmd ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5 hover:text-primary transition-colors" />
                    )}
                  </button>
                  <span className="text-xs text-muted-foreground hidden sm:inline select-none">•</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline select-none">
                    Embedded dev dashboard on <code className="text-primary font-semibold">localhost:5173/__jsonlink</code>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 sm:gap-5 mt-8 max-w-3xl mx-auto w-full select-none px-4">
          {[...leftFormats, ...rightFormats].map((f, i) => (
            <button
              key={i}
              type="button"
              title={f.name}
              onClick={() => fileInputRef.current?.click()}
              className="relative p-1.5 rounded-md bg-transparent border-0 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {f.renderLogo('size-8 sm:size-9 shrink-0')}
            </button>
          ))}
        </div>

        {/* 3. Hero Product Mockup & Interactive Dropzone */}
        <div className="w-full max-w-6xl min-w-0 mt-8 sm:mt-10">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group relative rounded-2xl border bg-card transition-colors cursor-pointer overflow-hidden shadow-sm w-full max-w-full ${isDragOver
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
              }`}
          >
            {/* Click overlay for accessibility */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Click or drop files anywhere to load into workspace"
              className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
            />
            {/* Window Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border/60 bg-muted/40 text-xs w-full max-w-full min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="size-2 sm:size-2.5 rounded-full bg-rose-500/80 shrink-0" />
                <span className="size-2 sm:size-2.5 rounded-full bg-amber-500/80 shrink-0" />
                <span className="size-2 sm:size-2.5 rounded-full bg-emerald-500/80 shrink-0" />
                <span className="ml-1.5 sm:ml-2 font-mono text-[10px] sm:text-[11px] text-muted-foreground truncate hidden sm:inline">
                  locales/en.json ↔ my.json ↔ ja.json
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-[11px] text-muted-foreground shrink-0">
                <Badge variant="outline" className="text-[9px] sm:text-[10px] py-0 h-4">
                  <ShieldCheck className="size-2.5 sm:size-3 mr-1" />
                  Local-first
                </Badge>
                <span className="hidden sm:inline">Offline Ready</span>
              </div>
            </div>

            {/* Mockup Toolbar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border/40 bg-background/50 text-[10px] sm:text-[11px] w-full max-w-full min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 font-mono text-muted-foreground truncate min-w-0">
                <span className="font-semibold text-primary shrink-0">fx</span>
                <span className="text-foreground truncate max-w-xs sm:max-w-md">
                  &quot;Welcome back, {'{user}'}! You have {'{count, plural, one{# item} other{# items}}'}.&quot;
                </span>
              </div>
              <Badge variant="secondary" className="text-[9px] sm:text-[10px] font-mono shrink-0 ml-2">
                ICU Safe
              </Badge>
            </div>

            {/* Mockup Spreadsheet Table */}
            <div className="w-full max-w-full overflow-x-auto text-left font-sans text-xs select-none scrollbar-thin min-w-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30 text-[11px] text-muted-foreground">
                    <th className="py-2 px-3.5 font-medium border-r border-border/40 w-10 text-center">#</th>
                    <th className="py-2 px-3.5 font-medium border-r border-border/40 w-44">Key Path</th>
                    <th className="py-2 px-3.5 font-medium border-r border-border/40 min-w-44">English (en)</th>
                    <th className="py-2 px-3.5 font-medium border-r border-border/40 min-w-44">Myanmar (my)</th>
                    <th className="py-2 px-3.5 font-medium min-w-44">Japanese (ja)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-[11px] font-sans">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3.5 text-center text-muted-foreground border-r border-border/40 font-mono">1</td>
                    <td className="py-2 px-3.5 font-semibold text-foreground border-r border-border/40 font-mono">app.title</td>
                    <td className="py-2 px-3.5 text-muted-foreground border-r border-border/40">JSON Link</td>
                    <td className="py-2 px-3.5 text-muted-foreground border-r border-border/40 leading-relaxed font-sans">JSON Link</td>
                    <td className="py-2 px-3.5 text-muted-foreground">JSON Link</td>
                  </tr>
                  <tr className="bg-primary/5 hover:bg-primary/10 transition-colors">
                    <td className="py-2 px-3.5 text-center text-primary font-bold border-r border-border/40 font-mono">2</td>
                    <td className="py-2 px-3.5 font-semibold text-primary border-r border-border/40 font-mono">auth.welcome</td>
                    <td className="py-2 px-3.5 text-foreground border-r border-border/40">
                      Welcome back, <span className="text-primary font-semibold font-mono">{'{user}'}</span>!
                    </td>
                    <td className="py-2 px-3.5 text-foreground border-r border-border/40 leading-relaxed font-sans font-myanmar">
                      ပြန်လည်ကြိုဆိုပါသည် <span className="text-primary font-semibold font-mono">{'{user}'}</span>!
                    </td>
                    <td className="py-2 px-3.5 text-foreground">
                      おかえりなさい、<span className="text-primary font-semibold font-mono">{'{user}'}</span>様!
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3.5 text-center text-muted-foreground border-r border-border/40 font-mono">3</td>
                    <td className="py-2 px-3.5 font-semibold text-foreground border-r border-border/40 font-mono">checkout.items</td>
                    <td className="py-2 px-3.5 text-muted-foreground border-r border-border/40 font-mono">
                      {'{count, plural, one{# item} other{# items}}'}
                    </td>
                    <td className="py-2 px-3.5 text-muted-foreground border-r border-border/40 leading-relaxed font-sans font-myanmar font-mono">
                      {'{count, plural, other{ပစ္စည်း # ခု}}'}
                    </td>
                    <td className="py-2 px-3.5 text-muted-foreground font-mono">
                      {'{count, plural, other{#個のアイテム}}'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Drop Zone Callout Footer */}
            <div className="px-3.5 py-3 sm:px-5 sm:py-3 bg-muted/40 border-t border-border/60 flex flex-col lg:flex-row items-center justify-between gap-2.5 sm:gap-3 text-xs w-full max-w-full min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground text-center lg:text-left min-w-0">
                <UploadCloud className="size-4 text-primary shrink-0 hidden sm:inline-block" />
                <span className="text-[11px] sm:text-xs">
                  <strong className="text-foreground font-semibold">Click or drop files anywhere</strong> on this preview to load instantly into workspace
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap lg:flex-nowrap justify-center max-w-full">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-background/80 border border-border/70 text-foreground/90 whitespace-nowrap shadow-2xs">
                  <JsonLinkLogo className="size-3 shrink-0" /> .jsonlink
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-background/80 border border-border/70 text-foreground/90 whitespace-nowrap shadow-2xs">
                  <JsonLogo className="size-3 shrink-0" /> .json
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-background/80 border border-border/70 text-foreground/90 whitespace-nowrap shadow-2xs">
                  <FlutterLogo className="size-3 shrink-0" /> .arb
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-background/80 border border-border/70 text-foreground/90 whitespace-nowrap shadow-2xs">
                  <ExcelLogo className="size-3 shrink-0" /> .xlsx
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-background/80 border border-border/70 text-foreground/90 whitespace-nowrap shadow-2xs">
                  <CsvLogo className="size-3 shrink-0" /> .csv
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-background/80 border border-border/70 text-foreground/90 whitespace-nowrap shadow-2xs">
                  <YamlLogo className="size-3 shrink-0" /> .yaml
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-background/80 border border-border/70 text-foreground/90 whitespace-nowrap shadow-2xs">
                  <AndroidLogo className="size-3 shrink-0" /> .xml
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-background/80 border border-border/70 text-foreground/90 whitespace-nowrap shadow-2xs">
                  <AppleLogo className="size-3 shrink-0" /> .strings
                </span>
              </div>
            </div>

            {/* Hover & Drag Drop Overlay */}
            <div
              className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 transition-opacity duration-200 pointer-events-none ${isDragOver
                  ? 'opacity-100 bg-background/90'
                  : 'opacity-0 bg-background/88'
                }`}
            >
              <div className="size-12 sm:size-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-lg scale-95 group-hover:scale-100 transition-transform duration-300">
                <UploadCloud className="size-6 sm:size-7" />
              </div>
              <div className="flex flex-col items-center gap-1 text-center px-4">
                <p className="text-sm sm:text-base font-bold text-foreground">
                  {isDragOver ? 'Drop files now to import' : 'Click or drop translation files to open workspace'}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  JSON, Flutter ARB, Excel, CSV, YAML, Android XML &amp; iOS Strings
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full border-y border-border py-6 px-4 sm:px-6">
        <p className="max-w-4xl mx-auto text-center text-sm text-muted-foreground leading-relaxed">
          Runs in the browser with no JSON Link backend. JSON, ARB, Excel, CSV, YAML, XML, and Strings.
          Optional AES-GCM on share links. MCP for Claude Desktop and Cursor.
        </p>
      </section>

      <section id="features" className="w-full py-16 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            What the spreadsheet actually does
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Built around ICU variables that translators break, Myanmar fonts that garble, and locale files that live on disk.
          </p>
        </div>

        <dl className="divide-y divide-border border-y border-border">
          {[
            {
              title: 'Runs in the browser',
              body: 'Files are parsed and edited in this tab. JSON Link has no translation database. OpenRouter and GitHub run only if you turn them on.',
            },
            {
              title: 'Password-optional handoff',
              body: 'Share a .jsonlink file or a URL hash. AES-GCM is applied when you set a password; without one, anyone with the link can read the strings.',
            },
            {
              title: 'ICU-safe AI translation',
              body: 'Bring your own OpenRouter key. Placeholders stay tokenized so models cannot rewrite {user} or ICU plurals. Source strings go to OpenRouter, not to JSON Link.',
            },
            {
              title: 'Flutter ARB, Android XML, iOS Strings',
              body: 'Round-trip ARB metadata, strings.xml, and Localizable.strings beside JSON, YAML, CSV, and Excel.',
            },
            {
              title: 'Zawgyi ⇄ Unicode',
              body: 'Detect legacy Myanmar Zawgyi in incoming files and convert with Rabbit in one pass.',
            },
            {
              title: 'MCP for Claude Desktop and Cursor',
              body: 'stdio JSON-RPC tools to lint missing keys and update locale files from the IDE.',
            },
            {
              title: 'GitHub locales sync',
              body: 'Pull a branch, edit, and open a PR. Client-side path guards keep the write set on localization files.',
            },
            {
              title: 'Vite plugin and create-jsonlink',
              body: 'npx create-jsonlink wires @jsonlink/vite-plugin and serves the spreadsheet at localhost:5173/__jsonlink with disk save and HMR.',
            },
          ].map(item => (
            <div key={item.title} className="py-5 sm:grid sm:grid-cols-[13rem_1fr] sm:gap-8">
              <dt className="text-sm font-semibold text-foreground">{item.title}</dt>
              <dd className="mt-1 sm:mt-0 text-sm text-muted-foreground leading-relaxed">{item.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 6. Formats Showcase */}
      <section id="formats" className="w-full py-16 px-4 sm:px-6 bg-muted/15 border-y border-border/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Formats on the grid
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Import from any stack, edit in one unified spreadsheet grid, and export clean files matching your framework structure.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...leftFormats, ...rightFormats].map((f, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-border bg-card flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-2.5">
                  {f.renderLogo('size-5 shrink-0')}
                  <h3 className="text-xs font-bold text-foreground">{f.name}</h3>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. How It Works (3 Steps) */}
      <section id="architecture" className="w-full py-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="max-w-2xl mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            How JSON Link works
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Go from scattered translation files to a synchronized localized release in three simple steps.
          </p>
        </div>

        <ol className="space-y-6 max-w-2xl">
          <li className="grid grid-cols-[2rem_1fr] gap-4">
            <span className="text-sm font-mono text-primary pt-0.5">1</span>
            <div>
              <h3 className="text-base font-semibold text-foreground">Drop or import</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                Drag locale files into the browser or start with an empty sheet. No account.
              </p>
            </div>
          </li>
          <li className="grid grid-cols-[2rem_1fr] gap-4">
            <span className="text-sm font-mono text-primary pt-0.5">2</span>
            <div>
              <h3 className="text-base font-semibold text-foreground">Edit and translate</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                Review strings in the spreadsheet. Lint missing keys, run OpenRouter with variable shielding, convert Zawgyi.
              </p>
            </div>
          </li>
          <li className="grid grid-cols-[2rem_1fr] gap-4">
            <span className="text-sm font-mono text-primary pt-0.5">3</span>
            <div>
              <h3 className="text-base font-semibold text-foreground">Export or hand off</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                Download JSON, ARB, or a Vite starter. Optionally password-encrypt a .jsonlink file for teammates.
              </p>
            </div>
          </li>
        </ol>
      </section>

      {/* 8. Frequently Asked Questions (FAQ) */}
      <section id="faq" className="w-full py-16 px-4 sm:px-6 bg-muted/15 border-t border-border/60">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Frequently asked questions
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                q: 'Does any translation data ever touch your servers?',
                a: 'Never. JSON Link has zero backend servers, zero databases, and zero tracking. All parsing, validation, AES-256 encryption, and export generation take place 100% inside your browser tab via Web Workers and Web Crypto. (The only external network requests occur if you explicitly opt-in: direct BYOK calls to OpenRouter for AI translation, or direct calls to GitHub’s official REST API for repository sync).',
              },
              {
                q: 'How does sharing work without a database?',
                a: 'Team handoffs pack keys into a .jsonlink file or a URL hash fragment. Hash fragments are not sent to our servers. AES-256-GCM with PBKDF2 (100,000 iterations) runs only when you set a password. Without a password, anyone with the link can decompress the strings.',
              },
              {
                q: 'How does AI translation preserve variables and ICU plural formats?',
                a: 'JSON Link parses strings into tokens before sending them to OpenRouter. ICU structures like {count, plural, one{#} other{#}}, Mustache tokens {user}, and printf formats (%s, %d) are shielded with strict grammatical preservation prompts so AI models never alter code identifiers.',
              },
              {
                q: 'Can I install JSON Link as an offline desktop application?',
                a: 'Yes. JSON Link is a complete Progressive Web App (PWA) with offline caching. You can install it via Chrome, Edge, or Safari and edit your translations anywhere without an active internet connection.',
              },
              {
                q: 'How do I use the Stdio MCP Server in Claude Desktop or Cursor?',
                a: 'JSON Link includes a standalone MCP (Model Context Protocol) package. Run it with your project path via npx to give Claude or Cursor direct tools to inspect, lint, and add translation keys directly from your coding prompt.',
              },
              {
                q: 'How does GitHub Sync work, and is it safe to use my Personal Access Token?',
                a: 'GitHub Sync operates 100% client-side directly within your browser using official GitHub REST and Git Data APIs with zero intermediary servers. Your PAT is stored locally in your browser\'s localStorage for convenience (we recommend fine-grained tokens with minimal repo access and short expiry). While GitHub tokens grant technical repository permissions, JSON Link\'s client-side app filter strictly blocks non-locales paths—ensuring only authorized localization files (.json, .arb, .yaml, .xml, .strings) can ever be read or committed.',
              },
              {
                q: 'Can I drop JSON Link exports directly into my existing React + Vite project?',
                a: 'Yes. The Vite Starter export includes autogenerated TypeScript definitions (translations.d.ts), an ultra-lightweight client loader (i18n.ts, ~120 lines, zero dependencies), and the bundled AI Skill (.agents/skills/). Simply copy the /src/locales directory into your project, import useTranslation(), and enjoy instant Vite HMR whenever locale files update.',
              },
              {
                q: 'How do I run JSON Link as an embedded dev tool inside my existing Vite project?',
                a: 'Run `npx create-jsonlink` in your Vite project root. It auto-configures `@jsonlink/vite-plugin` in your vite.config.ts and scaffolds `src/locales/`. When you run `npm run dev`, open `http://localhost:5173/__jsonlink`. You get the complete spreadsheet workspace embedded inside your dev server with zero extra ports. Any edits or AI translations you make are written directly to your local JSON files on disk, triggering instant Vite HMR in your running app!',
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <article
                  key={idx}
                  className="rounded-xl border border-border/70 bg-card overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full px-5 py-4 text-left font-semibold text-sm text-foreground flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-primary' : ''
                        }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
                      {faq.a}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>



      {/* 10. Rich Footer */}
      <footer className="w-full py-8 px-4 sm:px-6 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground mt-auto">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Top Row: Brand on Left, Navigation on Right */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" showText={true} />
              <span className="text-muted-foreground/40 hidden sm:inline">|</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Private In-Browser Translation Workspace
              </span>
            </div>

            <nav className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 sm:gap-x-5 gap-y-2 text-xs font-medium">
              <button
                onClick={onOpenAbout}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                About JSON Link
              </button>
              <button
                onClick={onOpenDocs}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Documentation
              </button>
              <a
                href="/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenLegal?.('privacy');
                }}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Privacy
              </a>
              <a
                href="/terms"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenLegal?.('terms');
                }}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Terms
              </a>
              <a
                href="/cookies"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenLegal?.('cookies');
                }}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Cookies
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <Star className="size-3 text-amber-500 fill-amber-500" />
                GitHub
              </a>
              <a
                href={PRODUCT_HUNT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Product Hunt
              </a>
            </nav>
          </div>

          {/* Bottom Sub-footer Strip: Developer Credit & Green Hosting */}
          <div className="pt-4 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>Developed with</span>
              <Heart className="size-3 text-rose-500 fill-rose-500 inline" />
              <span>by</span>
              <a href="https://pyaephyomaung.dev" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors hover:underline">Pyae Phyo Maung</a>
            </div>

            <a
              href="https://www.thegreenwebfoundation.org/green-web-check/?url=https%3A%2F%2Fjson-link.pages.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-emerald-500 transition-colors text-center"
              title="Certified Green Hosting by The Green Web Foundation"
            >
              <Leaf className="size-3 text-emerald-500 shrink-0" />
              <span>Green hosted · 100% Renewable Energy</span>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
};
