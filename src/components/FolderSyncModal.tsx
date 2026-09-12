import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FolderSync,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HardDrive,
  Save,
  Unlink,
} from 'lucide-react';
import { isFileSystemAccessSupported } from '@/lib/fileSystem';

interface FolderSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string | null;
  fileCount: number;
  lastSyncedAt: Date | null;
  autoSync: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
  onSelectFolder: () => Promise<void>;
  onSyncToDisk: () => Promise<void>;
  onReloadFromDisk: () => Promise<void>;
  onDisconnectFolder: () => void;
  isSyncing: boolean;
}

export function FolderSyncModal({
  isOpen,
  onClose,
  folderName,
  fileCount,
  lastSyncedAt,
  autoSync,
  onToggleAutoSync,
  onSelectFolder,
  onSyncToDisk,
  onReloadFromDisk,
  onDisconnectFolder,
  isSyncing,
}: FolderSyncModalProps) {
  const isSupported = isFileSystemAccessSupported();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSync = async () => {
    try {
      await onSyncToDisk();
      setFeedback('Successfully saved all translation files directly to disk!');
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback('Failed to write files to disk. Please re-verify folder permissions.');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleReload = async () => {
    try {
      await onReloadFromDisk();
      setFeedback('Reloaded latest translation files from disk!');
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback('Failed to reload files. Please re-check directory access.');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <FolderSync className="size-4 text-emerald-500" />
            <span>Local Folder Direct Sync</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Connect a directory on your computer (e.g. <code className="font-mono text-primary text-[11px]">locales/</code> or <code className="font-mono text-primary text-[11px]">flutter-l10n/</code>) to read and save translation files directly to disk without downloading ZIPs.
          </DialogDescription>
        </DialogHeader>

        {!isSupported ? (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-4" />
              <span>Browser Compatibility Notice</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              The File System Access API is supported natively on <strong>Google Chrome, Microsoft Edge, Brave, and Opera</strong>. On Safari and Firefox, please use the standard Drag & Drop or Export modal to save your files.
            </p>
          </div>
        ) : !folderName ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
              <FolderOpen className="size-7" />
            </div>

            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-bold text-foreground">No Local Folder Linked</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose a project folder from your hard drive. JSON Link will read all existing language files and write your edits directly back to disk.
              </p>
            </div>

            <Button
              onClick={onSelectFolder}
              className="gap-2 text-xs font-semibold cursor-pointer shadow-xs"
            >
              <FolderOpen className="size-3.5" />
              <span>Choose Project Folder</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Folder Status Card */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <HardDrive className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground truncate font-mono">
                        📁 {folderName}
                      </span>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                        Connected
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {fileCount} locale file{fileCount === 1 ? '' : 's'} detected
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDisconnectFolder}
                  className="size-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                  title="Disconnect folder"
                >
                  <Unlink className="size-3.5" />
                </Button>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Last Synced to Disk:</span>
                <span className="font-mono text-foreground font-medium">
                  {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'Not synced yet'}
                </span>
              </div>
            </div>

            {/* Auto-Sync Toggle Option */}
            <div className="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-xs font-semibold text-foreground block">
                  Auto-sync changes to disk
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Automatically write to local files whenever cells are edited
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={e => onToggleAutoSync(e.target.checked)}
                className="size-4 rounded accent-primary cursor-pointer shrink-0"
              />
            </div>

            {/* Feedback Alert if any */}
            {feedback && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="size-3.5 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReload}
                disabled={isSyncing}
                className="gap-1.5 text-xs cursor-pointer"
                title="Pull latest disk changes into workspace"
              >
                <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Reload from Disk</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSelectFolder}
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  <FolderOpen className="size-3.5" />
                  <span>Switch Folder</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Save className="size-3.5" />
                  <span>{isSyncing ? 'Saving...' : 'Sync to Disk Now'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
