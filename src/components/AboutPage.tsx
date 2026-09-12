import { useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Moon,
  Sun,
  Star,
  Globe,
  ShieldCheck,
  Sparkles,
  FileSpreadsheet,
  Languages,
  Activity,
  BookOpen,
  Terminal,
  Keyboard,
  Undo2,
  FlaskConical,
  Heart,
  Lock,
  FileCode,
  Table2,
  MousePointerClick,
} from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenDocs?: () => void;
}

const APP_VERSION = 'v1.0.0';
const GITHUB_URL = 'https://github.com/pyaephyomaungdev/json-link';
const LIVE_URL = 'https://json-link.pages.dev';

const highlights = [
  {
    icon: <Table2 className="size-4 text-emerald-500" />,
    title: 'Authentic Spreadsheet UX',
    description:
      'Freeze panes, live formula bar, Excel-style keyboard navigation, drag column resizing, multi-cell paste, and full undo / redo history.',
  },
  {
    icon: <MousePointerClick className="size-4 text-purple-500" />,
    title: 'Cell Context Menu & 1-Click Revert',
    description:
      'Right-click any translation cell to copy, paste, clear, revert changes to initial values, or convert Myanmar Zawgyi encoding on the fly.',
  },
  {
    icon: <FileSpreadsheet className="size-4 text-blue-500" />,
    title: '10+ Formats & Flutter ARB',
    description:
      'Roundtrip nested & flat JSON, Flutter ARB (with @key metadata and single-file download), Excel, CSV, YAML, Android strings.xml, iOS .strings, TypeScript d.ts, and portable .jsonlink projects.',
  },
  {
    icon: <Sparkles className="size-4 text-violet-500" />,
    title: 'AI Auto-Translate',
    description:
      'Batch translate missing keys via any OpenRouter model with variable protection, context injection, glossary rules, and review tagging.',
  },
  {
    icon: <Languages className="size-4 text-amber-500" />,
    title: 'Zawgyi ⇄ Unicode',
    description:
      'Real-time detection of legacy Myanmar Zawgyi encoding with one-click Rabbit-algorithm conversion in both directions.',
  },
  {
    icon: <Activity className="size-4 text-rose-500" />,
    title: 'QA Linter & Scorecard',
    description:
      'Automated scans for whitespace, variable mismatches, length expansion, and duplicates — with health scorecard and one-click auto-fixes.',
  },
  {
    icon: <ShieldCheck className="size-4 text-teal-500" />,
    title: '100% Client-Side & Zero-Cost Share',
    description:
      'No account, no server, no cloud storage. Share projects instantly via compressed URL hash (#share=...) or portable .jsonlink handoff files.',
  },
];

const developerFeatures = [
  {
    icon: <Terminal className="size-3.5 text-primary" />,
    title: 'MCP Server',
    description: 'Connect Zawgyi converter, linter, parsers, and exporters to Claude Desktop or Cursor.',
  },
  {
    icon: <Keyboard className="size-3.5 text-primary" />,
    title: 'Keyboard First',
    description: 'Cmd+K palette, Cmd+H find & replace, Cmd+Z / Y undo-redo, arrow-key cell navigation.',
  },
  {
    icon: <MousePointerClick className="size-3.5 text-primary" />,
    title: 'Right-Click Context Menu',
    description: 'Copy, Paste from clipboard, Clear, 1-Click Revert cell, Zawgyi converter, and row AI translation.',
  },
  {
    icon: <FileCode className="size-3.5 text-primary" />,
    title: 'Flutter ARB & Multi-Platform Bundles',
    description: 'Two-way Flutter .arb roundtrip with @key metadata, single-file downloads, and complete multi-platform ZIP bundle.',
  },
  {
    icon: <Undo2 className="size-3.5 text-primary" />,
    title: 'History & Diff Merge',
    description: '50 undo snapshots and a diff modal that inspects new, modified, and unchanged keys before applying.',
  },
  {
    icon: <FlaskConical className="size-3.5 text-primary" />,
    title: 'Pseudolocalization',
    description: 'qps-ploc test column with accent expansion and 35% length padding to stress-test layouts.',
  },
  {
    icon: <BookOpen className="size-3.5 text-primary" />,
    title: 'Glossary & Termbase',
    description: 'Brand names and technical terms with "keep original" or custom target rules enforced in AI prompts.',
  },
];

