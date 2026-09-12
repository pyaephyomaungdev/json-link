import { Component, ErrorInfo, ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RotateCcw,
  Home,
  Copy,
  Check,
  FileDown,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  ShieldAlert,
} from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
  isDark: boolean;
  backupNotice: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    const initialDark =
      typeof window !== 'undefined'
        ? (localStorage.getItem('json_link_theme') ||
            localStorage.getItem('json-link-theme')) === 'dark' ||
          (!(
            localStorage.getItem('json_link_theme') ||
            localStorage.getItem('json-link-theme')
          ) &&
            window.matchMedia?.('(prefers-color-scheme: dark)').matches)
        : false;

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
      isDark: Boolean(initialDark),
      backupNotice: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log crash details to console for debugging
    console.error('[JSON Link ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleToggleTheme = () => {
    this.setState(
      prev => ({ isDark: !prev.isDark }),
      () => {
        if (this.state.isDark) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('json_link_theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('json_link_theme', 'light');
        }
      }
    );
  };

  handleCopyDetails = async () => {
    const { error, errorInfo } = this.state;
    const details = [
      '### JSON Link Crash Report',
      `- Timestamp: ${new Date().toISOString()}`,
      `- URL: ${typeof window !== 'undefined' ? window.location.href : 'unknown'}`,
      `- User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'}`,
      `- Error: ${error?.name || 'Error'}: ${error?.message || 'Unknown error'}`,
      '',
      '#### Stack Trace:',
      '```',
      error?.stack || 'No stack trace available',
      '```',
      '',
      '#### Component Stack:',
      '```',
      errorInfo?.componentStack || 'No component stack available',
      '```',
    ].join('\n');

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(details);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      }
    } catch {
      // Fallback if clipboard API is restricted
      console.warn('Clipboard write failed');
    }
  };

  handleDownloadEmergencyBackup = () => {
    try {
      const draft =
        localStorage.getItem('jsonlink_current_project') ||
        localStorage.getItem('json-link-draft');
      if (!draft) {
        this.setState({ backupNotice: 'No draft data found in browser storage.' });
        setTimeout(() => this.setState({ backupNotice: null }), 3500);
        return;
      }

      const blob = new Blob([draft], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jsonlink-emergency-backup-${new Date().toISOString().slice(0, 10)}.jsonlink`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export emergency backup:', e);
    }
  };

  render() {
    const { hasError, error, errorInfo, copied, showDetails, isDark } = this.state;

    if (!hasError) {
      return this.props.children;
    }

    if (this.props.fallback && error) {
      return this.props.fallback(error, this.handleReset);
    }

    const hasLocalStorageDraft =
      typeof window !== 'undefined' &&
      Boolean(
        localStorage.getItem('jsonlink_current_project') ||
          localStorage.getItem('json-link-draft')
      );

    return (
      <div
        className={`h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground ${
          isDark ? 'dark' : ''
        }`}
        data-testid="error-boundary-screen"
      >
        {/* Top Header matching App, Docs & 404 header tokens */}
        <header className="border-b border-border bg-card px-3 sm:px-4 h-12 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={this.handleReset}
              className="gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
              title="Return to Workspace"
            >
              <Home className="size-3.5" />
              <span className="hidden sm:inline">Back to Workspace</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="h-4 w-px bg-border/80 hidden sm:block shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity text-left outline-none shrink-0"
                title="JSON Link"
              >
                <Logo size="md" />
              </button>
              <span className="text-xs font-bold text-foreground hidden sm:inline">
                Workspace Recovery Mode
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Badge
              variant="destructive"
              className="text-xs font-mono"
            >
              System Crash Caught
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={this.handleToggleTheme}
              className="size-7 rounded cursor-pointer"
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </Button>
          </div>
        </header>

        {/* Center Main Content — matching NotFoundPage structure and tokens */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          <div className="max-w-2xl w-full text-center space-y-6">
            {/* Visual Icon & Pill */}
            <div className="flex flex-col items-center space-y-3">
              <div className="size-16 sm:size-20 rounded-2xl bg-destructive/10 border border-destructive/20 shadow-xs flex items-center justify-center">
                <ShieldAlert className="size-8 sm:size-10 text-destructive animate-pulse" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-destructive/20 bg-destructive/10 text-destructive text-xs font-semibold">
                <span>Application Crash Caught • Safe Recovery Mode</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Something Went Wrong
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                An unexpected runtime error occurred in the workspace. Your draft translations in browser storage remain safe and unaffected.
              </p>
            </div>

            {/* Error Message Box & Stack Trace */}
            <div className="max-w-lg mx-auto w-full space-y-2 text-left">
              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 font-mono text-xs text-destructive break-all shadow-2xs">
                <span className="font-semibold block mb-0.5">{error?.name || 'Error'}:</span>
                <span className="text-foreground/90 font-normal">{error?.message || 'An unknown error occurred'}</span>
              </div>

              {/* Collapsible Details */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showDetails ? (
                    <ChevronDown className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  )}
                  <span>{showDetails ? 'Hide technical details' : 'Show technical stack trace'}</span>
                </button>

                {showDetails && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-[11px] font-mono overflow-x-auto max-h-48 space-y-2 text-muted-foreground select-text">
                    {error?.stack && (
                      <pre className="whitespace-pre-wrap leading-relaxed">{error.stack}</pre>
                    )}
                    {errorInfo?.componentStack && (
                      <div className="pt-2 border-t border-border/60">
                        <span className="font-semibold text-foreground block mb-1">Component Stack:</span>
                        <pre className="whitespace-pre-wrap leading-relaxed">{errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3-Column Recovery Cards — identical grid pattern to NotFoundPage */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              {/* Card 1: Reload / Retry */}
              <div
                onClick={this.handleReset}
                className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/50 hover:bg-muted/20 transition-all cursor-pointer group shadow-xs space-y-2"
              >
                <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <RotateCcw className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Retry Workspace
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Reset application state and restore the translation grid.
                  </p>
                </div>
              </div>

              {/* Card 2: Return Home */}
              <div
                onClick={this.handleGoHome}
                className="p-4 rounded-xl border border-border bg-card hover:border-blue-500/50 hover:bg-muted/20 transition-all cursor-pointer group shadow-xs space-y-2"
              >
                <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Home className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Reload Application
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Navigate back to root URL and reload the workspace cleanly.
                  </p>
                </div>
              </div>

              {/* Card 3: Copy Diagnostics */}
              <div
                onClick={this.handleCopyDetails}
                className="p-4 rounded-xl border border-border bg-card hover:border-purple-500/50 hover:bg-muted/20 transition-all cursor-pointer group shadow-xs space-y-2"
              >
                <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {copied ? (
                    <Check className="size-4 text-emerald-500" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {copied ? 'Copied to Clipboard!' : 'Copy Diagnostics'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    {copied
                      ? 'Error details ready to paste in bug report or issue.'
                      : 'Copy error stack and environment info for debugging.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Action Buttons & Emergency Backup */}
            <div className="pt-2 flex flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  onClick={this.handleReset}
                  className="gap-2 text-xs font-semibold cursor-pointer shadow-xs px-5 h-9"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Try Again</span>
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="gap-2 text-xs font-semibold cursor-pointer px-4 h-9"
                >
                  <Home className="size-3.5" />
                  <span>Reload Page</span>
                </Button>

                {hasLocalStorageDraft && (
                  <Button
                    onClick={this.handleDownloadEmergencyBackup}
                    variant="outline"
                    className="gap-2 text-xs font-semibold text-primary hover:text-primary cursor-pointer px-4 h-9"
                    title="Export your current auto-saved draft as a .jsonlink file"
                  >
                    <FileDown className="size-3.5" />
                    <span>Emergency Backup (.jsonlink)</span>
                  </Button>
                )}
              </div>

              {this.state.backupNotice && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                  {this.state.backupNotice}
                </div>
              )}

              <span className="text-[11px] text-muted-foreground">
                JSON Link operates 100% client-side in your browser. No files or translation secrets were transmitted or compromised.
              </span>
            </div>
          </div>
        </main>
      </div>
    );
  }
}
