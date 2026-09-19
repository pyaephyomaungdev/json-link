import { useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GithubIcon } from '@/components/GithubIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Table2,
  MousePointerClick,
  Layers,
  GitPullRequest,
  Zap,
  Leaf,
} from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenDocs?: () => void;
  onOpenLegal?: (tab: 'privacy' | 'terms' | 'cookies') => void;
}

const APP_VERSION = 'v1.1.0';
const GITHUB_URL = 'https://github.com/pyaephyomaungdev/json-link';
const LIVE_URL = 'https://json-link.pages.dev';

const highlights = [
  {
    icon: <Table2 className="size-4 text-emerald-500" />,
    badgeText: 'Spreadsheet',
    title: 'Authentic Spreadsheet UX',
    description:
      'Freeze panes, live formula bar, Excel-style keyboard navigation, drag column resizing, multi-cell paste, and full undo / redo history.',
  },
  {
    icon: <MousePointerClick className="size-4 text-purple-500" />,
    badgeText: 'Productivity',
    title: 'Cell Context Menu & 1-Click Revert',
    description:
      'Right-click any translation cell to copy, paste, clear, revert changes to initial values, or convert Myanmar Zawgyi encoding on the fly.',
  },
  {
    icon: <FileSpreadsheet className="size-4 text-blue-500" />,
    badgeText: 'Formats',
    title: '11+ Formats & Vite Starter',
    description:
      'Two-way roundtrip for nested & flat JSON, Flutter ARB (with @key metadata and single-file download), Excel, CSV, YAML, Android strings.xml, iOS .strings, TypeScript d.ts, and portable .jsonlink projects. Plus one-click export for React + Vite i18n starters.',
  },
  {
    icon: <Sparkles className="size-4 text-violet-500" />,
    badgeText: 'AI Engine',
    title: 'AI Auto-Translate',
    description:
      'Batch translate missing keys via any OpenRouter model with variable protection, context injection, glossary rules, and review tagging.',
  },
  {
    icon: <Languages className="size-4 text-amber-500" />,
    badgeText: 'Encoding',
    title: 'Zawgyi ⇄ Unicode',
    description:
      'Real-time detection of legacy Myanmar Zawgyi encoding with one-click Rabbit-algorithm conversion in both directions.',
  },
  {
    icon: <Activity className="size-4 text-rose-500" />,
    badgeText: 'Quality',
    title: 'QA Linter & Scorecard',
    description:
      'Automated scans for whitespace, variable mismatches, length expansion, and duplicates — with health scorecard and one-click auto-fixes.',
  },
  {
    icon: <ShieldCheck className="size-4 text-teal-500" />,
    badgeText: 'Security',
    title: '100% Client-Side & Zero-Cost Share',
    description:
      'No account, no server, no cloud storage. Share projects instantly via compressed URL hash (#share=...) or portable .jsonlink handoff files.',
  },
  {
    icon: <GitPullRequest className="size-4 text-emerald-500" />,
    badgeText: 'GitHub Sync',
    title: 'GitHub Sync & Automated PRs',
    description:
      'Connect any repo with a Personal Access Token to pull translation files, edit in spreadsheet, and open automated Pull Requests. Protected by a strict locales-only safety lock.',
  },
  {
    icon: <Zap className="size-4 text-amber-500" />,
    badgeText: 'React Starter',
    title: 'React + Vite Starter & Drop-In i18n',
    description:
      'One-click export to a production-ready Vite starter kit or drop /src/locales into your existing stack with typed translations.d.ts, a lightweight reactive client loader (i18n.ts, ~120 lines), and native HMR.',
  },
  {
    icon: <Leaf className="size-4 text-emerald-500" />,
    badgeText: 'Green Hosted',
    title: '100% Renewable Infrastructure',
    description:
      'Zero backend compute footprint. Hosted globally on Cloudflare Pages running on 100% renewable energy, certified green by The Green Web Foundation.',
  },
];

const developerFeatures = [
  {
    icon: <Terminal className="size-4 text-primary" />,
    title: 'MCP Server for AI IDEs',
    description: 'Run `npx -y @jsonlink/mcp` to expose Zawgyi converter, linter, parsers, and exporters to Claude Desktop or Cursor via stdio JSON-RPC 2.0.',
  },
  {
    icon: <Zap className="size-4 text-primary" />,
    title: 'Vite Client Loader & Devtools Drawer',
    description: 'Zero-dependency client loader (~120 lines) with reactive useTranslation(), embedded in-app Devtools drawer for live copy tweaking, and instant Vite HMR. Bundled with the official jsonlink-vite-i18n agent skill in the ZIP.',
  },
  {
    icon: <Keyboard className="size-4 text-primary" />,
    title: 'Keyboard First Navigation',
    description: 'Cmd+K command palette, Cmd+H find & replace with regex, Cmd+Z/Y undo-redo, and native arrow-key cell navigation.',
  },
  {
    icon: <Layers className="size-4 text-primary" />,
    title: 'Flutter ARB & Multi-Platform Bundles',
    description: 'Full two-way Flutter .arb roundtrip with @key metadata, single-file downloads, and complete multi-platform ZIP bundles.',
  },
  {
    icon: <Undo2 className="size-4 text-primary" />,
    title: 'History & Diff Merge Inspection',
    description: '50 granular undo snapshots and a diff modal that inspects new, modified, and unchanged keys before applying imports.',
  },
  {
    icon: <FlaskConical className="size-4 text-primary" />,
    title: 'Pseudolocalization Testing',
    description: 'Built-in qps-ploc test generator with accented character expansion and 35% length padding to stress-test responsive layouts.',
  },
  {
    icon: <BookOpen className="size-4 text-primary" />,
    title: 'Glossary & Termbase Safeguards',
    description: 'Brand names and technical terms with "keep original" or custom target rules strictly enforced during batch AI translation.',
  },
  {
    icon: <GitPullRequest className="size-4 text-primary" />,
    title: 'Direct GitHub PRs & Locales Guard',
    description: 'Pull locale files from feature branches and push updates as automated Pull Requests without leaving the web browser, protected by atomic path validators.',
  },
];

