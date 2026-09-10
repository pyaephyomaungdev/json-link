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
import { Download, Save, Check } from 'lucide-react';
import { TranslationItem } from '@/types';
import { exportProjectFile, saveLocalDraft } from '@/lib/project';

interface SaveProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: TranslationItem[];
  languages: string[];
}

export const SaveProjectModal: React.FC<SaveProjectModalProps> = ({
  open,
  onOpenChange,
  items,
  languages,
}) => {
  const [projectName, setProjectName] = useState('translations-backup');
  const [saved, setSaved] = useState(false);

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
          <div className="flex items-center gap-2 text-primary mb-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Save className="size-5" />
            </div>
            <DialogTitle className="text-base text-foreground">
              Save Project (.jsonlink)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Save all current keys ({items.length.toLocaleString()}) and active languages ({languages.join(', ')}) into a portable <span className="font-mono font-semibold text-primary">.jsonlink</span> project file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-2">
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

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2 text-xs font-semibold shadow-xs">
            {saved ? (
              <>
                <Check className="size-4 text-emerald-400" />
                Saved!
              </>
            ) : (
              <>
                <Download className="size-4" />
                Save .jsonlink File
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
