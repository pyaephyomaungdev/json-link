import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, AlertTriangle, ArrowLeft } from 'lucide-react';
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

  React.useEffect(() => {
    if (defaultProjectName) {
      setProjectName(defaultProjectName);
    }
  }, [defaultProjectName, open]);

  const handleSaveAndExit = () => {
    const filename = projectName.trim() || 'my-translations';
    exportProjectFile(filename, items, languages);
    onOpenChange(false);
    onConfirmExit();
  };

  const handleDiscardAndExit = () => {
    onOpenChange(false);
    onConfirmExit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 mb-1">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle className="text-base text-foreground">
              Save Project Before Leaving?
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Would you like to save your translation data as a <span className="font-mono font-semibold text-primary">.jsonlink</span> project file before leaving? You can reload this file anytime to restore your complete spreadsheet.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-2">
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

        <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
          {/* Primary: Save and return home */}
          <Button
            onClick={handleSaveAndExit}
            className="w-full gap-2 font-semibold shadow-xs"
          >
            <Download className="size-4" />
            Save .jsonlink & Exit to Home
          </Button>

          <div className="flex items-center gap-2 w-full">
            {/* Secondary: Cancel and stay */}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-xs gap-1.5"
            >
              <ArrowLeft className="size-3.5" />
              Keep Editing
            </Button>

            {/* Danger: Discard without saving */}
            <Button
              variant="destructive"
              onClick={handleDiscardAndExit}
              className="flex-1 text-xs"
            >
              Discard & Exit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
