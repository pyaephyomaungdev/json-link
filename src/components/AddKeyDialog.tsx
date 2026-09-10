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

interface AddKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  languages: string[];
  onAddKey: (key: string, values: Record<string, string>) => void;
  existingKeys: string[];
}

export const AddKeyDialog: React.FC<AddKeyDialogProps> = ({
  open,
  onOpenChange,
  languages,
  onAddKey,
  existingKeys,
}) => {
  const [keyName, setKeyName] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setKeyName('');
      setValues({});
      setError(null);
    }
    onOpenChange(isOpen);
  };

  const handleValueChange = (lang: string, val: string) => {
    setValues(prev => ({ ...prev, [lang]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = keyName.trim();
    if (!trimmedKey) {
      setError('Key name cannot be empty.');
      return;
    }

    if (existingKeys.includes(trimmedKey)) {
      setError(`The key "${trimmedKey}" already exists in the translations.`);
      return;
    }

    onAddKey(trimmedKey, values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Translation Key</DialogTitle>
          <DialogDescription>
            Enter a unique key name (e.g. <code className="text-primary font-mono text-xs">btnSubmit</code> or <code className="text-primary font-mono text-xs">auth.login.title</code>) and its translations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Key Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={keyName}
                onChange={e => {
                  setKeyName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. actionConfirm, auth.welcome"
                className="font-mono text-xs"
                autoFocus
              />
              {error && <span className="text-xs text-destructive font-medium">{error}</span>}
            </div>

            <div className="border-t border-border pt-3 flex flex-col gap-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Initial Translations (Optional)
              </div>

              {languages.map(lang => (
                <div key={lang} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>{lang.toUpperCase()} Value:</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {lang === 'my' ? 'မြန်မာ' : lang === 'en' ? 'English' : lang}
                    </span>
                  </label>
                  <Input
                    value={values[lang] || ''}
                    onChange={e => handleValueChange(lang, e.target.value)}
                    placeholder={`Enter ${lang.toUpperCase()} text...`}
                    className={lang === 'my' ? 'font-sans' : ''}
                  />
                </div>
              ))}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="flex-1 sm:flex-none text-xs h-8 cursor-pointer">
              Add Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
