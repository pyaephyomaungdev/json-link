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
import { BookMarked, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { GlossaryEntry, getStoredGlossary, saveStoredGlossary } from '@/lib/glossary';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (glossary: GlossaryEntry[]) => void;
}

export const GlossaryModal: React.FC<GlossaryModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [entries, setEntries] = useState<GlossaryEntry[]>(getStoredGlossary);
  const [newTerm, setNewTerm] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDoNotTranslate, setNewDoNotTranslate] = useState(false);
  const [newNote, setNewNote] = useState('');

  const handleAddEntry = () => {
    if (!newTerm.trim()) return;
    const item: GlossaryEntry = {
      id: Date.now().toString(),
      term: newTerm.trim(),
      target: newDoNotTranslate ? '' : newTarget.trim(),
      doNotTranslate: newDoNotTranslate,
      note: newNote.trim() || undefined,
    };
    const updated = [...entries, item];
    setEntries(updated);
    saveStoredGlossary(updated);
    if (onSave) onSave(updated);

    // Reset inputs
    setNewTerm('');
    setNewTarget('');
    setNewDoNotTranslate(false);
    setNewNote('');
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveStoredGlossary(updated);
    if (onSave) onSave(updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookMarked className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                AI Translation Glossary & Terminology
              </DialogTitle>
              <DialogDescription className="text-xs">
                Enforce project terminology rules so AI models never mistranslate brand names or standard terms.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Add New Term Form */}
        <div className="bg-muted/40 p-3 rounded-lg border border-border space-y-2 text-xs">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Plus className="size-3.5 text-primary" /> Add Terminology Rule
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-0.5">Source Term</label>
              <Input
                placeholder="e.g. KBZPay, Sign In"
                value={newTerm}
                onChange={e => setNewTerm(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-0.5">
                {newDoNotTranslate ? 'Behavior' : 'Target Translation'}
              </label>
              {newDoNotTranslate ? (
                <div className="h-8 px-2 rounded border border-border bg-background/50 flex items-center text-[11px] text-primary font-medium">
                  Keep original as-is (Do not translate)
                </div>
              ) : (
                <Input
                  placeholder="e.g. အကောင့်ဝင်ပါ"
                  value={newTarget}
                  onChange={e => setNewTarget(e.target.value)}
                  className="h-8 text-xs"
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-foreground">
              <input
                type="checkbox"
                checked={newDoNotTranslate}
                onChange={e => setNewDoNotTranslate(e.target.checked)}
                className="size-3.5 rounded border-input text-primary"
              />
              <span className="flex items-center gap-1">
                <ShieldAlert className="size-3 text-amber-600" />
                Never translate this term (Brand / Trademark)
              </span>
            </label>

            <Button
              type="button"
              size="sm"
              onClick={handleAddEntry}
              disabled={!newTerm.trim() || (!newDoNotTranslate && !newTarget.trim())}
              className="h-7 px-3 text-xs"
            >
              Add Rule
            </Button>
          </div>
        </div>

        {/* Existing Rules List */}
        <div className="space-y-1.5 py-1 text-xs">
          <div className="font-semibold text-foreground flex items-center justify-between">
            <span>Configured Rules ({entries.length})</span>
            {entries.length > 0 && (
              <span className="text-[11px] text-muted-foreground font-normal">
                Rules apply to all AI translation jobs
              </span>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-xs">
              No glossary rules configured yet. Add terms above to enforce consistency.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {entries.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-mono text-foreground">{entry.term}</span>
                      <span className="text-muted-foreground">➔</span>
                      {entry.doNotTranslate ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px]">
                          KEEP AS-IS
                        </span>
                      ) : (
                        <span className="font-medium text-primary">{entry.target}</span>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-[10px] text-muted-foreground">{entry.note}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1 sm:flex-none h-8 text-xs"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
