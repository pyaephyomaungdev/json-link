import React, { useState } from 'react';
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
import { Lock, Eye, EyeOff, AlertTriangle, KeyRound } from 'lucide-react';
import { decodeSharePayload, ShareProjectData } from '@/lib/shareUrl';
import { decryptProjectFile } from '@/lib/project';

interface UnlockShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareHash?: string | null;
  encryptedFileContent?: string | null;
  onUnlocked: (data: ShareProjectData) => void;
  onCancel: () => void;
}

export const UnlockShareDialog: React.FC<UnlockShareDialogProps> = ({
  open,
  onOpenChange,
  shareHash,
  encryptedFileContent,
  onUnlocked,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUnlock = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password.trim() || isDecrypting) return;

    setIsDecrypting(true);
    setErrorMessage(null);

    try {
      let data: ShareProjectData | null = null;
      if (encryptedFileContent) {
        const proj = await decryptProjectFile(encryptedFileContent, password.trim());
        data = {
          projectName: proj.name,
          languages: proj.languages,
          items: proj.items,
        };
      } else if (shareHash) {
        data = await decodeSharePayload(shareHash, password.trim());
      }

      if (data && data.items) {
        setIsDecrypting(false);
        setPassword('');
        onUnlocked(data);
      } else {
        setIsDecrypting(false);
        setErrorMessage('Failed to decrypt workspace data.');
      }
    } catch (err: any) {
      setIsDecrypting(false);
      if (err?.message === 'INCORRECT_PASSWORD') {
        setErrorMessage('Incorrect password. Please verify and try again.');
      } else {
        setErrorMessage('Failed to decrypt. Payload may be invalid or corrupted.');
      }
    }
  };

  const handleClose = () => {
    setPassword('');
    setErrorMessage(null);
    onOpenChange(false);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base text-foreground">
            {encryptedFileContent ? 'Encrypted Project File' : 'Password Protected Workspace'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {encryptedFileContent
              ? 'This .jsonlink project file is encrypted with client-side AES-256.'
              : 'This translation workspace is encrypted with client-side AES-256.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUnlock}>
          <DialogBody className="space-y-4 text-xs">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-primary" />
                Enter Decryption Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter workspace password..."
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="pr-10 text-xs h-9 bg-muted/20"
                  autoFocus
                  disabled={isDecrypting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>

              {errorMessage && (
                <p className="text-xs font-medium text-destructive mt-1.5 flex items-center gap-1">
                  <span>{errorMessage}</span>
                </p>
              )}
            </div>

            {/* Zero-Knowledge Disclaimer */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>No Recovery Mechanism</span>
              </div>
              <p className="leading-relaxed text-muted-foreground dark:text-amber-300/80">
                Passwords are never stored on any server. If the password is lost, this workspace cannot be decrypted or recovered.
              </p>
            </div>
          </DialogBody>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="text-xs h-8 cursor-pointer"
              disabled={isDecrypting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!password.trim() || isDecrypting}
              className="text-xs h-8 font-semibold shadow-xs cursor-pointer gap-1.5"
            >
              <Lock className="size-3.5" />
              {isDecrypting ? 'Decrypting...' : 'Unlock Workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
