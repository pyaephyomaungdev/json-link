import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

export interface ConfirmDialogConfig {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'warning' | 'default';
  isAlert?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmDialogProps {
  config: ConfirmDialogConfig | null;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ config, onClose }) => {
  if (!config) return null;

  const {
    isOpen,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'destructive',
    isAlert = false,
    onConfirm,
    onCancel,
  } = config;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const renderIcon = () => {
    if (variant === 'destructive') {
      return (
        <div className="size-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
          <Trash2 className="size-4.5" />
        </div>
      );
    }
    if (variant === 'warning') {
      return (
        <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="size-4.5" />
        </div>
      );
    }
    return (
      <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Info className="size-4.5" />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleCancel()}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {renderIcon()}
            <div className="space-y-1 text-left flex-1">
              <DialogTitle className="text-base font-semibold text-foreground leading-snug">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3 sm:pt-4">
          {!isAlert && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex-1 sm:flex-none h-8 text-xs cursor-pointer"
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            size="sm"
            onClick={handleConfirm}
            className="flex-1 sm:flex-none h-8 text-xs font-medium cursor-pointer"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
