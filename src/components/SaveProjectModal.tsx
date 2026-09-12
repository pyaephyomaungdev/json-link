import React, { useState, useMemo } from 'react';
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
import { Download, Check, Lock, Eye, EyeOff, AlertTriangle, AlertCircle } from 'lucide-react';
import { TranslationItem } from '@/types';
import { exportProjectFile, saveLocalDraft } from '@/lib/project';
import { evaluatePasswordStrength } from '@/lib/passwordStrength';

interface SaveProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: TranslationItem[];
  languages: string[];
  defaultProjectName?: string;
}

export const SaveProjectModal: React.FC<SaveProjectModalProps> = ({
  open,
  onOpenChange,
  items,
  languages,
  defaultProjectName,
}) => {
  const [projectName, setProjectName] = useState(defaultProjectName || 'translations-backup');
  const [saved, setSaved] = useState(false);
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isPasswordMismatch = enablePassword && Boolean(confirmPassword) && password !== confirmPassword;
  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password]);

  React.useEffect(() => {
    if (defaultProjectName) {
      setProjectName(defaultProjectName);
    }
    if (!open) {
      setEnablePassword(false);
      setPassword('');
      setConfirmPassword('');
    }
  }, [defaultProjectName, open]);

  const handleSave = async () => {
    if (enablePassword && (!password.trim() || password !== confirmPassword)) return;
    const filename = projectName.trim() || 'translations-backup';
    const effectivePw = enablePassword && password.trim() ? password.trim() : undefined;
    await exportProjectFile(filename, items, languages, effectivePw);
    saveLocalDraft(filename, items, languages);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onOpenChange(false);
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base text-foreground">
            Save Complete Project (.jsonlink)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Exports a standalone <code className="font-mono text-emerald-600 font-semibold">.jsonlink</code> file containing all keys, namespaces, and language translations. Re-upload anytime to continue working.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 text-xs">
          {/* Project Summary */}
          <div className="grid grid-cols-2 gap-2 my-1">
            <div className="p-3 rounded-lg bg-muted/40 border border-border flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Keys</span>
              <span className="text-sm font-bold font-mono text-foreground">{items.length.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Languages</span>
              <span className="text-sm font-bold font-mono text-foreground">{languages.length} ({languages.join(', ')})</span>
            </div>
          </div>

          {/* File Name Input */}
          <div className="flex flex-col gap-1.5 border-t border-border pt-3">
            <label className="text-xs font-semibold text-foreground">
              Project Name:
            </label>
            <div className="flex items-center gap-1.5">
              <Input
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="translations-backup"
                className="text-xs h-9 font-mono"
              />
              <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted px-2.5 py-2 rounded border border-border">
                .jsonlink
              </span>
            </div>
          </div>

          {/* Password Protection Section */}
          <div>
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
              <div className="space-y-2 pl-5.5 mt-2">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter backup encryption password..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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
                    placeholder="Confirm backup password..."
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
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
                    Password is required to encrypt this file.
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
                    Encrypted 100% in-browser using AES-GCM 256. Passwords are never stored on any server. If forgotten, this file cannot be unlocked or recovered.
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none text-xs h-8 cursor-pointer">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={enablePassword && (!password.trim() || password !== confirmPassword)}
            className="flex-1 sm:flex-none gap-2 text-xs font-semibold shadow-xs h-8 cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Download className="size-3.5" />
                <span>{enablePassword && password.trim() ? 'Save Encrypted .jsonlink' : 'Save .jsonlink File'}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
