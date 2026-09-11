import { useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Sun,
  Moon,
  FileQuestion,
  FileSpreadsheet,
  BookOpen,
  Info,
} from 'lucide-react';

interface NotFoundPageProps {
  onBack: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenDocs?: () => void;
  onOpenAbout?: () => void;
}

export function NotFoundPage({
  onBack,
  isDark,
  onToggleTheme,
  onOpenDocs,
  onOpenAbout,
}: NotFoundPageProps) {
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  // Keyboard shortcut: Esc to return to workspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground"
      data-testid="not-found-page"
    >
      {/* Top Bar — matches app and docs header (h-12, bg-card, border-b) */}
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
            <button
              onClick={onBack}
              className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity text-left outline-none shrink-0"
              title="JSON Link"
            >
              <Logo size="md" />
            </button>
            <span className="text-xs font-bold text-foreground hidden sm:inline">
              Page Not Found
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Badge
            variant="outline"
            className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs font-mono"
          >
            404
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full text-center space-y-6">
          {/* 404 Visual Icon & Pill */}
          <div className="flex flex-col items-center space-y-3">
            <div className="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-border shadow-sm flex items-center justify-center">
              <FileQuestion className="size-8 sm:size-10 text-rose-600 dark:text-rose-400 animate-pulse" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              <span>Error 404 • Resource Not Found</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Lost in Translation?
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              We couldn&apos;t find any page at{' '}
              <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted border border-border text-primary font-semibold break-all">
                {currentPath || '/404'}
              </code>
              . The link may be broken or mistyped, but your translation workspace is safe.
            </p>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            {/* Workspace Card */}
            <div
              onClick={onBack}
              className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/50 hover:bg-muted/20 transition-all cursor-pointer group shadow-xs space-y-2"
            >
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Translation Studio
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  Open your side-by-side localization spreadsheet grid.
                </p>
              </div>
            </div>

            {/* Docs Card */}
            <div
              onClick={onOpenDocs ? onOpenDocs : onBack}
              className="p-4 rounded-xl border border-border bg-card hover:border-blue-500/50 hover:bg-muted/20 transition-all cursor-pointer group shadow-xs space-y-2"
            >
              <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  User Guide & Docs
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  Browse quick start, format guides & keyboard shortcuts.
                </p>
              </div>
            </div>

            {/* About Card */}
            <div
              onClick={onOpenAbout ? onOpenAbout : onBack}
              className="p-4 rounded-xl border border-border bg-card hover:border-purple-500/50 hover:bg-muted/20 transition-all cursor-pointer group shadow-xs space-y-2"
            >
              <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Info className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  About JSON Link
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  Read about offline privacy, architecture & highlights.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action & Shortcuts */}
          <div className="pt-2 flex flex-col items-center gap-3">
            <Button
              onClick={onBack}
              className="gap-2 text-xs font-semibold cursor-pointer shadow-xs px-5 h-9"
            >
              <ArrowLeft className="size-3.5" />
              <span>Return to Translation Workspace</span>
            </Button>

            <span className="text-[11px] text-muted-foreground">
              Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">Esc</kbd> anytime to return
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
