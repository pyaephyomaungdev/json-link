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

interface AddLanguageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingLanguages: string[];
  onAddLanguage: (langCode: string) => void;
}

const COMMON_LANGUAGES = [
  { code: 'th', label: 'Thai (ภาษาไทย)' },
  { code: 'ja', label: 'Japanese (日本語)' },
  { code: 'zh', label: 'Chinese (中文)' },
  { code: 'ko', label: 'Korean (한국어)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'vi', label: 'Vietnamese (Tiếng Việt)' },
  { code: 'id', label: 'Indonesian (Bahasa Indonesia)' },
];

export const AddLanguageDialog: React.FC<AddLanguageDialogProps> = ({
  open,
  onOpenChange,
  existingLanguages,
  onAddLanguage,
}) => {
  const [langCode, setLangCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (code: string) => {
    const clean = code.trim().toLowerCase();
    if (!clean) {
      setError('Language code is required (e.g. th, ja, zh, es).');
      return;
    }

    if (existingLanguages.includes(clean)) {
      setError(`Language code "${clean}" is already added.`);
      return;
    }

    onAddLanguage(clean);
    setLangCode('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Language Column</DialogTitle>
          <DialogDescription>
            Add an additional language to translate side-by-side with your existing translations.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Language Code (ISO 639-1)
            </label>
            <div className="flex gap-2">
              <Input
                value={langCode}
                onChange={e => {
                  setLangCode(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. th, ja, zh, ko, es"
                className="font-mono text-sm uppercase"
                maxLength={8}
                autoFocus
              />
              <Button onClick={() => handleSubmit(langCode)}>Add</Button>
            </div>
            {error && <span className="text-xs text-destructive font-medium">{error}</span>}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <div className="text-xs font-semibold text-muted-foreground">
              Or pick from popular languages:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_LANGUAGES.filter(
                l => !existingLanguages.includes(l.code)
              ).map(l => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSubmit(l.code)}
                  className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-accent text-left text-xs transition-colors cursor-pointer"
                >
                  <span className="font-semibold">{l.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">
                    {l.code}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
