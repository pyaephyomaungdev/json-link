import React, { useState, useEffect, useRef } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GithubIcon } from '@/components/GithubIcon';
import { SpreadsheetTable } from '@/components/SpreadsheetTable';
import { Toolbar } from '@/components/Toolbar';
import { TranslationItem, RowStatus } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
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
  AlertTriangle,
  Info,
  Layers,
  Globe,
  GitPullRequest,
  Zap,
  Star,
  Terminal,
  ExternalLink,
  Lock,
  Wifi,
  Radio,
  Users,
  Sliders,
  FolderSync,
  Menu,
  X,
  ThumbsUp,
  ThumbsDown,
  FileText,
} from 'lucide-react';

interface DocsPageProps {
  onBack: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const APP_VERSION = 'v1.2.0';
const GITHUB_URL = 'https://github.com/pyaephyomaungdev/json-link';

export type DocSectionId =
  | 'getting-started'
  | 'spreadsheet-editing'
  | 'context-menu'
  | 'icu-builder'
  | 'ai-translation'
  | 'linter-scorecard'
  | 'exporters'
  | 'enterprise-formats'
  | 'folder-sync'
  | 'github-sync'
  | 'live-collab'
  | 'mcp-server'
  | 'keyboard-shortcuts';

export interface DocTocItem {
  id: string;
  label: string;
}

export interface DocSection {
  id: DocSectionId;
  title: string;
  badge?: string;
  icon: React.ReactNode;
  category: string;
  description: string;
  toc: DocTocItem[];
}

export interface DocCategory {
  title: string;
  sections: DocSection[];
}

export const DOC_CATEGORIES: DocCategory[] = [
  {
    title: 'Getting Started',
    sections: [
      {
        id: 'getting-started',
        title: 'Quick Start',
        icon: <FileSpreadsheet className="size-4" />,
        category: 'Getting Started',
        description: 'Drop a locale file, edit a cell, export. No account.',
        toc: [
          { id: 'three-steps', label: 'Open, edit, export' },
          { id: 'formats', label: 'Supported file formats' },
          { id: 'overview', label: 'How files become a grid' },
          { id: 'ast-schema', label: 'Developer: in-memory schema' },
        ],
      },
    ],
  },
  {
    title: 'Core Engine',
    sections: [
      {
        id: 'spreadsheet-editing',
        title: 'Spreadsheet & Formula Bar',
        badge: 'Grid',
        icon: <Table2 className="size-4" />,
        category: 'Core Engine',
        description: 'Authentic edge-to-edge grid with freeze panes, drag resizing, and live Formula Bar.',
        toc: [
          { id: 'overview', label: 'Grid Architecture' },
          { id: 'formula-panes', label: 'Formula Bar & Freeze Panes' },
          { id: 'interactive-grid', label: 'Interactive Sandbox' },
          { id: 'keyboard-nav', label: 'Keyboard Navigation' },
        ],
      },
      {
        id: 'context-menu',
        title: 'Cell Context Menu & Fonts',
        icon: <MousePointerClick className="size-4" />,
        category: 'Core Engine',
        description: 'Right-click cell tools, 1-Click Revert, and Rabbit Zawgyi ⇄ Unicode converter.',
        toc: [
          { id: 'overview', label: 'Cell Actions' },
          { id: 'menu-actions', label: 'Action Specifications' },
          { id: 'zawgyi-unicode', label: 'Zawgyi ⇄ Unicode Engine' },
          { id: 'try-context-menu', label: 'Context Menu Sandbox' },
        ],
      },
      {
        id: 'icu-builder',
        title: 'Visual ICU Message Builder',
        badge: 'ICU',
        icon: <Sliders className="size-4" />,
        category: 'Core Engine',
        description: 'Construct plural equations, select rules, and validate token syntax safely.',
        toc: [
          { id: 'overview', label: 'ICU Message Syntax' },
          { id: 'plural-builder', label: 'Plural Equation Builder' },
          { id: 'select-cases', label: 'Select Rules' },
          { id: 'syntax-evaluator', label: 'Live Syntax Evaluator' },
        ],
      },
    ],
  },
  {
    title: 'Translation & AI',
    sections: [
      {
        id: 'ai-translation',
        title: 'AI Auto-Translate & Glossary',
        icon: <Sparkles className="size-4" />,
        category: 'Translation & AI',
        description: 'BYOK OpenRouter integration with client-side AES-GCM 256 encryption and termbase glossary.',
        toc: [
          { id: 'overview', label: 'AI Auto-Translate' },
          { id: 'byok-encryption', label: 'AES-GCM 256 Cryptography' },
          { id: 'token-protection', label: 'Token AST Shielding' },
          { id: 'termbase-glossary', label: 'Termbase Glossary' },
        ],
      },
    ],
  },
  {
    title: 'Quality & Assurance',
    sections: [
      {
        id: 'linter-scorecard',
        title: 'QA Linter & Scorecard',
        icon: <Activity className="size-4" />,
        category: 'Quality & Assurance',
        description: 'Automated scans for missing tokens, whitespace issues, and completion health scorecard.',
        toc: [
          { id: 'overview', label: 'QA Consistency Linter' },
          { id: 'rules', label: 'Deterministic Audit Rules' },
          { id: 'whitespace-fix', label: 'Whitespace Auto-Fix' },
          { id: 'health-scorecard', label: 'Health Scorecard' },
        ],
      },
    ],
  },
  {
    title: 'Universal Exporters',
    sections: [
      {
        id: 'exporters',
        title: 'Universal Exporters & ARB',
        icon: <Download className="size-4" />,
        category: 'Universal Exporters',
        description: 'Export ready-to-ship bundles for React, Flutter, iOS, Android, and Vite Starter.',
        toc: [
          { id: 'overview', label: 'Universal Exporters' },
          { id: 'flutter-arb', label: 'Flutter ARB Roundtrip' },
          { id: 'vite-starter', label: 'Vite Plugin & CLI Setup' },
          { id: 'multi-platform-zip', label: 'Multi-Platform ZIP Archive' },
        ],
      },
      {
        id: 'enterprise-formats',
        title: 'XLIFF 1.2 & GNU gettext PO',
        badge: 'Enterprise',
        icon: <FileCode className="size-4" />,
        category: 'Universal Exporters',
        description: 'Enterprise localization standards with translation units, approved states, and gettext PO headers.',
        toc: [
          { id: 'overview', label: 'Enterprise Standards' },
          { id: 'xliff-standard', label: 'XLIFF 1.2 Roundtrip' },
          { id: 'gettext-po', label: 'GNU gettext PO Format' },
          { id: 'cat-interop', label: 'CAT Tools Interoperability' },
        ],
      },
    ],
  },
  {
    title: 'Workflows & Collaboration',
    sections: [
      {
        id: 'folder-sync',
        title: 'Folder Sync & Draft Persistence',
        icon: <FolderSync className="size-4" />,
        category: 'Workflows & Collaboration',
        description: 'Direct disk sync via File System Access API and IndexedDB auto-save recovery.',
        toc: [
          { id: 'overview', label: 'Local-First Architecture' },
          { id: 'fsa-api', label: 'File System Access API' },
          { id: 'indexeddb-drafts', label: 'IndexedDB Draft Recovery' },
        ],
      },
      {
        id: 'github-sync',
        title: 'GitHub Sync & PRs',
        icon: <GitPullRequest className="size-4" />,
        category: 'Workflows & Collaboration',
        description: 'Pull from GitHub repos, edit translations, and create automated Pull Requests.',
        toc: [
          { id: 'overview', label: 'GitHub Synchronization' },
          { id: 'safety-guardrail', label: 'Locales-Only Safety Guardrail' },
          { id: 'workflow-steps', label: 'Pull & PR Workflow' },
          { id: 'pr-summaries', label: 'Automated PR Summaries' },
        ],
      },
      {
        id: 'live-collab',
        title: 'P2P Live Collaboration',
        badge: 'E2EE',
        icon: <Zap className="size-4" />,
        category: 'Workflows & Collaboration',
        description: 'Real-time multi-peer editing over WebRTC DataChannels with Yjs CRDTs and optional E2EE.',
        toc: [
          { id: 'overview', label: 'P2P Live Collaboration' },
          { id: 'how-it-works', label: 'WebRTC & Yjs Protocol' },
          { id: 'e2ee-encryption', label: 'AES-GCM 256 E2EE' },
          { id: 'multiplayer-cursors', label: 'Multiplayer Cursors & Follow' },
          { id: 'quick-start', label: 'Collaboration Quick Start' },
        ],
      },
    ],
  },
  {
    title: 'Developer Platform',
    sections: [
      {
        id: 'mcp-server',
        title: 'MCP Server for AI IDEs',
        badge: 'stdio RPC',
        icon: <Layers className="size-4" />,
        category: 'Developer Platform',
        description: 'Expose JSON Link translation tools to Claude Desktop, Cursor, and Windsurf via stdio JSON-RPC.',
        toc: [
          { id: 'overview', label: 'Model Context Protocol' },
          { id: 'installation', label: 'CLI Installation' },
          { id: 'claude-config', label: 'Claude Desktop Config' },
          { id: 'available-tools', label: 'Available MCP Tools' },
          { id: 'compatible-ides', label: 'Compatible AI IDEs' },
        ],
      },
    ],
  },
  {
    title: 'Reference',
    sections: [
      {
        id: 'keyboard-shortcuts',
        title: 'Shortcuts & Power Tips',
        icon: <Keyboard className="size-4" />,
        category: 'Reference',
        description: 'Complete cheatsheet of keyboard shortcuts, navigation tricks, and power user tips.',
        toc: [
          { id: 'overview', label: 'Overview' },
          { id: 'shortcuts-table', label: 'Shortcuts Cheatsheet' },
          { id: 'power-tips', label: 'Power User Tips' },
        ],
      },
    ],
  },
];

export const SECTIONS: DocSection[] = DOC_CATEGORIES.flatMap(cat => cat.sections);

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

const FORMAT_MATRIX = [
  { name: 'Project (.jsonlink)', ext: '.jsonlink', type: 'Full Bundle', desc: 'Normalized AST, edit history snapshots, termbase glossary, and workspace configuration in a single file.' },
  { name: 'XLIFF 1.2 (.xlf)', ext: '.xlf', type: 'OASIS XML', desc: 'Standard translation-unit interchange for Trados Studio, memoQ, Phrase, and enterprise CAT tools with approved status.' },
  { name: 'GNU gettext (.po)', ext: '.po', type: 'GNU Standard', desc: 'Plural equations, msgid/msgstr pairs, developer comments, and source line references (#: src/...) for gettext engines.' },
  { name: 'Flutter ARB (.arb)', ext: '.arb', type: 'Dart SDK', desc: 'Official Flutter Intl format with full preservation of @key metadata blocks, descriptions, and ICU placeholders.' },
  { name: 'Nested / Flat JSON (.json)', ext: '.json', type: 'Web / Node.js', desc: 'Zero-dependency key-value dictionaries. Automatically flattens during ingestion and restores hierarchy on export.' },
  { name: 'Excel Workbook (.xlsx)', ext: '.xlsx', type: 'Spreadsheet', desc: 'Native binary Excel workbook with auto-sized column widths, freeze pane headers, and row status formatting.' },
  { name: 'UTF-8 CSV (.csv)', ext: '.csv', type: 'Tabular Plaintext', desc: 'RFC 4180 compliant comma-separated table with UTF-8 BOM encoding for Excel and Google Sheets.' },
  { name: 'YAML (.yaml)', ext: '.yaml', type: 'Ruby / Flutter', desc: 'Clean indentation-scoped translation maps for Rails, Flutter flutter_i18n, and Symfony pipelines.' },
  { name: 'Android Resources (.xml)', ext: '.xml', type: 'Android SDK', desc: 'res/values/strings.xml formatted with XML entity escaping and translatable flags.' },
  { name: 'Apple Strings (.strings)', ext: '.strings', type: 'iOS / macOS', desc: 'Xcode Localizable.strings with UTF-16/UTF-8 support and C-style block comments.' },
];

/* =========================================================================
   Understated Developer Callout Component (Stripe / Tailwind Docs Style)
   ========================================================================= */

interface DocCalloutProps {
  type?: 'note' | 'tip' | 'warning' | 'security';
  title?: string;
  children: React.ReactNode;
}

export function DocCallout({ type = 'note', title, children }: DocCalloutProps) {
  const styles = {
    note: {
      border: 'border-border bg-muted/40 text-foreground',
      icon: <Info className="size-4 text-primary shrink-0" />,
      defaultTitle: 'Technical Note',
    },
    tip: {
      border: 'border-border bg-muted/40 text-foreground',
      icon: <CheckCircle2 className="size-4 text-primary shrink-0" />,
      defaultTitle: 'Implementation Best Practice',
    },
    warning: {
      border: 'border-border bg-muted/40 text-foreground',
      icon: <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />,
      defaultTitle: 'Warning & Constraint',
    },
    security: {
      border: 'border-border bg-muted/40 text-foreground',
      icon: <ShieldCheck className="size-4 text-primary shrink-0" />,
      defaultTitle: 'Cryptographic Guarantee',
    },
  };

  const current = styles[type];

  return (
    <aside className={`rounded-lg border p-3.5 text-xs leading-relaxed my-4 space-y-1.5 ${current.border}`}>
      <div className="flex items-center gap-2 font-semibold">
        {current.icon}
        <span className="font-bold text-foreground text-xs">{title || current.defaultTitle}</span>
      </div>
      <div className="text-muted-foreground leading-relaxed pl-6">{children}</div>
    </aside>
  );
}

/* =========================================================================
   Theme-Aware Tabbed Code Block (Design-Token Consistent)
   ========================================================================= */

interface DocCodeTabsProps {
  tabs: {
    label: string;
    code: string;
  }[];
  title?: string;
}

export function DocCodeTabs({ tabs, title }: DocCodeTabsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const current = tabs[activeTab] || tabs[0];

  const handleCopy = () => {
    navigator.clipboard?.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-muted/60 dark:bg-muted/30 overflow-hidden my-4 shadow-2xs font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/90 dark:bg-muted/60 border-b border-border select-none">
        <div className="flex items-center gap-2 min-w-0">
          {title ? (
            <span className="text-xs font-semibold text-muted-foreground font-sans pr-2 border-r border-border truncate">
              {title}
            </span>
          ) : null}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab, idx) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(idx)}
                className={`px-2.5 py-1 rounded-md text-xs font-sans font-medium transition-colors cursor-pointer shrink-0 ${
                  activeTab === idx
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-background transition-colors cursor-pointer shrink-0"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-sans text-xs">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span className="font-sans text-xs">Copy</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-3.5 overflow-x-auto text-xs leading-relaxed text-foreground/90 selection:bg-primary/20">
        <code>{current.code}</code>
      </pre>
    </div>
  );
}

/* =========================================================================
   Bottom Article Pager
   ========================================================================= */

interface DocPagerProps {
  prevSection: DocSection | null;
  nextSection: DocSection | null;
  onSelect: (id: DocSectionId) => void;
}

export function DocPager({ prevSection, nextSection, onSelect }: DocPagerProps) {
  if (!prevSection && !nextSection) return null;

  return (
    <div className="pt-8 mt-12 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3 select-none">
      {prevSection ? (
        <button
          onClick={() => onSelect(prevSection.id)}
          className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all text-left flex items-center gap-3 cursor-pointer group shadow-2xs hover:border-primary/40"
        >
          <span className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 shrink-0 transition-colors">
            <ArrowLeft className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase font-mono text-muted-foreground tracking-wider truncate">
              Previous
            </div>
            <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              Go to {prevSection.title}
            </div>
          </div>
        </button>
      ) : (
        <div className="hidden sm:block" />
      )}

      {nextSection ? (
        <button
          onClick={() => onSelect(nextSection.id)}
          className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all text-right flex items-center justify-end gap-3 cursor-pointer group shadow-2xs hover:border-primary/40 sm:col-start-2"
        >
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase font-mono text-muted-foreground tracking-wider truncate">
              Next
            </div>
            <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              Continue to {nextSection.title}
            </div>
          </div>
          <span className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <ArrowRight className="size-4" />
          </span>
        </button>
      ) : (
        <div className="hidden sm:block" />
      )}
    </div>
  );
}

/* =========================================================================
   Right Table of Contents (On this page)
   ========================================================================= */

interface DocTocProps {
  toc: DocTocItem[];
  activeHeading: string;
  onHeadingClick: (id: string) => void;
}

export function DocToc({ toc, activeHeading, onHeadingClick }: DocTocProps) {
  return (
    <div className="w-56 shrink-0 hidden lg:block sticky top-6 space-y-4 text-xs select-none">
      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs text-muted-foreground">
        <FileText className="size-3.5 text-primary" />
        <span>On this page</span>
      </div>

      <nav className="flex flex-col space-y-1 border-l border-border pl-3">
        {toc.map(item => {
          const isActive = activeHeading === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onHeadingClick(item.id)}
              className={`text-left text-xs py-1 transition-colors block truncate cursor-pointer ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <GithubIcon className="size-3.5" />
          <span>Star on GitHub</span>
          <ExternalLink className="size-3 ml-auto opacity-70" />
        </a>
        <a
          href={`${GITHUB_URL}/issues`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <AlertCircle className="size-3.5" />
          <span>Report Documentation Bug</span>
          <ExternalLink className="size-3 ml-auto opacity-70" />
        </a>
      </div>
    </div>
  );
}

/* =========================================================================
   Main DocsPage Component
   ========================================================================= */

export function DocsPage({ onBack, isDark, onToggleTheme }: DocsPageProps) {
  const [activeSection, setActiveSection] = useState<DocSectionId>('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [demoItems, setDemoItems] = useState<TranslationItem[]>(INITIAL_DEMO_ITEMS);
  const [demoFilter, setDemoFilter] = useState<'all' | 'missing'>('all');
  const [demoStatusFilter, setDemoStatusFilter] = useState<'all' | 'needs-review' | 'draft' | 'approved'>('all');
  const [demoSearch, setDemoSearch] = useState('');
  const [activeHeading, setActiveHeading] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);

  const mainRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Escape to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  // Demo item mutators
  const handleUpdateDemoCell = (key: string, lang: string, val: string) => {
    setDemoItems(prev =>
      prev.map(item => {
        if (item.key === key) {
          return { ...item, [lang]: val };
        }
        return item;
      })
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

  // Section lookup
  const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
  const currentSection = SECTIONS[currentIndex] || SECTIONS[0];
  const prevSection = currentIndex > 0 ? SECTIONS[currentIndex - 1] : null;
  const nextSection = currentIndex < SECTIONS.length - 1 ? SECTIONS[currentIndex + 1] : null;

  // Filter sections by search query
  const q = searchQuery.toLowerCase().trim();
  const filteredCategories = DOC_CATEGORIES.map(cat => ({
    ...cat,
    sections: cat.sections.filter(s => {
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.toc.some(t => t.label.toLowerCase().includes(q))
      );
    }),
  })).filter(cat => cat.sections.length > 0);

  // Smooth scroll to heading
  const handleHeadingClick = (headingId: string) => {
    setActiveHeading(headingId);
    const el = document.getElementById(headingId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Reset scroll and feedback when active section changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    setActiveHeading(currentSection.toc[0]?.id || 'overview');
    setFeedbackGiven(null);
  }, [activeSection, currentSection]);

  return (
    <div className="h-screen w-full max-w-full flex flex-col overflow-hidden bg-background text-foreground">
      {/* Top Header */}
      <header className="border-b border-border bg-card px-3 sm:px-4 h-12 flex items-center justify-between shrink-0 select-none w-full max-w-full z-20">
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
            <span className="text-xs font-bold text-foreground hidden sm:inline">
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

          <Badge variant="outline" className="font-mono text-xs bg-muted/60 text-muted-foreground border-border hidden sm:inline-flex">
            {APP_VERSION}
          </Badge>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 px-2 sm:px-2.5 text-xs gap-1.5 cursor-pointer border-border hover:bg-accent/80 hover:border-amber-500/40 text-foreground transition-all shadow-2xs group hidden md:inline-flex shrink-0"
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Star JSON Link on GitHub"
              aria-label="Star JSON Link on GitHub"
            >
              <GithubIcon className="size-3.5 text-foreground shrink-0" />
              <span className="font-medium text-xs">Star on GitHub</span>
              <Star className="size-3 text-amber-500 fill-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="size-7 rounded cursor-pointer"
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="size-7 rounded cursor-pointer md:hidden"
            title="Toggle Docs Navigation"
          >
            {isMobileMenuOpen ? <X className="size-3.5" /> : <Menu className="size-3.5" />}
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Sidebar */}
        <aside
          className={`${
            isMobileMenuOpen
              ? 'absolute inset-0 z-30 bg-background/95 backdrop-blur-md p-4 flex flex-col'
              : 'hidden'
          } md:flex md:static md:w-64 lg:w-72 border-r border-border bg-card md:bg-muted/15 p-3 shrink-0 flex-col gap-4 overflow-y-auto`}
        >
          {isMobileMenuOpen && (
            <div className="flex items-center justify-between pb-3 border-b border-border md:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Navigation
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="size-7"
              >
                <X className="size-4" />
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {filteredCategories.map(cat => (
              <div key={cat.title} className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 px-2 py-1">
                  {cat.title}
                </div>
                <div className="space-y-0.5">
                  {cat.sections.map(sec => {
                    const isActive = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setActiveSection(sec.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs transition-all cursor-pointer select-none ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                        }`}
                      >
                        <span
                          className={`size-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? 'text-primary-foreground'
                              : 'text-muted-foreground group-hover:text-foreground'
                          }`}
                        >
                          {sec.icon}
                        </span>
                        <span className="truncate flex-1">{sec.title}</span>
                        {sec.badge && (
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono shrink-0 ${
                              isActive
                                ? 'bg-primary-foreground/20 text-primary-foreground font-semibold'
                                : 'bg-muted/80 text-muted-foreground'
                            }`}
                          >
                            {sec.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Content */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 min-w-0"
        >
          {/* Breadcrumb Navigation Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 text-xs text-muted-foreground select-none">
            <div className="flex items-center gap-1.5 font-medium truncate">
              <span className="hover:text-foreground">Docs</span>
              <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
              <span className="text-foreground font-semibold truncate">
                {q ? `Search: "${searchQuery}"` : currentSection.category}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono text-muted-foreground/80">{currentSection.category}</span>
            </div>
          </div>

          {/* Active Article Area */}
          <div className="flex items-start gap-8 max-w-6xl">
            <div className="flex-1 min-w-0 space-y-8">
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
              {activeSection === 'icu-builder' && <IcuBuilderSection />}
              {activeSection === 'ai-translation' && <AiTranslationSection />}
              {activeSection === 'linter-scorecard' && <LinterScorecardSection />}
              {activeSection === 'exporters' && <ExportersSection />}
              {activeSection === 'enterprise-formats' && <EnterpriseFormatsSection />}
              {activeSection === 'folder-sync' && <FolderSyncSection />}
              {activeSection === 'github-sync' && <GitHubSyncSection />}
              {activeSection === 'live-collab' && <LiveCollabSection />}
              {activeSection === 'mcp-server' && <McpServerSection />}
              {activeSection === 'keyboard-shortcuts' && <ShortcutsSection />}

              {/* Feedback Section */}
              <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Documentation feedback</span>
                {feedbackGiven ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="size-3.5" /> Thank you for your feedback!
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeedbackGiven('yes')}
                      className="h-7 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      <ThumbsUp className="size-3" /> Yes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeedbackGiven('no')}
                      className="h-7 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      <ThumbsDown className="size-3" /> No
                    </Button>
                  </div>
                )}
              </div>

              {/* Prev / Next Article Navigation Cards */}
              <DocPager
                prevSection={prevSection}
                nextSection={nextSection}
                onSelect={setActiveSection}
              />
            </div>

            {/* Right Sticky Table of Contents (TOC) */}
            <DocToc
              toc={currentSection.toc}
              activeHeading={activeHeading}
              onHeadingClick={handleHeadingClick}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================================
   Section 1: Quick Start & Formats
   ========================================================================= */

function GettingStartedSection() {
  return (
    <article className="space-y-6 max-w-4xl text-foreground">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Quick Start
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Open a spreadsheet, change a string, export the files your app already uses. Nothing leaves this browser.
        </p>
      </div>

      <section id="three-steps" className="space-y-3 pt-2">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Zap className="size-4 text-amber-500" /> Open, edit, export
        </h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h3 className="text-sm font-bold text-foreground">1. Open a spreadsheet</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              From the home page, choose Open spreadsheet, then Browse files, Start empty sheet, or Try sample. You can also drop <code className="font-mono text-primary text-xs">en.json</code> next to <code className="font-mono text-primary text-xs">my.json</code> — locale tags in the filename become columns.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h3 className="text-sm font-bold text-foreground">2. Edit a cell</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Click a cell, type the translation, press Enter. The formula bar above the grid shows the same string for long copy. Arrow keys move; the Key column stays frozen while you scroll languages.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h3 className="text-sm font-bold text-foreground">3. Export</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use Export in the toolbar to write JSON, Flutter ARB, Excel, CSV, YAML, Android XML, or iOS Strings. Or Save a <code className="font-mono text-primary text-xs">.jsonlink</code> snapshot to hand the whole sheet to a teammate.
            </p>
          </div>
        </div>
      </section>

      <section id="formats" className="space-y-3 pt-2">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileCode className="size-4 text-primary" /> Supported file formats
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <div className="hidden sm:grid sm:grid-cols-12 bg-muted/60 px-4 py-2.5 text-xs font-bold text-muted-foreground border-b border-border">
            <span className="sm:col-span-4">Format & Extension</span>
            <span className="sm:col-span-3">Target Platform</span>
            <span className="sm:col-span-5">Mechanism & Preservation</span>
          </div>
          <div className="divide-y divide-border/60 text-sm">
            {FORMAT_MATRIX.map(fmt => (
              <div key={fmt.name} className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:grid sm:grid-cols-12 gap-1 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors">
                <span className="sm:col-span-4 font-mono font-semibold text-foreground flex items-center gap-1.5">
                  <span>{fmt.name}</span>
                </span>
                <span className="sm:col-span-3 text-muted-foreground font-mono text-xs">{fmt.type}</span>
                <span className="sm:col-span-5 text-muted-foreground text-xs leading-relaxed">{fmt.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="overview" className="space-y-3 pt-2">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
          How files become a grid
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          JSON Link never uploads your catalog. Parsing, editing, and export all run in this tab. Nested JSON, XML, gettext PO, and Flutter ARB each become rows with a shared key path and one column per language.
        </p>
      </section>

      <section id="ast-schema" className="space-y-3 pt-2">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Layers className="size-4 text-primary" /> Developer: in-memory schema
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          For integrators wiring MCP, the Vite plugin, or custom exporters — each row is a <code className="font-mono text-primary text-xs">TranslationItem</code>. Translators can skip this section.
        </p>
        <DocCodeTabs
          tabs={[
            {
              label: 'TypeScript Definition',
              code: `interface TranslationItem {
  key: string;              // Normalized dot-notation path (e.g. 'auth.welcome')
  namespace: string;        // Inferred from prefix or file group (e.g. 'auth')
  status?: RowStatus;       // 'draft' | 'needs-review' | 'approved'
  [langCode: string]: any;  // Language columns aligned side-by-side (e.g. en, my, ja)
}`,
            },
          ]}
          title="Core Data Record"
        />
      </section>
    </article>
  );
}

/* =========================================================================
   Section 2: Spreadsheet & Formula Bar
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
    <article className="space-y-6 max-w-5xl text-foreground">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          The Spreadsheet Grid & Live Formula Bar
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Spreadsheet editing is backed by virtualized DOM rendering, sticky CSS freeze panes, and synchronized bidirectional Formula Bar state.
        </p>
      </div>

      <section id="formula-panes" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Table2 className="size-4 text-primary" /> Grid Architecture & Core Controls
        </h2>
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
            <h3 className="text-xs font-bold text-foreground">Formula Bar (fx)</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Displays active cell address (e.g. <code className="font-mono text-primary text-xs">C2 [my]</code>) and provides an unconstrained editing area for multiline strings and long copy blocks.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
            <h3 className="text-xs font-bold text-foreground">Freeze Panes</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Row indexes and translation key paths remain anchored to the left viewport boundary via CSS <code className="font-mono text-xs">sticky</code> positioning while scrolling across dozens of language columns.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
            <h3 className="text-xs font-bold text-foreground">Inline Keyboard Navigation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Standard spreadsheet bindings: Arrow keys navigate between cells, <kbd className="px-1 py-0.2 bg-muted rounded border text-xs">Enter</kbd> commits and advances downward, and <kbd className="px-1 py-0.2 bg-muted rounded border text-xs">Tab</kbd> shifts focus across columns.
            </p>
          </div>
        </div>
      </section>

      {/* Embedded Live Spreadsheet Component */}
      <section id="interactive-grid" className="space-y-3 pt-2">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          Interactive product sandbox
        </h2>
        <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm flex flex-col h-[380px] sm:h-[420px]">
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
      </section>
    </article>
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
    <article className="space-y-6 max-w-5xl text-foreground">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Cell Right-Click Context Menu & Font Tools
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Cell-level context actions execute operations without context-switching or modal dialog overlays.
        </p>
      </div>

      <section id="menu-actions" className="space-y-3">
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="hidden sm:grid sm:grid-cols-12 bg-muted/60 px-4 py-2.5 text-xs font-bold text-muted-foreground border-b border-border">
            <span className="sm:col-span-4">Context Command</span>
            <span className="sm:col-span-8">Mechanism & Outcome</span>
          </div>

          <div className="divide-y divide-border/60 text-xs">
            <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:grid sm:grid-cols-12 gap-1.5 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors">
              <span className="sm:col-span-4 font-semibold text-foreground flex items-center gap-2">
                <MousePointerClick className="size-3.5 text-muted-foreground" />
                <span>Edit Cell</span>
              </span>
              <span className="sm:col-span-8 text-muted-foreground text-xs sm:text-xs leading-relaxed">
                Activates inline cell focus and maps caret position directly to the upper Formula Bar.
              </span>
            </div>

            <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:grid sm:grid-cols-12 gap-1.5 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors">
              <span className="sm:col-span-4 font-semibold text-foreground flex items-center gap-2">
                <Copy className="size-3.5 text-muted-foreground" />
                <span>Copy & Paste</span>
              </span>
              <span className="sm:col-span-8 text-muted-foreground text-xs sm:text-xs leading-relaxed">
                Reads from and writes directly to system clipboard via the asynchronous Clipboard API.
              </span>
            </div>

            <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:grid sm:grid-cols-12 gap-1.5 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors">
              <span className="sm:col-span-4 font-semibold text-foreground flex items-center gap-2">
                <Undo2 className="size-3.5 text-muted-foreground" />
                <span>1-Click Revert</span>
              </span>
              <span className="sm:col-span-8 text-muted-foreground text-xs sm:text-xs leading-relaxed">
                Restores cell value back to initial file load baseline, bypassing active undo delta stack.
              </span>
            </div>

            <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:grid sm:grid-cols-12 gap-1.5 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors">
              <span className="sm:col-span-4 font-semibold text-foreground flex items-center gap-2">
                <Globe className="size-3.5 text-emerald-500" />
                <span>Zawgyi ⇄ Unicode</span>
              </span>
              <span className="sm:col-span-8 text-muted-foreground text-xs sm:text-xs leading-relaxed">
                Detects non-standard Zawgyi character codepoints and converts to Unicode NFC standard (U+1000–U+109F) via the Rabbit rule engine, shielding variable tokens from replacement.
              </span>
            </div>

            <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:grid sm:grid-cols-12 gap-1.5 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors">
              <span className="sm:col-span-4 font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="size-3.5 text-amber-500" />
                <span>AI Translate Row</span>
              </span>
              <span className="sm:col-span-8 text-muted-foreground text-xs sm:text-xs leading-relaxed">
                Executes prompt construction for the specific active row against configured OpenRouter model.
              </span>
            </div>

            <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:grid sm:grid-cols-12 gap-1.5 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors">
              <span className="sm:col-span-4 font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>Review Statuses</span>
              </span>
              <span className="sm:col-span-8 text-muted-foreground text-xs sm:text-xs leading-relaxed">
                Tags row with operational state metadata: Approved, Needs Review, or Draft.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="try-context-menu" className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-foreground">Interactive Context Menu Testbed</h3>
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
      </section>
    </article>
  );
}

/* =========================================================================
   Section 4: Visual ICU Message Builder
   ========================================================================= */

function IcuBuilderSection() {
  return (
    <article className="space-y-6 max-w-4xl text-foreground">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Visual ICU Message Builder & Syntax Tester
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          ICU MessageFormat is the industry standard for pluralization and gender-aware message synthesis. JSON Link parses ICU AST nodes to prevent syntax crashes at application runtime.
        </p>
      </div>

      <section id="plural-builder" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Sliders className="size-4 text-cyan-500" /> Plural Equation Builder
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Right-click any translation cell and choose <strong>Build ICU Message...</strong> to open the builder:
        </p>
        <DocCodeTabs
          tabs={[
            {
              label: 'Plural Equation Syntax',
              code: `{itemCount, plural,
  =0 {You have no items in your cart.}
  one {You have # item in your cart.}
  other {You have # items in your cart.}
}`,
            },
            {
              label: 'Select Gender Syntax',
              code: `{gender, select,
  male {He liked your post.}
  female {She liked your post.}
  other {They liked your post.}
}`,
            },
          ]}
          title="ICU Specification"
        />
      </section>

      <section id="syntax-evaluator" className="space-y-3 pt-2">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-500" /> Live Syntax Evaluator
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h3 className="font-bold text-foreground">Deterministic Evaluation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Provides live compiler output for mock variables (e.g. <code className="font-mono text-xs">itemCount = 0</code>) to verify plural branch evaluation before persisting to disk.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h3 className="font-bold text-foreground">Brace Balance Verification</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Validates that opening and closing curly braces match in count and depth to prevent fatal runtime syntax errors in FormatJS and Flutter Intl.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}

/* =========================================================================
   Section 5: AI Auto-Translate & Glossary
   ========================================================================= */

function AiTranslationSection() {
  return (
    <article className="space-y-6 max-w-4xl text-foreground">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          AI Auto-Translate, BYOK & Termbase Glossary
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Direct browser-to-OpenRouter API integration supporting Gemini 2.5 Flash, DeepSeek V3, Claude 3.5 Sonnet, and GPT-4o with zero cloud telemetry.
        </p>
      </div>

      <section id="byok-encryption" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <ShieldCheck className="size-4 text-emerald-500" />
            <span>BYOK Privacy & AES-GCM 256-bit Encryption</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            API keys stay in session memory by default. If you choose to remember a key on this device, it is AES-GCM encrypted with a device-local wrapping key stored in IndexedDB — not a user password, and not sent to JSON Link.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <FileCode className="size-4 text-primary" />
            <span>Token AST Shielding</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Interpolation variables (<code className="font-mono text-primary text-xs">{`{count}`}</code>, <code className="font-mono text-primary text-xs">%s</code>, <code className="font-mono text-primary text-xs">$1</code>) are parsed and shielded before sending, then strictly verified post-translation to prevent variable leakage.
          </p>
        </div>
      </section>

      <section id="termbase-glossary" className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <BookOpen className="size-4 text-primary" />
          <span>Termbase & Glossary Management</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Enforce brand rules and specialized nomenclature across translation jobs:
        </p>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li><strong>Keep Original (Forbidden Translation):</strong> Prevents models from translating registered brand names (e.g. "JSON Link" remains unaltered).</li>
          <li><strong>Custom Required Target:</strong> Enforces an exact term translation for specific locales.</li>
        </ul>
      </section>
    </article>
  );
}

/* =========================================================================
   Section 6: QA Consistency Linter & Scorecard
   ========================================================================= */

function LinterScorecardSection() {
  return (
    <article className="space-y-6 max-w-4xl text-foreground">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Localization QA Consistency Linter & Scorecard
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Deterministic static analysis scans detect whitespace errors, missing interpolation tokens, and length variance prior to shipping bundles.
        </p>
      </div>

      <section id="rules" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-500" /> Whitespace & Auto-Fix
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Identifies accidental leading or trailing whitespace. "Fix All Whitespace" sanitizes all language columns in a single atomic update.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="size-3.5 text-amber-500" /> Variable Mismatches
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Flags target translations that omit tokens present in the source key (e.g. source contains <code className="font-mono text-primary text-xs">{`{count}`}</code> but translation dropped it).
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
            <Layers className="size-3.5 text-primary" /> Text Expansion Variance
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Highlights translations exceeding 40% expansion over source length that risk viewport overflow in mobile components.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
            <Activity className="size-3.5 text-primary" /> Health Scorecard
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Calculates live completion percentage (0% to 100%) and missing key counts per column.
          </p>
        </div>
      </section>
    </article>
  );
}

/* =========================================================================
   Section 7: Universal Exporters & Flutter ARB
   ========================================================================= */

function ExportersSection() {
  return (
    <article className="space-y-6 max-w-4xl text-foreground">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Universal Exporters & Flutter ARB Integration
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Direct serializers output ready-to-commit files across React, Flutter, iOS, Android, and CLI environments.
        </p>
      </div>

      <section id="flutter-arb" className="p-4 rounded-xl border border-border bg-card space-y-3">
        <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
          <FileCode className="size-4 text-cyan-500" />
          <span>Flutter ARB (.arb) First-Class Roundtrip</span>
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Bi-directional serialization preserves Flutter localization standards:
        </p>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li><strong>Metadata Preservation:</strong> Imports and serializes <code className="font-mono text-cyan-600 dark:text-cyan-400 text-xs">@key</code> description and placeholder objects accurately.</li>
          <li><strong>Single-Column File Download:</strong> Right-click or choose column options to export <code className="font-mono text-xs">app_&lt;lang&gt;.arb</code> directly.</li>
          <li><strong>ZIP Bundle:</strong> Compiles all target languages into a structured <code className="font-mono text-xs">flutter-l10n/</code> directory.</li>
        </ul>
      </section>

      <section id="vite-starter" className="p-4 rounded-xl border border-border bg-card space-y-3">
        <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          <span>Vite Plugin &amp; 1-Command Setup: <code>npx create-jsonlink</code></span>
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Scaffold typed, zero-dependency localization into any React + Vite codebase:
        </p>
        <DocCodeTabs
          tabs={[
            {
              label: 'npx (Instant)',
              code: `# 1. Initialize inside Vite project root
npx create-jsonlink

# 2. Start dev server
npm run dev

# 3. Access in-app localization dashboard
http://localhost:5173/__jsonlink`,
            },
          ]}
          title="Terminal Setup"
        />
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li><strong>Zero Extra Ports:</strong> Executes directly inside Vite's dev server middleware.</li>
          <li><strong>Two-Way Disk Sync:</strong> Edits in <code className="font-mono text-xs">/__jsonlink</code> write to <code className="font-mono text-xs">src/locales/*.json</code>, triggering instant Vite HMR.</li>
          <li><strong>Zero Production Overhead:</strong> Gated with <code className="font-mono text-xs">apply: 'serve'</code>; omitted from production builds.</li>
        </ul>
      </section>

      <section id="multi-platform-zip" className="p-4 rounded-xl border border-border bg-card space-y-3">
        <h3 className="text-xs font-bold text-foreground">Multi-Platform Project Bundle (ZIP)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 rounded bg-muted/40 border border-border/60">web-locales/&#123;lang&#125;.json</div>
          <div className="p-2 rounded bg-muted/40 border border-border/60">flutter-l10n/app_&#123;lang&#125;.arb</div>
          <div className="p-2 rounded bg-muted/40 border border-border/60">ios-strings/&#123;lang&#125;.lproj/Localizable.strings</div>
          <div className="p-2 rounded bg-muted/40 border border-border/60">android-res/values-&#123;lang&#125;/strings.xml</div>
          <div className="p-2 rounded bg-muted/40 border border-border/60 col-span-1 sm:col-span-2">typescript/translations.d.ts</div>
        </div>
      </section>
    </article>
  );
}

/* =========================================================================
   Section 8: Enterprise Formats (XLIFF 1.2 & GNU gettext PO)
   ========================================================================= */

function EnterpriseFormatsSection() {
  return (
    <article className="space-y-6 max-w-4xl text-foreground">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Enterprise Standards: XLIFF 1.2 & GNU gettext PO
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Interoperability standards for enterprise translation agencies and Computer-Assisted Translation (CAT) suites.
        </p>
      </div>

      <section id="xliff-standard" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileCode className="size-4 text-indigo-500" /> XLIFF 1.2 (XML Localization Interchange File Format)
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The OASIS XLIFF 1.2 standard encapsulates source units, translated targets, translator notes, and approval states:
        </p>
        <DocCodeTabs
          tabs={[
            {
              label: 'XLIFF 1.2 XML',
              code: `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file original="app.json" source-language="en" target-language="my" datatype="plaintext">
    <body>
      <trans-unit id="app.title" approved="yes">
        <source>JSON Link Studio</source>
        <target state="translated">JSON လင့်ခ် စတူဒီယို</target>
        <note priority="1">Main application heading displayed in the top navbar.</note>
      </trans-unit>
    </body>
  </file>
</xliff>`,
            },
          ]}
          title="XLIFF 1.2 Specification"
        />
      </section>

      <section id="gettext-po" className="space-y-3 pt-2">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="size-4 text-violet-500" /> GNU gettext PO Format
        </h2>
        <DocCodeTabs
          tabs={[
            {
              label: 'gettext PO',
              code: `msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\\n"
"Language: my\\n"
"Plural-Forms: nplurals=1; plural=0;\\n"

#. Main application heading
#: src/App.tsx:142
msgid "JSON Link Studio"
msgstr "JSON လင့်ခ် စတူဒီယို"`,
            },
          ]}
          title="PO Format"
        />
      </section>

      <section id="cat-interop" className="space-y-3 pt-2">
        <DocCallout type="tip" title="CAT Tool Roundtrip">
          Exported XLIFF and PO files roundtrip cleanly into Trados Studio, memoQ, Crowdin, and Phrase. Re-imported files merge back into the AST by target unit key.
        </DocCallout>
      </section>
    </article>
  );
}

/* =========================================================================
   Section 9: Folder Sync & Draft Persistence
   ========================================================================= */

function FolderSyncSection() {
  return (
    <article className="space-y-6 max-w-4xl text-foreground">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Local Folder Sync & IndexedDB Draft Persistence
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Local-first state persistence through native Chromium File System Access API and an in-browser IndexedDB transaction store.
        </p>
      </div>

      <section id="fsa-api" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <FolderSync className="size-4 text-emerald-500" />
            <span>Native Directory Mounting</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Mount local directory handles via <strong>Local Folder Sync</strong> in File. Cell modifications persist straight to disk files (<code className="font-mono text-xs">locales/*.json</code>).
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Zap className="size-4 text-amber-500" />
            <span>IndexedDB Crash Recovery</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All spreadsheet changes stream to IndexedDB snapshots. Open <strong>Recent Projects</strong> to recover unsaved work after unexpected browser restarts.
          </p>
        </div>
      </section>
    </article>
  );
}

/* =========================================================================
   Section 10: GitHub Sync & PRs
   ========================================================================= */

function GitHubSyncSection() {
  return (
    <article className="space-y-6 max-w-4xl text-foreground">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          GitHub Localization Sync &amp; Automated Pull Requests
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Direct GitHub API synchronization: pull translation files, edit in tabular grid, and commit to feature branches with automated Pull Requests.
        </p>
      </div>

      <section id="safety-guardrail">
        <DocCallout type="security" title="Strict Locales-Only Safety Guardrail">
          While GitHub tokens grant repository-level access on the API level, JSON Link's synchronization engine enforces an in-app client-side security policy. Access to non-localization files—source code (<code className="font-mono text-xs">src/</code>), dependencies (<code className="font-mono text-xs">node_modules</code>), CI workflows (<code className="font-mono text-xs">.github/workflows</code>), configurations (<code className="font-mono text-xs">package.json</code>, <code className="font-mono text-xs">tsconfig.json</code>), and secrets (<code className="font-mono text-xs">.env*</code>)—is permanently blocked by the client-side app filter. Only authorized localization files (<code className="font-mono text-xs">.json</code>, <code className="font-mono text-xs">.arb</code>, <code className="font-mono text-xs">.yaml</code>, <code className="font-mono text-xs">.xml</code>, <code className="font-mono text-xs">.strings</code>, <code className="font-mono text-xs">.xlf</code>, <code className="font-mono text-xs">.po</code>) can be read or modified.
        </DocCallout>
      </section>

      <section id="workflow-steps" className="space-y-3 pt-2">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <GitPullRequest className="size-4 text-primary" /> Pull & PR Workflow
        </h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h3 className="text-xs font-bold text-foreground">1. Connect Token</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Accepts fine-grained Personal Access Tokens (Contents &amp; Pull requests read/write). Tokens reside only in browser <code className="font-mono text-xs">localStorage</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h3 className="text-xs font-bold text-foreground">2. Discover &amp; Pull</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Scans repository tree for locale directories (<code className="font-mono text-xs">locales/</code>, <code className="font-mono text-xs">i18n/</code>) and loads them into tabular view.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <h3 className="text-xs font-bold text-foreground">3. Commit &amp; PR</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Creates isolated feature branch (<code className="font-mono text-xs">jsonlink/translations-...</code>), commits Git blobs, and opens a merge-ready PR.
            </p>
          </div>
        </div>
      </section>

      <section id="pr-summaries" className="p-4 rounded-xl border border-border bg-card space-y-2">
        <h3 className="text-xs font-bold text-foreground">Automated PR Metadata</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Generated Pull Requests include Markdown tables of modified keys, affected locales, diff counts, and verification checksums.
        </p>
      </section>
    </article>
  );
}

/* =========================================================================
   Section 11: P2P Live Collaboration
   ========================================================================= */

function LiveCollabSection() {
  return (
    <article className="space-y-6 max-w-4xl text-foreground">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          P2P Live Collaboration
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Decentralized multi-peer synchronization over WebRTC DataChannels using Yjs Conflict-free Replicated Data Types (CRDTs) with optional end-to-end encryption.
        </p>
      </div>

      <section id="how-it-works" className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Radio className="size-3.5 text-violet-500" />
          Protocol Architecture
        </div>
        <div className="space-y-3">
          {[
            {
              step: '1',
              icon: <Wifi className="size-4 text-violet-500" />,
              title: 'Signaling Handshake',
              desc: 'Relay (wss://y-webrtc.fly.dev) handles initial SDP offer/answer exchange. Once established, media and data channel flow directly peer-to-peer.',
            },
            {
              step: '2',
              icon: <Users className="size-4 text-primary" />,
              title: 'WebRTC DataChannels',
              desc: 'Binary CRDT updates stream over reliable ordered DataChannels directly between browser peers with zero central server storage.',
            },
            {
              step: '3',
              icon: <Zap className="size-4 text-emerald-500" />,
              title: 'CRDT Convergence',
              desc: 'Yjs delta updates merge deterministically across clients. Cell edits achieve eventual consistency without merge conflicts.',
            },
          ].map(item => (
            <div key={item.step} className="p-4 rounded-xl border border-border bg-background space-y-1.5">
              <div className="flex items-center gap-2">
                {item.icon}
                <h3 className="text-xs font-bold text-foreground">{item.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="e2ee-encryption" className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Lock className="size-3.5 text-emerald-500" />
          End-to-End Cryptography (AES-GCM 256)
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          When a Room PIN is provided, Yjs binary updates are encrypted client-side using <code className="font-mono text-primary text-xs">AES-GCM 256-bit</code> with PBKDF2 derived keys prior to transmitting across WebRTC DataChannels.
        </p>
      </section>

      <section id="multiplayer-cursors" className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-2">
        <h3 className="text-xs font-bold text-foreground">Multiplayer Cursors & Follow Camera</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cursor coordinates broadcast over awareness channels throttled to ~33ms (~30fps). Follow mode locks viewport scroll position to a peer's active cell coordinates using linear interpolation with a 1.5px deadzone to eliminate micro-jitter.
        </p>
      </section>

      <section id="quick-start" className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-muted/60 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Quick Start
        </div>
        <div className="divide-y divide-border/60">
          {[
            { action: 'Open Live Collaboration', how: 'Click Live in top navigation bar' },
            { action: 'Create Room', how: 'Click "New Room" to generate random Room ID' },
            { action: 'Join Room', how: 'Enter Room ID and optional PIN, click Connect' },
            { action: 'Follow Peer Viewport', how: 'Click peer avatar in header to follow active cell' },
            { action: 'Disconnect', how: 'Click Disconnect or close browser tab' },
          ].map((row, i) => (
            <div key={i} className="px-4 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 hover:bg-muted/20 transition-colors">
              <span className="font-semibold text-foreground sm:w-56 shrink-0">{row.action}</span>
              <span className="text-muted-foreground">{row.how}</span>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

/* =========================================================================
   Section 12: MCP Server for AI IDEs
   ========================================================================= */

function McpServerSection() {
  return (
    <article className="space-y-6 max-w-4xl text-foreground">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          MCP Server for AI IDEs
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <code className="font-mono text-primary text-xs">@jsonlink/mcp</code> exposes JSON Link core tools to Claude Desktop, Cursor, and Windsurf via standard <code className="font-mono text-primary text-xs">stdio JSON-RPC 2.0</code> protocol.
        </p>
      </div>

      <section id="installation" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Terminal className="size-4 text-primary" /> CLI Execution
        </h2>
        <DocCodeTabs
          tabs={[
            { label: 'npx', code: 'npx -y @jsonlink/mcp' },
            { label: 'pnpm dlx', code: 'pnpm dlx @jsonlink/mcp' },
            { label: 'bunx', code: 'bunx @jsonlink/mcp' },
          ]}
          title="stdio Server"
        />
      </section>

      <section id="claude-config" className="space-y-3 pt-2">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileCode className="size-4 text-primary" /> Configuration
        </h2>
        <DocCodeTabs
          tabs={[
            {
              label: 'claude_desktop_config.json',
              code: `{
  "mcpServers": {
    "jsonlink": {
      "command": "npx",
      "args": ["-y", "@jsonlink/mcp"]
    }
  }
}`,
            },
          ]}
        />
      </section>

      <section id="available-tools" className="space-y-3 pt-2">
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="px-4 py-2.5 bg-muted/60 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Available MCP Tools
          </div>
          <div className="divide-y divide-border/60">
            {[
              { name: 'zawgyi_to_unicode', desc: 'Convert Zawgyi Myanmar text to Unicode NFC (U+1000–U+109F).' },
              { name: 'unicode_to_zawgyi', desc: 'Convert Unicode Myanmar text back to legacy Zawgyi encoding.' },
              { name: 'lint_translations', desc: 'Run deterministic QA linter on translation objects.' },
              { name: 'parse_json', desc: 'Parse flat or nested JSON files into normalized key-value AST.' },
              { name: 'parse_arb', desc: 'Parse Flutter ARB files, preserving @key metadata.' },
              { name: 'export_json', desc: 'Serialize key-value list back to formatted JSON string.' },
              { name: 'export_arb', desc: 'Serialize key-value list to Flutter ARB with @metadata.' },
            ].map(tool => (
              <div key={tool.name} className="px-4 py-2.5 text-xs flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 hover:bg-muted/20 transition-colors">
                <code className="font-mono text-primary text-xs font-semibold sm:w-48 shrink-0">{tool.name}</code>
                <span className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="compatible-ides" className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Globe className="size-3.5 text-primary" />
          Supported AI IDE Environments
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {['Claude Desktop', 'Cursor IDE', 'Windsurf', 'Any MCP Client'].map(ide => (
            <div key={ide} className="p-2.5 rounded-lg border border-border bg-background font-medium text-foreground">
              {ide}
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

/* =========================================================================
   Section 13: Keyboard Shortcuts & Power Tips
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
    <article className="space-y-6 max-w-4xl text-foreground">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Keyboard Shortcuts & Power User Tips
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Master spreadsheet navigation and command execution speed.
        </p>
      </div>

      <section id="shortcuts-table" className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="hidden sm:grid sm:grid-cols-12 bg-muted/60 px-4 py-2.5 text-xs font-bold text-muted-foreground border-b border-border">
          <span className="sm:col-span-3">Shortcut</span>
          <span className="sm:col-span-7">Action</span>
          <span className="sm:col-span-2 text-right">Category</span>
        </div>

        <div className="divide-y divide-border/60">
          {shortcuts.map(s => (
            <div
              key={s.key}
              className="p-3 sm:px-4 sm:py-2.5 text-xs flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-0 sm:items-center hover:bg-muted/20 transition-colors"
            >
              <div className="sm:col-span-3 flex items-center justify-between sm:justify-start">
                <kbd className="px-2 py-1 rounded bg-muted border border-border font-mono text-xs font-semibold text-foreground shadow-2xs">
                  {s.key}
                </kbd>
                <span className="sm:hidden text-xs uppercase font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                  {s.category}
                </span>
              </div>
              <span className="sm:col-span-7 text-foreground font-medium text-xs sm:text-xs">
                {s.action}
              </span>
              <span className="hidden sm:block sm:col-span-2 text-right text-xs text-muted-foreground">
                {s.category}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section id="power-tips" className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
          <h3 className="text-xs font-bold text-foreground">Multi-Cell Rapid Navigation</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Press <kbd className="px-1 py-0.5 rounded bg-muted border text-xs">Enter</kbd> to commit an edit and move down, or <kbd className="px-1 py-0.5 rounded bg-muted border text-xs">Tab</kbd> to move right. Pressing <kbd className="px-1 py-0.5 rounded bg-muted border text-xs">Escape</kbd> discards uncommitted cell changes immediately.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
          <h3 className="text-xs font-bold text-foreground">Command Palette (⌘K)</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Press <kbd className="px-1 py-0.5 rounded bg-muted border text-xs">⌘K</kbd> to execute tools (Linter, Scorecard, Find & Replace, Translation Memory, ICU Tester) directly.
          </p>
        </div>
      </section>
    </article>
  );
}