export function AboutPage({ onBack, isDark, onToggleTheme, onOpenDocs, onOpenLegal }: AboutPageProps) {
  // Esc key returns to the workspace
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
    <div className="h-screen w-full max-w-full flex flex-col overflow-hidden bg-background text-foreground selection:bg-primary/20">
      {/* Top Header — matches app header */}
      <header className="border-b border-border/70 bg-card/80 backdrop-blur-md px-3 sm:px-6 h-12 flex items-center justify-between shrink-0 select-none z-10 w-full max-w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted"
          title="Back to Workspace (Esc)"
        >
          <ArrowLeft className="size-3.5" />
          <span className="hidden sm:inline">Back to Workspace</span>
          <span className="sm:hidden">Back</span>
        </Button>

        <div className="flex items-center gap-2">
          <Badge variant="success" className="font-mono text-[10px] py-0 h-5">
            {APP_VERSION}
          </Badge>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 px-2 sm:px-2.5 text-xs gap-1.5 cursor-pointer border-border hover:bg-accent/80 hover:border-amber-500/40 text-foreground transition-all shadow-2xs group hidden sm:inline-flex shrink-0"
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
            className="size-8 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
            title={isDark ? 'Light Mode' : 'Dark Mode'}
            aria-label={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth w-full max-w-full">
        {/* Subtle Ambient Aura */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-[650px] h-[300px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-12 relative z-0">
          {/* Hero Section */}
          <section className="flex flex-col items-center text-center">
            <div className="mb-3">
              <Logo size="lg" />
            </div>

            <Badge
              variant="outline"
              className="text-[11px] font-mono py-0.5 px-3 border-primary/30 text-primary bg-primary/5 mb-3"
            >
              Private In-Browser Translation Workspace
            </Badge>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight max-w-2xl text-balance bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
              The Private Localization Workspace for Developers &amp; Translators
            </h1>

            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl text-pretty leading-relaxed">
              Seamlessly link, edit, validate, and translate your localization files side-by-side in an authentic spreadsheet interface.
              Zero cloud lock-in, zero remote databases, and 100% offline privacy.
            </p>

            {/* Badges Strip */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              <Badge variant="success">Free & Open Source</Badge>
              <Badge variant="secondary">MIT License</Badge>
              <Badge variant="warning">370+ Automated Tests</Badge>
              <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <Lock className="size-3 text-emerald-500" /> 100% Client-Side &amp; Offline
              </Badge>
            </div>

            {/* Product Hunt Featured Badge */}
            <div className="mt-5 flex items-center justify-center">
              <a
                href="https://www.producthunt.com/products/json-link-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-json-link-2"
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

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              {onOpenDocs && (
                <Button
                  variant="secondary"
                  onClick={onOpenDocs}
                  className="gap-2 font-semibold text-xs cursor-pointer shadow-xs"
                  size="sm"
                >
                  <BookOpen className="size-3.5 text-primary" />
                  User Guide &amp; Docs
                </Button>
              )}
              <Button
                onClick={() => window.open(GITHUB_URL, '_blank', 'noopener')}
                className="gap-2 font-semibold text-xs cursor-pointer shadow-xs"
                size="sm"
              >
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                Star on GitHub
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(LIVE_URL, '_blank', 'noopener')}
                className="gap-2 text-xs cursor-pointer bg-background hover:bg-muted"
                size="sm"
              >
                <Globe className="size-3.5" />
                json-link.pages.dev
              </Button>
            </div>
          </section>

          {/* Mission & Philosophy Card */}
          <section>
            <Card className="border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm overflow-hidden">
              <CardContent className="p-5 sm:p-6 flex items-start gap-4">
                <span className="size-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <ShieldCheck className="size-5" />
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Privacy by architecture, not by promise
                  </h3>
                  <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                    JSON Link is a static single-page application with zero backend. The name <strong className="text-foreground">&quot;Link&quot;</strong> refers to seamlessly linking and synchronizing your local localization files across frameworks (Web JSON, Flutter ARB, iOS Strings, Android XML) directly from your browser without cloud storage.
                  </p>
                  <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                    Files are parsed, validated, edited, and exported entirely on your machine; drafts auto-save to browser storage. AI translation uses your own OpenRouter key (BYOK) — session-only by default, or AES-GCM 256-bit encrypted if you opt into remembering it on this device. Nothing is ever uploaded to a remote server.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Highlights Grid */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Why JSON Link
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Everything a modern localization workflow needs — in one unified spreadsheet tab.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {highlights.map(h => (
                <Card
                  key={h.title}
                  className="border-border/80 bg-card/60 shadow-2xs hover:border-primary/40 hover:bg-card transition-all flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        {h.icon}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
                        {h.badgeText}
                      </Badge>
                    </div>
                    <CardTitle className="text-xs sm:text-sm font-bold leading-snug">
                      {h.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                      {h.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Developer Workflows */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Built for Developer Workflows
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Designed for engineers, indie hackers, and agency pipelines needing exact structural preservation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {developerFeatures.map(f => (
                <Card
                  key={f.title}
                  className="border-border/80 bg-card/60 shadow-2xs hover:border-primary/40 hover:bg-card transition-all"
                >
                  <CardContent className="p-4 flex items-start gap-3.5">
                    <span className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary mt-0.5">
                      {f.icon}
                    </span>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-xs sm:text-sm font-bold text-foreground">
                        {f.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                        {f.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Green Hosting & Infrastructure Certification Card */}
          <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 p-5 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6 shadow-xs overflow-hidden">
            <div className="flex flex-col gap-2.5 text-left">
              <div className="flex items-start sm:items-center gap-3">
                <span className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
                  <Leaf className="size-4" />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-foreground">Green Hosted &amp; Carbon Efficient</span>
                  <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                    Certified
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                JSON Link operates with zero backend compute emissions. Hosted globally on Cloudflare Pages edge network powered by 100% renewable electricity, verified and certified by The Green Web Foundation.
              </p>
            </div>

            <div className="shrink-0 flex items-center justify-center w-full md:w-auto pt-1 md:pt-0">
              <a
                href="https://www.thegreenwebfoundation.org/green-web-check/?url=https%3A%2F%2Fjson-link.pages.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-95 transition-transform hover:scale-[1.02] inline-block shadow-2xs rounded-lg overflow-hidden border border-emerald-500/30 bg-white"
                title="View verification on The Green Web Foundation"
              >
                <img
                  src="https://app.greenweb.org/api/v3/greencheckimage/json-link.pages.dev?nocache=true"
                  alt="This website runs on green hosting - verified by thegreenwebfoundation.org"
                  width={200}
                  height={95}
                  className="block h-[70px] sm:h-[82px] w-auto"
                  loading="lazy"
                />
              </a>
            </div>
          </section>

          {/* Author & Creator Section */}
          <section className="rounded-2xl border border-border/80 bg-card/60 p-5 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6 shadow-xs">
            <div className="flex flex-col gap-2 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <a href="https://pyaephyomaung.dev" target="_blank" rel="noopener noreferrer" className="font-bold text-sm text-foreground hover:text-primary transition-colors">Crafted by Pyae Phyo Maung</a>
                <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-primary/30 text-primary shrink-0">
                  Creator
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                Passionate about local-first software, developer tools, and privacy-preserving web engineering.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://www.buymeacoffee.com/pyaephyomaa', '_blank', 'noopener')}
                className="gap-2 text-xs font-semibold cursor-pointer bg-background hover:bg-muted shadow-2xs flex-1 sm:flex-none justify-center"
              >
                <img
                  src="/buy-me-a-coffee-icon.svg"
                  alt="Buy me a coffee"
                  className="h-5 w-auto shrink-0"
                />
                Buy me a coffee
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(GITHUB_URL, '_blank', 'noopener')}
                className="gap-2 text-xs font-semibold cursor-pointer bg-background hover:bg-muted shadow-2xs flex-1 sm:flex-none justify-center"
              >
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                GitHub Repo
              </Button>
              <Button
                size="sm"
                onClick={onBack}
                className="gap-1.5 text-xs font-semibold cursor-pointer shadow-xs w-full sm:w-auto justify-center"
              >
                Open Workspace
              </Button>
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span>Developed with</span>
                <Heart className="size-3 text-rose-500 fill-rose-500 inline" />
                <span>by</span>
                <a href="https://pyaephyomaung.dev" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors">Pyae Phyo Maung</a>
              </div>
              <span className="hidden sm:inline">·</span>
              <a
                href="https://www.thegreenwebfoundation.org/green-web-check/?url=https%3A%2F%2Fjson-link.pages.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-emerald-500 transition-colors"
                title="Certified Green Hosting by The Green Web Foundation"
              >
                <Leaf className="size-3 text-emerald-500 shrink-0" />
                <span>Green hosted on Cloudflare Pages</span>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
              <span>·</span>
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
              <span>·</span>
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
              <span>·</span>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors underline underline-offset-4"
              >
                GitHub
              </a>
              <span>·</span>
              <span className="font-mono">{APP_VERSION}</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
