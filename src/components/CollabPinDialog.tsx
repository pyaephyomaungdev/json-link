import React, { useState, useEffect, useRef } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  KeyRound,
  Eye,
  EyeOff,
  Users,
  ShieldAlert,
  AlertCircle,
  Loader2,
  RotateCcw,
  Lock,
} from 'lucide-react';

export interface CollabPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  onJoin: (pin: string | null) => void;
  onCancel: () => void;
  errorMessage?: string | null;
  onClearError?: () => void;
  isConnecting?: boolean;
}

export const CollabPinDialog: React.FC<CollabPinDialogProps> = ({
  open,
  onOpenChange,
  roomId,
  onJoin,
  onCancel,
  errorMessage,
  onClearError,
  isConnecting = false,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tryAgainBtnRef = useRef<HTMLButtonElement>(null);

  const isPasswordRequired = Boolean(errorMessage?.toLowerCase().includes('password-protected'));
  const isAuthFailed = Boolean(errorMessage) && !isPasswordRequired;

  const prevRoomIdRef = useRef(roomId);
  useEffect(() => {
    if (open) {
      setPin('');
      setShowPin(false);
      if (!errorMessage || prevRoomIdRef.current !== roomId) {
        onClearError?.();
      }
      prevRoomIdRef.current = roomId;
      const timer = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
    prevRoomIdRef.current = roomId;
  }, [open, roomId, errorMessage, onClearError]);

  useEffect(() => {
    if (isAuthFailed && open) {
      const timer = setTimeout(() => tryAgainBtnRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    } else if (open && (!isConnecting || isPasswordRequired)) {
      const timer = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [isAuthFailed, isPasswordRequired, isConnecting, open]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onJoin(pin.trim() || null);
  };

  const handleClose = () => {
    setPin('');
    onOpenChange(false);
    onCancel();
  };

  const handleTryAgain = () => {
    setPin('');
    onClearError?.();
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md outline-none focus:outline-none focus-visible:outline-none ring-0">
        {isAuthFailed ? (
          /* View 1: Dedicated Authentication Failed Error Modal Screen */
          <div className="flex flex-col outline-none">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base text-destructive">
                <ShieldAlert className="size-4" />
                <span>Authentication Failed</span>
                {roomId && (
                  <Badge variant="secondary" className="font-mono text-[11px] px-1.5 py-0 lowercase">
                    {roomId}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Could not connect to live collaboration room.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4 py-4 text-xs">
              <div className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-2.5">
                <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                  <AlertCircle className="size-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    Incorrect Room PIN or Password
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border text-[11px] space-y-1">
                <p className="font-medium text-foreground">What to check:</p>
                <p className="text-muted-foreground leading-relaxed">
                  Please verify the PIN code with the room host. If this room is public (no password), leave the PIN field blank and try again.
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
              >
                Cancel
              </Button>
              <Button
                ref={tryAgainBtnRef}
                type="button"
                size="sm"
                onClick={handleTryAgain}
                className="text-xs h-8 font-semibold shadow-xs cursor-pointer gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                Try Again
              </Button>
            </DialogFooter>
          </div>
        ) : isConnecting && !isPasswordRequired ? (
          /* View 2: Dedicated Connecting Modal Screen */
          <div className="flex flex-col outline-none">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base text-foreground">
                <Users className="size-4 text-primary" />
                <span>Connecting to Room</span>
                {roomId && (
                  <Badge variant="secondary" className="font-mono text-[11px] px-1.5 py-0 lowercase">
                    {roomId}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Establishing encrypted peer-to-peer session.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4 py-6 text-xs">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Loader2 className="size-7 animate-spin text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    Connecting to Collaboration Session
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    Verifying room credentials and synchronizing translations with peers...
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                  <Lock className="size-3 text-emerald-500" />
                  <span>End-to-End Encrypted</span>
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="text-xs h-8 cursor-pointer"
              >
                Cancel
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* View 3: Dedicated Clean PIN Input Modal Screen */
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base text-foreground">
                <Users className="size-4 text-primary" />
                <span>Join Collaboration Room</span>
                {roomId && (
                  <Badge variant="secondary" className="font-mono text-[11px] px-1.5 py-0 lowercase">
                    {roomId}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                You are joining a peer-to-peer live collaboration session.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4 text-xs">
              {isPasswordRequired && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
                    <Lock className="size-3.5 shrink-0 text-amber-500" />
                    <span>Password Required</span>
                  </div>
                  <p className="leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                    {errorMessage}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="collab-pin-input"
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                >
                  <KeyRound className="size-3.5 text-primary" />
                  Room PIN / Password
                </label>
                <div className="relative">
                  <Input
                    id="collab-pin-input"
                    ref={inputRef}
                    type={showPin ? 'text' : 'password'}
                    placeholder="Enter room PIN or password..."
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    className="pr-10 text-xs h-9 bg-muted/20 font-mono tracking-wider"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(prev => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                    tabIndex={-1}
                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              {!isPasswordRequired && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-[11px] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Lock className="size-3.5 text-emerald-500 shrink-0" />
                    <span>End-to-End Encrypted Session</span>
                  </div>
                  <p className="leading-relaxed text-muted-foreground">
                    Enter the room PIN or password shared by the host to decrypt and join this session.
                  </p>
                </div>
              )}
            </DialogBody>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="text-xs h-8 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs h-8 font-semibold shadow-xs cursor-pointer gap-1.5"
              >
                <Users className="size-3.5" />
                Join Room
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
