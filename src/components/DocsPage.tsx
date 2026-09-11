import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SpreadsheetTable } from '@/components/SpreadsheetTable';
import { Toolbar } from '@/components/Toolbar';
import { TranslationItem, RowStatus } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Check,
  Sun,
  Moon,
  Search,
  BookOpen,
  Sparkles,
  Table2,
  MousePointerClick,
  Activity,
  Keyboard,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  Undo2,
  Copy,
  Download,
  AlertCircle,
  Layers,
  Globe,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface DocsPageProps {
  onBack: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const APP_VERSION = 'v1.0.0';

type DocSectionId =
  | 'getting-started'
  | 'spreadsheet-editing'
  | 'context-menu'
  | 'ai-translation'
  | 'linter-scorecard'
  | 'exporters'
  | 'keyboard-shortcuts';

interface DocSection {
  id: DocSectionId;
  title: string;
  badge: string;
  icon: React.ReactNode;
}

const SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Quick Start & Formats',
    badge: 'Step 1',
    icon: <FileSpreadsheet className="size-4" />,
  },
  {
    id: 'spreadsheet-editing',
    title: 'Spreadsheet & Formula Bar',
    badge: 'Step 2',
    icon: <Table2 className="size-4" />,
  },
  {
    id: 'context-menu',
    title: 'Cell Context Menu & Fonts',
    badge: 'Step 3',
    icon: <MousePointerClick className="size-4" />,
  },
  {
    id: 'ai-translation',
    title: 'AI Auto-Translate & Glossary',
    badge: 'Step 4',
    icon: <Sparkles className="size-4" />,
  },
  {
    id: 'linter-scorecard',
    title: 'QA Linter & Scorecard',
    badge: 'Step 5',
    icon: <Activity className="size-4" />,
  },
  {
    id: 'exporters',
    title: 'Universal Exporters & ARB',
    badge: 'Step 6',
    icon: <Download className="size-4" />,
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Shortcuts & Power Tips',
    badge: 'Step 7',
    icon: <Keyboard className="size-4" />,
  },
];

const INITIAL_DEMO_ITEMS: TranslationItem[] = [
  {
    key: 'app.title',
    namespace: 'app',
    en: 'JSON Link Studio',
    my: 'JSON လင့်ခ် စတူဒီယို',
    ja: 'JSON Link スタジオ',
    status: 'approved',
  },
  {
    key: 'welcome.message',
    namespace: 'welcome',
    en: 'Welcome back, {username}!',
    my: 'ကြိုဆိုပါသည် {username}!',
    ja: 'おかえりなさい、{username}さん！',
    status: 'approved',
  },
  {
    key: 'button.save',
    namespace: 'button',
    en: 'Save Changes',
    my: 'သိမ်းဆည်းရန်',
    ja: '変更を保存',
    status: 'needs-review',
  },
  {
    key: 'button.cancel',
    namespace: 'button',
    en: 'Cancel Operation',
    my: '',
    ja: 'キャンセル',
    status: 'draft',
  },
];

const FORMAT_LIST = [
  { name: 'Project (.jsonlink)', ext: '.jsonlink', desc: 'Full workspace bundle with history & settings', color: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'Flutter ARB (.arb)', ext: '.arb', desc: 'Official Flutter localization with @key metadata', color: 'text-cyan-600 dark:text-cyan-400' },
  { name: 'JSON (.json)', ext: '.json', desc: 'Nested or flattened key-value pairs for React & Next.js', color: 'text-blue-600 dark:text-blue-400' },
  { name: 'Excel (.xlsx)', ext: '.xlsx', desc: 'Spreadsheet workbook with dynamic auto-sized columns', color: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'CSV (.csv)', ext: '.csv', desc: 'UTF-8 BOM comma-separated table for Excel & Google Sheets', color: 'text-sky-600 dark:text-sky-400' },
  { name: 'YAML (.yaml)', ext: '.yaml', desc: 'Indented syntax for Rails and Flutter flutter_i18n', color: 'text-amber-600 dark:text-amber-400' },
  { name: 'Android (.xml)', ext: '.xml', desc: 'Standard res/values/strings.xml with resource comments', color: 'text-purple-600 dark:text-purple-400' },
  { name: 'iOS (.strings)', ext: '.strings', desc: 'Apple Xcode Localizable.strings with block comments', color: 'text-pink-600 dark:text-pink-400' },
];

