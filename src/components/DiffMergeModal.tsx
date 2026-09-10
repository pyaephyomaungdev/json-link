import React, { useState } from 'react';
import { TranslationItem } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  GitMerge,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export interface DiffResult {
  newKeys: TranslationItem[];
  modifiedKeys: {
    key: string;
    oldItem: TranslationItem;
    newItem: TranslationItem;
    changedLangs: string[];
  }[];
  unchangedCount: number;
  allIncomingLanguages: string[];
  incomingItems: TranslationItem[];
}

interface DiffMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  diff: DiffResult | null;
  onConfirmMerge: (mode: 'merge' | 'add-only' | 'replace') => void;
}

export const DiffMergeModal: React.FC<DiffMergeModalProps> = ({
  isOpen,
  onClose,
  diff,
  onConfirmMerge,
}) => {
  const [selectedTab, setSelectedTab] = useState<'new' | 'modified'>('new');

  if (!diff) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <GitMerge className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Import Comparison & Merge Preview
              </DialogTitle>
              <DialogDescription className="text-xs">
                Review differences between your current spreadsheet and the uploaded file.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Summary Stats Badges */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 my-2 text-xs">
          <div
            onClick={() => setSelectedTab('new')}
            className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-all ${
              selectedTab === 'new'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-border bg-muted/40 hover:bg-muted/70'
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs">
              <PlusCircle className="size-3.5 sm:size-4 shrink-0" />
              <span className="truncate">+{diff.newKeys.length} New</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 hidden xs:block">
              Keys not in current
            </p>
          </div>

          <div
            onClick={() => setSelectedTab('modified')}
            className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-all ${
              selectedTab === 'modified'
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-border bg-muted/40 hover:bg-muted/70'
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-1.5 font-semibold text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs">
              <RefreshCw className="size-3.5 sm:size-4 shrink-0" />
              <span className="truncate">~{diff.modifiedKeys.length} Modified</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 hidden xs:block">
              Altered translations
            </p>
          </div>

          <div className="p-2 sm:p-3 rounded-lg border border-border bg-muted/40">
            <div className="flex items-center gap-1 sm:gap-1.5 font-semibold text-muted-foreground text-[11px] sm:text-xs">
              <CheckCircle2 className="size-3.5 sm:size-4 text-primary shrink-0" />
              <span className="truncate">={diff.unchangedCount} Same</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 hidden xs:block">
              Identical in both
            </p>
          </div>
        </div>

        {/* Diff Details Inspector */}
        <div className="flex-1 min-h-0 flex flex-col border border-border rounded-lg overflow-hidden my-2">
          <div className="px-3 py-2 bg-muted/50 border-b border-border text-xs font-semibold flex items-center justify-between">
            <span>
              {selectedTab === 'new'
                ? `New Keys (${diff.newKeys.length})`
                : `Modified Translations (${diff.modifiedKeys.length})`}
            </span>
            <span className="text-[11px] text-muted-foreground font-normal">
              Languages: {diff.allIncomingLanguages.map(l => l.toUpperCase()).join(', ')}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-60 p-2 space-y-2 text-xs">
            {selectedTab === 'new' ? (
              diff.newKeys.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No new keys found in uploaded file.
                </div>
              ) : (
                diff.newKeys.map(item => (
                  <div
                    key={item.key}
                    className="p-2 rounded bg-background border border-border flex flex-col gap-1"
                  >
                    <div className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      + {item.key}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      {diff.allIncomingLanguages.map(lang => (
                        <div key={lang} className="truncate">
                          <span className="font-semibold uppercase">{lang}:</span>{' '}
                          {item[lang] || <em className="italic opacity-60">empty</em>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )
            ) : diff.modifiedKeys.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No modified translations found.
              </div>
            ) : (
              diff.modifiedKeys.map(({ key, oldItem, newItem, changedLangs }) => (
                <div
                  key={key}
                  className="p-2 rounded bg-background border border-border flex flex-col gap-1.5"
                >
                  <div className="font-mono font-semibold text-foreground flex items-center justify-between">
                    <span>~ {key}</span>
                    <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                      Modified: {changedLangs.map(l => l.toUpperCase()).join(', ')}
                    </span>
                  </div>

                  {changedLangs.map(l => (
                    <div key={l} className="text-[11px] grid grid-cols-2 gap-2 bg-muted/30 p-1.5 rounded">
                      <div>
                        <span className="font-semibold text-destructive">Current:</span>{' '}
                        <span className="line-through opacity-80">{oldItem[l] || '""'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-emerald-600">Incoming:</span>{' '}
                        <span>{newItem[l] || '""'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="gap-2 flex flex-wrap items-center justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
            Cancel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onConfirmMerge('add-only')}
            disabled={diff.newKeys.length === 0}
            className="text-xs h-8"
          >
            Add New (+{diff.newKeys.length})
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => onConfirmMerge('replace')}
            className="text-xs h-8"
          >
            Overwrite
          </Button>

          <Button
            size="sm"
            onClick={() => onConfirmMerge('merge')}
            className="gap-1.5 font-semibold text-xs shadow-xs h-8"
          >
            <GitMerge className="size-3.5" />
            <span>Merge & Update</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
