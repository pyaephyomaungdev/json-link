import React, { useRef, useState } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  UploadCloud,
  Plus,
  Sparkles,
  ShieldCheck,
  Lock,
  Languages,
  Terminal,
  Heart,
  Layers,
  Star,
  ChevronDown,
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
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.56.65-1.05 1.71-.92 2.73 1 .08 2.02-.48 2.62-1.23z" />
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
    <path
      d="M5.5 10c-.8 0-1.2.4-1.2 1.2v3c0 .8-.5 1.3-1 1.8.5.5 1 1 1 1.8v3c0 .8.4 1.2 1.2 1.2M26.5 10c.8 0 1.2.4 1.2 1.2v3c0 .8.5 1.3 1 1.8-.5.5-1 1-1 1.8v3c0 .8-.4 1.2-1.2 1.2"
      stroke="#FFFFFF"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
      opacity="0.3"
    />
    <text
      x="16"
      y="20.5"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="8.5"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="0.4px"
    >
      JSON
    </text>
  </svg>
);

const CsvLogo = ({ className = 'size-12' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <rect x="2" y="2" width="28" height="28" rx="7" fill="#0284C7" />
    <rect x="5.5" y="5.5" width="21" height="21" rx="4" stroke="#BAE6FD" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
    <text x="16" y="20.5" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5px">CSV</text>
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
  <div className={`${className} relative rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 p-[2px] shadow-lg shrink-0 flex items-center justify-center`}>
    <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/25 to-teal-500/10 pointer-events-none" />
      <svg viewBox="0 0 32 32" fill="none" className="w-3/4 h-3/4 relative z-10">
        <path d="M11 7C9.34315 7 8 8.34315 8 10V13C8 14.6569 6.65685 16 5 16C6.65685 16 8 17.3431 8 19V22C8 23.6569 9.34315 25 11 25" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 7C22.6569 7 24 8.34315 24 10V13C24 14.6569 25.3431 16 27 16C25.3431 16 24 17.3431 24 19V22C24 23.6569 22.6569 25 21 25" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 16H20" stroke="#818cf8" strokeDasharray="1 2.5" strokeLinecap="round" strokeWidth="2.2" />
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
  isDark,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex-1 flex flex-col w-full h-full overflow-y-auto bg-background text-foreground selection:bg-primary/20 scroll-smooth">
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
      <section className="relative w-full pt-8 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center">
        {/* Subtle Ambient Aura */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Hero Flanking Layout */}
        <div className="w-full flex items-center justify-between gap-4 xl:gap-8">
          {/* Left Flank - Pure Floating Official Brand Logos (No Background Box, Larger Size, Glow Aura) */}
          <div className="hidden lg:flex flex-col items-center justify-center gap-6 xl:gap-8 w-28 xl:w-36 shrink-0 relative py-4 select-none">
            {/* Ambient Background Aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

            {leftFormats.map((f, i) => {
              const offsets = ['translate-x-4', '-translate-x-3', 'translate-x-5', '-translate-x-2'];
              return (
                <button
                  key={i}
                  type="button"
                  title={f.name}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative p-2 bg-transparent border-0 outline-none flex items-center justify-center transition-all duration-300 cursor-pointer group hover:scale-125 hover:-translate-y-2 focus-visible:scale-125 ${offsets[i % offsets.length]}`}
                >
                  {/* Ambient blur glow behind icon */}
                  <div
                    className={`absolute inset-0 rounded-full blur-xl opacity-30 group-hover:opacity-90 group-hover:scale-150 transition-all duration-500 pointer-events-none ${f.glow}`}
                  />
                  {/* Pure floating logo with drop shadow */}
                  <div className="relative filter drop-shadow-md group-hover:drop-shadow-2xl transition-all duration-300 flex items-center justify-center">
                    {f.renderLogo('size-12 xl:size-14 shrink-0')}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Center Column: Badge, Headline, Subtitle, Actions, Sample */}
          <div className="flex-1 flex flex-col items-center text-center max-w-2xl xl:max-w-3xl mx-auto">
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight max-w-3xl text-balance bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent pb-1">
              The Local-First Translation Spreadsheet for Developer Teams
            </h1>

            {/* Hero Subtitle */}
            <p className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl text-pretty leading-relaxed">
              Link, edit, and batch translate JSON, Flutter ARB, Excel, CSV, YAML, Android XML and iOS Strings.
              100% client-side privacy, zero databases, and zero vendor lock-in.
            </p>

            {/* Hero Actions */}
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
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

            {/* Sample Data Trigger */}
            <div className="mt-3">
              <button
                onClick={onResetToSample}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer underline underline-offset-4"
              >
                <Sparkles className="size-3.5 text-primary" />
                Or test with sample data (30 example keys)
              </button>
            </div>
          </div>

          {/* Right Flank - Pure Floating Official Brand Logos (No Background Box, Larger Size, Glow Aura) */}
          <div className="hidden lg:flex flex-col items-center justify-center gap-6 xl:gap-8 w-28 xl:w-36 shrink-0 relative py-4 select-none">
            {/* Ambient Background Aura */}
            <div className="absolute inset-0 bg-gradient-to-tl from-amber-500/15 via-rose-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

            {rightFormats.map((f, i) => {
              const offsets = ['-translate-x-4', 'translate-x-3', '-translate-x-5', 'translate-x-2'];
              return (
                <button
                  key={i}
                  type="button"
                  title={f.name}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative p-2 bg-transparent border-0 outline-none flex items-center justify-center transition-all duration-300 cursor-pointer group hover:scale-125 hover:-translate-y-2 focus-visible:scale-125 ${offsets[i % offsets.length]}`}
                >
                  {/* Ambient blur glow behind icon */}
                  <div
                    className={`absolute inset-0 rounded-full blur-xl opacity-30 group-hover:opacity-90 group-hover:scale-150 transition-all duration-500 pointer-events-none ${f.glow}`}
                  />
                  {/* Pure floating logo with drop shadow */}
                  <div className="relative filter drop-shadow-md group-hover:drop-shadow-2xl transition-all duration-300 flex items-center justify-center">
                    {f.renderLogo('size-12 xl:size-14 shrink-0')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Floating Icons Strip for < lg Viewports - Pure Floating Icons with Blur Glow (No Background Box) */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 lg:hidden my-6 flex-wrap max-w-lg select-none px-4">
          {[...leftFormats, ...rightFormats].map((f, i) => (
            <button
              key={i}
              type="button"
              title={f.name}
              onClick={() => fileInputRef.current?.click()}
              className="relative p-1.5 bg-transparent border-0 outline-none flex items-center justify-center transition-all duration-300 cursor-pointer group hover:scale-125 hover:-translate-y-1"
            >
              <div
                className={`absolute inset-0 rounded-full blur-lg opacity-25 group-hover:opacity-85 group-hover:scale-140 transition-all duration-300 pointer-events-none ${f.glow}`}
              />
              <div className="relative filter drop-shadow-sm group-hover:drop-shadow-lg flex items-center justify-center">
                {f.renderLogo('size-9 sm:size-10 shrink-0')}
              </div>
            </button>
          ))}
        </div>

        {/* 3. Hero Product Mockup & Interactive Dropzone */}
        <div className="w-full mt-8 sm:mt-10 max-w-6xl">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative rounded-2xl border bg-card/70 backdrop-blur-xs transition-all cursor-pointer overflow-hidden shadow-xl ${
              isDragOver
                ? 'border-primary ring-4 ring-primary/20 scale-[1.005]'
                : 'border-border/80 hover:border-primary/50'
            }`}
          >
            {/* Window Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border/60 bg-muted/40 text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="size-2 sm:size-2.5 rounded-full bg-rose-500/80" />
                <span className="size-2 sm:size-2.5 rounded-full bg-amber-500/80" />
                <span className="size-2 sm:size-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-1.5 sm:ml-2 font-mono text-[10px] sm:text-[11px] text-muted-foreground hidden xs:inline sm:inline">
                  locales/en.json ↔ my.json ↔ ja.json
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-[11px] text-muted-foreground">
                <Badge variant="outline" className="text-[9px] sm:text-[10px] py-0 h-4 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-2.5 sm:size-3 mr-1" />
                  AES-256 GCM
                </Badge>
                <span className="hidden sm:inline">Offline Ready</span>
              </div>
            </div>

            {/* Mockup Toolbar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border/40 bg-background/50 text-[10px] sm:text-[11px]">
              <div className="flex items-center gap-2 sm:gap-3 font-mono text-muted-foreground truncate">
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
            <div className="overflow-x-auto text-left font-sans text-xs select-none">
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
                <tbody className="divide-y divide-border/30 text-[11px] font-mono">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3.5 text-center text-muted-foreground border-r border-border/40">1</td>
                    <td className="py-2 px-3.5 font-semibold text-foreground border-r border-border/40">app.title</td>
                    <td className="py-2 px-3.5 text-muted-foreground border-r border-border/40">JSON Link</td>
                    <td className="py-2 px-3.5 text-muted-foreground border-r border-border/40">JSON Link</td>
                    <td className="py-2 px-3.5 text-muted-foreground">JSON Link</td>
                  </tr>
                  <tr className="bg-primary/5 hover:bg-primary/10 transition-colors">
                    <td className="py-2 px-3.5 text-center text-primary font-bold border-r border-border/40">2</td>
                    <td className="py-2 px-3.5 font-semibold text-primary border-r border-border/40">auth.welcome</td>
                    <td className="py-2 px-3.5 text-foreground border-r border-border/40">
                      Welcome back, <span className="text-primary font-semibold">{'{user}'}</span>!
                    </td>
                    <td className="py-2 px-3.5 text-foreground border-r border-border/40">
                      ပြန်လည်ကြိုဆိုပါသည် <span className="text-primary font-semibold">{'{user}'}</span>!
                    </td>
                    <td className="py-2 px-3.5 text-foreground">
                      おかえりなさい、<span className="text-primary font-semibold">{'{user}'}</span>様!
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3.5 text-center text-muted-foreground border-r border-border/40">3</td>
                    <td className="py-2 px-3.5 font-semibold text-foreground border-r border-border/40">checkout.items</td>
                    <td className="py-2 px-3.5 text-muted-foreground border-r border-border/40">
                      {'{count, plural, one{# item} other{# items}}'}
                    </td>
                    <td className="py-2 px-3.5 text-muted-foreground border-r border-border/40">
                      ပစ္စည်း {'{count}'} ခု
                    </td>
                    <td className="py-2 px-3.5 text-muted-foreground">
                      {'{count}'}個のアイテム
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Drop Zone Callout Footer */}
            <div className="px-3.5 py-3 sm:px-5 sm:py-3 bg-muted/40 border-t border-border/60 flex flex-col lg:flex-row items-center justify-between gap-2.5 sm:gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground text-center lg:text-left">
                <UploadCloud className="size-4 text-primary shrink-0 hidden sm:inline-block" />
                <span className="text-[11px] sm:text-xs">
                  <strong className="text-foreground font-semibold">Click or drop files anywhere</strong> on this preview to load instantly into workspace
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap lg:flex-nowrap justify-center shrink-0">
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
              className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 transition-all duration-300 pointer-events-none ${
                isDragOver
                  ? 'opacity-100 backdrop-blur-md bg-background/85'
                  : 'opacity-0 group-hover:opacity-100 backdrop-blur-xs sm:backdrop-blur-sm bg-background/80'
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

      {/* 4. Proof Metric Strip */}
      <section className="w-full border-y border-border/60 bg-muted/20 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">100%</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">In-Browser Privacy</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">8+ Formats</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">JSON, ARB, Excel & More</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">AES-256</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Zero-Knowledge Sharing</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">Stdio MCP</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Claude & Cursor Integration</p>
          </div>
        </div>
      </section>

      {/* 5. Features & Architectural Highlights */}
      <section id="features" className="w-full py-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="mb-2 text-xs font-mono text-primary border-primary/30">
            Core Architecture
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Engineered for Modern Internationalization
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Every feature is built around real-world developer pains, from corrupted ICU variables to legacy font encodings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="border-border/80 bg-card/60 shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="size-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                <ShieldCheck className="size-5" />
              </div>
              <CardTitle className="text-base">100% In-Browser Privacy</CardTitle>
              <CardDescription className="text-xs">Zero remote databases or background tracking</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Files are parsed, validated, and translated right in your browser via Web Workers and Web Crypto. Your company proprietary copy never touches our servers.
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="size-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
                <Lock className="size-5" />
              </div>
              <CardTitle className="text-base">Zero-Knowledge Team Handoff</CardTitle>
              <CardDescription className="text-xs">End-to-end client-side encryption</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Share encrypted `.jsonlink` project bundles or instant URL fragments. Data is locked with PBKDF2 key derivation and AES-256-GCM before leaving your tab.
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="size-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2">
                <Sparkles className="size-5" />
              </div>
              <CardTitle className="text-base">ICU Variable-Safe AI Translation</CardTitle>
              <CardDescription className="text-xs">Bring your own OpenRouter key</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Batch translate missing keys with strict AST placeholder protection. Never suffer hallucinated variable names or broken ICU plurals again.
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="size-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-2">
                <Layers className="size-5" />
              </div>
              <CardTitle className="text-base">Flutter ARB Native</CardTitle>
              <CardDescription className="text-xs">First-class mobile localization support</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Round-trip Flutter ARB files while preserving <code className="font-mono text-cyan-600 dark:text-cyan-400">@key</code> descriptions, placeholders, and type annotations alongside Android XML and iOS Strings.
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="size-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
                <Languages className="size-5" />
              </div>
              <CardTitle className="text-base">Zawgyi ⇄ Unicode Auto-Detect</CardTitle>
              <CardDescription className="text-xs">Legacy Myanmar font resilience</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Automatically detect legacy Myanmar Zawgyi encodings in incoming spreadsheets or JSON strings, with 1-click lossless Rabbit conversion.
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="size-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-2">
                <Terminal className="size-5" />
              </div>
              <CardTitle className="text-base">Stdio MCP Server for AI IDEs</CardTitle>
              <CardDescription className="text-xs">Connect to Claude Desktop & Cursor</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Use standard Model Context Protocol (stdio JSON-RPC 2.0) to lint missing keys, validate translations, and update locales directly from your IDE prompt.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 6. Formats Showcase */}
      <section id="formats" className="w-full py-16 px-4 sm:px-6 bg-muted/15 border-y border-border/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="outline" className="mb-2 text-xs font-mono text-primary border-primary/30">
              Ecosystem
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Universal File Format Compatibility
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Import from any stack, edit in one unified spreadsheet grid, and export clean files matching your framework structure.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...leftFormats, ...rightFormats].map((f, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 hover:bg-card/80 transition-all flex flex-col gap-1.5 shadow-2xs hover:scale-[1.02]"
              >
                <div className="flex items-center gap-2.5">
                  {f.renderLogo('size-5 shrink-0')}
                  <h4 className="text-xs font-bold text-foreground">{f.name}</h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. How It Works (3 Steps) */}
      <section id="architecture" className="w-full py-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="mb-2 text-xs font-mono text-primary border-primary/30">
            Workflow
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            How JSON Link Works
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Go from scattered translation files to a synchronized localized release in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border/70 bg-card/40">
            <span className="size-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mb-4">
              1
            </span>
            <h3 className="text-base font-bold text-foreground mb-1.5">Drop or Import</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Drag your existing locale files into the browser or start fresh with an empty sheet. No account or onboarding needed.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border/70 bg-card/40">
            <span className="size-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mb-4">
              2
            </span>
            <h3 className="text-base font-bold text-foreground mb-1.5">Edit & AI Translate</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Review strings in a full-featured spreadsheet. Detect missing keys, run variable-safe OpenRouter AI translation, and convert Zawgyi with 1 click.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border/70 bg-card/40">
            <span className="size-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mb-4">
              3
            </span>
            <h3 className="text-base font-bold text-foreground mb-1.5">Export & Handoff</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Download perfectly formatted nested JSON, ARB, or Excel files, or generate an encrypted `.jsonlink` file for zero-knowledge team handoff.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Frequently Asked Questions (FAQ) */}
      <section id="faq" className="w-full py-16 px-4 sm:px-6 bg-muted/15 border-t border-border/60">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-2 text-xs font-mono text-primary border-primary/30">
              Answers
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                q: 'Does any translation data ever touch your servers?',
                a: 'Never. JSON Link is strictly 100% client-side. All parsing, validation, AES-256 encryption, and file generation take place entirely inside your browser tab through Web Workers and Web Crypto.',
              },
              {
                q: 'How does zero-knowledge encrypted sharing work without a database?',
                a: 'Team handoffs package your translation keys and metadata into a single `.jsonlink` file or URL hash fragment encrypted with AES-256-GCM. The encryption key is derived locally using PBKDF2 with 100,000 iterations. Only those with the password can decrypt it.',
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
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border/70 bg-card overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-5 py-4 text-left font-semibold text-sm text-foreground flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>



      {/* 10. Rich Footer */}
      <footer className="w-full py-8 px-4 sm:px-6 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" showText={true} />
            <span className="text-muted-foreground/60 hidden sm:inline">·</span>
            <span className="text-[11px] text-muted-foreground">
              Developed with <Heart className="size-3 text-rose-500 fill-rose-500 inline mx-0.5" /> by <strong className="text-foreground">Pyae Phyo Maung</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
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
          </div>
        </div>
      </footer>
    </div>
  );
};
