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
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    const initialDark =
      typeof window !== 'undefined'
        ? localStorage.getItem('json-link-theme') === 'dark' ||
          (!localStorage.getItem('json-link-theme') &&
            window.matchMedia?.('(prefers-color-scheme: dark)').matches)
        : false;

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
      isDark: Boolean(initialDark),
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
          localStorage.setItem('json-link-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('json-link-theme', 'light');
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
      const draft = localStorage.getItem('json-link-draft');
      if (!draft) {
        alert('No draft data found in browser storage.');
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
      typeof window !== 'undefined' && Boolean(localStorage.getItem('json-link-draft'));

    return (
      <div
        className={`h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground ${
          isDark ? 'dark' : ''
        }`}
        data-testid="error-boundary-screen"
      >
        {/* Top Header matching App & Docs header tokens */}
        <header className="border-b border-border bg-card px-3 sm:px-4 h-12 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={this.handleGoHome}
              className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity text-left outline-none shrink-0"
              title="Return to Workspace"
            >
              <Logo size="md" />
            </button>
            <div className="h-4 w-px bg-border/80 hidden sm:block shrink-0" />
            <span className="text-xs font-bold text-foreground hidden sm:inline">
              Workspace Recovery Mode
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs font-mono">
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

        {/* Center Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          <div className="max-w-xl w-full space-y-5">
            {/* Crash Callout Card */}
            <div className="rounded-xl border border-rose-500/20 bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="size-5" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                      Something went wrong
                    </h1>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Error
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    An unexpected runtime error occurred in the workspace. Your draft translations in browser storage are safe and unaffected.
                  </p>
                </div>
              </div>

              {/* Error Message Box */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1 font-mono text-xs">
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block truncate">
                  {error?.name || 'Error'}: {error?.message || 'An unknown error occurred'}
                </span>
              </div>

              {/* Collapsible Details */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <Button
                  onClick={this.handleReset}
                  size="sm"
                  className="gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Try Again</span>
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <Home className="size-3.5" />
                  <span>Return to Workspace</span>
                </Button>

                <Button
                  onClick={this.handleCopyDetails}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy Error Details</span>
                    </>
                  )}
                </Button>

                {hasLocalStorageDraft && (
                  <Button
                    onClick={this.handleDownloadEmergencyBackup}
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-primary hover:text-primary cursor-pointer ml-auto"
                    title="Export your current auto-saved draft as a .jsonlink file"
                  >
                    <FileDown className="size-3.5" />
                    <span>Emergency Backup (.jsonlink)</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Safety Note */}
            <p className="text-center text-[11px] text-muted-foreground">
              JSON Link operates 100% client-side in your browser. No files or translation secrets were transmitted or compromised.
            </p>
          </div>
        </main>
      </div>
    );
  }
}
