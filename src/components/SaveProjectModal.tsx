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
import { Download, Check } from 'lucide-react';
import { TranslationItem } from '@/types';
import { exportProjectFile, saveLocalDraft } from '@/lib/project';

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

  React.useEffect(() => {
    if (defaultProjectName) {
      setProjectName(defaultProjectName);
    }
  }, [defaultProjectName, open]);

  const handleSave = () => {
    const filename = projectName.trim() || 'translations-backup';
    exportProjectFile(filename, items, languages);
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
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none text-xs h-8 cursor-pointer">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="flex-1 sm:flex-none gap-2 text-xs font-semibold shadow-xs h-8 cursor-pointer">
            {saved ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Download className="size-3.5" />
                <span>Save .jsonlink File</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
