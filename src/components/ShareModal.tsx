import React, { useState, useEffect } from 'react';
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
  Copy,
  Check,
  Download,
  AlertTriangle,
  ShieldCheck,
  Send,
  FileCode,
  Link2,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { TranslationItem } from '@/types';
import { buildShareUrl } from '@/lib/shareUrl';
import { exportProjectFile } from '@/lib/project';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: TranslationItem[];
  languages: string[];
  projectName: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  open,
  onOpenChange,
  items,
  languages,
  projectName,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [urlLength, setUrlLength] = useState<number>(0);
  const [isSafeLength, setIsSafeLength] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [nativeShared, setNativeShared] = useState<boolean>(false);

  // Password Protection State
  const [enablePassword, setEnablePassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    if (!open || items.length === 0) return;

    let isMounted = true;
    setIsGenerating(true);

    const effectivePassword = enablePassword && password.trim() ? password.trim() : undefined;

    buildShareUrl(projectName, items, languages, effectivePassword)
      .then(res => {
        if (isMounted) {
          setShareUrl(res.url);
          setUrlLength(res.length);
          setIsSafeLength(res.isSafeLength);
          setIsGenerating(false);
          // If project is too large, default to file handoff tab for better UX
          if (!res.isSafeLength) {
            setActiveTab('file');
          }
        }
      })
      .catch(err => {
        console.warn('Failed to build share URL:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, projectName, items, languages, enablePassword, password]);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadFile = () => {
    const filename = projectName.trim() || 'translations';
    exportProjectFile(filename, items, languages);
  };

  const handleNativeShare = async () => {
    if (typeof navigator === 'undefined' || !navigator.share) return;
    try {
      const filename = `${projectName.trim() || 'translations'}.jsonlink`;
      const jsonContent = JSON.stringify(
        {
          format: 'jsonlink',
          version: '1.0.0',
          name: projectName,
          updatedAt: new Date().toISOString(),
          languages,
          items,
        },
        null,
        2
      );
      const file = new File([jsonContent], filename, { type: 'application/json' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${projectName} — JSON Link Translation Workspace`,
          text: `Here is the translation project for "${projectName}" (${items.length} keys, ${languages.join(', ')}).`,
          files: [file],
        });
        setNativeShared(true);
        setTimeout(() => setNativeShared(false), 2000);
      } else if (isSafeLength && shareUrl) {
        await navigator.share({
          title: `${projectName} — JSON Link`,
          text: `Translate "${projectName}" in browser:`,
          url: shareUrl,
        });
        setNativeShared(true);
        setTimeout(() => setNativeShared(false), 2000);
      }
    } catch (e) {
      // User cancelled or share aborted
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base text-foreground">
            Share &amp; Handoff Workspace
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Share with teammates with zero server storage and 100% client-side privacy.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 text-xs">
          {/* Tabs switch */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'url'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Link2 className="size-3.5 shrink-0" />
              <span>Instant URL Link</span>
              {isSafeLength ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-normal shrink-0">
                  Ready
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-medium shrink-0">
                  Large
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'file'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileCode className="size-3.5 shrink-0" />
              <span>Team Handoff (.jsonlink)</span>
              {!isSafeLength && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-mono font-semibold shrink-0">
                  Recommended
                </span>
              )}
            </button>
          </div>

          {activeTab === 'url' ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  Anyone who opens this link will load your spreadsheet instantly in their browser.
                </p>

                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={isGenerating ? 'Generating compressed link...' : shareUrl}
                    className="font-mono text-[11px] h-9 bg-muted/30 select-all"
                  />
                  <Button
                    onClick={handleCopy}
                    disabled={isGenerating || !shareUrl}
                    size="sm"
                    className="gap-1.5 shrink-0 h-9 font-semibold text-xs cursor-pointer shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3.5 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>

                {/* Password Protection Section */}
                <div className="pt-2.5 mt-2.5 border-t border-border/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-foreground">
                      <input
                        type="checkbox"
                        checked={enablePassword}
                        onChange={e => {
                          setEnablePassword(e.target.checked);
                          if (!e.target.checked) setPassword('');
                        }}
                        className="rounded border-border text-primary focus:ring-primary size-3.5 cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5">
                        <Lock className="size-3 text-muted-foreground" />
                        Protect with Password (Optional)
                      </span>
                    </label>
                    {enablePassword && (
                      <span className="text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">
                        AES-256
                      </span>
                    )}
                  </div>

                  {enablePassword && (
                    <div className="space-y-2 pl-5.5">
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter link password..."
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="text-xs h-8 pr-8 bg-muted/20"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                          tabIndex={-1}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                        </button>
                      </div>

                      {/* No-Recovery Warning */}
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10.5px] text-amber-800 dark:text-amber-300 space-y-0.5">
                        <div className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="size-3 shrink-0" />
                          <span>No Password Recovery</span>
                        </div>
                        <p className="leading-relaxed text-muted-foreground dark:text-amber-300/80">
                          Encrypted 100% in-browser using AES-GCM 256. Passwords are never stored on any server. If forgotten, this link cannot be unlocked or recovered.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payload Length Health & Guard */}
              {isSafeLength ? (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    <strong>Safe URL Length:</strong> {Math.round(urlLength / 1024 * 10) / 10} KB ({items.length} keys). Compatible with Slack, WhatsApp, and Telegram.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Large Project ({Math.round(urlLength / 1024 * 10) / 10} KB / {items.length} keys)</span>
                  </div>
                  <p className="leading-relaxed">
                    This link exceeds the safe chat limit (2.5 KB) and may get truncated in chat apps. For large projects, please use the <strong className="underline cursor-pointer" onClick={() => setActiveTab('file')}>Team Handoff (.jsonlink)</strong> file instead.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Export a self-contained, lossless <code className="font-mono text-emerald-600 font-semibold">.jsonlink</code> project package. Zero size restrictions — handles 10,000+ translation keys smoothly.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={handleDownloadFile}
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9 font-semibold text-xs cursor-pointer shadow-xs border-primary/30 hover:bg-primary/5"
                >
                  <Download className="size-3.5 text-primary" />
                  Download .jsonlink
                </Button>

                {hasNativeShare && (
                  <Button
                    onClick={handleNativeShare}
                    size="sm"
                    className="gap-2 h-9 font-semibold text-xs cursor-pointer shadow-xs"
                  >
                    {nativeShared ? (
                      <>
                        <Check className="size-3.5 text-emerald-400" />
                        Shared!
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5" />
                        Native Share
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground">
                <strong className="text-foreground">How team handoff works:</strong> Send the file to any translator or developer. When they drop it into JSON Link, all {items.length} keys, namespaces, and language columns load instantly.
              </div>
            </div>
          )}

          {/* Privacy Callout */}
          <div className="pt-2 border-t border-border flex items-start gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5 shrink-0 text-primary mt-0.5" />
            <p className="leading-relaxed">
              <strong>100% In-Browser Privacy:</strong> URLs use hash fragments (<code className="font-mono text-[10px]">#share=...</code>) which are never transmitted to any web server. No databases, accounts, or telemetry.
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8 cursor-pointer"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
