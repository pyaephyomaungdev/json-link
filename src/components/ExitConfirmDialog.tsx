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
import { Checkbox } from '@/components/ui/checkbox';
import { Download, ArrowLeft, Lock, Eye, EyeOff, AlertTriangle, AlertCircle } from 'lucide-react';
import { TranslationItem } from '@/types';
import { exportProjectFile } from '@/lib/project';
import { evaluatePasswordStrength } from '@/lib/passwordStrength';

interface ExitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: TranslationItem[];
  languages: string[];
  onConfirmExit: () => void;
  defaultProjectName?: string;
}

export const ExitConfirmDialog: React.FC<ExitConfirmDialogProps> = ({
  open,
  onOpenChange,
  items,
  languages,
  onConfirmExit,
  defaultProjectName,
}) => {
  const [projectName, setProjectName] = useState(defaultProjectName || 'my-translations');
  const [isProcessing, setIsProcessing] = useState(false);
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
      setIsProcessing(false);
      setEnablePassword(false);
      setPassword('');
      setConfirmPassword('');
    }
  }, [defaultProjectName, open]);

  const handleSaveAndExit = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isProcessing) return;
    if (enablePassword && (!password.trim() || password !== confirmPassword)) return;
    setIsProcessing(true);
    const filename = projectName.trim() || 'my-translations';
    const effectivePw = enablePassword && password.trim() ? password.trim() : undefined;
    await exportProjectFile(filename, items, languages, effectivePw);
    onOpenChange(false);
    onConfirmExit();
  };

  const handleDiscardAndExit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isProcessing) return;
    setIsProcessing(true);
    onOpenChange(false);
    onConfirmExit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onCloseAutoFocus={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-base text-foreground">
            Save Project Before Leaving?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Would you like to save your translation data as a <span className="font-mono font-semibold text-primary">.jsonlink</span> project file before leaving? You can reload this file anytime to restore your complete spreadsheet.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Project File Name:
            </label>
            <div className="flex items-center gap-1.5">
              <Input
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="my-translations"
                className="text-xs h-9 font-mono"
              />
              <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted px-2 py-2 rounded border border-border">
                .jsonlink
              </span>
            </div>
          </div>

          {/* Password Protection Section */}
          <div className="border-t border-border pt-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-foreground">
                <Checkbox
                  checked={enablePassword}
                  onCheckedChange={(checked) => {
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
                    Encrypted 100% in-browser using AES-GCM 256. If forgotten, this file cannot be recovered.
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter className={`flex-col sm:flex-col gap-2 ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}>
          {/* Primary: Save and return home */}
          <Button
            onClick={handleSaveAndExit}
            disabled={isProcessing || (enablePassword && (!password.trim() || password !== confirmPassword))}
            className="w-full gap-2 font-semibold shadow-xs text-xs h-8 cursor-pointer"
          >
            <Download className="size-3.5" />
            {isProcessing
              ? 'Exiting...'
              : enablePassword && password.trim()
              ? 'Save Encrypted .jsonlink & Exit'
              : 'Save .jsonlink & Exit to Home'}
          </Button>

          <div className="flex items-center gap-2 w-full">
            {/* Secondary: Cancel and stay */}
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onOpenChange(false);
              }}
              className="flex-1 text-xs gap-1.5 h-8 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              Keep Editing
            </Button>

            {/* Danger: Discard without saving */}
            <Button
              variant="destructive"
              size="sm"
              disabled={isProcessing}
              onClick={handleDiscardAndExit}
              className="flex-1 text-xs h-8 cursor-pointer"
            >
              {isProcessing ? 'Discarding...' : 'Discard & Exit'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