function AppleStepFooter({
  prevSection,
  nextSection,
  onSelect,
}: {
  prevSection: DocSection | null;
  nextSection: DocSection | null;
  onSelect: (id: DocSectionId) => void;
}) {
  if (!prevSection && !nextSection) return null;

  return (
    <div className="pt-6 mt-8 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 select-none">
      {prevSection ? (
        <button
          onClick={() => onSelect(prevSection.id)}
          className="flex-1 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors text-left flex items-center gap-3 cursor-pointer group shadow-xs"
        >
          <span className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary shrink-0 transition-colors">
            <ArrowLeft className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
              Previous • {prevSection.badge}
            </div>
            <div className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
              Go to {prevSection.title}
            </div>
          </div>
        </button>
      ) : (
        <div className="hidden sm:block flex-1" />
      )}

      {nextSection && (
        <button
          onClick={() => onSelect(nextSection.id)}
          className="flex-1 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors text-right flex items-center justify-end gap-3 cursor-pointer group shadow-xs"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
              Next • {nextSection.badge}
            </div>
            <div className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
              Continue to {nextSection.title}
            </div>
          </div>
          <span className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <ArrowRight className="size-4" />
          </span>
        </button>
      )}
    </div>
  );
}

export function DocsPage({ onBack, isDark, onToggleTheme }: DocsPageProps) {
  const [activeSection, setActiveSection] = useState<DocSectionId>('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const mainRef = React.useRef<HTMLElement>(null);

  // Scroll to top when active section changes
  useEffect(() => {
    if (mainRef.current) {
      if (typeof mainRef.current.scrollTo === 'function') {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        mainRef.current.scrollTop = 0;
      }
    }
  }, [activeSection]);

  // Interactive Live Spreadsheet instance for the docs
  const [demoItems, setDemoItems] = useState<TranslationItem[]>(INITIAL_DEMO_ITEMS);
  const [demoFilter, setDemoFilter] = useState<'all' | 'missing'>('all');
  const [demoStatusFilter, setDemoStatusFilter] = useState<'all' | 'needs-review' | 'draft' | 'approved'>('all');
  const [demoSearch, setDemoSearch] = useState('');

  // Esc key returns to workspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const handleUpdateDemoCell = (key: string, lang: string, value: string) => {
    setDemoItems(prev =>
      prev.map(item => (item.key === key ? { ...item, [lang]: value } : item))
    );
  };

  const handleDeleteDemoRow = (key: string) => {
    setDemoItems(prev => prev.filter(item => item.key !== key));
  };

  const handleUpdateDemoStatus = (key: string, status: RowStatus) => {
    setDemoItems(prev =>
      prev.map(item => (item.key === key ? { ...item, status } : item))
    );
  };

  const filteredSections = SECTIONS.filter(
    s =>
      !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.badge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
  const currentSection = SECTIONS[currentIndex] || SECTIONS[0];
  const prevSection = currentIndex > 0 ? SECTIONS[currentIndex - 1] : null;
  const nextSection = currentIndex < SECTIONS.length - 1 ? SECTIONS[currentIndex + 1] : null;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground">
      {/* Top Header — matches app header (h-12, bg-card, border-b) */}
      <header className="border-b border-border bg-card px-3 sm:px-4 h-12 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
            title="Back to Workspace (Esc)"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Back to Workspace</span>
            <span className="sm:hidden">Back</span>
          </Button>

          <div className="h-4 w-px bg-border/80 hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <Logo size="sm" showText={false} />
            <span className="text-xs font-bold text-foreground truncate">
              Documentation & User Guide
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-36 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-7.5 pl-8 pr-2.5 text-xs rounded-lg bg-background border-border"
            />
          </div>

          <Badge variant="success" className="font-mono text-[10px]">
            {APP_VERSION}
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="size-7 rounded cursor-pointer"
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </Button>
        </div>
      </header>

      {/* Main Workspace Layout: Sidebar Navigation + Content Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Navigation: Segmented Bar on Mobile, Sidebar on Desktop */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card md:bg-muted/20 p-3 shrink-0 flex flex-col gap-2 md:gap-1.5 md:overflow-y-auto">
          {/* Mobile Stepper Header with Dropdown */}
          <div className="md:hidden flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-6 rounded-lg bg-primary/10 text-primary text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                {currentIndex + 1}
              </span>
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                  Step {currentIndex + 1} of {SECTIONS.length}
                </div>
                <div className="text-xs font-bold text-foreground truncate">
                  {currentSection.badge}: {currentSection.title}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2.5 rounded-lg font-medium border-border cursor-pointer">
                  <span>All Steps</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-1 rounded-xl border border-border bg-popover shadow-lg">
                <DropdownMenuLabel className="text-[10px] uppercase font-mono text-muted-foreground px-2 py-1">
                  Documentation Steps
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SECTIONS.map((sec, idx) => {
                  const isAct = sec.id === activeSection;
                  return (
                    <DropdownMenuItem
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id)}
                      className={`gap-2.5 p-2 rounded-lg text-xs cursor-pointer ${
                        isAct ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <span className={`size-5 rounded-md flex items-center justify-center text-[10px] font-mono shrink-0 ${
                        isAct ? 'bg-primary-foreground/20 text-primary-foreground font-bold' : 'bg-muted text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="truncate flex-1">{sec.badge}: {sec.title}</span>
                      {isAct && <Check className="size-3.5 text-primary-foreground shrink-0" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Sidebar Header */}
          <div className="hidden md:flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 py-1">
            <span>Guide Steps</span>
            <span className="font-mono text-[10px] text-primary">{currentIndex + 1} / {SECTIONS.length}</span>
          </div>

          {/* Progress Indicator Bar */}
          <div className="w-full bg-muted h-1 rounded-full overflow-hidden mb-1">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / SECTIONS.length) * 100}%` }}
            />
          </div>

          {/* Steps List */}
          <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible no-scrollbar -mx-1 px-1 md:mx-0 md:px-0 py-0.5">
            {filteredSections.map(sec => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`group flex items-center gap-2 px-3 py-1.5 md:px-3 md:py-2 rounded-lg text-left text-xs whitespace-nowrap md:whitespace-normal transition-all shrink-0 md:w-full cursor-pointer select-none ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-muted/60 md:bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span className={`size-5 md:size-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {sec.icon}
                  </span>
                  <span className="truncate flex-1">{sec.title}</span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono hidden lg:inline-block ${
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground font-semibold'
                        : 'bg-muted/70 text-muted-foreground'
                    }`}
                  >
                    {sec.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Scrollable Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {activeSection === 'getting-started' && <GettingStartedSection />}
          {activeSection === 'spreadsheet-editing' && (
            <SpreadsheetEditingSection
              items={demoItems}
              activeFilter={demoFilter}
              statusFilter={demoStatusFilter}
              searchQuery={demoSearch}
              onFilterChange={setDemoFilter}
              onStatusChange={setDemoStatusFilter}
              onSearchChange={setDemoSearch}
              onUpdateCell={handleUpdateDemoCell}
              onDeleteRow={handleDeleteDemoRow}
              onUpdateStatus={handleUpdateDemoStatus}
              onReset={() => setDemoItems(INITIAL_DEMO_ITEMS)}
            />
          )}
          {activeSection === 'context-menu' && (
            <ContextMenuSection
              items={demoItems}
              onUpdateCell={handleUpdateDemoCell}
              onDeleteRow={handleDeleteDemoRow}
              onUpdateStatus={handleUpdateDemoStatus}
            />
          )}
          {activeSection === 'ai-translation' && <AiTranslationSection />}
          {activeSection === 'linter-scorecard' && <LinterScorecardSection />}
          {activeSection === 'exporters' && <ExportersSection />}
          {activeSection === 'keyboard-shortcuts' && <ShortcutsSection />}

          {/* Apple-style Step Navigation Footer */}
          <AppleStepFooter
            prevSection={prevSection}
            nextSection={nextSection}
            onSelect={setActiveSection}
          />
        </main>
      </div>
    </div>
  );
}

/* =========================================================================
   Section 1: Quick Start & File Formats
   ========================================================================= */
function GettingStartedSection() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
            Step 1
          </Badge>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Quick Start & Supported File Formats
          </h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          JSON Link is a 100% client-side multilingual localization workspace. You can drag and drop multiple language files simultaneously to open an authentic Excel-style spreadsheet.
        </p>
      </div>

      {/* Visual Annotation Callout Card */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Supported File Formats & Roundtrip Ingestion</span>
          <span className="text-[10px] text-primary font-normal">All 8 formats share two-way support</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {FORMAT_LIST.map(fmt => (
            <div
              key={fmt.name}
              className="p-3 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors space-y-1"
            >
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${fmt.color}`}>
                  {fmt.name}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {fmt.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="size-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
            1
          </div>
          <h4 className="text-xs font-bold text-foreground">Drag & Drop Files</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Drag multiple language files together (e.g. <code className="font-mono text-primary text-[10px]">en.json</code> and <code className="font-mono text-primary text-[10px]">my.json</code>, or Flutter <code className="font-mono text-primary text-[10px]">app_en.arb</code>). They automatically align side-by-side.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="size-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
            2
          </div>
          <h4 className="text-xs font-bold text-foreground">Edit & Audit</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Double-click cells to edit text, use the Formula Bar for long strings, run the QA linter for whitespace issues, and batch translate missing keys with AI.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="size-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
            3
          </div>
          <h4 className="text-xs font-bold text-foreground">Export Anywhere</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Download your localized project as a multi-platform bundle ZIP, individual Flutter ARB files, iOS .strings, Android strings.xml, Excel workbooks, or CSV.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Section 2: Spreadsheet & Formula Bar (Actual Product Components Embedded!)
   ========================================================================= */
interface SpreadsheetEditingSectionProps {
  items: TranslationItem[];
  activeFilter: 'all' | 'missing';
  statusFilter: 'all' | 'needs-review' | 'draft' | 'approved';
  searchQuery: string;
  onFilterChange: (f: 'all' | 'missing') => void;
  onStatusChange: (s: 'all' | 'needs-review' | 'draft' | 'approved') => void;
  onSearchChange: (q: string) => void;
  onUpdateCell: (key: string, lang: string, val: string) => void;
  onDeleteRow: (key: string) => void;
  onUpdateStatus: (key: string, status: RowStatus) => void;
  onReset: () => void;
}

function SpreadsheetEditingSection({
  items,
  activeFilter,
  statusFilter,
  searchQuery,
  onFilterChange,
  onStatusChange,
  onSearchChange,
  onUpdateCell,
  onDeleteRow,
  onUpdateStatus,
  onReset,
}: SpreadsheetEditingSectionProps) {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
            Step 2
          </Badge>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            The Spreadsheet Grid & Live Formula Bar
          </h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          The centerpiece of JSON Link is an authentic, edge-to-edge spreadsheet interface with freeze panes, drag column resizing, multiline editing, and live Formula Bar. Below is a live instance of the actual spreadsheet component.
        </p>
      </div>

      {/* Visual Annotation Callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-border bg-card space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <span className="size-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Formula Bar (fx)</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Displays the active cell address (e.g. <code className="font-mono text-primary text-[10px]">C2 [my]</code>) and allows inspecting long multiline translations.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-border bg-card space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <span className="size-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Freeze Panes</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Index numbers (#) and Translation Key columns stay pinned to the left while scrolling through 10+ language columns horizontally.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-border bg-card space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <span className="size-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Keyboard & Inline Edit</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Use arrow keys to navigate. Double-click or press <kbd className="px-1 py-0.2 bg-muted rounded border text-[10px]">Enter</kbd> to edit inline. Press <kbd className="px-1 py-0.2 bg-muted rounded border text-[10px]">Tab</kbd> to advance.
          </p>
        </div>
      </div>

      {/* ACTUAL PRODUCT COMPONENT EMBEDDED: Toolbar & SpreadsheetTable */}
      <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm flex flex-col h-[380px] sm:h-[420px]">
        {/* Mobile Swipe Guide Banner */}
        <div className="px-3 py-1.5 bg-muted/40 border-b border-border/60 text-[10px] text-muted-foreground flex items-center justify-between sm:hidden select-none">
          <span className="font-semibold text-foreground">Interactive Demo</span>
          <span>Swipe grid for all columns →</span>
        </div>

        {/* Actual Toolbar component */}
        <Toolbar
          hasItems={items.length > 0}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedNamespace="all"
          namespaces={['all', 'app', 'welcome', 'button']}
          onNamespaceChange={() => { }}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusChange}
          onOpenAddKey={() => { }}
          onOpenAddLanguage={() => { }}
          onOpenImport={() => { }}
          onOpenExport={() => { }}
          onOpenAiTranslate={() => { }}
          onResetToSample={onReset}
          onClearAll={() => { }}
        />

        {/* Actual SpreadsheetTable component */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <SpreadsheetTable
            items={items}
            languages={['en', 'my', 'ja']}
            onUpdateCell={onUpdateCell}
            onUpdateKey={() => { }}
            onDeleteRow={onDeleteRow}
            onAddRow={() => { }}
            onOpenImport={() => { }}
            onUpdateRowStatus={onUpdateStatus}
          />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground italic">
        * Interactive demo: You can click cells, edit text, and right-click to test the actual context menu in the live grid above!
      </p>
    </div>
  );
}

/* =========================================================================
   Section 3: Cell Context Menu & Font Tools
   ========================================================================= */
interface ContextMenuSectionProps {
  items: TranslationItem[];
  onUpdateCell: (key: string, lang: string, val: string) => void;
  onDeleteRow: (key: string) => void;
  onUpdateStatus: (key: string, status: RowStatus) => void;
}

function ContextMenuSection({
  items,
  onUpdateCell,
  onDeleteRow,
  onUpdateStatus,
}: ContextMenuSectionProps) {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">
            Step 3
          </Badge>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Cell Right-Click Context Menu & Font Tools
          </h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Right-click any translation cell to trigger instant actions without leaving your typing flow. The menu has clean, unified styling with zero visual clutter.
        </p>
      </div>

      {/* Menu Actions Explanation Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="hidden sm:grid sm:grid-cols-12 bg-muted/60 px-4 py-2 text-xs font-bold text-muted-foreground border-b border-border">
          <span className="col-span-4 sm:col-span-3">Action</span>
          <span className="col-span-8 sm:col-span-9">Description & Workflow</span>
        </div>

        <div className="divide-y divide-border/60 text-xs">
          <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:grid sm:grid-cols-12 gap-1.5 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors">
            <span className="sm:col-span-4 sm:col-span-3 font-semibold text-foreground flex items-center gap-2">
              <span className="size-6 sm:size-auto rounded-md bg-muted/60 sm:bg-transparent flex items-center justify-center shrink-0">
                <MousePointerClick className="size-3.5 text-muted-foreground" />
              </span>
              <span>Edit Cell</span>
            </span>
            <span className="sm:col-span-8 sm:col-span-9 text-muted-foreground text-[11px] sm:text-xs leading-relaxed pl-8 sm:pl-0">
              Immediately activates the inline text input or Formula Bar for the selected cell.
            </span>
          </div>

          <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:grid sm:grid-cols-12 gap-1.5 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors">
            <span className="sm:col-span-4 sm:col-span-3 font-semibold text-foreground flex items-center gap-2">
              <span className="size-6 sm:size-auto rounded-md bg-muted/60 sm:bg-transparent flex items-center justify-center shrink-0">
                <Copy className="size-3.5 text-muted-foreground" />
              </span>
              <span>Copy & Paste</span>
            </span>
            <span className="sm:col-span-8 sm:col-span-9 text-muted-foreground text-[11px] sm:text-xs leading-relaxed pl-8 sm:pl-0">
              Copies text to the system clipboard or pastes external content directly into the targeted cell.
            </span>
          </div>

          <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:grid sm:grid-cols-12 gap-1.5 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors">
            <span className="sm:col-span-4 sm:col-span-3 font-semibold text-foreground flex items-center gap-2">
              <span className="size-6 sm:size-auto rounded-md bg-muted/60 sm:bg-transparent flex items-center justify-center shrink-0">
                <Undo2 className="size-3.5 text-muted-foreground" />
              </span>
              <span>1-Click Revert</span>
            </span>
            <span className="sm:col-span-8 sm:col-span-9 text-muted-foreground text-[11px] sm:text-xs leading-relaxed pl-8 sm:pl-0">
              If a cell was accidentally edited or translated, restores the cell back to its original loaded file value.
            </span>
          </div>

          <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:grid sm:grid-cols-12 gap-1.5 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors">
            <span className="sm:col-span-4 sm:col-span-3 font-semibold text-foreground flex items-center gap-2">
              <span className="size-6 sm:size-auto rounded-md bg-muted/60 sm:bg-transparent flex items-center justify-center shrink-0">
                <Globe className="size-3.5 text-muted-foreground" />
              </span>
              <span>Zawgyi ⇄ Unicode</span>
            </span>
            <span className="sm:col-span-8 sm:col-span-9 text-muted-foreground text-[11px] sm:text-xs leading-relaxed pl-8 sm:pl-0">
              Real-time heuristic detects legacy Zawgyi text and losslessly converts to standard Unicode via the Rabbit engine without altering interpolation variables.
            </span>
          </div>

          <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:grid sm:grid-cols-12 gap-1.5 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors">
            <span className="sm:col-span-4 sm:col-span-3 font-semibold text-foreground flex items-center gap-2">
              <span className="size-6 sm:size-auto rounded-md bg-muted/60 sm:bg-transparent flex items-center justify-center shrink-0">
                <Sparkles className="size-3.5 text-muted-foreground" />
              </span>
              <span>AI Translate Row</span>
            </span>
            <span className="sm:col-span-8 sm:col-span-9 text-muted-foreground text-[11px] sm:text-xs leading-relaxed pl-8 sm:pl-0">
              Translates just the active row across missing target languages using your configured OpenRouter model.
            </span>
          </div>

          <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:grid sm:grid-cols-12 gap-1.5 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors">
            <span className="sm:col-span-4 sm:col-span-3 font-semibold text-foreground flex items-center gap-2">
              <span className="size-6 sm:size-auto rounded-md bg-muted/60 sm:bg-transparent flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-3.5 text-muted-foreground" />
              </span>
              <span>Review Statuses</span>
            </span>
            <span className="sm:col-span-8 sm:col-span-9 text-muted-foreground text-[11px] sm:text-xs leading-relaxed pl-8 sm:pl-0">
              Tag rows as Approved (emerald), Needs Review (amber), or Draft (gray) for human QA signoff.
            </span>
          </div>
        </div>
      </div>

      {/* Live Table for testing right-click */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-foreground">Try it: Right-click any cell below</h3>
        <div className="rounded-xl border border-border overflow-hidden bg-card h-[240px]">
          <SpreadsheetTable
            items={items}
            languages={['en', 'my', 'ja']}
            onUpdateCell={onUpdateCell}
            onUpdateKey={() => { }}
            onDeleteRow={onDeleteRow}
            onAddRow={() => { }}
            onOpenImport={() => { }}
            onUpdateRowStatus={onUpdateStatus}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Section 4: AI Auto-Translate & Glossary
   ========================================================================= */
function AiTranslationSection() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
            Step 4
          </Badge>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            AI Auto-Translate, BYOK & Termbase Glossary
          </h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Translate untranslated keys across any language using any AI model available on OpenRouter (Google Gemini 2.5 Flash, DeepSeek V3, Claude 3.5 Sonnet, GPT-4o).
        </p>
      </div>

      {/* Architecture Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-4" />
            <span>BYOK Privacy & AES-GCM 256-bit Encryption</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Bring Your Own Key: Requests travel directly from your browser to OpenRouter's API with zero intermediary servers. Keys are stored in session memory by default, or encrypted client-side with AES-GCM 256-bit if saved.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-blue-500/25 bg-blue-500/5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
            <FileCode className="size-4" />
            <span>Interpolation Variable Protection</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Placeholders such as <code className="font-mono text-primary text-[10px]">{`{username}`}</code>, <code className="font-mono text-primary text-[10px]">%s</code>, <code className="font-mono text-primary text-[10px]">&#123;&#123;count&#125;&#125;</code>, and <code className="font-mono text-primary text-[10px]">$1</code> are shielded in prompt context and verified after translation to prevent runtime application crashes.
          </p>
        </div>
      </div>

      {/* Glossary Feature */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <BookOpen className="size-4 text-purple-500" />
          <span>Termbase & Glossary Management</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Define brand names and technical terms that must be strictly preserved across all languages:
        </p>
        <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
          <li><strong>Keep Original:</strong> Instructs the AI model never to translate or transliterate brand names (e.g., "JSON Link" stays "JSON Link").</li>
          <li><strong>Custom Target Translation:</strong> Specifies the exact required word for a specific target locale.</li>
        </ul>
      </div>
    </div>
  );
}

/* =========================================================================
   Section 5: QA Consistency Linter & Scorecard
   ========================================================================= */
function LinterScorecardSection() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs">
            Step 5
          </Badge>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Localization QA Consistency Linter & Scorecard
          </h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Automated scans audit your entire translation dataset to prevent common bugs, whitespace discrepancies, and variable mismatches before shipping to production.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-500" /> Whitespace & Auto-Fix
          </h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Identifies accidental leading or trailing spaces. The "Fix All Whitespace" button trims every language column in one click.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="size-3.5 text-amber-500" /> Variable Mismatches
          </h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Alerts you when target translations omit source parameters (e.g. source has <code className="font-mono text-primary text-[10px]">{`{count}`}</code> but translated text forgot it).
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
            <Layers className="size-3.5 text-blue-500" /> Text Expansion Warning
          </h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Flags translations expanding beyond 40% of source length that may cause clipping or awkward line wrapping on mobile layouts.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
            <Activity className="size-3.5 text-purple-500" /> Completion Scorecard
          </h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Visual progress bars display real-time translation completion percentages (0% to 100%) for each configured language column.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Section 6: Universal Exporters & Flutter ARB
   ========================================================================= */
function ExportersSection() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 text-xs">
            Step 6
          </Badge>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Universal Exporters & Flutter ARB Integration
          </h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Export your translation project into ready-to-ship files across every major frontend and mobile development framework.
        </p>
      </div>

      <div className="p-4 rounded-xl border border-cyan-500/25 bg-cyan-500/5 space-y-3">
        <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
          <FileCode className="size-4 text-cyan-600 dark:text-cyan-400" />
          <span>Flutter ARB (.arb) First-Class Roundtrip</span>
        </h3>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Flutter ARB files are fully supported with two-way preservation:
        </p>
        <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
          <li><strong>Metadata Preservation:</strong> Imports and exports <code className="font-mono text-cyan-600 dark:text-cyan-400 text-[10px]">@key</code> description and placeholder objects accurately.</li>
          <li><strong>Single-File Column Download:</strong> Click any language column dropdown in the spreadsheet table and choose <code className="font-mono text-[10px]">Download app_&lt;lang&gt;.arb</code> for an instant single-file export.</li>
          <li><strong>ZIP Bundle:</strong> Exports all configured languages into a clean <code className="font-mono text-[10px]">flutter-l10n/</code> directory structure.</li>
        </ul>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <h3 className="text-xs font-bold text-foreground">Multi-Platform Project Bundle (ZIP)</h3>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          With one click from the Export modal, generate a complete multi-framework archive containing:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 rounded bg-muted/40 border border-border/60">web-locales/&#123;lang&#125;.json</div>
          <div className="p-2 rounded bg-muted/40 border border-border/60">flutter-l10n/app_&#123;lang&#125;.arb</div>
          <div className="p-2 rounded bg-muted/40 border border-border/60">ios-strings/&#123;lang&#125;.lproj/Localizable.strings</div>
          <div className="p-2 rounded bg-muted/40 border border-border/60">android-res/values-&#123;lang&#125;/strings.xml</div>
          <div className="p-2 rounded bg-muted/40 border border-border/60 col-span-1 sm:col-span-2">typescript/translations.d.ts</div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Section 7: Keyboard Shortcuts & Power Tips
   ========================================================================= */
function ShortcutsSection() {
  const shortcuts = [
    { key: 'Cmd / Ctrl + K', action: 'Open Command Palette (search actions, shortcuts, and navigation)', category: 'Global' },
    { key: 'Cmd / Ctrl + H', action: 'Open Find & Replace Across Languages dialog', category: 'Editing' },
    { key: 'Cmd / Ctrl + Z', action: 'Undo last change (supports up to 50 historical snapshots)', category: 'History' },
    { key: 'Cmd / Ctrl + Y', action: 'Redo previously undone change', category: 'History' },
    { key: 'Cmd / Ctrl + S', action: 'Save complete .jsonlink project backup file', category: 'File' },
    { key: 'Arrow Keys', action: 'Navigate selection between spreadsheet cells', category: 'Grid' },
    { key: 'Enter / F2', action: 'Start editing the active cell inline', category: 'Grid' },
    { key: 'Tab / Shift + Tab', action: 'Move to next or previous language column', category: 'Grid' },
    { key: 'Escape', action: 'Exit cell editing mode or dismiss open modals', category: 'Global' },
    { key: 'Right-Click', action: 'Open Cell Context Menu (Copy, Paste, Revert, Zawgyi, AI Translate)', category: 'Mouse' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 text-xs">
            Step 7
          </Badge>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Keyboard Shortcuts & Power User Tips
          </h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Master these keyboard shortcuts to navigate and translate datasets with maximum speed.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="hidden sm:grid sm:grid-cols-12 bg-muted/60 px-4 py-2 text-xs font-bold text-muted-foreground border-b border-border">
          <span className="col-span-4 sm:col-span-3">Shortcut</span>
          <span className="col-span-6 sm:col-span-7">Action</span>
          <span className="col-span-2 text-right">Category</span>
        </div>

        <div className="divide-y divide-border/60">
          {shortcuts.map(s => (
            <div
              key={s.key}
              className="p-3 sm:px-4 sm:py-2.5 text-xs flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors"
            >
              <div className="sm:col-span-4 sm:col-span-3 flex items-center justify-between sm:justify-start">
                <kbd className="px-2 py-1 rounded bg-muted border border-border font-mono text-[11px] font-semibold text-foreground shadow-2xs">
                  {s.key}
                </kbd>
                <span className="sm:hidden text-[10px] uppercase font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                  {s.category}
                </span>
              </div>
              <span className="sm:col-span-6 sm:col-span-7 text-foreground font-medium text-[11px] sm:text-xs">
                {s.action}
              </span>
              <span className="hidden sm:block sm:col-span-2 text-right text-[11px] text-muted-foreground">
                {s.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
