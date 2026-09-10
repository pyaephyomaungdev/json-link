import React from 'react';
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

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {typeof description === 'string' ? description : title}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </DialogBody>

        <DialogFooter>
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