export function AboutPage({ onBack, isDark, onToggleTheme, onOpenDocs }: AboutPageProps) {
  // Esc key returns to the app
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

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground">
      {/* Top Bar — matches app header (h-12, bg-card, border-b) */}
      <header className="border-b border-border bg-card px-3 sm:px-4 h-12 flex items-center justify-between shrink-0 select-none">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-xs font-semibold cursor-pointer"
          title="Back to Workspace (Esc)"
        >
          <ArrowLeft className="size-3.5" />
          <span className="hidden sm:inline">Back to Workspace</span>
          <span className="sm:hidden">Back</span>
        </Button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Badge variant="success" className="font-mono">{APP_VERSION}</Badge>
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

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Hero — matches empty-state pattern (centered Logo + heading + muted text) */}
          <div className="flex flex-col items-center text-center">
            <Logo size="lg" />
            <span className="text-[11px] text-muted-foreground mt-2.5">
              — Private In-Browser Translation Workspace —
            </span>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground max-w-xl mt-3">
              The private localization workspace for developers &amp; translators
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mt-2">
              Seamlessly link, edit, validate, and translate your localization files side-by-side in an
              authentic spreadsheet interface. Zero-cost serverless sharing, auto-translate with AI, and export
              to 10+ frameworks — 100% in-browser without your data ever leaving your machine.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <Badge variant="success">Free & Open Source</Badge>
              <Badge variant="secondary">MIT License</Badge>
              <Badge variant="warning">300+ Automated Tests</Badge>
              <Badge variant="outline" className="gap-1">
                <Lock className="size-3 text-emerald-500" /> 100% Client-Side & Offline
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
              {onOpenDocs && (
                <Button
                  variant="secondary"
                  onClick={onOpenDocs}
                  className="gap-2 font-medium cursor-pointer"
                  size="sm"
                >
                  <BookOpen className="size-3.5 text-primary" />
                  User Guide & Docs
                </Button>
              )}
              <Button
                onClick={() => window.open(GITHUB_URL, '_blank', 'noopener')}
                className="gap-2 font-semibold cursor-pointer"
                size="sm"
              >
                <Star className="size-3.5" />
                Star on GitHub
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(LIVE_URL, '_blank', 'noopener')}
                className="gap-2 cursor-pointer"
                size="sm"
              >
                <Globe className="size-3.5" />
                json-link.pages.dev
              </Button>
            </div>
          </div>

          {/* Highlights — compact scorecard-style cards */}
          <section className="mt-10 sm:mt-12">
            <h2 className="text-sm font-bold tracking-tight text-foreground">Why JSON Link</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Everything a modern localization workflow needs — in one tab.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-4">
              {highlights.map(h => (
                <div
                  key={h.title}
                  className="rounded-xl border border-border bg-card p-3.5 shadow-xs hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {h.icon}
                    </span>
                    <h3 className="text-xs font-bold text-foreground">{h.title}</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-2.5">
                    {h.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Privacy Callout — subtle emerald tint, like app status badges */}
          <section className="mt-6">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-500/10 p-4 sm:p-5 flex items-start gap-3.5">
              <span className="size-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-4.5 text-emerald-500" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-foreground">
                  Privacy by architecture, not by promise
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5">
                  JSON Link is a static single-page app with zero backend. The name <strong>"Link"</strong> refers to seamlessly linking and synchronizing your local localization files across frameworks (Web JSON, Flutter ARB, iOS Strings, Android XML) directly from your browser without cloud storage. Files are parsed, edited, and exported entirely on your machine; drafts auto-save to browser storage. AI translation uses your own OpenRouter key (BYOK) — session-only by default, or AES-GCM 256-bit encrypted if you opt into remembering it on this device. Nothing is ever uploaded to a remote server.
                </p>
              </div>
            </div>
          </section>

          {/* Developer Workflows — compact cards like scorecard cells */}
          <section className="mt-8 sm:mt-10">
            <h2 className="text-sm font-bold tracking-tight text-foreground">Built for developer workflows</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              From side projects to production apps and agency pipelines.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
              {developerFeatures.map(f => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-card p-3.5 shadow-xs hover:bg-muted/30 transition-colors flex items-start gap-3"
                >
                  <span className="size-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    {f.icon}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">{f.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                      {f.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer — matches home footer */}
          <footer className="mt-10 pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>Developed with</span>
              <Heart className="size-3 text-rose-500 fill-rose-500 inline" />
              <span>by</span>
              <span className="font-semibold text-foreground">Pyae Phyo Maung</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors underline underline-offset-4"
              >
                GitHub
              </a>
              <span>·</span>
              <span>MIT License</span>
              <span>·</span>
              <span className="font-mono">{APP_VERSION}</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
