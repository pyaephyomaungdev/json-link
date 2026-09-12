import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Copy,
  Check,
  Download,
  AlertTriangle,
  AlertCircle,
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
import { exportProjectFile, buildProjectFileContent } from '@/lib/project';
import { evaluatePasswordStrength } from '@/lib/passwordStrength';

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
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('file');
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
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const isPasswordValid = !enablePassword || (Boolean(password.trim()) && password === confirmPassword);
  const isPasswordMismatch = enablePassword && Boolean(confirmPassword) && password !== confirmPassword;
  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password]);

  // Prevent auto-switching tabs once user has interacted or initial evaluation occurred
  const hasAutoSwitchedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      hasAutoSwitchedRef.current = false;
      setActiveTab('file');
      setEnablePassword(false);
      setPassword('');
      setConfirmPassword('');
    }
  }, [open]);

  useEffect(() => {
    if (!open || items.length === 0) return;

    let isMounted = true;

    if (enablePassword && (!password.trim() || password !== confirmPassword)) {
      setShareUrl('');
      setUrlLength(0);
      setIsSafeLength(true);
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);

    const effectivePassword = enablePassword && password.trim() ? password.trim() : undefined;

    buildShareUrl(projectName, items, languages, effectivePassword)
      .then(res => {
        if (isMounted) {
          setShareUrl(res.url);
          setUrlLength(res.length);
          setIsSafeLength(res.isSafeLength);
          setIsGenerating(false);
        }
      })
      .catch(err => {
        console.warn('Failed to build share URL:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, projectName, items, languages, enablePassword, password, confirmPassword]);

  const switchTab = (tab: 'url' | 'file') => {
    hasAutoSwitchedRef.current = true;
    setActiveTab(tab);
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadFile = async () => {
    if (enablePassword && !password.trim()) return;
    const filename = projectName.trim() || 'translations';
    const effectivePw = enablePassword && password.trim() ? password.trim() : undefined;
    await exportProjectFile(filename, items, languages, effectivePw);
  };

  const handleNativeShare = async () => {
    if (typeof navigator === 'undefined' || !navigator.share) return;
    if (enablePassword && !password.trim()) return;
    try {
      const filename = `${projectName.trim() || 'translations'}.jsonlink`;
      const effectivePw = enablePassword && password.trim() ? password.trim() : undefined;
      const jsonContent = await buildProjectFileContent(projectName, items, languages, effectivePw);
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
          {/* Tabs switch: Team Handoff as Primary/Default */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => switchTab('file')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'file'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <FileCode className="size-3.5 shrink-0" />
              <span>Team Handoff (.jsonlink)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-mono font-semibold shrink-0">
                Recommended
              </span>
            </button>
            <button
              type="button"
              onClick={() => switchTab('url')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'url'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <Link2 className="size-3.5 shrink-0" />
              <span>Instant URL Link</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono shrink-0 ${isSafeLength
                ? 'bg-muted text-muted-foreground font-normal'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium'
                }`}>
                {isSafeLength ? 'Small projects' : 'Large'}
              </span>
            </button>
          </div>

          {activeTab === 'file' ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Export a self-contained, lossless <code className="font-mono text-emerald-600 font-semibold">.jsonlink</code> project package. Zero size restrictions — handles 10,000+ translation keys smoothly.
              </p>

              {/* Password Protection for File Handoff */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-foreground">
                    <Checkbox
                      checked={enablePassword}
                      onCheckedChange={(checked) => {
                        hasAutoSwitchedRef.current = true;
                        const isChecked = Boolean(checked);
                        setEnablePassword(isChecked);
                        if (!isChecked) {
                          setPassword('');
                          setConfirmPassword('');
                        }
                      }}
                      className="size-3.5"
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
                  <div className="space-y-2 pl-5.5 mt-2">
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter file encryption password..."
                        value={password}
                        onChange={e => {
                          hasAutoSwitchedRef.current = true;
                          setPassword(e.target.value);
                        }}
                        className={`text-xs h-8 pr-8 bg-muted/20 ${!password.trim() ? 'border-amber-500/50' : ''}`}
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

                    {/* Password Strength Meter */}
                    {password.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">Strength:</span>
                          <span className={`font-semibold ${passwordStrength.colorClass}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength.barColorClass}`}
                            style={{ width: `${passwordStrength.percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Confirm Password Input */}
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm encryption password..."
                        value={confirmPassword}
                        onChange={e => {
                          hasAutoSwitchedRef.current = true;
                          setConfirmPassword(e.target.value);
                        }}
                        className={`text-xs h-8 pr-8 bg-muted/20 ${isPasswordMismatch ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(p => !p)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                      </button>
                    </div>

                    {!password.trim() && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Password is required to encrypt this handoff file.
                      </p>
                    )}

                    {isPasswordMismatch && (
                      <p className="text-[11px] text-destructive font-medium flex items-center gap-1">
                        <AlertCircle className="size-3 shrink-0" />
                        Passwords do not match.
                      </p>
                    )}

                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10.5px] text-amber-800 dark:text-amber-300 space-y-0.5">
                      <div className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="size-3 shrink-0" />
                        <span>No Password Recovery</span>
                      </div>
                      <p className="leading-relaxed text-muted-foreground dark:text-amber-300/80">
                        Encrypted 100% in-browser using AES-GCM 256. Passwords are never stored on any server. If forgotten, this file cannot be opened or recovered.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={handleDownloadFile}
                  disabled={!isPasswordValid}
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9 font-semibold text-xs cursor-pointer shadow-xs border-primary/30 hover:bg-primary/5"
                >
                  <Download className="size-3.5 text-primary" />
                  {enablePassword && password.trim() ? 'Download Encrypted' : 'Download .jsonlink'}
                </Button>

                {hasNativeShare && (
                  <Button
                    onClick={handleNativeShare}
                    disabled={!isPasswordValid}
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
                        {enablePassword && password.trim() ? 'Share Encrypted' : 'Native Share'}
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground">
                <strong className="text-foreground">How team handoff works:</strong> Send the file to any translator or developer. When they drop it into JSON Link{enablePassword && password.trim() ? ' and enter the password' : ''}, all {items.length} keys, namespaces, and language columns load instantly.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  Anyone who opens this link will load your spreadsheet instantly in their browser.
                </p>

                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={
                      !isPasswordValid
                        ? 'Enter and confirm password below to generate encrypted link...'
                        : isGenerating
                          ? 'Generating compressed link...'
                          : shareUrl
                    }
                    className="font-mono text-[11px] h-9 bg-muted/30 select-all"
                  />
                  <Button
                    onClick={handleCopy}
                    disabled={isGenerating || !shareUrl || !isPasswordValid}
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

                {/* Password Protection Section for Instant URL */}
                <div className="pt-2.5 mt-2.5 border-t border-border/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-foreground">
                      <Checkbox
                        checked={enablePassword}
                        onCheckedChange={(checked) => {
                          hasAutoSwitchedRef.current = true;
                          const isChecked = Boolean(checked);
                          setEnablePassword(isChecked);
                          if (!isChecked) {
                            setPassword('');
                            setConfirmPassword('');
                          }
                        }}
                        className="size-3.5"
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
                    <div className="space-y-2 pl-5.5 mt-2">
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter link password..."
                          value={password}
                          onChange={e => {
                            hasAutoSwitchedRef.current = true;
                            setPassword(e.target.value);
                          }}
                          className={`text-xs h-8 pr-8 bg-muted/20 ${!password.trim() ? 'border-amber-500/50' : ''}`}
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

                      {/* Password Strength Meter */}
                      {password.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">Strength:</span>
                            <span className={`font-semibold ${passwordStrength.colorClass}`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${passwordStrength.barColorClass}`}
                              style={{ width: `${passwordStrength.percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Confirm Password Input */}
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm link password..."
                          value={confirmPassword}
                          onChange={e => {
                            hasAutoSwitchedRef.current = true;
                            setConfirmPassword(e.target.value);
                          }}
                          className={`text-xs h-8 pr-8 bg-muted/20 ${isPasswordMismatch ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(p => !p)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                          tabIndex={-1}
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                        </button>
                      </div>

                      {!password.trim() && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          Password is required to encrypt this share link.
                        </p>
                      )}

                      {isPasswordMismatch && (
                        <p className="text-[11px] text-destructive font-medium flex items-center gap-1">
                          <AlertCircle className="size-3 shrink-0" />
                          Passwords do not match.
                        </p>
                      )}

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
                    This link exceeds the safe chat limit (2.5 KB) and may get truncated in chat apps. For large projects, please use the <strong className="underline cursor-pointer" onClick={() => switchTab('file')}>Team Handoff (.jsonlink)</strong> file instead.
                  </p>
                </div>
              )}
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
