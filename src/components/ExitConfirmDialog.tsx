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
import { Download, ArrowLeft } from 'lucide-react';
import { TranslationItem } from '@/types';
import { exportProjectFile } from '@/lib/project';

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

  React.useEffect(() => {
    if (defaultProjectName) {
      setProjectName(defaultProjectName);
    }
    if (!open) {
      setIsProcessing(false);
    }
  }, [defaultProjectName, open]);

  const handleSaveAndExit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isProcessing) return;
    setIsProcessing(true);
    const filename = projectName.trim() || 'my-translations';
    exportProjectFile(filename, items, languages);
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
        </DialogBody>

        <DialogFooter className={`flex-col sm:flex-col gap-2 ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}>
          {/* Primary: Save and return home */}
          <Button
            onClick={handleSaveAndExit}
            disabled={isProcessing}
            className="w-full gap-2 font-semibold shadow-xs text-xs h-8 cursor-pointer"
          >
            <Download className="size-3.5" />
            {isProcessing ? 'Exiting...' : 'Save .jsonlink & Exit to Home'}
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
